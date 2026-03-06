import React from 'react';
import ReactDOM from 'react-dom/client';
import { loadRemoteModule } from '@mfjs/runtime';

type RemoteModule = { default: React.ComponentType };

const REMOTE = {
  name: 'dashboard',
  entryUrl: 'http://localhost:3001/remoteEntry.js',
};

function App() {
  const [Remote, setRemote] = React.useState<React.ComponentType | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    loadRemoteModule<RemoteModule>(REMOTE, './App')
      .then((mod) => { if (!cancelled) setRemote(() => mod.default); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); });
    return () => { cancelled = true; };
  }, []);

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
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 18 }}>🧩 MFJS Shell</span>
      </header>
      <main style={{ padding: 24 }}>
        {error ? (
          <pre style={{ color: 'crimson', whiteSpace: 'pre-wrap' }}>{error}</pre>
        ) : Remote ? (
          <Remote />
        ) : (
          <p data-testid="loading-remote" style={{ color: '#888' }}>Loading remote…</p>
        )}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
