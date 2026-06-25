/**
 * Kilo Commands for TUI
 *
 * Provides /indexing command.
 */

import { useBindings } from "@tui/keymap"
import { useSync } from "@tui/context/sync"
import { useDialog } from "@tui/ui/dialog"
import { DialogIndexing } from "./components/dialog-indexing.js"
import { indexingEnabled } from "./indexing-feature"

// These types are OpenCode-internal and imported at runtime
type UseSDK = any

export function registerKiloCommands(useSDK: () => UseSDK) {
  const sync = useSync()
  const dialog = useDialog()

  useBindings(() => ({
    commands: [
      ...(indexingEnabled(sync.data.config)
        ? [
            {
              name: "kilo.indexing",
              title: "Indexing",
              desc: "Configure codebase indexing",
              category: "Kilo",
              slashName: "indexing",
              slashAliases: ["index", "embedding"],
              run: () => {
                dialog.replace(() => <DialogIndexing useSDK={useSDK} />)
              },
            },
          ]
        : []),
    ].map((command) => ({
      namespace: "palette",
      ...command,
    })),
  }))
}
