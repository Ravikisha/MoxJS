import { createEdgeAdapter } from '@mfjs/ssr';
import type { EdgeAdapterOptions } from '@mfjs/ssr';

export interface CloudflareAdapterOptions extends EdgeAdapterOptions {}

export function createCloudflareWorker(options: CloudflareAdapterOptions) {
  const handler = createEdgeAdapter(options);

  return {
    async fetch(request: Request): Promise<Response> {
      const res = await handler({
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers),
      });
      return new Response(res.body, { status: res.status, headers: res.headers });
    },
  };
}

export function createPagesFunction(options: CloudflareAdapterOptions) {
  const handler = createEdgeAdapter(options);

  return async function onRequest(ctx: { request: Request }): Promise<Response> {
    const res = await handler({
      url: ctx.request.url,
      method: ctx.request.method,
      headers: Object.fromEntries(ctx.request.headers),
    });
    return new Response(res.body, { status: res.status, headers: res.headers });
  };
}
