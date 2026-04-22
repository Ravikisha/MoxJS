import { loadRemoteEntry, type FederationRemote, type LoadRemoteEntryOptions } from './remote-loader.js';
import { emitRemoteLoad } from './telemetry.js';

export interface PreloadBatchOptions extends LoadRemoteEntryOptions {
  /** Max simultaneous loads. Default: 3. */
  concurrency?: number;
  /** Run during `requestIdleCallback`. Default: true. */
  idle?: boolean;
  /** Idle deadline budget ms — pauses when out of idle time. Default: 8. */
  idleBudgetMs?: number;
  /** Called with per-remote outcomes. */
  onResult?: (r: PreloadResult) => void;
}

export interface PreloadResult {
  remote: string;
  ok: boolean;
  durationMs: number;
  error?: unknown;
}

/**
 * Load N remotes in parallel, optionally on idle time. Dedupes via
 * `loadRemoteEntry` internal state.
 */
export async function preloadRemotes(
  remotes: FederationRemote[],
  opts: PreloadBatchOptions = {},
): Promise<PreloadResult[]> {
  const concurrency = Math.max(1, opts.concurrency ?? 3);
  const queue = [...remotes];
  const results: PreloadResult[] = [];

  const runOne = async (remote: FederationRemote): Promise<void> => {
    const started = Date.now();
    try {
      await loadRemoteEntry(remote, opts);
      const result: PreloadResult = { remote: remote.name, ok: true, durationMs: Date.now() - started };
      results.push(result);
      opts.onResult?.(result);
    } catch (error) {
      const result: PreloadResult = {
        remote: remote.name,
        ok: false,
        durationMs: Date.now() - started,
        error,
      };
      results.push(result);
      opts.onResult?.(result);
      emitRemoteLoad({
        remote: remote.name,
        url: remote.entryUrl,
        phase: 'error',
        durationMs: result.durationMs,
        error,
      });
    }
  };

  const pump = async (): Promise<void> => {
    while (queue.length > 0) {
      const next = queue.shift()!;
      await runOne(next);
    }
  };

  const executor = opts.idle !== false ? withIdle(opts.idleBudgetMs ?? 8, pump) : pump;

  const workers = Array.from({ length: Math.min(concurrency, remotes.length) }, () => executor());
  await Promise.all(workers);

  return results;
}

function withIdle(budgetMs: number, fn: () => Promise<void>): () => Promise<void> {
  if (typeof window === 'undefined' || !('requestIdleCallback' in window)) return fn;
  return () =>
    new Promise<void>((resolve) => {
      const rIC = (window as unknown as { requestIdleCallback: (cb: (d: { timeRemaining: () => number }) => void, opts?: { timeout: number }) => number }).requestIdleCallback;
      rIC(
        async (deadline) => {
          if (deadline.timeRemaining() < budgetMs) {
            // No idle budget now — defer by a frame then retry.
            requestAnimationFrame(() => withIdle(budgetMs, fn)().then(resolve));
            return;
          }
          await fn();
          resolve();
        },
        { timeout: 2000 },
      );
    });
}
