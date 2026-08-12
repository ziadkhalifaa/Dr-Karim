// ESM loader hook — resolves extensionless relative imports in the frontend
// Vite sources (src/features/assessment/logic/*.js use `./conditions`,
// `../data/questions`). Node ESM requires explicit `.js`, so this hook retries
// a failed relative specifier by appending the extension ONLY for paths that
// actually need it. The production app keeps Vite's resolver; this is a
// dev/seed-time accommodation so seeds and verifiers read the SAME source files.
//
// Registered per-process by the scripts that need it (seed.js, verifier).
// Usage: module.register(new URL("./esm-loader.mjs", import.meta.url))

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      !specifier.endsWith(".js")
    ) {
      return nextResolve(`${specifier}.js`, context);
    }
    throw err;
  }
}