import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Asserts the published contract against real build output.
 *
 * Everything here is a promise the package makes to consumers that no other
 * test can catch, because every other test runs against `src/`. A stripped
 * `"use client"` directive, a missing `exports` target or React accidentally
 * inlined into the bundle all look perfectly healthy in source and only fail
 * in someone else's application.
 *
 * Skipped when `dist/` is absent so `pnpm test` stays useful without a build;
 * CI always builds first, so the assertions are never quietly skipped there.
 */

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dist = resolve(pkgRoot, 'dist');

const pkg = JSON.parse(readFileSync(resolve(pkgRoot, 'package.json'), 'utf8')) as {
  exports: Record<string, string | Record<string, string>>;
};

const built = existsSync(dist);

describe.skipIf(!built)('build output', () => {
  describe('exports map', () => {
    const targets = Object.entries(pkg.exports).flatMap(([subpath, target]) => {
      const paths = typeof target === 'string' ? [target] : Object.values(target);
      return paths.map((path) => ({ subpath, path }));
    });

    it.each(targets.filter(({ path }) => !path.includes('*')))(
      '$subpath resolves to an existing file ($path)',
      ({ path }) => {
        expect(existsSync(resolve(pkgRoot, path)), `${path} is missing from the package`).toBe(
          true,
        );
      },
    );
  });

  describe('"use client" directives', () => {
    /**
     * Bundlers treat a top-of-file directive as a dead string expression and
     * drop it. Losing it breaks React Server Components with errors that point
     * nowhere near the cause, so it is asserted rather than assumed.
     */
    it('survives bundling on the theme provider', () => {
      const code = readFileSync(
        resolve(dist, 'components/theme-provider/theme-provider.js'),
        'utf8',
      );
      expect(code).toMatch(/^['"]use client['"];/);
    });

    /**
     * The barrel must NOT carry the directive. `"use client"` opts a module out
     * of server rendering, and a barrel that re-exports one client component
     * would drag every future server-safe export across the boundary with it.
     */
    it('is not applied to the top-level barrel', () => {
      const code = readFileSync(resolve(dist, 'components/index.js'), 'utf8');
      expect(code).not.toMatch(/^['"]use client['"];/);
    });

    it('is not applied to pure modules', () => {
      for (const file of ['utils/dom.js', 'tokens/index.js', 'tokens/contrast.js']) {
        const code = readFileSync(resolve(dist, file), 'utf8');
        expect(code, `${file} should stay server-renderable`).not.toMatch(/^['"]use client['"];/);
      }
    });
  });

  describe('externals', () => {
    /**
     * Two copies of React in one application is a hard failure, and
     * `react/jsx-runtime` is the one that is easy to bundle by accident.
     */
    it('imports React rather than inlining it', () => {
      const code = readFileSync(
        resolve(dist, 'components/theme-provider/theme-provider.js'),
        'utf8',
      );
      expect(code).toMatch(/from\s+["']react["']/);
      expect(code).not.toContain('function useState(');
    });
  });

  describe('stylesheets', () => {
    it('ships every theme layer as a standalone file', () => {
      for (const file of [
        'styles/tokens.css',
        'styles/reset.css',
        'styles/themes/light.css',
        'styles/themes/dark.css',
        'styles/themes/brands/default.css',
        'styles/themes/brands/teal.css',
      ]) {
        expect(existsSync(resolve(dist, file)), `${file} is missing`).toBe(true);
      }
    });

    it('inlines every layer into the aggregate entry', () => {
      const aggregate = readFileSync(resolve(dist, 'styles/index.css'), 'utf8');

      // No @import: the aggregate exists so a plain <link> costs one request.
      expect(aggregate).not.toMatch(/@import/);

      expect(aggregate).toContain('--luntra-color-neutral-950');
      expect(aggregate).toContain("[data-theme='dark']");
      expect(aggregate).toContain("[data-brand='teal']");
      expect(aggregate).toContain('prefers-reduced-motion');
    });
  });
});
