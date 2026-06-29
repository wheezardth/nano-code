// Bun test preload — runs once per test worker before any test file.
// IMPORTANT: env vars must be set before ANY module import so Flag.KILO_DB etc.
// are read with the correct values during module initialization.
process.env.KILO_DB = ":memory:"
process.env.KILO_DISABLE_PROJECT_CONFIG = "1"
process.env.KILO_DISABLE_MODELS_FETCH = "1"

// Dynamic import so the DB flag is already set when server/projectors.ts loads
const { initProjectors } = await import("../src/server/projectors")
initProjectors()
