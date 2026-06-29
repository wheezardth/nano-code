# nano rebrand — user-facing strings (1782748512607-nano-rebrand-user-facing.md)

> Plan for replacing all user-facing kilo/kilo.ai identifiers with nano/nanocode.
> The plan only touches surfaces the user interacts with directly — package managers, XDG paths, dotfile directories, config filenames, TUI branding strings, binary names, VS Code extension assets/identifiers, READMEs, and editor help.
> Everything else stays: `@kilocode/*` npm scope, `kilocode/` sidecar directory, Kotlin `ai.kilocode.*` packages, `User-Agent` headers, `.opencode/` legacy dirs.

---

## Design decisions

| Item | Decision |
|---|---|
| Binary name | `nanocode` (not `nano` — conflicts with Linux `nano(1)`) |
| Workspace dotfile dirs | New default: `.nano/` (`.kilo/`, `.kilocode/` remain as legacy read fallbacks, never created) |
| Config filenames | `nano.json`/`nano.jsonc` (read `kilo.json`/`kilo.jsonc` as legacy fallback, write only `nano.json`) |
| XDG/global paths | `kilo` → `nanocode` in core `app` variable |
| XDG migration | On first run, move existing `~/.kilo/`/`~/.config/kilo/` → `~/.nanocode/`/`~/.config/nanocode/` |
| VS Code extension ID | `kilocode.kilo-code` → `nano.kilo-code` (breaking — existing extension cache wiped intentionally) |
| VS Code editor schema | Static local JSON schema; generated on startup, written to `~/.config/nano/config-schema.json` |
| `$schema` in user configs | Stripped on write (not on load) — no stale remote URLs written |
| TUI strings | `"Kilo CLI"` → `"Nano CLI"`, `"Kilo"` → `"Nano"` |
| Icon files | `kilo-*` → `nano-*` |
| READMEs | Update extension IDs, remove/replace `kilo.ai` URLs where user-facing |
| `kilodev` dev launcher | Keep but rename references to `nanocode` |
| `kilo.ai` doc URLs | Remove where no docs site exists; update attribution link |

---

## Phase 1 — Core paths (XDG + dotfile + config filenames)

### Task 1.1: `packages/core/src/global.ts` — rename `app`

- **Line 11**: `const app = "kilo"` → `const app = "nanocode"`
- This changes all XDG paths: `~/.local/share/nanocode/`, `~/.config/nanocode/`, `~/.cache/nanocode/`, `~/.local/state/nanocode/`

### Task 1.2: `packages/core/src/global.ts` — add XDG migration

After `const app = "nanocode"` block, add a migration that runs **once** before path creation:

```ts
// Migrate XDG paths from old "kilo" to new "nanocode", preserving all data.
const oldData = path.join(clean(xdgData)!, "kilo")
const oldConfig = path.join(clean(xdgConfig)!, "kilo")
const oldCache = path.join(clean(xdgCache)!, "kilo")
const oldState = path.join(clean(xdgState)!, "kilo")
const newData = path.join(clean(xdgData)!, app)
const newConfig = path.join(clean(xdgConfig)!, app)
const newCache = path.join(clean(xdgCache)!, app)
const newState = path.join(clean(xdgState)!, app)

function migrateMkdir(src: string, dst: string) {
  // Move entire directory tree; handle both existing-dst and nonexisting-dst gracefully
  if (!existsSync(dst)) {
    if (existsSync(src)) return fs.renameSync(src, dst)
  }
}

migrateMkdir(oldData, newData)
migrateMkdir(oldConfig, newConfig)
migrateMkdir(oldCache, newCache)
migrateMkdir(oldState, newState)
```

Handle `EEXIST` (dst exists with different data) gracefully — log a one-time warning, proceed with new paths (user starts fresh). Handle `EACCES` — also proceed with new paths, log error, don't crash startup.

### Task 1.3: Project dotfile directories (all in `packages/opencode/src/kilocode/`)

Update every file below to accept `.nano/` as the new default while keeping `.kilo/` and `.kilocode/` as legacy fallbacks:

