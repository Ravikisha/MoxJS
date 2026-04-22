# @mfjs/security

Security primitives for MFJS. CSP builder, SRI hashes, remote allowlist, HTML/JSON sanitizers.

## Install

```sh
pnpm add @mfjs/security
```

## CSP

```ts
import { buildCsp, generateNonce } from '@mfjs/security';

const nonce = generateNonce();
const header = buildCsp(
  { 'script-src': ["'self'"] },
  { remotes: ['https://dashboard.cdn.example.com'], nonce, reportUri: '/csp-report' },
);
response.setHeader('Content-Security-Policy', header);
```

## SRI

```ts
import { sriHash } from '@mfjs/security';
const integrity = sriHash(bufferOfRemoteEntry, 'sha384');
// → 'sha384-...'
```

## Remote allowlist

```ts
import { RemoteAllowlist } from '@mfjs/security';

const allow = new RemoteAllowlist({
  origins: ['https://*.cdn.mycorp.com'],
  names: ['dashboard', 'profile'],
});
allow.assertAllowed('https://dashboard.cdn.mycorp.com/remoteEntry.js', 'dashboard');
```

## Sanitizers

```ts
import { escapeHtml, safeJsonForScript } from '@mfjs/security';
const initialState = `<script>window.__STATE__=${safeJsonForScript(state)}</script>`;
```
