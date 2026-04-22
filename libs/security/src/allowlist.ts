export interface AllowlistOptions {
  /** Allowed origins. Supports `*` subdomain wildcard (e.g. `https://*.example.com`). */
  origins: string[];
  /** Allowed remote names. If unset, any name permitted as long as origin matches. */
  names?: string[];
}

export class RemoteAllowlist {
  private origins: Array<RegExp | string>;
  private names: Set<string> | null;

  constructor(opts: AllowlistOptions) {
    this.origins = opts.origins.map(toMatcher);
    this.names = opts.names?.length ? new Set(opts.names) : null;
  }

  isAllowed(url: string, remoteName?: string): boolean {
    if (this.names && remoteName && !this.names.has(remoteName)) return false;
    try {
      const u = new URL(url);
      const origin = `${u.protocol}//${u.host}`;
      return this.origins.some((m) => (typeof m === 'string' ? m === origin : m.test(origin)));
    } catch {
      return false;
    }
  }

  assertAllowed(url: string, remoteName?: string): void {
    if (!this.isAllowed(url, remoteName)) {
      throw new Error(
        `[mfjs/security] Remote "${remoteName ?? 'unknown'}" at "${url}" is not in the allowlist.`,
      );
    }
  }
}

function toMatcher(origin: string): RegExp | string {
  if (!origin.includes('*')) return origin.replace(/\/$/, '');
  const escaped = origin
    .replace(/\/$/, '')
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '[^.]+');
  return new RegExp(`^${escaped}$`);
}
