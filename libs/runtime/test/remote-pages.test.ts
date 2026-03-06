import { describe, expect, it, vi } from 'vitest';
import { resolveRemotePage } from '../src/remote-pages.js';

describe('resolveRemotePage', () => {
  it('returns null when no page matches the subpath', async () => {
    const res = await resolveRemotePage(
      [{ path: '/', load: async () => ({ default: 'Home' }) }],
      '/nope'
    );
    expect(res).toBeNull();
  });

  it('matches the root "/" page for the empty / root subpath', async () => {
    const res = await resolveRemotePage(
      [{ path: '/', load: async () => ({ default: 'Home' }) }],
      '/'
    );
    expect(res?.Component).toBe('Home');
  });

  it('matches params and loads the correct module', async () => {
    const load = vi.fn(async () => ({ default: 'ReportPage' }));

    const res = await resolveRemotePage(
      [{ path: '/reports/:id', load }],
      '/reports/123'
    );

    expect(load).toHaveBeenCalledTimes(1);
    expect(res?.Component).toBe('ReportPage');
    expect(res?.params.id).toBe('123');
  });

  it('supports splat and captures the rest into params["*"]', async () => {
    const res = await resolveRemotePage(
      [{ path: '/docs/*', load: async () => ({ default: 'Docs' }) }],
      '/docs/a/b'
    );

    expect(res?.params['*']).toBe('a/b');
  });

  it('normalises subpath without leading slash', async () => {
    const load = vi.fn(async () => ({ default: 'Settings' }));

    const res = await resolveRemotePage(
      [{ path: '/settings', load }],
      'settings'  // no leading slash
    );

    expect(res?.Component).toBe('Settings');
  });

  it('first-match-wins when multiple pages could match', async () => {
    const loadFirst = vi.fn(async () => ({ default: 'First' }));
    const loadSecond = vi.fn(async () => ({ default: 'Second' }));

    const res = await resolveRemotePage(
      [
        { path: '/reports/:id', load: loadFirst },
        { path: '/reports/:id', load: loadSecond },
      ],
      '/reports/99'
    );

    expect(res?.Component).toBe('First');
    expect(loadSecond).not.toHaveBeenCalled();
  });

  it('does not call load for pages that do not match', async () => {
    const noMatchLoad = vi.fn(async () => ({ default: 'Never' }));
    const matchLoad = vi.fn(async () => ({ default: 'Found' }));

    await resolveRemotePage(
      [
        { path: '/other', load: noMatchLoad },
        { path: '/target', load: matchLoad },
      ],
      '/target'
    );

    expect(noMatchLoad).not.toHaveBeenCalled();
    expect(matchLoad).toHaveBeenCalledTimes(1);
  });

  it('forwards all extracted params (multi-param pattern)', async () => {
    const res = await resolveRemotePage(
      [{ path: '/orgs/:org/repos/:repo', load: async () => ({ default: 'Repo' }) }],
      '/orgs/acme/repos/frontend'
    );

    expect(res?.params.org).toBe('acme');
    expect(res?.params.repo).toBe('frontend');
  });
});
