#!/usr/bin/env bun
import { $ } from "bun"
import { existsSync, mkdirSync, rmSync, chmodSync, cpSync } from "node:fs"
import { join, resolve, dirname } from "node:path"

const ALL_TARGETS = [
  { target: "linux-x64", cliDir: "@kilocode/cli-linux-x64", binary: "kilo" },
  { target: "linux-arm64", cliDir: "@kilocode/cli-linux-arm64", binary: "kilo" },
  { target: "alpine-x64", cliDir: "@kilocode/cli-linux-x64-musl", binary: "kilo" },
  { target: "alpine-arm64", cliDir: "@kilocode/cli-linux-arm64-musl", binary: "kilo" },
  { target: "darwin-x64", cliDir: "@kilocode/cli-darwin-x64", binary: "kilo" },
  { target: "darwin-arm64", cliDir: "@kilocode/cli-darwin-arm64", binary: "kilo" },
  { target: "win32-x64", cliDir: "@kilocode/cli-windows-x64", binary: "kilo.exe" },
  { target: "win32-arm64", cliDir: "@kilocode/cli-windows-arm64", binary: "kilo.exe" },
]

const fastFlag = process.argv.includes("--fast")
const rawTarget = process.argv.flatMap((a, i) =>
  a.startsWith("--target=") ? [a.slice("--target=".length)]
  : a === "--target" && process.argv[i + 1] ? [process.argv[i + 1]]
  : []
)[0] ?? "linux-x64"

const target = ALL_TARGETS.find((t) => t.target === rawTarget)
if (!target) {
  console.error(`Unknown target: ${rawTarget}. Valid: ${ALL_TARGETS.map((t) => t.target).join(", ")}`)
  process.exit(1)
}

const pkg = await Bun.file("packages/kilo-vscode/package.json").json()
const version = pkg.version

const cliDistDir = "packages/opencode/dist"
const vscodeRoot = "packages/kilo-vscode"
const binDir = "packages/kilo-vscode/bin"
const outDir = "packages/kilo-vscode/out"

let step = 0
const total = fastFlag ? 5 : 7 // non-fast: 7 steps; fast: 5 steps

if (!fastFlag) {
  step++
  console.log(`Step ${step}/${total} — Clean opencode dist...`)
  if (existsSync("packages/opencode/dist")) {
    rmSync("packages/opencode/dist", { recursive: true, force: true })
  }
  console.log(`Step ${step}/${total} — Clean opencode dist... done`)

  step++
  console.log(`Step ${step}/${total} — Build CLI...`)
  await $`bun run build --single --skip-install`.cwd("packages/opencode/")
  console.log(`Step ${step}/${total} — Build CLI... done`)
}

step++
console.log(`Step ${step}/${total} — Rebuild SDK...`)
await $`bun run rebuild-sdk`.cwd(vscodeRoot)
console.log(`Step ${step}/${total} — Rebuild SDK... done`)

step++
console.log(`Step ${step}/${total} — Typecheck...`)
await $`bun run check-types`.cwd(vscodeRoot)
console.log(`Step ${step}/${total} — Typecheck... done`)

step++
console.log(`Step ${step}/${total} — Lint...`)
await $`bun run lint`.cwd(vscodeRoot)
console.log(`Step ${step}/${total} — Lint... done`)

step++
console.log(`Step ${step}/${total} — Build extension...`)
await $`node esbuild.js --production`.cwd(vscodeRoot)
console.log(`Step ${step}/${total} — Build extension... done`)

const sourceBinary = join(cliDistDir, target.cliDir, "bin", target.binary)
if (!existsSync(sourceBinary)) {
  throw new Error(`CLI binary not found at ${sourceBinary}`)
}

if (existsSync(binDir)) {
  rmSync(binDir, { recursive: true, force: true })
}
mkdirSync(binDir, { recursive: true })

const targetBinary = join(binDir, target.binary)
cpSync(sourceBinary, targetBinary)

const sourceTsDir = join(dirname(sourceBinary), "tree-sitter")
const targetTsDir = join(binDir, "tree-sitter")
cpSync(sourceTsDir, targetTsDir, { recursive: true })

if (target.binary !== "kilo.exe") {
  chmodSync(targetBinary, 0o755)
}

console.log(`Step ${step}/${total} — Copy CLI binary... done`)
step++

mkdirSync(outDir, { recursive: true })

console.log(`Step ${step}/${total} — Package VSIX...`)
const vsixName = `nano-vscode-${target.target}-${version}.vsix`
const vsixPath = resolve(vscodeRoot, "out", vsixName)
await $`bunx --package=@vscode/vsce vsce package --no-dependencies --skip-license --target ${target.target} -o ${vsixPath}`.env({
  ...process.env,
  npm_config_ignore_scripts: "true",
}).cwd(vscodeRoot)

console.log(`Done! Output: ${vsixPath}`)
