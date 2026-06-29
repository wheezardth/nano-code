// Stubbed — gateway dependency removed
import type { IndexingConfig } from "@kilocode/sdk/v2"
import { createMemo } from "solid-js"

export type IndexingScope = "global" | "project"

export function inheritedDescription(value: string, _inheritance: "none" | "inherited" | "partial"): string {
  return value
}

export function indexingInheritance(
  _scope: IndexingScope,
  _global: unknown,
  _project: unknown,
  _paths: readonly (readonly string[])[],
): "none" | "inherited" | "partial" {
  return "none"
}

export function indexingScopeConfig(
  _scope: IndexingScope,
  _config: unknown,
  _globalConfig: unknown,
  indexing: IndexingConfig,
): IndexingConfig {
  return indexing
}

export function indexingPatch(
  _before: IndexingConfig,
  after: IndexingConfig,
): { indexing: Partial<IndexingConfig>; unset: string[] } {
  return { indexing: after, unset: [] }
}

export function mergeIndexingConfig(a: IndexingConfig, b: IndexingConfig): IndexingConfig {
  return { ...a, ...b }
}

export function loadKiloEmbeddingModels(
  _setError?: (msg: string) => void,
): Promise<{ models: Array<{ id: string; name: string; dimension: number; scoreThreshold: number }>; defaultModel: string; aliases: Record<string, string> }> {
  return Promise.resolve({ models: [], defaultModel: "", aliases: {} })
}

export function kiloModelOptions(
  _catalog: { models: Array<{ id: string; name: string }> } | undefined,
): Array<{ value: string; title: string }> {
  return []
}

export function currentKiloModel(
  _catalog: { models: Array<{ id: string; name: string }> } | undefined,
  modelId: string | null | undefined,
): string | undefined {
  return modelId ?? undefined
}

export interface IndexingDialogState {
  config: () => IndexingConfig
  raw: () => IndexingConfig
  enabled: () => boolean
  inherited: (paths: readonly (readonly string[])[]) => "none" | "inherited" | "partial"
  unset: () => string[]
}

export function createIndexingDialogState(opts: {
  scope: () => IndexingScope
  global: () => IndexingConfig
  project: () => IndexingConfig | undefined
  resolve: (current: IndexingConfig, global?: IndexingConfig) => IndexingConfig
}): IndexingDialogState {
  const raw = createMemo<IndexingConfig>(() => {
    const s = opts.scope()
    return s === "project" ? (opts.project() ?? {}) : opts.global()
  })
  const config = createMemo(() => opts.resolve(raw(), opts.global()))

  return {
    config,
    raw,
    enabled: () => !!(config() as IndexingConfig & { enabled?: boolean }).enabled,
    inherited: (_paths) => "none",
    unset: () => [],
  }
}
