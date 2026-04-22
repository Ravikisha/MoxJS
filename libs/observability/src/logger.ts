import type { Severity } from './hooks.js';

export interface Logger {
  debug(msg: string, ctx?: Record<string, unknown>): void;
  info(msg: string, ctx?: Record<string, unknown>): void;
  warn(msg: string, ctx?: Record<string, unknown>): void;
  error(msg: string, ctx?: Record<string, unknown>): void;
  child(bindings: Record<string, unknown>): Logger;
}

export interface LoggerOptions {
  name?: string;
  level?: Severity;
  bindings?: Record<string, unknown>;
  sink?: (entry: LogEntry) => void;
}

export interface LogEntry {
  time: string;
  level: Severity;
  name?: string;
  msg: string;
  ctx?: Record<string, unknown>;
}

const LEVELS: Record<Severity, number> = { debug: 10, info: 20, warn: 30, error: 40, fatal: 50 };

export function createLogger(opts: LoggerOptions = {}): Logger {
  const level = LEVELS[opts.level ?? 'info'];
  const bindings = opts.bindings ?? {};
  const sink = opts.sink ?? defaultSink;

  function emit(lvl: Severity, msg: string, ctx?: Record<string, unknown>): void {
    if (LEVELS[lvl] < level) return;
    sink({
      time: new Date().toISOString(),
      level: lvl,
      ...(opts.name && { name: opts.name }),
      msg,
      ctx: { ...bindings, ...ctx },
    });
  }

  return {
    debug: (m, c) => emit('debug', m, c),
    info: (m, c) => emit('info', m, c),
    warn: (m, c) => emit('warn', m, c),
    error: (m, c) => emit('error', m, c),
    child: (b) => createLogger({ ...opts, bindings: { ...bindings, ...b } }),
  };
}

function defaultSink(entry: LogEntry): void {
  const line = JSON.stringify(entry);
  if (entry.level === 'error' || entry.level === 'fatal') console.error(line);
  else if (entry.level === 'warn') console.warn(line);
  else if (typeof console.info === 'function') console.info(line);
  else console.log(line);
}
