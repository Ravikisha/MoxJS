export const metadata = { title: 'Nested routes' };

export default function NestedRoutes() {
  return (
    <>
      <h1>Nested routes</h1>
      <p>
        <code>NestedRouter</code> renders a parent/child route tree with React Router v6-style{' '}
        <code>Outlet</code> slots. Each layer picks up its own params; unmatched tails render the nearest{' '}
        <code>noMatch</code>.
      </p>

      <h2>Define the tree</h2>
      <pre><code>{`import { NestedRouter, Outlet, type NestedRoute } from '@mfjs/runtime';

const routes: NestedRoute[] = [
  {
    path: '/app',
    element: <AppShell />,
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: 'users',
        element: <UsersLayout />,
        children: [
          { index: true, lazy: () => import('./pages/users/index.js') },
          { path: ':id', lazy: () => import('./pages/users/detail.js') },
        ],
      },
      { path: 'settings/*', lazy: () => import('./pages/settings.js') },
    ],
  },
];

export default function Root() {
  return <NestedRouter routes={routes} fallback={<Spinner />} notFound={<NotFound />} />;
}

function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main><Outlet /></main>
    </div>
  );
}`}</code></pre>

      <h2>Index routes</h2>
      <p>
        Mark a child with <code>index: true</code> to render when the parent path matches exactly. Only one
        index per children array.
      </p>

      <h2>Lazy layouts</h2>
      <p>
        Any route can ship <code>lazy: () =&gt; import(...)</code> instead of <code>element</code>. The module
        default export becomes the layout/page. React Suspense shows <code>fallback</code> while the chunk
        loads.
      </p>

      <h2>Params from ancestors</h2>
      <pre><code>{`import { useOutletParams } from '@mfjs/runtime';

function UserDetail() {
  const params = useOutletParams<{ id: string }>();
  return <h1>User {params.id}</h1>;
}`}</code></pre>

      <h2>Interop with federated remotes</h2>
      <p>
        Put <code>RemoteOutlet</code> inside a layout element. The nested router owns the chrome, the remote
        owns a subtree. Both coexist because they read the same <code>usePathname</code> stream.
      </p>
    </>
  );
}
