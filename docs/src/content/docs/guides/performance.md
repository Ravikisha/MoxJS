---
title: Performance
description: Analyze bundle sizes, enforce budgets, and prevent regressions.
slug: guides/performance
---

MFJS includes a small set of performance-focused CLI tools designed to be **CI-friendly** and **bundler-agnostic**.

When available, you can optionally provide a bundler stats/metafile JSON to enable **stats-driven** features like per-route budgets.

## Bundle analysis

Use `mfjs perf analyze` to scan a `dist/` folder and print the largest emitted files.

```sh
cd apps/shell
pnpm build
mfjs perf analyze
```

### JSON output

```sh
mfjs perf analyze --format json
```

This is useful for CI pipelines or dashboards.

## Performance budgets

Budgets help catch accidental bloat.

```sh
mfjs perf analyze --budgets ./mfjs.perf-budgets.json
```

To fail CI on warnings too:

```sh
mfjs perf analyze --budgets ./mfjs.perf-budgets.json --fail-on-warn
```

Minimal example:

```json
{
  "budgets": [
    { "name": "main", "match": "main", "warnBytes": 250000, "maxBytes": 350000 }
  ]
}
```

### Per-route budgets (stats-driven)

If you want to enforce budgets per route (e.g. “landing page under 300KB, app routes under 500KB”), add a `routes` section.

Per-route budgets require a route→asset mapping from stats JSON.

1) Provide stats:

```sh
mfjs perf analyze --app shell --stats apps/shell/dist/stats.json
```

2) Ensure `stats.json` contains an `mfjs.routeAssets` map:

```json
{
  "mfjs": {
    "routeAssets": {
      "/": ["main.1234.js", "vendor.5678.js"],
      "/app": ["main.1234.js", "vendor.5678.js", "app.9999.js"]
    }
  }
}

### Generating `stats.json` (Rspack recipe)

MFJS doesn't hard-code a bundler implementation for route→asset mapping. Instead, you can add a small build plugin that writes a minimal `stats.json` containing `mfjs.routeAssets`.

MFJS ships a tiny helper for Rspack-compatible configs: `@mfjs/rspack-route-assets`.

In your `rspack.config.ts`:

```ts
import { mfjsRspackRouteAssetsPlugin } from '@mfjs/rspack-route-assets';

export default {
  // ... your normal config ...
  entry: {
    main: './src/main.tsx',
    app: './src/app.tsx',
  },
  plugins: [
    mfjsRspackRouteAssetsPlugin({
      // Route path -> entry name
      routeEntries: {
        '/': 'main',
        '/app': 'app',
      },
      // This will emit dist/stats.json by default
      statsFile: 'stats.json',
    }),
  ],
};
```

After `pnpm build`, you should have:

- `dist/stats.json` containing `{ mfjs: { routeAssets: ... } }`

Then you can run:

```sh
mfjs perf analyze --app shell --stats apps/shell/dist/stats.json
```
```

3) Add route rules to your budgets file:

```json
{
  "budgets": [],
  "routes": [
    { "path": "/", "warnBytes": 250000, "maxBytes": 350000 },
    { "path": "/app*", "warnBytes": 350000, "maxBytes": 500000 }
  ]
}
```

## Lazy loading enforcement

Use `mfjs lazy check` to do a best-effort scan of emitted JS bundles for patterns that commonly indicate **eager remote loading**.

```sh
mfjs lazy check --app shell --level warn
mfjs lazy check --app shell --level error
```

## Image optimization

Use `mfjs image optimize` to generate WebP/AVIF + responsive width variants from emitted images in `dist/`.

```sh
mfjs image optimize --app shell
```

Use `--dry-run` to preview output paths without writing files.
