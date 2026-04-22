export const metadata = { title: 'Service Worker' };

export default function ServiceWorker() {
  return (
    <>
      <h1>Service Worker</h1>
      <p>
        MFJS ships a Service Worker that caches the app shell + every{' '}
        <code>remoteEntry.js</code> + federation chunks. Second visits (or flaky networks) load instantly
        from cache.
      </p>

      <h2>Generate</h2>
      <pre><code>{`mfjs sw generate --app shell
# writes apps/shell/public/mfjs-sw.js`}</code></pre>

      <h2>Register</h2>
      <pre><code>{`// apps/shell/src/bootstrap.tsx
import { registerMfjsServiceWorker } from '@mfjs/runtime';

registerMfjsServiceWorker({
  url: '/mfjs-sw.js',
  autoActivate: true,
  onUpdateReady: () => showUpdateBanner(),
});`}</code></pre>

      <h2>Cache strategy</h2>
      <table>
        <thead><tr><th>Asset class</th><th>Strategy</th></tr></thead>
        <tbody>
          <tr><td><code>remoteEntry.js</code> + <code>/mfjs/remotes/**</code></td><td>stale-while-revalidate</td></tr>
          <tr><td>Fingerprinted chunks <code>*.[hash].js</code></td><td>cache-first</td></tr>
          <tr><td>HTML documents</td><td>network-first with offline fallback</td></tr>
        </tbody>
      </table>

      <h2>Update flow</h2>
      <p>
        When a new SW installs, the runtime calls <code>onUpdateReady</code> so you can show a banner. With{' '}
        <code>autoActivate: true</code> the CLI sends the <code>SKIP_WAITING</code> message automatically.
      </p>

      <h2>Unregister</h2>
      <pre><code>{`import { unregisterMfjsServiceWorker } from '@mfjs/runtime';
await unregisterMfjsServiceWorker();`}</code></pre>

      <div className="callout callout-warn">
        <strong>Scope note:</strong> Service Workers are restricted to the origin root by default. When
        serving remotes on a CDN subdomain, register a separate SW per origin or proxy remotes under the
        host origin via <code>mfjs dev --proxy-remotes</code> / a production reverse proxy.
      </div>
    </>
  );
}
