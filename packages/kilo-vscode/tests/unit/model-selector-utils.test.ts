import { describe, it, expect } from "bun:test"
import {
  providerSortKey,
  buildTriggerLabel,
  stripSubProviderPrefix,
  sanitizeName,
  freeDataLabel,
  isDataCollectedModel,
  hasByok,
  isFree,
} from "../../webview-ui/src/components/shared/model-selector-utils"

const labels = { select: "Select model", noProviders: "No providers", notSet: "Not set" }

describe("providerSortKey", () => {
  it("returns length for any provider", () => {
    expect(providerSortKey("kilo")).toBe(4)
    expect(providerSortKey("anthropic")).toBe(9)
  })
})

describe("stripSubProviderPrefix", () => {
  it("leaves names unchanged (no longer strips any prefix)", () => {
    expect(stripSubProviderPrefix("Anthropic: Claude Sonnet")).toBe("Anthropic: Claude Sonnet")
    expect(stripSubProviderPrefix("OpenAI: GPT-4o")).toBe("OpenAI: GPT-4o")
    expect(stripSubProviderPrefix("GPT-4o")).toBe("GPT-4o")
  })
})

describe("sanitizeName", () => {
  it("strips trailing (free) suffix", () => {
    expect(sanitizeName("Llama 3 (free)")).toBe("Llama 3")
  })

  it("is case-insensitive for parenthesized suffix", () => {
    expect(sanitizeName("Model (Free)")).toBe("Model")
    expect(sanitizeName("Model (FREE)")).toBe("Model")
  })

  it("preserves bare trailing Free in names like 'Kilo Auto Free'", () => {
    expect(sanitizeName("Kilo Auto Free")).toBe("Kilo Auto Free")
    expect(sanitizeName("Mixtral free")).toBe("Mixtral free")
    expect(sanitizeName("Mistral:free")).toBe("Mistral:free")
    expect(sanitizeName("Gemma-free")).toBe("Gemma-free")
    expect(sanitizeName("Model FREE")).toBe("Model FREE")
  })

  it("leaves names without (free) suffix unchanged", () => {
    expect(sanitizeName("GPT-4o")).toBe("GPT-4o")
    expect(sanitizeName("Claude Sonnet")).toBe("Claude Sonnet")
  })

  it("does not strip 'free' from the middle of a name", () => {
    expect(sanitizeName("FreeAgent Pro")).toBe("FreeAgent Pro")
  })

  it("handles extra whitespace around (free) suffix", () => {
    expect(sanitizeName("Llama 3 (free)  ")).toBe("Llama 3")
    expect(sanitizeName("Model  (free)  ")).toBe("Model")
  })
})

describe("freeDataLabel", () => {
  it("uses the data collection label without repeating free", () => {
    expect(freeDataLabel("Free", "Data may be used for training")).toBe("Data may be used for training")
  })
})

describe("isFree", () => {
  it("uses only explicit free metadata", () => {
    expect(isFree({ isFree: true })).toBe(true)
    expect(isFree({ isFree: false })).toBe(false)
    expect(isFree({})).toBe(false)
  })
})

describe("isDataCollectedModel", () => {
  it("uses only explicit prompt training metadata", () => {
    expect(isDataCollectedModel({ mayTrainOnYourPrompts: true })).toBe(true)
    expect(isDataCollectedModel({ mayTrainOnYourPrompts: false })).toBe(false)
    expect(isDataCollectedModel({})).toBe(false)
  })
})

describe("hasByok", () => {
  it("uses only explicit user BYOK metadata", () => {
    expect(hasByok({ hasUserByokAvailable: true })).toBe(true)
    expect(hasByok({ hasUserByokAvailable: false })).toBe(false)
    expect(hasByok({})).toBe(false)
  })
})

describe("buildTriggerLabel", () => {
  it("returns providerName / resolvedName for provider with name", () => {
    expect(buildTriggerLabel("GPT-4o", "openai", "OpenAI", null, false, "", true, labels)).toBe("OpenAI / GPT-4o")
  })

  it("returns resolved name as-is when no providerName", () => {
    expect(buildTriggerLabel("GPT-4o", "openai", undefined, null, false, "", true, labels)).toBe("GPT-4o")
  })

  it("returns resolved name when providerID is undefined", () => {
    expect(buildTriggerLabel("GPT-4o", undefined, undefined, null, false, "", true, labels)).toBe("GPT-4o")
  })

  it("returns modelID as providerID / modelID for raw selection", () => {
    const raw = { providerID: "anthropic", modelID: "claude-3-5-sonnet" }
    expect(buildTriggerLabel(undefined, undefined, undefined, raw, false, "", true, labels)).toBe(
      "anthropic / claude-3-5-sonnet",
    )
  })

  it("returns clearLabel when allowClear and no selection", () => {
    expect(buildTriggerLabel(undefined, undefined, undefined, null, true, "None", true, labels)).toBe("None")
  })

  it("falls back to labels.notSet when allowClear and clearLabel is empty", () => {
    expect(buildTriggerLabel(undefined, undefined, undefined, null, true, "", true, labels)).toBe("Not set")
  })

  it("returns labels.select when providers exist and no selection", () => {
    expect(buildTriggerLabel(undefined, undefined, undefined, null, false, "", true, labels)).toBe("Select model")
  })

  it("returns labels.noProviders when no providers available", () => {
    expect(buildTriggerLabel(undefined, undefined, undefined, null, false, "", false, labels)).toBe("No providers")
  })

  it("prefers resolvedName over raw selection", () => {
    const raw = { providerID: "anthropic", modelID: "claude-3-5-sonnet" }
    expect(buildTriggerLabel("Claude Sonnet", undefined, undefined, raw, false, "", true, labels)).toBe("Claude Sonnet")
  })

  it("ignores partial raw selection (only providerID)", () => {
    const raw = { providerID: "anthropic", modelID: "" }
    expect(buildTriggerLabel(undefined, undefined, undefined, raw, false, "", true, labels)).toBe("Select model")
  })

  it("ignores partial raw selection (only modelID)", () => {
    const raw = { providerID: "", modelID: "claude-3-5-sonnet" }
    expect(buildTriggerLabel(undefined, undefined, undefined, raw, false, "", true, labels)).toBe("Select model")
  })
})
