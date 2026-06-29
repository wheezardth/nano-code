import { describe, expect, test } from "bun:test"
import { clean, merge, providerPatch, removed, shouldSync, validate } from "./indexing"

describe("indexing config state", () => {
  test("merges project settings over nested global settings", () => {
    expect(
      merge(
        { enabled: true, provider: "ollama", ollama: { baseUrl: "global" }, qdrant: { url: "http://global" } },
        { enabled: false, provider: "openai-compatible", qdrant: { apiKey: "project" } },
      ),
    ).toEqual({
      enabled: false,
      provider: "openai-compatible",
      ollama: { baseUrl: "global" },
      qdrant: { url: "http://global", apiKey: "project" },
    })
  })

  test("cleans empty fields and returns unset paths", () => {
    const before = {
      provider: "ollama" as const,
      model: "nomic-embed-text",
      ollama: { baseUrl: "http://old:11434" },
    }
    const after = clean({ provider: "ollama", model: "", ollama: { baseUrl: "" } })

    expect(after).toEqual({ provider: "ollama" })
    expect(removed(before, after)).toEqual([
      ["indexing", "model"],
      ["indexing", "ollama"],
    ])
  })

  test("resyncs dirty drafts when the scope changes", () => {
    expect(shouldSync("global", "global", true, "global", "updated")).toBe(false)
    expect(shouldSync("global", "project", true, "global", "project")).toBe(true)
    expect(shouldSync("global", "project", true, "shared", "shared")).toBe(true)
  })

  test("builds provider patches for custom selector changes", () => {
    expect(providerPatch("ollama", "ignored")).toEqual({
      provider: "ollama",
      model: undefined,
      dimension: undefined,
    })
    expect(providerPatch("")).toEqual({ provider: undefined, model: undefined, dimension: undefined })
  })

  test("validates numeric settings", () => {
    expect(validate({ dimension: 0, searchMinScore: 2, searchMaxResults: 0, embeddingBatchSize: 1.5 })).toEqual([
      "Vector dimension must be a positive integer.",
      "Search minimum score must be between 0 and 1.",
      "Search maximum results must be a positive integer.",
      "Embedding batch size must be a positive integer.",
    ])
  })
})
