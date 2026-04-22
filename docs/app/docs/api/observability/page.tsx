export const metadata = { title: '@mfjs/observability API' };

export default function ObsApi() {
  return (
    <>
      <h1>@mfjs/observability</h1>

      <h2>Hooks</h2>
      <ul>
        <li><code>onError(handler)</code> / <code>reportError(event)</code></li>
        <li><code>onMetric(handler)</code> / <code>reportMetric(metric)</code></li>
        <li><code>onRemoteLoad(handler)</code> / <code>reportRemoteLoad(event)</code></li>
        <li><code>clearHandlers()</code></li>
      </ul>

      <h2>Logger</h2>
      <ul>
        <li><code>createLogger(&#123; name?, level?, bindings?, sink? &#125;)</code></li>
        <li>Returns <code>Logger</code>: <code>debug / info / warn / error / child</code></li>
      </ul>

      <h2>Web Vitals</h2>
      <ul>
        <li><code>collectWebVitals(opts?)</code> → returns disposer</li>
      </ul>

      <h2>Adapters</h2>
      <ul>
        <li><code>useConsoleAdapter(opts?)</code></li>
        <li><code>useSentryAdapter(Sentry, opts?)</code></li>
      </ul>
    </>
  );
}
