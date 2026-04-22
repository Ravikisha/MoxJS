import { loadRemoteEntry, type FederationRemote } from './remote-loader.js';
import { resolveRoute, type RouteTarget } from './routes.js';
import { emitRemoteLoad } from './telemetry.js';

const prefetched = new Set<string>();

export interface PrefetchOptions {
  /** Route table used to resolve the target URL into a remote name. */
  routes: RouteTarget[];
  /** Map remote name → FederationRemote entry URL. */
  remotes: Record<string, FederationRemote>;
  /** Dedupe key override. Default: remote name + entryUrl. */
  key?: string;
}

export async function prefetchRoute(pathname: string, opts: PrefetchOptions): Promise<void> {
  const resolved = resolveRoute(opts.routes, pathname);
  if (!resolved) return;
  const remote = opts.remotes[resolved.target.remote];
  if (!remote) return;
  const key = opts.key ?? `${remote.name}::${remote.entryUrl}`;
  if (prefetched.has(key)) return;
  prefetched.add(key);

  emitRemoteLoad({ remote: remote.name, url: remote.entryUrl, phase: 'start' });
  try {
    if (typeof document !== 'undefined') {
      ensurePreloadLink(remote.entryUrl);
    }
    await loadRemoteEntry(remote);
  } catch (err) {
    prefetched.delete(key);
    emitRemoteLoad({ remote: remote.name, url: remote.entryUrl, phase: 'error', error: err });
  }
}

export function resetPrefetchCache(): void {
  prefetched.clear();
}

function ensurePreloadLink(href: string): void {
  const id = `mfjs-prefetch-${hashCode(href)}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'prefetch';
  link.as = 'script';
  link.href = href;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

function hashCode(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) & 0xffffffff;
  return (h >>> 0).toString(36);
}
