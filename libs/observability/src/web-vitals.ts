import { reportMetric } from './hooks.js';

export interface WebVitalsOptions {
  /** Report on every metric, not only when tab hides. Default: false. */
  reportAllChanges?: boolean;
}

/**
 * Minimal Core Web Vitals collector. Uses the PerformanceObserver API.
 * For richer reporting integrate the `web-vitals` npm package.
 */
export function collectWebVitals(opts: WebVitalsOptions = {}): () => void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return () => {};

  const disposers: Array<() => void> = [];

  disposers.push(observe('largest-contentful-paint', (entry) => {
    reportMetric({ name: 'lcp', value: entry.startTime, unit: 'ms' });
  }));

  disposers.push(observe('first-input', (entry) => {
    const fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
    reportMetric({ name: 'fid', value: fid, unit: 'ms' });
  }));

  let clsValue = 0;
  disposers.push(observe('layout-shift', (entry) => {
    const e = entry as unknown as { value: number; hadRecentInput: boolean };
    if (e.hadRecentInput) return;
    clsValue += e.value;
    if (opts.reportAllChanges) reportMetric({ name: 'cls', value: clsValue });
  }));

  const flush = () => reportMetric({ name: 'cls', value: clsValue });
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });

  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      reportMetric({ name: 'ttfb', value: nav.responseStart, unit: 'ms' });
      reportMetric({ name: 'fcp', value: nav.domContentLoadedEventStart, unit: 'ms' });
    }
  } catch {}

  return () => disposers.forEach((d) => d());
}

function observe(type: string, cb: (entry: PerformanceEntry) => void): () => void {
  try {
    const po = new PerformanceObserver((list) => list.getEntries().forEach(cb));
    po.observe({ type, buffered: true } as PerformanceObserverInit);
    return () => po.disconnect();
  } catch {
    return () => {};
  }
}
