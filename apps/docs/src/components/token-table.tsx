import {
  brands,
  flatten,
  primitives,
  resolveValue,
  themes,
  useTheme,
  type BrandName,
  type ThemeName,
} from '../lib/luntra.js';
import { TableScroll } from './table-scroll.js';

export interface TokenTableProps {
  /**
   * `semantic` follows the active theme and is what components consume.
   * `primitives` is the raw palette and scales, which never change.
   */
  source?: 'semantic' | 'primitives';
  /** Only show tokens under this path, e.g. `color.action` or `space`. */
  group?: string;
}

const COLOR_LIKE = /^#|^rgb|^hsl|^oklch/i;

/**
 * A live table of design tokens, read from `@luntra-ui/react/tokens`.
 *
 * Nothing here is transcribed. The table imports the same token source the
 * stylesheet is generated from, through the package's public `./tokens` entry,
 * so a token that gets renamed or dropped shows up here immediately — and a
 * broken export map fails the docs build.
 *
 * Semantic tokens follow the theme and brand the reader currently has
 * selected, so the resolved column is what is genuinely on screen rather than
 * a value that only holds for the default theme.
 */
export function TokenTable({ source = 'semantic', group }: TokenTableProps) {
  const { resolvedTheme, brand } = useTheme();

  const themeName: ThemeName = resolvedTheme === 'dark' ? 'dark' : 'light';
  const ramp = (brands[brand as BrandName] ?? brands.default).ramp;

  const tree = source === 'primitives' ? primitives : themes[themeName];
  const prefix = group ? `--luntra-${group.split('.').join('-')}` : '--luntra';

  const rows = [...flatten(tree)]
    .filter(([name]) => name.startsWith(prefix))
    .map(([name, value]) => {
      let resolved: string;
      try {
        resolved = resolveValue(value, ramp);
      } catch {
        // A circular or dangling reference is the token build's problem to
        // report, not something that should blank the docs page.
        resolved = value;
      }
      return { name, value, resolved };
    });

  if (rows.length === 0) {
    throw new Error(
      `No ${source} tokens match "${group ?? '(all)'}". The group was probably ` +
        `renamed in the token source.`,
    );
  }

  const label = group ? `${source} tokens under ${group}` : `${source} tokens`;

  return (
    <TableScroll label={label}>
      <table className="token-table">
        <caption className="visually-hidden">
          {label}, as resolved for the {themeName} theme and the {brand} brand
        </caption>
        <thead>
          <tr>
            <th scope="col">Token</th>
            <th scope="col">Value</th>
            <th scope="col">Resolves to</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">
                <code>{row.name}</code>
              </th>
              <td>
                <code>{row.value}</code>
              </td>
              <td>
                <span className="token-table__resolved">
                  {COLOR_LIKE.test(row.resolved) ? (
                    /*
                      Decorative and aria-hidden. The hex is right beside it in
                      text, so announcing the swatch would only repeat it — and
                      colour is never the sole carrier of meaning here.
                    */
                    <span
                      className="token-table__swatch"
                      style={{ background: row.resolved }}
                      aria-hidden="true"
                    />
                  ) : null}
                  <code>{row.resolved}</code>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}
