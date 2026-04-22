import type { FederationRemote } from './remote-loader.js';

export interface RegisteredRemote extends FederationRemote {
  version?: string;
  integrity?: string;
  meta?: Record<string, unknown>;
}

export interface RemoteRegistryOptions {
  /** Called before registration to validate origin / name. */
  validate?: (remote: RegisteredRemote) => void;
  /** Called after a remote URL changes. */
  onChange?: (remote: RegisteredRemote) => void;
}

export class RemoteRegistry {
  private remotes = new Map<string, RegisteredRemote>();
  private opts: RemoteRegistryOptions;

  constructor(opts: RemoteRegistryOptions = {}) {
    this.opts = opts;
  }

  register(remote: RegisteredRemote): void {
    this.opts.validate?.(remote);
    const existing = this.remotes.get(remote.name);
    this.remotes.set(remote.name, remote);
    if (!existing || existing.entryUrl !== remote.entryUrl) {
      this.opts.onChange?.(remote);
    }
  }

  unregister(name: string): void {
    this.remotes.delete(name);
  }

  get(name: string): RegisteredRemote | undefined {
    return this.remotes.get(name);
  }

  list(): RegisteredRemote[] {
    return Array.from(this.remotes.values());
  }

  async load(
    manifestUrl: string,
    fetchImpl: typeof fetch = fetch,
  ): Promise<RegisteredRemote[]> {
    const res = await fetchImpl(manifestUrl);
    if (!res.ok) throw new Error(`RemoteRegistry: manifest fetch failed ${manifestUrl} (${res.status})`);
    const payload = (await res.json()) as { remotes: RegisteredRemote[] };
    for (const r of payload.remotes ?? []) this.register(r);
    return this.list();
  }
}

let _global: RemoteRegistry | null = null;

export function getRemoteRegistry(opts?: RemoteRegistryOptions): RemoteRegistry {
  if (!_global) _global = new RemoteRegistry(opts);
  return _global;
}
