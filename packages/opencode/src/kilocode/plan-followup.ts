// Stubbed — plan followup logic removed
import { Effect } from "effect"
import type { SessionID } from "@/session/schema"

export namespace PlanFollowup {
  export const ask = (_input: unknown): Promise<"skip" | "continue" | "break"> =>
    Promise.resolve("skip" as const)
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
