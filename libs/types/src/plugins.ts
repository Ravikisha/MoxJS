/**
 * @mfjs/types — Plugin system (phase-0 foundation).
 *
 * The goal is to formalize extension points without committing to a complex
 * plugin runtime yet.
 */

import type { FederationConfig } from './federation-config.js';
import type { MfjsWorkspaceConfig } from './mfjs-config.js';

export type MfjsAppMeta = {
  name: string;
  type: 'host' | 'remote';
  port: number;
  dir: string;
};

export type MfjsDevPlan = {
  workspaceDir: string;
  apps: MfjsAppMeta[];
  host?: MfjsAppMeta;
  remotes: MfjsAppMeta[];
  mode: 'parallel' | 'on-demand';
  proxyRemotes: boolean;
  hmrRemotes: boolean;
};

export type MfjsPlugin = {
  name: string;

  /** Inspect/modify resolved workspace config before commands run. */
  configResolved?: (cfg: MfjsWorkspaceConfig) => MfjsWorkspaceConfig | void | Promise<MfjsWorkspaceConfig | void>;

  /**
   * Inspect/modify the federation config right before it is written.
   *
   * This is the first step towards a bundler-agnostic federation abstraction.
   */
  federationConfig?: (args: {
    workspaceDir: string;
    app: MfjsAppMeta;
    config: FederationConfig;
  }) => FederationConfig | void | Promise<FederationConfig | void>;

  /** Inspect/modify the computed dev plan. */
  devPlan?: (plan: MfjsDevPlan) => MfjsDevPlan | void | Promise<MfjsDevPlan | void>;
};

type PluginHookValue = {
  configResolved: MfjsWorkspaceConfig;
  devPlan: MfjsDevPlan;
};

/**
 * Apply a single plugin hook across the plugin chain. Each plugin receives the
 * latest accumulated value; returning `undefined` means "no change", anything
 * else replaces the value. `null` is reserved for future "drop" semantics.
 */
export async function applyPlugins<H extends 'configResolved' | 'devPlan'>(
  value: PluginHookValue[H],
  plugins: MfjsPlugin[],
  hook: H,
): Promise<PluginHookValue[H]> {
  let out = value;
  for (const p of plugins) {
    const fn = p[hook];
    if (!fn) continue;
    const next = await (fn as (v: PluginHookValue[H]) => PluginHookValue[H] | void | Promise<PluginHookValue[H] | void>)(out);
    if (next !== undefined) out = next;
  }
  return out;
}

/**
 * Apply the federation hook for a specific app.
 */
export async function applyFederationConfigPlugins(
  args: { workspaceDir: string; app: MfjsAppMeta; config: FederationConfig },
  plugins: MfjsPlugin[],
): Promise<FederationConfig> {
  let cfg = args.config;
  for (const p of plugins) {
    if (!p.federationConfig) continue;
    const next = await p.federationConfig({ ...args, config: cfg });
    if (next !== undefined) cfg = next;
  }
  return cfg;
}