| File | What changes |
|---|---|
| `config/config.ts` | Add `".nano"` to `KILO_DIR_SUFFIXES`; add to `COMMAND_PATTERNS` and `AGENT_PATTERNS`; update `projectConfigUpdateTarget` default → `path.join(input.directory, ".nano", "nano.jsonc")` |
| `paths.ts` | Add `".nano"` to `skillDirectories()` walk targets |
| `workflows-migrator.ts` | Add `".nano/workflows"` to source dirs |
| `rules-migrator.ts` | Add `".nano/rules/"` to source dirs |
| `project-id.ts` | Add `".nano/config.json"` to priority read chain |
| `mcp-migrator.ts` | Add `".nano/mcp.json"/".nano/mcp.jsonc"` patterns |
| `permission/config-paths.ts` | Add `".nano/"` to `CONFIG_DIRS`; add `"nanocode"` to `configs()` fallback; add `.nanocode/` to `fallback()` checks |
| `system-prompt.ts` (line 18) | `.kilo/command/` → `.nano/command/` |
| `agent/builder.ts` (line 77) | Update agent path |
| `snapshot/track.ts` (line 18) | Comment only |
| `cli/cmd/uninstall.ts` (lines 269, 297, 303) | Add `.nano/bin` to cleanup targets |

**Key constraint on `config/config.ts`:** Do **not** remove `.kilo/` and `.kilocode/` from the read chain. They stay in `ALL_CONFIG_DIR_SUFFIXES` for legacy reading. The write target (in `projectConfigUpdateTarget`) should prefer `.nano/`.

### Task 1.4: Config file names (all in `packages/opencode/src/kilocode/`)

Add `nano.json`/`nano.jsonc` as new config file names while keeping `kilo.json`/`kilo.jsonc` as legacy fallbacks:

| File | Change |
|---|---|
| `config/config.ts` (line 308) | `GLOBAL_CONFIG_FILES` — add `"nano.json"`, `"nano.jsonc"` to end; add to write target list |
| `config/config.ts` (line 450) | `projectConfigUpdateTarget` default path → `.nano/nano.jsonc` |
| `config/config.ts` (line 134) | `overlay.ts` candidate list — add `"nano.jsonc"`, `"nano.json"` |
| `permission/config-paths.ts` — `CONFIG_ROOT_FILES` — add `"nano.json"`, `"nano.jsonc"`; keep `"kilo.json"`, `"kilo.jsonc"` as legacy |
| `config/global-stamp.ts` (line 6) — add `"nano.json"`, `"nano.jsonc"` |
| `config/sources.ts` (line 60) — add `"nano.json"`, `"nano.jsonc"` to global sources |
| `cli/cmd/tui/feature-plugins/home/tips.ts` — update tip text referencing config files |

**Constraint:** Read chain must check `nano.json` first, then `kilo.json`/`kilo.jsonc`/`opencode.json`/`opencode.jsonc`. Write target: `nano.json` (or `nano.jsonc` for editable configs).

### Task 1.5: Remove dead `$schema: https://app.kilo.ai/config.json` injection points

`app.kilo.ai` is dead — the remote JSON Schema endpoint that VS Code would fetch for editor autocomplete no longer exists. We replace this with a local schema (see Phase 3.6). Strip all write-time injection of the remote URL:

| File | Line(s) | Change |
|---|---|---|
| `config/config.ts` | 562–563 | Delete `$schema` assignment; don't inject `$schema` when writing |
| `config/config.ts` | 591 | Delete `$schema` seed in global config default |
| `config/config.ts` | 610 | Delete `$schema` in migration block |
| `config/config.ts` | 771 | Delete `$schema` in remote config block |
| `tui/config/tui-migrate.ts` | 15 | Delete `TUI_SCHEMA_URL` entirely (no server, no validation needed — `tui.json` was never live) |

On **load**, leave `$schema` field in the parsed config object alone — don't mutate user files on read (decision 2 from earlier discussion).

---

## Phase 2 — Local JSON Schema for editor autocomplete

### Task 2.1: Generate schema at startup

On each CLI initialization, serialize `Config.Info` (Effect Schema) to JSON Schema and write it to `~/.config/nano/config-schema.json`.

**File:** `packages/opencode/src/config/config.ts` — add near the top after imports:

