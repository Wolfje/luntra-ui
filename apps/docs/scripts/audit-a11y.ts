/*
 * Runs axe over the *server-rendered* HTML of every documentation route.
 *
 * Why the server-rendered HTML specifically, when the components already have
 * axe tests of their own:
 *
 *   - It is what assistive technology meets first, and — for a reader whose
 *     JavaScript is still downloading, blocked, or broken — the only thing it
 *     ever meets. A page that only becomes accessible after hydration is not
 *     an accessible page.
 *   - Component tests render one component into an empty document. They can
 *     never see the failures that only exist at document scope: a missing or
 *     duplicated landmark, a heading level that skips, two elements colliding
 *     on the same `id`, a skip link pointing at a target that isn't focusable,
 *     a page with no `<title>` or no `lang`. Those are the failures that
 *     affect every page at once, which makes them the expensive ones.
 *
 * This runs against the real preview server rather than a mocked handler, so
 * whatever the build actually emits is what gets audited.
 */
import { spawn } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { JSDOM, VirtualConsole } from 'jsdom';

/*
 * Type-only. The value import happens later and deliberately late — see
 * `loadAxe` below.
 */
import type * as AxeCore from 'axe-core';
import type { Result, RunOptions } from 'axe-core';

const DOCS_ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT_DIR = join(DOCS_ROOT, 'src', 'content');
const PORT = 4173;
/*
 * `localhost` rather than `127.0.0.1`, to match whatever Vite bound to. On
 * Windows and on modern Node, `localhost` resolves to `::1` before `127.0.0.1`,
 * so a server listening on the IPv6 loopback is invisible to a client that
 * hard-codes the IPv4 one — a connection refused that looks exactly like a
 * server that failed to start.
 */
const ORIGIN = `http://localhost:${PORT}`;
const SERVER_TIMEOUT_MS = 60_000;

/*
 * jsdom loads no stylesheets, so every element computes to the same
 * transparent-on-transparent colour and every box to zero. Two rules depend
 * entirely on that layout and would report noise rather than findings:
 *
 *   color-contrast — covered properly by tokens.contrast.test.ts, which checks
 *     every foreground/background pair across brand x theme x state against
 *     the WCAG formula rather than guessing from a screenshot.
 *   target-size — covered by the token gate too, plus the Button CSS asserts a
 *     minimum height directly.
 *
 * Neither is being waived; both are checked somewhere they can actually be
 * measured.
 */
const DISABLED_RULES = ['color-contrast', 'target-size'];

/** Every route the site serves, derived from the content files themselves. */
function discoverRoutes(): string[] {
  const files: string[] = [];

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.mdx')) files.push(full);
    }
  };

  walk(CONTENT_DIR);

  const docRoutes = files
    .map((file) => relative(CONTENT_DIR, file).split(sep).join('/'))
    .map((slug) => `/docs/${slug.replace(/\.mdx$/, '')}`)
    .sort();

  if (docRoutes.length === 0) {
    throw new Error(
      `No .mdx content found in ${CONTENT_DIR}. The audit would pass by ` +
        `auditing nothing, which is worse than failing.`,
    );
  }

  return ['/', ...docRoutes];
}

