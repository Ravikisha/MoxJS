import { rspack } from '@rspack/core';
import path from 'node:path';
import fs from 'node:fs';

const federationPath = path.join(process.cwd(), 'mfjs.federation.json');
const federation = fs.existsSync(federationPath)
  ? JSON.parse(fs.readFileSync(federationPath, 'utf8'))
  : null;

const sharedWithReactEager = federation?.shared
  ? {
    ...federation.shared,
    react: {
      ...(federation.shared.react || {}),
      eager: true,
      singleton: true,
      strictVersion: true,
      requiredVersion: '^18.3.1',
    },
    'react-dom': {
      ...(federation.shared['react-dom'] || {}),
      eager: true,
      singleton: true,
      strictVersion: true,
      requiredVersion: '^18.3.1',
    },
    '@mfjs/event-bus': {
      ...(federation.shared['@mfjs/event-bus'] || {}),
      eager: true,
      singleton: true,
    },
    '@mfjs/runtime': {
      ...(federation.shared['@mfjs/runtime'] || {}),
      eager: true,
      singleton: true,
    },
  }
  : undefined;

export default {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: {
    main: ['./src/mf-shim.js', './src/main.tsx'],
  },
  experiments: {
    css: true,
    // Lazy compilation proxies crash hot-update modules when remoteEntry is used.
    // Keep it off for all entry points and async chunks inside this remote.
    lazyCompilation: false,
  },
  devServer: {
    port: 3001,
  historyApiFallback: {
    disableDotRule: true,
    rewrites: [
  // Rspack lazy compilation endpoints (avoid rewriting to index.html).
  // When rewritten, Firefox may show "XML Parsing Error" and HMR can crash.
  { from: /^\/lazy-compilation-using-/, to: (context) => context.parsedUrl.pathname },
  { from: /lazy-compilation-proxy/, to: (context) => context.parsedUrl.pathname },
      // Don't rewrite module/asset requests to index.html.
      {
        from: /^\/(src|@fs)\//,
        to: (context) => context.parsedUrl.pathname,
      },
      {
        from: /\.(mjs|js|cjs|css|json|map|wasm|png|jpe?g|gif|svg|ico|webp|avif|txt|xml)$/,
        to: (context) => context.parsedUrl.pathname,
      },
      // SPA fallback for everything else.
      { from: /./, to: "/index.html" },
    ],
  },
  },
  output: {
    uniqueName: 'dashboard',
    publicPath: 'auto'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: { syntax: 'typescript', tsx: true },
            transform: { react: { runtime: 'automatic' } }
          }
        }
      }
    ]
  },
  plugins: [
    new rspack.HtmlRspackPlugin({ template: './index.html', scriptLoading: 'module' }),
    ...(federation
      ? [
          new rspack.container.ModuleFederationPlugin({
            name: federation.name,
            filename: federation.filename,
            exposes: federation.exposes,
            remotes: federation.remotes,
            shared: sharedWithReactEager
          })
        ]
      : [])
  ]
};