```ts
import { Schema } from "effect"
import { existsSync, writeFileSync } from "fs"
import { Global } from "@opencode-ai/core/global"

writeFileSync(
  path.join(Global.Path.config, "config-schema.json"),
  JSON.stringify(Schema.toJsonSchemaDocument(Config.Info, { additionalProperties: true }).schema, null, 2),
)
```

Wrap in try/catch — if write fails, proceed anyway (just no editor autocomplete).

### Task 2.2: Point new configs at local schema

When creating/updating config files that previously injected `https://app.kilo.ai/config.json`, the `$schema` field can either be:
- **Omitted entirely** (no editor autocomplete, no errors) — simplest
- **Set to the local file path** — `file://<Global.Path.config>/config-schema.json` — provides full editor autocomplete

Recommend: **omit** for now. If a user adds a `$schema` comment manually or the editor supports it via other means, it's fine. Adding a local file-path `$schema` would only work in VS Code (which supports `file://` schema references) but not in other editors that ignore it. The simpler path is to just omit it.

---

## Phase 3 — Binary rename

### Task 3.1: `packages/opencode/package.json`

- `bin` field: `"kilo": "./bin/kilo"` → `"nanocode": "./bin/kilo"`
- Remove `"kilocode": "./bin/kilo"` entry
- `keywords`: remove `"kilo-code"`, `"kilo"` (keep `"nanocode"`)

### Task 3.2: Rename binary and related files

- Rename `bin/kilo` → `bin/nanocode`
- Rename `bin/kilodev` → `bin/nanocode-dev`
- Rename `bin/kilodev.cmd` → `bin/nanocode-dev.cmd`

### Task 3.3: Update dev-setup markers

**File:** `packages/opencode/src/kilocode/cli/dev-setup.ts`

| Line | Change |
|---|---|
| 11 | MARKER_START: `"# >>> kilodev launcher >>>"` → `"# >>> nanocode-dev launcher >>>"` |
| 12 | MARKER_END: `"# <<< kilodev launcher <<<"` → `"# <<< nanocode-dev launcher <<<"` |
| 16 | `describe` → `"install a \`nanocode-dev\` shell alias"` |
| 76 | `"Kilo CLI dev launcher setup"` → `"Nano CLI dev launcher setup"` |
| 94 | `${H}kilodev${N}` → `${H}nanocode${N}` |
| 201 | `alias kilodev` → `alias nanocode` |
| 202 | `function kilodev` → `function nanocode` |
| 203 | `alias kilodev=` → `alias nanocode=` |
| 241 | `.kilodev.bak.` → `.nanocode.bak.` |
| 298 | `KILO_DEV_REPO` → `NANOCODE_DEV_REPO` (env var rename) |
| 304 | Comment update for `bin/nanocode` |
| 315 | `"cannot locate kilocode source checkout"` → `"cannot locate nanocode source checkout"` |

---

## Phase 4 — TUI branding strings

### Task 4.1: `packages/opencode/src/kilocode/cli/cmd/tui/app.tsx`

| Line | Old | New |
|---|---|---|
| 40 | `"Kilo CLI"` | `"Nano CLI"` |
| 43 | `"https://kilo.ai/docs"` | `""` (no docs site yet) |
| 46 | `"Kilo"` | `"Nano"` |

### Task 4.2: `packages/opencode/src/kilocode/components/tips.tsx`

- Line 51: `"Kilo CLI"` → `"Nano CLI"`

### Task 4.3: `packages/opencode/src/kilocode/generate-cli-docs.ts`

- Line 32: `"Kilo CLI commands"` → `"Nano CLI commands"`

### Task 4.4: Attribution removal

**File:** `packages/opencode/src/cli/cmd/github.ts`

- Line 1418: `*Powered by [Kilo](https://kilo.ai)*` → remove the attribution line entirely (no docs site, no marketing link)

---

## Phase 5 — VS Code extension rename

### Task 5.1: Extension identifier everywhere

Replace `kilocode.kilo-code` → `nano.kilo-code` in all source and test files:

