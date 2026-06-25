import { UI } from "@/cli/ui"
import type { NetworkOptions } from "@/cli/network"
import { errorMessage } from "@/util/error"
import { TuiConfig } from "@/cli/cmd/tui/config/tui"
import { validateSession } from "@/cli/cmd/tui/validate-session"
import { DaemonClient } from "@/kilocode/daemon/client"

type TuiInput = Parameters<typeof import("@/cli/cmd/tui/app").tui>[0]

type Args = NetworkOptions & {
  prompt?: string
  session?: string
  continue?: boolean
  agent?: string
  model?: string
  fork?: boolean
}

type Input = {
  args: Args
  cwd: string
  input: () => Promise<string | undefined>
  start: (input: TuiInput) => Promise<void>
}

async function session(input: Input, daemon: DaemonClient.Connection): Promise<{ ok: true; id?: string } | { ok: false }> {
  if (input.args.session) return { ok: true, id: input.args.session }
  return { ok: true }
}

export namespace KiloTuiThreadDaemon {
  export async function attach(input: Input) {
    const daemon = await DaemonClient.maybe()
    if (!daemon) return false

    const prompt = await input.input()
    const config = await TuiConfig.get()

    try {
      await validateSession({
        url: daemon.url,
        sessionID: input.args.session,
        directory: input.cwd,
        headers: daemon.headers,
      })
    } catch (error) {
      UI.error(errorMessage(error))
      process.exitCode = 1
      return true
    }

    const fork = await session(input, daemon)
    if (!fork.ok) return true

    await input.start({
      url: daemon.url,
      config,
      directory: input.cwd,
      headers: daemon.headers,
      args: {
        continue: input.args.continue,
        sessionID: fork.id,
        agent: input.args.agent,
        model: input.args.model,
        prompt,
        fork: input.args.fork,
      },
    })
    return true
  }
}
