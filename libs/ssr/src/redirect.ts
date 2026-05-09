export class SsrRedirect extends Error {
  public readonly status: number;
  public readonly location: string;

  constructor(location: string, status: 301 | 302 | 303 | 307 | 308 = 307) {
    super(`Redirect to ${location}`);
    this.name = 'SsrRedirect';
    this.status = status;
    this.location = location;
  }
}

export function redirect(location: string, status: 301 | 302 | 303 | 307 | 308 = 307): never {
  throw new SsrRedirect(location, status);
}

export function isRedirect(err: unknown): err is SsrRedirect {
  if (err instanceof SsrRedirect) return true;
  // Cross-realm fallback: an error that quacks like a redirect must also carry
  // a string `location`. Without that, a random `{name:'SsrRedirect'}` could
  // short-circuit the catch and break headers.
  if (typeof err === 'object' && err !== null) {
    const obj = err as { name?: string; location?: unknown; status?: unknown };
    return obj.name === 'SsrRedirect' && typeof obj.location === 'string';
  }
  return false;
}
