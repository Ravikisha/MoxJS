---
title: Examples
description: Runnable example workspaces included in the repo.
---

MFJS ships with runnable example workspaces under the repo’s `examples/` folder.

## Basic

- Location: `examples/basic`
- What it covers: host + remote, routing, event bus, shared state, and dev workflows (proxy remotes, on-demand).
- Walkthrough: see [Example walkthrough](/guides/example/).

## E-commerce (SSG export)

- Location: `examples/ecommerce`
- What it covers: `mfjs ssr export` (static HTML export)

### Run

1) Export:

- `pnpm -C examples/ecommerce ssr:export`

2) Test exported output:

- `pnpm -C examples/ecommerce test`

## SaaS (SSG export)

- Location: `examples/saas`
- What it covers: `mfjs ssr export` (static HTML export)

### Run

1) Export:

- `pnpm -C examples/saas ssr:export`

2) Test exported output:

- `pnpm -C examples/saas test`
