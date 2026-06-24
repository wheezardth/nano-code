import type * as vscode from "vscode"
import type { KiloConnectionService } from "../services/cli-backend"

export interface RemoveConfigItemContext {
  connection: KiloConnectionService
  project: () => string | undefined
  directory: () => string
  refresh: () => Promise<void>
  remove: (item: { id: string; type: string }, scope: "project" | "global", project?: string) => Promise<boolean>
  storage?: vscode.Uri
}

export function createMarketplaceRemover(): RemoveConfigItemContext["remove"] {
  return async () => false
}

export async function removeAgent(ctx: RemoveConfigItemContext, name: string): Promise<boolean> {
  return false
}

export async function removeMcp(ctx: RemoveConfigItemContext, name: string): Promise<boolean> {
  return false
}
