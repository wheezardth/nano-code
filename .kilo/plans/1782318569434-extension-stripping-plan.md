# Extension Stripping Plan

Strips Kilo Gateway models from model selector, speech-to-text, popular providers, Marketplace, KiloClaw, and reduces indexing embedding providers.

---

## Task 1: Remove Kilo Gateway from ModelSelector dropdown

**Files:**
- `webview-ui/src/components/shared/model-selector-utils.ts` — remove `KILO_GATEWAY_ID` import/alias, remove `isSmall()`, remove `stripSubProviderPrefix()`, clean up `buildTriggerLabel()` to drop gateway-specific logic, remove re-export of `KILO_GATEWAY_ID` and `PROVIDER_ORDER` (PROVIDER_ORDER is exported and no longer used if gateway is gone)
- `webview-ui/src/components/shared/ModelSelector.tsx:35-45` — remove `KILO_GATEWAY_ID` import, remove `KILO_GATEWAY_ID` from `visibleModels` filter (line 212: `m.providerID === KILO_GATEWAY_ID || c.includes(m.providerID)` → just `c.includes(m.providerID)`)
- `webview-ui/src/components/shared/ModelSelector.tsx:117-118` — remove `includeAutoSmall` prop and related logic (lines 206-213, since kilo-auto/small is a gateway model)
- `webview-ui/src/context/provider.tsx:13` — keep `KILO_AUTO` for default selection (needed for non-gateway fallback)
- Tests that reference `isSmall` or `KILO_GATEWAY_ID` in model-selector-utils

## Task 2: Remove Speech-to-Text entirely

**Files to delete:**
- `src/speech-to-text/models.ts` — model definitions
- `src/speech-to-text/handler.ts` — backend handler
- `webview-ui/src/components/speech-to-text/` — directory (SpeechToTextButton.tsx, useSpeechToText.ts, model-selector.ts, availability.ts)
- `package.json` lines with `speechToText` entries in `contributes.menus`, `contributes.commands`, `menus` (search and remove)

**Files to edit:**
- `webview-ui/src/components/settings/ModelsTab.tsx` — remove lines 13-15 (s2t imports), remove lines 182-218 (s2t SettingsRow block)
- `webview-ui/src/services/input-tools.ts` — remove speech-to-text message handlers (lines handling `speechToTextStart/Stop/Cancel`)
- Remove all `speechToText` i18n keys from all `webview-ui/src/i18n/*.ts` files (search for `speechToText` and remove)

## Task 3: Remove Popular Providers section from ProvidersTab

**Files to edit:**
- `webview-ui/src/components/settings/ProvidersTab.tsx` — remove popular providers section (lines 201-255), remove imports of `isPopularProvider`, `popularProviderIndex`, `sortProviders` from provider-catalog, remove `popularProviders` memo (lines 39-49), remove `KILO_PROVIDER_ID` filter from `connectedProviders` (line 34)
- `webview-ui/src/components/settings/provider-catalog.ts` — remove `isPopularProvider()` and `popularProviderIndex()`, remove fallback set and PROVIDER_PRIORITY import; keep `providerIcon`, `providerNoteKey`, `sortProviders`, `validIcon` as they may still be used. Remove PROVIDER_PRIORITY from `src/shared/provider-model.ts` if no longer referenced.
- `package.json` — remove `"dialog.model.unpaid.addMore.title"` i18n key if only used for popular providers promo

## Task 4: Remove Marketplace entirely

**Files to delete:**
- `src/MarketplacePanelProvider.ts`
- `src/services/marketplace/` — entire directory (index.ts, actions.ts, installer.ts, api.ts, types.ts, detection.ts, paths.ts)
- `webview-ui/marketplace/` — entire directory (index.tsx, MarketplaceApp.tsx)
- `webview-ui/src/components/marketplace/` — entire directory
- `webview-ui/src/types/marketplace.ts`
- `webview-ui/src/context/marketplace-session.tsx`
- `webview-ui/src/stories/marketplace.stories.tsx`
- `webview-ui/src/stories/shell.stories.tsx` — remove `"marketplace"` from `view` union on line 308
- `webview-ui/src/types/messages/webview-messages.ts` — remove `OpenMarketplacePanelRequest` interface, remove marketplace imports
- `webview-ui/src/types/messages/extension-messages.ts` — remove `"marketplace"` from `view` union on line 308, remove `marketplaceData`, `marketplaceInstallResult`, `marketplaceRemoveResult` messages, remove marketplace type imports
- `src/kilo-provider/remove-config-item.ts` — remove marketplace imports and logic
- `tests/unit/marketplace-panel-arch.test.ts`
- `tests/unit/marketplace-actions.test.ts`
- `tests/unit/marketplace-installer.test.ts`

