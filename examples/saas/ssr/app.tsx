import React from 'react';

function Nav({ href, label }) {
  return (
    <a href={href} style={{ marginRight: 12 }}>
      {label}
    </a>
  );
}

export default function App({ path }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <header>
        <h1 style={{ margin: 0 }}>MFJS SaaS</h1>
        <p style={{ marginTop: 6, opacity: 0.8 }}>
          SSR/SSG demo export — current route: <code>{path}</code>
        </p>
        <nav style={{ marginTop: 12 }}>
          <Nav href='/' label='Home' />
          <Nav href='/pricing' label='Pricing' />
          <Nav href='/app' label='App' />
          <Nav href='/app/settings' label='Settings' />
        </nav>
      </header>

      <hr style={{ margin: '18px 0' }} />

      {path === '/' && (
        <section data-testid='page-home'>
          <h2>Marketing</h2>
          <p>Landing page content. Great for SSG.</p>
        </section>
      )}

      {path === '/pricing' && (
        <section data-testid='page-pricing'>
          <h2>Pricing</h2>
          <ul>
            <li>Starter</li>
            <li>Pro</li>
            <li>Enterprise</li>
          </ul>
        </section>
      )}

      {path === '/app' && (
        <section data-testid='page-app'>
          <h2>App shell</h2>
          <p>This would normally require auth; here it's just a page.</p>
        </section>
      )}

      {path === '/app/settings' && (
        <section data-testid='page-settings'>
          <h2>Settings</h2>
          <p>Preferences, profile, billing, etc.</p>
        </section>
      )}
    </div>
  );
}
