# @mfjs/adapter-node

Node.js HTTP server adapter for MFJS SSR. Serves static assets + routes SSR requests through `@mfjs/ssr`.

## Use

```ts
// apps/shell/server.ts
import { startNodeServer } from '@mfjs/adapter-node';
import App from './src/App.js';
import { routes } from './src/routes.js';
import fs from 'node:fs';

const template = fs.readFileSync('./public/index.html', 'utf8');

startNodeServer({
  App,
  routes,
  template,
  staticDir: 'dist',
  port: 3000,
});
```

## Docker

Copy `templates/Dockerfile` to the repo root.

```sh
docker build -t my-shell .
docker run -p 3000:3000 my-shell
```
