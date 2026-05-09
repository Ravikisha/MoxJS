# @mfjs/events

Shared event-name and payload type registry for MFJS micro-frontends. Apps can extend the `MfAppEvents` interface via TypeScript declaration merging to add their own events while keeping the type contract centralised.

## Install

```sh
pnpm add @mfjs/events
```

## Extending

```ts
// app/src/events.d.ts
import '@mfjs/events';
declare module '@mfjs/events' {
  interface MfAppEvents {
    'cart:added': { sku: string; qty: number };
  }
}
```
