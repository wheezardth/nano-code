import type { KiloConnectionService } from "./cli-backend/connection-service"
import { routeAutocompleteMessage } from "./autocomplete/settings"

type Msg = {
  type: string
  requestId?: string
  model?: string
  language?: string
}

type Ctx = {
  connection: KiloConnectionService
  dir: string
  post: (msg: unknown) => void
}

export async function routeInputToolMessage(message: Msg, ctx: Ctx): Promise<boolean> {
  if (await routeAutocompleteMessage(message, ctx.post)) return true
  return false
}
