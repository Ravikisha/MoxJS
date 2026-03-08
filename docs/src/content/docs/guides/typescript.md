---
title: TypeScript Integration
description: Strict TypeScript configuration, shared type library, and typed federation contracts for MFJS micro-frontends.
---

MFJS ships with a full TypeScript-first setup: a shared strict base config, a zero-runtime type
library (`@mfjs/types`), typed federation contracts, and a workspace-wide `mfjs typecheck` command.

---

## Strict TypeScript Base Config

The monorepo root contains a `tsconfig.base.json` that every package extends. It enables the
complete set of TypeScript strict flags so that type errors are caught uniformly, regardless of
which package you're working in.

```jsonc
// tsconfig.base.json (workspace root)
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    // Standard strict suite
    "strict": true,

    // Extra strictness beyond `strict: true`
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,

    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

Every package in `libs/`, `packages/`, and generated apps in `apps/` extends this base:

```jsonc
// packages/cli/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src"]
}
```

### Notable strict flags

| Flag | What it catches |
|---|---|
| `noUncheckedIndexedAccess` | Array / object index access returns `T \| undefined`, preventing silent out-of-bounds crashes. |
| `exactOptionalPropertyTypes` | Prevents assigning `{ prop: undefined }` to `{ prop?: string }` — requires the key to be absent. |
| `noImplicitOverride` | Class methods overriding a base-class method must have an explicit `override` keyword. |
| `noImplicitReturns` | Every code path in a function that returns a value must have an explicit `return`. |
| `noFallthroughCasesInSwitch` | Non-empty `case` blocks must end with `break`, `return`, or `throw`. |

---

## `@mfjs/types` — Shared Type Library

`@mfjs/types` is a **zero-runtime** package that provides all shared TypeScript types and
contract utilities used across host and remote micro-frontends. Because every type is a
TypeScript `type` alias or interface, nothing ships to the browser bundle.

The one exception is the `defineFederationContract` / `validateFederationContract` pair, which
has minimal runtime overhead (identity function + array traversal).

### App config types

```ts
import type { AppType, MfjsAppConfig } from '@mfjs/types';

const config: MfjsAppConfig = {
  name: 'shell',
  type: 'host',
  port: 3000,
  shared: ['react', 'react-dom'],
};
```

| Type | Description |
|---|---|
| `AppType` | `'host' \| 'remote'` |
| `MfjsAppConfig` | Full app configuration shape (name, type, port, exposes, shared). |

### Federation config types

```ts
import type { FederationConfig, SharedDependency, RemoteTarget } from '@mfjs/types';
```

| Type | Description |
|---|---|
| `FederationConfig` | Module Federation plugin config (name, filename, exposes, remotes, shared). |
| `SharedDependency` | Per-package sharing options (singleton, eager, requiredVersion). |
| `RemoteTarget` | Runtime remote descriptor `{ name, entryUrl }`. |

### Routing types

```ts
import type { RouteTarget, RouteMatch, NavigateMode, NavigateDetail } from '@mfjs/types';
```

| Type | Description |
|---|---|
| `RouteTarget` | `{ path, remote, expose? }` — a route and its remote mapping. |
| `RouteMatch<T>` | `{ target: T, params }` — result of matching a URL to a route. |
| `NavigateMode` | `'push' \| 'replace'` |
| `NavigateDetail` | Custom event payload for `mfjs:navigate` DOM events. |

---

## Typed Federation Contracts

A **federation contract** is a TypeScript description of what a remote micro-frontend exposes
and which events it emits or listens to. The host imports the contract type to get full type
safety without a runtime import.

### Defining a contract

```ts
// libs/contracts/dashboard.contract.ts  (in the remote workspace)
import { defineFederationContract } from '@mfjs/types';

export const dashboardContract = defineFederationContract({
  name: 'dashboard',

  // Type map of exposed modules — use `null as unknown as T` for type-only refs
  exposes: {
    './App': null as unknown as import('./src/App').default,
    './UserCard': null as unknown as import('./src/UserCard').default,
  },

  events: {
    emits:   ['dashboard:action', 'dashboard:ready'] as const,
    listens: ['shell:ready', 'shell:user-changed']   as const,
  },

  // Optional: runtime connection info
  remote: {
    name: 'dashboard',
    entryUrl: 'http://localhost:3001/remoteEntry.js',
  },
});

