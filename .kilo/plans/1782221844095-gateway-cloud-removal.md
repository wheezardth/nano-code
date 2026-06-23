# Plan: Strip Kilo Gateway / Cloud — Custom-Provider-Only Mode

## Goal

Remove all Kilo Gateway, Kilo cloud, and built-in non-custom provider functionality from the VS Code extension. Keep: custom providers, OAuth, autocomplete (classic FIM + Next Edit), telemetry (no-op), MCP OAuth.

## Confirmed Decisions

- **Autocomplete:** Keep both classic FIM and Next Edit. Replace Gateway-preset models with local definitions wired to custom providers. Rewrite `MercuryEditProvider` to call a custom provider's `/chat/completions` directly.
- **Next Edit UI:** Keep all VSCode decoration logic (`NextEditSuggestionManager`, `editableRegion`, `pendingEdit`, etc.). Only `MercuryEditProvider` (the HTTP call layer) changes.
- **OAuth:** Keep MCP server OAuth. Remove Kilo Cloud device auth flow (`handleLogin`/`handleLogout`/`handleSetOrganization`).
- **Telemetry:** Keep `TelemetryProxy` as no-op.
- **CLI (`packages/opencode/`):** Out of scope — only modify `packages/kilo-vscode/`.

---

## Task List

### 1. Delete cloud auth handler

- **Delete:** `src/kilo-provider/handlers/auth.ts`
- Update `src/KiloProvider.ts` — remove all imports from this file

### 2. Delete cloud session handler

- **Delete:** `src/kilo-provider/handlers/cloud-session.ts`
- Update `src/KiloProvider.ts` — remove all imports from this file

### 3. Delete speech-to-text

- **Delete:** `src/speech-to-text/transcribe.ts`
- **Delete:** `src/speech-to-text/models.ts`
- **Delete:** `webview-ui/src/components/speech-to-text/` directory (4 files)

### 4. Rewrite Next Edit Gateway dependency

- **`src/services/autocomplete/next-edit/MercuryEditProvider.ts`**:
  - Replace `client.kilo.edit()` Gateway call with direct HTTP POST to `{baseURL}/chat/completions`
  - Add `baseUrl` and `apiKey` constructor params (replace `providerId`/`modelId` Gateway params)
  - Send editable region + diff history as part of the chat completion prompt (system + user messages)
  - Parse `.content` or `.text` from JSON response for replacement string

- **`src/services/autocomplete/next-edit/NextEditInlineCompletionProvider.ts`**:
  - Add `providerBaseUrl?: string`, `providerApiKey?: string` to `NextEditProviderDeps`
  - Wire these to `MercuryEditProvider` constructor

### 5. Replace Gateway autocomplete models

- **`src/shared/autocomplete-models.ts`**: Re-export of `@kilocode/kilo-gateway/autocomplete` → define `AUTOCOMPLETE_MODELS`, `DEFAULT_AUTOCOMPLETE_MODEL`, `getAutocompleteModel` locally. Only support "custom" provider. Keep same exported signatures.
- **`src/services/autocomplete/fim.ts`**: `hasValidCredentials()` / `canUseAutocomplete()` → check for configured custom provider with baseURL + apiKey instead of Gateway credentials. Keep `resolveFIMTokenConvention()`, `parseChunk()` as-is.
- **`src/services/autocomplete/AutocompleteServiceManager.ts`**: `readSettings()` default provider → use custom provider (not "kilo"). Wire provider URL/key to both Classic and NextEdit providers. Update `provideInlineCompletionItems` to use custom provider model list.

### 6. Prune KiloGateway imports from KiloProvider

**`src/KiloProvider.ts`** (3,640 lines):
- Remove `import { fetchKiloEmbeddingModelCatalog } from "@kilocode/kilo-gateway"`
- Remove `cloudSessionCtx` getter + all cloud session state fields (`cloudSessions`, `cloudSessionData`, `cloudSessionImportState`)
- Remove `fetchAndSendCloudSessions()`, `fetchAndSendCloudSessionData()`, `fetchAndSendProfile()`
- Remove `syncWebviewState()` profile fetch section
- Remove `selectKiloModel()` + `flushPendingKiloModel()`
- Remove imports from `handlers/auth.ts` and `handlers/cloud-session.ts` (tasks 1-2)
- In `handleWebviewMessage()` — remove case arms for: `"login"`, `"logout"`, `"setOrganization"`, `"refreshProfile"`, `"requestCloudSessions"`, `"cloudSessionData"`, `"importAndSendCloudSession"`, `"requestKiloEmbeddingModels"`
- Keep: `fetchAndSendProviders()`, `authorizeProviderOAuth` (for custom providers), session management, SSE, model selector
- Remove `loginAttempt` field, all Kilo Cloud auth state

### 7. Prune Gateway types

- **`src/services/cli-backend/types.ts`**: Remove `ProfileData`, `CliSessionSummary`, `CloudSessionData`, `EditorContext` types

### 8. Update provider actions

