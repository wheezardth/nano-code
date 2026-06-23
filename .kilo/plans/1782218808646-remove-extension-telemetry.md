# Remove All Telemetry from VS Code Extension

## Goal
Remove all telemetry from this extension. Every transport, HTTP call, state sync, and postMessage goes away. The `TelemetryEventName` enum and related types stay as stubs (needed by webview imports). All `capture()` calls become no-ops or deleted.

## Step 1: Delete Files (7)

| Path | Reason |
|---|---|
| `tests/unit/agent-manager-telemetry.test.ts` | Tests for deleted `agent-manager/telemetry.ts` |
| `tests/unit/telemetry-proxy-utils.test.ts` | Tests for deleted proxy utility functions |
| `src/services/telemetry/telemetry-proxy-utils.ts` | Payload builder, auth header builder — unused |
| `src/services/telemetry/webview-state.ts` | `pushTelemetryState`, `watchTelemetryState` — not needed after removal |
| `src/services/telemetry/errors.ts` | Error classes never imported anywhere |
| `webview-ui/agent-manager/telemetry.ts` | Tracker/click/use helpers for Agent Manager webview — deleted |

## Step 2: Rewrite `src/services/telemetry/` as No-Op Stub

### `src/services/telemetry/types.ts`
**No changes.** Keep `TelemetryEventName` enum (98 lines) and `TelemetryPropertiesProvider` interface. Used by webview files.

### `src/services/telemetry/telemetry-proxy.ts` — Replace entire file:
```ts
import { TelemetryEventName, type TelemetryPropertiesProvider } from "./types"

/**
 * Stubbied out — telemetry removed from this extension.
 * All capture calls are no-ops. This file stays so imports resolve
 * and interface types remain compatible.
 */
export class TelemetryProxy {
  private static singleton: TelemetryProxy | undefined
  private constructor() {}
  static getInstance(): TelemetryProxy { return (TelemetryProxy.singleton ??= new TelemetryProxy()) }
  static capture(_event: TelemetryEventName, _properties?: Record<string, unknown>) {}
  capture(_event: TelemetryEventName, _properties?: Record<string, unknown>) {}
  configure(_url: string, _password: string) {}
  setProvider(_provider: TelemetryPropertiesProvider) {}
  setEnabled(_enabled: boolean) {}
  isVSCodeTelemetryEnabled(): boolean { return false }
  shutdown() {}
}
```

### `src/services/telemetry/index.ts` — Replace entire file:
```ts
export { TelemetryEventName, type TelemetryPropertiesProvider } from "./types"
export { TelemetryProxy } from "./telemetry-proxy"
```

## Step 3: Strip Call Sites — `src/`

### `src/extension.ts`
1. **Line 19**: Remove `TelemetryEventName` from import import
   ```
   - import { TelemetryEventName, TelemetryProxy } from "./services/telemetry"
   ```
2. **Line 48**: Remove entire line
   ```
   - const telemetry = TelemetryProxy.getInstance()
   ```
