import { describe, expect, it } from "bun:test"
import type { Provider } from "../../webview-ui/src/types/messages"
import { providerIcon, sortProviders } from "../../webview-ui/src/components/settings/provider-catalog"

function provider(id: string, metadata?: Provider["metadata"]): Provider {
  return {
    id,
    name: id,
    models: {},
    metadata,
  }
}

describe("provider catalog", () => {
  it("sorts providers alphabetically", () => {
    const items = [provider("openai"), provider("anthropic"), provider("unknown")]
    const ids = sortProviders(items).map((item) => item.id)
    expect(ids).toEqual(["anthropic", "openai", "unknown"])
  })
})
