---
title: Performance
description: Analyze bundle sizes, enforce budgets, and prevent regressions.
---

MFJS includes a small set of performance-focused CLI tools designed to be **CI-friendly** and **bundler-agnostic**.

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
  "rules": [
    { "name": "main", "match": "**/main*.js", "warnBytes": 250000, "errorBytes": 350000 }
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
