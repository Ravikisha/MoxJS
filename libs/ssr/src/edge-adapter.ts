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
import type { EdgeAdapterHandler, EdgeAdapterOptions, EdgeRequest, EdgeResponse } from './types.js';

export interface EdgeAdapterExtraOptions {
  /** Default Cache-Control for successful responses. */
  cache?: CacheControlOptions;
  /** Per-path override. Matched against route.path (literal). */
  cacheOverrides?: Record<string, CacheControlOptions>;
  /** Emit weak ETag and handle If-None-Match. */
  etag?: boolean;
  /** Extra headers merged into every response. */
  headers?: Record<string, string>;
  /** CSP header value. Produced via `@mfjs/security`. */
  csp?: string;
}

export function createEdgeAdapter(
  options: EdgeAdapterOptions & EdgeAdapterExtraOptions,
): EdgeAdapterHandler {
  const { App, template, routes, onNotFound, cache, cacheOverrides, etag, headers: extraHeaders, csp } = options;

  return async function handleEdgeRequest(request: EdgeRequest): Promise<EdgeResponse> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    const match = matchRoutePath(routes, pathname);
    if (!match) {
      if (onNotFound) return onNotFound(request);
      return defaultNotFound(pathname, template, extraHeaders);
    }

    let result;
    try {
      result = await renderRouteToString(App, { path: match.path, params: match.params });
    } catch (err) {
      if (isRedirect(err)) {
        return {
          status: err.status,
          headers: { location: err.location, ...(extraHeaders ?? {}) },
          body: '',
        };
      }
      throw err;
    }

    const html = injectIntoTemplate(template, result.html);
    const responseHeaders: Record<string, string> = {
      'content-type': 'text/html; charset=utf-8',
      'x-mfjs-ssr': '1',
      ...(extraHeaders ?? {}),
    };

    if (csp) responseHeaders['content-security-policy'] = csp;

    const cacheOpts = cacheOverrides?.[match.path] ?? cache;
    if (cacheOpts && result.statusCode < 500) {
      responseHeaders['cache-control'] = cacheControl(cacheOpts);
    }

    if (etag && result.statusCode < 400) {
      const tag = buildWeakEtag(html);
      responseHeaders['etag'] = tag;
      if (ifNoneMatchHit(tag, request.headers?.['if-none-match'])) {
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
  extra?: Record<string, string>,
): EdgeResponse {
  const html = `<h1>404 - Not Found</h1><p>No page matched <code>${escape(pathname)}</code>.</p>`;
  return {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8', ...(extra ?? {}) },
    body: injectIntoTemplate(template, html),
  };
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch] ?? ch);
}
