import React from 'react';

type Cache<T> = Map<string, CacheEntry<T>>;
interface CacheEntry<T> {
  promise: Promise<T>;
  value?: T;
  error?: unknown;
  expiresAt: number;
}

const globalCache: Cache<unknown> = new Map();

export interface UseRemoteDataOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  /** ms — default 60_000 */
  ttl?: number;
  /** Reuse in-flight requests across components. Default: true. */
  dedupe?: boolean;
}

/**
 * Suspense-compatible data fetching hook. Throws the promise while pending so
 * an enclosing <Suspense> renders the fallback. Errors bubble to ErrorBoundary.
 */
export function useRemoteData<T>(options: UseRemoteDataOptions<T>): T {
  const { key, fetcher, ttl = 60_000, dedupe = true } = options;

  const entry = globalCache.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();

  if (entry && entry.expiresAt > now) {
    if ('value' in entry) return entry.value as T;
    if ('error' in entry) throw entry.error;
    if (dedupe) throw entry.promise;
  }

  const promise = fetcher()
    .then((v) => {
      const cached = globalCache.get(key) as CacheEntry<T> | undefined;
      if (cached) cached.value = v;
      return v;
    })
    .catch((err) => {
      const cached = globalCache.get(key) as CacheEntry<T> | undefined;
      if (cached) cached.error = err;
      throw err;
    });

  globalCache.set(key, { promise, expiresAt: now + ttl } as CacheEntry<unknown>);
  throw promise;
}

export function invalidateRemoteData(key: string): void {
  globalCache.delete(key);
}

export function clearRemoteDataCache(): void {
  globalCache.clear();
}

export function prefetchRemoteData<T>(key: string, fetcher: () => Promise<T>, ttl = 60_000): Promise<T> {
  const entry = globalCache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > Date.now() && 'value' in entry) {
    return Promise.resolve(entry.value as T);
  }
  const promise = fetcher();
  globalCache.set(key, { promise, expiresAt: Date.now() + ttl } as CacheEntry<unknown>);
  return promise;
}

// Unused but kept to satisfy type flow for bundlers that tree-shake named React.
void React;
