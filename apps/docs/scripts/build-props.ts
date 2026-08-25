/**
 * Extracts component prop tables from the library's TypeScript source.
 *
 * This runs as a build step rather than at request time because
 * react-docgen-typescript needs a full TypeScript program — the compiler, the
 * library sources and all of `@types/react` — none of which can exist in a
 * browser. The output is a small JSON file the docs import like any other
 * module.
 *
 * The JSON is generated, so it is gitignored: a stale checked-in copy that
 * disagrees with the source is worse than no table at all.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { withCustomConfig, type PropItem } from 'react-docgen-typescript';

const here = dirname(fileURLToPath(import.meta.url));
const docsRoot = resolve(here, '..');
const libRoot = resolve(docsRoot, '../../packages/luntra-ui');

/** Components to document, keyed by the name used in `<PropsTable of="…">`. */
const SOURCES: Record<string, string> = {
  Button: 'src/components/button/button.tsx',
};

export interface DocumentedProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue: string | null;
  description: string;
  example: string | null;
}

/**
 * Keeps a prop only if it is declared by the library.
 *
 * `ButtonProps` extends `ComponentProps<'button'>`, so without this every
 * button renders a table of roughly 250 DOM attributes — `onCopy`,
 * `autoCapitalize`, `about` — and the six props that actually matter are lost
 * in it. Anything whose declaring file is in node_modules came from React or
 * the DOM lib, and is already documented by MDN far better than this could.
 */
function isOwnProp(prop: PropItem): boolean {
  const parent = prop.parent ?? prop.declarations?.[0];
  if (!parent) return false;
  return !parent.fileName.includes('node_modules');
}

/**
 * Renders a prop's type as a reader would write it.
 *
 * With `shouldExtractLiteralValuesFromEnum` the parser reports a string-literal
 * union as the bare word `enum` and hides the members in `type.value`. That is
 * exactly backwards for a docs table: `'primary' | 'secondary' | 'ghost'` is
 * the single most useful thing to know about `variant`, and "enum" tells the
 * reader nothing at all.
 *
 * Anything else is passed through with the compiler's line breaks collapsed,
 * since TypeScript wraps wide unions and a wrapped type turns a table cell
 * into a paragraph.
 */
function formatType(type: PropItem['type']): string {
  if (type.name === 'enum' && Array.isArray(type.value)) {
    const members = (type.value as Array<{ value: string }>)
      .map((member) => member.value)
      .filter((value) => value !== 'undefined');

    if (members.length > 0) return members.join(' | ');
  }

  return type.name
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Splits `@example` out of the description.
 *
 * react-docgen-typescript strips most JSDoc tags but leaves `@example` inline,
 * which drops a code snippet into the middle of a prose cell. The docs render
 * the two differently, so they are separated here.
 */
function splitExample(description: string): { description: string; example: string | null } {
  const index = description.indexOf('@example');
  if (index === -1) return { description: description.trim(), example: null };

  return {
    description: description.slice(0, index).trim(),
    example: description.slice(index + '@example'.length).trim() || null,
  };
}

const parser = withCustomConfig(join(libRoot, 'tsconfig.json'), {
  savePropValueAsString: true,
  shouldExtractLiteralValuesFromEnum: true,
  shouldRemoveUndefinedFromOptional: true,
  propFilter: isOwnProp,
});

const output: Record<string, DocumentedProp[]> = {};

for (const [name, relativePath] of Object.entries(SOURCES)) {
  const absolute = join(libRoot, relativePath);
  const parsed = parser.parse(absolute);
  const component = parsed.find((candidate) => candidate.displayName === name);

  if (!component) {
    throw new Error(
      `Could not find a component named "${name}" in ${relativePath}. ` +
        `react-docgen-typescript found: ${parsed.map((c) => c.displayName).join(', ') || '(nothing)'}.`,
    );
  }

  const props = Object.values(component.props)
    .map((prop): DocumentedProp => {
      const { description, example } = splitExample(prop.description);

      return {
        name: prop.name,
        type: formatType(prop.type),
        required: prop.required,
        defaultValue: prop.defaultValue?.value ? String(prop.defaultValue.value) : null,
        description,
        example,
      };
    })
    .sort((a, b) => {
      // Required props first: they are the ones a reader has to act on.
      if (a.required !== b.required) return a.required ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  if (props.length === 0) {
    throw new Error(
      `Extracted zero props for "${name}". The prop filter is probably too ` +
        `aggressive, or the component's props type stopped resolving.`,
    );
  }

  output[name] = props;
}

const target = join(docsRoot, 'src/generated/props.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

const summary = Object.entries(output)
  .map(([name, props]) => `${name} (${props.length})`)
  .join(', ');
console.log(`Wrote prop tables for ${summary} to src/generated/props.json`);
