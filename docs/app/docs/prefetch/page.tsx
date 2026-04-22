export const metadata = { title: 'Prefetch on hover' };

export default function Prefetch() {
  return (
    <>
      <h1>Prefetch on hover</h1>
      <p>
        <code>NavLink</code> can warm the target remote bundle on hover, focus, and touch-start so the
        navigation feels instant. Build a central <code>NavLinkPrefetchProvider</code> in the host and turn it
        on per link.
      </p>

      <h2>Configure</h2>
      <pre><code>{`import { NavLink, NavLinkPrefetchProvider } from '@mfjs/runtime';

const REMOTES = {
  dashboard: { name: 'dashboard', entryUrl: '/mfjs/remotes/dashboard/remoteEntry.js' },
};

const HOST_ROUTES = [
  { path: '/dashboard/*', remote: 'dashboard', module: './App' },
  { path: '/',            remote: 'dashboard', module: './App' },
];

<NavLinkPrefetchProvider config={{ routes: HOST_ROUTES, remotes: REMOTES }}>
  <NavLink to="/dashboard/settings" label="Settings" prefetch />
</NavLinkPrefetchProvider>`}</code></pre>

      <h2>Per-link override</h2>
      <pre><code>{`<NavLink to="/profile" label="Profile" prefetch={{
  routes: HOST_ROUTES,
  remotes: { profile: { name: 'profile', entryUrl: '...' } },
}} />`}</code></pre>

      <h2>Imperative</h2>
      <pre><code>{`import { prefetchRoute } from '@mfjs/runtime';

await prefetchRoute('/dashboard/reports', { routes: HOST_ROUTES, remotes: REMOTES });`}</code></pre>

      <h2>How it works</h2>
      <ul>
        <li>Inserts a <code>&lt;link rel="prefetch" as="script"&gt;</code> for the remoteEntry.</li>
        <li>Calls <code>loadRemoteEntry</code> (dedupes across prefetch + real load).</li>
        <li>Emits <code>mfjs:remote-load</code> telemetry so observability dashboards see prefetches.</li>
      </ul>
    </>
  );
}
