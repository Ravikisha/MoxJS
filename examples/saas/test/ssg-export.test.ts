import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';

async function read(file: string) {
  return fs.readFile(file, 'utf8');
}

describe('saas example - SSG export output', () => {
  it('writes expected pages to dist-ssg', async () => {
    const outDir = path.resolve('dist-ssg');

    const indexHtml = await read(path.join(outDir, 'index.html'));
    expect(indexHtml).toContain('MFJS SaaS');
  expect(indexHtml).toContain('data-testid="page-home"');

    const pricingHtml = await read(path.join(outDir, 'pricing', 'index.html'));
  expect(pricingHtml).toContain('data-testid="page-pricing"');

    const appHtml = await read(path.join(outDir, 'app', 'index.html'));
  expect(appHtml).toContain('data-testid="page-app"');

    const settingsHtml = await read(path.join(outDir, 'app', 'settings', 'index.html'));
  expect(settingsHtml).toContain('data-testid="page-settings"');
  });
});
