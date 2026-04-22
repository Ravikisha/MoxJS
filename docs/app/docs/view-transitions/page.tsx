export const metadata = { title: 'View transitions' };

export default function ViewTransitionsDoc() {
  return (
    <>
      <h1>View transitions</h1>
      <p>
        The browser View Transitions API animates between two DOM snapshots. MFJS wraps navigation in{' '}
        <code>document.startViewTransition()</code> when available and falls back gracefully.
      </p>

      <h2>Navigate with a transition</h2>
      <pre><code>{`import { navigateWithTransition } from '@mfjs/runtime';

<button onClick={() => navigateWithTransition({ to: '/dashboard/settings' })}>
  Settings
</button>`}</code></pre>

      <h2>Wrap any state change</h2>
      <pre><code>{`import { withViewTransition } from '@mfjs/runtime';

await withViewTransition(() => {
  setTheme('dark');
});`}</code></pre>

      <h2>Reduced motion</h2>
      <p>
        Transitions are skipped when the user sets <code>prefers-reduced-motion: reduce</code>. Override via{' '}
        <code>&#123; respectReducedMotion: false &#125;</code> if your UI needs the animation for layout.
      </p>

      <h2>Global CSS</h2>
      <pre><code>{`::view-transition-old(root) {
  animation: fade-out 0.2s ease-out;
}
::view-transition-new(root) {
  animation: fade-in 0.2s ease-in;
}

@keyframes fade-out { to { opacity: 0 } }
@keyframes fade-in  { from { opacity: 0 } }`}</code></pre>

      <h2>Named transitions</h2>
      <p>
        Assign a <code>view-transition-name</code> on an element to animate it between routes, e.g. a hero
        image that persists across navigations.
      </p>
    </>
  );
}
