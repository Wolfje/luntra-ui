import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { devWarn, resetDevWarnings } from './dev-warn.js';

describe('devWarn', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetDevWarnings();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    vi.unstubAllEnvs();
  });

  it('warns when the condition is false', () => {
    devWarn(false, 'something is wrong');

    expect(warn).toHaveBeenCalledWith('[luntra-ui] something is wrong');
  });

  it('stays silent when the condition holds', () => {
    devWarn(true, 'should not appear');

    expect(warn).not.toHaveBeenCalled();
  });

  /**
   * A misused component usually renders many times. A hundred identical console
   * lines buries the one message that matters.
   */
  it('warns once per distinct message', () => {
    devWarn(false, 'repeated');
    devWarn(false, 'repeated');
    devWarn(false, 'repeated');

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('still warns for a different message', () => {
    devWarn(false, 'first');
    devWarn(false, 'second');

    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('is silent in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    devWarn(false, 'not in production');

    expect(warn).not.toHaveBeenCalled();
  });
});
