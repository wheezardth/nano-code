// Stubbed — plan followup logic removed
import { Effect } from "effect"
import type { SessionID } from "@/session/schema"
import type { MessageID } from "@/session/message-v2"

export namespace PlanFollowup {
  export const ask = (_input: { sessionId: string; messages: unknown[]; abort: AbortSignal }) =>
    Effect.succeed("skip" as const)
  export const abort = (_sessionId: SessionID) => Effect.void
}

export const PlanFollowupRuntime = {
  shouldAsk: () => false,
}

export function formatTodos(_content: string): string {
  return ""
}

export function generateHandover(_todoItems: unknown[], _abort: AbortSignal): Promise<string> {
  return Promise.resolve("")
}
