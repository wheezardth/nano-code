# Fix 25 TypeScript errors in kilo-console after decloud SDK regeneration

## Background

The `decloud` branch removed cloud endpoints (`/kilo/profile`, `/kilo/organization`). The SDK was regenerated without these endpoints, breaking `packages/kilo-console/` which still references deleted types (`KiloProfileResponse`) and methods (`sdk.kilo.*`).

**Error count:** 25 errors in 5 files

---

## Task list

### 1. Fix `src/client.ts` — remove cloud auth API (3 errors)

**Errors:** `client.ts:14` (missing `KiloProfileResponse` export), `client.ts:420,426` (`sdk.kilo.*` methods deleted)

**Action — remove import:** Delete line 14: `KiloProfileResponse,`

**Action — remove function exports (lines 418-452):**
Delete these 5 functions entirely:
- `loadKiloProfile()` (line 418) — calls `sdk.kilo.profile()`
- `setKiloOrganization()` (line 424) — calls `sdk.kilo.organization.set()`
- `logoutKilo()` (line 431) — calls `sdk.auth.remove({ providerID: "kilo" })`
- `startKiloLogin()` (line 438) — calls `sdk.provider.oauth.authorize({ providerID: "kilo" })`
- `completeKiloLogin()` (line 444) — calls `sdk.provider.oauth.callback({ providerID: "kilo" })`

**Action — remove type alias:** Delete line 46: `export type KiloProfileData = KiloProfileResponse`

No other file references these functions except the profile/login routes (deleted in step 2) and the index export. Check `src/index.tsx` for imports.

### 2. Delete cloud-auth route files (referenced by client.ts cloud functions)

