import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.output/**',
      '**/.nitro/**',
      '**/.tanstack/**',
      '**/node_modules/**',
      '**/*.gen.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
    },
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      ...reactHooks.configs.recommended.rules,

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // The library must stay SSR-safe: no bare DOM globals at module scope.
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'Guard DOM access — this code must run during SSR.' },
        { name: 'document', message: 'Guard DOM access — this code must run during SSR.' },
        { name: 'localStorage', message: 'Guard DOM access — this code must run during SSR.' },
      ],

      // Never silently drop a focus indicator (WCAG 2.4.7 / 2.4.13).
      'jsx-a11y/no-autofocus': 'error',
    },
  },

  {
    files: ['**/*.test.{ts,tsx}', '**/*.test-d.ts', '**/scripts/**', '**/*.config.{ts,js}'],
    rules: {
      'no-restricted-globals': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  prettier,
);
