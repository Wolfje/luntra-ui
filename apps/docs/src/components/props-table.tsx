import props from '../generated/props.json';
import { TableScroll } from './table-scroll.js';

interface DocumentedProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue: string | null;
  description: string;
  example: string | null;
}

const tables = props as Record<string, DocumentedProp[]>;

export interface PropsTableProps {
  /** Component name, as keyed in `scripts/build-props.ts`. */
  of: string;
}

/**
 * The prop table, extracted from the library's own TypeScript by
 * `scripts/build-props.ts`.
 *
 * Generated rather than hand-written, because a hand-written prop table is
 * wrong the moment someone renames a prop and the docs are the last thing they
 * check. Here the build fails instead.
 *
 * Only props the library declares are listed. `ButtonProps` also accepts every
 * `<button>` attribute; those are documented on MDN and would bury the six
 * that matter.
 */
export function PropsTable({ of }: PropsTableProps) {
  const rows = tables[of];

  if (!rows) {
    throw new Error(
      `No generated prop table for "${of}". Add it to SOURCES in ` +
        `scripts/build-props.ts and re-run \`pnpm build:props\`.`,
    );
  }

  return (
    <TableScroll label={`${of} props`}>
      <table className="props-table">
        <caption className="visually-hidden">
          Props accepted by {of}, with their types and default values
        </caption>
        <thead>
          <tr>
            <th scope="col">Prop</th>
            <th scope="col">Type</th>
            <th scope="col">Default</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((prop) => (
            <tr key={prop.name}>
              <th scope="row">
                <code>{prop.name}</code>
                {prop.required ? <span className="props-table__required"> (required)</span> : null}
              </th>
              <td>
                <code>{prop.type}</code>
              </td>
              <td>
                {prop.defaultValue ? (
                  <code>{prop.defaultValue}</code>
                ) : (
                  /* An em dash would be read aloud as "em dash" or skipped entirely. */
                  <span aria-label="No default">&mdash;</span>
                )}
              </td>
              <td>
                {prop.description || null}
                {prop.example ? (
                  <pre className="props-table__example">
                    <code>{prop.example}</code>
                  </pre>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}