| File | Locations |
|---|---|
| `packages/kilo-vscode/src/extension.ts:408` | Deep link URI comment |
| `packages/kilo-vscode/src/KiloProvider.ts:269` | `vscode.extensions.getExtension("kilocode.kilo-code")` |
| `packages/kilo-vscode/src/KiloProvider.ts:2843` | Same pattern |
| `packages/kilo-vscode/src/agent-manager/vscode-host.ts:200` | Same pattern |
| `packages/kilo-vscode/tests/unit/server-manager-utils.test.ts:65,74` | Mock paths |
| `packages/kilo-vscode/tests/unit/roo-import.test.ts:125,142` | Mock `globalStorageUri` |
| `packages/kilo-vscode/tests/unit/legacy-migration/migration-cache.test.ts:21` | Mock `globalStorageUri` |
| `packages/kilo-vscode/tests/unit/legacy-migration/task-store.test.ts:8` | Mock dir path |
| `packages/kilo-vscode/tests/unit/file-ignore-controller.test.ts:128,142` | Mock paths |
| `packages/kilo-vscode/script/launch.ts:321` | `--disable-extension=kilocode.kilo-code` |
| `packages/opencode/src/kilocode/paths.ts:18,25,28` | `vscodeGlobalStorage()` — `kilocode.kilo-code` |
| `packages/opencode/src/kilocode/docs/migration.md:32-34,231-233` | Storage path tables |

### Task 5.2: VS Code icon file rename

Rename files (confirmed: contents already updated for new branding):

| Old | New |
|---|---|
| `assets/icons/kilo-light.svg` | `assets/icons/nano-light.svg` |
| `assets/icons/kilo-light.png` | `assets/icons/nano-light.png` |
| `assets/icons/kilo-dark.svg` | `assets/icons/nano-dark.svg` |
| `assets/icons/kilo-dark.png` | `assets/icons/nano-dark.png` |
| `assets/icons/kilo-icon-font.woff2` | `assets/icons/nano-icon-font.woff2` |
| `assets/icons/logo-outline-black.png` | _unchanged_ |

### Task 5.3: `packages/kilo-vscode/package.json` icon references

| Line | Old | New |
|---|---|---|
| 77 | `"fontPath": "assets/icons/kilo-icon-font.woff2"` | `"nano-icon-font.woff2"` |
| 87 | `"icon": "assets/icons/kilo-light.png"` | `"nano-light.png"` |
| 88 | `"darkIcon": "assets/icons/kilo-dark.png"` | `"nano-dark.png"` |
| 151 | `"assets/icons/kilo-light.svg"` | `"assets/icons/nano-light.svg"` |
| 152 | `"assets/icons/kilo-dark.svg"` | `"assets/icons/nano-dark.svg"` |
| 324 | `"assets/icons/kilo-light.svg"` | `"assets/icons/nano-light.svg"` |
| 325 | `"assets/icons/kilo-dark.svg"` | `"assets/icons/nano-dark.svg"` |

### Task 5.4: VS Code docs — `packages/kilo-docs/`

All references to `kilocode.kilo-code` → `nano.kilo-code`:

| File | Locations |
|---|---|
| `pages/index.tsx:11` | `code --install-extension kilocode.kilo-code` |
| `markdown/partials/install-vscode.md:6,18` | Badge link + install command |
| `pages/code-with-ai/agents/model-selection.md:154-199` | All `vscode://kilocode.kilo-code/...` URIs |
| `pages/getting-started/settings/auto-cleanup.md:234-236` | Storage path tables |
| `pages/customize/custom-modes.md:254-256` | Storage path tables |
| `pages/collaborate/teams/getting-started.md:53` | `vscode:extension/kilocode.kilo-code` |
| `docs/getting-started/devcontainer-persistence.md:29,45-48,72` | Storage paths + docker cp |

---

## Phase 6 — README files (21 languages)

Update all `README.*.md` in repo root (22 files including `README.md`):

Per-file changes:
- `Kilo Code` → `Nano Code` (in text and inline links)
- `vscode:extension/kilocode.kilo-code` → `vscode:extension/nano.kilo-code`
- `marketplace.visualstudio.com/items?itemName=kilocode.Kilo-Code` → `marketplace.visualstudio.com/items?itemName=nano.Nano-Code` (requires Marketplace update)

