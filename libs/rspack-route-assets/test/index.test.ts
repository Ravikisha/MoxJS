import { describe, expect, it } from 'vitest';
import { createRouteAssetsFromEntrypoints } from '../src/index.js';

describe('createRouteAssetsFromEntrypoints', () => {
  it('maps routes to entrypoint assets (deduped)', () => {
    const routeAssets = createRouteAssetsFromEntrypoints({
      routeEntries: {
        '/': 'main',
        '/app': 'app',
      },
      entrypointAssets: {
        main: ['main.111.js', 'vendor.222.js', 'vendor.222.js'],
        app: ['app.333.js', '/vendor.222.js'],
      },
    });

    expect(routeAssets['/']).toEqual(['main.111.js', 'vendor.222.js']);
    expect(routeAssets['/app']).toEqual(['app.333.js', 'vendor.222.js']);
  });

  it('returns empty asset array when entry is missing', () => {
    const routeAssets = createRouteAssetsFromEntrypoints({
      routeEntries: {
        '/': 'missing',
      },
      entrypointAssets: {},
    });

    expect(routeAssets['/']).toEqual([]);
  });
});
