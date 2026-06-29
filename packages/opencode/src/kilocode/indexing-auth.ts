export type { IndexingConfig } from "@kilocode/kilo-indexing/config"

// Stubbed — gateway dependency removed
export function hasKiloIndexingAuth(_opts: unknown): boolean {
  return false
}

export function resolveKiloIndexingAuth(_opts: unknown): null {
  return null
}

export function shouldDefaultIndexingToKilo(_indexing: unknown, _auth: unknown): boolean {
  return false
}
