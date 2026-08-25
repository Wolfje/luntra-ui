import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Three test projects, because the three kinds of failure we care about need
 * genuinely different environments:
 *
 *   unit  — behaviour and pure logic, in a DOM
 *   a11y  — axe-core scans, which need a *real* DOM implementation
 *   ssr   — node, no DOM at all, to catch anything that assumes `window`
 *
 * The `ssr` project is the important one: it fails if a component touches the
 * DOM during render, which is the single most common way a component library
 * breaks server rendering.
 *
 * `jsdom` rather than `happy-dom` is deliberate — happy-dom's incomplete
 * `Node.prototype.isConnected` makes axe-core misreport, so a11y results there
 * cannot be trusted.
 */
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: 'unit',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.a11y.test.tsx', 'src/**/*.ssr.test.tsx'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'a11y',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.a11y.test.tsx'],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'ssr',
          globals: true,
          environment: 'node',
          setupFiles: ['./src/test/setup.ssr.ts'],
          include: ['src/**/*.ssr.test.tsx'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/index.ts', 'src/test/**', 'src/tokens/source/**'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