export type DashboardContract = typeof dashboardContract;
```

`defineFederationContract` is an identity function with a single generic `<T extends FederationContract>`.
This generic captures the **complete concrete type** of the object literal, including the exact
tuple literal types of `events.emits` and `events.listens`. Any other approach (multi-generic,
type cast) loses the literal types and makes the inference utilities below return `string`.

### Consuming the contract in the host

```ts
// apps/shell/src/types.ts
import type { DashboardContract } from 'libs/contracts/dashboard.contract.ts';
import type { InferExposed, InferEmits, InferListens } from '@mfjs/types';

// Exact type of the exposed App component — no runtime import
type DashboardApp = InferExposed<DashboardContract, './App'>;

// Exact union of emitted event keys
type DashboardEmits = InferEmits<DashboardContract>;
// => 'dashboard:action' | 'dashboard:ready'

// Exact union of listened event keys
type DashboardListens = InferListens<DashboardContract>;
// => 'shell:ready' | 'shell:user-changed'
```

### `InferExposed<C, K>`

Extracts the type of the module exposed at key `K` from contract `C`.

```ts
type InferExposed<C extends FederationContract, K extends keyof C['exposes']> =
  C['exposes'][K];
```

### `InferEmits<C>`

Extracts the union of event key strings this remote emits.

```ts
type InferEmits<C extends FederationContract> =
  C['events'] extends EventContract ? C['events']['emits'][number] : never;
```

### `InferListens<C>`

Extracts the union of event key strings this remote listens to.

```ts
type InferListens<C extends FederationContract> =
  C['events'] extends EventContract ? C['events']['listens'][number] : never;
```

---

## Runtime Contract Validation

`validateFederationContract` checks — at runtime — that a loaded Module Federation container
actually exposes all the keys declared in the contract. Use it after loading a remote container
to catch integration mismatches before they surface as cryptic `undefined` errors.

```ts
import { dashboardContract } from 'libs/contracts/dashboard.contract.ts';
import { validateFederationContract } from '@mfjs/types';

// `container` is the Rspack/Webpack MF container object
const container = window.__federation_mf_container__;

const violations = validateFederationContract(dashboardContract, container);

if (violations.length > 0) {
  console.error('Federation contract violated:', violations);
  // [{ field: 'exposes["./App"]', expected: 'key starting with "./"', received: '...' }]
}
```

`validateFederationContract` returns `ContractViolation[]`:

```ts
type ContractViolation = {
  field: string;    // Which field failed
  expected: string; // What was expected
  received: string; // What was actually found
};
```

---

## `mfjs typecheck` Command

Run `tsc --noEmit` across every package in the workspace in one command.

```bash
mfjs typecheck
```

```
Type-checking 7 package(s)…

  libs/event-bus … ✓
  libs/runtime   … ✓
  libs/ssr       … ✓
  libs/state     … ✓
  libs/types     … ✓
  libs/ui        … ✓
  packages/cli   … ✓

All 7 package(s) passed type-checking.
```

### Options

| Option | Default | Description |
|---|---|---|
| `--dir <path>` | `process.cwd()` | Workspace root to scan for packages. |
| `--fail-fast` | `false` | Stop after the first package with type errors. |

### How it works

1. Scans `libs/*/`, `packages/*/`, and `apps/*/` for directories containing a `tsconfig.json`.
2. For each package, checks whether its `package.json` defines a `typecheck` script — if so,
   runs `pnpm run typecheck` (so each package controls its own flags / paths).
3. Falls back to `tsc --noEmit` directly if no `typecheck` script exists.
4. Exits with code `1` if any package has type errors.

### Generated apps

Apps scaffolded by `mfjs generate` automatically include a `typecheck` script and a
`tsconfig.json` that extends `../../tsconfig.base.json`:

```bash
mfjs generate host shell
# generates apps/shell/tsconfig.json  →  { "extends": "../../tsconfig.base.json", … }
# generates apps/shell/package.json   →  { "scripts": { "typecheck": "tsc --noEmit", … } }
```

---

## Typing the EventBus

`@mfjs/event-bus` ships a generic `TypedEventBus<Events>` where `Events` is a record of
event-name → payload type. Pair this with `InferEmits` and `InferListens` from your contract:

```ts
import { createTypedEventBus } from '@mfjs/event-bus';
import type { DashboardContract } from 'libs/contracts/dashboard.contract.ts';
import type { InferEmits } from '@mfjs/types';

// Build an event map from the contract
type DashboardEvents = {
  [K in InferEmits<DashboardContract>]: unknown;
};

const bus = createTypedEventBus<DashboardEvents>();

bus.emit('dashboard:action', payload); // ✓ type-checked
bus.emit('dashboard:typo',   payload); // ✗ TS error
```

See the [EventBus guide](/guides/event-bus) for the full typed API.
