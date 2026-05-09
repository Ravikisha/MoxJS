import { createEdgeAdapter } from '@mfjs/ssr';
import type { EdgeAdapterOptions, EdgeAdapterExtraOptions, EdgeRequest } from '@mfjs/ssr';

export interface CloudflareAdapterOptions extends EdgeAdapterOptions, EdgeAdapterExtraOptions {}

function lowerHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

function toEdgeRequest(req: Request): EdgeRequest {
  const er: EdgeRequest = {
    url: req.url,
    method: req.method,
    headers: lowerHeaders(req.headers),
  };
  if (req.body) er.body = req.body as ReadableStream<Uint8Array>;
  if (req.signal) er.signal = req.signal;
  return er;
}

function bodyToBodyInit(body: string | Uint8Array | ReadableStream<Uint8Array>): BodyInit {
  if (typeof body === 'string') return body;
  if (body instanceof Uint8Array) {
    // Cast to a fresh ArrayBuffer-backed view so it satisfies BodyInit.
    return body.slice().buffer as ArrayBuffer;
  }
  return body;
}

export function createCloudflareWorker(options: CloudflareAdapterOptions) {
  const handler = createEdgeAdapter(options);

  return {
    async fetch(request: Request): Promise<Response> {
      const res = await handler(toEdgeRequest(request));
      return new Response(bodyToBodyInit(res.body), { status: res.status, headers: res.headers });
    },
  };
}

export function createPagesFunction(options: CloudflareAdapterOptions) {
  const handler = createEdgeAdapter(options);

  return async function onRequest(ctx: { request: Request }): Promise<Response> {
    const res = await handler(toEdgeRequest(ctx.request));
    return new Response(bodyToBodyInit(res.body), { status: res.status, headers: res.headers });
  };
}
