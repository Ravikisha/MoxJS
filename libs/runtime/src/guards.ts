import type { ResolvedRoute, RouteTarget } from './routes.js';

export type GuardResult = boolean | { redirect: string } | Promise<boolean | { redirect: string }>;

export interface GuardContext {
  pathname: string;
  params: Record<string, string>;
  target: RouteTarget;
}

export type RouteGuard = (ctx: GuardContext) => GuardResult;

export interface GuardedRouteTarget extends RouteTarget {
  guards?: RouteGuard[];
}

export async function runGuards(
  resolved: ResolvedRoute,
  pathname: string,
  globalGuards: RouteGuard[] = [],
): Promise<{ allowed: true } | { allowed: false; redirect?: string }> {
  const target = resolved.target as GuardedRouteTarget;
  const routeGuards = target.guards ?? [];
  const chain = [...globalGuards, ...routeGuards];

  for (const guard of chain) {
    const result = await guard({ pathname, params: resolved.params, target });
    if (result === true) continue;
    if (result === false) return { allowed: false };
    if (result && typeof result === 'object' && 'redirect' in result) {
      return { allowed: false, redirect: result.redirect };
    }
  }

  return { allowed: true };
}

export function createAuthGuard(options: {
  isAuthenticated: () => boolean | Promise<boolean>;
  loginPath: string;
}): RouteGuard {
  return async () => {
    const ok = await options.isAuthenticated();
    return ok ? true : { redirect: options.loginPath };
  };
}

export function createRoleGuard(options: {
  getRoles: () => string[] | Promise<string[]>;
  required: string[];
  fallbackPath: string;
}): RouteGuard {
  return async () => {
    const roles = await options.getRoles();
    const ok = options.required.every((r) => roles.includes(r));
    return ok ? true : { redirect: options.fallbackPath };
  };
}
