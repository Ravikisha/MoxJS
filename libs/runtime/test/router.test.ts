import { describe, expect, it, vi, afterEach } from 'vitest';
import { MFJS_NAVIGATE_EVENT, createRouter, dispatchMfjsNavigate } from '../src/router.js';

afterEach(() => {
  // Reset location so each test starts clean.
  window.history.replaceState(null, '', '/');
});

describe('createRouter — subscribe / navigate', () => {
  it('subscribe receives current path immediately, then updates on navigate()', () => {
    window.history.replaceState(null, '', '/');
    const router = createRouter();
    const calls: string[] = [];

    const unsub = router.subscribe((p) => calls.push(p));

    // Immediate sync call with current path.
    expect(calls[0]).toBe('/');

    router.navigate({ to: '/dashboard?x=1#h' });

    expect(calls.at(-1)).toBe('/dashboard?x=1#h');

    unsub();
    router.destroy();
  });

  it('navigate push calls history.pushState with the correct path', () => {
    window.history.replaceState(null, '', '/');
    const pushSpy = vi.spyOn(window.history, 'pushState');
    const router = createRouter();

    router.navigate({ to: '/settings' });

    expect(pushSpy).toHaveBeenCalledWith(null, '', '/settings');

    pushSpy.mockRestore();
    router.destroy();
  });

  it('navigate replace calls history.replaceState instead of pushState', () => {
    window.history.replaceState(null, '', '/');
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    const pushSpy = vi.spyOn(window.history, 'pushState');
    const router = createRouter();

    router.navigate({ to: '/settings', mode: 'replace' });

    expect(replaceSpy).toHaveBeenCalledWith(null, '', '/settings');
    expect(pushSpy).not.toHaveBeenCalled();

    replaceSpy.mockRestore();
    pushSpy.mockRestore();
    router.destroy();
  });

  it('unsubscribe stops the subscriber from receiving further callbacks', () => {
    window.history.replaceState(null, '', '/');
    const router = createRouter();
    const calls: string[] = [];

    const unsub = router.subscribe((p) => calls.push(p));
    // Received initial call.
    expect(calls.length).toBe(1);

    unsub();
    router.navigate({ to: '/after-unsub' });

    // No new calls after unsubscribe.
    expect(calls.length).toBe(1);

    router.destroy();
  });

  it('popstate browser event triggers subscriber callback', () => {
    window.history.pushState(null, '', '/page-a');
    const router = createRouter();
    const calls: string[] = [];
    router.subscribe((p) => calls.push(p));

    // Simulate browser back.
    window.history.pushState(null, '', '/page-b');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(calls.at(-1)).toBe('/page-b');

    router.destroy();
  });

  it('navigate passes state to history.pushState', () => {
    window.history.replaceState(null, '', '/');
    const pushSpy = vi.spyOn(window.history, 'pushState');
    const router = createRouter();

    router.navigate({ to: '/checkout', state: { step: 2 } });

    expect(pushSpy).toHaveBeenCalledWith({ step: 2 }, '', '/checkout');

    pushSpy.mockRestore();
    router.destroy();
  });
});

describe('createRouter — basePath filter', () => {
  it('ignores mfjs:navigate events whose path is outside the basePath', () => {
    window.history.replaceState(null, '', '/dashboard');
    const router = createRouter({ basePath: '/dashboard' });
    const cb = vi.fn();
    router.subscribe(cb);
    cb.mockClear(); // ignore initial sync call

    window.dispatchEvent(
      new CustomEvent(MFJS_NAVIGATE_EVENT, { detail: { to: '/profile' } })
    );

    expect(cb).not.toHaveBeenCalled();
    router.destroy();
  });

  it('accepts mfjs:navigate events whose path starts with basePath', () => {
    window.history.replaceState(null, '', '/dashboard');
    const router = createRouter({ basePath: '/dashboard' });
    const calls: string[] = [];
    router.subscribe((p) => calls.push(p));

    router.navigate({ to: '/dashboard/reports' });

    expect(calls.at(-1)).toBe('/dashboard/reports');
    router.destroy();
  });
});

describe('createRouter — destroy', () => {
  it('removes the popstate listener after destroy', () => {
    window.history.replaceState(null, '', '/');
    const router = createRouter();
    const calls: string[] = [];
    router.subscribe((p) => calls.push(p));
    router.destroy();

    const countBefore = calls.length;
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(calls.length).toBe(countBefore);
  });

  it('removes the mfjs:navigate listener after destroy', () => {
    window.history.replaceState(null, '', '/');
    const router = createRouter();
    const calls: string[] = [];
    router.subscribe((p) => calls.push(p));
    router.destroy();

    const countBefore = calls.length;
    window.dispatchEvent(
      new CustomEvent(MFJS_NAVIGATE_EVENT, { detail: { to: '/somewhere' } })
    );

    expect(calls.length).toBe(countBefore);
  });
});

describe('dispatchMfjsNavigate', () => {
  it('dispatches mfjs:navigate CustomEvent on window with correct detail', () => {
    window.history.replaceState(null, '', '/');
    const router = createRouter();
    const calls: string[] = [];
    router.subscribe((p) => calls.push(p));

    dispatchMfjsNavigate({ to: '/profile/settings' });

    expect(calls.at(-1)).toBe('/profile/settings');
    router.destroy();
  });

  it('does not throw when no router is listening', () => {
    expect(() => dispatchMfjsNavigate({ to: '/anywhere' })).not.toThrow();
  });
});

// Keep the original combined test for backwards compat.
describe('router (legacy combined)', () => {
  it('subscribe receives current path and updates on navigate()', async () => {
    window.history.replaceState(null, '', '/');

    const router = createRouter();
    const calls: string[] = [];

    const unsub = router.subscribe((p) => calls.push(p));

    router.navigate({ to: '/dashboard?x=1#h' });

    expect(calls[0]).toBe('/');
    expect(calls.at(-1)).toBe('/dashboard?x=1#h');

    unsub();
    router.destroy();
  });

  it('reacts to mfjs:navigate CustomEvent', async () => {
    window.history.replaceState(null, '', '/');

    const router = createRouter();
    const calls: string[] = [];
    router.subscribe((p) => calls.push(p));

    dispatchMfjsNavigate({ to: '/profile/settings' });

    expect(calls.at(-1)).toBe('/profile/settings');

    router.destroy();
  });

  it('respects basePath filter', async () => {
    window.history.replaceState(null, '', '/dashboard');

    const router = createRouter({ basePath: '/dashboard' });
    const cb = vi.fn();
    router.subscribe(cb);

    // Should be ignored (outside base)
    window.dispatchEvent(new CustomEvent(MFJS_NAVIGATE_EVENT, { detail: { to: '/profile' } }));
    expect(cb).not.toHaveBeenLastCalledWith('/profile');

    // Should be accepted
    router.navigate({ to: '/dashboard/reports' });
    expect(cb).toHaveBeenLastCalledWith('/dashboard/reports');

    router.destroy();
  });
});
