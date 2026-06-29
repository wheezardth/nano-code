# Fix 52 TypeScript errors after decloud cleanup

## Background

The `decloud` branch removed cloud-dependent server endpoints (kilo gateway, auth, profile, organization, notifications, remote control, session import, cloud session sync). The server's OpenAPI spec was regenerated, producing an SDK that no longer includes these endpoints. VS Code extension and opencode CLI code still calls the deleted SDK methods and references deleted types.

**Current error count:** 12 in `packages/opencode/` + 40 in `packages/kilo-vscode/` = 52 total

**Preconditions:**
- `bun install` has run (dependencies installed)
- `bun` at `/home/whiz/.bun/bin/bun`
- Node shim: `ln -sf /home/whiz/.bun/bin/bun /tmp/bin/node` (for `tsgo` which requires `/usr/bin/env node`)
- PATH includes `/tmp/bin` when running typecheck

---

## Task list

### 1. Fix `packages/opencode/src/kilocode/components/dialog-indexing.tsx` (11 errors)

**Problem:** SDK's `IndexingConfig["provider"]` (derived from `kilo-indexing/config`) only allows `"ollama" | "openai-compatible"`, but the dialog's data objects still contain cloud provider entries.

**Action:** In `PROVIDER_LABELS` (lines 41-51) remove: `kilo`, `openai`, `gemini`, `mistral`, `vercel-ai-gateway`, `bedrock`, `openrouter`, `voyage`. Keep `ollama` and `openai-compatible`.

**Action:** In `PROVIDER_FIELDS` (lines 56-80) remove corresponding entries for all 8 deleted provider types. Keep only `ollama` and `openai-compatible`.

**Action:** Fix comparisons with `"kilo"` at lines 172, 562, 571, 574, 639, 657 — these are unreachable branches (`"kilo"` has no overlap with `EmbeddingProvider`). Replace `"kilo"` comparisons with the next most local provider (`"ollama"` or `"openai-compatible"`) or remove the conditional entirely if it was cloud-specific.

**Action:** Remove unused imports: `kiloModelOptions`, `loadKiloEmbeddingModels`, `shouldDefaultIndexingToKilo` from `./indexing-dialog-state`.

### 2. Fix `packages/opencode/src/provider/provider.ts:1269` (1 error)

**Problem:** `@ts-expect-error` directive is now unused (type mismatch resolved).

**Action:** Remove the `// @ts-expect-error` comment.

### 3. Fix `packages/kilo-vscode/src/kilo-provider/handlers/auth.ts` (5 errors)

**Context:** Lines 62-64 (`handleLogin`), 108/113 (`handleSetOrganization`), 125/147 (`handleSetOrganization` fallback / `handleRefreshProfile`) call `client.kilo.profile()` and `client.kilo.organization.set()` — both deleted from the SDK.

**Action — Line 65** (`handleLogin`): After device auth succeeds, replace `const { data: profile } = await ctx.client.kilo.profile(undefined, { throwOnError: true })` with `const profile = null`. Keep the `ctx.postMessage({ type: "profileData", data: null })` and `ctx.postMessage({ type: "deviceAuthComplete" })` calls.

**Action — Line 108** (`handleSetOrganization`): Remove `await ctx.client.kilo.organization.set({ organizationId }, { throwOnError: true })`. Replace with a `console.log` message and early return — org switching is cloud-only.

**Action — Lines 113, 125** (`handleSetOrganization` fallback / profile refresh): Replace `await ctx.client.kilo.profile()` with `const result = { data: null }`.

**Action — Line 147** (`handleRefreshProfile`): Replace `await ctx.client.kilo.profile().catch(...)` with `const result = { data: null }`.

**No imports need changing** — `client` is typed as `KiloClient`, all `client.kilo.*` calls are on the deleted property. These become direct no-op assignments.

### 4. Fix `packages/kilo-vscode/src/services/RemoteStatusService.ts` (4 errors)

**Context:** `refresh()`, `toggle()`, `setEnabled()` call `client.remote.status()`/`enable()`/`disable()` — all deleted from SDK. The `toggleRemote` command is registered in extension.ts but has no cloud backend.

**Action — `refresh()` (line 52):** Replace `const res = await this.client.remote.status()...` with direct assignment: `this.update({ enabled: false, connected: false })`.

