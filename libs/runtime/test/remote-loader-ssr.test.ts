// Run this test in a Node environment (no document/window)
// so we can validate SSR safety guards.
// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { loadRemoteEntry } from '../src/remote-loader.js';

describe('remote-loader SSR guard', () => {
  it('throws a clear error when called without document/window', async () => {
    await expect(
      loadRemoteEntry({ name: 'x', entryUrl: 'http://localhost/remoteEntry.js' })
    ).rejects.toThrow(/browser environment/i);
  });
});
