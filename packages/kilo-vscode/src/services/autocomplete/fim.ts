import * as vscode from "vscode"
import { ResponseMetaData } from "./types"
import type { KiloConnectionService } from "../cli-backend"

const FIM_MAX_TOKENS = 256

// VS Code config section backing the Models-tab "Autocomplete model" dropdown.
const AUTOCOMPLETE_CONFIG_SECTION = "kilo-code.new.autocomplete"
// Optional tuning / manual overrides that have no home in the dropdown.
const TUNING_CONFIG_SECTION = "kilocodeLocalFim"

type FimStyle = "qwen" | "codestral" | "raw"

interface LocalFimConfig {
  baseUrl: string
  model: string
  apiKey: string
  style: FimStyle
  temperature: number
  maxTokens: number
}

const STOP_TOKENS: Record<FimStyle, string[]> = {
  qwen: [
    "<|endoftext|>",
    "<|fim_prefix|>",
    "<|fim_suffix|>",
    "<|fim_middle|>",
    "<|fim_pad|>",
    "<|file_sep|>",
    "<|repo_name|>",
  ],
  codestral: ["[PREFIX]", "[SUFFIX]", "[MIDDLE]"],
  raw: [],
}

function workspaceDir(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
}

/** Pick a FIM token convention from the model id; overridable via setting. */
function inferStyle(modelId: string): FimStyle {
  const m = modelId.toLowerCase()
  if (m.includes("codestral") || m.includes("mistral")) {
    return "codestral"
  }
  return "qwen"
}

/**
 * Resolve baseURL / apiKey / model from a provider KiloCode already has
 * configured (the same client.config.providers() list the main agent uses).
 * Returns empty strings for anything it can't resolve.
 */
async function resolveFromProvider(
  connectionService: KiloConnectionService,
  providerId: string,
  preferredModel: string,
): Promise<{ baseUrl: string; apiKey: string; model: string }> {
  const empty = { baseUrl: "", apiKey: "", model: "" }
  try {
    const dir = workspaceDir()
    const client = await connectionService.getClientAsync(dir)
    const { data } = await client.config.providers(dir ? { directory: dir } : undefined, { throwOnError: true })
    const provider = data?.providers?.find((p) => p.id === providerId)
    if (!provider) {
      return empty
    }
    const optBase = provider.options?.["baseURL"]
    const baseUrl = typeof optBase === "string" ? optBase : ""
    const model = preferredModel || data.default?.[providerId] || Object.keys(provider.models ?? {})[0] || ""
    return { baseUrl, apiKey: provider.key ?? "", model }
  } catch (err) {
    console.warn(`[FIM] could not resolve provider "${providerId}" from KiloCode config:`, err)
    return empty
  }
}

/**Return the first non-empty string, or"" if none. */
function firstStr(...vals:Array<string | undefined>): string {
  for (const val of vals) {
      if (val) {
        return val
      }
  }
  return ""
}

/**
 * Build the effective FIM config. The Models-tab "Autocomplete model" dropdown
 * (kilo-code.new.autocomplete.provider/model) is the source of truth; its
 * baseURL / key are resolved live from KiloCode's configured providers.
 * kilocodeLocalFim.* remain optional overrides (manual baseUrl/model/key,
 * forced FIM style, temperature, maxTokens).
 */
async function resolveFimConfig(connectionService: KiloConnectionService): Promise<LocalFimConfig> {
  const ac = vscode.workspace.getConfiguration(AUTOCOMPLETE_CONFIG_SECTION)
  const tune = vscode.workspace.getConfiguration(TUNING_CONFIG_SECTION)
  const env = process.env

  const providerId = firstStr(ac.get<string>("provider"), env.KILO_LOCAL_FIM_PROVIDER)
  const selectedModel = firstStr(ac.get<string>("model"), env.KILO_LOCAL_FIM_MODEL)

  let baseUrl = firstStr(tune.get<string>("baseUrl"), env.KILO_LOCAL_FIM_BASE)
  let apiKey = firstStr(tune.get<string>("apiKey"), env.KILO_LOCAL_FIM_KEY)
  let model = firstStr(tune.get<string>("model"), selectedModel)

  if (providerId) {
    const resolved = await resolveFromProvider(connectionService, providerId, selectedModel)
    baseUrl = firstStr(baseUrl, resolved.baseUrl)
    apiKey = firstStr(apiKey, resolved.apiKey)
    model = firstStr(model, resolved.model)
  }

  const style = firstStr(tune.get<string>("style"), env.KILO_LOCAL_FIM_STYLE || inferStyle(model)) as FimStyle

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    model,
    apiKey,
    style: STOP_TOKENS[style] ? style : "raw",
    temperature: tune.get<number>("temperature") ?? 0.2,
    maxTokens: tune.get<number>("maxTokens") ?? FIM_MAX_TOKENS,
  }
}

