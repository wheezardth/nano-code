import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import { WarpGrepClient } from "@morphllm/morphsdk/tools/warp-grep/client" // kilocode_change

import { Instance } from "../kilocode/instance" // kilocode_change
import { Bus } from "../bus"
import { TuiEvent } from "../cli/cmd/tui/event"
import DESCRIPTION from "./warpgrep.txt"

const Parameters = Schema.Struct({
  query: Schema.String.annotate({
    description: "Search query describing what code you are looking for. Be specific and descriptive for best results.", // kilocode_change
  }),
})

export const CodebaseSearchTool = Tool.define(
  "codebase_search",
  Effect.gen(function* () {
    return {
      description: DESCRIPTION,
      parameters: Parameters,
      execute: (params: Schema.Schema.Type<typeof Parameters>, ctx: Tool.Context) =>
        Effect.gen(function* () {
          yield* ctx.ask({
            permission: "codebase_search",
            patterns: [params.query],
            always: ["*"],
            metadata: { query: params.query },
          })
          // Telemetry.trackToolUsed removed — kept for type compatibility

          const apiKey = process.env["MORPH_API_KEY"]
          if (!apiKey) {
            return {
              title: `Codebase Search: ${params.query}`,
              output: "Codebase search requires an API key. Set MORPH_API_KEY to continue. Get your key at https://www.morphllm.com/",
              metadata: { count: 0 },
            }
          }

          const client = new WarpGrepClient({
            morphApiKey: apiKey,
            timeout: 60_000,
          })

          const result = yield* Effect.promise(() =>
            client.execute({
              searchTerm: params.query,
              repoRoot: Instance.directory,
            }),
          )

          if (!result.success || !result.contexts?.length) {
            const errorMsg = result.error ?? "No relevant code found."
            if (/401|402|429|rate.limit|free.period|unauthorized/i.test(errorMsg)) {
              yield* Effect.promise(() =>
                // kilocode_change start
                Bus.publish(Instance.current, TuiEvent.ToastShow, {
                  // kilocode_change end
                  title: "Codebase Search Unavailable",
                  message: "Codebase search unavailable. Set MORPH_API_KEY to continue. Get your key at morphllm.com",
                  variant: "error",
                  duration: 10000,
                }).catch(() => {}),
              )
            }
            return {
              title: `Codebase Search: ${params.query}`,
              output: errorMsg,
              metadata: { count: 0 },
            }
          }

          const MAX_OUTPUT_CHARS = 45_000
          const fullOutput = result.contexts.map((c) => `### ${c.file}\n\`\`\`\n${c.content}\n\`\`\``).join("\n\n") // kilocode_change

          let output: string
          if (fullOutput.length > MAX_OUTPUT_CHARS) {
            const summary = result.contexts
              .map((c) => {
                const lineInfo = !c.lines
                  ? ""
                  : c.lines === "*"
                    ? " (full file)"
                    : ` (lines ${c.lines.map((r) => r.join("-")).join(", ")})`
                return `- ${c.file}${lineInfo}`
              })
              .join("\n")
            output = `Results too large to show inline. Showing file paths and line ranges. Use Read tool to view specific files.\n\n${summary}`
          } else {
            output = fullOutput
          }

          return {
            title: `Codebase Search: ${params.query}`,
            output,
            metadata: { count: result.contexts.length },
          }
        }).pipe(Effect.orDie),
    }
  }),
)
