export const metadata = { title: '@mfjs/runtime API' };

export default function RuntimeApi() {
  return (
    <>
      <h1>@mfjs/runtime</h1>
      <p>Router, remote loader, hooks, guards, telemetry, View Transitions, islands, Service Worker, Shadow DOM.</p>

      <h2>Router</h2>
      <ul>
        <li><code>getRouter(opts?)</code> — singleton</li>
        <li><code>createRouter(opts?)</code></li>
        <li><code>useRouter()</code> / <code>usePathname()</code></li>
        <li><code>dispatchMfjsNavigate(detail)</code></li>
        <li><code>attachMfjsNavigateListener()</code></li>
      </ul>

      <h2>Routing components</h2>
      <ul>
        <li><code>&lt;NavLink to label prefetch? activeStyle? /&gt;</code></li>
        <li><code>&lt;NavLinkPrefetchProvider config /&gt;</code></li>
        <li><code>&lt;RemoteOutlet routes remotes fallback? noMatch? /&gt;</code></li>
        <li><code>&lt;RemoteApp subpath pages fallback? noMatch? /&gt;</code></li>
        <li><code>&lt;ErrorBoundary fallback /&gt;</code></li>
      </ul>

      <h2>Nested routes</h2>
      <ul>
        <li><code>&lt;NestedRouter routes fallback? notFound? /&gt;</code></li>
        <li><code>&lt;Outlet /&gt;</code></li>
        <li><code>useOutletParams&lt;T&gt;()</code></li>
        <li><code>resolveChain(routes, pathname)</code></li>
      </ul>

      <h2>Typed routes</h2>
      <ul>
        <li><code>createRoute(&#123; path, params?, search? &#125;)</code></li>
        <li><code>defineRoutes(map)</code></li>
        <li>Validator contract: <code>&#123; parse(input): T, safeParse?: ... &#125;</code></li>
      </ul>

      <h2>Hooks</h2>
      <ul>
        <li><code>useSearchParams()</code> / <code>useQueryParam(key)</code></li>
        <li><code>useParams&lt;T&gt;()</code></li>
        <li><code>useNavigate()</code></li>
        <li><code>useNavigationEvents(handler)</code></li>
        <li><code>useRemoteData(&#123; key, fetcher, ttl? &#125;)</code></li>
      </ul>

      <h2>Guards</h2>
      <ul>
        <li><code>runGuards(resolved, pathname, globalGuards?)</code></li>
        <li><code>createAuthGuard / createRoleGuard</code></li>
      </ul>

      <h2>View Transitions</h2>
      <ul>
        <li><code>navigateWithTransition(detail, opts?)</code></li>
        <li><code>withViewTransition(update, opts?)</code></li>
        <li><code>supportsViewTransitions()</code></li>
        <li><code>prefersReducedMotion()</code></li>
      </ul>

      <h2>Prefetch</h2>
      <ul>
        <li><code>prefetchRoute(pathname, &#123; routes, remotes &#125;)</code></li>
        <li><code>resetPrefetchCache()</code></li>
      </ul>

      <h2>Concurrent preload</h2>
      <ul>
        <li><code>preloadRemotes(remotes, &#123; concurrency?, idle?, onResult? &#125;)</code></li>
      </ul>

      <h2>Service Worker</h2>
      <ul>
        <li><code>registerMfjsServiceWorker(opts?)</code></li>
        <li><code>unregisterMfjsServiceWorker()</code></li>
        <li><code>MFJS_SERVICE_WORKER_SOURCE</code> — inline SW script source</li>
      </ul>

      <h2>Shadow DOM</h2>
      <ul>
        <li><code>&lt;ShadowRemote mode? css? stylesheets? /&gt;</code></li>
        <li><code>scopeCss(css, scopePrefix)</code></li>
      </ul>

      <h2>Islands</h2>
      <ul>
        <li><code>&lt;Island strategy? load fallback? /&gt;</code></li>
        <li><code>clientBoundary(Component)</code></li>
      </ul>

      <h2>Remote loader</h2>
      <ul>
        <li><code>loadRemoteEntry(remote, opts?)</code></li>
        <li><code>loadRemoteModule&lt;T&gt;(remote, exposed, opts?)</code></li>
        <li><code>initRemoteContainer(remoteName)</code></li>
      </ul>

      <h2>Remote registry</h2>
      <ul>
        <li><code>getRemoteRegistry(opts?)</code> — singleton</li>
        <li><code>new RemoteRegistry(opts?)</code> — <code>register / unregister / get / list / load(manifestUrl)</code></li>
      </ul>

      <h2>Version check</h2>
      <ul>
        <li><code>checkVersions(&#123; host, remote, singletons? &#125;)</code></li>
      </ul>

      <h2>Telemetry</h2>
      <ul>
        <li><code>onRemoteLoad(cb)</code> / <code>onRuntimeError(cb)</code></li>
        <li><code>emitRemoteLoad(detail)</code> / <code>emitError(detail)</code></li>
        <li>DOM events: <code>mfjs:navigate</code>, <code>mfjs:remote-load</code>, <code>mfjs:error</code></li>
      </ul>

      <h2>Dev reload</h2>
      <ul>
        <li><code>connectMfjsDevReload(url?)</code></li>
      </ul>
    </>
  );
}
