/**
 * legacy-migration - Maps legacy apiProvider values to new provider IDs and key fields.
 *
 * The legacy extension used flat per-provider key names (e.g. apiKey, openRouterApiKey).
 * The new CLI backend uses a per-provider auth endpoint (PUT /auth/:providerId).
 */

export interface ProviderMapping {
  /** New provider ID for the auth endpoint (PUT /auth/:id) */
  id: string
  /** Field name in LegacyProviderSettings holding the primary API key */
  key: string
  /** Display name for the provider in the wizard UI */
  name: string
  /** Field holding model ID (defaults to "apiModelId") */
  modelField?: string
  /** Field holding custom base URL (to also store in config) */
  urlField?: string
  /** Field holding an organization/account ID (used for OAuth-style auth) */
  organizationIdField?: string
  /** VS Code secret key holding OAuth credentials stored separately from the provider profile */
  oauthSecretKey?: string
  /** If true, skip auth.set entirely — provider uses env/ADC-based auth (e.g. Vertex AI) */
  skipAuth?: boolean
  /** Legacy settings fields to write as provider config options (e.g. project/location for Vertex) */
  configFields?: Array<{ from: string; option: string }>
}

/**
 * Maps legacy `apiProvider` values → new provider info.
 * Providers absent from this map are flagged as unsupported.
 */
export const PROVIDER_MAP: Record<string, ProviderMapping> = {
  openai: {
    id: "openai-compatible",
    key: "openAiApiKey",
    name: "OpenAI (Compatible)",
    modelField: "openAiModelId",
    urlField: "openAiBaseUrl",
  },
  "openai-native": {
    id: "openai",
    key: "openAiNativeApiKey",
    name: "OpenAI",
    urlField: "openAiNativeBaseUrl",
  },
  "openai-responses": {
    id: "openai",
    key: "openAiApiKey",
    name: "OpenAI",
    modelField: "openAiModelId",
  },
  ollama: {
    id: "ollama",
    key: "ollamaApiKey",
    name: "Ollama",
    modelField: "ollamaModelId",
    urlField: "ollamaBaseUrl",
  },
  lmstudio: {
    id: "lmstudio",
    key: "lmStudioBaseUrl",
    name: "LM Studio",
    modelField: "lmStudioModelId",
    urlField: "lmStudioBaseUrl",
  },
  kilocode: {
    id: "kilo",
    key: "kilocodeToken",
    name: "Kilo (Gateway)",
    modelField: "kilocodeModel",
    organizationIdField: "kilocodeOrganizationId",
  },
  litellm: {
    id: "litellm",
    key: "litellmApiKey",
    name: "LiteLLM",
    modelField: "litellmModelId",
    urlField: "litellmBaseUrl",
  },
  "sap-ai-core": {
    id: "sap-ai-core",
    key: "sapAiCoreServiceKey",
    name: "SAP AI Core",
  },
}

/** Providers that have no equivalent in the new CLI backend */
export const UNSUPPORTED_PROVIDERS = new Set([
  "fake-ai",
  "human-relay",
  "vscode-lm",
  "claude-code",
  "qwen-code",
  "virtual-quota-fallback",
  "glama",
  "roo",
])

/** Built-in default mode slugs that should not be migrated */
export const DEFAULT_MODE_SLUGS = new Set(["code", "build", "architect", "ask", "debug", "orchestrator", "review"])
