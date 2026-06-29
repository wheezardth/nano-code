# Provider Trim — Final Cleanup & Commit

**Goal:** Resolve all remaining loose ends so the provider-trim diff is clean, compiles, and ready to commit.

**Background:** The `decloud` branch has already trimmed ~8,595 lines across 76 files in `packages/llm/` (providers, protocols, tests, fixtures) and `packages/opencode/` (SDK loaders, copilot plugin, native-request/runtime). Typecheck passes 14/14 packages. The remaining work is purely cosmetic cleanup of dead code references left behind by the trim.

**Preconditions (met):**
- `bun run typecheck` passes — 14/14 packages, fully cached
- `packages/llm` and `packages/opencode` typecheck clean (non-cached)
- `BUNDLED_PROVIDERS` trimmed to 4 entries: `@ai-sdk/openai`, `@ai-sdk/openai-compatible`, `gitlab-ai-provider`, `...KILO_BUNDLED_PROVIDERS`
- `git hub-copilot plugin` removed
- `packages/opencode/package.json` SDK deps trimmed
- Test failures observed are environmental (user's `~/.config/kilo/` config lacking expected `permission` entries, timing races) — not caused by these changes

---

## Task list

### 1. `packages/opencode/src/kilocode/provider-options.ts` — remove removed SDK type imports and result entries

This file currently has type imports from `@ai-sdk/alibaba`, `@ai-sdk/anthropic`, `@ai-sdk/mistral`, `@openrouter/ai-sdk-provider`. These packages are no longer in `packages/opencode/dependencies`.

**Change:** Remove all 4 removed imports and their 4 corresponding `result.xxx` entries, leaving only `openai` and `openaiCompatible`:

```ts
// REMOVE these imports entirely:
import type { AlibabaProviderOptions } from "@ai-sdk/alibaba"
import type { AnthropicProviderOptions } from "@ai-sdk/anthropic"
import type { MistralLanguageModelOptions } from "@ai-sdk/mistral"
import type { OpenRouterProviderOptions } from "@openrouter/ai-sdk-provider"

// REMOVE these result assignments:
result.openrouter = openrouter
result.anthropic = { thinking: { type: ... }, effort: ... }
result.alibaba = { enableThinking: ... }
result.mistral = { reasoningEffort: ... }

// KEEP these:
result.openai = { reasoningEffort: ..., textVerbosity: ..., store: false, forceReasoning: ... }
result.openaiCompatible = { reasoningEffort: ..., textVerbosity: ... }
```

The `options` parameter on `kiloProviderOptions()` is still kept (consumed by callers), but the function body shrinks to just the `openai` and `openaiCompatible` entries.

### 2. `packages/opencode/src/session/message-v2.ts` (lines 751–761) — remove dead npm checks in `supportsMediaInToolResult`

The media-support guard checks model npm packages that no longer exist:

**Remove these checks:**
- `if (model.api.npm === "@ai-sdk/anthropic") return true`
- `if (model.api.npm === "@ai-sdk/amazon-bedrock") return attachment.mime.startsWith("image/")`
- `if (model.api.npm === "@ai-sdk/xai") return attachment.mime.startsWith("image/")`
- `if (model.api.npm === "@ai-sdk/google-vertex/anthropic") return true`
- `if (model.api.npm === "@ai-sdk/google") { ... }`

**Replace the 11-line function with:**

```ts
const supportsMediaInToolResult = (attachment: { mime: string }) => {
  if (model.api.npm === "@ai-sdk/openai") return true
  // kilocode_change - all other provider checks removed in decloud (npm packages gone)
  return false
}
```

### 3. `packages/opencode/src/provider/provider.ts` — remove dead functions and loader entries

#### 3a. Remove `selectAzureLanguageModel()` (lines 143–149)

```ts
function selectAzureLanguageModel(sdk: any, modelID: string, useChat: boolean) {
  if (useChat && sdk.chat) return sdk.chat(modelID)
  if (sdk.responses) return sdk.responses(modelID)
  if (sdk.messages) return sdk.messages(modelID)
  if (sdk.chat) return sdk.chat(modelID)
  return sdk.languageModel(modelID)
}
```

Never called. Azure loader removed from `custom()` and `@ai-sdk/azure` removed from `BUNDLED_PROVIDERS`.

#### 3b. Remove google-vertex/anthropic baseURL block in `resolveSDK()` (lines 1074–1084)

```ts
// DELETE this entire if block:
if (
  model.providerID === "google-vertex" &&
  model.api.npm === "@ai-sdk/google-vertex/anthropic" &&
  !options.baseURL
) {
  const baseURL = googleVertexAnthropicBaseURL(
    typeof options.project === "string" ? options.project : undefined,
    typeof options.location === "string" ? options.location : undefined,
  )
  if (baseURL) options.baseURL = baseURL
}
```

#### 3c. Remove `googleVertexAnthropicBaseURL()` (lines 103–108)

Unreachable after 3b.

```ts
function googleVertexAnthropicBaseURL(project: string | undefined, location: string | undefined) {
  if (!project) return
  if (location !== "eu" && location !== "us") return
  return `https://aiplatform.${location}.rep.googleapis.com/v1/projects/${project}/locations/${location}/publishers/anthropic/models`
}
```

#### 3d. Remove dead entries from `custom()` loader map

Remove these entries from the `custom()` return object (lines 153–202):

- `anthropic` loader (lines 153–161) — no `@ai-sdk/anthropic` in `BUNDLED_PROVIDERS` anymore
- `nvidia` loader (lines 193–197) — no nvidia models configured, `@ai-sdk/nvidia` never existed
- `zenmux` loader (lines 198–202) — zenmux was removed

Keep these entries: `opencode`, `openai`, `gitlab`.

Mark removed entries with `// kilocode_change` on the removed block.

