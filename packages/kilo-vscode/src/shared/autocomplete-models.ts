// Autocomplete model definitions — derived from user-configured providers.
// No gateway/telemetry dependency; providers come from the CLI backend config.

export interface AutocompleteModelDef {
  id: string
  name: string
  description: string
  providerID: string
  modelID: string
  provider: string
  kind: string
  label: string
}

export type AutocompleteProviderID = string

// Base catalog — provider-specific models are resolved dynamically from
// the CLI backend's configured providers (never hardcoded).
export const AUTOCOMPLETE_MODELS: Record<AutocompleteProviderID, AutocompleteModelDef> = {}

export const DEFAULT_AUTOCOMPLETE_MODEL = ""
export const AUTOCOMPLETE_MODEL_ID = ""
export const AUTOCOMPLETE_EMBEDDING_MODEL_ID = ""

/**
 * Query the CLI backend for configured providers and build a dropdown-ready
 * list of autocomplete model options. Each provider's first FIM-capable model
 * becomes an autocomplete option.
 */
export async function fetchAutocompleteModels(providerId: string, models: Record<string, { id: string }>): Promise<AutocompleteModelDef[]> {
  const results: AutocompleteModelDef[] = []
  const providerName = providerId || "Custom"

  for (const [modelId, modelInfo] of Object.entries(models)) {
    results.push({
      id: `${providerId}/${modelId}`,
      name: modelId,
      description: "",
      providerID: providerId,
      modelID: modelId,
      provider: providerName,
      kind: "fim",
      label: modelInfo.id || modelId,
    })
  }

  return results
}

/**
 * Populate AUTOCOMPLETE_MODELS from provider model lists.
 * Returns all models grouped by provider into the shared catalog.
 */
export async function populateAutocompleteModels(
  providers: Array<{
    id: string
    name?: string
    models: Record<string, { id?: string }>
  }>,
): Promise<Record<AutocompleteProviderID, AutocompleteModelDef>> {
  const catalog: Record<AutocompleteProviderID, AutocompleteModelDef> = {}

  for (const provider of providers) {
    if (!provider.models || Object.keys(provider.models).length === 0) {
      continue
    }

    const providerName = provider.name || provider.id

    for (const [key, modelSchema] of Object.entries(provider.models)) {
      const label = modelSchema.id || key
      const modelDef: AutocompleteModelDef = {
        id: `${provider.id}/${key}`,
        name: label,
        description: "",
        providerID: provider.id,
        modelID: key,
        provider: providerName,
        kind: "fim",
        label: label,
      }

      catalog[`${provider.id}/${key}`] = modelDef
    }
  }

  return catalog
}

export function getAutocompleteModel(_provider: string | undefined, _modelID: string | undefined): AutocompleteModelDef | undefined {
  if (_provider && _modelID) {
    const id = `${_provider}/${_modelID}`
    return AUTOCOMPLETE_MODELS[id]
  }
  return undefined
}

export function getAutocompleteModelById(id: string): AutocompleteModelDef | undefined {
  return AUTOCOMPLETE_MODELS[id]
}

export function validAutocompleteModel(id: string): boolean {
  return id === DEFAULT_AUTOCOMPLETE_MODEL
}

export function validAutocompleteProvider(id: string): boolean {
  return id.length > 0
}