Some files also have `Kilo-Code` in image URLs and text:
- Line 12 in all READMEs: `kilocode.Kilo-Code` → `nano.Nano-Code`
- Arabic README (README.ar.md): line 37: `إضافة Kilo Code` → `إضافة Nano Code`
- Korean README (README.ko.md): line 35: `Kilo Code 확장` → `Nano Code 확장`
- Japanese README (README.ja.md): line 35: `Kilo Code 拡張機能` → `Nano Code 拡張機能`
- Chinese READMEs (README.zh.md, README.zht.md): translate `Kilo Code` → `Nano Code` in context

---

## Phase 7 — Config file name updates in non-`kilocode/` source

### Task 7.1: `packages/opencode/src/config/config.ts` — project config file list

| Line | Old | New |
|---|---|---|
| 450 | `["kilo.jsonc", "kilo.json", ...]` | Add `"nano.jsonc"`, `"nano.json"` to this list (read in order) |

The project config file search order: `nano.jsonc`, `nano.json`, `kilo.jsonc`, `kilo.json`, `opencode.jsonc`, `opencode.json`, `config.json`

---

## Phase 8 — Other user-facing strings

### Task 8.1: `packages/opencode/src/installation/index.ts`

- Line 64: `userAgent` function: `kilo/...` → `nanocode/...`(but note: this is an HTTP User-Agent header, not user-facing — **leave unchanged per scoped-out list**)

### Task 8.2: Remove `$schema` from all test files

**Files:** Every test file in `packages/opencode/test/` that asserts on `$schema: "https://app.kilo.ai/config.json"` — ~40+ files.

The rebrand script will strip these assertions. For test files, remove the `$schema` field from all mock/fixture data. For tests that explicitly assert against the string `$schema: "https://app.kilo.ai/config.json"` (like `config.test.ts`), remove the assertion.

---

## Validation

### Run after all changes:

1. `bun turbo typecheck` from repo root — ensure all packages typecheck
2. `bun test` from `packages/opencode/` — all tests pass
3. `bun run typecheck` from `packages/kilo-vscode/` — extension builds
4. `bun run lint` from `packages/kilo-vscode/` — no lint errors
5. Verify: `.kilo/` directories in test fixtures are recognized (or update them to `.nano/`)

### Manual verification:

- Run `nanocode --version` — should print version without errors
- Run `nanocode` — TUI should show "Nano CLI" in title
- `nanocode dev-setup --print` — should show `alias nanocode`
- Verify `~/.config/nanocode/` gets created on first run
- Verify a user who previously had `~/.config/kilo/` data gets that data in the new path
- Verify `nano.jsonc` is recognized as the project config name

---

## Migration / data preservation

### XDG paths
`~/.kilo/` → `~/.nanocode/` via `fs.rename()` on startup (wrapped in try/catch). If rename fails, user starts fresh with new paths — old data remains in old location untouched.

### Project dotfile directories
Read: `.nano/` (preferred), then `.kilo/`, then `.kilocode/` (legacy fallbacks, never created).
Write: `.nano/nano.json` / `.nano/nano.jsonc`.
Existing `.kilo/kilo.json` files remain valid configs and are loaded. Only new configs are written to `.nano/`.

### Config filenames
Read chain: `nano.jsonc`, `nano.json`, `kilo.jsonc`, `kilo.json`, `opencode.jsonc`, `opencode.json`, `config.json`.
Write target: `nano.json` / `nano.jsonc`.

### VS Code extension cache
Breaking change — existing user extension data in `~/.config/Code/User/globalStorage/kilocode.kilo-code/` is orphaned. User must reinstall the extension with new ID `nano.kilo-code`. This is intentional and documented as a rebrand side effect.

---

## Order of tasks (suggested execution order)

1. Phase 1.1: Core `app` rename in `global.ts`
2. Phase 1.2: XDG migration in `global.ts`
3. Phase 1.3: `.nano/` dotfile directory handling (all `kilocode/` files)
4. Phase 1.4: Config filename changes (overlay, permission, stamp, sources)
5. Phase 1.5: Remove dead `$schema` injection + `tui-migrate.ts` cleanup
6. Phase 3: Binary rename (`package.json` + `bin/` files + dev-setup)
7. Phase 4: TUI branding strings
8. Phase 5: VS Code extension ID + icon files + manifest
9. Phase 6: README files
10. Phase 2: Local JSON Schema
11. Phase 7: Config file name lists in `config.ts`
12. Phase 8: `$schema` cleanup in test fixtures
13. Validation
