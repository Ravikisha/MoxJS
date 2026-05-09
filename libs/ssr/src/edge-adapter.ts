/**
 * @mfjs/ssr — edge adapter
 *
 * Framework-agnostic request/response bridge for edge runtimes (Cloudflare
 * Workers, Vercel Edge, Deno Deploy, AWS Lambda@Edge). Feeds an `EdgeRequest`
 * through the router and returns an `EdgeResponse` you adapt to the platform's
 * native Response type.
 */

import { renderRouteToString, injectIntoTemplate } from './render-to-string.js';
import { matchRoutePath } from './route-utils.js';
import { cacheControl, buildWeakEtag, ifNoneMatchHit, type CacheControlOptions } from './cache-headers.js';
import { isRedirect } from './redirect.js';
import { escapeHtml } from '@mfjs/security';
import type { EdgeAdapterHandler, EdgeAdapterOptions, EdgeRequest, EdgeResponse } from './types.js';

export interface EdgeAdapterExtraOptions {
  /** Default Cache-Control for successful responses. */
  cache?: CacheControlOptions;
  /** Cache-Control for 404s. Defaults to `{ scope: 'public', sMaxAge: 60 }`. */
  notFoundCache?: CacheControlOptions;
  /** Per-path override. Matched against route.path (literal). */
  cacheOverrides?: Record<string, CacheControlOptions>;
  /** Emit weak ETag and handle If-None-Match. */
  etag?: boolean;
  /** Extra headers merged into every response (case-insensitive). */
  headers?: Record<string, string>;
  /**
   * CSP header value. May be a static string or a per-request factory — use
   * the factory form whenever you generate a per-request nonce so each
   * response gets a fresh nonce.
   */
  csp?: string | ((req: EdgeRequest) => string);
  /**
   * Optional `<head>` injection per request. Use this slot to inject
   * `serializeState(...)` `<script>` tags, preload links, and CSP nonces. The
   * template must contain `<!--ssr-head-->` to receive the result.
   */
  enrichHead?: (ctx: { request: EdgeRequest; pathname: string }) => string | Promise<string>;
}

function lowerKeys(headers?: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  for (const k of Object.keys(headers)) {
    const v = headers[k];
    if (typeof v === 'string') out[k.toLowerCase()] = v;
  }
  return out;
}

function getHeader(req: EdgeRequest, name: string): string | undefined {
  const lower = name.toLowerCase();
  const headers = req.headers;
  if (!headers) return undefined;
  // Fast path: already lowercased.
  if (headers[lower] !== undefined) return headers[lower];
  // Fallback: case-insensitive scan.
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === lower) return headers[k];
  }
  return undefined;
}

function appendVary(headers: Record<string, string>, value: string): void {
  const existing = headers['vary'];
  if (!existing) {
    headers['vary'] = value;
    return;
  }
  const parts = existing.split(',').map((p) => p.trim().toLowerCase());
  for (const v of value.split(',').map((p) => p.trim())) {
    if (!parts.includes(v.toLowerCase())) headers['vary'] = `${headers['vary']}, ${v}`;
  }
}

export function createEdgeAdapter(
  options: EdgeAdapterOptions & EdgeAdapterExtraOptions,
): EdgeAdapterHandler {
  const {
    App,
    template,
    routes,
    onNotFound,
    cache,
    notFoundCache,
    cacheOverrides,
    etag,
    headers: extraHeaders,
    csp,
    enrichHead,
  } = options;

  const baseExtra = lowerKeys(extraHeaders);

  return async function handleEdgeRequest(request: EdgeRequest): Promise<EdgeResponse> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method?.toUpperCase() ?? 'GET';

    if (method === 'OPTIONS') {
      return {
        status: 204,
        headers: { ...baseExtra, allow: 'GET, HEAD, OPTIONS' },
        body: '',
      };
    }

    const match = matchRoutePath(routes, pathname);
    if (!match) {
      if (onNotFound) return onNotFound(request);
      return defaultNotFound(pathname, template, baseExtra, notFoundCache);
    }

    let result;
    try {
      result = await renderRouteToString(App, { path: match.path, params: match.params });
    } catch (err) {
      if (isRedirect(err)) {
        return {
          status: err.status,
          headers: { ...baseExtra, location: err.location },
          body: '',
        };
      }
      throw err;
    }

    const headExtra = enrichHead ? await enrichHead({ request, pathname }) : '';
    const html = injectIntoTemplate(template, result.html, headExtra);

    const responseHeaders: Record<string, string> = {
      ...baseExtra,
      'content-type': 'text/html; charset=utf-8',
      'x-mfjs-ssr': '1',
    };

    const cspValue = typeof csp === 'function' ? csp(request) : csp;
    if (cspValue) responseHeaders['content-security-policy'] = cspValue;

    appendVary(responseHeaders, 'Accept-Encoding');

    const cacheOpts = cacheOverrides?.[match.path] ?? cache;
    if (cacheOpts && result.statusCode < 400) {
      responseHeaders['cache-control'] = cacheControl(cacheOpts);
    }

    if (method === 'HEAD') {
      return { status: result.statusCode, headers: responseHeaders, body: '' };
    }

    if (etag && result.statusCode < 400) {
      const tag = buildWeakEtag(html);
      responseHeaders['etag'] = tag;
      if (ifNoneMatchHit(tag, getHeader(request, 'if-none-match'))) {
        return { status: 304, headers: responseHeaders, body: '' };
      }
    }

    return {
      status: result.statusCode,
      headers: responseHeaders,
      body: html,
    };
  };
}

function defaultNotFound(
  pathname: string,
  template: string,
  baseExtra: Record<string, string>,
  notFoundCache?: CacheControlOptions,
): EdgeResponse {
  const html = `<h1>404 - Not Found</h1><p>No page matched <code>${escapeHtml(pathname)}</code>.</p>`;
  const headers: Record<string, string> = {
    ...baseExtra,
    'content-type': 'text/html; charset=utf-8',
  };
  if (notFoundCache) headers['cache-control'] = cacheControl(notFoundCache);
  appendVary(headers, 'Accept-Encoding');
  return {
    status: 404,
    headers,
    body: injectIntoTemplate(template, html),
  };
}
