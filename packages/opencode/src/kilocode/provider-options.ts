import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai"
import type { OpenAICompatibleProviderOptions } from "@ai-sdk/openai-compatible"

export function kiloProviderOptions(options: { [x: string]: any }) {
  const result: Record<string, any> = {}
  const o = options as any
  result.openai = {
    reasoningEffort: o.reasoning && "effort" in o.reasoning ? o.reasoning?.effort : undefined,
    textVerbosity: o.verbosity,
    store: false,
    forceReasoning: o.reasoning?.enabled,
  } satisfies OpenAIResponsesProviderOptions
  result.openaiCompatible = {
    reasoningEffort: o.reasoning && "effort" in o.reasoning ? o.reasoning?.effort : undefined,
    textVerbosity: o.verbosity,
  } satisfies OpenAICompatibleProviderOptions
  return result
}