### 4. `packages/opencode/src/kilocode/provider/provider.ts` — clean up `patchCustomLoaderResult()`

This kilocode-sidecar function currently handles `openrouter`, `vercel`, `zenmux`, `cerebras`, and `azure` — all of which were removed in the trim. Replace:

```ts
export function patchCustomLoaderResult(
  _providerID: string,
  _result: { options?: Record<string, any> },
  _env: Record<string, string | undefined>,
) {
  // kilocode_change - all provider-specific header patches removed in decloud
}
```

Use underscore-prefixed parameters to acknowledge the function is kept as a public API but no longer uses its arguments.

### 5. `packages/opencode/src/session/llm/request.ts` (lines 159–160) — remove empty kilocode_change block

Replace:
```ts
  // kilocode_change start
  // kilocode_change end
```
with:
```ts
  // kilocode_change - github-copilot tool placeholder removed
```

### 6. `packages/opencode/src/kilocode/cli/cmd/tui/component/dialog-provider.tsx` (line 51)

Remove the orphan `"github-copilot": 1,` entry from `PROVIDER_PRIORITY`.

### 7. `packages/opencode/src/kilocode/provider/metadata.ts` — remove github-copilot entries

**Changes:**
- Line 14: Remove `"github-copilot": "settings.providers.note.copilot",` from `notes`
- Line 21: Remove `"github-copilot"` from `order` array (change to `["kilo", "anthropic", "deepseek", "openai", "google", "openrouter", "vercel"]`)
- Lines 27–30: Remove the `key()` function entirely. Inline into `providerMetadata()`:
  ```ts
  export function providerMetadata(id: string): ProviderMetadata {
    const name = id  // kilocode_change - github-copilot key-mapping removed
    const note = notes[name]
    return {
      noteKey: note,
      icon: icons.has(name as IconName) ? name : "synthetic",
      priority: priority.get(name),
    }
  }
  ```

### 8. Commit

Run:
```bash
cd /home/whiz/development/nano-code
git add -A
git commit -m "decloud: trim hosted providers to local-only (openai + openai-compatible)"
```

---

## Affected boundaries

| # | File | Shared upstream? | Impact |
|---|---|---|---|
| 1 | `kilocode/provider-options.ts` | No (kilocode-owned) | Compile-safe: type imports erased |
| 2 | `session/message-v2.ts` | Yes | Dead branches removed, no behavior change |
| 3a | `provider/provider.ts` — `selectAzureLanguageModel` | Yes | Dead function removed |
| 3b–c | `provider/provider.ts` — google-vertex block | Yes | Dead if-block removed |
| 3d | `provider/provider.ts` — `custom()` entries | Yes | 3 dead loader entries removed, marked with kilocode_change |
| 4 | `kilocode/provider/provider.ts` | No (kilocode-owned) | `patchCustomLoaderResult` simplified |
| 5 | `session/llm/request.ts` | Yes | Empty kilocode_change block cleaned |
| 6 | `dialog-provider.tsx` | No (kilocode-owned) | Single orphan line removed |
| 7 | `kilocode/provider/metadata.ts` | No (kilocode-owned) | Copilot entries removed |

## Risks and notes

- **All changes are dead-code removal only.** No runtime logic is affected. The upstream provider system still works the same way for any provider configured at runtime via `Npm.add()` + dynamic loader.
- **Merge compatibility:** The large `provider.ts` diff (~513 lines deleted) removes both upstream opencode code and kilocode additions. `kilocode_change` markers are present on removed custom-loader entries. The diff is almost entirely subtraction, making future upstream sync tractable.
- **Flaky tests are pre-existing:** The `permission-task` failures, `httpapi-event` timing race, and `session.persist workspace` timeout are environmental (user's `~/.config/kilo/` config, 250ms timeout, 5000ms workspace event), not caused by these trim changes.
