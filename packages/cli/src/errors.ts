import kleur from 'kleur';

export type CliErrorOptions = {
  /** Command name/prefix, e.g. "ssr" or "dev". */
  command?: string;
  /** Exit code to set (default 1). */
  exitCode?: number;
  /** Optional extra hint line(s) printed in gray. */
  hint?: string | string[];
};

export function formatCliError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) {
    const out: { message: string; stack?: string } = { message: err.message };
    if (err.stack) out.stack = err.stack;
    return out;
  }
  return { message: String(err) };
}

export function printCliError(err: unknown, opts: CliErrorOptions = {}) {
  const { message, stack } = formatCliError(err);
  const prefix = opts.command ? `mfjs ${opts.command}` : 'mfjs';

  // eslint-disable-next-line no-console
  console.error(kleur.red(`${prefix} failed: ${message}`));

  const hints = opts.hint ? (Array.isArray(opts.hint) ? opts.hint : [opts.hint]) : [];
  for (const line of hints) {
    // eslint-disable-next-line no-console
    console.error(kleur.gray(line));
  }

  const debug = process.env['MFJS_DEBUG'] === '1' || process.env['MFJS_DEBUG'] === 'true';
  if (debug && stack) {
    // eslint-disable-next-line no-console
    console.error(kleur.gray(stack));
  }

  process.exitCode = opts.exitCode ?? 1;
}