async function waitForServer(signal: AbortSignal): Promise<void> {
  const deadline = Date.now() + SERVER_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (signal.aborted) throw new Error('Preview server exited before it was ready.');

    try {
      const response = await fetch(ORIGIN, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
    } catch {
      // Not listening yet. Expected for the first second or two.
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Preview server did not respond on ${ORIGIN} within ${SERVER_TIMEOUT_MS}ms.`);
}

interface RouteResult {
  route: string;
  violations: Result[];
}

type Axe = typeof AxeCore;

/*
 * axe-core resolves `window` and `document` when the module is *evaluated*,
 * not when `run` is called — so setting the globals afterwards has no effect
 * and it throws "Required window or document globals not defined". The fix is
 * ordering: stand up one jsdom window, install it, and only then import axe.
 *
 * One window for the whole run rather than one per route is a consequence of
 * the same constraint. axe stays bound to whichever window existed at import,
 * so a fresh JSDOM per route would be audited by an axe still pointing at the
 * first one. Each route replaces the document in place instead.
 */
async function loadAxe(): Promise<{ axe: Axe; window: JSDOM['window'] }> {
  const dom = new JSDOM('<!doctype html><html lang="en"><body></body></html>', {
    url: ORIGIN,
    // Swallow jsdom's complaints about CSS it cannot parse. Those are about
    // jsdom's stylesheet support, not about the page.
    virtualConsole: new VirtualConsole(),
  });

  const globals = globalThis as unknown as Record<string, unknown>;
  globals.window = dom.window;
  globals.document = dom.window.document;

  /*
   * axe-core is a UMD/CommonJS module using `export =`, so Node's ESM interop
   * hands back a namespace object with the real API on `.default`. The
   * fallback covers the day it ships a proper ESM build and `.default`
   * disappears.
   */
  const mod = (await import('axe-core')) as unknown as Axe & { default?: Axe };
  const axe = mod.default ?? mod;

  if (typeof axe.run !== 'function') {
    throw new Error('Imported axe-core but found no `run` function — the interop shape changed.');
  }

  return { axe, window: dom.window };
}

async function auditRoute(axe: Axe, window: JSDOM['window'], route: string): Promise<RouteResult> {
  const response = await fetch(`${ORIGIN}${route}`);

  if (!response.ok) {
    throw new Error(`${route} returned ${response.status} ${response.statusText}.`);
  }

  const html = await response.text();

  /*
   * open/write/close rather than assigning innerHTML. innerHTML on
   * documentElement cannot replace the `<html>` element itself, so its
   * attributes would survive from the previous route — and `lang` and
   * `data-theme` live there. `html-has-lang` would then pass on every page
   * after the first regardless of what the server actually sent: a false green
   * on one of the few rules that affects an entire document.
   *
   * jsdom runs no scripts here (`runScripts` is off by default), so this stays
   * an audit of the server's HTML rather than of a half-hydrated app.
   */
  window.document.open();
  window.document.write(html);
  window.document.close();

  const results = await axe.run(window.document, {
    resultTypes: ['violations'],
    rules: Object.fromEntries(
      DISABLED_RULES.map((id) => [id, { enabled: false }]),
    ) as RunOptions['rules'],
  });

  return { route, violations: results.violations };
}

function report(results: RouteResult[]): boolean {
  let clean = true;

  for (const { route, violations } of results) {
    if (violations.length === 0) {
      console.log(`  \u2713 ${route}`);
      continue;
    }

    clean = false;
    console.log(`  \u2717 ${route} \u2014 ${violations.length} violation(s)`);

    for (const violation of violations) {
      console.log(`      [${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help}`);
      console.log(`      ${violation.helpUrl}`);

      for (const node of violation.nodes) {
        console.log(`        at ${node.target.join(' ')}`);
        // The failure summary is the part that says what to actually change.
        if (node.failureSummary) {
          console.log(
            node.failureSummary
              .split('\n')
              .map((line) => `          ${line.trim()}`)
              .join('\n'),
          );
        }
      }
    }
  }

  return clean;
}

async function main(): Promise<void> {
  const routes = discoverRoutes();

  console.log(`Auditing ${routes.length} server-rendered route(s) with axe-core.\n`);

  const controller = new AbortController();
  const server = spawn(
    'node',
    [join(DOCS_ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', String(PORT)],
    { cwd: DOCS_ROOT, stdio: ['ignore', 'ignore', 'pipe'], shell: false },
  );

  /*
   * Kept rather than piped straight through: the server's normal startup
   * chatter is noise, but if it dies the reason is the only useful thing on
   * screen, and "did not respond within 60s" on its own sends you looking in
   * the wrong place.
   */
  let serverStderr = '';
  server.stderr?.on('data', (chunk: Buffer) => {
    serverStderr += chunk.toString();
  });

  server.once('exit', () => controller.abort());

  try {
    try {
      await waitForServer(controller.signal);
    } catch (error) {
      if (serverStderr.trim()) {
        console.error(`Preview server output:\n${serverStderr}`);
      }
      throw error;
    }

    const { axe, window } = await loadAxe();

    const results: RouteResult[] = [];
    for (const route of routes) {
      results.push(await auditRoute(axe, window, route));
    }

    const clean = report(results);

    if (!clean) {
      console.error('\nAccessibility audit failed.');
      process.exitCode = 1;
      return;
    }

    console.log(
      `\nNo violations across ${routes.length} route(s). ` +
        `(${DISABLED_RULES.join(', ')} are checked by the token tests instead \u2014 ` +
        `jsdom applies no stylesheets, so they cannot be measured here.)`,
    );
  } finally {
    server.kill();
  }
}

await main();
