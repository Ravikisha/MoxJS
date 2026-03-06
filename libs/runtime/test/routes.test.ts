import { describe, expect, it } from 'vitest';
import { matchPath } from '../src/route-matcher.js';
import { resolveRoute } from '../src/routes.js';

// ---------------------------------------------------------------------------
// matchPath
// ---------------------------------------------------------------------------

describe('matchPath', () => {
  it('matches static paths', () => {
    expect(matchPath('/dashboard', '/dashboard')).not.toBeNull();
    expect(matchPath('/dashboard', '/dashboard/')).not.toBeNull();
    expect(matchPath('/dashboard', '/profile')).toBeNull();
  });

  it('does not match when URL has extra segments beyond static pattern', () => {
    expect(matchPath('/about', '/about/team')).toBeNull();
  });

  it('matches params', () => {
    const m = matchPath('/reports/:id', '/reports/123');
    expect(m?.params.id).toBe('123');
  });

  it('extracts multiple params from the same pattern', () => {
    const m = matchPath('/orgs/:org/repos/:repo', '/orgs/acme/repos/frontend');
    expect(m?.params.org).toBe('acme');
    expect(m?.params.repo).toBe('frontend');
  });

  it('URL-decodes param values', () => {
    const m = matchPath('/search/:term', '/search/hello%20world');
    expect(m?.params.term).toBe('hello world');
  });

  it('matches splat', () => {
    const m = matchPath('/dashboard/*', '/dashboard/reports/1');
    expect(m?.params['*']).toBe('reports/1');
  });

  it('splat captures empty string at the base path', () => {
    const m = matchPath('/dashboard/*', '/dashboard/');
    expect(m).not.toBeNull();
    expect(m?.params['*']).toBe('');
  });

  it('root "/" only matches the root path', () => {
    expect(matchPath('/', '/')).not.toBeNull();
    expect(matchPath('/', '/anything')).toBeNull();
  });

  it('trailing slash normalisation — /about/ matches /about', () => {
    expect(matchPath('/about', '/about/')).not.toBeNull();
  });

  it('strips query and hash before matching', () => {
    expect(matchPath('/dashboard', '/dashboard?tab=overview#section')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// resolveRoute
// ---------------------------------------------------------------------------

describe('resolveRoute', () => {
  it('returns first matching route', () => {
    const r = resolveRoute(
      [
        { path: '/dashboard/*', remote: 'dashboard' },
        { path: '/profile/*', remote: 'profile' },
      ],
      '/profile/settings'
    );

    expect(r?.target.remote).toBe('profile');
  });

  it('returns null when no route matches', () => {
    const r = resolveRoute(
      [{ path: '/dashboard/*', remote: 'dashboard' }],
      '/unknown/path'
    );
    expect(r).toBeNull();
  });

  it('first-match-wins: earlier route takes priority over later route for same path', () => {
    const r = resolveRoute(
      [
        { path: '/dashboard/*', remote: 'dashboard-v2' },
        { path: '/dashboard/*', remote: 'dashboard-v1' },
      ],
      '/dashboard/home'
    );
    expect(r?.target.remote).toBe('dashboard-v2');
  });

  it('wildcard /* route matches any path not already caught', () => {
    const r = resolveRoute(
      [
        { path: '/dashboard/*', remote: 'dashboard' },
        { path: '/*', remote: 'fallback' },
      ],
      '/anywhere/else'
    );
    expect(r?.target.remote).toBe('fallback');
  });

  it('forwards matched params to the resolved result', () => {
    const r = resolveRoute(
      [{ path: '/reports/:id', remote: 'dashboard' }],
      '/reports/42'
    );
    expect(r?.params.id).toBe('42');
  });

  it('returns empty params object for static match', () => {
    const r = resolveRoute(
      [{ path: '/about', remote: 'marketing' }],
      '/about'
    );
    expect(r?.params).toEqual({});
  });
});
