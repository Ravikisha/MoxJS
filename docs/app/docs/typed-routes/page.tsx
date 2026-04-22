export const metadata = { title: 'Typed routes' };

export default function TypedRoutes() {
  return (
    <>
      <h1>Typed routes</h1>
      <p>
        <code>createRoute</code> binds a path to a validator (Zod, Valibot, Yup, anything with{' '}
        <code>parse</code>). You get compile-time types + runtime validation for params and search.
      </p>

      <h2>Zod example</h2>
      <pre><code>{`import { z } from 'zod';
import { createRoute, defineRoutes } from '@mfjs/runtime';

const userRoute = createRoute({
  path: '/users/:id',
  params: z.object({ id: z.string().uuid() }),
  search: z.object({ tab: z.enum(['profile', 'billing']).default('profile') }),
});

export const routes = defineRoutes({ user: userRoute });

// match
const m = userRoute.match('/users/abc-def');
if (m) m.params.id; // typed string (uuid validated)

// build
const url = userRoute.build({ id: 'abc' }, { tab: 'billing' });
// -> '/users/abc?tab=billing'`}</code></pre>

      <h2>No validator — raw params</h2>
      <p>
        Omit <code>params</code> to get <code>Record&lt;string, string&gt;</code>:
      </p>
      <pre><code>{`const r = createRoute({ path: '/orders/:orderId' });
r.match('/orders/42')?.params.orderId;  // string`}</code></pre>

      <h2>Custom validator</h2>
      <p>
        Any object with a <code>parse(input): T</code> method works — implement <code>safeParse</code> for
        non-throwing validation.
      </p>
      <pre><code>{`const validator = {
  parse: (x: unknown) => {
    if (!x || typeof (x as any).id !== 'string') throw new Error('bad params');
    return x as { id: string };
  },
};
createRoute({ path: '/x/:id', params: validator });`}</code></pre>
    </>
  );
}
