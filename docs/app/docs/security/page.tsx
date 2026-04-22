export const metadata = { title: 'Security' };

export default function Security() {
  return (
    <>
      <h1>Security</h1>
      <p>
        <code>@mfjs/security</code> ships the primitives every production micro-frontend needs: CSP builder,
        Subresource Integrity hashes, remote allowlist, safe JSON hydration.
      </p>

      <h2>Content Security Policy</h2>
      <pre><code>{`import { buildCsp, generateNonce } from '@mfjs/security';

const nonce = generateNonce();
const header = buildCsp(
  { 'script-src': ["'self'"] },
  {
    remotes: ['https://cdn.mycorp.com'],
    nonce,
    reportUri: '/csp-report',
  },
);
response.setHeader('Content-Security-Policy', header);`}</code></pre>

      <p>
        Hand the same nonce to <code>serializeState</code> so inline hydration scripts pass the policy:
      </p>

      <pre><code>{`import { serializeState } from '@mfjs/ssr';
const tag = serializeState(state, { nonce });`}</code></pre>

      <h2>Subresource Integrity</h2>
      <pre><code>{`import { sriHash, sriHashFromUrl } from '@mfjs/security';

// at build time
const integrity = sriHash(remoteEntryBytes, 'sha384');

// or fetched
const integrity = await sriHashFromUrl('https://cdn.mycorp.com/mfe/dashboard/remoteEntry.js');`}</code></pre>

      <p>
        Attach <code>integrity</code> + <code>crossorigin=&quot;anonymous&quot;</code> when injecting the
        <code>remoteEntry</code> script. The runtime preload helper{' '}
        <code>remoteEntryPreloads()</code> accepts an <code>integrity</code> field.
      </p>

      <h2>Remote allowlist</h2>
      <pre><code>{`import { RemoteAllowlist } from '@mfjs/security';
import { getRemoteRegistry } from '@mfjs/runtime';

const allow = new RemoteAllowlist({
  origins: ['https://*.cdn.mycorp.com'],
  names: ['dashboard', 'profile'],
});

getRemoteRegistry({
  validate: (r) => allow.assertAllowed(r.entryUrl, r.name),
});`}</code></pre>

      <h2>Safe JSON &amp; HTML</h2>
      <pre><code>{`import { safeJsonForScript, escapeHtml } from '@mfjs/security';

const tag = \`<script>window.__STATE__=\${safeJsonForScript(state)}</script>\`;
const safe = escapeHtml(userInput);`}</code></pre>

      <h2>Checklist</h2>
      <ul>
        <li>Return a restrictive CSP on every HTML response.</li>
        <li>Emit SRI for every <code>remoteEntry.js</code> served from a CDN.</li>
        <li>Register a <code>RemoteAllowlist</code> and wire it to <code>getRemoteRegistry</code>.</li>
        <li>Use <code>safeJsonForScript</code> for inline hydration — never <code>JSON.stringify</code>.</li>
        <li>Set <code>frame-ancestors</code> to prevent clickjacking.</li>
      </ul>
    </>
  );
}
