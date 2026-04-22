export const metadata = { title: 'CSS isolation' };

export default function CssIsolation() {
  return (
    <>
      <h1>CSS isolation</h1>
      <p>
        Remotes ship CSS that can leak into the host. MFJS offers two isolation strategies: Shadow DOM
        mount (strongest) and selector-scoped CSS (simpler).
      </p>

      <h2>Shadow DOM mount</h2>
      <p>
        <code>ShadowRemote</code> attaches a shadow root, mounts a React subtree inside, and injects
        stylesheets. Styles cannot cross the shadow boundary.
      </p>

      <pre><code>{`import { ShadowRemote } from '@mfjs/runtime';

<ShadowRemote
  css={remoteCss}
  stylesheets={['https://cdn.mycorp.com/mfe/dashboard/styles.css']}
>
  <RemoteDashboard />
</ShadowRemote>`}</code></pre>

      <h2>Scoped selectors</h2>
      <pre><code>{`import { scopeCss } from '@mfjs/runtime';

const scoped = scopeCss(rawCss, '[data-remote="dashboard"]');
injectStyle(scoped);

<div data-remote="dashboard">
  <RemoteDashboard />
</div>`}</code></pre>

      <h2>Caveats</h2>
      <ul>
        <li>Shadow DOM breaks global <code>document.querySelector</code> — isolate by design.</li>
        <li>CSS-in-JS libraries may need the shadow root as style target — check their SSR adapter.</li>
        <li>Design tokens still propagate via CSS custom properties (they inherit).</li>
        <li>Focus traps and portals need to mount into the shadow root, not <code>document.body</code>.</li>
      </ul>
    </>
  );
}
