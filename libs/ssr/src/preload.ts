export interface PreloadLink {
  href: string;
  as?: 'script' | 'style' | 'font' | 'image' | 'fetch';
  crossorigin?: 'anonymous' | 'use-credentials';
  integrity?: string;
  rel?: 'preload' | 'modulepreload' | 'prefetch';
  type?: string;
}

export function buildPreloadTags(links: PreloadLink[]): string {
  return links.map(linkTag).join('\n');
}

function linkTag(l: PreloadLink): string {
  const rel = l.rel ?? (l.as === 'script' ? 'modulepreload' : 'preload');
  const attrs: string[] = [`rel="${rel}"`, `href="${escape(l.href)}"`];
  if (l.as && rel !== 'modulepreload') attrs.push(`as="${l.as}"`);
  if (l.crossorigin) attrs.push(`crossorigin="${l.crossorigin}"`);
  if (l.integrity) attrs.push(`integrity="${escape(l.integrity)}"`);
  if (l.type) attrs.push(`type="${escape(l.type)}"`);
  return `<link ${attrs.join(' ')}>`;
}

export function remoteEntryPreloads(
  remotes: Array<{ name: string; entryUrl: string; integrity?: string }>,
): PreloadLink[] {
  return remotes.map((r) => ({
    href: r.entryUrl,
    rel: 'modulepreload',
    crossorigin: 'anonymous',
    ...(r.integrity ? { integrity: r.integrity } : {}),
  }));
}

function escape(v: string): string {
  return v.replace(/"/g, '&quot;');
}
