import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

// `toHaveNoViolations` lives alongside the jest-dom matchers so that a11y specs
// read the same as any other assertion.
expect.extend(axeMatchers);

afterEach(() => {
  cleanup();
});
