import { createEdgeAdapter } from '@mfjs/ssr';
import type { EdgeAdapterOptions, EdgeAdapterExtraOptions, EdgeRequest } from '@mfjs/ssr';

export interface VercelAdapterOptions extends EdgeAdapterOptions, EdgeAdapterExtraOptions {
  /** Vercel runtime: 'edge' or 'nodejs'. Default: 'edge'. */
  runtime?: 'edge' | 'nodejs';
}

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
  if (body instanceof Uint8Array) return body.slice().buffer as ArrayBuffer;
  return body;
}

/** Build a Vercel Edge/Node function handler from MFJS SSR config. */
export function createVercelHandler(options: VercelAdapterOptions) {
  const handler = createEdgeAdapter(options);

  return async function fetch(request: Request): Promise<Response> {
    const res = await handler(toEdgeRequest(request));
    return new Response(bodyToBodyInit(res.body), { status: res.status, headers: res.headers });
  };
}

export const vercelConfig = {
  edge: { runtime: 'edge' as const },
  node: { runtime: 'nodejs22.x' as const },
};
