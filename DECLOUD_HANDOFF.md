# nano-code — decloud handoff

> Handoff for a fresh Claude Code session (running **inside WSL2**, repo at `/home/whiz/dev/nano-code`, branch `decloud`).
> Prepared by a prior session that ran on Windows and therefore **could not compile/test** anything. Treat all "done" items as verified-by-reading only until you run the toolchain.

---

## What this project is

`nano-code` is a fork of **kilo-code**, which itself wraps **opencode**. The goal of the `decloud` branch is to turn a cloud-tethered AI coding suite into a **local-first, no-phone-home** tool, with an eventual rebrand to "nano".

- Remote: `https://github.com/wheezardth/nano-code.git`
- Branch: `decloud` (was 9 commits ahead of `main`; latest decloud work is commit `0900a87280`)
- The branch is a deliberate **net-subtraction** effort ("evisceration" in the commit history).

### Architecture: how kilo wraps opencode (read this before editing the CLI)

Monorepo. opencode is vendored as `@opencode-ai/*` workspace libraries; kilo is the app layer on top.

| Package | Identity | Role |
|---|---|---|
| `packages/core` | `@opencode-ai/core` | opencode engine (provider, session, agent, plugin, permission, models-dev). **Kept near-pristine upstream** — only ~9 `kilocode_change` markers. |
| `packages/llm` | `@opencode-ai/llm` | provider/protocol implementations (see provider trim below) |
| `packages/ui` / `script` / `http-recorder` | `@opencode-ai/*` | other vendored opencode libs |
| `packages/opencode` | **`@kilocode/cli`** | the fork's CLI binary. **Heavily kilo-fied**: ~199 `kilocode_change` markers, 217 of 843 src files in a `kilocode/` sidecar. |
| `packages/kilo-vscode` | `nano-code` (VS Code ext, already renamed) | |
| `packages/kilo-jetbrains` | JetBrains plugin (Kotlin/Gradle) | |
| `packages/kilo-docs` | Next.js docs/marketing site | |

Customization happens three ways — these are your **map of everything kilo changed**:
1. **`kilocode/` sidecar** (`packages/opencode/src/kilocode/`, also `packages/core/src/kilocode/`) — additive kilo code: `patchAgents`, `patchModelsDevModel`, `kiloCustomLoaders`, kilo TUI, agents, suggestion/review/security, server httpapi.
2. **`// kilocode_change` inline markers** — surgical edits in upstream-derived files that import from the sidecar and call it at the patch point (e.g. `agent.ts` → `KiloAgent.patchAgents(...)`; `provider.ts` → `kiloCustomLoaders`; `request.ts` → `DEFAULT_HEADERS`).
3. **Path aliases** — `@/` → `packages/opencode/src` (the fork), `@opencode-ai/core` → vendored engine.

Implication: the engine stays close to upstream (rebaseable); nearly all kilo delta is in `@kilocode/cli`. Rebrand targets the kilo-owned surfaces, not `@opencode-ai/*`.

---

## Decisions already made by the maintainer

- **Keep all four surfaces:** CLI, VS Code extension, JetBrains plugin, docs site.
- **LLM providers → LOCAL-ONLY:** keep only `openai-compatible` + `ollama` + `lmstudio`. Remove all hosted providers (anthropic, openai-native, google, bedrock, azure, openrouter, xai, cloudflare, github-copilot, and the long tail: zai, moonshot, deepseek, mistral, groq, cerebras, etc.).
- **Remove kilo.ai attribution headers** injected into provider calls — done (see below).

---

## Done so far (committed @ `0900a87280`, NOT yet compiled/tested)

**VS Code cloud-session / remote-sync removal (full, ~18 files):**
- Deleted `cloud-session.ts` handler, `CloudSessionList.tsx`, `CloudImportDialog.tsx`, `cloud-session-handler.test.ts`.
- `KiloProvider.ts`: removed cloud-session imports, `openCloudSession()`, the `requestCloudSessions`/`requestCloudSessionData`/`importAndSend` message cases, `cloudSessionCtx`, and the now-orphaned `requestGitRemoteUrl`/`getGitRemoteUrl()`.
- `extension.ts`: removed cloud deep-link URI branch.
- `kilo-provider-utils.ts`: removed `mapCloudSessionMessageToWebviewMessage`; `cli-backend/types.ts`: removed `CloudSession*` types.
- Webview: `HistoryView.tsx` rewritten to **local-only** (tab bar + cloud panel gone); `session.tsx` lost the `cloudPreviewId` signal, both `handleCloudSession*` handlers, `selectCloudSession`, and the cloud-preview guard clauses in `sendMessage`/`sendCommand` (these were clean early-returns — normal send path untouched); protocol types removed from `extension-messages`/`webview-messages`/`sessions.ts`; `App.tsx` `openCloudSession` listener removed; story mocks updated.

**Provider attribution / gateway (opencode):**
- Removed kilo.ai headers from `DEFAULT_HEADERS` (`src/kilocode/const.ts`) and all 6 inline loader header sites in `src/provider/provider.ts` (openrouter, nvidia, vercel, zenmux, cerebras, kilo).
- Removed the `kilo` and `llmgateway` custom gateway loaders.

