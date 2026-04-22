export const metadata = { title: '@mfjs/security API' };

export default function SecApi() {
  return (
    <>
      <h1>@mfjs/security</h1>

      <h2>CSP</h2>
      <ul>
        <li><code>buildCsp(policy?, opts?)</code></li>
        <li><code>cspMeta(policy?, opts?)</code> — returns a <code>&lt;meta&gt;</code> tag</li>
        <li><code>generateNonce(bytes?)</code></li>
      </ul>

      <h2>SRI</h2>
      <ul>
        <li><code>sriHash(content, algo?)</code></li>
        <li><code>sriAttributes(content, algo?, crossorigin?)</code></li>
        <li><code>sriHashFromUrl(url, algo?)</code></li>
      </ul>

      <h2>Allowlist</h2>
      <ul>
        <li><code>new RemoteAllowlist(&#123; origins, names? &#125;)</code></li>
        <li><code>allow.isAllowed(url, name?)</code></li>
        <li><code>allow.assertAllowed(url, name?)</code></li>
      </ul>

      <h2>Sanitize</h2>
      <ul>
        <li><code>escapeHtml(s)</code></li>
        <li><code>safeJsonForScript(value)</code></li>
        <li><code>isSafePathname(p)</code></li>
      </ul>
    </>
  );
}
