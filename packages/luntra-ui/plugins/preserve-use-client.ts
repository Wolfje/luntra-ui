import type { Plugin } from 'vite';

/**
 * Re-emits `"use client"` directives that the bundler strips.
 *
 * ## Why this is needed
 *
 * Bundlers treat a top-of-file `"use client"` as a meaningless string
 * expression and drop it while assembling chunks. React Server Components rely
 * on that directive to mark the client boundary, so a library that loses it
 * breaks in RSC apps with errors like "useState is not a function" that point
 * nowhere near the real cause.
 *
 * There is no bundler option for this, so the directive is reapplied after
 * chunk rendering.
 *
 * ## Why not put it on everything
 *
 * `"use client"` opts a module *out* of server rendering. Applying it blanket
 * would drag pure helpers and token data across the boundary for no reason and
 * bloat every consumer's client bundle. A chunk gets the directive only when a
 * module that actually declared it ended up inside.
 */
export function preserveUseClient(): Plugin {
  const DIRECTIVE = "'use client';";

  /** Module ids whose source declared the directive. */
  const clientModules = new Set<string>();

  return {
    name: 'luntra:preserve-use-client',
    apply: 'build',

    transform(code, id) {
      if (hasUseClientPrologue(code)) {
        clientModules.add(id);
      }
      return null;
    },

    renderChunk(code, chunk) {
      const needsDirective = chunk.moduleIds.some((id) => clientModules.has(id));

      if (!needsDirective || /^\s*['"]use client['"]/.test(code)) {
        return null;
      }

      return { code: `${DIRECTIVE}\n${code}`, map: null };
    },
  };
}

/**
 * Look for the directive in the module prologue only.
 *
 * A directive is only a directive at the top of a file. Matching anywhere would
 * let a comment or an unrelated string mentioning "use client" pull an entire
 * chunk across the server boundary.
 */
function hasUseClientPrologue(code: string): boolean {
  const prologue = code.slice(0, 1024);
  return /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*['"]use client['"]\s*;?/.test(prologue);
}
