export const metadata = { title: 'Islands hydration' };

export default function Islands() {
  return (
    <>
      <h1>Islands hydration</h1>
      <p>
        Ship static HTML, hydrate only interactive regions. The <code>Island</code> wrapper delays
        hydration until a strategy fires — <code>load</code>, <code>idle</code>, <code>visible</code>,{' '}
        <code>media</code>, or <code>interaction</code>.
      </p>

      <h2>Use</h2>
      <pre><code>{`import { Island } from '@mfjs/runtime';

<Island
  strategy="visible"
  load={() => import('./Carousel.js')}
  fallback={<CarouselSkeleton />}
/>`}</code></pre>

      <h2>Strategies</h2>
      <table>
        <thead><tr><th>Strategy</th><th>Fires when</th></tr></thead>
        <tbody>
          <tr><td><code>load</code></td><td>As soon as the client mounts</td></tr>
          <tr><td><code>idle</code></td><td>Next <code>requestIdleCallback</code></td></tr>
          <tr><td><code>visible</code></td><td>Enters the viewport (IntersectionObserver)</td></tr>
          <tr><td><code>media</code></td><td>Media query matches (e.g. <code>(min-width: 768px)</code>)</td></tr>
          <tr><td><code>interaction</code></td><td>User hovers, focuses, clicks, or touches</td></tr>
        </tbody>
      </table>

      <h2>Mark client boundaries</h2>
      <pre><code>{`import { clientBoundary } from '@mfjs/runtime';

const Counter = clientBoundary(function Counter() {
  const [n, set] = React.useState(0);
  return <button onClick={() => set(n + 1)}>{n}</button>;
});`}</code></pre>

      <p>
        The marker is a hook for future build tooling that will auto-wrap flagged components in an{' '}
        <code>Island</code>. For now the marker is informational.
      </p>

      <h2>SSR fallback</h2>
      <p>
        The <code>fallback</code> prop is rendered on the server and before hydration. Pass the same HTML
        the component produces, or a skeleton. After the strategy fires the real component replaces it.
      </p>
    </>
  );
}
