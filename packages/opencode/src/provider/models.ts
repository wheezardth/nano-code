// kilocode_change - ModelsDev module stubbed after gateway removal.
// The gateway package previously provided the autocomplete/ModelsDev catalog.
// This stub ensures the provider system compiles without gateway dependencies.

import { Effect, Layer, Context } from "effect"

export interface ModelsDevCost {
  input?: number
  output?: number
  cache_read?: number
  cache_write?: number
  tiers?: Array<{
    input: number
    output: number
    cache_read?: number
    cache_write?: number
    tier: number
  }>
  context_over_200k?: {
    cache_read: number
    cache_write: number
    input: number
    output: number
  }
}

export interface ModelsDevModel {
  id: string
  name: string
  family: string
  provider?: { api: string; npm: string }
  status: string
  cost: ModelsDevCost
  limit: { context: number; input: number; output: number }
  temperature: boolean
  reasoning: boolean
  attachment: boolean
  tool_call: boolean
  modalities?: { input: string[]; output: string[] }
  interleaved: boolean
  release_date: string
}

export interface ModelsDevProvider {
  id: string
  api: string
  npm: string
  models: Record<string, ModelsDevModel>
}

export interface ModelsDevInterface {
  get: () => Effect.Effect<Record<string, ModelsDevProvider>>
}

// Service returns a record of providers; after gateway removal this is empty.
export class Service extends Context.Service<Service, ModelsDevInterface>()("@opencode/ModelsDev") {}

export const defaultLayer = Layer.succeed(Service, {
  get: () => Effect.succeed({}),
})

// No-op patches — gateway removed
export function patchModelsDevModel(_ctx: unknown, _model: ModelsDevModel): ModelsDevModel {
  return _model
}

export function patchConfigModel(_ctx: unknown, _model: ModelsDevModel): ModelsDevModel {
  return _model
}

