export const metadata = { title: 'Routing' };

export default function Routing() {
  return (
    <>
      <h1>Routing</h1>
      <p>
        MFJS routing has two tiers: the host owns top-level routes, each remote owns its sub-routes. Both
        layers are built on the browser History API — no <code>react-router</code> required.
      </p>

      <h2>Host routes</h2>
      <pre><code>{`// apps/shell/src/bootstrap.tsx
import { NavLink, RemoteOutlet, getRouter } from '@mfjs/runtime';
import type { RouteTarget } from '@mfjs/runtime';

const HOST_ROUTES: RouteTarget[] = [
  { path: '/dashboard/*', remote: 'dashboard', module: './App' },
  { path: '/',            remote: 'dashboard', module: './App' },
];

const REMOTES = {
  dashboard: () => import('dashboard/App'),
};

getRouter(); // singleton, safe under StrictMode

export default function App() {
  return (
    <>
      <header>
        <NavLink to="/" label="Home" />
        <NavLink to="/dashboard/settings" label="Settings" />
      </header>
      <main>
        <RemoteOutlet routes={HOST_ROUTES} remotes={REMOTES} />
      </main>
    </>
  );
}`}</code></pre>

      <h2>Remote pages (file-based)</h2>
      <pre><code>{`apps/dashboard/src/pages/
├── index.tsx         // -> /
├── settings.tsx      // -> /settings
└── users/[id].tsx    // -> /users/:id`}</code></pre>

      <p>
        Run <code>mfjs routes</code> to compile this tree into <code>src/mfjs.routes.ts</code> and pass it to{' '}
        <code>RemoteApp</code>:
      </p>

      <pre><code>{`// apps/dashboard/src/remote.tsx
import { RemoteApp } from '@mfjs/runtime';
import { pages } from './mfjs.routes.js';

export default function RemoteRoot({ subpath = '/' }: { subpath?: string }) {
  return <RemoteApp subpath={subpath} pages={pages} />;
}`}</code></pre>

      <h2>Hooks</h2>
      <ul>
        <li><code>useRouter()</code> — access the singleton router</li>
        <li><code>usePathname()</code> — current pathname (re-renders on navigation)</li>
        <li><code>useSearchParams()</code> — reactive <code>[URLSearchParams, setter]</code></li>
        <li><code>useQueryParam(key)</code> — single query param getter/setter</li>
        <li><code>useParams()</code> — route params from the nearest <code>ParamsProvider</code></li>
        <li><code>useNavigate()</code> — <code>navigate(to, &#123; replace?, state? &#125;)</code></li>
        <li><code>useNavigationEvents(fn)</code> — fires on <code>start</code> and <code>complete</code></li>
      </ul>

      <h2>Dynamic segments</h2>
      <ul>
        <li>
          <code>[id].tsx</code> → <code>/users/:id</code>
        </li>
        <li>
          <code>[...rest].tsx</code> → <code>/docs/*</code>
        </li>
      </ul>

      <h2>Route guards</h2>
      <pre><code>{`import { createAuthGuard, runGuards } from '@mfjs/runtime';

const authGuard = createAuthGuard({
  isAuthenticated: () => !!localStorage.getItem('token'),
  loginPath: '/login',
});

const routes = [
  {
    path: '/dashboard/*',
    remote: 'dashboard',
    module: './App',
    guards: [authGuard],
  },
];`}</code></pre>

      <p>
        Guards run in order; a falsy result blocks the route, and <code>&#123; redirect &#125;</code>{' '}
        redirects instead. <code>runGuards()</code> lets you integrate the chain into a custom outlet.
      </p>

      <h2>Cross-app navigation</h2>
      <p>
        Remote code navigates without importing the router by dispatching a DOM event:
      </p>
      <pre><code>{`import { dispatchMfjsNavigate } from '@mfjs/runtime';
dispatchMfjsNavigate({ to: '/dashboard/settings' });`}</code></pre>
    </>
  );
}
