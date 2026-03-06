import { test, expect } from '@playwright/test';

function collectErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

test('@direct examples/basic renders remote inside host', async ({ page }) => {
  const errors = collectErrors(page);
  const res = await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  expect(res?.ok()).toBeTruthy();

  await expect(page.getByTestId('shell-header')).toBeVisible();
  await expect(page.getByTestId('remote-loaded')).toBeVisible({ timeout: 10_000 });

  const hookErrors = errors.filter(
    (e) => e.includes('Invalid hook call') || e.includes('dispatcher is null')
  );
  expect(hookErrors).toHaveLength(0);
});

test('@direct no React duplicate-instance errors in the browser console', async ({ page }) => {
  const consoleErrors = collectErrors(page);
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  const duplicateReactErrors = consoleErrors.filter(
    (e) =>
      e.includes('Invalid hook call') ||
      e.includes('dispatcher is null') ||
      e.includes('Minified React error')
  );
  expect(duplicateReactErrors).toHaveLength(0);
});

test('@direct remote content is visible without a page reload', async ({ page }) => {
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('remote-loaded')).toBeVisible({ timeout: 10_000 });
});
