import { readFile, readdir } from 'node:fs/promises';
import { join, posix, relative, resolve } from 'node:path';

import type { Plugin } from 'vite';

/** A CSS file already emitted into the bundle by Vite's CSS-module handling. */
interface CssAsset {
  fileName: string;
  source: string | Uint8Array;
}

/**
 * Ships the library's plain CSS as real files, and builds the aggregated
 * `@luntra-ui/react/styles` entry.
 *
 * ## Why a plugin instead of letting Vite handle it
 *
 * `src/styles/*.css` are global stylesheets that no JavaScript module imports —
 * tokens, theme layers and the reset. Vite only emits CSS that something in the
 * module graph pulls in, so without this they would simply not be published,
 * and every `./styles/*` subpath in the exports map would 404.
 *
 * ## What it produces
 *
 * - `dist/styles/**` — each source stylesheet, verbatim, so consumers can pick
 *   exactly the layers they want (`./styles/themes/dark.css` and friends).
 * - `dist/styles/index.css` — everything, inlined in dependency order, with the
 *   component CSS appended.
 *
 * The aggregate is inlined rather than left as `@import` statements on purpose:
 * a consumer who drops it in a plain `<link>` gets one request instead of a
 * waterfall, and a consumer running it through a bundler sees no difference.
 */
export function emitStyles(): Plugin {
  const srcStyles = resolve(process.cwd(), 'src/styles');

  return {
    name: 'luntra:emit-styles',
    apply: 'build',

    async generateBundle(_options, bundle) {
      // Snapshot before emitting, so the files this plugin adds are not mistaken
      // for component CSS on a later pass.
      const componentCss: CssAsset[] = [];

      for (const entry of Object.values(bundle)) {
        if (entry.type === 'asset' && entry.fileName.endsWith('.css')) {
          componentCss.push({ fileName: entry.fileName, source: entry.source });
        }
      }

      componentCss.sort((a, b) => a.fileName.localeCompare(b.fileName));
      const files = await collectCss(srcStyles);

      for (const file of files) {
        const relPath = posix.join(...relative(srcStyles, file).split(/[\\/]/));
        if (relPath === 'index.css') continue;

        this.emitFile({
          type: 'asset',
          fileName: posix.join('styles', relPath),
          source: await readFile(file, 'utf8'),
        });
      }

      this.emitFile({
        type: 'asset',
        fileName: 'styles/index.css',
        source: await buildAggregate(srcStyles, componentCss),
      });
    },
  };
}

/** Every `.css` file under `src/styles`, recursively. */
async function collectCss(dir: string, found: string[] = []): Promise<string[]> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      await collectCss(path, found);
    } else if (entry.name.endsWith('.css')) {
      found.push(path);
    }
  }

  return found.sort();
}

/**
 * Concatenate the global layers followed by the component CSS.
 *
 * Layer order is read out of `src/styles/index.css` rather than hardcoded here,
 * so the source file stays the single place that decides cascade order. If a
 * layer is added there and forgotten here, nothing silently drops out.
 */
async function buildAggregate(
  srcStyles: string,
  componentCss: readonly CssAsset[],
): Promise<string> {
  const entry = await readFile(join(srcStyles, 'index.css'), 'utf8');
  const imports = [...entry.matchAll(/@import\s+['"]\.\/([^'"]+)['"]\s*;/g)].map((m) => m[1]!);

  if (imports.length === 0) {
    throw new Error(
      'src/styles/index.css declares no @import rules. The aggregated stylesheet ' +
        'would ship empty, so this is treated as a build failure rather than a warning.',
    );
  }

  const parts: string[] = [
    '/*\n' +
      ' * @luntra-ui/react/styles\n' +
      ' *\n' +
      ' * Generated at build time. Do not edit.\n' +
      ' * Import the individual layers instead if you want a smaller payload.\n' +
      ' */',
  ];

  for (const name of imports) {
    const source = await readFile(join(srcStyles, ...name.split('/')), 'utf8');
    parts.push(`/* ${name} */\n${stripImports(source).trim()}`);
  }

  for (const asset of componentCss) {
    const source = typeof asset.source === 'string' ? asset.source : decode(asset.source);
    parts.push(`/* ${asset.fileName} */\n${stripImports(source).trim()}`);
  }

  return `${parts.join('\n\n')}\n`;
}

/**
 * Drop `@import` rules from an inlined layer.
 *
 * Their targets are already inlined by the caller, and a stray `@import` after
 * the first rule is invalid CSS that browsers discard silently.
 */
function stripImports(css: string): string {
  return css.replace(/@import\s+['"][^'"]+['"]\s*;/g, '');
}

function decode(source: Uint8Array): string {
  return new TextDecoder().decode(source);
}
