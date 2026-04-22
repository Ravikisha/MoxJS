export const metadata = { title: '@mfjs/state API' };

export default function StateApi() {
  return (
    <>
      <h1>@mfjs/state</h1>

      <h2>Simple store</h2>
      <ul>
        <li><code>getSimpleStore&lt;T&gt;(name, initial)</code></li>
        <li><code>store.get() / .set(value) / .subscribe(fn)</code></li>
      </ul>

      <h2>Redux-style store</h2>
      <ul>
        <li><code>createStore&lt;S, A&gt;(&#123; initial, reducer &#125;)</code></li>
        <li><code>getStore&lt;S, A&gt;(name, config)</code> — singleton</li>
        <li><code>store.getState() / .dispatch(action) / .subscribe(fn) / .replaceReducer(next)</code></li>
      </ul>

      <h2>Federation singleton</h2>
      <p>
        <code>@mfjs/state</code> is shared as a singleton in federation config so host and remotes share the
        same store registry.
      </p>
    </>
  );
}
