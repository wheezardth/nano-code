// Stubbed — gateway dependency removed

export const inheritedDescription = false
export const kiloModelOptions = {}
export const loadKiloEmbeddingModels = () => Promise.resolve([])
export const mergeIndexingConfig = (a: Record<string, unknown>, b: Record<string, unknown>) => ({ ...a, ...b })
export type IndexingScope = "global" | "local"

// Additional stubs required by dialog-indexing.tsx
export function createIndexingDialogState() {
  const [state, setState] = {} as { enabled: boolean }
  return {
    state: state as { enabled: boolean },
    setState: (_s: typeof state) => setState(_s),
  }
}

export function currentKiloModel() {
  return null as unknown as { id: string; name: string }
}

export function indexingInheritance(_scope: string, _paths: readonly (readonly string[])[]): "none" | "inherited" | "partial" {
  return "none"
}

export function indexingPatch(_scope: string, _global: Record<string, unknown>, _project: Record<string, unknown>, _patch: Record<string, unknown>) {
  return {}
}

export function indexingScopeConfig(_scope: string) {
  return {}
}
