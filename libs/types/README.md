# @mfjs/types

Shared TypeScript types and small runtime helpers for MFJS configs, plugins, and federation contracts.

## Highlights

- `MfjsWorkspaceConfig`, `MfjsAppConfig`, `MfjsFederationConfig`, `MfjsRoutesConfig`.
- `MfjsPlugin` and `applyPlugins` runtime hooks.
- `validateFederationContractKeys` (sync, structural) and `validateFederationContract` (async, calls `container.get` to verify exposed modules).
- `defaultRoutingCompiler` — turns `src/pages/**` into a sorted route table.

## Install

```sh
pnpm add -D @mfjs/types
```