**Files to edit:**
- `src/extension.ts` — remove `MarketplacePanelProvider` import, remove `marketplacePanelProvider` instantiation, remove `marketplaceButtonClicked` command registration and serializer, remove `kilo-code.new.marketplaceButtonClicked` command and `kilo-code.new.sidebarTitle.marketplaceButtonClicked`
- `esbuild.js` — remove marketplace build context (line 213, 244, 256)
- `package.json` — remove `"kilo-code.new.marketplaceButtonClicked"` command entry (line 121), remove sidebar toolbar button entries (lines 160, 456, 490), remove `"marketplace"` from views if registered as a view
- Remove all `marketplace` i18n keys from all `webview-ui/src/i18n/*.ts` files

## Task 5: Remove KiloClaw entirely

**Files to delete:**
- `src/kiloclaw/` — entire directory (KiloClawProvider.ts, kilo-chat-client.ts, ulid.ts, types.ts, event-service-client.ts, token-manager.ts)
- `webview-ui/kiloclaw/` — entire directory

**Files to edit:**
- `src/extension.ts` — remove `KiloClawProvider` import, remove kiloClawProvider instantiation (line 126-127), remove serializer registration (lines 186-193), remove `kiloClawOpen` command (lines 306-308, 329-331)
- `webview-ui/src/types/messages/extension-messages.ts:308` — remove `"kiloClaw"` if in view union (already removed via marketplace cleanup above if they shared one union)
- `esbuild.js` — remove kiloclaw build context (lines 210, 243, 255)
- `package.json` — remove `"kilo-code.new.kiloClawOpen"` command entry (line 115), remove sidebar toolbar entries (lines 155, 452, 485)

## Task 6: Restrict Indexing Embedding Provider dropdown

**Files to edit:**
- `webview-ui/src/components/settings/IndexingTab.tsx` — reduce `allProviders` array to only `{ value: "openai-compatible", label: "OpenAI-Compatible" }`, `{ value: "ollama", label: "Ollama (local)" }`. Remove `kilo`, `openai`, `gemini`, `mistral`, `vercel-ai-gateway`, `bedrock`, `openrouter`, `voyage` from the list.
- Update `providerFields()` function to only handle `openai-compatible`, `ollama` (remove all other cases including `openai`)
- Remove `kilo`-related logic: `kiloAvailable`, `kiloDefault`, `kiloModels`, `knownKiloModel`, `kiloValue`, `staleKiloModel`, the Kilo-specific SettingsRows, `KILO_PROVIDER_ID` import (if no longer needed after nano removal)

---

## Cross-cutting cleanup

1. **i18n files** (`webview-ui/src/i18n/*.ts`): Remove all keys referencing `kiloClaw`, `marketplace`, `speechToText`, and `settings.providers.note.kilo`
2. **kilo-ui package**: Remove `kiloclaw` icon from icon registry if exists
3. **Storybook**: Remove any stories referencing removed features
4. **package.json**: Clean up any remaining references to removed commands/views in `views`/`menus` sections

---

## Validation

After all changes:
- Run `bun run compile` from `packages/kilo-vscode/` — should typecheck and build cleanly
- Run `bun run lint` from `packages/kilo-vscode/` — no lint errors
- Run `bun run test:unit` — all remaining tests pass
- Verify ModelSelector shows only connected provider models (no Kilo Gateway group)
- Verify Indexing tab provider dropdown shows only 3 options
- Verify Settings UI has no speech-to-text section, no popular providers section
- Verify Marketplace and KiloClaw menu items/commands are gone from VS Code

---

## Execution order

1. Delete the two self-contained feature directories: `src/kiloclaw/`, `webview-ui/kiloclaw/`, `webview-ui/marketplace/`, `webview-ui/src/components/marketplace/`, `src/services/marketplace/`, `webview-ui/src/types/marketplace.ts`, `webview-ui/src/context/marketplace-session.tsx`
2. Edit `esbuild.js` — remove kiloclaw and marketplace build contexts
3. Edit `src/extension.ts` — remove kiloclaw/marketplace provider instantiation, commands, serializers
4. Edit `src/kilo-provider/remove-config-item.ts` — remove marketplace imports/logic
5. Edit `src/speech-to-text/handler.ts` and `src/services/input-tools.ts` — remove s2t handlers (or delete `speech-to-text/`)
6. Edit Settings components: `IndexingTab.tsx`, `ProvidersTab.tsx`, `ModelsTab.tsx`
7. Edit `model-selector-utils.ts` and `ModelSelector.tsx` — remove KILO_GATEWAY_ID
8. Clean up `provider-catalog.ts`, `provider-model.ts` — remove unused exports
9. Edit message type files — remove marketplace/s2t types
10. Edit `package.json` — remove all kiloclaw/marketplace/s2t entries
11. Clean up i18n files across all languages
12. Remove test files that tested deleted functionality
13. Run compile + typecheck + tests
