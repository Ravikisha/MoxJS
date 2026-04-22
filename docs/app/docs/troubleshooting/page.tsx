export const metadata = { title: 'Troubleshooting' };

export default function Troubleshooting() {
  return (
    <>
      <h1>Troubleshooting</h1>

      <h2>Invalid hook call after loading a remote</h2>
      <p>
        Two copies of React are loaded. Both host and remote must declare React as a <code>singleton</code>{' '}
        in the share config. Use native <code>import('remote/App')</code> — not a runtime{' '}
        <code>loadRemoteModule()</code> helper — so Rspack bridges the share scope at build time.
      </p>

      <h2>Remote container not found after loading remoteEntry.js</h2>
      <p>
        The <code>remoteEntry.js</code> script loaded but the global container was never assigned. Usually
        the remote's <code>name</code> in its federation config does not match the name the host tries to
        load. Verify <code>mfjs.federation.json</code> on both sides.
      </p>

      <h2>Dev-time 404 for a remote split chunk</h2>
      <p>
        Cross-origin chunks require CORS or same-origin. Run{' '}
        <code>mfjs dev --proxy-remotes</code> so remote assets are proxied through the host origin.
      </p>

      <h2>Routes not updated after adding a page</h2>
      <p>
        The file-based routes manifest is static. Either:
      </p>
      <ul>
        <li>Run <code>mfjs routes</code> once; or</li>
        <li>Use <code>mfjs routes --watch</code> during dev.</li>
      </ul>

      <h2>Hydration mismatch on SSR</h2>
      <p>
        The server rendered a different tree than the client. Common causes: <code>Date.now()</code>,{' '}
        <code>Math.random()</code>, or reading <code>window</code> in a shared component. Guard browser-only
        code with <code>typeof window !== 'undefined'</code>.
      </p>

      <h2>CSP blocks hydration script</h2>
      <p>
        Pass a nonce to both the CSP header and the hydration tag:
      </p>
      <pre><code>{`const nonce = generateNonce();
response.setHeader('CSP', buildCsp({}, { nonce }));
html = html.replace('</head>', serializeState(state, { nonce }) + '</head>');`}</code></pre>

      <h2>Rspack 1.x type-error on lazyCompilation</h2>
      <p>
        Put <code>lazyCompilation: false</code> at the top of <code>rspack.config.mjs</code> — not inside{' '}
        <code>experiments</code>.
      </p>

      <h2>Still stuck?</h2>
      <p>
        Run <code>mfjs diagnose</code> for a full environment report, and set <code>MFJS_DEBUG=1</code> to
        surface stack traces. Open an issue at{' '}
        <a href="https://github.com/mfjs/mfjs/issues">github.com/mfjs/mfjs/issues</a> with the{' '}
        <code>diagnose</code> output attached.
      </p>
    </>
  );
}
