import * as vscode from "vscode"

const FLAG = "kilo.autocomplete.defaultClearMigrationV1"

/**
 * One-time migration: clear `kilo-code.new.autocomplete.{provider,model}` when
 * they match the old hardcoded defaults. After gateway removal, provider/model
 * are resolved from user-configured providers, so clearing any stored value
 * lets the dropdown reflect the live configuration.
 */
export async function migrateDefaultAutocompleteSettings(context: vscode.ExtensionContext): Promise<void> {
  if (context.globalState.get<boolean>(FLAG)) return

  const config = vscode.workspace.getConfiguration("kilo-code.new.autocomplete")
  const provider = config.inspect<string>("provider")?.globalValue
  const model = config.inspect<string>("model")?.globalValue

  if (provider || model) {
    await config.update("provider", undefined, vscode.ConfigurationTarget.Global)
    await config.update("model", undefined, vscode.ConfigurationTarget.Global)
  }

  await context.globalState.update(FLAG, true)
}
