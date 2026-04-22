export const metadata = { title: '@mfjs/event-bus API' };

export default function EventBusApi() {
  return (
    <>
      <h1>@mfjs/event-bus</h1>

      <h2>API</h2>
      <ul>
        <li><code>getEventBus&lt;EventMap&gt;()</code> — singleton</li>
        <li><code>new EventBus&lt;EventMap&gt;()</code></li>
        <li><code>bus.on(type, handler)</code></li>
        <li><code>bus.once(type, handler)</code></li>
        <li><code>bus.off(type, handler)</code></li>
        <li><code>bus.emit(type, payload)</code></li>
        <li><code>bus.clear(type?)</code></li>
        <li><code>bus.listenerCount(type)</code></li>
      </ul>

      <h2>Typed events</h2>
      <pre><code>{`interface MyEvents {
  'user:login': { userId: string };
  'cart:add':   { sku: string; qty: number };
}

const bus = getEventBus<MyEvents>();
bus.emit('cart:add', { sku: 'ABC', qty: 2 });
// bus.emit('cart:add', { qty: 2 });  // TS error: missing sku`}</code></pre>
    </>
  );
}
