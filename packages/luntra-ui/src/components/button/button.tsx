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
 * ## Why the `to` prop counts
 *
 * A router's `<Link>` — TanStack, React Router, Next — is a *component*, so
 * `render.type` is a function and the `href` it eventually emits does not exist
 * yet at this point. Classifying it as `custom` was actively harmful: the
 * component stamped `role="button"` onto something that renders a real anchor,
 * so it announced as a button while it still navigated, and the user lost the
 * link role, the context menu and open-in-new-tab.
 *
 * Every router link library names its destination prop `href` or `to`, and
 * neither means anything except navigation. Treating either as proof of a link
 * is a real signal rather than a guess, and it cannot be checked at runtime:
 * inspecting `tagName` through a ref happens after the first paint, which is
 * exactly the flash of wrong semantics this component exists to avoid.
 *
 * An `<a>` with neither is deliberately `custom`: it is neither focusable nor a
 * link, so it needs the full button treatment.
 *
 * A component with neither is also `custom`. That errs towards over-applying
 * `role="button"` — redundant if it turns out to render a `<button>`, and
 * harmless — rather than leaving a `<div>`-based control unfocusable.
 */
function resolveElementKind(render: ButtonProps['render']): ButtonElementKind {
  if (!render || !isValidElement(render)) return 'button';
  if (render.type === 'button') return 'button';

  const props = render.props as { href?: unknown; to?: unknown };
  const navigates = props.href !== undefined || props.to !== undefined;

  if (typeof render.type === 'string') {
    // An intrinsic element only navigates if it is an anchor. `href` on a
    // `<div>` is inert, so it proves nothing about the element's role.
    return render.type === 'a' && navigates ? 'link' : 'custom';
  }

  return navigates ? 'link' : 'custom';
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
