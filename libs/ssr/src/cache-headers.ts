export interface CacheControlOptions {
  /** Public vs private caches. */
  scope?: 'public' | 'private';
  /** max-age (seconds). */
  maxAge?: number;
  /** s-maxage (seconds) — shared (CDN) cache. */
  sMaxAge?: number;
  /** stale-while-revalidate (seconds). Requires `maxAge` or `sMaxAge`. */
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
  if (
    opts.staleWhileRevalidate !== undefined &&
    opts.maxAge === undefined &&
    opts.sMaxAge === undefined
  ) {
    throw new Error(
      'cacheControl: stale-while-revalidate requires max-age or s-maxage to define freshness.',
    );
  }
  const parts: string[] = [];
  parts.push(opts.scope ?? 'public');
  if (opts.noCache) {
    parts.push('no-cache');
    // no-cache forces revalidation; emitting max-age is misleading — drop it.
  } else {
    if (opts.maxAge !== undefined) parts.push(`max-age=${opts.maxAge}`);
    if (opts.sMaxAge !== undefined) parts.push(`s-maxage=${opts.sMaxAge}`);
  }
  if (opts.staleWhileRevalidate !== undefined)
    parts.push(`stale-while-revalidate=${opts.staleWhileRevalidate}`);
  if (opts.staleIfError !== undefined) parts.push(`stale-if-error=${opts.staleIfError}`);
  if (opts.immutable) parts.push('immutable');
  if (opts.mustRevalidate) parts.push('must-revalidate');
  return parts.join(', ');
}

/**
 * Compute a weak ETag using FNV-1a 64-bit (much lower collision risk than DJB2).
 * Returned as `W/"<hex>-<len>"`.
 */
export function buildWeakEtag(body: string): string {
  // FNV-1a 64-bit using two 32-bit halves to avoid BigInt cost in hot paths.
  let hi = 0xcbf2_9ce4 >>> 0;
  let lo = 0x8422_2325 >>> 0;
  for (let i = 0; i < body.length; i++) {
    const c = body.charCodeAt(i);
    lo ^= c & 0xff;
    // FNV prime 0x100000001b3 ≈ multiplied via 32-bit pieces.
    const aLo = Math.imul(lo, 0x1b3) >>> 0;
    const aHi = Math.imul(hi, 0x1b3) >>> 0;
    const carry = Math.floor((Math.imul(lo, 0x1b3) >>> 0) / 0x100000000) | 0;
    lo = aLo;
    hi = (aHi + carry) >>> 0;
    if (c > 0xff) {
      lo ^= (c >>> 8) & 0xff;
      const bLo = Math.imul(lo, 0x1b3) >>> 0;
      const bHi = Math.imul(hi, 0x1b3) >>> 0;
      const carry2 = Math.floor((Math.imul(lo, 0x1b3) >>> 0) / 0x100000000) | 0;
      lo = bLo;
      hi = (bHi + carry2) >>> 0;
    }
  }
  const hex = hi.toString(16).padStart(8, '0') + lo.toString(16).padStart(8, '0');
  return `W/"${hex}-${body.length}"`;
}

export function ifNoneMatchHit(etag: string, requestHeader?: string): boolean {
  if (!requestHeader) return false;
  return requestHeader.split(',').some((v) => v.trim() === etag);
}