**Action — `toggle()` (line 63):** Remove `const { data } = await this.client.remote.status()...`. Set state to disabled and return: `this.update({ enabled: false, connected: false })`.

**Action — `setEnabled()` (lines 72-75):** Replace the `if/else` calling `remote.enable()`/`remote.disable()` with direct: `this.update({ enabled, connected: false })`. The local service can track the toggled state without the cloud endpoint.

**Action — `handleMessage()` (line 85):** Keep the `toggleRemote` message but let it call `toggle()` (now a no-op update). Keep other message handlers as-is.

**No additional changes needed** — the service is self-contained; the `toggleRemote` command in extension.ts will fire but do nothing harmful.

### 5. Fix `packages/kilo-vscode/src/provider-actions.ts` (4 errors)

**Lines 62-64:** Remove `client.kilo.authStatus()` from `fetchProviderData`. Replace the `kiloRequest` constant:

```typescript
const kiloRequest = Promise.resolve(null)
```

Remove any downstream references to `kiloAuth` that use it as a truthy value — it will always be `null` (no Kilo gateway auth). Keep the variable; it just resolves to `null`.

**Lines 74, 389:** These are `TS7006: Parameter implicitly has 'any' type` errors inside `response.all.map()`. These appear because `item` type inference is broken. The likely cause is a type cascade from elsewhere in the module. After the fix above (removing `client.kilo` from `fetchProviderData`), the `response` type should resolve correctly and `item` will be properly typed. No additional changes needed if the type resolves.

### 6. Fix `packages/kilo-vscode/src/services/autocomplete/classic-auto-complete/AutocompleteInlineCompletionProvider.ts` (1 error)

**Line 664:** `hasBalance()` calls `client.kilo.profile()` — no-op for local-first.

**Action:** Replace the method body:
```typescript
private async hasBalance(): Promise<boolean> {
  return true // local-first: no credit limits
}
```
The 402 circuit breaker will no longer probe the balance endpoint, which is correct for a no-signup tool.

### 7. Fix `packages/kilo-vscode/src/KiloProvider.ts` (10 errors)

**Lines 537-539** (`syncWebviewState`): Replace `const profileResult = await retry(() => this.client!.kilo.profile())` and `profileResult.data` with direct:
```typescript
const profileData: unknown = null
```
Keep the `postMessage({ type: "profileData", data: profileData })` call.

**Lines 1306** (`handleSSEConnected`): Replace `const profileResult = await sdkClient.kilo.profile()` with `const profileResult = { data: null }`. Keep the `postMessage` call.

**Line 2278-2281** (`kiloNotificationsFetch`): Replace `const { data: all } = await retry(() => this.client!.kilo.notifications(undefined, { throwOnError: true }))` with `const all = []`. Remove the `n => n.id` and `n => n.id` parameter annotations — they're on local variables inside the block.

**Lines 2863** (org switch fallback): Replace `await this.client!.kilo.profile()` — since org switch is cloud-only, skip the profile refresh entirely. Just continue to the provider/agent refresh block (lines 2868-2871).

**Lines 1268, 3057-3058**: Two `event.type === "kilo-sessions.remote-status-changed"` branches compare against an event type that doesn't exist in the `Event` union. TypeScript narrows the type to `never` in these branches, causing `event.properties` to be `never`.

**Action:** Delete both `if (event.type === "kilo-sessions.remote-status-changed")` blocks entirely (lines 1265-1273 and 3054-3060 in KiloProvider.ts). The remote status feature is cloud-only and the statusbar is handled by `RemoteStatusService` directly.

### 8. Delete `packages/kilo-vscode/src/legacy-migration/sessions/` (17 errors)

**Action:** Delete the entire directory:
```
packages/kilo-vscode/src/legacy-migration/sessions/
├── parser.ts
├── migrate.ts
├── lib/
│   ├── messages.ts
│   ├── project.ts
│   ├── session.ts
│   ├── parts/
│   │   ├── parts-builder.ts
│   │   ├── parts.ts
│   │   └── merge-tools.ts
```

**Action — extension.ts** (lines 314-318): The `// legacy-migration start/end` block — remove the import of `migrate` from the sessions migration module. This block currently imports and calls `migrate()` for cloud session import.

