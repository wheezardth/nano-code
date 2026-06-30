import type { KiloConnectionService } from "../../cli-backend"
import { nesLog } from "./log"
import type { MercuryEditRequestContext, MercuryEditSuggestion } from "./types"

export interface MercuryEditProviderOptions {
  connectionService: KiloConnectionService
  providerId?: string
  modelId?: string
  signal?: AbortSignal
}

/**
 * Mercury edit removed with gateway dependency — always returns null.
 * The SDK endpoint `client.kilo.edit()` no longer exists.
 */
export class MercuryEditProvider {
  constructor(private readonly options: MercuryEditProviderOptions) {}

  async suggest(_ctx: MercuryEditRequestContext): Promise<MercuryEditSuggestion | null> {
    nesLog("Mercury edit disabled — gateway dependency removed")
    return null
  }
}

export class MercuryEditError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
  ) {
    super(message)
    this.name = "MercuryEditError"
  }
}
