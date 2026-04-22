export const metadata = { title: 'CLI reference' };

export default function CliReference() {
  return (
    <>
      <h1>CLI reference</h1>
      <p>
        The <code>mfjs</code> CLI ships every workflow you need. Run <code>mfjs --help</code> for the current
        command list.
      </p>

      <h2>Project commands</h2>
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>mfjs init &lt;name&gt;</code></td><td>Create a new workspace (pnpm, TypeScript, CI templates)</td></tr>
          <tr><td><code>mfjs scaffold app</code></td><td>Guided prompts to add host + remote(s)</td></tr>
          <tr><td><code>mfjs generate host &lt;name&gt; --port</code></td><td>Add a host app</td></tr>
          <tr><td><code>mfjs generate remote &lt;name&gt; --port</code></td><td>Add a remote app</td></tr>
          <tr><td><code>mfjs generate wizard</code></td><td>Prompt-driven generator</td></tr>
        </tbody>
      </table>

      <h2>Dev &amp; build</h2>
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>mfjs dev</code></td><td>Run all apps with Rspack dev-server</td></tr>
          <tr><td><code>mfjs dev --proxy-remotes</code></td><td>Serve remotes under the host origin</td></tr>
          <tr><td><code>mfjs dev --hmr-remotes</code></td><td>Cross-app HMR via WebSocket</td></tr>
          <tr><td><code>mfjs build</code></td><td>Production build (host first, then remotes)</td></tr>
          <tr><td><code>mfjs build --compress</code></td><td>Emit <code>.gz</code> / <code>.br</code> alongside assets</td></tr>
          <tr><td><code>mfjs federation</code></td><td>Regenerate <code>mfjs.federation.json</code> files</td></tr>
          <tr><td><code>mfjs routes</code></td><td>Compile <code>src/pages</code> into route manifests</td></tr>
          <tr><td><code>mfjs routes --watch</code></td><td>Re-compile on file changes</td></tr>
        </tbody>
      </table>

      <h2>SSR</h2>
      <table>
        <thead>
          <tr><th>Command</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mfjs ssr export</code></td><td>Pre-render routes to static HTML</td></tr>
          <tr><td><code>mfjs ssr serve --port</code></td><td>Streaming Node SSR server</td></tr>
          <tr><td><code>mfjs ssr serve --no-stream</code></td><td>Synchronous SSR</td></tr>
        </tbody>
      </table>

      <h2>Quality</h2>
      <table>
        <thead>
          <tr><th>Command</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mfjs lint</code></td><td>ESLint across the workspace</td></tr>
          <tr><td><code>mfjs test</code></td><td>Vitest across the workspace</td></tr>
          <tr><td><code>mfjs typecheck</code></td><td>tsc --noEmit per package</td></tr>
          <tr><td><code>mfjs perf</code></td><td>Bundle size budget check</td></tr>
        </tbody>
      </table>

      <h2>Ops</h2>
      <table>
        <thead>
          <tr><th>Command</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td><code>mfjs diagnose</code></td><td>Verify Node, pnpm, configs, ports, deps</td></tr>
          <tr><td><code>mfjs env check</code></td><td>Fail if any var in <code>.env.example</code> missing</td></tr>
          <tr><td><code>mfjs env scaffold</code></td><td>Write a starter <code>.env.example</code></td></tr>
          <tr><td><code>mfjs deploy --target vercel</code></td><td>Scaffold <code>vercel.json</code></td></tr>
          <tr><td><code>mfjs deploy --target cloudflare</code></td><td>Scaffold <code>wrangler.toml</code></td></tr>
          <tr><td><code>mfjs deploy --target docker</code></td><td>Scaffold <code>Dockerfile</code></td></tr>
          <tr><td><code>mfjs ci affected</code></td><td>List apps affected by the last commit</td></tr>
          <tr><td><code>mfjs sw generate --app &lt;name&gt;</code></td><td>Write <code>mfjs-sw.js</code> into a host app <code>public/</code> folder</td></tr>
        </tbody>
      </table>

      <h2>Debug</h2>
      <p>
        Set <code>MFJS_DEBUG=1</code> to include stack traces in error output.
      </p>
    </>
  );
}
