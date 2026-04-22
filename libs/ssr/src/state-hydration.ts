const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .split(LS)
    .join('\\u2028')
    .split(PS)
    .join('\\u2029');
}

export interface SerializeStateOptions {
  /** `window.__<key>__` — defaults to `MFJS_STATE`. */
  key?: string;
  /** CSP nonce, emitted as `nonce="..."` on the `<script>` tag. */
  nonce?: string;
}

export function serializeState(state: unknown, opts: SerializeStateOptions = {}): string {
  const key = opts.key ?? 'MFJS_STATE';
  const nonceAttr = opts.nonce ? ` nonce="${opts.nonce.replace(/"/g, '&quot;')}"` : '';
  return `<script${nonceAttr}>window.__${key}__=${safeJson(state)}</script>`;
}

export function hydrateState<T = unknown>(key = 'MFJS_STATE'): T | undefined {
  if (typeof window === 'undefined') return undefined;
  const value = (window as unknown as Record<string, unknown>)[`__${key}__`];
  return value as T | undefined;
}

export function clearHydratedState(key = 'MFJS_STATE'): void {
  if (typeof window === 'undefined') return;
  try {
    delete (window as unknown as Record<string, unknown>)[`__${key}__`];
  } catch {
    (window as unknown as Record<string, unknown>)[`__${key}__`] = undefined;
  }
}