3. **Lines 76-83**: Remove entire `if (config) { ... }` block inside `onStateChange("connected")`
4. **Lines 100-104**: Remove entire `context.subscriptions.push(onDidChangeTelemetryEnabled(...))` block
5. **Lines 317-347**: Remove `track` helper function AND rewrite all 7 sidebarTitle commands to call command directly:
   - Replace `track("new_task", "kilo-code.new.plusButtonClicked")` with `void vscode.commands.executeCommand("kilo-code.new.plusButtonClicked")`
   - Same for all 7 sidebar title commands (plusButtonClicked, historyButtonClicked, agentManagerOpen, kiloClawOpen, marketplaceButtonClicked, profileButtonClicked, settingsButtonClicked
6. **Line 549**: Remove `TelemetryProxy.getInstance().shutdown()` from `deactivate()`

### `src/KiloProvider.ts`
1. **Lines 23-25**: Remove `TelemetryProxy` and `pushTelemetryState` from imports
2. **Line 282**: Remove `| TelemetryPropertiesProvider` from `implements`
3. **Line 362**: Remove `private telemetryStateDisposable...` field
4. **Line 402**: Remove `TelemetryProxy.getInstance().setProvider(this)`
5. **Lines 469-479**: Remove `getTelemetryProperties()` method entirely
6. **Lines 563**: Remove `pushTelemetryState((m) => this.postMessage(m))`
7. **Lines 799-800**: Remove `this.telemetryStateDisposable?.dispose()` and `this.telemetryStateDisposable = watchTelemetryState(...)` line
8. **Lines 1211-1213**: Remove `case "telemetry": TelemetryProxy.capture(...)` from message handler
9. **Line 3652**: Remove `this.telemetryStateDisposable?.dispose()`

### `src/MarketplacePanelProvider.ts`
1. Remove `TelemetryProxy` and `TelemetryEventName` imports
2. Remove the `if (msg.event) TelemetryProxy.capture(msg.event, msg.properties)` line

### `src/agent-manager/vscode-host.ts`
1. Remove `TelemetryProxy` and `TelemetryEventName` imports
2. Replace `capture` method body with no-op:
   ```ts
   capture(_event: string, _properties?: Record<string, unknown>): void {
     // Telemetry removed
   }
   ```

### `src/agent-manager/AgentManagerProvider.ts`
Remove entire `this.host.capture(...)` call (10 instances):
| Line range | Event |
|---|---|
| 190 | `"Agent Manager Opened"` |
| 482-486 | `"Agent Manager Session Stopped"` |
| 761-765 | `"Agent Manager Session Error"` |
| 808-812 | `"Agent Manager Session Error"` |
| 840-844 | `"Agent Manager Session Error"` |
| 984-989 | `"Agent Manager Session Started"` |
| 1120-1125 | `"Agent Manager Session Started"` |
| 1140-1146 | `"Agent Manager Session Error"` |
| 1162-1166 | `"Agent Manager Session Started"` |
| 1313-1319 | `"Agent Manager Session Started"` |

Replace callback references at lines 945 and 1768:
```ts
// Old:
capture: (event, props) => this.host.capture(event, props),
// New:
capture: () => {},
```

### `src/agent-manager/fork-session.ts`
1. Remove `TelemetryProxy` and `TelemetryEventName` imports
2. Remove `TelemetryProxy.capture(...)` call (lines 54-60) — keep the `getErrorMessage` + `postError` lines in the catch

### `src/agent-manager/tool-start.ts`
Remove `deps.capture("Agent Manager Session Started", {...})` calls (lines 137 and 184-190) — entire lines

### `src/agent-manager/continue-in-worktree.ts`
Remove `ctx.capture("Continue in Worktree", {...})` call (line 131)

### `src/services/autocomplete/AutocompleteServiceManager.ts`
1. Remove or reduce `TelemetryProxy` import (keep `TelemetryEventName` if used elsewhere for type annotations)
2. **Lines 132-147**: Remove `TelemetryProxy.capture(eventName, {...})` line inside `onSuggestion` callback — keep the `const eventName = ...` assignment and event variable
3. **Line 244**: Remove `TelemetryProxy.capture(TelemetryEventName.GHOST_SERVICE_DISABLED)`
4. **Line 311**: Remove `TelemetryProxy.capture(TelemetryEventName.INLINE_ASSIST_AUTO_TASK, {...})` line

### `src/services/autocomplete/classic-auto-complete/AutocompleteTelemetry.ts`
1. Remove `TelemetryProxy, TelemetryEventName` imports
2. Replace `captureEvent` method body (line 75-80) with:
   ```ts
   private captureEvent(_event: TelemetryEventName, _properties?: Record<string, unknown>): void {
     // Telemetry removed
   }
   ```
   (The method is called by all capture methods — must keep signature)

### `src/services/cli-backend/connection-service.ts`
Remove "Used by TelemetryProxy to POST events to the CLI server" from the `getServerConfig()` JSDoc (line 155)

## Step 4: Webview — Remove Telemetry Calls

### `webview-ui/agent-manager/AgentManagerApp.tsx`
Remove `import { tracker } from "./telemetry"` (line 140) — unused

### `webview-ui/agent-manager/NewWorktreeDialog.tsx`
Remove `import { tracker } from "./telemetry"` (line 37) — unused

### `webview-ui/src/context/feedback.tsx`
1. Remove `import { TelemetryEventName }` line
2. Remove `"telemetryState"` message handler branch (line 34) — keep the `return`
3. Lines 55-59: Remove `vscode.postMessage({ type: "telemetry", ... })` call inside `rate()` — keep local state update

### `webview-ui/src/context/work-style.tsx`
1. Remove `import { TelemetryEventName }` line
2. Lines 77-81: Remove `vscode.postMessage({ type: "telemetry", event: WORK_STYLE_SELECTED, ... })` — keep `vscode.postMessage({ type: "applyWorkStyle", ... })` line
3. Lines 96-99: Remove `vscode.postMessage({ type: "telemetry", event: WORK_STYLE_ONBOARDING_SHOWN, ... })`

### `webview-ui/src/components/marketplace/MarketplaceView.tsx`
1. Remove `import { TelemetryEventName }` line
2. **Lines 61-68**: Remove `telemetry(MARKETPLACE_ITEM_REMOVED, {...})` call — keep `fetchData()`
3. **Lines 84-86**: Remove entire `telemetry` helper function
4. **Line 89**: Remove `telemetry(MARKETPLACE_TAB_VIEWED)` in `onMount`
5. **Lines 92-97**: Remove `telemetry(MARKETPLACE_INSTALL_BUTTON_CLICKED, {...})` call — keep `dialog.show(...)` code
6. **Lines 103-111**: Remove `telemetry(MARKETPLACE_ITEM_INSTALLED, {...})` call — keep dialog.close() and fetchData()

### `webview-ui/src/components/chat/KiloNotifications.tsx`
1. Remove `import { TelemetryEventName }` line
2. Lines 81-85: Remove `vscode.postMessage({ type: "telemetry", event: NOTIFICATION_CLICKED, ... })` — keep `session.selectModel(...)` call

### `webview-ui/src/types/messages/webview-messages.ts`
1. Remove `TelemetryRequest` interface (lines 495-499)
2. Remove `| TelemetryRequest` from `WebviewMessage` union (line 1190)

### `webview-ui/src/types/messages/extension-messages.ts`
1. Remove `TelemetryStateMessage` interface (lines 871-874)
2. Remove `| TelemetryStateMessage` from `ExtensionMessage` union

## Step 5: Validation

1. `bun run typecheck` (from `packages/kilo-vscode/`)
2. `bun run lint` (from `packages/kilo-vscode/`)
3. `bun run knip` — verify no unused exports (keep stub exports)
4. `bun run test:unit` — verify remaining tests pass
5. `bun run compile` — production build succeeds
