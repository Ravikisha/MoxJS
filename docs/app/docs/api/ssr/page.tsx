export const metadata = { title: '@mfjs/ssr API' };

export default function SsrApi() {
  return (
    <>
      <h1>@mfjs/ssr</h1>
      <p>Server-rendering toolkit for MFJS. Framework-agnostic — you pass your React App and routes.</p>

      <h2>Render</h2>
      <ul>
        <li><code>renderRouteToString(App, &#123; path, params &#125;)</code> → <code>SsrRenderResult</code></li>
        <li><code>renderRouteToStream(App, &#123; path, params &#125;)</code> → <code>StreamRenderResult</code></li>
        <li><code>injectIntoTemplate(template, html)</code></li>
      </ul>

      <h2>Static export</h2>
      <ul>
        <li><code>staticExport(&#123; App, template, routes, outDir &#125;)</code></li>
      </ul>

      <h2>Edge adapter</h2>
      <ul>
        <li><code>createEdgeAdapter(&#123; App, template, routes, cache?, etag?, csp?, onNotFound? &#125;)</code></li>
      </ul>

      <h2>Remote SSR</h2>
      <ul>
        <li><code>ssrLoadRemote(name, url)</code></li>
        <li><code>ssrRenderRemote(remote, opts)</code></li>
        <li><code>createSsrRemoteOutlet(config)</code></li>
      </ul>

      <h2>Redirects</h2>
      <ul>
        <li><code>redirect(location, status?)</code> — throws <code>SsrRedirect</code></li>
        <li><code>isRedirect(err)</code></li>
        <li><code>SsrRedirect</code> class — &#123; <code>status</code>, <code>location</code> &#125;</li>
      </ul>

      <h2>State hydration</h2>
      <ul>
        <li><code>serializeState(state, &#123; key?, nonce? &#125;)</code></li>
        <li><code>hydrateState&lt;T&gt;(key?)</code></li>
        <li><code>clearHydratedState(key?)</code></li>
      </ul>

      <h2>Preload links</h2>
      <ul>
        <li><code>buildPreloadTags(links)</code></li>
        <li><code>remoteEntryPreloads(remotes)</code></li>
      </ul>

      <h2>Cache headers</h2>
      <ul>
        <li><code>cacheControl(opts)</code></li>
        <li><code>buildWeakEtag(body)</code></li>
        <li><code>ifNoneMatchHit(etag, header)</code></li>
      </ul>
    </>
  );
}
