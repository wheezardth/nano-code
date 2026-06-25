/**
 * Indexing-local embedding model metadata registry.
 *
 * RATIONALE: This registry only contains provider-local defaults and static
 * metadata.
 */

import type { EmbedderProvider } from "./interfaces/manager"

interface ModelProfile {
  dimension: number
  scoreThreshold?: number
  queryPrefix?: string
}

const profiles: Record<string, Record<string, ModelProfile>> = {
  ollama: {
    "nomic-embed-text": { dimension: 768, scoreThreshold: 0.3, queryPrefix: "search_query: " },
    "mxbai-embed-large": { dimension: 1024, scoreThreshold: 0.3 },
    "all-minilm": { dimension: 384, scoreThreshold: 0.3 },
  },
  "openai-compatible": {},
}

const defaults: Record<string, string> = {
  ollama: "nomic-embed-text",
  "openai-compatible": "",
}

export function getDefaultModelId(provider: EmbedderProvider): string {
  return defaults[provider] ?? ""
}

export function getModelDimension(provider: EmbedderProvider, modelId: string): number | undefined {
  return profiles[provider]?.[modelId]?.dimension
}

export function getModelScoreThreshold(provider: EmbedderProvider, modelId: string): number | undefined {
  return profiles[provider]?.[modelId]?.scoreThreshold
}

export function getModelQueryPrefix(provider: EmbedderProvider, modelId: string): string | undefined {
  return profiles[provider]?.[modelId]?.queryPrefix
}

export function normalizeKiloModelId(modelId: string | undefined): string | undefined {
  return modelId
}

export function hasModelProfile(provider: EmbedderProvider, modelId: string | undefined): boolean {
  if (!modelId) return false
  return profiles[provider]?.[modelId] !== undefined
}
