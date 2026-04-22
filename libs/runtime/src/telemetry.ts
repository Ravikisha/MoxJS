export const MFJS_REMOTE_LOAD_EVENT = 'mfjs:remote-load';
export const MFJS_ERROR_EVENT = 'mfjs:error';

export interface RemoteLoadTelemetryDetail {
  remote: string;
  url: string;
  phase: 'start' | 'success' | 'error' | 'timeout';
  durationMs?: number;
  error?: unknown;
}

export interface ErrorTelemetryDetail {
  error: unknown;
  source: 'runtime' | 'remote' | 'ssr';
  context?: Record<string, unknown>;
}

export function emitRemoteLoad(detail: RemoteLoadTelemetryDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MFJS_REMOTE_LOAD_EVENT, { detail }));
}

export function emitError(detail: ErrorTelemetryDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MFJS_ERROR_EVENT, { detail }));
}

export function onRemoteLoad(cb: (d: RemoteLoadTelemetryDetail) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<RemoteLoadTelemetryDetail>).detail);
  window.addEventListener(MFJS_REMOTE_LOAD_EVENT, handler);
  return () => window.removeEventListener(MFJS_REMOTE_LOAD_EVENT, handler);
}

export function onRuntimeError(cb: (d: ErrorTelemetryDetail) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<ErrorTelemetryDetail>).detail);
  window.addEventListener(MFJS_ERROR_EVENT, handler);
  return () => window.removeEventListener(MFJS_ERROR_EVENT, handler);
}
