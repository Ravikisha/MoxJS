import { createEdgeAdapter } from '@mfjs/ssr';
import type { EdgeAdapterOptions } from '@mfjs/ssr';

export interface VercelAdapterOptions extends EdgeAdapterOptions {
  /** Vercel runtime: 'edge' or 'nodejs'. Default: 'edge'. */
  runtime?: 'edge' | 'nodejs';
}

/** Build a Vercel Edge/Node function handler from MFJS SSR config. */
export function createVercelHandler(options: VercelAdapterOptions) {
  const handler = createEdgeAdapter(options);

  return async function fetch(request: Request): Promise<Response> {
    const res = await handler({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers),
    });
    return new Response(res.body, { status: res.status, headers: res.headers });
  };
}

export const vercelConfig = {
  edge: { runtime: 'edge' as const },
  node: { runtime: 'nodejs22.x' as const },
};
