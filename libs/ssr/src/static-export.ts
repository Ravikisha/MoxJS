/**
 * @mfjs/ssr — staticExport
 *
 * Pre-renders a list of routes to static HTML files.
 *
 * @example
 * ```ts
 * import { staticExport } from '@mfjs/ssr';
 *
 * await staticExport({
 *   routes: [
 *     { path: '/' },
 *     { path: '/dashboard/settings' },
 *     { path: '/dashboard/users/42', params: { id: '42' } },
 *   ],
 *   App,
 *   template: fs.readFileSync('index.html', 'utf8'),
 *   outDir: 'dist',
 * });
 * ```
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, resolve, sep } from 'node:path';
import { isSafePathname } from '@mfjs/security';
import { renderRouteToString, injectIntoTemplate } from './render-to-string.js';
import type { StaticExportOptions, StaticPage } from './types.js';

/**
 * Convert a URL path to a POSIX-relative file path.
 *
 * - `/`                       → `index.html`
 * - `/dashboard/settings`     → `dashboard/settings/index.html`
 * - `/dashboard/users/42`     → `dashboard/users/42/index.html`
 */
function pathToFile(urlPath: string): string {
  // Strip query/hash if present.
  const q = urlPath.indexOf('?');
  const h = urlPath.indexOf('#');
  const cut = q === -1 ? h : h === -1 ? q : Math.min(q, h);
  const trimmed = cut === -1 ? urlPath : urlPath.slice(0, cut);
  const clean = trimmed.replace(/^\//, '').replace(/\/$/, '');
  if (!clean) return 'index.html';
  return `${clean}/index.html`;
}

export interface StaticExportFailure {
  path: string;
  error: Error;
}

export interface StaticExportResult {
  pages: StaticPage[];
  failures: StaticExportFailure[];
}

/**
 * Pre-render all routes and optionally write them to `outDir`.
 *
 * Returns the list of generated pages plus any per-route failures so callers
 * can fail their own build deterministically. The caller decides whether to
 * throw on `failures.length > 0`.
 */
export async function staticExport(options: StaticExportOptions): Promise<StaticPage[]>;
export async function staticExport(
  options: StaticExportOptions & { detailed: true },
): Promise<StaticExportResult>;
export async function staticExport(
  options: StaticExportOptions & { detailed?: boolean },
): Promise<StaticPage[] | StaticExportResult> {
  const { routes, App, template, outDir, detailed } = options;

  const pages: StaticPage[] = [];
  const failures: StaticExportFailure[] = [];
  const seenFiles = new Set<string>();

  const resolvedOutDir = outDir ? resolve(outDir) + sep : null;

  for (const route of routes) {
    if (!isSafePathname(route.path)) {
      failures.push({ path: route.path, error: new Error(`Unsafe route path rejected: ${route.path}`) });
      continue;
    }
    // Pattern routes (`:id`, `*`) cannot be exported as static files — they
    // need concrete params. Skip them silently rather than producing files
    // with `:` in the name (illegal on Windows / S3).
    if (/[:*]/.test(route.path)) {
      continue;
    }
    let result;
    try {
      result = await renderRouteToString(App, route);
    } catch (err) {
      failures.push({ path: route.path, error: err instanceof Error ? err : new Error(String(err)) });
      continue;
    }
    if (result.statusCode >= 500) {
      failures.push({
        path: route.path,
        error: result.error ?? new Error(`Render failed with status ${result.statusCode}`),
      });
      continue;
    }
    const content = injectIntoTemplate(template, result.html);
    const file = pathToFile(route.path);
    if (seenFiles.has(file)) {
      failures.push({ path: route.path, error: new Error(`Duplicate output path: ${file}`) });
      continue;
    }
    seenFiles.add(file);
    pages.push({ file, content });

    if (outDir && resolvedOutDir) {
      const outPath = resolve(outDir, file);
      if (!outPath.startsWith(resolvedOutDir)) {
        failures.push({
          path: route.path,
          error: new Error(`Path traversal blocked: ${route.path}`),
        });
        continue;
      }
      try {
        await mkdir(dirname(outPath), { recursive: true });
        await writeFile(outPath, content, 'utf8');
      } catch (err) {
        failures.push({ path: route.path, error: err instanceof Error ? err : new Error(String(err)) });
      }
    }
  }

  if (detailed) return { pages, failures };
  if (failures.length > 0) {
    throw new Error(
      `staticExport: ${failures.length} route(s) failed:\n` +
        failures.map((f) => `  - ${f.path}: ${f.error.message}`).join('\n'),
    );
  }
  return pages;
}
