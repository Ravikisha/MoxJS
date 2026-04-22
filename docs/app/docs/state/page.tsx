export const metadata = { title: 'State & event bus' };

export default function StateDoc() {
  return (
    <>
      <h1>State &amp; event bus</h1>
      <p>
        Two primitives cover almost every cross-remote communication pattern: a typed event bus and a
        singleton store registry.
      </p>

      <h2>Event bus</h2>
      <pre><code>{`import { getEventBus } from '@mfjs/event-bus';

interface Events {
  'user:login': { userId: string };
  'cart:updated': { count: number };
}

const bus = getEventBus<Events>();
bus.on('cart:updated', (p) => console.log(p.count));
bus.emit('cart:updated', { count: 3 });`}</code></pre>

      <p>
        <code>bus</code> is a singleton — any remote that imports <code>@mfjs/event-bus</code> shares the same
        instance because the package is declared as a singleton in federation config.
      </p>

      <h2>Simple store</h2>
      <pre><code>{`import { getSimpleStore } from '@mfjs/state';

const auth = getSimpleStore<{ user: User | null }>('auth', { user: null });
auth.subscribe((s) => render(s));
auth.set({ user: { id: '1', email: 'x@y.z' } });`}</code></pre>

      <h2>Redux-style store</h2>
      <pre><code>{`import { getStore } from '@mfjs/state';

type State = { count: number };
type Action = { type: 'inc' } | { type: 'set'; value: number };

const store = getStore<State, Action>('counter', {
  initial: { count: 0 },
  reducer: (s, a) => {
    switch (a.type) {
      case 'inc': return { count: s.count + 1 };
      case 'set': return { count: a.value };
    }
  },
});
store.dispatch({ type: 'inc' });`}</code></pre>

      <h2>SSR hydration</h2>
      <pre><code>{`// server
import { serializeState } from '@mfjs/ssr';
const html = baseHtml.replace('</head>', serializeState(initialState) + '</head>');

// client
import { hydrateState } from '@mfjs/ssr';
const state = hydrateState<InitialState>();`}</code></pre>
    </>
  );
}
