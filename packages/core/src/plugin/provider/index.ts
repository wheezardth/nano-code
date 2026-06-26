import { DynamicProviderPlugin } from "./dynamic"
import { OpenAICompatiblePlugin } from "./openai-compatible"
import { OpencodePlugin } from "./opencode"

export const ProviderPlugins = [
  DynamicProviderPlugin,
  OpenAICompatiblePlugin,
  OpencodePlugin,
]
