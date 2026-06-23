import type { ProviderAuthState } from "../../types/messages"

export function visibleConnectedIds(connected: string[], authStates: Record<string, ProviderAuthState>) {
  return connected.filter((id) => id !== "kilo" || authStates["kilo"] !== undefined)
}
