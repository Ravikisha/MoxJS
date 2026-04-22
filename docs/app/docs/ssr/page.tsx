export const metadata = { title: 'SSR & static export' };

export default function Ssr() {
  return (
    <>
      <h1>SSR &amp; static export</h1>
      <p>
        <code>@mfjs/ssr</code> ships render-to-string, streaming, static export, and a platform-agnostic edge
        adapter. All primitives are framework-neutral — you pass in your React App and routes table.
      </p>

      <h2>Render to string</h2>
      <pre><code>{`import { renderRouteToString, injectIntoTemplate } from '@mfjs/ssr';
import App from './App.js';
import template from './index.html?raw';

const result = await renderRouteToString(App, { path: '/dashboard', params: {} });
const html = injectIntoTemplate(template, result.html);`}</code></pre>

      <h2>Streaming</h2>
      <pre><code>{`import { renderRouteToStream } from '@mfjs/ssr';

const { stream } = await renderRouteToStream(App, { path: '/', params: {} });
stream.pipe(response);`}</code></pre>

      <h2>Static export</h2>
      <pre><code>{`import { staticExport } from '@mfjs/ssr';

await staticExport({
  App,
  template,
  routes: [{ path: '/' }, { path: '/about' }],
  outDir: 'dist',
});`}</code></pre>

      <p>
        CLI wrapper reads <code>mfjs.ssr.json</code>:
      </p>

      <pre><code>{`mfjs ssr export`}</code></pre>

      <h2>Edge adapter</h2>
      <pre><code>{`import { createEdgeAdapter } from '@mfjs/ssr';
import { buildCsp } from '@mfjs/security';

const handler = createEdgeAdapter({
  App, routes, template,
  cache: { scope: 'public', maxAge: 0, sMaxAge: 60, staleWhileRevalidate: 300 },
  etag: true,
  csp: buildCsp(),
});

// Cloudflare Worker
export default {
  fetch: (req: Request) => handler({
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers),
  }).then(r => new Response(r.body, r)),
};`}</code></pre>

      <h2>Redirects</h2>
      <pre><code>{`import { redirect } from '@mfjs/ssr';

function LoginPage() {
  if (!isLoggedIn()) redirect('/login', 302);
  return <Dashboard />;
}`}</code></pre>

      <h2>State hydration</h2>
      <pre><code>{`// server
import { serializeState } from '@mfjs/ssr';
const tag = serializeState({ user, cart }, { nonce });

// client
import { hydrateState } from '@mfjs/ssr';
const initial = hydrateState<AppState>();`}</code></pre>

      <h2>Preload links</h2>
      <pre><code>{`import { buildPreloadTags, remoteEntryPreloads } from '@mfjs/ssr';

const tags = buildPreloadTags(remoteEntryPreloads([
  { name: 'dashboard', entryUrl: 'https://cdn.mycorp.com/mfe/dashboard/remoteEntry.js', integrity: 'sha384-...' },
]));`}</code></pre>
    </>
  );
}
