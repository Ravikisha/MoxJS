export const metadata = { title: 'Getting started' };

export default function GettingStarted() {
  return (
    <>
      <h1>Getting started</h1>
      <p>
        MFJS scaffolds a complete micro-frontend workspace in a single command. This page walks you from a
        blank directory to a running host + remote with HMR.
      </p>

      <h2>Prerequisites</h2>
      <ul>
        <li>Node.js 20 or higher</li>
        <li>pnpm 9.15+ (<code>corepack enable &amp;&amp; corepack prepare pnpm@9.15.5 --activate</code>)</li>
      </ul>

      <h2>Install the CLI</h2>
      <pre><code>{`pnpm dlx @mfjs/cli@latest init my-app
# or globally
pnpm add -g @mfjs/cli`}</code></pre>

      <h2>Scaffold a workspace</h2>
      <pre><code>{`mfjs init my-app --tailwind
cd my-app

mfjs scaffold app
# or non-interactive:
mfjs generate host shell --port 3000
mfjs generate remote dashboard --port 3001
mfjs federation`}</code></pre>

      <p>
        The generated workspace uses pnpm workspaces, Rspack 1.x for bundling, and TypeScript 5 everywhere.
        Default layout:
      </p>

      <pre><code>{`my-app/
├── apps/
│   ├── shell/              # host (port 3000)
│   └── dashboard/          # remote (port 3001)
├── libs/                   # shared libs (created on demand)
├── mfjs.config.ts
├── package.json
└── pnpm-workspace.yaml`}</code></pre>

      <h2>Run the dev server</h2>
      <pre><code>{`mfjs dev
# with proxy-remotes (same-origin) and HMR reload:
mfjs dev --proxy-remotes --hmr-remotes`}</code></pre>

      <p>
        Open <code>http://localhost:3000</code>. The host mounts the dashboard remote under{' '}
        <code>/dashboard/*</code> and the index route.
      </p>

      <h2>Add a page</h2>
      <p>
        Drop a file in <code>apps/dashboard/src/pages/</code>. Regenerate routes:
      </p>

      <pre><code>{`# apps/dashboard/src/pages/settings.tsx
export default function Settings() {
  return <h2>Settings page</h2>;
}

# in the app folder:
mfjs routes --watch`}</code></pre>

      <p>
        Now <code>/dashboard/settings</code> renders the new page. The host's <code>RemoteOutlet</code>{' '}
        resolves the URL, the dashboard remote lazy-loads the matching page module, and React Fast Refresh
        keeps the state between edits.
      </p>

      <h2>Next steps</h2>
      <ul>
        <li>
          Read <a href="/docs/routing">Routing</a> to learn about guards, params, and navigation events.
        </li>
        <li>
          Read <a href="/docs/federation">Module Federation</a> for shared-dep strategy and CDN deploy.
        </li>
        <li>
          Read <a href="/docs/production-checklist">Production checklist</a> before shipping.
        </li>
      </ul>
    </>
  );
}
