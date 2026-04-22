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
  return err instanceof SsrRedirect || (typeof err === 'object' && err !== null && (err as { name?: string }).name === 'SsrRedirect');
}
