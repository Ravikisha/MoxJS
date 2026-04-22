export type CspDirective =
  | 'default-src'
  | 'script-src'
  | 'style-src'
  | 'img-src'
  | 'font-src'
  | 'connect-src'
  | 'media-src'
  | 'object-src'
  | 'frame-src'
  | 'worker-src'
  | 'manifest-src'
  | 'base-uri'
  | 'form-action'
  | 'frame-ancestors'
  | 'report-uri'
  | 'report-to'
  | 'upgrade-insecure-requests';

export type CspPolicy = Partial<Record<CspDirective, string[] | true>>;

export interface CspOptions {
  /** Adds every remote origin to `script-src` and `connect-src` automatically. */
  remotes?: string[];
  /** Include `'unsafe-inline'` for dev bootstraps. Never set true in prod. */
  allowInlineScripts?: boolean;
  /** Include `'unsafe-eval'` — required by some HMR stacks. Never in prod. */
  allowEval?: boolean;
  /** Per-request nonce. Included as `'nonce-<value>'` in `script-src`/`style-src`. */
  nonce?: string;
  /** Report endpoint. */
  reportUri?: string;
}

const BASELINE: CspPolicy = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'frame-ancestors': ["'self'"],
  'form-action': ["'self'"],
};

export function buildCsp(policy: CspPolicy = {}, opts: CspOptions = {}): string {
  const merged: CspPolicy = structuredClone(BASELINE);

  for (const [k, v] of Object.entries(policy) as [CspDirective, string[] | true | undefined][]) {
    if (v === undefined) continue;
    merged[k] = v;
  }

  const remoteOrigins = (opts.remotes ?? []).map(toOrigin).filter(Boolean) as string[];
  if (remoteOrigins.length) {
    pushUnique(merged, 'script-src', remoteOrigins);
    pushUnique(merged, 'connect-src', remoteOrigins);
  }

  if (opts.nonce) {
    const token = `'nonce-${opts.nonce}'`;
    pushUnique(merged, 'script-src', [token]);
    pushUnique(merged, 'style-src', [token]);
  }

  if (opts.allowInlineScripts) pushUnique(merged, 'script-src', ["'unsafe-inline'"]);
  if (opts.allowEval) pushUnique(merged, 'script-src', ["'unsafe-eval'"]);

  if (opts.reportUri) merged['report-uri'] = [opts.reportUri];

  return serialize(merged);
}

export function cspMeta(policy: CspPolicy = {}, opts: CspOptions = {}): string {
  return `<meta http-equiv="Content-Security-Policy" content="${escapeAttr(buildCsp(policy, opts))}">`;
}

function pushUnique(p: CspPolicy, key: CspDirective, values: string[]): void {
  const list = Array.isArray(p[key]) ? (p[key] as string[]) : [];
  for (const v of values) if (!list.includes(v)) list.push(v);
  p[key] = list;
}

function serialize(p: CspPolicy): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(p) as [CspDirective, string[] | true | undefined][]) {
    if (v === undefined) continue;
    if (v === true) parts.push(k);
    else if (v.length) parts.push(`${k} ${v.join(' ')}`);
  }
  return parts.join('; ');
}

function toOrigin(url: string): string | undefined {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return undefined;
  }
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}

export function generateNonce(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Buffer.from(arr).toString('base64');
}
