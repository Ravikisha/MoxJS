export type Severity = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface MetricEvent {
  name: string;
  value: number;
  unit?: 'ms' | 'bytes' | 'count';
  tags?: Record<string, string | number>;
}

export interface RemoteLoadEvent {
  remote: string;
  url: string;
  phase: 'start' | 'success' | 'error' | 'timeout';
  durationMs?: number;
  error?: unknown;
}

export interface ErrorEvent {
  error: unknown;
  context?: Record<string, unknown>;
  severity?: Severity;
  source?: 'runtime' | 'remote' | 'ssr' | 'user';
}

export type ErrorHandler = (e: ErrorEvent) => void;
export type MetricHandler = (m: MetricEvent) => void;
export type RemoteLoadHandler = (e: RemoteLoadEvent) => void;

interface Registry {
  errors: Set<ErrorHandler>;
  metrics: Set<MetricHandler>;
  remoteLoads: Set<RemoteLoadHandler>;
}

const reg: Registry = {
  errors: new Set(),
  metrics: new Set(),
  remoteLoads: new Set(),
};

export function onError(fn: ErrorHandler): () => void {
  reg.errors.add(fn);
  return () => reg.errors.delete(fn);
}

export function onMetric(fn: MetricHandler): () => void {
  reg.metrics.add(fn);
  return () => reg.metrics.delete(fn);
}

export function onRemoteLoad(fn: RemoteLoadHandler): () => void {
  reg.remoteLoads.add(fn);
  return () => reg.remoteLoads.delete(fn);
}

export function reportError(e: ErrorEvent): void {
  for (const h of reg.errors) safeCall(() => h(e));
}

export function reportMetric(m: MetricEvent): void {
  for (const h of reg.metrics) safeCall(() => h(m));
}

export function reportRemoteLoad(e: RemoteLoadEvent): void {
  for (const h of reg.remoteLoads) safeCall(() => h(e));
}

export function clearHandlers(): void {
  reg.errors.clear();
  reg.metrics.clear();
  reg.remoteLoads.clear();
}

function safeCall(fn: () => void): void {
  try {
    fn();
  } catch {
    // swallow — observer must never break the host
  }
}
