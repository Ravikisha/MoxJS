export const metadata = { title: 'Deployment' };

export default function Deployment() {
  return (
    <>
      <h1>Deployment</h1>
      <p>
        MFJS ships adapters for Vercel, Cloudflare, Node, and Docker. Pick the target, run the scaffold, ship.
      </p>

      <h2>Vercel</h2>
      <pre><code>{`mfjs deploy --target vercel
vercel deploy`}</code></pre>

      <pre><code>{`// api/ssr.ts
import { createVercelHandler } from '@mfjs/adapter-vercel';
import App from '../src/App.js';
import { routes } from '../src/routes.js';
import template from '../public/index.html?raw';

const handler = createVercelHandler({ App, routes, template });
export default handler;
export const config = { runtime: 'edge' };`}</code></pre>

      <h2>Cloudflare Workers / Pages</h2>
      <pre><code>{`mfjs deploy --target cloudflare
wrangler deploy
# or for Pages
wrangler pages deploy apps/shell/dist`}</code></pre>

      <pre><code>{`// Worker
import { createCloudflareWorker } from '@mfjs/adapter-cloudflare';
export default createCloudflareWorker({ App, routes, template });`}</code></pre>

      <h2>Node.js</h2>
      <pre><code>{`// apps/shell/server.ts
import { startNodeServer } from '@mfjs/adapter-node';
import App from './src/App.js';
import { routes } from './src/routes.js';
import fs from 'node:fs';

startNodeServer({
  App, routes,
  template: fs.readFileSync('./public/index.html', 'utf8'),
  staticDir: 'dist',
  port: Number(process.env.PORT ?? 3000),
});`}</code></pre>

      <h2>Docker</h2>
      <pre><code>{`mfjs deploy --target docker
docker build -t shell .
docker run -p 3000:3000 shell`}</code></pre>

      <h2>Netlify</h2>
      <pre><code>{`mfjs deploy --target netlify
netlify deploy --prod`}</code></pre>

      <h2>CDN publicPath</h2>
      <p>
        For static-only deploys behind a CDN, set <code>federation.publicPath</code> in{' '}
        <code>mfjs.config.ts</code> so every generated asset references the correct origin.
      </p>

      <pre><code>{`export default {
  federation: { publicPath: 'https://cdn.mycorp.com/mfe/' },
};`}</code></pre>

      <h2>CI preview apps</h2>
      <p>
        <code>mfjs init</code> scaffolds <code>.github/workflows/pr-preview.yml</code> and{' '}
        <code>deploy.yml</code>. Tweak the target platform to match your host.
      </p>
    </>
  );
}
