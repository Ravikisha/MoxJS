---
title: CLI
description: Commands provided by the MFJS CLI.
---

MFJS comes with a workspace-aware CLI.

## Commands

### `mfjs init <name>`

Creates a new MFJS workspace (pnpm workspaces) with a `mfjs.config.json` and a typed `mfjs.config.ts` stub.

### `mfjs generate host <name>`

Scaffolds a host app in `apps/<name>`.

Generated apps currently use **Rspack** (`rspack.config.mjs`).

Generated hosts include a pre-wired `bootstrap.tsx` that uses `@mfjs/runtime`'s `NavLink`, `RemoteOutlet`, `usePathname`, and `getRouter` to load and display remote apps.

The generated `rspack.config.mjs` supports the **proxy remotes** dev workflow (see `mfjs dev --proxy-remotes` below).

### `mfjs generate remote <name>`

Scaffolds a remote app in `apps/<name>`.

Generated remotes include:

- `src/remote.tsx` — the default exposed module, using `RemoteApp` from `@mfjs/runtime`
- `src/pages/index.tsx` — a starter home page
- `src/mfjs.routes.ts` — initial generated routes file (regenerate any time with `mfjs routes`)

### `mfjs routes`

Scans `src/pages/` for `.tsx` files and generates `src/mfjs.routes.ts`.

Run from inside a remote app:

```sh
cd apps/dashboard
mfjs routes
```

#### File naming conventions

| File | Generated route |
|---|---|
| `src/pages/index.tsx` | `/` |
| `src/pages/settings.tsx` | `/settings` |
| `src/pages/users/[id].tsx` | `/users/:id` |
| `src/pages/reports/[year]/[month].tsx` | `/reports/:year/:month` |

Square brackets `[param]` become `:param` dynamic segments in the route pattern.

More specific routes are sorted before less specific ones; dynamic routes are placed before the root `/` catch-all.

#### Generated output

```ts
// src/mfjs.routes.ts  (auto-generated — do not edit by hand)
import type { RemotePageRoute } from '@mfjs/runtime';

export const pages: RemotePageRoute[] = [
  { path: '/users/:id', load: () => import('./pages/users/[id].tsx') },
  { path: '/settings',  load: () => import('./pages/settings.tsx') },
  { path: '/',          load: () => import('./pages/index.tsx') },
];
```

Import `pages` in your `remote.tsx` and pass it to `<RemoteApp pages={pages} />`.

### `mfjs dev`

Runs `pnpm dev` for all apps that include `mfjs.app.json`.

By default, this will also auto-generate `mfjs.federation.json` (by calling `mfjs federation`) if one or more apps are missing it.

Disable that behavior with:

- `mfjs dev --no-federation`

#### `mfjs dev --proxy-remotes`

Starts all apps like `mfjs dev`, but also:

- Writes `apps/<host>/mfjs.federation.proxy.json`
- Runs the host with `MFJS_FEDERATION_FILE=mfjs.federation.proxy.json`
- Rewrites each remote to a **same-origin URL** so the host fetches remotes through its own dev server:
  - `dashboard@http://localhost:3000/mfjs/remotes/dashboard/remoteEntry.js`

Important: when using proxy mode, the host dev server must proxy **all remote assets**, not just `remoteEntry.js`, because the remote may request additional split chunks at runtime.

The recommended proxy mapping is:

- `/mfjs/remotes/<remoteName>/*  ->  http://localhost:<remotePort>/*`

#### `mfjs dev --hmr-remotes`

Starts all apps and enables a small reload server. Passes `MFJS_DEV_RELOAD_URL` into each app so that when a remote recompiles, the host automatically refreshes.

Generated hosts call `connectMfjsDevReload()` from `@mfjs/runtime` when `MFJS_DEV_RELOAD_URL` is present.

### `mfjs build`

Runs `pnpm build` for all apps that include `mfjs.app.json`.

### `mfjs federation`

Generates starter federation config files:

- `apps/<remote>/mfjs.federation.json` with `exposes`
- `apps/<host>/mfjs.federation.json` with `remotes`

Auto-detection behavior:

- app name: `mfjs.app.json.name` (fallback: `package.json` name, then folder name)
- exposes (remotes): `mfjs.app.json.exposes` if present, fallback to `src/remote.tsx` or `src/App.tsx`
- shared deps: small allowlist inferred from `package.json` deps and `src/*` imports

The default remote expose is `./App -> ./src/remote.tsx`.

Generated apps already include a `rspack.config.mjs` that will load `mfjs.federation.json` (if present) and enable `ModuleFederationPlugin` automatically.

For Rspack, the remote entry is served at:

- `http://localhost:<remotePort>/remoteEntry.js`

---

## Example workspace

There is a runnable end-to-end example under:

- `examples/basic`

If you want an automated end-to-end proof (host loads remote, routing works), run the opt-in Playwright smoke test from the repo root:

- `MFJS_E2E=1 pnpm e2e`

For CI (always enabled), use:

- `pnpm e2e:ci`

Playwright writes an HTML report to `playwright-report/`.

---

## Coverage

To generate unit-test coverage for all packages/libraries:

- `pnpm coverage`

Each workspace writes an HTML + lcov report under its local `coverage/` folder.
