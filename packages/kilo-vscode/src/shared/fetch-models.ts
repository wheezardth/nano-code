/**
 * Fetch available models from an OpenAI-compatible /models endpoint.
 * Runs in the extension host — no CLI backend dependency.
 */

type Options = {
  baseURL: string
  apiKey?: string
  headers?: Record<string, string>
}

type ModelEntry = {
  id: string
  name: string
  maxModelLen?: number
}

export type FetchedModels = {
  models: ModelEntry[]
  maxModelLen?: number
}

export class FetchModelsError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = "FetchModelsError"
  }

  get auth() {
    return this.status === 401 || this.status === 403
  }
}

export async function fetchOpenAIModels(opts: Options): Promise<FetchedModels> {
  const url = opts.baseURL.replace(/\/+$/, "") + "/models"
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...opts.headers,
  }
  if (opts.apiKey) {
    headers["Authorization"] = `Bearer ${opts.apiKey}`
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new FetchModelsError(`HTTP ${response.status}: ${text.slice(0, 200)}`, response.status)
  }

  const body = (await response.json()) as { data?: Array<{ id?: string; name?: string; max_model_len?: number }> }
  const items = body?.data
  if (!Array.isArray(items)) return { models: [] }

  const seen = new Set<string>()
  const result: ModelEntry[] = []
  for (const item of items) {
    const id = typeof item.id === "string" ? item.id.trim() : ""
    if (!id || seen.has(id)) continue
    seen.add(id)
    const ml = typeof item.max_model_len === "number" && item.max_model_len > 0 ? item.max_model_len : undefined
    result.push({ id, name: typeof item.name === "string" ? item.name.trim() : id, maxModelLen: ml })
  }
  result.sort((a, b) => a.id.localeCompare(b.id))

  let maxModelLen: number | undefined
  for (const m of result) {
    if (m.maxModelLen && (!maxModelLen || m.maxModelLen > maxModelLen)) {
      maxModelLen = m.maxModelLen
    }
  }

  return { models: result, maxModelLen }
}
