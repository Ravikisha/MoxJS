import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <Features />
      <Quickstart />
      <Architecture />
      <CallToAction />
    </main>
  );
}

function Hero() {
  return (
    <section className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-xs text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300 mb-6">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500" />
          v0.1.0 — public beta
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          Micro-frontends <br />
          <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
            without the YAML graveyard.
          </span>
        </h1>
        <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          MFJS is an opinionated, zero-config framework for scalable micro-frontends. Built on Rspack Module
          Federation. Typed contracts, file-based routing, SSR, edge adapters, observability, and a CLI that
          Just Works.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/docs/getting-started"
            className="px-6 py-3 rounded-md bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 font-medium transition"
          >
            Get started
          </Link>
          <a
            href="https://github.com/mfjs/mfjs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-md border border-zinc-300 hover:border-zinc-900 dark:border-zinc-700 dark:hover:border-white font-medium transition"
          >
            GitHub →
          </a>
        </div>
        <div className="mt-8 inline-block bg-zinc-900 text-zinc-100 px-6 py-3 rounded-md font-mono text-sm">
          $ npx @mfjs/cli init my-app
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      title: 'Zero-config federation',
      body: 'Auto-detects apps, exposes, and shared deps from mfjs.app.json. No webpack wrestling.',
    },
    {
      title: 'File-based routing',
      body: 'Drop a file in src/pages — it becomes a route. Dynamic params and catch-all work out of the box.',
    },
    {
      title: 'Typed contracts',
      body: 'Federation boundaries become type-safe via @mfjs/types. InferExposed / InferEmits / InferListens.',
    },
    {
      title: 'SSR + static export',
      body: 'renderRouteToString, streaming SSR, static export, and edge adapters for Vercel and Cloudflare.',
    },
    {
      title: 'Security baked in',
      body: 'CSP builder, SRI for remoteEntry, remote allowlist, safe JSON hydration helpers.',
    },
    {
      title: 'Observability hooks',
      body: 'onError / onMetric / onRemoteLoad. Web Vitals collector. Sentry adapter out of the box.',
    },
    {
      title: 'Event bus + state',
      body: 'Typed pub/sub for cross-remote messaging. Redux-compatible store with singleton registry.',
    },
    {
      title: 'Deploy anywhere',
      body: 'Adapters for Vercel Edge, Cloudflare Workers/Pages, Node.js, and Docker. One command.',
    },
    {
      title: 'Production tooling',
      body: 'Changesets, CI templates, diagnose command, perf budgets, lint/test wrappers.',
    },
    {
      title: 'Nested routes + Outlet',
      body: 'React Router v6-style parent/child layouts with lazy chunks and Suspense boundaries.',
    },
    {
      title: 'Typed routes',
      body: 'createRoute binds Zod/Valibot validators — compile-time types and runtime checks on params.',
    },
    {
      title: 'View transitions',
      body: 'Native browser transitions wrap every navigation. Respects prefers-reduced-motion.',
    },
    {
      title: 'Prefetch on hover',
      body: 'NavLink prop warms remote bundles on hover/focus/touch. Navigations feel instant.',
    },
    {
      title: 'Offline Service Worker',
      body: 'mfjs sw generate ships a stale-while-revalidate SW for remoteEntry + network-first HTML.',
    },
    {
      title: 'Shadow DOM mount',
      body: 'ShadowRemote isolates remote CSS so third-party remotes never leak styles into the shell.',
    },
    {
      title: 'Islands hydration',
      body: 'Delay hydration to load / idle / visible / media / interaction — ship less client JS.',
    },
    {
      title: 'Concurrent preload',
      body: 'preloadRemotes loads N remotes in parallel on idle. Dedupes with loadRemoteEntry cache.',
    },
  ];
  return (
    <section className="py-24 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-12">
          Everything a production MFE stack needs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-600 transition"
            >
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Quickstart() {
  return (
    <section className="py-24 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Up and running in 60 seconds</h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            One command scaffolds a workspace with a host, a remote, federation config, file-based routes,
            and a dev server that proxies remotes onto the same origin.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/docs/getting-started"
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              Read the getting-started guide →
            </Link>
          </div>
        </div>
        <pre className="bg-zinc-900 text-zinc-100 p-6 rounded-lg text-sm overflow-x-auto font-mono">
{`mfjs init my-app
cd my-app

mfjs scaffold app

# or, non-interactive
mfjs generate host shell --port 3000
mfjs generate remote dashboard --port 3001
mfjs federation

mfjs dev`}
        </pre>
      </div>
    </section>
  );
}

function Architecture() {
  const items = [
    { name: '@mfjs/cli', role: 'Project scaffolding, dev server, build orchestration, deploy adapters' },
    { name: '@mfjs/runtime', role: 'Router, remote loader, hooks, guards, telemetry, version check' },
    { name: '@mfjs/ssr', role: 'Server rendering, streaming, static export, edge adapter, redirects' },
    { name: '@mfjs/security', role: 'CSP builder, SRI hashes, remote allowlist, safe JSON' },
    { name: '@mfjs/observability', role: 'onError / onMetric / onRemoteLoad hooks + Web Vitals + Sentry' },
    { name: '@mfjs/state', role: 'Singleton store registry and Redux-style createStore' },
    { name: '@mfjs/event-bus', role: 'Typed pub/sub for cross-remote messaging' },
    { name: '@mfjs/types', role: 'Federation contracts — InferExposed / InferEmits / InferListens' },
    { name: '@mfjs/adapter-vercel', role: 'Edge Functions + static assets deploy' },
    { name: '@mfjs/adapter-cloudflare', role: 'Workers + Pages Functions deploy' },
    { name: '@mfjs/adapter-node', role: 'Node.js HTTP server + Docker template' },
  ];
  return (
    <section className="py-24 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold tracking-tight text-center">Packages</h2>
        <p className="mt-3 text-center text-zinc-600 dark:text-zinc-400">
          Modular — use only what you need.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((i) => (
            <div
              key={i.name}
              className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-md flex items-baseline gap-4"
            >
              <code className="text-indigo-600 dark:text-indigo-400 font-mono text-sm shrink-0">
                {i.name}
              </code>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{i.role}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Ready to build?</h2>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Scaffold a production-ready workspace and ship your first federated app in under an hour.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/docs/getting-started"
            className="px-6 py-3 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 font-medium"
          >
            Start the tutorial
          </Link>
          <Link
            href="/docs/production-checklist"
            className="px-6 py-3 rounded-md border border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-white font-medium"
          >
            Production checklist
          </Link>
        </div>
      </div>
    </section>
  );
}