**Action — delete files:**
```
packages/kilo-console/src/routes/profile/
├── ProfileRoute.tsx
├── LoginRoute.tsx
├── profile-utils.ts
├── profile-utils.test.ts
└── server.ts
```
(Note: `profile.css` remains — it may be imported by other code; remove only if it's no longer referenced)

**Action — update `src/index.tsx`:**
Delete the ProfileRoute and LoginRoute imports (lines 8-9) and route definitions (lines 30-31):
```typescript
// Remove:
import { ProfileRoute } from "./routes/profile/ProfileRoute"
import { LoginRoute } from "./routes/profile/LoginRoute"
// Remove:
<Route path="/profile" component={ProfileRoute} />
<Route path="/kilo/login" component={LoginRoute} />
```

### 3. Fix `src/routes/config/IndexingRoute.tsx` (14 errors)

**Errors:** `IndexingRoute.tsx:18-27,268,277,290,328,333` — provider values don't match `ProviderValue` type

**Action — trim `providers` array (lines 16-28):** Replace with only local providers:
```typescript
const providers = [
  { value: "", label: "Automatic" },
  { value: "ollama", label: "Ollama (local)" },
  { value: "openai-compatible", label: "OpenAI-compatible" },
] satisfies SelectOption<ProviderValue>[]
```

**Action — trim `fields` record (lines 35-55):** Replace with only local providers. The `kilo` entry must be removed since `"kilo"` is not a valid `Provider`:
```typescript
const fields: Record<Provider, Field[]> = {
  ollama: [{ key: "baseUrl", label: "Base URL", placeholder: "http://localhost:11434" }],
  "openai-compatible": [
    { key: "baseUrl", label: "Base URL", placeholder: "https://api.example.com/v1" },
    { key: "apiKey", label: "API key", placeholder: "sk-...", secret: true },
  ],
}
```

**Action — remove "Automatic" description (line 255):** The `provider === "kilo"` description:
Change `"Automatic uses Kilo when signed in, otherwise the provider runtime default."` to something neutral like `"Select the embedding provider."`

**Action — remove kilo model section (lines 274-338):** Remove ALL kilo-specific conditionals:
- Delete the model field's `"kilo"` comparison description (line 277) — replace with generic text
- Delete the `<Show when={provider() === "kilo"}>` fallback section (lines 289-308) — the fallback was the kilo model selector, which should disappear
- The fallback content should be a simple model text input (same as what non-kilo providers get)
- Change `disabled={... || provider() === "kilo"}` to just `disabled={false}` or remove the kilo comparison
- Delete the `<Show when={provider() === "kilo"}>` note (lines 333)

**Concrete template fix for the model section (lines 274-338):**
```tsx
<FieldCard
  label="Model"
  description="Leave empty to use the provider's default embedding model."
>
  <input
    value={view().model ?? ""}
    placeholder="Provider default"
    disabled={Boolean(ctx.saving())}
    onInput={(event) => text("model", event.currentTarget.value)}
  />
</FieldCard>
```

### 4. Fix `src/routes/config/state/indexing.ts` (1 error)

**Error:** `indexing.ts:45` — `provider === "kilo"` has no overlap with `"" | "ollama" | "openai-compatible" | undefined`

**Action:** Remove the `"kilo"` branch. Since `"kilo"` is no longer a valid provider, the model should always be `undefined` (same as non-kilo behavior):
```typescript
export function providerPatch(provider: IndexingConfig["provider"] | "", model?: string): IndexingConfig {
  return {
    provider: provider || undefined,
    model: undefined,
    dimension: undefined,
  }
}
```

Or if the `model` parameter is still useful for ollama/openai-compatible, pass it through. But the original intent was auto-assign the default model for kilo — if ollama/openai-compatible don't have a similar auto-model feature, `model: undefined` is correct.

### 5. Fix `src/routes/config/state/indexing.test.ts` (6 errors)

**Errors:** `indexing.test.ts:8,25,27,28,41,42` — tests use `"openai"` and `"kilo"` providers not in the type.

**Action — rewrite test data to use valid providers:**

For merge test (line 8), replace `"openai"` with `"ollama"`:
```typescript
expect(
  merge(
    { enabled: true, provider: "ollama", ollama: { baseUrl: "global" }, qdrant: { url: "http://global" } },
    { enabled: false, provider: "openai-compatible", qdrant: { apiKey: "project" } },
  ),
).toEqual({
  enabled: false,
  provider: "openai-compatible",
  ollama: { baseUrl: "global" },
  qdrant: { url: "http://global", apiKey: "project" },
})
```

For clean/removed test (lines 20-32), replace `"openai"` with `"ollama"` and `openai` key with `ollama`.

For providerPatch test (line 41), replace `"kilo"` with `"ollama"`:
```typescript
expect(providerPatch("ollama", "ignored")).toEqual({
  provider: "ollama",
  model: undefined,
  dimension: undefined,
})
expect(providerPatch("")).toEqual({ provider: undefined, model: undefined, dimension: undefined })
```

Remove the `"kilo"` test case from providerPatch (the one expecting `{ provider: "kilo", model: "default-embedding", ... }`) since `providerPatch` no longer special-cases `"kilo"`.

### 6. Fix `src/routes/profile/ProfileRoute.tsx` (1 error)

**Error:** `ProfileRoute.tsx:42` — implicit `any` on `find()` parameter

**Action:** This file is deleted in step 2. No separate action needed. If any file *outside* `src/routes/profile/` references it before deletion (e.g., the CSS import, the AppSidebar nav item), clean those too.

**Check for lingering references:**
- `AppSidebar.tsx:142` has `{ href: "/profile", label: "Profile", ... }` — remove this nav item
- `OmniSearch.tsx:80` adds `"Profile"` to search rows — remove this line
- `profile.css` — check if it's imported anywhere; remove import if not

---

## Files affected

| File | Action |
|---|---|
| `packages/kilo-console/src/client.ts` | Remove `KiloProfileResponse` import, `KiloProfileData` type, 5 cloud auth functions |
| `packages/kilo-console/src/routes/profile/ProfileRoute.tsx` | **Delete** |
| `packages/kilo-console/src/routes/profile/LoginRoute.tsx` | **Delete** |
| `packages/kilo-console/src/routes/profile/profile-utils.ts` | **Delete** |
| `packages/kilo-console/src/routes/profile/profile-utils.test.ts` | **Delete** |
| `packages/kilo-console/src/routes/profile/server.ts` | **Delete** |
| `packages/kilo-console/src/index.tsx` | Remove ProfileRoute/LoginRoute imports + 2 route definitions, AppSidebar nav item |
| `packages/kilo-console/src/routes/config/IndexingRoute.tsx` | Trim providers/fields to 2 local providers, remove kilo conditionals |
| `packages/kilo-console/src/routes/config/state/indexing.ts` | Remove `"kilo"` branch from `providerPatch` |
| `packages/kilo-console/src/routes/config/state/indexing.test.ts` | Rewrite to use `"ollama"` / `"openai-compatible"` |
| `packages/kilo-console/src/components/app-sidebar/AppSidebar.tsx` | Remove Profile nav item |
| `packages/kilo-console/src/components/app-header/OmniSearch.tsx` | Remove Profile search row |
| `packages/kilo-console/src/styles/profile.css` | Remove if no longer imported |

---

## Verification

Run:
```bash
cd packages/kilo-console && bun run typecheck
```
Expected: 0 errors.

Then verify the full project:
```bash
bun run typecheck
```
Expected: 0 errors (or at least no kilo-console errors).
