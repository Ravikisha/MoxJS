# @mfjs/tsconfig

Reusable TypeScript presets.

## Presets

| Preset | For |
|---|---|
| `@mfjs/tsconfig/base.json` | Common strictness + ES2022 |
| `@mfjs/tsconfig/react.json` | React/JSX apps |
| `@mfjs/tsconfig/node.json` | Node.js CLIs / servers |
| `@mfjs/tsconfig/library.json` | Library builds (emits `.d.ts`) |

## Use

```json
{
  "extends": "@mfjs/tsconfig/react.json",
  "include": ["src"]
}
```
