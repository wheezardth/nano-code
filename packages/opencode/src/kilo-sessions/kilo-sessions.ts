import { Context, Effect, Layer } from "effect"
import { Session } from "@/session/session"
import { Bus } from "@/bus"
import { InstanceState } from "@/effect/instance-state"
import { Config } from "@/config/config"

export namespace KiloSessions {
  export const Event = {} as Record<string, unknown>

  export interface Interface {
    readonly init: () => Effect.Effect<void, unknown>
  }

  export class Service extends Context.Service<Service, Interface>()("@kilocode/KiloSessions") {}

  export const layer: Layer.Layer<Service, never, Config.Service | Session.Service | Bus.Service | InstanceState.Context> =
    Layer.effect(Service, Effect.gen(function* () {
      yield* Config.Service
      yield* Session.Service
      return Service.of({ init: Effect.succeed(undefined) })
    }))

  export const defaultLayer = layer
}