**Telemetry:**
- `kilo-docs`: removed PostHog entirely (deleted `instrumentation-client.ts`, removed `_app.tsx` pageview captures + import, `next.config.js` `/ingest` rewrites, `posthog-js` dependency).
- `kilo-jetbrains`: neutered telemetry egress — `KiloTelemetryService.send()` (frontend) and `KiloBackendTelemetry.capture()/setEnabled()` (backend) no longer emit off-device; deleted `KiloBackendTelemetryTest.kt` (it asserted the removed POST egress).
- Agent core: collapsed dead `experimental_telemetry: KiloAgent.telemetryOptions(cfg)` → `{ isEnabled: false }` and removed unused `telemetryOptions`.

### Key finding that reframes "local-only"
The hosted-provider **catalog is already empty**: `ModelsDev.Service.get()` returns `{}` ([packages/opencode/src/provider/models.ts](packages/opencode/src/provider/models.ts)) and `KILO_BUNDLED_PROVIDERS = []` — both gutted in the prior "Cleaned out cloud providers" commit. So nothing hosted is auto-listed; the tool is **already functionally BYO/local**. What remains for local-only is deleting the **latent implementation code** (footprint/cleanliness), not closing a functional cloud hole.

---

## Remaining work (priority order)

### 1. FIRST: verify the committed work
```bash
cd /home/whiz/dev/nano-code
bun install          # installs deps + runs postinstall (fix-node-pty native build)
bun run typecheck    # root: runs `bun turbo typecheck`
# kilo-vscode specifically (extension + webview were edited without a compiler):
bun --cwd packages/kilo-vscode run typecheck
```
The VS Code cloud-session removal touched ~18 interlocking files across the webview message protocol; a stray reference is the most likely surprise. A full reference-sweep came back clean, but that's not `tsc`.
Likely leftover: **dead i18n keys** `session.cloud.*`, `session.tab.cloud`, `session.history.sources` across the 21 locale files in `packages/kilo-vscode/webview-ui/src/i18n/` (left intentionally — harmless, but if there's a key-parity type constraint, remove them from *all* locales together).

### 2. Provider trim → local-only (the big one; `packages/llm` is heavily tested)
Keep: `openai-compatible`, `ollama`, `lmstudio` (note: ollama/lmstudio are openai-compatible endpoints, so the **openai chat protocol must stay**). Remove the rest.
- `packages/llm/src/providers/`: remove `anthropic.ts`, `amazon-bedrock.ts`, `azure.ts`, `cloudflare.ts`, `github-copilot.ts`, `google.ts`, `openrouter.ts`, `xai.ts`. Keep `openai*.ts`, `openai-compatible*.ts`.
- `packages/llm/src/protocols/`: remove `anthropic-messages`, `gemini`, `bedrock-*`. Keep `openai-chat`, `openai-compatible-chat`, `openai-responses`. **Verify the dependency graph first** — confirm openai-compatible doesn't import anything you're deleting.
- `packages/llm/src/providers/index.ts`: trim the registry exports.
- `packages/opencode/src/provider/provider.ts`: trim `SDK_LOADERS` (the `@ai-sdk/*` import map, ~line 120) and `CUSTOM_LOADERS` (anthropic/openai/xai/github-copilot/azure/amazon-bedrock/google-vertex/etc.) down to the local set.
- `packages/kilo-vscode/src/legacy-migration/provider-mapping.ts`: trim `PROVIDER_MAP`.
- Run `bun test` in `packages/llm` before and after; expect to delete/adjust golden-recording + transform tests for removed providers.

### 3. Triage remaining `kilocode/` cloud-ish subsystems
Decide keep/cut for `packages/opencode/src/kilocode/`: `suggestion/`, `console/`, `agent-manager/`, `daemon/`, `auth/`, and `kilo.ai` endpoints in `const.ts` / `installation/` / `server/httpapi/public.ts`.

### 4. nano rebrand (separate, large)
Root pkg `@kilocode/kilo` → nano; `@kilocode/cli`; READMEs (28 languages) + `logo.png`; `bin/kilodev`; `kilo.ai` doc URLs + `$schema` URLs in `config.ts`; `User-Agent: Kilo-Code/...`; the `kilocode/` namespace naming.

---

## Environment notes
- **Use WSL2 / Linux.** `flake.nix` only declares bun for linux/macos and `throw`s on Windows — Windows is unsupported by the project's own dev env.
- `packageManager: bun@1.3.14`. Node v22 already present in this WSL.
- Native module `@lydell/node-pty` + `fix-node-pty` postinstall — builds reliably on Linux.

## Gotchas
- **`packages/extensions/zed/LICENSE`** shows as modified and errored "Function not implemented" on the Windows/MSYS filesystem — likely a symlink that didn't materialize on Windows. It was **excluded** from the decloud commit. Check it in WSL where symlinks behave normally; revert if it's spurious.
- All "done" items above were edited **without a compiler**. Run typecheck/tests before trusting them.
