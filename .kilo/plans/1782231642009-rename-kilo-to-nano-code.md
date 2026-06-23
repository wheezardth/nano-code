# Rename "Kilo Code" → "Nano Code" in UI-visible Strings

## Rename Mapping

| Before | After |
|---|---|
| `"Kilo Code"` (product display name) | `"Nano Code"` |
| `"Kilo"` (standalone, prose) | `"Nano"` |
| `"Kilo Gateway"` (provider name) | `"Nano Gateway"` |
| Keywords `kilo`, `Kilo Code` in package.json | `nano`, `Nano Code` |

## Out of Scope (unchanged)

- **KiloClaw** — separate product (Telegram/Slack), leave unchanged
- **CLI binary name** (`kilo`) — not this package
- **Package name** (`"kilo-code"`) — internal identifier
- **Asset filenames** (`kilo-light.png`, etc.) — not strings
- **`.kilo/` config paths** — user data, not UI
- **`kilo import` CLI command** reference in i18n — CLI not renamed
- **Upstream `packages/opencode/` changes** — separate package

## Affected Packages

- `packages/kilo-vscode/` only (this package)

---

## Tasks (ordered, execute sequentially)

### 1. `package.json`

Update these strings:

```jsonc
"name": "kilo-code",                              // → leave (internal ID)
"displayName": "Kilo Code: ..." → "Nano Code: ..."  // ✅ change
"keywords": [...],                                // → "nano", "Nano Code"
"contributes.views/welcome/..."/title": "Kilo Code" → "Nano Code"
"contributes.commands/.../category": "Kilo Code" → "Nano Code"  (all ~40 commands)
"contributes.viewsWelcome/.../text": "Kilo Code" → "Nano Code"
"configuration/properties/kilo-code.kiloLogo.../description": "Kilo Code logo" → "Nano Code logo"
// Font path + asset filenames: leave unchanged (not UI strings)
```

### 2. `src/constants.ts`

```ts
export const EXTENSION_DISPLAY_NAME = "Kilo Code"  // → "Nano Code"
```

### 3. `src/review-utils.ts`

```ts
prefix = "Kilo"  // → "Nano"
```

### 4. `src/shared/provider-model.ts`

```ts
name: "Kilo Gateway"  // → "Nano Gateway"
```

### 5. `src/services/autocomplete/AutocompleteStatusBar.ts`

```ts
const SUPPORTED_PROVIDER_DISPLAY_NAME = "Kilo Gateway"  // → "Nano Gateway"
```

### 6. `src/services/autocomplete/i18n/en.ts` — 20 strings

Replace "Kilo Code" → "Nano Code" in all autocomplete i18n strings:
- `"kilocode:autocomplete.statusBar.tooltip.basic"`
- `"kilocode:autocomplete.statusBar.tooltip.disabled"`
- `"kilocode:autocomplete.toggleMessage"`
- `"kilocode:autocomplete.progress.title"`
- `"kilocode:autocomplete.input.title"`
- `"kilocode:autocomplete.commands.generateSuggestions"`
- `"kilocode:autocomplete.commands.category"`
- `"kilocode:autocomplete.codeAction.title"`
- `"kilocode:autocomplete.chatParticipant.fullName"`
- And all remaining autocomplete strings containing "Kilo Code"

### 7. `src/KiloProvider.ts` line 3544

```ts
title: "Kilo Code"  // → "Nano Code"
```

### 8. `src/agent-manager/run/task.ts` line 28

```ts
"Kilo Code"  // → "Nano Code"
```

### 9. `src/agent-manager/task-runner.ts` line 20

```ts
"Kilo Code"  // → "Nano Code"
```

### 10. `webview-ui/src/i18n/en.ts` — ~20 key strings

