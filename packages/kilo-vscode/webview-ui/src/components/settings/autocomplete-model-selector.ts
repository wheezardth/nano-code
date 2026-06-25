import { AUTOCOMPLETE_MODELS } from "../../../../src/shared/autocomplete-models"
import type { EnrichedModel } from "../../context/provider"

export const AUTOCOMPLETE_SELECTOR_MODELS: EnrichedModel[] = Object.values(AUTOCOMPLETE_MODELS).map((m) => ({
  id: m.modelID,
  name: m.label,
  providerID: m.providerID,
  providerName: m.provider,
}))
