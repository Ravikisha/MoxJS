import React from 'react';
import ReactDOM from 'react-dom/client';
import { NavLink, RemoteOutlet, usePathname, getRouter, type RouteTarget } from '@mfjs/runtime';

// ── Route table ───────────────────────────────────────────────────────────────

const HOST_ROUTES: RouteTarget[] = [
  { path: '/dashboard/*', remote: 'dashboard', module: './App' },
  { path: '/',            remote: 'dashboard', module: './App' },
];

// ── Remote importers ──────────────────────────────────────────────────────────
// Each key matches a `remote` name in HOST_ROUTES.
// Uses Rspack's native federation import so the host's React singleton is shared.

const REMOTES = {
  dashboard: () => import('dashboard/App'),
};

// ── Initialise the router at module level (outside React) ─────────────────────
// This prevents React StrictMode's double-effect from removing window listeners.
getRouter();

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  const pathname = usePathname();

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh' }}>
      <header
        data-testid="shell-header"
        style={{
          background: '#1e1b4b',
          color: 'white',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 18 }}>🧩 MFJS Shell</span>
        <nav style={{ marginLeft: 24, display: 'flex', gap: 4 }}>
          <NavLink to="/" label="Home" />
          <NavLink to="/dashboard/settings" label="Settings" />
          <NavLink to="/dashboard/users/42" label="User 42" />
        </nav>
        <span
          data-testid="current-path"
          style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.7 }}
        >
          {pathname}
        </span>
      </header>
      <main style={{ padding: 24 }}>
        <RemoteOutlet routes={HOST_ROUTES} remotes={REMOTES} />
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
