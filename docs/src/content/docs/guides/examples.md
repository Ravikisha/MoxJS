---
title: Examples
---

MFJS ships with a few runnable examples under the repo’s `examples/` folder.

## Basic

- Location: `examples/basic`
- What it covers: host + remote, routing, event bus, shared state, on-demand / proxy remotes.
- Tests: root Playwright suite (`tests/e2e/*`) — see `pnpm e2e`.

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
