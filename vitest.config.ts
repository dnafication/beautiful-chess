import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // ADR 0002: the rules run in plain Node and never import React, so the
    // suite gets no DOM and no React Native environment.
    environment: 'node',
    // Only `.ts` tests are collected, never `.tsx`. Anything that needs JSX is
    // UI, and UI is verified by hand in v1.
    include: ['src/**/*.test.ts'],
  },
});