Every English i18n string containing "Kilo" or "Kilo Code" → replace with "Nano"/"Nano Code":
- `dialog.model.unpaid.freeModels.title`: "Free models provided by Kilo" → "Free models provided by Nano"
- `provider.connect.apiKey.description`: "...use {{provider}} models in Kilo." → "...in Nano."
- `provider.connect.oauth.*.suffix`: "...use {{provider}} models in Kilo." → "...in Nano."
- `speechToText.tooltip.start`: "...Kilo Gateway" → "...Nano Gateway"
- `speechToText.error.loginRequired`: "Sign in to Kilo..." → "Sign in to Nano..."
- `dialog.server.description`: "...Kilo server..." → "...Nano server..."
- `toast.update.description`: "...version of Kilo..." → "...version of Nano Code..."
- `error.page.report.prefix`: "...to the Kilo team" → "...to the Nano team"
- `error.chain.mcpFailed`: "Kilo does not support MCP authentication yet" → "Nano does not support..."
- `sidebar.gettingStarted.line1`: "Kilo includes free models..." → "Nano includes free models..."
- `app.name.desktop`: "Kilo Desktop" → "Nano Desktop"
- `settings.general.row.language/appearance/theme.description`: "...for Kilo" / "...how Kilo..." → "...for Nano" / "...how Nano..."
- `settings.updates.row.startup.description`: "...when Kilo launches" → "...when Nano Code launches"
- `settings.updates.toast.latest.description`: "...version of Kilo." → "...version of Nano Code."
- `settings.providers.betaNotice`: "...keeping Kilo open, no lock-in." → "...keeping Nano open, no lock-in."
- `workStyle.onboarding.welcome`: "Welcome to Kilo" → "Welcome to Nano"
- `workStyle.choice.human-in-the-loop.description`: "Kilo pauses..." → "Nano pauses..."
- `deviceAuth.title`: "Sign in to Kilo Code" → "Sign in to Nano Code"
- `profile.action.login`: "Login with Kilo Code" → "Login with Nano Code"
- `settings.indexing.*`: "Kilo model preset", "Kilo-hosted", "Kilo sign-in" → "Nano model preset", "Nano-hosted", "Nano sign-in"
- `settings.aboutKiloCode.*`: "About Kilo Code" → "About Nano Code" and all related "Kilo" references
- `session.messages.welcome`: "Kilo Code is an AI coding assistant..." → "Nano Code is an AI coding assistant..."
- `settings.language.description`: "...Kilo Code UI..." → "...Nano Code UI..."
- `settings.experimental.speechToText.description`: "...Kilo account through Kilo Gateway..." → "...Nano account through Nano Gateway..."
- `settings.models.speechToText.disabledDescription`: "...the Kilo provider...Kilo Gateway" → "...the Nano provider...Nano Gateway"
- `settings.models.speechToTextModel.description`: "Kilo Gateway transcription model" → "Nano Gateway transcription model"
- `settings.experimental.remote.description`: "...via Kilo Cloud..." → "...via Nano Cloud..."
- `settings.agentBehaviour.claudeCompat.description`: "...if you want Kilo to use..." → "...if you want Nano to use..."
- `settings.display.fontSize.description`: "...Kilo webview UI..." → "...Nano webview UI..."
- `settings.models.hidePromptTraining.description`: "...Kilo Gateway models..." → "...Nano Gateway models..."
- Migration strings: "Kilo Code" → "Nano Code"
- `workStyle.onboarding.welcome`: "Welcome to Kilo" → "Welcome to Nano"
- `settings.config.*` (source names): all ".kilo", ".kilocode" config source labels — **leave unchanged** (these are actual file path references, not product names)

### 11. All other `webview-ui/src/i18n/*.ts` translation files (20 files)

Apply same "Kilo" → "Nano" / "Kilo Code" → "Nano Code" / "Kilo Gateway" → "Nano Gateway" replacements in:
de, fr, es, it, pt, ru, uk, ja, ko, zh, zht, ar, da, no, pl, nl, tr, bs, th, br

Same keys, translated equivalent strings. For example in German:
- "Kilo" → "Nano"
- "Kilo Code" → "Nano Code"
- "Kilo Gateway" → "Nano Gateway"

### 12. `webview-ui/agent-manager/i18n/*.ts` (15 files)