**Action — KiloProvider.ts** (lines 87-97, 334-342, 565-575): Remove migration-related code:
- Lines 87-97: `import { migrate }` and `checkAndShowMigrationWizard` references → remove import and the function call
- Lines 334-342: Remove `cachedMigrationData`, `migrationCheckInFlight`, `unsubscribeMigrationComplete` fields
- Lines 565-575: Remove the `legacy-migration` block that triggers the migration wizard
- Line 1082: `remoteService` reference near toggle — no change needed, that's the RemoteStatusService

**Note:** Keep `legacy-migration/sessions/migrate.ts` deleted. Any remaining `legacy-migration` comments in extension.ts/KiloProvider.ts that reference non-deleted files (like the `migrate` import) should be removed as part of this cleanup.

### 9. Fix `packages/kilo-vscode/src/kilo-provider/handlers/auth.ts` — type imports

No changes needed — `KiloClient` type and `getErrorMessage` import remain valid. Only method calls (`client.kilo.*`) are removed.

### 10. Fix `packages/kilo-vscode/src/legacy-migration/sessions/lib/` — type imports

No action needed — this entire directory will be deleted in step 8.

### 11. Verify with typecheck

Run:
```bash
export PATH="/tmp/bin:$PATH"
./node_modules/.bin/tsgo --noEmit -p packages/opencode/tsconfig.json   # expect 0 errors
./node_modules/.bin/tsgo --noEmit -p packages/kilo-vscode/tsconfig.json  # expect 0 errors
```

---

## Files affected

| File | Changes |
|---|---|
| `packages/opencode/src/kilocode/components/dialog-indexing.tsx` | Remove cloud provider entries, fix comparisons |
| `packages/opencode/src/provider/provider.ts` | Remove 1 `@ts-expect-error` comment |
| `packages/kilo-vscode/src/kilo-provider/handlers/auth.ts` | Replace 5 `client.kilo.*` calls with null/default values |
| `packages/kilo-vscode/src/services/RemoteStatusService.ts` | Replace 4 `client.remote.*` calls with direct state updates |
| `packages/kilo-vscode/src/provider-actions.ts` | Replace `client.kilo.authStatus()` with `Promise.resolve(null)` |
| `packages/kilo-vscode/src/services/autocomplete/.../AutocompleteInlineCompletionProvider.ts` | `hasBalance()` → return `true` |
| `packages/kilo-vscode/src/KiloProvider.ts` | Replace 5+ `client.kilo.*` calls with defaults; delete 2 dead event type checks |
| `package/kilo-vscode/src/legacy-migration/sessions/` — entire directory | **Delete** |
| `packages/kilo-vscode/src/extension.ts` | Remove migration import and invocation |
| `packages/kilo-vscode/src/KiloProvider.ts` | Remove migration state fields and wizard invocation |

---

## Risk assessment

- **Low risk**: All removed code paths reference deleted cloud endpoints. Stubs are straightforward no-ops. No behavioral regression expected in local-first mode.
- **Medium risk**: `provider-actions.ts` line 389 — the implicit `any` type may persist if the type cascade isn't fully resolved by removing only `kilo.authStatus`. If the type remains broken after removal, explicitly annotate the `item` parameter as `const response: ProviderListResult = await fetchProviderData(...)` at the call site.
- **Low risk**: Notification fetching removal — the webview handles empty notification arrays gracefully.
- **Migration impact**: Deleting `legacy-migration/sessions/` means no cloud session import path exists. This is irreversible and acceptable for the decloud branch.

## Validation checklist

- [ ] `tsgo` on `packages/opencode/`: 0 errors
- [ ] `tsgo` on `packages/kilo-vscode/`: 0 errors
- [ ] No stray `client.kilo.*`, `client.remote.*`, `client.kilocode.sessionImport.*` references remain in VS Code code
- [ ] No `"kilo"` comparisons remain in `dialog-indexing.tsx`
- [ ] All cloud provider entries removed from `PROVIDER_LABELS` and `PROVIDER_FIELDS`
- [ ] `legacy-migration/sessions/` directory fully deleted with no remaining imports
- [ ] `extension.ts` no longer imports or calls `migrate` from deleted sessions module
