import path from "path"
import fs from "fs/promises"
import fsSync from "fs"
import { xdgData, xdgCache, xdgConfig, xdgState } from "xdg-basedir"
import os from "os"
import { Context, Effect, Layer } from "effect"
import { Flock } from "./util/flock"
import { markNoIndex } from "./kilocode/spotlight" // kilocode_change
import { ensureRealDir } from "./kilocode/global" // kilocode_change
import { Flag } from "./flag/flag"

const app = "nanocode" // kilocode_change
// kilocode_change start
// Defensively strip newline characters from the resolved XDG paths.
// If `$HOME` (or any `$XDG_*_HOME` override) has a trailing newline in
// the user's shell — e.g. because a shell snippet did `export HOME=$(cmd)`
// against a command with an implicit newline — the unsanitised path
// makes `fs.mkdir` try to create `/Users/<name>\n` and fail with EACCES,
// which breaks every `nanocode` invocation at startup (including the SDK
// regen that runs during `bun run extension`).
const clean = (p: string | undefined) => p?.replace(/[\r\n]+/g, "")
const data = path.join(clean(xdgData)!, app)
const cache = path.join(clean(xdgCache)!, app)
const config = path.join(clean(xdgConfig)!, app)
const state = path.join(clean(xdgState)!, app)

// Migrate XDG paths from old "kilo" to new "nanocode", preserving all data.
const oldData = path.join(clean(xdgData)!, "kilo")
const oldConfig = path.join(clean(xdgConfig)!, "kilo")
const oldCache = path.join(clean(xdgCache)!, "kilo")
const oldState = path.join(clean(xdgState)!, "kilo")
const newData = path.join(clean(xdgData)!, app)
const newConfig = path.join(clean(xdgConfig)!, app)
const newCache = path.join(clean(xdgCache)!, app)
const newState = path.join(clean(xdgState)!, app)

function migrateOnce(src: string, dst: string) {
  try {
    if (!fsSync.existsSync(dst)) {
      if (fsSync.existsSync(src)) {
        fsSync.renameSync(src, dst)
      }
    }
  } catch (err: unknown) {
    if ((err as { code: string })?.code === "EEXIST") {
      // Destination exists with different data — proceed with new paths
    } else if ((err as { code: string })?.code === "EACCES") {
      // Permission denied — proceed with new paths, don't crash startup
    }
  }
}

migrateOnce(oldData, newData)
migrateOnce(oldConfig, newConfig)
migrateOnce(oldCache, newCache)
migrateOnce(oldState, newState)

// kilocode_change end
const tmp = path.join(os.tmpdir(), app)

const paths = {
  get home() {
    return (process.env.KILO_TEST_HOME ?? os.homedir()).trim()
  },
  data,
  bin: path.join(cache, "bin"),
  log: path.join(data, "log"),
  repos: path.join(data, "repos"),
  cache,
  config,
  state,
  tmp,
}

export const Path = paths

Flock.setGlobal({ state })

await Promise.all([
  ensureRealDir(Path.data), // kilocode_change
  ensureRealDir(Path.config), // kilocode_change
  ensureRealDir(Path.state), // kilocode_change
  ensureRealDir(Path.tmp), // kilocode_change
  ensureRealDir(Path.log), // kilocode_change
  ensureRealDir(Path.bin), // kilocode_change
  ensureRealDir(Path.repos), // kilocode_change
])

// kilocode_change start - keep generated Kilo data out of macOS Spotlight
await Promise.all([Path.data, Path.cache, Path.state].map(markNoIndex))
// kilocode_change end

export class Service extends Context.Service<Service, Interface>()("@opencode/Global") {}

export interface Interface {
  readonly home: string
  readonly data: string
  readonly cache: string
  readonly config: string
  readonly state: string
  readonly tmp: string
  readonly bin: string
  readonly log: string
  readonly repos: string
}

export function make(input: Partial<Interface> = {}): Interface {
  return {
    home: Path.home,
    data: Path.data,
    cache: Path.cache,
    config: Flag.KILO_CONFIG_DIR ?? Path.config,
    state: Path.state,
    tmp: Path.tmp,
    bin: Path.bin,
    log: Path.log,
    repos: Path.repos,
    ...input,
  }
}

export const layer = Layer.effect(
  Service,
  Effect.sync(() => Service.of(make())),
)

export const defaultLayer = layer

export const layerWith = (input: Partial<Interface>) =>
  Layer.effect(
    Service,
    Effect.sync(() => Service.of(make(input))),
  )

export * as Global from "./global"
