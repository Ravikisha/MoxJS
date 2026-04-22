export interface CacheControlOptions {
  /** Public vs private caches. */
  scope?: 'public' | 'private';
  /** max-age (seconds). */
  maxAge?: number;
  /** s-maxage (seconds) — shared (CDN) cache. */
  sMaxAge?: number;
  /** stale-while-revalidate (seconds). */
  staleWhileRevalidate?: number;
  /** stale-if-error (seconds). */
  staleIfError?: number;
  /** no-store short-circuits. */
  noStore?: boolean;
  /** no-cache short-circuits. */
  noCache?: boolean;
  /** immutable (fingerprinted assets). */
  immutable?: boolean;
  mustRevalidate?: boolean;
}

export function cacheControl(opts: CacheControlOptions): string {
  if (opts.noStore) return 'no-store';
  const parts: string[] = [];
  parts.push(opts.scope ?? 'public');
  if (opts.noCache) parts.push('no-cache');
  if (opts.maxAge !== undefined) parts.push(`max-age=${opts.maxAge}`);
  if (opts.sMaxAge !== undefined) parts.push(`s-maxage=${opts.sMaxAge}`);
  if (opts.staleWhileRevalidate !== undefined) parts.push(`stale-while-revalidate=${opts.staleWhileRevalidate}`);
  if (opts.staleIfError !== undefined) parts.push(`stale-if-error=${opts.staleIfError}`);
  if (opts.immutable) parts.push('immutable');
  if (opts.mustRevalidate) parts.push('must-revalidate');
  return parts.join(', ');
}

export function buildWeakEtag(body: string): string {
  let hash = 5381;
  for (let i = 0; i < body.length; i++) {
    hash = ((hash << 5) + hash + body.charCodeAt(i)) & 0xffffffff;
  }
  return `W/"${(hash >>> 0).toString(36)}-${body.length}"`;
}

export function ifNoneMatchHit(etag: string, requestHeader?: string): boolean {
  if (!requestHeader) return false;
  return requestHeader.split(',').some((v) => v.trim() === etag);
}