**`src/provider-actions.ts`**:
- `fetchProviderData()`: Remove `client.kilo.authStatus()` call (`kiloAuth`). Remove `authStates[KILO_PROVIDER_ID]` assignments.
- `disconnectProvider()`: Remove `{ type: "profileData", data: null }` for `providerID === "kilo"`.
- `computeDefaultSelection()`: Replace `{ ...KILO_AUTO }` fallback with custom provider default or throw.
- Keep: all custom provider functions, `resolveStoredKey()`, connect/disconnect/save custom provider.

### 9. Extension entry point

- **`src/extension.ts`**: Cloud session URI handler (line ~464) → stub with notification. Rest is generic — minimal changes.

### 10. Delete Profile UI

- **Delete:** `webview-ui/src/components/profile/` directory
- **Delete:** `webview-ui/src/stories/profile.stories.tsx`
- **Delete:** `webview-ui/src/types/messages/profile.ts`

### 11. Prune Profile Cloud Route from App

**`webview-ui/src/App.tsx`**:
- Remove `import ProfileView`, remove `"profile"` from `ViewType` and `VALID_VIEWS`
- Remove `<Match case="profile">` renderer block
- Remove profile button command routing in message handlers

### 12. Remove Cloud Tab from History

**`webview-ui/src/components/history/HistoryView.tsx`**:
- Remove "Cloud" tab, remove `cloudSessions` / cloud import state

### 13. Rewrite Providers Tab for Custom-Only

**`src/components/settings/ProvidersTab.tsx`** (544 lines):
- Remove built-in provider catalog grid (anthropic, openai, google, bedrock, etc.)
- Replace with a "Connect Provider" button opening `CustomProviderDialog`
- Keep "Discover providers" link for upstream docs

**`webview-ui/src/components/settings/ProviderConnectDialog.tsx`**:
- Keep OAuth for custom providers. Remove built-in provider OAuth/authorization flows.

**`webview-ui/src/components/settings/CustomProviderDialog.tsx`**: Keep as-is.

**`webview-ui/src/components/settings/provider-catalog.ts`**: Remove built-in provider list, keep search/filter.

### 14. Update Models Tab + Embedding Model Context

**`webview-ui/src/components/settings/ModelsTab.tsx`**: Remove embedding model selector and `fetchKiloEmbeddingModels`. Remove `provider.authStates()()` dependency.

**Delete:** `webview-ui/src/context/kilo-embedding-models.tsx`

### 15. Update Provider Context

**`webview-ui/src/context/provider.tsx`**: Remove `profileData`, `deviceAuthStarted/Complete/Failed` message handling. Remove `profile`/`deviceAuth*` signals. Keep provider connect/disconnect.

**`webview-ui/src/context/provider-utils.ts`**: Remove cloud session type utilities.

### 16. Prune Additional Message Types

- **`webview-ui/src/types/messages/webview-messages.ts`**: Remove `login` message, `cloudSessionId` on import messages, cloud session request messages.
- **`webview-ui/src/types/messages/extension-messages.ts`**: Remove `profileData`, `deviceAuthStarted/Complete/Failed`, `cloudSessionsLoaded`, `cloudSessionDataLoaded`, `cloudSessionImported`, `cloudSessionImportFailed`, `authMethods`.
- **`webview-ui/src/types/messages/connection.ts`**: Remove `DeviceAuthStatus`, `deviceAuth*` types.
- **`webview-ui/src/types/messages/sessions.ts`**: Remove cloud session types.
- **`webview-ui/src/types/messages/index.ts`**: Remove `export * from "./profile"`.

### 17. Update Settings Navigation

**`webview-ui/src/components/settings/Settings.tsx`**: Remove profile button from sidebar nav.

**`webview-ui/src/components/settings/AboutKiloCodeTab.tsx`**: Remove Kilo cloud/billing/dashboard references. Keep open-source version info.

### 18. Prune i18n Keys

Remove from every `webview-ui/src/i18n/*.ts` (20 files):
- `session.tab.cloud`, all `session.cloud.*` keys
- `profile.*` (profile.title, profile.notLoggedIn, profile.action.*, profile.balance.*, profile.personalAccount, profile.switchingAccount, profile.switchingOrganization)
- `deviceAuth.*`, all `cloudSession.*` keys
- `kilocode:autocomplete.authError.*` — remove or rephrase to "no custom provider configured"
- `speechToText.error.loginRequired`

### 19. Update package.json Settings

- `kilo-code.new.autocomplete.provider` enum: `["kilo", "mistral", "inception"]` → `["custom"]`
- `kilo-code.new.autocomplete.model` enum: Replace Gateway IDs with provider-configured pattern or free-text
- `kilo-code.new.model.providerID` default: Replace `"kilo"` → no default or custom provider ID
- `kilo-code.new.model.modelID` default: Replace `"kilo-auto/free"` → no default

---

## Validation Checklist

- `bun run typecheck` passes (no `@kilocode/kilo-gateway` import errors, no dangling types)
- `bun run lint` passes
- `bun run compile` succeeds
- Extensions loads: no profile route, no cloud session tabs, no login/logout buttons
- Custom provider config + model selection works end-to-end
- Classic autocomplete (FIM) works with a custom provider
- Next Edit autocomplete works with a custom provider
- No `"kilo"` provider appears in provider list or model selector
- No `"kilocode_change"` markers in any `packages/kilo-vscode/` files
- `bun run knip` passes (no unused exports)
