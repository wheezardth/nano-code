import { InstanceStore } from "@/project/instance-store"
import { Effect } from "effect"

export const disposeAllInstancesAfterProviderAuthCallback = Effect.fn(
  "KiloServer.disposeAllInstancesAfterProviderAuthCallback",
)(function* () {
  const store = yield* InstanceStore.Service
  yield* store.disposeAll()
})

export const invalidateAfterProviderAuthChange = Effect.fn("KiloServer.invalidateAfterProviderAuthChange")(function* (
  _providerID: string,
) {
  // Model cache removed — invalidate instances only
  yield* disposeAllInstancesAfterProviderAuthCallback()
})
