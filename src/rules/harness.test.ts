import { describe, expect, it } from 'vitest';

/**
 * The tracer bullet for the test harness itself. ADR 0002 requires the rules to
 * run in plain Node so the suite stays fast and a future framework change cannot
 * reach the core; these assertions fail loudly if that ever stops being true.
 */
describe('rules test harness', () => {
  it('runs in plain Node, with no DOM', () => {
    expect(typeof globalThis.window).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');
  });

  it('runs with no React Native environment', () => {
    expect((globalThis as Record<string, unknown>).__fbBatchedBridge).toBeUndefined();
  });
});
