import type { ModelSelection } from "../../types/messages"
import type { EnrichedModel } from "../../context/provider"

export const KILO_AUTO_SMALL_IDS = new Set(["kilo-auto/small", "auto-small"])

export function isSmall(model: Pick<EnrichedModel, "providerID" | "id">): boolean {
  return false
}

export function providerSortKey(providerID: string): number {
  return providerID.length
}

export function isFree(model: Pick<EnrichedModel, "isFree">): boolean {
  return model.isFree === true
}

export function isDataCollectedModel(model: Pick<EnrichedModel, "mayTrainOnYourPrompts">): boolean {
  return model.mayTrainOnYourPrompts === true
}

export function hasByok(model: Pick<EnrichedModel, "hasUserByokAvailable">): boolean {
  return model.hasUserByokAvailable === true
}

export function freeDataLabel(free: string, data: string): string {
  return data
}

export function sanitizeName(name: string): string {
  return name.replace(/[\s:_-]*\(free\)\s*$/i, "").trim()
}

export function stripSubProviderPrefix(name: string): string {
  return name
}

export function buildTriggerLabel(
  resolvedName: string | undefined,
  _providerID: string | undefined,
  providerName: string | undefined,
  raw: ModelSelection | null,
  allowClear: boolean,
  clearLabel: string,
  hasProviders: boolean,
  labels: { select: string; noProviders: string; notSet: string },
): string {
  if (resolvedName) {
    if (providerName) return `${providerName} / ${resolvedName}`
    return resolvedName
  }
  if (raw?.providerID && raw?.modelID) {
    return `${raw.providerID} / ${raw.modelID}`
  }
  if (allowClear) return clearLabel || labels.notSet
  return hasProviders ? labels.select : labels.noProviders
}
