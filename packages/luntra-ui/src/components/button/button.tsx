'use client';

import { isValidElement } from 'react';

import { cx } from '../../utils/cx.js';
import { renderElement } from '../../utils/render-element.js';
import { useButton } from './use-button.js';
import type { ButtonElementKind } from './use-button.js';
import type { ButtonProps } from './button.types.js';

import styles from './button.module.css';

/**
 * Work out what the `render` prop actually produces, because the keyboard
 * contract differs for each kind of element.
 *
 * An `<a>` without an `href` is deliberately treated as `custom`: it is neither
 * focusable nor a link, so it needs the full button treatment.
 */
function resolveElementKind(render: ButtonProps['render']): ButtonElementKind {
  if (!render || !isValidElement(render)) return 'button';
  if (render.type === 'button') return 'button';

  if (render.type === 'a') {
    const props = render.props as { href?: unknown };
    return props.href === undefined ? 'custom' : 'link';
  }

  return 'custom';
}

/**
 * A button.
 *
 * Accessible by default: it keeps a visible focus indicator, meets the WCAG 2.2
 * target-size minimum at every size, stays reachable and announced while
 * disabled, and never changes its accessible name while loading.
 *
 * Styling is driven entirely by data attributes on a single class, so a
 * consumer can restyle any state through
 * `[data-luntra-part='button'][data-variant='ghost']` without knowing or
 * pinning a generated class name.
 *
 * @example
 * <Button variant="destructive" onClick={remove}>Delete project</Button>
 *
 * @example Rendered as a link, because it navigates
 * <Button render={<a href="/pricing" />}>Pricing</Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type,
  className,
  render,
  onClick,
  onKeyDown,
  onKeyUp,
  ...rest
}: ButtonProps) {
  const elementKind = resolveElementKind(render);

  const buttonProps = useButton<HTMLButtonElement>({
    disabled,
    loading,
    variant,
    size,
    elementKind,
    onClick,
    onKeyDown,
    onKeyUp,
  });

  return renderElement(
    'button',
    {
      ...rest,
      ...buttonProps,
      className: cx(styles['root'], className),
      /*
       * Default to `type="button"`. The HTML default is `submit`, so a button
       * placed in a form for any other purpose submits it on click and on
       * Enter — a bug that only surfaces once the component is used inside a
       * form, which is rarely where it is first tested.
       *
       * Omitted entirely on anything that is not a button, where `type` means
       * something else or nothing at all.
       */
      ...(elementKind === 'button' ? { type: type ?? 'button' } : {}),
    },
    render,
  );
}
