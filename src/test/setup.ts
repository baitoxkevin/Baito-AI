import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Extend Vitest's expect with React Testing Library's matchers
expect.extend({});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
