import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

import { preserveUseClient } from './plugins/preserve-use-client.js';
import { emitStyles } from './plugins/emit-styles.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const srcDir = resolve(root, 'src');

/**
 * Every `index.ts` under `src/` is an entry point.
 *
 * Deriving entries from the filesystem rather than listing them by hand means
 * adding a component cannot silently fail to be publishable — the entry appears
 * the moment the folder does. The `exports` map in package.json is still
 * written by hand on purpose: what we publish should be a deliberate decision,
 * and `publint` + `attw` verify the two agree.
 */
function collectEntries(dir: string, entries: Record<string, string> = {}): Record<string, string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);

    if (statSync(path).isDirectory()) {
      if (name === 'test' || name === 'source') continue;
      collectEntries(path, entries);
      continue;
    }

    if (name !== 'index.ts') continue;

    const key = relative(srcDir, path).replace(/\.ts$/, '').replaceAll('\\', '/');
    entries[key] = path;
  }

  // `src/tokens/source` is skipped above as a directory, but the token source
  // is still reachable through `src/tokens/index.ts`, which is what we want:
  // one entry, not one per token file.
  return entries;
}

const entries = collectEntries(srcDir);

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
      // `bundleTypes` is left off deliberately: one .d.ts per module, mirroring
      // the JS output. Rolling every type into a single bundle would collapse
      // the per-subpath type resolution that the exports map depends on.
      outDirs: ['dist'],
      entryRoot: 'src',
    }),
    preserveUseClient(),
    emitStyles(),
  ],

  css: {
    modules: {
      /**
       * Deterministic, readable class names.
       *
       * The hash keeps collisions impossible; the readable prefix means a
       * consumer inspecting an element sees `luntra-button__root__a1b2c` and
       * knows exactly what they are looking at. Overrides should still target
       * `[data-luntra-part]`, which is stable across releases — this is a
       * debugging aid, not a public API.
       */
      generateScopedName: 'luntra-[name]__[local]__[hash:base64:5]',
    },
  },

  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    // Readable output: this is a library, and consumers minify it themselves
    // with full knowledge of their own browser targets.
    minify: false,
    cssCodeSplit: true,

    lib: {
      entry: entries,
      formats: ['es'],
    },

    rollupOptions: {
      // Never bundle React. Two copies of React in one app is a hard failure,
      // and `react/jsx-runtime` is easy to miss.
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom/server',
        'react-dom/client',
      ],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '_chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Preserve the source module graph so a consumer importing
        // `@luntra-ui/react/button` pulls in one component's code and CSS, not
        // the whole library.
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