/** Build the model-specific FIM prompt as a single completion prompt. */
function buildFimPrompt(style: FimStyle, prefix: string, suffix: string): string {
  if (style === "qwen") {
    return `<|fim_prefix|>${prefix}<|fim_suffix|>${suffix}<|fim_middle|>`
  }
  if (style === "codestral") {
    return `[SUFFIX]${suffix}[PREFIX]${prefix}`
  }
  return prefix
}

interface TokenMeta {
  inputTokens: number
  outputTokens: number
}

/**
 * Handle one raw SSE line. Returns true when the terminal [DONE] is seen.
 * Tolerates keep-alive blanks and partial JSON fragments.
 */
function applySseLine(line: string, onChunk: (text: string) => void, meta: TokenMeta): boolean {
  if (!line.startsWith("data:")) {
    return false
  }
  const data = line.slice(5).trim()
  if (data === "[DONE]") {
    return true
  }
  try {
    const chunk = JSON.parse(data)
    const choice = chunk?.choices?.[0]
    const content: string | undefined = choice?.text ?? choice?.delta?.content
    if (content) {
      onChunk(content)
    }
    if (chunk?.usage) {
      meta.inputTokens = chunk.usage.prompt_tokens ?? meta.inputTokens
      meta.outputTokens = chunk.usage.completion_tokens ?? meta.outputTokens
    }
  } catch {
    // Ignore non-JSON keep-alives and split chunks; the next read completes them.
  }
  return false
}

/** Read an OpenAI-style streaming completions body and forward text deltas. */
async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (text: string) => void,
  meta: TokenMeta,
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      buffer += decoder.decode(value, { stream: true })
      let nl = buffer.indexOf("\n")
      while (nl !== -1) {
        const line = buffer.slice(0, nl).trim()
        buffer = buffer.slice(nl + 1)
        if (applySseLine(line, onChunk, meta)) {
          return
        }
        nl = buffer.indexOf("\n")
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Generate a FIM completion against a local OpenAI-compatible endpoint,
 * reusing the provider/model selected in the Models tab. Bypasses the Kilo
 * Gateway entirely. Signature is unchanged so every existing caller works.
 *
 * @param signal - Optional AbortSignal to cancel early when the user types again.
 */
export async function generateFim(
  connectionService: KiloConnectionService,
  modelId: string,
  prefix: string,
  suffix: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<ResponseMetaData> {
  const cfg = await resolveFimConfig(connectionService)
  if ( !cfg.baseUrl || !cfg.model )
    throw new Error("Local FIM: No autocomplete model selected (Settings -> Models -> Autocomplete model)")
  const meta: TokenMeta = { inputTokens: 0, outputTokens: 0 }

  console.info(`[FIM] local model=${cfg.model} style=${cfg.style} url=${cfg.baseUrl}/completions selector=${modelId}`)

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (cfg.apiKey) {
    headers["Authorization"] = `Bearer ${cfg.apiKey}`
  }

  const response = await fetch(`${cfg.baseUrl}/completions`, {
    method: "POST",
    headers,
    signal,
    body: JSON.stringify({
      model: cfg.model,
      prompt: buildFimPrompt(cfg.style, prefix, suffix),
      max_tokens: cfg.maxTokens,
      temperature: cfg.temperature,
      stream: true,
      stop: STOP_TOKENS[cfg.style],
    }),
  })

  if (!response.ok || !response.body) {
    const detail = response.body ? await response.text().catch(() => "") : ""
    throw new Error(`Local FIM request failed: ${response.status} ${detail}`)
  }

  await consumeSseStream(response.body, onChunk, meta)

  return {
    cost: 0,
    inputTokens: meta.inputTokens,
    outputTokens: meta.outputTokens,
    cacheWriteTokens: 0,
    cacheReadTokens: 0,
  }
}

/**
 * Local FIM has no upstream auth, so autocomplete is always considered usable
 * regardless of whether the Kilo CLI backend is logged in.
 */
export function hasValidCredentials(_connectionService: KiloConnectionService): boolean {
  return true
}
