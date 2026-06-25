import type { Argv } from "yargs"
import * as Log from "@opencode-ai/core/util/log"
import { InstallationVersion } from "@opencode-ai/core/installation/version"
import { AppRuntime } from "@/effect/app-runtime"
import { Config } from "@/config/config"
import { InstanceRuntime } from "@/project/instance-runtime"
import { createHelpCommand } from "@/kilocode/help-command"
import { KiloConsoleCommand } from "@/kilocode/cli/cmd/console"
import { RollCallCommand } from "@/kilocode/cli/cmd/roll-call"
import { DevSetupCommand, DevAliasCommand } from "@/kilocode/cli/dev-setup"
import { ConfigCommand as ConfigCLICommand } from "@/cli/cmd/config"

const log = Log.create({ service: "kilocode.cli" })

// All Kilo-specific CLI customization lives here so the shared upstream entrypoint
// (src/index.ts) only needs a handful of thin call-sites behind kilocode_change markers.
// This keeps index.ts close to upstream and reduces merge conflicts on every sync.
export namespace KiloCli {
  // Register only the Kilo-specific commands. Upstream commands stay in index.ts's chain so
  // upstream merges that add or remove commands keep working without touching this file.
  export function register<T>(cli: Argv<T>): Argv<T> {
    cli
      .command(KiloConsoleCommand)
      .command(RollCallCommand)
      .command(ConfigCLICommand)
    if (InstallationVersion.includes("nightly")) cli.command(DevSetupCommand).command(DevAliasCommand)
    // Safe self-reference: `cli` is a typed parameter and yargs `.command()` returns the same
    // instance, so the help command can resolve the fully-built root at handler time. This also
    // sidesteps the self-referential type error the old inline registration hit in index.ts.
    cli.command(createHelpCommand(() => cli))
    return cli
  }

  // Runs from the upstream `.middleware`, before any command handler. Env tagging is additive so
  // it never has to modify upstream's own env assignments.
  export async function bootstrap(): Promise<void> {
    const feature = process.argv.includes("serve") ? "unknown" : "cli"
    process.env.KILO = "1"
    process.env["KILO_PLATFORM"] = feature
  }

  // Runs from the `finally` block on every exit path.
  export async function shutdown(): Promise<void> {
    const code = typeof process.exitCode === "number" ? process.exitCode : undefined
    log.info("kilo shutting down", { code })
    await InstanceRuntime.disposeAllInstances()
  }
}
