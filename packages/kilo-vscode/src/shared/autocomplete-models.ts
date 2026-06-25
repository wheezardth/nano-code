// Autocomplete model definitions

export interface AutocompleteModelDef {
  id: string
  name: string
  description: string
  providerID: string
  modelID: string
}

export type AutocompleteProviderID = string

export const AUTOCOMPLETE_MODELS: Record<AutocompleteProviderID, AutocompleteModelDef> = {}
export const DEFAULT_AUTOCOMPLETE_MODEL = ""
export const AUTOCOMPLETE_MODEL_ID = ""
export const AUTOCOMPLETE_EMBEDDING_MODEL_ID = ""

export function getAutocompleteModel(id: AutocompleteProviderID): AutocompleteModelDef | undefined {
  return AUTOCOMPLETE_MODELS[id]
}

export function getAutocompleteModelById(id: string): AutocompleteModelDef | undefined {
  return AUTOCOMPLETE_MODELS[id as AutocompleteProviderID]
}

export function getAutocompleteModel(_id: string, _modelID: string): AutocompleteModelDef | undefined {
  return undefined
}

export function validAutocompleteModel(id: string): boolean {
  return id === DEFAULT_AUTOCOMPLETE_MODEL
}

export function validAutocompleteProvider(id: string): boolean {
  return false
}
