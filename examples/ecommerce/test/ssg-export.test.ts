import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';

async function read(file: string) {
  return fs.readFile(file, 'utf8');
}

describe('ecommerce example - SSG export output', () => {
  it('writes expected pages to dist-ssg', async () => {
    const outDir = path.resolve('dist-ssg');

    const indexHtml = await read(path.join(outDir, 'index.html'));
    expect(indexHtml).toContain('MFJS E-commerce');
  expect(indexHtml).toContain('data-testid="page-home"');

    const productsHtml = await read(path.join(outDir, 'products', 'index.html'));
  expect(productsHtml).toContain('data-testid="page-products"');

    const skuHtml = await read(path.join(outDir, 'products', 'sku-123', 'index.html'));
  expect(skuHtml).toContain('data-testid="page-product"');
  expect(skuHtml).toContain('data-testid="product-sku"');

    const cartHtml = await read(path.join(outDir, 'cart', 'index.html'));
  expect(cartHtml).toContain('data-testid="page-cart"');
  });
});
