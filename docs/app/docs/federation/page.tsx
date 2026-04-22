export const metadata = { title: 'Module Federation' };

export default function Federation() {
  return (
    <>
      <h1>Module Federation</h1>
      <p>
        MFJS uses Rspack's <code>ModuleFederationPlugin</code>. Configuration is derived from{' '}
        <code>mfjs.app.json</code> and <code>mfjs.federation.json</code>; you rarely edit webpack/rspack
        configs directly.
      </p>

      <h2>Auto-detection</h2>
      <p>
        Running <code>mfjs federation</code> infers:
      </p>
      <ul>
        <li><strong>Name</strong> — <code>mfjs.app.json.name</code> → <code>package.json</code> → folder</li>
        <li><strong>Exposes</strong> — <code>mfjs.app.json.exposes</code> → <code>src/remote.tsx</code> → <code>src/App.tsx</code></li>
        <li><strong>Shared deps</strong> — singleton-worthy packages from <code>package.json</code></li>
      </ul>

      <h2>remoteEntry URL</h2>
      <pre><code>{`http://<host>:<port>/remoteEntry.js`}</code></pre>

      <h2>React singleton</h2>
      <p>
        React and ReactDOM must be shared as a singleton. Host sets <code>eager: true</code>, remotes keep{' '}
        <code>eager: false</code>.
      </p>

      <pre><code>{`// host rspack.config.mjs
shared: {
  react:       { singleton: true, requiredVersion: '^18', eager: true },
  'react-dom': { singleton: true, requiredVersion: '^18', eager: true },
}

// remote rspack.config.mjs
shared: {
  react:       { singleton: true, requiredVersion: '^18', eager: false },
  'react-dom': { singleton: true, requiredVersion: '^18', eager: false },
}`}</code></pre>

      <h2>Runtime registry</h2>
      <p>
        Hard-coding remote URLs works fine for static deploys. For dynamic discovery, use{' '}
        <code>RemoteRegistry</code>:
      </p>

      <pre><code>{`import { getRemoteRegistry } from '@mfjs/runtime';

const registry = getRemoteRegistry();
await registry.load('https://cdn.mycorp.com/mfe/manifest.json');

// manifest.json
{
  "remotes": [
    { "name": "dashboard", "entryUrl": "https://cdn.mycorp.com/mfe/dashboard/remoteEntry.js", "version": "1.2.3" }
  ]
}`}</code></pre>

      <h2>Version mismatch check</h2>
      <pre><code>{`import { checkVersions } from '@mfjs/runtime';

checkVersions({
  host:   { react: '18.3.1' },
  remote: { react: '17.0.0' },
  singletons: ['react', 'react-dom'],
});
// logs "[mfjs] version mismatch for 'react': host 18.3.1 vs remote 17.0.0" (error)`}</code></pre>

      <h2>Dev proxying</h2>
      <p>
        <code>mfjs dev --proxy-remotes</code> rewrites remote URLs to same-origin paths under the host:
      </p>
      <pre><code>{`/mfjs/remotes/dashboard/*  →  http://localhost:3001/*`}</code></pre>
      <p>
        This avoids dev-time 404s for split chunks and matches production CDN-style serving.
      </p>

      <h2>CDN deploy</h2>
      <p>
        Set <code>federation.publicPath</code> in <code>mfjs.config.ts</code> before <code>mfjs build</code>:
      </p>
      <pre><code>{`// mfjs.config.ts
export default {
  federation: {
    publicPath: 'https://cdn.mycorp.com/mfe/',
  },
};`}</code></pre>
    </>
  );
}
