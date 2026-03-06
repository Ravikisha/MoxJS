import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../src/index.js';

type AppEvents = {
  ping: { n: number };
  ready: { appName: string };
  logout: undefined;
};

describe('EventBus', () => {
  it('emits to subscribed handlers and delivers the correct payload', () => {
    const bus = new EventBus<AppEvents>();

    let last = 0;
    bus.on('ping', (p) => { last = p.n; });

    bus.emit('ping', { n: 42 });
    expect(last).toBe(42);
  });

  it('delivers payload to multiple handlers on the same event', () => {
    const bus = new EventBus<AppEvents>();
    const calls: number[] = [];

    bus.on('ping', (p) => calls.push(p.n));
    bus.on('ping', (p) => calls.push(p.n * 2));

    bus.emit('ping', { n: 5 });
    expect(calls).toEqual([5, 10]);
  });

  it('unsubscribe: returned cleanup fn removes the handler', () => {
    const bus = new EventBus<AppEvents>();
    const handler = vi.fn();

    const unsub = bus.on('ping', handler);
    bus.emit('ping', { n: 1 });
    expect(handler).toHaveBeenCalledTimes(1);

    unsub();
    bus.emit('ping', { n: 2 });
    expect(handler).toHaveBeenCalledTimes(1); // not called again
  });

  it('does not throw when emit is called with no handlers registered', () => {
    const bus = new EventBus<AppEvents>();
    expect(() => bus.emit('ping', { n: 0 })).not.toThrow();
  });

  it('does not call handlers from a different event key', () => {
    const bus = new EventBus<AppEvents>();
    const pingHandler = vi.fn();
    const readyHandler = vi.fn();

    bus.on('ping', pingHandler);
    bus.on('ready', readyHandler);

    bus.emit('ping', { n: 7 });

    expect(pingHandler).toHaveBeenCalledTimes(1);
    expect(readyHandler).not.toHaveBeenCalled();
  });

  it('two separate EventBus instances do not share events', () => {
    const busA = new EventBus<AppEvents>();
    const busB = new EventBus<AppEvents>();
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    busA.on('ping', handlerA);
    busB.on('ping', handlerB);

    busA.emit('ping', { n: 1 });

    expect(handlerA).toHaveBeenCalledTimes(1);
    expect(handlerB).not.toHaveBeenCalled(); // proves no shared state
  });

  it('works correctly after all handlers for an event are unsubscribed', () => {
    const bus = new EventBus<AppEvents>();
    const handler = vi.fn();

    const unsub = bus.on('ready', handler);
    unsub();

    // Re-subscribe after unsubscribe.
    bus.on('ready', handler);
    bus.emit('ready', { appName: 'shell' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ appName: 'shell' });
  });

  it('emits the exact same payload reference to all handlers', () => {
    const bus = new EventBus<AppEvents>();
    const received: Array<{ appName: string }> = [];

    bus.on('ready', (p) => received.push(p));
    bus.on('ready', (p) => received.push(p));

    const payload = { appName: 'shell' };
    bus.emit('ready', payload);

    expect(received[0]).toBe(payload);
    expect(received[1]).toBe(payload);
  });
});