Same replacement pattern in agent-manager i18n files:
en, de, fr, es, it, pt, ru, uk, ja, ko, zh, zht, ar, da, no, pl, nl, tr, bs, th

### 13. `webview-ui/src/stories/*.tsx` — Storybook stories

Replace "Kilo" → "Nano" in story data:
- `author: "Kilo"` → `author: "Nano"`
- `name: "Kilo"` → `name: "Nano"`
- `providerName: "Kilo"` → `providerName: "Nano"`
- `providerID: "kilo"` → **leave unchanged** (internal ID, not visible)
- Provider display names like `{ name: "Nano", providerID: "kilo" }`

### 14. `webview-ui/src/components/*` — Component-level strings

Replace "Kilo" references in:
- `WelcomeEmptyState.tsx`: `alt="Kilo Code"` → `alt="Nano Code"`
- `FeedbackDialog.tsx`: `alt="Kilo Code"` → `alt="Nano Code"`
- `MigrationWizard.tsx`: `alt="Kilo Code"` → `alt="Nano Code"`
- `IndexingTab.tsx`: `{ value: "kilo", label: "Kilo" }` → `{ value: "kilo", label: "Nano" }` (leave `value: "kilo"` as internal identifier)

### 15. `webview-ui/kiloclaw/i18n/*.ts` — **leave unchanged** (KiloClaw is out of scope)

### 16. `src/services/cli-backend/i18n/en.ts`

```ts
"remote.connected": "Kilo Remote: Connected" → "Nano Remote: Connected"
"remote.connecting": "Kilo Remote: Connecting..." → "Nano Remote: Connecting..."
```

### 17. `src/services/cli-backend/i18n/*.ts` — all non-English CLI i18n files

Same "Kilo" → "Nano" replacement in all CLI backend translation files:
da, de, es, fr, it, ja, ko, nl, no, pl, pt, ru, th, tr, uk, zh, zht, bs, ar

### 18. `README.md`

Replace all "Kilo" → "Nano" in visible text (not URLs, not badges):
- "Kilo is the all-in-one..." → "Nano is the all-in-one..."
- Bullet "Coming from Roo Code? Switch to Kilo..." → "Switch to Nano..."
- "Kilo can generate code..." → "Nano can generate code..."
- "Kilo can automate..." → "Nano can automate..."
- "Kilo can refactor..." → "Nano can refactor..."
- "Kilo can easily find..." → "Nano can easily find..."

### 19. `CHANGELOG.md`

Replace "Kilo" → "Nano Code" in all user-visible strings:
- Package name "kilo-code" → **leave unchanged** (this is the npm/VS Code package name)
- All "Kilo" in prose text → "Nano Code"

---

## Execution Notes

1. **Search-and-replace approach**: The most efficient path is a global find for `"Kilo"` and `"Kilo Code"` in each target file, then carefully replace only UI-visible strings (not internal IDs, not asset paths, not file names).

2. **`"Kilo Code"` is safest**: The two-word form has low ambiguity. Replace `"Kilo Code"` first across all files.

3. **`"Kilo"` (single word) requires judgment**: Context matters:
   - `"Kilo Gateway"` → "Nano Gateway" (provider name)
   - `"Kilo Code"` → "Nano Code" (always check for this first)
   - `"sign in to Kilo"` → "sign in to Nano"
   - `"welcome to Kilo"` → "welcome to Nano"
   - `.kilo` config / file names → leave
   - `"kilo import"` CLI command → leave
   - `value: "kilo"` → leave (identifier)
   - `"kilocode"` → leave (identifier)

4. **Translation parity**: After updating English i18n, non-English files need the same keys updated. Since all translation files copy the English key structure, the replacements are mechanical.

5. **After all changes**: Run `bun run compile` (typecheck + lint + build) and `bun run format` per AGENTS.md instructions.

6. **Files NOT touching**: KiloClaw `kiloclaw/i18n/*` files, any asset images, any file names, package.json `"name"` field, CLI package name.
