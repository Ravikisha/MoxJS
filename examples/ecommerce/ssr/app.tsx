import React from 'react';

function Nav({ href, label }) {
  return (
    <a href={href} style={{ marginRight: 12 }}>
      {label}
    </a>
  );
}

export default function App({ path, params }) {
  const sku = params?.sku;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <header>
        <h1 style={{ margin: 0 }}>MFJS E-commerce</h1>
        <p style={{ marginTop: 6, opacity: 0.8 }}>
          SSR/SSG demo export — current route: <code>{path}</code>
        </p>
        <nav style={{ marginTop: 12 }}>
          <Nav href='/' label='Home' />
          <Nav href='/products' label='Products' />
          <Nav href='/products/sku-123' label='Product sku-123' />
          <Nav href='/cart' label='Cart' />
        </nav>
      </header>

      <hr style={{ margin: '18px 0' }} />

      {path === '/' && (
        <section data-testid='page-home'>
          <h2>Welcome</h2>
          <p>This is a minimal static-exportable storefront shell.</p>
        </section>
      )}

      {path === '/products' && (
        <section data-testid='page-products'>
          <h2>Products</h2>
          <ul>
            <li>
              <a href='/products/sku-123'>sku-123</a>
            </li>
          </ul>
        </section>
      )}

      {path.startsWith('/products/') && (
        <section data-testid='page-product'>
          <h2>Product details</h2>
          <div>
            SKU: <strong data-testid='product-sku'>{sku ?? path.split('/').pop()}</strong>
          </div>
        </section>
      )}

      {path === '/cart' && (
        <section data-testid='page-cart'>
          <h2>Cart</h2>
          <p>Your cart is empty.</p>
        </section>
  )}
    </div>
  );
}
