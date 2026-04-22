import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createEdgeAdapter } from '@mfjs/ssr';
import type { EdgeAdapterOptions } from '@mfjs/ssr';

export interface NodeAdapterOptions extends EdgeAdapterOptions {
  /** Directory with pre-built static assets. Default: 'dist'. */
  staticDir?: string;
  /** Mount path for static assets. Default: '/'. */
  staticMount?: string;
  /** Port. Default: process.env.PORT or 3000. */
  port?: number;
}

export function createNodeServer(options: NodeAdapterOptions): http.Server {
  const handler = createEdgeAdapter(options);
  const staticDir = options.staticDir ?? 'dist';
  const staticMount = options.staticMount ?? '/';

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

      if (staticMount && url.pathname.startsWith(staticMount)) {
        const rel = url.pathname.slice(staticMount.length).replace(/^\/+/, '');
        const filePath = path.resolve(staticDir, rel);
        if (filePath.startsWith(path.resolve(staticDir)) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          res.setHeader('content-type', MIME[ext] ?? 'application/octet-stream');
          res.setHeader('cache-control', 'public, max-age=31536000, immutable');
          fs.createReadStream(filePath).pipe(res);
          return;
        }
      }

      const body = await readBody(req);
      const out = await handler({
        url: url.toString(),
        method: req.method ?? 'GET',
        headers: req.headers as Record<string, string>,
        body,
      });
      res.statusCode = out.status;
      for (const [k, v] of Object.entries(out.headers)) res.setHeader(k, v);
      res.end(out.body);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.end(err instanceof Error ? err.message : String(err));
    }
  });
}

export function startNodeServer(options: NodeAdapterOptions): http.Server {
  const server = createNodeServer(options);
  const port = options.port ?? Number(process.env.PORT ?? 3000);
  server.listen(port, () => console.log(`[mfjs] listening on :${port}`));
  return server;
}

function readBody(req: http.IncomingMessage): Promise<string | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c as Buffer));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};
