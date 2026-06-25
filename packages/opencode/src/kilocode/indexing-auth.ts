export type { IndexingConfig } from "@kilocode/kilo-indexing/config"

// Stubbed — gateway dependency removed
export function hasKiloIndexingAuth(): boolean {
  return false
}

export function resolveKiloIndexingAuth(): Promise<{ baseUrl: string; apiKey: string } | null> {
  return Promise.resolve(null)
}

export function shouldDefaultIndexingToKilo(): boolean {
  return false
}
