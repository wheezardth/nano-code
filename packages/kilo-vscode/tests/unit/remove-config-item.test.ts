import { describe, expect, it, mock } from "bun:test"
import { removeAgent, removeMcp, type RemoveConfigItemContext } from "../../src/kilo-provider/remove-config-item"

function context(opts: {
  project?: string
  remove: ReturnType<typeof mock>
  refresh: ReturnType<typeof mock>
  legacyMcpRemoved?: boolean
}): RemoveConfigItemContext {
  return {
    connection: {
      getClientAsync: mock(async () => ({
        global: { config: { update: mock(async () => {}) } },
        instance: { dispose: mock(async () => {}) },
      })),
    } as unknown as RemoveConfigItemContext["connection"],
    project: () => opts.project,
    directory: () => "/repo",
    refresh: opts.refresh,
    remove: opts.remove,
    storage: opts.legacyMcpRemoved === true ? { fsPath: "/storage" } as unknown as import("vscode").Uri : undefined,
  }
}

describe("remove config item adapter", () => {
  it("removes agents from project scope, then global if needed, then refreshes", async () => {
    const remove = mock(async () => ({ success: true, slug: "reviewer" }))
    const refresh = mock(async () => {})
    const ctx = context({ project: "/repo", remove, refresh })

    expect(await removeAgent(ctx, "reviewer")).toBe(true)
    expect(remove).toHaveBeenCalledTimes(1)
    expect(remove).toHaveBeenCalledWith({ id: "reviewer", type: "agent" }, "project", "/repo")
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it("removes agents from project scope even when removal returns undefined result", async () => {
    const remove = mock(async () => undefined as unknown as ReturnType<typeof mock>)
    const refresh = mock(async () => {})
    const ctx = context({ project: "/repo", remove, refresh })

    expect(await removeAgent(ctx, "reviewer")).toBe(false)
    expect(remove).toHaveBeenCalledTimes(1)
    expect(refresh).not.toHaveBeenCalled()
  })

  it("removes MCP servers, refreshing after removal", async () => {
    const remove = mock(async () => ({ success: true, slug: "memory" }))
    const refresh = mock(async () => {})
    const ctx = context({ remove, refresh })

    expect(await removeMcp(ctx, "memory")).toBe(true)
    expect(remove).toHaveBeenCalledWith({ id: "memory", type: "mcp" }, "global", undefined)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it("removes MCP servers from project and global, refreshing when at least one succeeds", async () => {
    const remove = mock(async (arg) => arg.scope === "project" ? { success: true, slug: "mcp" } : { success: false, slug: "mcp" })
    const refresh = mock(async () => {})
    const ctx = context({ project: "/repo", remove, refresh })

    expect(await removeMcp(ctx, "mcp")).toBe(true)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it("does not refresh when both project and global removal fail", async () => {
    const remove = mock(async () => ({ success: false, slug: "mcp" }))
    const refresh = mock(async () => {})
    const ctx = context({ remove, refresh })

    expect(await removeMcp(ctx, "mcp")).toBe(false)
    expect(refresh).not.toHaveBeenCalled()
  })
})
