export const metadata = { title: 'Concepts' };

export default function Concepts() {
  return (
    <>
      <h1>Concepts</h1>
      <p>
        MFJS is built around a few core ideas. Understand these and the rest of the framework follows
        naturally.
      </p>

      <h2>Host and remote</h2>
      <p>
        A <strong>host</strong> (sometimes called the <em>shell</em>) is the container application the user
        navigates to. A <strong>remote</strong> is an independently-built bundle that the host lazy-loads at
        runtime via Module Federation. A workspace has one host and any number of remotes.
      </p>

      <h2>Federation boundary</h2>
      <p>
        Each remote exposes a set of modules (usually a <code>./App</code> entry) over a network URL called a{' '}
        <code>remoteEntry.js</code>. The host loads this URL, initializes the share scope, and resolves the
        exposed module. React and ReactDOM are declared as <em>singletons</em> so only one copy ever runs.
      </p>

      <h2>File-based routing</h2>
      <p>
        <code>mfjs routes</code> scans <code>src/pages/</code> in each app and emits two artifacts:
      </p>
      <ul>
        <li>
          <code>mfjs.routes.json</code> — a serialized manifest (app name + base path + routes).
        </li>
        <li>
          <code>src/mfjs.routes.ts</code> — an importable array of <code>&#123; path, load &#125;</code>{' '}
          entries wired to dynamic imports of each page file.
        </li>
      </ul>

      <h2>Two-tier routing</h2>
      <ol>
        <li>
          <strong>Host routes</strong> — which remote handles which URL prefix (e.g.{' '}
          <code>/dashboard/*</code> → dashboard remote).
        </li>
        <li>
          <strong>Remote pages</strong> — within the matched remote, a subpath selects the page file.
        </li>
      </ol>

      <h2>Opinionated but escape-hatchable</h2>
      <p>
        Defaults are Rspack + React + pnpm + TypeScript. You can override any generated config. Plugins hook
        into <code>configResolved</code>, <code>federationConfig</code>, and <code>devPlan</code>.
      </p>

      <h2>Production-first primitives</h2>
      <ul>
        <li>
          <strong>Security</strong>: CSP builder, SRI hashes, remote allowlist.
        </li>
        <li>
          <strong>Observability</strong>: <code>onError</code>, <code>onMetric</code>,{' '}
          <code>onRemoteLoad</code> hooks with Web Vitals and Sentry adapters.
        </li>
        <li>
          <strong>Deploy adapters</strong>: Vercel, Cloudflare, Node, Docker.
        </li>
      </ul>
    </>
  );
}
