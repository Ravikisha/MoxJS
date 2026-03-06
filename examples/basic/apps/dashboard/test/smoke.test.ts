import { describe, expect, it } from 'vitest';
import { loadRemoteModule } from '@mfjs/runtime';

describe('dashboard example app', () => {
  it('loadRemoteModule is exported from @mfjs/runtime', () => {
    expect(typeof loadRemoteModule).toBe('function');
  });

  it('has a test suite (smoke)', () => {
    expect(true).toBe(true);
  });
});
