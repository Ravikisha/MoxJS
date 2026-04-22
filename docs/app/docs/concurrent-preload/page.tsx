export const metadata = { title: 'Concurrent preload' };

export default function ConcurrentPreload() {
  return (
    <>
      <h1>Concurrent remote preload</h1>
      <p>
        <code>preloadRemotes</code> loads multiple remotes in parallel during browser idle time. Dedupes
        with <code>loadRemoteEntry</code> so a real load later returns instantly from cache.
      </p>

      <h2>Preload all remotes after first paint</h2>
      <pre><code>{`import { preloadRemotes } from '@mfjs/runtime';

window.addEventListener('load', () => {
  preloadRemotes(
    [
      { name: 'dashboard', entryUrl: '/mfjs/remotes/dashboard/remoteEntry.js' },
      { name: 'profile',   entryUrl: '/mfjs/remotes/profile/remoteEntry.js' },
      { name: 'billing',   entryUrl: '/mfjs/remotes/billing/remoteEntry.js' },
    ],
    { concurrency: 2, idle: true },
  );
});`}</code></pre>

      <h2>Per-remote telemetry</h2>
      <pre><code>{`preloadRemotes(remotes, {
  concurrency: 3,
  onResult: (r) => console.log(r.remote, r.ok, r.durationMs),
});`}</code></pre>

      <h2>Options</h2>
      <table>
        <thead><tr><th>Option</th><th>Default</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td><code>concurrency</code></td><td>3</td><td>Max simultaneous loads</td></tr>
          <tr><td><code>idle</code></td><td>true</td><td>Wrap each load in requestIdleCallback</td></tr>
          <tr><td><code>idleBudgetMs</code></td><td>8</td><td>Minimum idle time before starting work</td></tr>
          <tr><td><code>onResult</code></td><td>—</td><td>Per-remote outcome callback</td></tr>
        </tbody>
      </table>

      <h2>Combine with Service Worker</h2>
      <p>
        Preloaded remoteEntry.js responses flow through the Service Worker cache set by{' '}
        <code>mfjs sw generate</code>. Second-load cost drops to cache-hit.
      </p>
    </>
  );
}
