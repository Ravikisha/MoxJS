export const metadata = { title: 'Observability' };

export default function Observability() {
  return (
    <>
      <h1>Observability</h1>
      <p>
        <code>@mfjs/observability</code> exposes three hooks you wire to whatever backend your org uses.
        Runtime code dispatches telemetry events; the package bridges them to Sentry / OTEL / your own
        collector.
      </p>

      <h2>Hooks</h2>
      <pre><code>{`import { onError, onMetric, onRemoteLoad } from '@mfjs/observability';

const off = onError((e) => sendToBackend(e));
onMetric((m) => statsd.gauge(m.name, m.value, m.tags));
onRemoteLoad((e) => console.log(e.remote, e.phase, e.durationMs));`}</code></pre>

      <h2>Web Vitals</h2>
      <pre><code>{`import { collectWebVitals, useConsoleAdapter } from '@mfjs/observability';
useConsoleAdapter();
collectWebVitals();
// Reports LCP / FID / CLS / TTFB / FCP as metrics`}</code></pre>

      <h2>Sentry adapter</h2>
      <pre><code>{`import * as Sentry from '@sentry/browser';
import { useSentryAdapter } from '@mfjs/observability';

Sentry.init({ dsn: process.env.SENTRY_DSN });
useSentryAdapter(Sentry);`}</code></pre>

      <h2>Structured logger</h2>
      <pre><code>{`import { createLogger } from '@mfjs/observability';

const log = createLogger({ name: 'shell', level: 'info' });
log.info('boot', { region: 'us-east' });
// {"time":"...","level":"info","name":"shell","msg":"boot","ctx":{"region":"us-east"}}`}</code></pre>

      <h2>Runtime telemetry source</h2>
      <p>
        <code>@mfjs/runtime</code> emits <code>mfjs:remote-load</code> and <code>mfjs:error</code> DOM events
        for every remote load. Observability bridges them into the hook registry automatically when you
        import the package.
      </p>
    </>
  );
}
