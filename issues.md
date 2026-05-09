# MFJS Codebase Audit — Bugs, Issues, Architecture & Improvements

> Full-tree audit of the MFJS micro-frontend framework. Generated from independent reviews of every source package: `@mfjs/cli`, `@mfjs/runtime`, `@mfjs/ssr` + deploy adapters, `@mfjs/security`, `@mfjs/observability`, `@mfjs/state`, `@mfjs/event-bus`, `@mfjs/events`, `@mfjs/types`, `@mfjs/ui`, shared configs, examples, scripts, and release pipeline.

---

## ✅ Remediation Status — 2026-05-09

All **14 task tiers** were completed in a single remediation pass. Every lib (13) plus the CLI builds cleanly; every unit-test suite passes (events 4/4, event-bus 35/35, rspack-route-assets 2/2, observability 3/3 new, types 26/26, state 29/29, security 16/16 new, ui 4/4 new, runtime 77/77, ssr 56/56, cli 130/130).

### Tier 0 — Ship-blockers (DONE)
- **§13/14/15/17 (S, EB, EV, T, UI, runtime, ssr, rspack-route-assets, cli):** every publishable package.json now has `description`, `license`, `repository`, `homepage`, `keywords`, `exports`, `files`, `sideEffects: false`. LICENSE duplicated into each lib/. README added for state/event-bus/events/types/ui/runtime.
- **CI-1, CI-2, CI-3, CI-4, CI-7:** `.github/workflows/ci.yml` runs build+typecheck+lint+test on PRs across Linux/macOS/Windows × Node 20/22; `release.yml` adds lint + scoped tests; concurrency comment added.
- **UI-1, UI-2, UI-3, UI-6:** `@mfjs/ui` is a real React component (Button + ThemeProvider, default `type="button"`, ARIA passthrough, JSX-escaped children, peer deps for react/react-dom).
- **SC-1, SC-2, SC-3, SC-4, SC-6, SC-8:** `scripts/e2e.mjs` rewritten — `fileURLToPath`, `pnpm.cmd` on Windows, awaited builds and child exits, `taskkill /T /F` on Windows for tear-down.
- **W-1, W-6:** root `package.json:workspaces` removed (pnpm-only); `engines.node: ">=20"` added.

### Tier 1 — Security & Correctness (DONE)
- **SSR XSS surface (#2, #3, #37, edge-adapter 404):** all interpolation paths now use `@mfjs/security/escapeHtml`. `renderRouteToString` re-throws `SsrRedirect` instead of swallowing (#1). `injectIntoTemplate` uses `replaceAll` (#13). `defaultNotFound` consistent with the success path.
- **#5, #9, #10:** Cache-Control honors 4xx (`notFoundCache` opt), header keys lowercased uniformly via `lowerKeys()`.
- **#6:** weak ETag now FNV-1a 64-bit (replaces DJB2).
- **#8, #114:** case-insensitive header lookups on every adapter.
- **#11, #12:** `renderRouteToString` defaults to hydratable `renderToString`; `renderToStaticMarkup` is opt-in for static-only.
- **#15, #17, #18, #19, #20:** stream pipes synchronously inside `onShellReady`; deferred Suspense errors collected in `errors[]` and fed to `opts.onError`; `signal` + `timeoutMs` supported; `collectStream` uses `node:stream/consumers.text`.
- **#22, #24, #25, #26, #29, #31, #32:** `staticExport` deduplicates output paths, blocks path traversal, strips query/hash, propagates failures, rejects non-terminal `*` and pattern routes (`:id`/`*`), URL-decodes splats, safe-decodes params.
- **#33, #50, #46, #47, #48:** state-hydration nonce validated against base64url alphabet; `buildCsp` validates nonce, supports `strictDynamic` (default-on with nonce), `strictStyles`, and `report-to`.
- **#36, #51, #92:** `csp.ts` and `sri.ts` are edge-runtime-safe — Web Crypto + manual base64 (no `Buffer`, no `node:crypto`). `@mfjs/ssr` exposes `./edge` and `./node` subpath conditions.
- **#42, #44, #45:** `isRedirect` requires `typeof err.location === 'string'`; `ssrLoadRemote` distinguishes "module not found" from "module loaded but threw"; `subpath` validated via `isSafePathname`.
- **#52, #53:** `sriHashFromUrl` requires HTTPS by default.
- **#54, #55, #56:** `RemoteAllowlist` is case-insensitive, supports `**` multi-label wildcard, rejects non-`http(s):` schemes by default.
- **#58, #59, #60:** `safeJsonForScript` wraps circular errors; `escapeHtml` no longer over-escapes `/`; `pruneProtoKeys` and `safeObjectAssign` added.
- **`config.ts` arbitrary-code execution (CLI §):** `mfjs.config.ts` requires a compiled `.js` sibling; deep-merge JSON+TS; errors raised as `MfjsCliError` with codes `CONFIG-001/002/003`.
- **`generate.ts` template injection:** validates app names (`/^[a-z][a-z0-9-]*$/`) and ports; uses `JSON.stringify` for substitutions; rspack template resolves via `__dirname`.
- **Runtime origin allowlist + SRI:** `RemoteRegistry` rejects unlisted origins, supports `*`/`**` wildcards, batches `onChange`, requires `httpOnly` by default. `loadRemoteEntry` accepts `allowedOrigins`, sets `crossOrigin='anonymous'` and `integrity` when present.

### Tier 2 — Reliability under load (DONE)
- **`remote-loader.ts:124-229`:** in-flight dedupe via `globalThis`-pinned `Map`. Listener leak fix (`{ once: true }` + symmetric cleanup). Cache hit now emits `phase:'success'` telemetry. `safeInit` narrows swallowing to "already initiali[sz]ed". `getGlobal()` no longer uses `Function('return this')()` (no `unsafe-eval`).
- **`routing.tsx:233-319`:** `RemoteOutlet` aborts in-flight imports on rapid nav (`AbortController`). Module-level LRU cache shared across instances. `error` reset on no-match. `usePathname` SSR-safe. `NavLink` uses `+ '/'` boundary. `RemoteApp` `pages` stabilized via path-list key.
- **`use-remote-data.ts`:** bounded LRU; short error TTL (default 1500 ms) so transient failures don't poison the cache.
- **`server-router.ts:67-87`:** `withServerRouter(path, fn)` backed by AsyncLocalStorage when available (lazy import keeps edge bundles clean). Fallback singleton is documented as "tests / single-threaded only".
- **`@mfjs/state` and `@mfjs/event-bus` registries:** pinned to `globalThis` (S-8, EB-4); `dispatch` is no longer reentrant (S-1); `getStore` warns on signature mismatch (S-7); `Unsubscribe` returns `void` (S-11).
- **`EventBus`:** `onAny` wildcard (EB-1), per-event replay (EB-2), per-bus error handler (EB-6), `once` order made `try { … } finally { unsub(); }` (EB-5).
- **`error-boundary.tsx`:** `componentDidCatch` implemented; emits `MFJS_ERROR_EVENT` so `@mfjs/observability` can capture render-time crashes.
- **`render-to-stream.ts`:** `signal`/`timeoutMs`/`onError` options; `errors[]` collected; abort via `stream.abort()`; sentinel-protected timeout race.

### Tier 3 — Cross-platform / Windows (DONE)
- **`dev.ts`, `build.ts`:** `pnpm` → `pnpm.cmd` on Windows; `execa` for builds; `tree-kill` + 3 s SIGKILL escalation; chokidar for recursive watch (replaces `fs.watch({recursive:true})`); per-app restart instead of `restartAll()`.
- **`generate.ts`, `scaffold.ts`:** removed `process.chdir` races — subcommands receive `--dir` explicitly.
- **`index.ts`:** `parseAsync` + `unhandledRejection`/`uncaughtException` handlers; global `--cwd`/`-v`/`--dry-run` flags via `program.hook('preAction')`; symlink-safe direct-invocation detection.

### Tier 4 — DX, types, schemas, observability (DONE)
- **T-1, T-2:** `validateFederationContract` is now `async` and actually `await container.get(key)` for each exposed module; `validateFederationContractKeys` retains the structural-only check.
- **T-3, T-4:** `applyPlugins` is fully typed; `applyFederationConfigPlugins` exposes the third hook the audit said was unreachable. `MfjsWorkspaceConfig.plugins: MfjsPlugin[]`.
- **T-5, T-6:** `routeFromPageFile` throws on empty input and skips `(group)` folders. `sortRoutesForMatching` warns on duplicate paths in dev.
- **CLI extraction:** `discoverApps()` (`packages/cli/src/discovery.ts`) replaces 5 duplicated discovery loops. `MfjsCliError` adds error codes; `failHard` helper added; hints rendered in yellow.
- **Edge-adapter API:** `EdgeRequest` gained `body?: string | Uint8Array | ReadableStream<Uint8Array>` and `signal?: AbortSignal`; `EdgeResponse.body` widened. `enrichHead` hook + per-request `csp` factory + `notFoundCache` + HEAD/OPTIONS handling added.
- **`adapter-node`:** path-traversal check uses `path.relative`; immutable cache only on fingerprinted assets; binary body buffering with size cap and timeout (slow-loris hardening); MIME table extended; structured logger option; `keepAliveTimeout`/`headersTimeout`/`requestTimeout` set.
- **`adapter-cloudflare`, `adapter-vercel`:** lowercased headers, body + signal forwarded, ReadableStream responses.
- **Observability + security**: smoke-test suites added (3 + 16 tests respectively).

### ⚠️ Deferred (not closed in this pass)
- **#7 ETag-before-render:** still computes ETag after render. Needs a request-keyed HTML cache architecture.
- **CI-6 / config schemas:** JSON Schemas for `mfjs.config.json` / `mfjs.app.json` / `mfjs.federation.json` are still not generated or published; the `init` template's `$schema` URL still 404s.
- **CS-1 changeset linked group:** every lib still bumps in lockstep — has not been split.
- **EXS-3 example SSG tests:** still depend on a pre-existing `dist-ssg/` directory; the workspace test scripts now filter `'!mfjs-example-*'` so this no longer blocks CI, but the underlying ordering issue is not fixed.
- **#21 staticExport parallelism, #27 content fingerprinting:** sequential renders preserved.
- **EV-2 / EX-8 duplicated `events.ts`:** apps still re-declare `MfAppEvents` locally.
- **`prefetch.ts:5` unbounded `Set`:** still unbounded.
- **`@mfjs/state/react` adapter, persistence, devtools (S-6, S-10, S-12):** not added.
- **`mfjs deploy` plugin model:** still scaffolds inline; per-target adapter packages exist but are not loaded via plugin discovery.

### Build / Test verification
- `pnpm -r build` → 14/14 packages green.
- `pnpm -r --filter '!docs' --filter '!@app/*' --filter '!mfjs-example-*' test` → 11/11 suites green, 130/142 CLI tests pass (12 pre-existing skipped).

---

## Scope
- **CLI**: `packages/cli/src/{index,config,errors}.ts` + 14 commands (`build`, `ci`, `compress`, `deploy`, `dev`, `diagnose`, `env`, `federation`, `generate`, `image`, `init`, `lazy`, `lint`, `perf`, `routes`, `scaffold`, `ssr`, `sw`, `test`, `typecheck`).
- **Runtime**: `libs/runtime/src/*.{ts,tsx}` — router, route components, hooks, remote loader, error boundaries, prefetch, service worker, islands, shadow DOM, view transitions, telemetry.
- **SSR + Adapters**: `libs/ssr`, `libs/adapter-{node,vercel,cloudflare}`, `libs/security`, `libs/observability`, `libs/rspack-route-assets`.
- **State / Comms / Types / UI / Examples / Release**: `libs/state`, `libs/event-bus`, `libs/events`, `libs/types`, `libs/ui`, `libs/{eslint-config,tsconfig,prettier-config}`, `examples/{basic,ecommerce,saas}`, `scripts/e2e.mjs`, `.github/workflows`, `.changeset`, root workspace.

## Severity legend
- **Critical**: Security holes, data loss, broken core paths, production-blocking.
- **High**: Reliability bugs, race conditions, leaks, missing safety, cross-platform breakage.
- **Medium**: DX gaps, architecture smells, missing features per `plan.md`.
- **Low**: Cosmetic, maintainability, minor edge cases.

## Headline counts (approximate)
| Area | Findings | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| CLI | 95 | 4 | 32 | ~40 | ~19 |
| Runtime | 110 | 5 | 26 | 50+ | 20+ |
| SSR + Adapters | 114 | 3 | 25 | 50 | 36 |
| State / Libs / Examples / Release | 80 | 4 | many | many | many |
| **Total** | **~400** | **~16** | **~100+** | — | — |

## Top cross-cutting themes (read first)
1. **Versioning is broken at the root** — every publishable lib stays at `0.0.0`, no `exports`, `files`, `peerDependencies`, `repository`, `description`, `license` fields. Cannot publish today. (See "State / Libs" §13–14.)
2. **No CI workflow** — only `release.yml` exists. Lint/test/build never run on PRs.
3. **Window-hostile** — `spawn(..., { shell: false })` with `pnpm` (`.cmd` shim issue), `SIGTERM` on Node child processes, `fs.watch({recursive:true})` on Linux, `process.chdir` race in scaffold/wizard.
4. **XSS surface** in SSR — `renderRouteToString` interpolates raw `error.message`/`specifier`/state into HTML; `state-hydration` claims "no mismatch" but uses `renderToStaticMarkup`.
5. **Edge-runtime breakage** — `Buffer.from` in `csp.ts`, `node:crypto` in `sri.ts` will crash Cloudflare Workers / Vercel Edge.
6. **Race conditions and leaks in remote loading** — `loadRemoteEntry` has no in-flight dedupe; `RemoteOutlet` doesn't abort on rapid nav; cache is per-instance + unbounded; localStorage cache short-circuits telemetry.
7. **Schema validation absent** — `init` template references `https://mfjs.dev/schemas/*` 404s. `mfjs.config.ts` is `import()`-loaded with arbitrary-code execution risk and silent error swallowing.
8. **Shell command injection / template-string injection** — `mfjs generate` interpolates raw `${name}` into `rspack.config.mjs` template strings; `ci.ts` builds YAML by string concat without escaping.
9. **No allowlist enforcement at runtime** — `cfg.federation.allowlist`/`sri`/`csp` declared in config types but never wired into federation generator or runtime loader.
10. **Singleton fragility** — module-level singletons (`_serverRouter`, state registries, event-bus) bleed across SSR requests and silently bifurcate when MF singleton sharing fails.

## Document structure
1. CLI (`@mfjs/cli`) — 95 findings
2. Runtime (`@mfjs/runtime`) — 110 findings
3. SSR + Deploy Adapters — 114 findings
4. State / Comms / Types / UI / Examples / Release — 80 findings
5. Cross-cutting summary, top quick wins, strategic themes (at the end of each major section).

---


# `@mfjs/cli` audit

Scope: `packages/cli/src/{index.ts,config.ts,errors.ts,commands/*.ts}` plus `packages/cli/test/*` coverage gaps.
Reviewer pass: full read of every source file. Findings include severity (Critical / High / Medium / Low),
file:line, category (Bug / Architecture / Security / DX / Performance / Maintainability / Cross-platform / Test),
the problem, and the recommended fix.

---

## `src/index.ts`

- **[High] Bug — `index.ts:84-87` (Direct invocation: error swallowed silently)**
  `program.parse(process.argv)` is wrapped in `try/catch` but Commander's parse for async actions returns
  before any `.action(async () => …)` callback rejects. `parse` is the **sync** entrypoint, so the catch
  here only fires on Commander's own argv-validation throws — not on action errors. Any unhandled rejection
  inside an async command will print Node's default `UnhandledPromiseRejection` rather than going through
  `printCliError`.
  **Fix:** call `program.parseAsync(process.argv)` and `await` it inside an async IIFE; route both rejections
  and synchronous throws through `printCliError`. Also install `process.on('unhandledRejection', printCliError)`
  as a safety net.

- **[Medium] Bug — `index.ts:74-80` (Direct-invocation heuristic breaks under symlinks / `npm link` / `pnpm` shims)**
  Comparing `path.resolve(process.argv[1])` against `fileURLToPath(import.meta.url)` fails when the bin is a
  symlink, a Windows `.cmd` shim, or executed via `npx`. In those cases the CLI silently does nothing.
  **Fix:** prefer Node 20.11+ `import.meta.main`, or compare via `fs.realpathSync(process.argv[1])`, or make
  this entry file a thin bin that always parses, and put the programmatic API behind a separate export.

- **[Medium] Architecture — `index.ts:1-26` (No central `--verbose`/`--dry-run`/`--cwd` global flags)**
  Every subcommand redeclares `-d, --dir <path>` (sometimes as `--cwd`, see `diagnose`/`deploy`/`sw`/`env`)
  and only a few add `--dry-run`. `MFJS_DEBUG=1` is the only verbose toggle (errors.ts:34). Per `plan.md:104`
  the roadmap calls for global `--dry-run` / `--verbose` flags.
  **Fix:** add `program.option('--cwd <path>')`, `program.option('-v, --verbose')`, `program.option('--dry-run')`
  on the root program and have subcommands consume them via `command.parent?.opts()`. Also unify on a single
  flag name (`--cwd` vs `--dir`).

- **[Low] Maintainability — `index.ts:30-39` (Version fallback masks build problems)**
  When `require('../package.json')` fails, the CLI silently reports `0.0.0`. That hides a real packaging bug
  (a published artifact that can't read its own `package.json`).
  **Fix:** at least log to stderr in `MFJS_DEBUG=1` mode, and prefer reading `package.json` via
  `readFileSync(new URL('../package.json', import.meta.url))` so it works under bundlers.

- **[Low] DX — `index.ts:67` (`showHelpAfterError()` only — no fuzzy "did you mean" suggestion)**
  Commander supports `program.showSuggestionAfterError(true)`.
  **Fix:** enable suggestions and `program.showHelpAfterError('(use --help)')` for tighter UX.

---

## `src/config.ts`

- **[Critical] Security / Bug — `config.ts:67-93` (`mfjs.config.ts` is loaded via raw `import()` — arbitrary code execution)**
  `loadWorkspaceConfig` does `await import(pathToFileURL(tsPath).href)` **directly on the user's untranspiled
  TS file**. Two problems:
  1. Node cannot natively import `.ts` without a loader; under tsx/ts-node this works but under plain
     `mfjs` (which is shipped as compiled JS) the import will throw and fall through to the
     swallowed-`catch` (line 89), silently producing an **empty config**. Any user relying on `mfjs.config.ts`
     for plugins, allowlist, csp, etc. will silently get defaults.
  2. The TS config file executes arbitrary JS at CLI start. If a workspace ever has a malicious or
     accidentally-broken `mfjs.config.ts`, every CLI invocation runs that code.
  **Fix:** require pre-transpiled `mfjs.config.js` (or use `jiti`/`tsx`'s programmatic loader, or
  `tsImport` from Node 22+). Stop swallowing the error — surface "could not load mfjs.config.ts" clearly.

- **[High] Bug — `config.ts:73-92` (JSON wins over TS, but order is reversed in spirit)**
  When both files exist, JSON loads first (line 73) and TS loads second and overrides. That contradicts the
  generated `init` template which writes both `mfjs.config.json` and `mfjs.config.ts` and treats TS as the
  primary. But more critically: a partial TS config (e.g. only `{ name }`) with `{...cfg, ...tsCfg}` will
  **wipe** any `features`/`federation`/`security` blocks set in JSON because the spread is shallow.
  **Fix:** deep-merge (lodash `merge` or a hand-written one), and document which file wins. Also reject
  having both files unless deliberately layered.

- **[High] Bug — `config.ts:74-79, 82-91` (Silent `catch {}` on invalid config)**
  Both the JSON `readJson` and the TS dynamic `import` swallow errors. A malformed `mfjs.config.json`
  (trailing comma, syntax error) makes the CLI behave as if no config exists. Users get mysterious "missing
  feature" reports.
  **Fix:** print a kleur-red diagnostic at minimum, or throw — only "missing file" should be silent.

- **[High] Security — `config.ts:42-43` (`CliPlugin.federationConfig`/`devPlan` accept `any`)**
  No schema validation. Plugins returned by user code can replace the entire federation config, including
  `remotes` URLs that bypass workspace `federation.allowlist`. The `allowlist` is declared in `cfg`
  (lines 25-26) but is never consulted in the federation generator.
  **Fix:** define a Zod schema for `CliPlugin` outputs and enforce that plugin-provided remotes are still
  inside `cfg.federation.allowlist`.

- **[Medium] Architecture — `config.ts` (Schema validation absent)**
  `CliWorkspaceConfig` is only a TS type. The `init` template emits a `$schema:
  https://mfjs.dev/schemas/mfjs.config.json` reference (`init.ts:74`) but no schema file exists in the repo.
  Bad keys (typos like `featurs.tailwind`) are silently ignored.
  **Fix:** publish the JSON schema, and at load-time run a Zod/AJV validator with friendly error messages;
  a `$schema` line that 404s is worse than no schema.

- **[Medium] Bug — `config.ts:94` (`plugins` source-of-truth is the same `cfg.plugins` it's about to mutate)**
  `applyHook` (line 95) calls `configResolved` plugins and reassigns `cfg`. If a plugin returns a new object
  without re-spreading `plugins`, subsequent hooks lose the plugin list. The current loop is fine because
  `plugins` is captured before `applyHook`, but the API is fragile and surprising.
  **Fix:** freeze `plugins` array, document immutability, and snapshot the array.

- **[Low] DX — `config.ts:100-102` (`getTailwindDefault` ignores explicit `false`)**
  `Boolean(undefined)` and `Boolean(false)` are both `false`; users can't distinguish "not configured" from
  "explicitly off" — used by `scaffold` to seed prompts.
  **Fix:** return `boolean | undefined` and let callers handle the tri-state.

---

## `src/errors.ts`

- **[Medium] Bug — `errors.ts:40` (Sets `process.exitCode` but caller may continue running)**
  Setting `process.exitCode = 1` does not stop the event loop — code after the `printCliError` call still
  runs. Several callers (e.g. `ssr.ts:90, 103, 122`) do `printCliError(...); return;` from the action, but
  `dev.ts`/`build.ts` set `process.exitCode = code` and continue spawning more children, leading to leaked
  child processes with a failing exit code.
  **Fix:** either `throw` and let `index.ts` catch, or expose a `failHard(err)` helper that does
  `process.exit(code)`. Document the contract.

- **[Low] DX — `errors.ts:28-32` (Hint lines are gray, not yellow)**
  Gray hints under a red error blend into the terminal background on dark themes. Hints are critical
  remediation guidance.
  **Fix:** use `kleur.yellow` for hints, reserve gray for stack traces.

- **[Low] Maintainability — `errors.ts:13-19` (No structured error codes)**
  `formatCliError` only carries `message` + `stack`. The runtime package uses error codes (`RUNTIME-006`,
  see `generate.ts:248`) but the CLI does not. This makes scripted CI consumption brittle.
  **Fix:** add `code?: string` and a `MfjsCliError` subclass.

---

## `src/commands/init.ts`

- **[High] Bug — `init.ts:38-39` (TOCTOU on `ensureEmptyDir` then `ensureDir`)**
  Two filesystem ops back-to-back: first checks emptiness, then creates the directory. Between the two,
  another process can populate the directory. Also: if `pathExists` returns `false`, `ensureDir` happily
  creates it — but the user gave a typo'd parent and now the workspace was created in the wrong place.
  **Fix:** combine into one atomic create + lock; print resolved path and prompt for confirmation
  (consistent with `--yes`).

- **[Medium] Bug — `init.ts:50` (`packageManager: 'pnpm@9.15.5'` hard-pinned)**
  Generated workspaces always specify pnpm 9.15.5, even though the rest of the system tolerates any pnpm 9.
  When pnpm 10 ships and Corepack defaults to it, generated workspaces will fail `pnpm install` until users
  hand-edit. Also — version is duplicated in `deploy.ts:113` (`corepack prepare pnpm@9.15.5`).
  **Fix:** read the parent CLI's own `package.json packageManager`, or accept `--package-manager` flag.

- **[Medium] DX — `init.ts:41-44` (Tailwind prompt UX is inverted)**
  `interactive ? confirm(...) : opts.tailwind` — but if user passes `--tailwind` on the command line and the
  terminal is a TTY, the prompt overrides the flag (default is the flag value, but they still have to press
  Enter). Combined with `-y, --yes`, the only way to get the flag value silently honored is to use `-y`.
  **Fix:** if `--tailwind` is explicitly passed, skip the prompt.

- **[Medium] DX — `init.ts:154-160` (CI workflow defaults silently to Netlify)**
  `init` always writes `.github/workflows/deploy.yml` with `target: 'netlify'`, requiring secrets the user
  may not have. There is no flag (`--ci-deploy-target`).
  **Fix:** make CI generation opt-in (`--ci`), or default to a no-op deploy comment.

- **[Low] Bug — `init.ts:50-58` (`scripts.test` runs `pnpm -r test` but generated apps emit `vitest run`)**
  Generated app scripts are `test: 'vitest run'` (`generate.ts:48`) — fine. But the workspace's `pnpm -r test`
  will recurse into every package including those without `test`, producing noisy "no script test found".
  **Fix:** use `pnpm -r --if-present test`.

- **[Low] Maintainability — `init.ts:74` (`$schema` URL is fictitious)**
  See config.ts findings; the schema is referenced but not published.

---

## `src/commands/generate.ts`

- **[Critical] Security / Bug — `generate.ts:99-240` (Generated `rspack.config.mjs` embeds raw `${name}` and `${port}` in template literal)**
  The whole rspack config is built with `\`...${port}…uniqueName: '${name}'…\``. `name` is `toKebab(rawName)`
  which strips spaces and underscores but **does not escape single quotes**. A user invoking
  `mfjs generate remote "evil');//"` would inject JS into the generated `rspack.config.mjs`. Also
  `${name}` lands inside `${name}@http://localhost:${port}` later (`federation.ts:212`). Although kebab-case
  filters most chars, `toKebab` allows hyphens but anything that survives lowercase + non-letter strip
  produces invalid JS that breaks the build at minimum.
  **Fix:** validate `name` against `/^[a-z][a-z0-9-]*$/` and reject otherwise; treat all template
  interpolations as untrusted and use `JSON.stringify(name)` rather than bare quotes.

- **[High] Architecture — `generate.ts:99-240` (250-line stringified rspack config baked into the CLI)**
  The entire `rspack.config.mjs` template lives as a single template-literal string. Any change to dev-server
  proxy logic, MF wiring, or the on-demand starter requires editing this string with no syntax checking. Test
  coverage cannot exercise the generated code paths in isolation.
  **Fix:** ship a real `templates/rspack.config.mjs` file as a static asset, copy at scaffold time, and
  inject app-specific bits via small marker replacements (or via env). Keep the template under
  `tsc`-checked source.

- **[High] Bug — `generate.ts:122` (`.replace(/\\/remoteEntry\\.js$/, '')` strips path even when host serves
  remoteEntry at root)**
  In dev, Rspack serves `remoteEntry.js` at `/`, so `target` becomes `http://localhost:3001` minus the
  trailing `/remoteEntry.js`. But if a user customizes `filename` in `mfjs.federation.json`, the regex no
  longer matches and `target` becomes the full remoteEntry URL — proxy then double-paths.
  **Fix:** parse the URL, compute origin, never assume filename.

- **[High] Bug — `generate.ts:462-486` (`runSub` + `process.chdir` is racy)**
  In the wizard, multiple subcommands run sequentially with `process.chdir(workspaceDir)` and `chdir(prev)`
  in `finally`. If any inner `parseAsync` rejects after `chdir` but before the `finally` (synchronous throw
  from `commander` validation), `process.cwd()` may be left changed. Worse, parallel CLI invocations or any
  concurrent code (the dev reload server, file watchers) read the wrong cwd mid-call.
  **Fix:** pass `--dir` explicitly (already done), avoid `process.chdir` entirely. Restructure subcommand
  invocation to call the action functions directly with options objects.

- **[Medium] Bug — `generate.ts:463` (Wizard remote naming uses `remoteNames[i]!` with non-null assertion)**
  This relies on `noUncheckedIndexedAccess` not being enforced at call site. With strict tsconfig, the `!`
  could mask a future bug if the loop bound changes.
  **Fix:** capture into a local `const name = remoteNames[i] ?? \`remote-${i+1}\`;`.

- **[Medium] Architecture — `generate.ts:336-417` (`createHostCommand` and `createRemoteCommand` are 80% identical)**
  Both copy the same `--port`, `--tailwind`, `--dir`, scaffold sequence, and only differ in
  `addHostRemoteDemo` vs `addRemoteEntrypoint`. Adding a new shared option (e.g. `--package-manager`)
  requires touching both.
  **Fix:** factor a `createAppCommand({ kind, defaultPort, postScaffold })` helper.

- **[Medium] Bug — `generate.ts:347, 396` (`Number(opts.port)` accepts `NaN` silently)**
  `--port abc` → `Number('abc') = NaN` → written into rspack config and `mfjs.app.json`. The dev server
  fails much later with an opaque error.
  **Fix:** `const port = Number.parseInt(opts.port, 10); if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(...)`.

- **[Medium] Bug — `generate.ts:355` (Host scaffold hardcodes `'dashboard'` as the demo remote)**
  The generated host's `addHostRemoteDemo(appDir, 'dashboard')` writes routes referencing a remote that may
  not exist yet. Running `mfjs generate host shell` alone (without `mfjs generate remote dashboard`)
  produces a host that fails to load at dev time with `RUNTIME-006`.
  **Fix:** accept `--remote <name>` (or `--demo-remote`) and inject; or make the template check for the
  remote at runtime and degrade gracefully.

- **[Medium] Cross-platform — `generate.ts:107-110` (`process.cwd()` inside the generated rspack.config)**
  Generated rspack config calls `path.join(process.cwd(), federationFile)`. If a user runs `pnpm dev` from
  a different directory than the app, federation file is missed silently and host degrades to no-MF mode.
  **Fix:** resolve relative to `__dirname` of the rspack config file.

- **[Medium] DX — `generate.ts:430-506` (Wizard prompts have no abort/back navigation)**
  `@inquirer/prompts` supports `abortSignal`; right now Ctrl-C in the middle leaves a half-scaffolded
  workspace.
  **Fix:** wrap in a try/catch, on abort delete created directories or print recovery instructions.

- **[Low] Bug — `generate.ts:17-23` (`toKebab` strips Unicode letters)**
  `toLowerCase()` then nothing to filter non-ASCII. `mfjs generate remote 监控` becomes `监控` (lowercased)
  which is a valid folder name on most filesystems but breaks on `toFederationName` (line 39) which strips
  it to `_` → all remotes named `_`.
  **Fix:** restrict to ASCII or transliterate.

- **[Low] DX — `generate.ts:436-438` (Wizard refuses to run without TTY but doesn't suggest the alternative)**
  Just prints "Wizard requires an interactive terminal" and returns silently with exit code 0.
  **Fix:** exit non-zero and print the exact `mfjs generate host` command to run instead.

---

## `src/commands/dev.ts`

- **[Critical] Bug — `dev.ts:485-525` (`--watch` restarts orphan all old child processes)**
  `restartApp` calls `entry.child.kill('SIGTERM')` then immediately `run('pnpm', args, ...)` and reassigns
  `entry.child`. But the old child is **also** still in the `children` array passed to
  `attachGracefulShutdown` and `attachRemoteRebuildWatcher`. On Windows, `SIGTERM` is best-effort and the
  pnpm subprocess often survives; the new child binds the same port and crashes with EADDRINUSE.
  Additionally, `restartAll()` (line 502) restarts every app on every change — including the host when only
  a remote's `mfjs.federation.json` changed — multiplying the orphan problem.
  **Fix:** await `child.exited` before respawn (use `tree-kill` on Windows for the descendants), only
  restart the affected app (per-path → app mapping), bound respawn rate, and rewire the `children` array.

- **[High] Bug — `dev.ts:101-119` (`run` returns the child but never signals failure to the caller)**
  `run` only sets `process.exitCode = code` on non-zero exit. Callers never get notified that a remote
  crashed at boot, so `dev` continues happily printing the host URL while the user wonders why the remote
  404s.
  **Fix:** return a Promise wrapping the spawn and surface boot failures (e.g. exit before first stdout).

- **[High] Bug — `dev.ts:101-109` (`shell: false` on Windows + `pnpm` resolution)**
  On Windows, `pnpm` is a `pnpm.cmd` shim. `spawn('pnpm', args, { shell: false })` cannot resolve `.cmd`
  files without `shell: true`. Node 16+ added safer handling for `cmd.exe` but `shell: false` still fails
  on `.cmd` shims unless you call `pnpm.cmd` explicitly.
  **Fix:** detect Windows (`process.platform === 'win32'`) and either set `shell: true` (with caution about
  argument quoting) or call `pnpm.cmd` directly. Alternatively, use `execa` (already a dep) which handles
  this correctly.

- **[High] Bug — `dev.ts:138-159` (`attachGracefulShutdown` only kills via SIGTERM)**
  Same Windows issue: `child.kill('SIGTERM')` is a no-op on Windows for non-cooperative children. Also the
  function never escalates to SIGKILL after a timeout, so a stuck child blocks Ctrl-C forever and leaks.
  **Fix:** use `tree-kill` or escalate after 3 s; on Windows use `taskkill /T /F /PID <pid>`.

- **[High] Bug — `dev.ts:200-226` (Remote-rebuild detection is regex-on-stdout — fragile and error-prone)**
  `attachRemoteRebuildWatcher` looks for `compiled successfully|with warnings` in stdout to broadcast
  reload. Rspack's output format isn't stable across versions, and ANSI color codes embedded in the chunk
  can break the case-insensitive regex (`[32m`). Also: on rebuild failure, no event is broadcast, so
  the host keeps the broken module.
  **Fix:** consume Rspack's stats hooks via a small companion plugin or IPC, not stdout regex.

- **[High] Bug — `dev.ts:35-52` (`ensureFederationConfigs` skips when ANY app has the file)**
  Filter `apps.filter((a) => !fs.existsSync(...))` is correct, but the actual call only checks `missing.length === 0`
  before bailing. The real bug: when the federation files exist but are stale (host's remotes list points at
  old ports), `dev` doesn't regenerate. Users have to manually delete the file.
  **Fix:** add `--regenerate` flag, or mtime-compare against `mfjs.app.json` and regenerate if stale.

- **[High] Cross-platform — `dev.ts:36, 305` (`fs.existsSync` and `fs.pathExists` mixed; relative path comparison via `startsWith`)**
  Mostly OK but `dev.ts:36` uses sync `fs.existsSync` from `fs-extra` which is fine. The bigger Windows risk
  is `path.join(workspaceDir, 'apps')` for proxy URLs at `dev.ts:249`: hardcoded `localhost` and `\\` in
  paths used as URL fragments. None of the URL building in `writeHostProxyFederation` worries about path
  separators, but log output (`dev.ts:536` `path.relative`) prints backslashes on Windows.
  **Fix:** normalize all log paths via `toPosixPath` (already exists in `routes.ts`).

- **[Medium] Bug — `dev.ts:298-306` (`appFolders` includes any non-`.` folder, including `node_modules` if user puts it there)**
  Filter is `!f.startsWith('.')` — so e.g. a stray `__archive` directory is treated as an app candidate. The
  next check (`mfjs.app.json` exists) gates it, but reading `appsDir` recursively is not bounded.
  **Fix:** use `fs.stat` to require directory and skip well-known noise (`node_modules`, `dist`).

- **[Medium] Bug — `dev.ts:421-441` (Two near-identical spawn branches differ only in env)**
  Copy/paste hazard.
  **Fix:** compute `env` once via `_devEnvForApp` (already exported for tests) and call `run` once.

- **[Medium] Architecture — `dev.ts:339-340, 350-418` (Reload server + on-demand starter both bind a random ephemeral port and never publish it for tooling)**
  Users running `mfjs dev` have to read the URL from stdout. A persistent `mfjs.dev-status.json` would let
  IDE plugins discover live state.
  **Fix:** write a status file under `.mfjs/dev.json` with PID, ports, URLs.

- **[Medium] Bug — `dev.ts:486-498` (Watch list misses critical files)**
  `--watch` watches `mfjs.config.*`, `mfjs.app.json`, `mfjs.federation*.json`, `mfjs.routes.*.json`,
  `rspack.config.mjs` — but **not** `package.json`, `tsconfig.json`, or `src/pages/**` (the routes manifest
  source). When a user adds a new page, only `mfjs routes --watch` regenerates; `mfjs dev --watch` doesn't
  pick it up.
  **Fix:** integrate `routes --watch` into `dev --watch`, watch `package.json`, exclude `dist/`.

- **[Medium] Bug — `dev.ts:509` (`fs.watch` on individual files leaks watchers and emits duplicate events)**
  One `fs.watch` per file; on Linux this is okay-ish, but on Windows `fs.watch(file)` often delivers two
  `change` events per save. The 300 ms debounce per-path mitigates but `restartAll()` is called once per
  file event, so one save → many restarts.
  **Fix:** debounce the union of events into a single `Set<string>` flush; better, use `chokidar`.

- **[Medium] DX — `dev.ts:324-326` (Warning about `--on-demand` without `--proxy-remotes` is non-fatal)**
  CLI proceeds and emits a confusing UX where the host "works" but on-demand never triggers because the
  proxy isn't installed.
  **Fix:** error out unless `--force` is passed.

- **[Low] Bug — `dev.ts:331-333` (Sort key is wrong)**
  `sorted = [...appMetas].sort((a, b) => (a.meta.type === 'remote' ? -1 : 1) - (b.meta.type === 'remote' ? -1 : 1))`
  works by accident — both sides resolve to ±1, but it's unreadable. The intent is "remotes first, host
  last" yet the ternary tag-team obscures it.
  **Fix:** `appMetas.slice().sort((a, b) => (a.meta.type === 'remote' ? 0 : 1) - (b.meta.type === 'remote' ? 0 : 1))`
  or just use two passes.

- **[Low] Bug — `dev.ts:528-531` (Host URL log assumes localhost; ignores `--host` / IPv6)**
  Hardcoded `http://localhost:${port}`.
  **Fix:** consult Rspack devServer host or accept `--public-host`.

---

## `src/commands/build.ts`

- **[High] Bug — `build.ts:14-25` (`runBuild` uses `spawnSync` and only sets exit code — does not stop the loop)**
  When app A's build fails, line 22 sets `process.exitCode`; line 74 (`return`) bails — but in practice the
  `for` loop has already started. Worse, `runBuild` is sync; a long build blocks the event loop and the
  user can't cancel cleanly with Ctrl-C until `spawnSync` returns.
  **Fix:** switch to async `execa`, propagate an error, and abort gracefully on SIGINT.

- **[High] Cross-platform — `build.ts:15-16` (`spawnSync('pnpm', ..., { shell: false })`)**
  Same Windows `.cmd` shim issue as `dev.ts:101`.
  **Fix:** use `execa` or set `shell: true` on Windows.

- **[Medium] Architecture — `build.ts:46-66` (App discovery loop duplicated across `dev.ts:298-306`, `federation.ts:123-139`, `routes.ts:85-101`, `ci.ts:349-367`, `typecheck.ts:25-44`)**
  Five files re-implement the same "scan apps/, read mfjs.app.json" pattern, each with subtle differences
  (one filters `!f.startsWith('.')`, one doesn't `fs.stat`, etc.). This is the single biggest copy-paste in
  the CLI.
  **Fix:** extract `discoverApps(workspaceDir): Promise<App[]>` into `src/discovery.ts` and use everywhere.

- **[Medium] Bug — `build.ts:83-96` (Compress runs unconditionally in serial, even though sharp/zlib brotli with quality=11 is CPU-bound)**
  Brotli at `BROTLI_PARAM_QUALITY=11` is **slow** (5-30 s per MB). For a workspace with a 5 MB shell bundle
  this single-threaded loop adds 1-3 minutes to every build.
  **Fix:** use a worker pool (e.g. `piscina`) or default to brotli quality 6-9.

- **[Medium] DX — `build.ts:30-34` (`--compress` defaults `false` but help text suggests it's the recommended path)**
  No `--no-compress` switch and no global config for it (workspace `mfjs.config.json` doesn't influence
  build).
  **Fix:** read default from `cfg.build?.compress`.

- **[Low] DX — `build.ts:64` (Empty-apps message does not exit non-zero)**
  Returning silently when there are no apps means CI scripts that wrap `mfjs build` cannot distinguish "no
  apps" from "all apps built".
  **Fix:** non-zero exit with explanatory message, or `--allow-empty`.

---

## `src/commands/federation.ts`

- **[High] Bug — `federation.ts:100-121` (`detectSharedFromSource` reads only top-level `src/*` files)**
  `fs.readdir(srcDir)` returns the immediate entries; nothing under `src/components/`, `src/pages/`,
  `src/lib/` is scanned. So `import 'react-router-dom'` from a page file is missed and the dep is not
  marked as shared, causing duplicate React Router instances at runtime.
  **Fix:** use a recursive walker (already present in lazy.ts and image.ts).

- **[High] Bug — `federation.ts:114` (Includes test for `from "..."` and single-quote variants but breaks on backticks and string-with-comments)**
  The check `content.includes(`from '${pkg}'`)` misses `import * as r from "react"` (double-quote test only
  matches the escaped form `from \"${pkg}\"` which actually does not occur in source — it's only escaped in
  this regex). Also misses `import("react")` and `await import('react')`.
  **Fix:** parse with esbuild's `parseImports` or a small regex like `/from\s+['"]([^'"]+)['"]/g`.

- **[Medium] Bug — `federation.ts:42-54` (`detectAppName` returns last path segment of scoped name)**
  `'@app/dashboard'.split('/').pop() === 'dashboard'` — fine. But `pkg.name = 'shell'` (no scope) returns
  `'shell'` which is then passed through `toFederationName` (line 39). For names containing dots
  (`my.app`), the `.` is stripped to `_`, but the original `appsDir` is still `apps/my.app/` — the
  federation name and the URL no longer match.
  **Fix:** validate at scaffold time that name == kebabified package name.

- **[Medium] Bug — `federation.ts:163-196, 198-228` (Plugin hook iterates `for (const p of plugins)` but does not allow removing config)**
  `if (next) finalCfg = next` — if a plugin returns `null` to disable federation, it's ignored. If it
  returns an empty object, the merge wipes everything.
  **Fix:** define hook contract: `null` → remove app, `undefined` → no-op, otherwise replace.

- **[Medium] Architecture — `federation.ts:170-180, 200-214` (Identical `extraShared` / shared-merge / plugin-loop block duplicated for host vs remotes)**
  ~25 lines copy-pasted.
  **Fix:** extract `buildAppFederationConfig(app, plugins, workspaceCfg)`.

- **[Low] Bug — `federation.ts:212` (Hardcoded `http://localhost:` ignores `cfg.federation.publicPath`)**
  `cfg.federation.publicPath` is declared in config (line 19-20 of config.ts) but never used here. CDN
  publicPath users have to hand-write the URL.
  **Fix:** prefer `cfg.federation.publicPath` over `http://localhost:port` in non-dev mode (need to know
  build vs dev — currently this command has no env context).

- **[Low] Security — `federation.ts:212` (`federation.allowlist` and `sri` declared in config but never enforced)**
  CSP, allowlist, SRI all declared in `CliWorkspaceConfig` (`config.ts:18-33`) and never wired up.
  **Fix:** generate a runtime allowlist file consumed by `@mfjs/runtime` registry.

---

## `src/commands/routes.ts`

- **[High] Bug — `routes.ts:232-237` (`fs.watch(appsDir, { recursive: true })` is unsupported on Linux)**
  Per Node docs, `recursive: true` is supported on macOS and Windows only. On Linux, watch silently fails or
  throws `ENOSYS`. Users on Linux will see "no rebuilds" with no error.
  **Fix:** detect platform and fall back to `chokidar` or recursive walking + per-dir watchers.

- **[High] Bug — `routes.ts:107-131` (`scanPages` traverses without bounds and follows symlinks)**
  No `maxDepth`, no symlink check. A symlinked `node_modules` under `src/pages/` would be walked.
  **Fix:** use `fs.lstat` to skip symlinks, exclude `node_modules`/`dist`/etc.

- **[Medium] Bug — `routes.ts:151-162` (Import path resolution is brittle)**
  Three nested `?:` to derive the import path, with comments admitting it. A page at `src/pages/foo/[id].tsx`
  produces `./pages/foo/[id].tsx` — the literal `[` and `]` in an import specifier breaks under most
  bundlers.
  **Fix:** use a deterministic id mapping (`./pages/foo/_id_.tsx` or escape via `encodeURI`).

- **[Medium] Bug — `routes.ts:118` (Regex matches `.ts` AND `.tsx` AND `.jsx` AND `.js`)**
  Order matters: `mypage.test.ts` and `mypage.spec.tsx` are both included, generating spurious routes for
  test files.
  **Fix:** exclude `.test.`/`.spec.`/`.story.`.

- **[Medium] DX — `routes.ts:211-238` (Watch mode has no "regenerate now" trigger)**
  Once watching, the only way to force regeneration is to touch a page file.
  **Fix:** listen for SIGUSR2 or stdin keypress `r` for manual rebuild (Vite-style).

- **[Low] Bug — `routes.ts:53` (`localeCompare` is locale-dependent)**
  Sort by `path.localeCompare(b.path)` — under different host locales, the order in `mfjs.routes.json` will
  differ, breaking deterministic builds and CI artifact diffs.
  **Fix:** plain `<` / `>` comparison or `localeCompare(b, 'en-US')`.

---

## `src/commands/ssr.ts`

- **[Critical] Bug — `ssr.ts:54-69` (`withWorkspaceNodePath` mutates `process.env.NODE_PATH` and reaches into private Node internals)**
  Calls `cjs('module').Module._initPaths()` — undocumented Node internal. This is fragile across Node
  versions and the surrounding "set NODE_PATH then import" pattern fails for ESM (Node ignores `NODE_PATH`
  for ESM resolution). The `finally` block resets `NODE_PATH` even if it was undefined — note line 65
  assigns `prev` which may be `undefined`, leaving `NODE_PATH` literally set to the string `"undefined"`.
  **Fix:** prefer `createRequire(workspaceDir)` for resolution; better, document that the user must
  pre-build their app and avoid runtime resolution gymnastics. If `prev` is undefined, `delete process.env.NODE_PATH`.

- **[High] Bug — `ssr.ts:142-159` (`isStringApp` calls `App({ path: '/', params: {} })` to detect string vs React)**
  Probing the App by **calling it** triggers any side effects (data fetching, redirects, throws). Worse:
  the detection happens once at startup but the `serve` command repeats it on **every request** at
  line 246-247, causing a re-render of the `/` route on every HTTP hit just to decide which path to take.
  **Fix:** require an explicit config flag (`type: 'string' | 'react' | 'auto'` in `mfjs.ssr.json`), or
  introspect via `App.length` / a static marker.

- **[High] Bug — `ssr.ts:152-153` (Filename builder writes through directory traversal)**
  `route.path.replace(/^\//, '').replace(/\/$/, '')` does not sanitize `..` or `\\`. A route like
  `'../../etc/passwd'` (or any user-supplied route from `mfjs.ssr.json`) lands in `path.join(outDir, file)`
  and escapes `outDir`.
  **Fix:** validate routes against `^[/A-Za-z0-9_\-/]+$` and reject `..`.

- **[High] Bug — `ssr.ts:128-140, 219-231` (`@mfjs/ssr` is dynamically imported with empty catch on serve)**
  At line 225 the catch is `catch {` (no binding) so the original error is lost; user sees only the canned
  hint "Install it: pnpm add -D @mfjs/ssr". If the package exists but is broken, the diagnostic is misleading.
  **Fix:** capture the error and pass to `printCliError` along with the hint.

- **[Medium] Bug — `ssr.ts:175` (`--stream` defaults `true` but `--no-stream` is the opt-out and there's also `--stream`)**
  Commander supports both, but the result of `opts.stream` when neither flag is passed is `true`. When
  `--no-stream` is passed it's `false`. The line 235 check `opts.stream !== false && !!renderRouteToStream`
  works but the dual flags are confusing in --help.
  **Fix:** keep one flag (`--no-stream`) with default `true`.

- **[Medium] Bug — `ssr.ts:259-264` (Streaming path doesn't time out)**
  `await result.allReady` waits forever if a Suspense boundary never resolves. Production server hangs.
  **Fix:** wrap in `Promise.race` with a configurable timeout, then abort.

- **[Medium] Bug — `ssr.ts:287-298` (Shutdown exits via `process.exitCode` only, doesn't `process.exit`)**
  After SIGINT, the HTTP server's keep-alive sockets keep Node alive. Users see Ctrl-C ignored.
  **Fix:** `server.closeAllConnections()` (Node 18+) or `server.closeIdleConnections()`, then close.

- **[Low] DX — `ssr.ts:99-103` (Default outDir is `<workspace>/dist-static`)**
  Inconsistent with build's per-app `apps/<name>/dist`. Users expect `apps/<host>/dist-static`.
  **Fix:** mirror build conventions; document in README.

---

## `src/commands/typecheck.ts`

- **[Medium] Bug — `typecheck.ts:62-66` (`pnpm run typecheck` falls back when script exists, but `pnpm` resolution again has Windows .cmd issue)**
  `execa('pnpm', ...)` works because execa handles Windows; but `execa(tscBin, ['--noEmit'])` calls a path
  that may be a Windows `.cmd` shim too — execa handles that fine, so this one is actually OK. Note the
  inconsistency: `dev.ts/build.ts` use `spawn(...)` with `shell: false` (broken on Windows) while this file
  uses `execa` (works).
  **Fix:** standardize on execa everywhere.

- **[Medium] Bug — `typecheck.ts:74-80` (Catch block reads `err.stderr` but execa returns `stderr` only when `reject: true`)**
  The shape is fine, but `result.output` only contains stderr; tsc emits errors to stdout. Diagnostics are
  swallowed.
  **Fix:** include both stdout and stderr in the failure summary.

- **[Medium] Architecture — `typecheck.ts:25-44` (Discovery duplicated; doesn't honor pnpm-workspace.yaml)**
  Hardcoded roots `['libs', 'packages', 'apps']`. A custom workspace layout (e.g. `libs/components/`) is not
  supported.
  **Fix:** parse `pnpm-workspace.yaml` (yaml dep already pulled transitively) and use those globs.

- **[Low] DX — `typecheck.ts:113, 119-127` (Output format is line-by-line; no JSON output)**
  CI scripts can't easily parse pass/fail.
  **Fix:** add `--format json|tap`.

- **[Low] Performance — `typecheck.ts:117-130` (Sequential per-package; no `--concurrency` flag)**
  On a 10-package workspace, this is ~10x slower than parallel.
  **Fix:** add a `Promise.all` with concurrency cap.

---

## `src/commands/ci.ts`

- **[High] Bug — `ci.ts:24-103, 114-178, 187-261` (YAML produced via string concatenation; no escaping)**
  The hand-written YAML embeds `${opts.nodeVersion}` and `${opts.packageManager}` directly. A package
  manager value of `pnpm; rm -rf .` would land verbatim in workflow runs (a workflow file is checked
  into the repo, not executed by the CLI — so this isn't quite shell injection — but it's still
  unvalidated input that produces invalid YAML or unexpected workflows).
  **Fix:** validate `nodeVersion` against `/^\d+(\.\d+){0,2}$/` and `packageManager` against `/^(pnpm|npm|yarn)$/`,
  reject otherwise; or use a YAML library.

- **[Medium] Bug — `ci.ts:89` (Affected detection in workflow uses `HEAD~1`, not the merge base)**
  PR builds compare HEAD against `HEAD~1`, which is the previous commit on the branch — not the base
  branch. A PR with 5 commits will only detect changes from the most recent commit; everything earlier is
  treated as unchanged.
  **Fix:** use `${{ github.event.pull_request.base.sha }}` or `git merge-base origin/main HEAD`.

- **[Medium] Bug — `ci.ts:158, 197, 217-220` (Hardcoded `apps/shell/dist` deploy paths)**
  Generated workflows assume the host app is named `shell`. If a user names theirs `app` or `web`, deploys
  silently publish nothing.
  **Fix:** discover the host app from `mfjs.app.json` at generate time and inject the path.

- **[Medium] Bug — `ci.ts:380-415` (`detectAffectedApps` treats any `libs/` change as "all apps affected")**
  Coarse — a docs-only change in `libs/runtime/README.md` invalidates the whole CI cache.
  **Fix:** filter `libs/<x>/src/**`, `libs/<x>/package.json` only.

- **[Medium] Bug — `ci.ts:386-396` (`spawnSync('git', ...)` runs unbounded — no timeout)**
  Network-bound git calls in CI can hang forever.
  **Fix:** pass `timeout: 30_000` to spawnSync.

- **[Low] DX — `ci.ts:283-326` (Generate command has no `--force`; refuses to overwrite silently? actually overwrites)**
  `fs.outputFile` always overwrites without warning, losing user edits. The header says "modify freely" yet
  modifications are wiped on next `mfjs ci generate`.
  **Fix:** add `--force` flag and abort with diff suggestion otherwise.

- **[Low] Bug — `ci.ts:430-448` (`affected` command uses `console.log` for both empty and non-empty; JSON format prints `\n`)**
  `process.stdout.write(JSON.stringify(affected) + '\n')` — fine, but the `text` format prints a header and
  bullets, which scripts can't easily parse.
  **Fix:** make `--format` truly switch behavior; `text` should still be parseable (one name per line).

---

## `src/commands/perf.ts`

- **[Medium] Bug — `perf.ts:74-95` (`analyzeDist` has no symlink protection / depth limit)**
  Same as `routes.ts:107-131`. Walking a `dist/` that contains a symlink to `node_modules` will scan
  thousands of files.
  **Fix:** `fs.lstat` and depth bound.

- **[Medium] Bug — `perf.ts:104-137` (First-match-wins budget rule is `f.file.includes(b.match)`)**
  Substring match, not glob. `match: 'main'` matches `main.js` AND `marketing/index.js`.
  **Fix:** use `picomatch` or document substring semantics with a warning.

- **[Medium] Bug — `perf.ts:142-148` (`routeMatches` only supports prefix `*` at the end)**
  No support for `:param` or `**` patterns. The host route table uses `:param` (see runtime), so route
  budgets and the host's actual routes can't share a syntax.
  **Fix:** reuse the `routeFromPageFile` matcher in `routes.ts` (more architecture work).

- **[Low] Performance — `perf.ts:80-93` (Synchronous `await` per file in walker)**
  Sequential `fs.stat` per file is slow on large dists; could parallelize with `Promise.all`.

- **[Low] DX — `perf.ts:332-345` (`top = files.slice(0, 30)` is hardcoded)**
  No `--top <n>` flag.
  **Fix:** add option.

---

## `src/commands/lazy.ts`

- **[High] Bug — `lazy.ts:19-27` (Default suspicious-pattern regex is a global regex reused across files; lastIndex bug partially mitigated)**
  `regex.test(content)` is called in a loop; line 72 resets `lastIndex = 0` AFTER the test, but `regex.test`
  on `g` regex advances `lastIndex` and the **same regex** is reused for the next iteration of the outer
  `for (const p of DEFAULT_SUSPICIOUS_PATTERNS)`. The reset is correct, but a subtle bug if anyone refactors
  to early-return.
  **Fix:** either build new RegExp per iteration, or use `String#includes` for substrings (`remoteEntry.js`
  doesn't need a regex at all).

- **[Medium] Bug — `lazy.ts:23` (Pattern matches **any** dynamic import that contains `/<word>` — too broad)**
  `import('react/jsx-runtime')` and `import('./pages/index.tsx')` both match. Almost every modern bundle
  contains hundreds of dynamic imports, so this triggers thousands of false-positive warnings.
  **Fix:** restrict to known remote names from `mfjs.federation.json` (require workspace context).

- **[Medium] Bug — `lazy.ts:35-54` (Same unbounded walker as perf/routes/image)**
  See category-level finding.

- **[Low] DX — `lazy.ts:104` (`level: 'off'` returns silently — no message)**
  Surprising for users debugging why no output appears.

---

## `src/commands/image.ts`

- **[High] Bug — `image.ts:99-114` (sharp is loaded lazily, but failure is unhandled)**
  `await import('sharp')` will throw if sharp's native binary is missing for the user's platform/node
  version. The error reaches the top-level and is printed by `printCliError` (good), but the message
  "Cannot find module 'sharp'" is opaque — sharp's failure is usually about prebuilt binaries.
  **Fix:** wrap in try/catch with a hint pointing at sharp's install troubleshooting.

- **[Medium] Bug — `image.ts:96` (sharp is in `dependencies` not `optionalDependencies`)**
  Forces every CLI install to download sharp's ~50MB native binary, even for users who never use
  `mfjs image optimize`.
  **Fix:** move to `optionalDependencies` (or `peerDependencies` with a friendly install prompt).

- **[Medium] Bug — `image.ts:55-89` (`planImageOptimizations` doesn't deduplicate)**
  If `--widths 320,320,640` is passed, three jobs are queued for two effective widths.
  **Fix:** dedupe widths after parsing.

- **[Medium] Bug — `image.ts:99-114` (`runImageOptimizations` runs jobs serially)**
  Sharp is heavy; a 100-image dist runs sequentially. Could be 4-8x faster with concurrency.
  **Fix:** `p-limit` or `Promise.all` with batch size.

- **[Low] DX — `image.ts:135-136` (`--format` clashes with `--formats`)**
  `--formats` (plural) selects webp/avif; `--format` (singular) selects table/json output. Easy to typo.
  **Fix:** rename to `--output-format` for the latter.

- **[Low] Bug — `image.ts:149-150` (`--dist` is honored only when set; otherwise computed from `--app`)**
  Logic on `image.ts:159` `path.relative(workspaceDir, path.resolve(opts.dist || 'dist'))` resolves
  `'dist'` against cwd — printing nonsense path when `--app` is set.
  **Fix:** print the actual `distDir` computed in `planImageOptimizations`.

---

## `src/commands/scaffold.ts`

- **[Medium] Bug — `scaffold.ts:42-72` (Generated smoke test bakes the **absolute** workspace path)**
  `JSON.stringify(workspaceDir)` is interpolated into the test source. If the user moves their workspace
  (or commits the test then clones to a different machine), the path is hardcoded and the test fails.
  **Fix:** write `path.join(__dirname, '..', 'apps')` or use `process.cwd()`.

- **[Medium] Bug — `scaffold.ts:26-35` (`runSubcommand` mutates global cwd — same race as `generate.ts`)**
  See generate.ts finding.

- **[Low] DX — `scaffold.ts:106-107` (`number({ ... })` cast to `number` — `@inquirer/prompts` returns
  `number | undefined`)**
  The `as number` assertion silently turns undefined (Ctrl-C) into NaN downstream.
  **Fix:** check for undefined and abort.

- **[Low] DX — `scaffold.ts:165-167` (Final hints recommend `pnpm -C <abspath>`)**
  Absolute path leaks user home directory into copy-pasteable output.
  **Fix:** print `cd <relative>` then commands.

---

## `src/commands/diagnose.ts`

- **[High] Bug — `diagnose.ts:32` (`process.exit(fails > 0 ? 1 : 0)` exits before stdout flushes)**
  Synchronous `process.exit` truncates pending stdout writes (especially on Windows). The summary table can
  be cut off.
  **Fix:** use `process.exitCode = ...` and `return`, or `await` a flush.

- **[Medium] Bug — `diagnose.ts:43-50` (`pnpm --version` failure flow)**
  `execa('pnpm', ['--version'], { reject: false })` returns `{ stdout: '' }` if pnpm not installed instead
  of throwing — but execa **does** throw on ENOENT (`reject: false` only suppresses non-zero exit, not
  spawn failures). The `catch` then reports "not installed".
  **Fix:** unify the empty-stdout and ENOENT paths.

- **[Medium] DX — `diagnose.ts:14-33` (No `--json` output)**
  Diagnostics are essential in CI; structured output is missing.
  **Fix:** add `--format json`.

- **[Medium] Bug — `diagnose.ts:60-68` (`checkWorkspaceConfig` says "not found" only on hard error)**
  `loadWorkspaceConfig` returns `{ cfg: {} }` when no config file exists — the `if (!cfg)` (line 63) is
  always falsy, so users with no config see "OK name=anonymous" rather than a warning.
  **Fix:** the loader should return `{ cfg: null }` for missing.

- **[Low] DX — `diagnose.ts:96-103` (Report uses Unicode `OK ` / `WRN` — fine — but `kleur.dim` for detail can be invisible on dim terminals)**
  Cosmetic.

- **[Low] Architecture — `diagnose.ts:1-104` (Uses `--cwd` while every other command uses `--dir`)**
  Inconsistent — see `index.ts` finding.

---

## `src/commands/deploy.ts`

- **[High] Bug — `deploy.ts:23` (`process.exit(1)` before any output flushes when target invalid)**
  Same flush issue as diagnose. Also the `console.error` line above it goes to stderr and is unbuffered, so
  this one happens to work, but the pattern is wrong.

- **[Medium] Bug — `deploy.ts:52-72, 76-89, 91-105, 108-126` (All scaffold-* helpers hardcode `apps/shell/dist`)**
  Same as ci.ts — assumes host name is `shell`.
  **Fix:** discover host name from `mfjs.app.json`.

- **[Medium] Bug — `deploy.ts:42-49` (`writeIfMissing` skips on existence — no `--force`)**
  Users wanting to re-scaffold after editing must hand-delete the file.
  **Fix:** add `--force` flag.

- **[Medium] Architecture — `deploy.ts:14-38` (Adapter logic baked into the CLI; `plan.md:97` calls for
  `@mfjs/adapter-vercel`/`-cloudflare`/`-node` packages)**
  Per the roadmap, deploy targets should be plugins. Currently they're a switch statement.
  **Fix:** split into `@mfjs/adapter-*` packages and load via the plugin system in `config.ts`.

- **[Low] Bug — `deploy.ts:113` (`pnpm@9.15.5` hardcoded in Dockerfile)**
  Same hardcoded version as `init.ts:50`.
  **Fix:** centralize.

- **[Low] DX — `deploy.ts:41-49` (Logs use `path.relative(process.cwd(), file)` not workspace cwd)**
  When `--cwd <path>` is passed, log paths are relative to the *current* shell, not the target workspace —
  confusing.
  **Fix:** relative to `cwd` (the resolved param).

---

## `src/commands/lint.ts`

- **[High] Bug — `lint.ts:9-10` (`-r lint` does not pass `--fix` correctly)**
  `args = ['-r', 'lint']` then `args.push('--', '--fix')` → final command `pnpm -r lint -- --fix`. pnpm's
  recursive runner needs `pnpm -r --filter ... lint -- --fix` and per-package scripts that forward the
  trailing args — most generated packages have `"lint": "eslint ."` which **does** consume the
  trailing args. But `pnpm -r` runs scripts in topological order; failures in one package don't surface
  cleanly.
  **Fix:** test the actual flow in CI; consider running eslint directly on a glob.

- **[High] Bug — `lint.ts:13-16` (Catch-all uses `process.exit(1)` and prints only "lint failed" — original
  error swallowed)**
  Users see "lint failed" with no way to know whether it's exit 1 from eslint or pnpm itself missing.
  **Fix:** print `err.message` (or use `printCliError`).

- **[Medium] Bug — `lint.ts` (Generated workspace `package.json` doesn't define a `lint` script)**
  `init.ts:51-58` only writes `dev`, `build`, `test`, `typecheck`, `ci:affected`. Running `mfjs lint` in a
  fresh `mfjs init` workspace fails immediately because no package has a `lint` script.
  **Fix:** add `lint` to the init template, or have `mfjs lint` run eslint directly with sensible defaults.

- **[Low] DX — `lint.ts` (No `--cache`, `--max-warnings`, format flags)**
  Bare wrapper; can't be parameterized.

---

## `src/commands/test.ts`

- **[High] Bug — `test.ts:10-13` (Watch path runs `pnpm -r --parallel vitest` which doesn't pass through
  vitest watch flags or filters)**
  `vitest` without `run` defaults to watch mode — fine. But `-r --parallel` runs every package's vitest
  with separate watchers; output is interleaved garbage on most terminals.
  **Fix:** select a single package via `--filter`, or use `vitest`'s monorepo mode.

- **[High] Bug — `test.ts:14-20` (Coverage relies on a `test:coverage` script that the init template
  doesn't generate)**
  Generated apps have only `test: 'vitest run'`. `pnpm -r test:coverage` will fail with "no script
  test:coverage" on every package.
  **Fix:** generate `test:coverage` in init or pass `--coverage` directly to vitest.

- **[Medium] Bug — `test.ts:17-19` (Catch swallows error, exits 1)**
  Same pattern as lint.ts.

- **[Low] DX — `test.ts` (No `--reporter`, `--bail`, file filter)**

---

## `src/commands/env.ts`

- **[Medium] Bug — `env.ts:21-26` (`.env.example` parser splits on `=` and indexes `[0]!`)**
  A line like `URL=https://example.com?key=value` is fine (only first split is used implicitly because we
  take `[0]`); but a line `=value` (empty key) returns `''` and is then included in `vars`, producing a
  bogus "missing env var ''".
  **Fix:** filter empty keys.

- **[Medium] Bug — `env.ts:25` (Doesn't strip quotes or comments)**
  `MFJS_REMOTES_URL # cdn` becomes the var name `MFJS_REMOTES_URL # cdn` (no — actually it splits on `=`
  so the inline comment is kept). Inline-comment support is missing.
  **Fix:** split, then strip trailing `# ...`.

- **[Medium] Bug — `env.ts:26` (`!process.env[v]` treats `''` as missing)**
  An env var explicitly set to empty string fails the check, even when the user wants it empty.
  **Fix:** use `Object.prototype.hasOwnProperty.call(process.env, v)`.

- **[Low] DX — `env.ts:36-57` (`scaffold` writes a fixed list — no merging)**
  If the user already has a partial `.env.example`, `scaffold` does nothing and exits silently.
  **Fix:** merge missing keys.

- **[Low] Architecture — `env.ts:8` (Uses `--cwd` while most commands use `--dir`)**
  Inconsistent.

---

## `src/commands/sw.ts`

- **[High] Bug — `sw.ts:91` (`fs.pathExists(path.dirname(dir))` checks `apps/<app>/` but error says "app not
  found at apps/<app>")**
  `dir = apps/<app>/public`, `path.dirname(dir) = apps/<app>`. Logic is correct but reads as if it were
  checking the public dir.
  **Fix:** clearer name, e.g. `appRoot`.

- **[Medium] Bug — `sw.ts:6-77` (Generated SW caches `'/'` and `'/index.html'` — does not consider host
  basePath / publicPath)**
  If the host is served under `/app/`, the SW caches the wrong shell paths.
  **Fix:** read `cfg.federation.publicPath` and inject.

- **[Medium] Bug — `sw.ts:46-65` (`cacheFirst` puts `res.clone()` to cache without awaiting — race on rapid
  invalidations)**
  `cache.put` returns a promise that's not awaited; rapid reloads can interleave.
  **Fix:** `await cache.put(req, res.clone());`.

- **[Low] DX — `sw.ts:96-99` (Skip message uses `path.relative(cwd, target)` — fine on Linux, backslashes on
  Windows)**

- **[Low] Architecture — `sw.ts:79-105` (Hard-coded constant string template; no way to customize cache name
  or strategy)**

---

## `src/commands/compress.ts`

- **[High] Bug — `compress.ts:85-90` (`gzipSync`/`brotliCompressSync` block the event loop; quality 11 is
  the slowest brotli setting)**
  Same as build.ts compress finding — these are sync calls, no worker thread.
  **Fix:** use `zlib.brotliCompress` async with promisify, run with worker pool.

- **[Medium] Bug — `compress.ts:94-97` (Conditional `writeOpts` from `force === undefined`)**
  `opts.force === undefined ? {} : { force: opts.force }` — TS-only quirk to satisfy
  `exactOptionalPropertyTypes`. Pass `{ force: opts.force ?? false }` directly.

- **[Medium] Bug — `compress.ts:81` (`shouldInclude` matches by `path.extname` but `includeExts` may already
  include the dot or not)**
  `normalizeExt` (line 20) handles this, but `shouldInclude` compares against the raw `includeExts`, not the
  normalized list. Check is consistent only because `compressDist` normalizes first; the helper is exported
  and could be misused.
  **Fix:** make `shouldInclude` always normalize.

- **[Medium] Bug — `compress.ts:108-111` (`deleteOriginal: true` removes original even if write failed)**
  `writeIfNeeded` returns `'skipped'` when target exists; combined with `force: false`, the original is
  removed but no compressed variants are written. Asset is lost.
  **Fix:** only delete when both gz and br were `'written'`.

- **[Low] Bug — `compress.ts:30-43` (Recursive walker, same unbounded-depth and no symlink protection)**

---

## Cross-cutting test coverage gaps (`packages/cli/test/*`)

- **[High] Test — Missing `errors.test.ts`**: no test for `printCliError`, `formatCliError`, the
  `MFJS_DEBUG=1` stack-trace path, or the `process.exitCode` contract. The error pipeline is critical and
  untested.

- **[High] Test — Missing `index.test.ts`**: the `getCliVersion`, direct-invocation heuristic, and root
  `program.parse` path are not exercised. Bin behavior is not smoke-tested.

- **[High] Test — Missing `diagnose.test.ts`, `deploy.test.ts`, `lint.test.ts`, `test.test.ts`,
  `env.test.ts`, `sw.test.ts`, `scaffold.test.ts`**: 7 of 19 commands have zero unit tests.

- **[Medium] Test — `dev.test.ts` exists but `--watch`/restart logic is unproven**: the orphan-process
  scenario (Critical bug at dev.ts:485-525) needs a Windows-aware integration test.

- **[Medium] Test — No cross-platform CI matrix**: every test runs in a single OS lane in this audit's view.
  All the Windows-specific issues (pnpm.cmd shim, fs.watch recursive, signal handling) are uncovered.

- **[Medium] Test — No fuzz/property tests for `toKebab`, `routeFromPageFile`, `scoreRoute`**: pure
  functions with edge cases (Unicode, dynamic segments, catch-alls) — perfect candidates for property
  tests, currently only have happy-path examples.

- **[Medium] Test — `compress.test.ts` exists but does not cover `deleteOriginal` failure case (Medium bug
  at compress.ts:108-111)**.

- **[Low] Test — `init.test.js` and `init.test.ts` both present**: stale `.js` from a previous build should
  be deleted, or it's running twice in the suite.

---

## Missing features per `plan.md` and README

- **[High] Missing — Schema validation for `mfjs.config.json`/`mfjs.config.ts`** (`plan.md:11`).
  The `init` template references `https://mfjs.dev/schemas/mfjs.config.json` which 404s.

- **[High] Missing — `mfjs routes --watch` integration with `mfjs dev`** (`plan.md:104`).
  Routes have a `--watch`, dev has a `--watch`, but they don't share a watcher.

- **[High] Missing — `mfjs deploy` adapter packages** (`plan.md:97`, `186`).
  Currently in-CLI scaffold only; roadmap calls for `@mfjs/adapter-*` published packages.

- **[Medium] Missing — `--dry-run` and `--verbose` are inconsistent across commands** (`plan.md:104`).
  `image optimize` has `--dry-run`; `deploy` has `--dry-run`; nothing else does. No verbose flag exists.

- **[Medium] Missing — `mfjs diagnose` does not validate ports against `lsof`/`net.connect`**
  (`plan.md:11`, "config validation").
  Mentioned in the description ("ports") but not implemented.

- **[Medium] Missing — `mfjs lint`/`test` are bare pnpm wrappers**.
  No autoconfig, no integration with workspace config (e.g. shared `.eslintrc` from
  `mfjs.config.ts`), no test-pattern selection.

- **[Low] Missing — README is out-of-date**: README only documents `init`, `generate`, `dev`, `build`,
  `federation`. The 14 other commands shipped in `index.ts` are undocumented.

---

## Summary

- 16 files audited (`config.ts`, `errors.ts`, `index.ts`, 14 command modules, plus test directory survey).
- **Findings: 95** spanning Critical/High/Medium/Low, across Bug/Architecture/Security/DX/Performance/Maintainability/Cross-platform/Test categories.
- **Critical: 4** (config.ts arbitrary-code execution; generate.ts unescaped template injection;
  dev.ts watch orphan; ssr.ts NODE_PATH internals).
- **High: 32** — most are Windows cross-platform issues, error-swallowing, unbounded walkers,
  and copy-paste of app discovery.
- **Top architectural priorities:** (1) extract a shared `discoverApps` / `executeCommand` /
  `runSubcommand` infrastructure; (2) replace stringified rspack template with real template files;
  (3) ship the JSON schema for `mfjs.config`; (4) replace `spawn` with `execa` everywhere for
  Windows safety; (5) wire `cfg.federation.allowlist` / `sri` / `csp` into actual generation.

---

# `@mfjs/runtime` audit

Scope: `libs/runtime/src/*.{ts,tsx}` — router, route components, hooks, remote loader, error boundaries, prefetch, service worker, islands, shadow DOM, view transitions, telemetry. **110 findings**: 5 Critical / 26 High / 50+ Medium / 20+ Low.

---

## `router.ts`

- **[High] Bug / Race — `router.ts:98`** `queueMicrotask(() => emit())` fires before any subscriber exists; `subs` is empty when it runs. Dead code masking intent. **Fix**: remove (subscribe already calls back synchronously), or only emit when `subs.size > 0`.
- **[High] Bug / Routing — `router.ts:62-66, 78`** `apply()` rejects out-of-base navigations silently — no return code, no warning. Multi-base hosts get silent no-ops. **Fix**: return boolean / throw / fall through to full navigation; add telemetry event.
- **[Medium] Bug / Routing — `router.ts:62-66`** `basePath` not normalized; trailing-slash variants mis-match. **Fix**: strip trailing `/` on entry.
- **[Medium] Bug / SSR — `router.ts:57`** `createRouter` `assertBrowser` throws on server; `usePathname` calls `getRouter()` synchronously during render so SSR crashes. **Fix**: fall back to a no-op router or `createServerRouter` on the server.
- **[Medium] Architecture — `router.ts:126-145`** `attachMfjsNavigateListener` duplicates router behavior; tutorials encourage calling both → double `pushState` per click. **Fix**: make one a strict superset, or no-op when singleton already listens.
- **[Low] Bug — `router.ts:84,140`** Inconsistent `popstate` emission between `createRouter.apply()` and `attachMfjsNavigateListener`. **Fix**: pick one model.
- **[Low] Architecture — `router.ts:8`** `state: any`. Use `unknown`.

## `route-matcher.ts`

- **[Medium] Bug / Routing — `route-matcher.ts:33-36, 41`** Splat capture is NOT URL-decoded but param segments ARE. Inconsistent. **Fix**: decode each splat segment before joining.
- **[Medium] Bug / Routing — `route-matcher.ts:33-36`** `*` in middle of pattern (e.g. `/foo/*/bar`) silently treated as terminal. **Fix**: throw on non-terminal `*`.
- **[Low] Bug — `route-matcher.ts:41`** `decodeURIComponent` can throw `URIError` on malformed input; no try/catch. **Fix**: wrap and fall back to raw segment.
- **[Low] Bug — `route-matcher.ts:64`** Trailing-slash normalization doesn't preserve canonicalization for apps that distinguish `/foo/` vs `/foo`.

## `routes.ts`

- **[Low] Architecture — `routes.ts:17-23`** Linear scan with no priority sort — order-dependent. **Fix**: sort by specificity (exact > param > splat) or document.

## `routing.tsx`

- **[Critical] Bug / Race — `routing.tsx:258-299`** `RemoteOutlet` effect deps are `[remoteKey]` but body reads `resolved` and `remotes` from closure. New `remotes` map with same matched route → stale importer cached. eslint-react-hooks would flag. **Fix**: include `remotes`, `resolved` in deps, or pin via ref.
- **[Critical] Bug / Race — `routing.tsx:283-298`** No abort on rapid navigation. `cancelled` flag only blocks `setState`; the import still resolves and fills cache for routes the user has left. Out-of-order resolutions on flaky network. **Fix**: AbortController + request token; ignore stale promises.
- **[High] Bug / Race — `routing.tsx:259-263`** `RemoteOutlet`: clearing state on no-match doesn't reset `error`. Old error persists across navigation. **Fix**: `setError(null)` on early return.
- **[High] Architecture — `routing.tsx:250`** `RemoteOutlet` cache is per-instance via `useRef`. Two outlets on the same page duplicate import. **Fix**: module-level Map + LRU.
- **[High] Memory leak — `routing.tsx:250, 286`** Cache unbounded — long-lived shells accumulate every remote ever loaded. **Fix**: LRU with configurable max.
- **[High] Bug / Anti-pattern — `routing.tsx:368`** `RemoteApp` does dynamic `await import('./route-matcher.js')` inside the loop on every effect run. **Fix**: hoist static import to top.
- **[High] Bug / Anti-pattern — `routing.tsx:391`** Effect deps include `pages` array reference; new array each parent render → re-mount loop. **Fix**: stable `pages` (document) or hash to dep key.
- **[Medium] Bug / SSR — `routing.tsx:57-59`** `usePathname` initial state calls `router.getPath()` synchronously, throws on SSR. **Fix**: guard with `typeof window === 'undefined'`.
- **[Medium] Bug / Routing — `routing.tsx:133`** `NavLink.cleanTo = to.replace('/*', '')` strips middle `*` patterns wrong; `/a/*/b` → `/a/b`. **Fix**: reject patterns in `to`.
- **[Medium] Bug / Routing — `routing.tsx:135`** `currentPath.startsWith(cleanTo)` highlights `/foo` for `/foobar`. **Fix**: equality OR `+ '/'` boundary.
- **[Medium] Performance — `routing.tsx:144-153`** `defaultStyle` literal each render → child re-renders. **Fix**: `useMemo` / module constant.
- **[Low] Performance — `routing.tsx:256`** `subpath` recomputed when `resolved` is stable.
- **[Low] Architecture — `routing.tsx:209` vs `prefetch.ts:11`** Two parallel APIs: native importer vs `FederationRemote`. Hard to wire together.

## `remote-loader.ts`

- **[Critical] Security — `remote-loader.ts:48-71`** `localStorage` cache stores remote URL metadata in plaintext; same-origin XSS can read it. Cache hit short-circuit also skips telemetry. **Fix**: don't cache identifiers with security implications by default; document.
- **[Critical] Bug / Race — `remote-loader.ts:124-229`** No concurrent-call dedupe in `loadRemoteEntry`. Two parallel callers race; both check `g[name]`, both append `<script>`, double-execution → `container.init` exceptions. **Fix**: `inFlight: Map<string, Promise<void>>`.
- **[High] Bug / Memory leak — `remote-loader.ts:166-179`** Existing-script branch never removes `load`/`error` listeners. **Fix**: `{ once: true }` + symmetric removeEventListener on the other.
- **[High] Bug / Race — `remote-loader.ts:166-179`** If script previously loaded and `g[name]` exists but element still in DOM, existing-branch registers handlers on a script whose load already fired → caller hangs forever (no timeout in this branch). **Fix**: check `g[name]` first; gate via `script.dataset.mfjsLoaded`.
- **[High] Bug / Telemetry — `remote-loader.ts:151-157`** Cache hit returns silently without `emitRemoteLoad` success event → broken dashboards. **Fix**: emit `phase:'success', durationMs:0`.
- **[High] Security — `remote-loader.ts:181-228`** `script.src = remote.entryUrl` blindly trusts any URL. Combined with `RemoteRegistry.load(manifestUrl)` which has no signature/origin check → compromised manifest server injects arbitrary remotes. **Fix**: `allowedOrigins: string[]` option; verify `new URL(entryUrl).origin`; SRI integrity attribute support.
- **[Medium] Security — `remote-loader.ts:182-188`** Missing `script.crossOrigin = 'anonymous'` and `script.integrity`. Cross-origin error reports become opaque. **Fix**: set crossOrigin by default, pass through integrity.
- **[Medium] Bug — `remote-loader.ts:239-245`** `safeInit`'s blanket catch swallows all errors, not just "already initialized". Genuine share-scope mismatches go undetected. **Fix**: inspect error message; only swallow known cases.
- **[Medium] Architecture — `remote-loader.ts:110`** `Function("return this")()` triggers CSP `unsafe-eval`. **Fix**: drop the `Function` fallback.
- **[Low] Bug — `remote-loader.ts:281-297`** `withTimeout` race window: setTimeout callback can fire after Promise.race resolved. **Fix**: sentinel boolean to ignore late timeout.

## `prefetch.ts`

- **[High] Memory leak — `prefetch.ts:5`** Module-level `prefetched: Set<string>` never reset, never bounded. **Fix**: max size cap or auto-evict.
- **[Medium] Bug — `prefetch.ts:30-34, 41-51`** On error, key removed but `<link rel="prefetch">` stays in DOM. **Fix**: also remove the link element on catch.
- **[Low] Bug — `prefetch.ts:49`** `crossOrigin = 'anonymous'` set unconditionally; same-origin without CORS headers can cause double-fetch.
- **[Low] Performance — `prefetch.ts:53-57`** djb2 hash collisions could skip legitimate prefetches.

## `error-boundary.tsx` & `error-boundary-utils.tsx`

- **[High] Bug — `error-boundary.tsx:25-50`** No `componentDidCatch` → no telemetry, no logging, no `MFJS_ERROR_EVENT` emission. Observability blind. **Fix**: implement `componentDidCatch(error, info)` + `emitError`.
- **[Medium] UX — `error-boundary.tsx:36-46`** Default fallback has no retry/reset button. **Fix**: render button calling `reset`.
- **[Low] Architecture — `error-boundary-utils.tsx:45`** `<Component {...(props as any)} />` discards type safety.

## `hooks.ts`

- **[Medium] Bug / Hook rules — `hooks.ts:35-43`** `useQueryParam` setter identity changes whenever URL updates → memoizing children re-render every time. **Fix**: stash latest `params` in a ref.
- **[Medium] Bug / SSR — `hooks.ts:17-18`** `useSearchParams` setter calls `window.location` directly without SSR guard.
- **[Low] Bug — `hooks.ts:59-70`** `useNavigate.opts.state` typed only as `unknown`.

## `nested-routes.tsx`

- **[High] Bug / Anti-pattern — `nested-routes.tsx:49-58`** `RouteNode` lazy load: no error catch (failed import → `El = null` blank); thrashes when parent re-creates route objects. **Fix**: catch + surface to ErrorBoundary; consider `React.lazy`.
- **[Medium] Bug / Routing — `nested-routes.tsx:117-123`** Backtracking pop incorrect when index route inside children — parent without matching child still has valid Outlet, but `walk` pops anyway.
- **[Medium] Bug — `nested-routes.tsx:135-143`** `computeConsumed` drops splat segments → `stripPrefix` math may double-count.
- **[Low] Bug — `nested-routes.tsx:31`** Index-route param merge depends on parent context spread; works currently but undocumented.

## `navigation-events.ts`

- **[Medium] Bug — `navigation-events.ts:22, 39-45`** First nav's `from` may equal `to` (nothing fires). Edge case.
- **[Medium] Bug — `navigation-events.ts:24-32`** `from` reads `window.location.pathname` AFTER navigation may have happened — depends on listener registration order. Race-on-listener-order. **Fix**: snapshot path at start of `apply()`; include in event detail.

## `remote-registry.ts`

- **[High] Security — `remote-registry.ts:45-54`** `load(manifestUrl)` blindly trusts JSON with optional `validate` hook only. **Fix**: default `validate` enforcing origin allowlist; manifest-level SRI.
- **[Medium] Bug — `remote-registry.ts:52`** `load()` calls `register()` per item → N change events. Should batch.
- **[Low] Bug — `remote-registry.ts:33-35`** No `unregister` event hook.

## `use-remote-data.ts`

- **[High] Bug — `use-remote-data.ts:32-36, 44-48`** Errors are cached for the full TTL → every render re-throws same error; manual retry impossible. **Fix**: don't cache errors, or short error TTL; auto-evict on observed throw.
- **[High] Bug — `use-remote-data.ts:38-50`** Cache write race: `globalCache.get(key)` inside `then` can return a different entry than the one created. **Fix**: capture entry by reference; mutate that reference.
- **[High] Memory leak — `use-remote-data.ts:11`** `globalCache` unbounded. **Fix**: LRU.
- **[Medium] Bug — `use-remote-data.ts:35`** `dedupe: false` → thundering herd within same render cycle. **Fix**: implement true non-dedupe or drop the option.
- **[Medium] SSR — `use-remote-data.ts:11, 30`** Process-wide global cache bleeds across SSR requests. **Fix**: scope per request via context.
- **[Low] Architecture — `use-remote-data.ts:73`** `void React;` is dead code.

## `concurrent-preload.ts`

- **[High] Bug — `concurrent-preload.ts:75-92`** `withIdle` recursion creates new closures with no cap; under load can starve indefinitely; rIC `timeout: 2000` defeated by re-deferral cycle. **Fix**: backoff/cap; honor timeout.
- **[Medium] Bug — `concurrent-preload.ts:69`** Worker count `min(concurrency, remotes.length)` + per-worker `withIdle` causes independent rIC waits → suboptimal.
- **[Medium] Bug — `concurrent-preload.ts:50-56` vs `remote-loader.ts:222-225`** Duplicate `phase:'error'` telemetry. **Fix**: don't double-emit.

## `service-worker.ts`

- **[High] Bug / Architecture — `service-worker.ts:61-138`** SW lives as a string template literal — every regex needs `\\` double-escape, no static analysis, no tests on actual behavior. **Fix**: emit a real `.js` file at build time.
- **[Medium] Bug — `service-worker.ts:62`** Cache name `'mfjs-v1'` constant — never bumps on deploy → stale forever. **Fix**: inject build hash.
- **[Medium] Bug — `service-worker.ts:129-136`** `staleWhileRevalidate` doesn't notify clients on background update. **Fix**: `clients.postMessage` invalidation.
- **[Medium] Bug — `service-worker.ts:124-126`** `networkFirst` HTML fallback returns `cache.match('/')` which may be undefined offline → chrome error page.
- **[Medium] Bug — `service-worker.ts:43`** `navigator.serviceWorker.ready` resolves on ANY active SW — may not be ours.
- **[Medium] Bug — `service-worker.ts:37`** `installing.postMessage(SKIP_WAITING)` should be `reg.waiting?.postMessage`.
- **[Low] Architecture — `service-worker.ts:16-50`** No `controllerchange` reload listener.

## `shadow-remote.tsx`

- **[Critical] Bug / Memory leak — `shadow-remote.tsx:27-60`** Mount effect doesn't remove appended `mountRef.current` from shadow DOM on cleanup, doesn't null `mountRef.current` → next run creates a second root on the same node. **Fix**: cleanup nulls + removes.
- **[High] Bug — `shadow-remote.tsx:39-53`** `<style>`/`<link>` appended on every effect run → duplicates. **Fix**: track inserted nodes; cleanup; idempotent insertion.
- **[High] Bug / Hook order — `shadow-remote.tsx:62-65`** Render effect runs `rootRef.current?.render` but root is created in a different effect; first children render can be missed depending on effect ordering. **Fix**: render inside the mount effect on creation.
- **[Medium] Bug — `shadow-remote.tsx:55`** StrictMode double-mount creates two roots on same DOM node → console warnings.
- **[Medium] Architecture — `shadow-remote.tsx:70-89`** `scopeCss` is a naive string parser — breaks on `}` inside strings, `@media` blocks. **Fix**: PostCSS or document limits.

## `islands.tsx`

- **[High] Bug / Memory leak — `islands.tsx:93-106`** `interactionEvents` defaults to a new array literal each render → effect re-runs and re-registers handlers. **Fix**: stable default via `useMemo` / module constant.
- **[High] Bug — `islands.tsx:45-47`** `load().then` has no `.catch` → failed loads silently leave `Component=null` showing fallback forever. **Fix**: catch + propagate.
- **[Medium] Bug — `islands.tsx:113`** Effect deps include non-primitive `interactionEvents`, `visibleOptions` — re-trigger every render.
- **[Low] Architecture — `islands.tsx:122-126`** `clientBoundary` mutates imported component with `__mfjsClient` — fragile under MF / frozen modules.

## `version-check.ts`

- **[Medium] Bug — `version-check.ts:37-41`** `majorMatches` only compares major. For `0.x` semver every minor is breaking → false positives. **Fix**: when major === '0', also compare minor.
- **[Low] Bug — `version-check.ts:38`** Range syntax (`>=18.0.0`, `18.x`) not handled.
- **[Low] Bug — `version-check.ts:24-32`** Missing host versions skipped silently.

## `view-transitions.ts`

- **[Medium] Bug — `view-transitions.ts:42-43`** Polyfill path returns Promise correctly — OK.
- **[Low] Bug — `view-transitions.ts:47`** `handle.finished.catch(() => undefined)` swallows transition errors silently.

## `remote-pages.ts`

- **[Medium] Architecture — `remote-pages.ts:39-44` vs `route-matcher.ts:54-66`** Duplicates `normalize`. Future fixes won't apply to both. **Fix**: re-export from `route-matcher`.
- **[Low] Architecture — `remote-pages.ts:11`** `Component: any`.

## `dev-reload-client.ts`

- **[Medium] Bug / Memory leak — `dev-reload-client.ts:55-58`** Reconnect loop: 1s fixed retry forever, no cap, no backoff. **Fix**: exponential backoff with max.
- **[Medium] Bug — `dev-reload-client.ts:62-71`** `stop()` doesn't `removeEventListener` on `ws`. Mostly OK due to guard but listener leak.
- **[Low] Bug — `dev-reload-client.ts:49-53`** No origin check on incoming WS messages — if `__MFJS_DEV_RELOAD_URL__` is attacker-controlled, malicious messages could trigger `location.reload`.

## `server-router.ts`

- **[Critical] Bug / SSR — `server-router.ts:67-87`** Process-level `_serverRouter` singleton bleeds across concurrent SSR requests. Doc-comment warns but `getServerRouter` is exported normally. **Fix**: remove singleton or hide behind `_internal`; use AsyncLocalStorage / per-request context.
- **[Medium] Bug — `server-router.ts:84-87`** `setServerPath` swaps router but old subscribers from previous request silently disconnect.
- **[Low] Bug — `server-router.ts:39`** `_opts` parameter unused.

## `federated-router.ts`

- **[Medium] Bug — `federated-router.ts:24-26`** No public unset; HMR / re-bootstrap can't replace the provider cleanly.
- **[Medium] Architecture — `federated-router.ts:17`** Singleton across MF boundaries depends on shared scope being singleton. If `@mfjs/runtime` is not registered as singleton, host and remote get separate `_hostRouter` modules and the bridge silently fails. **Fix**: document; runtime check via global symbol fallback.
- **[Low] Bug — `federated-router.ts:24`** No type guard on injected router.

## `guards.ts`

- **[Medium] Bug / Race — `guards.ts:17-36`** `runGuards` is exported but never wired into `RemoteOutlet`'s render path. Dead code or missing integration. Async guards on rapid nav can resolve out of order. **Fix**: wire into `RemoteOutlet`; abort on superseded navigation.
- **[Low] Bug — `guards.ts:55`** `createRoleGuard` requires ALL roles — no "any" mode.

## `telemetry.ts` / cross-cutting

- **[Medium] Architecture — `telemetry.ts:1-2`** Global `window` event bus with no namespacing — two MFJS instances cross-talk.
- **[Low] Bug — `telemetry.ts:18-21`** Telemetry no-op on SSR — data lost.

## Cross-cutting / Architecture (runtime)

- **[High] Architecture** Two routing models: `RemoteOutlet` + `RouteTarget` and `NestedRouter` + `NestedRoute` — different match algorithms, different param-merging, different lazy loading. **Fix**: unify around nested model with `RouteTarget` as a leaf.
- **[Medium] Architecture** `index.ts` does `export *` — namespace pollution; `Router` type exported from both `router.ts` and `server-router.ts`.
- **[Medium] Architecture** No central `MfjsError` type with code/category — every module returns string `message` or `unknown`.
- **[Medium] Architecture** No `AbortSignal` threading through `loadRemoteEntry`, `useRemoteData`, `prefetch` → no cancellation primitive.
- **[Low] Maintainability** Inconsistent fallback markup (`<p>` / `<span>` / `<pre>`) and hard-coded English strings — no i18n hook.
- **[Low] Maintainability** Telemetry phases as string literals (typo-prone). **Fix**: shared const enum.

## Top runtime priorities (fix order)

1. **`remote-loader.ts:124-229`** — dedupe `loadRemoteEntry`, drop eval-style `getGlobal`, fix listener leaks, narrow `safeInit` swallowing.
2. **`routing.tsx:233-319`** — abort in-flight imports on nav, fix effect deps, move cache module-level + LRU, reset `error` on no-match.
3. **`use-remote-data.ts:11-52`** — bound cache, evict on error, fix mutate-while-replaced.
4. **`shadow-remote.tsx:27-65`** — single mount/render effect; cleanup duplicate styles.
5. **`server-router.ts:67-87`** — remove process singleton or hide behind `_internal`.
6. **`remote-loader.ts:48-71` + `remote-registry.ts:45-54`** — origin allowlist + integrity (SRI) for runtime URL trust.
7. **`error-boundary.tsx`** — implement `componentDidCatch` + emit telemetry.
8. **`route-matcher.ts:33-36`** — decode splat; error on non-terminal `*`.
9. **`guards.ts`** — wire into render path; orphaned exports today.
10. **`service-worker.ts`** — emit as real file from build, not string template.

---


# MFJS SSR + Deploy Adapters Audit

Scope: `libs/ssr`, `libs/adapter-cloudflare`, `libs/adapter-node`, `libs/adapter-vercel`, `libs/security`, `libs/observability`, `libs/rspack-route-assets`.

Severity legend: Critical / High / Medium / Low. Categories: Bug / Architecture / Security / Performance / Maintainability.

---

## libs/ssr/src/edge-adapter.ts

### 1. Redirect catch only fires when render throws synchronously; `renderRouteToString` swallows errors
- Severity: **Critical**
- File: `libs/ssr/src/edge-adapter.ts:45-56`, `libs/ssr/src/render-to-string.ts:31-43`
- Category: Bug / Architecture
- Problem:
  ```ts
  // render-to-string.ts
  try { ... } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { html: `<p data-ssr-error>${error.message}</p>`, statusCode: 500, error };
  }
  ```
  `renderRouteToString` catches *every* exception including `SsrRedirect` and turns it into a 500 with `error.message` HTML‑escaped... actually NOT escaped (`${error.message}` is interpolated raw — see issue #2). The edge adapter then runs:
  ```ts
  try { result = await renderRouteToString(...); } catch (err) { if (isRedirect(err)) ... }
  ```
  But the catch block in `renderRouteToString` already swallowed the `SsrRedirect`, so `isRedirect` is unreachable. The redirect helper is effectively broken in the edge path.
- Fix: In `renderRouteToString` re‑throw `SsrRedirect` (and any other "control‑flow" errors) before mapping to 500. Or have the adapter call `createElement` + `renderToStaticMarkup` directly so the redirect propagates.

### 2. Unescaped error message creates reflected XSS in 500 page
- Severity: **High**
- File: `libs/ssr/src/render-to-string.ts:41`
- Category: Security (XSS)
- Problem: `<p data-ssr-error>${error.message}</p>` — `error.message` may contain `<script>` if the error originates from user data (e.g. `new Error(req.query.foo)` deep in the tree, or a thrown serialized payload). The message is injected into HTML without escaping.
- Fix: Use the `escapeHtml` helper from `@mfjs/security/sanitize` or the local one in `edge-adapter.ts`.

### 3. Same XSS issue exists in `remote-ssr.ts`
- Severity: **High**
- File: `libs/ssr/src/remote-ssr.ts:106-107, 117`
- Category: Security (XSS)
- Problem: Both the fallback HTML (`data-specifier="${options.specifier}"`) and the error HTML (`<p data-ssr-error data-specifier="${options.specifier}">${error.message}</p>`) interpolate raw strings into attributes and content. `specifier` and `remoteName` (line 159) are user‑controlled.
- Fix: HTML‑escape every interpolated value. Reuse `escapeHtml` from `@mfjs/security`.

### 4. Edge adapter does not set `Vary` header
- Severity: **Medium**
- File: `libs/ssr/src/edge-adapter.ts:59-78`
- Category: Bug / Performance
- Problem: When CSP nonces, cookies, or `Accept-Encoding` influence the rendered output, missing `Vary` lets shared caches serve a response with the wrong nonce / wrong locale / wrong gzip encoding to subsequent users. With `etag: true` the response is cacheable on edges but lacks `Vary: Accept-Encoding` (or `Vary: Cookie` when auth is involved).
- Fix: Add `Vary` automatically (`Accept-Encoding` always; `Cookie` when state hydration uses a session). Allow overriding via options.

### 5. Cache‑Control silently dropped for 5xx responses but still applied to 4xx
- Severity: **Medium**
- File: `libs/ssr/src/edge-adapter.ts:67-70`
- Category: Bug
- Problem: `if (cacheOpts && result.statusCode < 500)` — but `renderRouteToString` only ever returns 200 or 500, never 4xx, and the not‑found path bypasses this branch entirely (404 `defaultNotFound` has no `cache-control`). Consequently 404 responses are uncacheable. CDNs will hammer the origin on misses for non‑existent paths. Conversely if a future `renderRouteToString` returns 404, the current code would cache it as success.
- Fix: Centralize cache logic so 4xx/404 can be cached briefly (e.g. `s-maxage=60`); use `< 400` as the success threshold; handle 404 explicitly.

### 6. ETag uses DJB2 — high collision rate, weak ETag mismatched semantics
- Severity: **Medium**
- File: `libs/ssr/src/cache-headers.ts:35-41`
- Category: Bug / Performance
- Problem: 32‑bit DJB2 + length suffix has ~1 in 4B collision probability, and worse on similar HTML. While prefixed `W/`, the implementation also iterates the entire `body` per request — wasteful. CDN diff can serve stale content on collision.
- Fix: Use a real hash (xxhash, SHA‑1, FNV‑64). For Workers, use `crypto.subtle.digest` (async). For Node, `crypto.createHash`. Cache the etag alongside the rendered HTML.

### 7. ETag check happens AFTER full render
- Severity: **High**
- File: `libs/ssr/src/edge-adapter.ts:72-77`
- Category: Performance
- Problem: The handler renders the full page, then checks `If-None-Match`. The whole point of ETags is to skip work on 304s. As written, the request still pays the full SSR cost.
- Fix: Cache the rendered HTML keyed by `(method, pathname, accept-language, cookies-affecting-render)` and check the etag against the cached entry first.

### 8. `request.headers?.['if-none-match']` won't match real headers
- Severity: **High**
- File: `libs/ssr/src/edge-adapter.ts:75`
- Category: Bug
- Problem: `EdgeRequest.headers` is typed as `Record<string, string>`. Cloudflare/Vercel adapters call `Object.fromEntries(request.headers)` which returns header names lower‑cased on Workers but with the original casing in some runtimes. Even when lowercased, *`Object.fromEntries`* drops duplicate headers (e.g., multiple `Set-Cookie`), and `If-None-Match` may arrive as `If-None-Match` (capital). Using `request.headers['if-none-match']` will miss it.
- Fix: Normalize header keys to lower case on entry, or wrap in a small `Headers`-like accessor.

### 9. `defaultNotFound` returns the full `template` shell with 404 markup re‑injected — but the not‑found also bypasses CSP/extra/cache headers added later
- Severity: **Medium**
- File: `libs/ssr/src/edge-adapter.ts:88-99`
- Category: Architecture
- Problem: 404 path skips `csp`, `etag`, `cacheOpts`, and `x-mfjs-ssr` markers. Inconsistent header surface between found and not‑found responses.
- Fix: Funnel both code paths through one response builder.

### 10. `extraHeaders` and `csp` casing collisions silently overwrite
- Severity: **Low**
- File: `libs/ssr/src/edge-adapter.ts:60-65`
- Category: Bug
- Problem: `responseHeaders` is built with lowercase keys, but `extraHeaders` may contain mixed‑case (e.g. `'Content-Security-Policy'`). `Object.assign` produces two distinct keys; `new Response(..., { headers })` then doubles them.
- Fix: Lower‑case all keys when merging.

---

## libs/ssr/src/render-to-string.ts

### 11. Function is `async` but `renderToStaticMarkup` is sync — name implies async work
- Severity: **Low**
- File: `libs/ssr/src/render-to-string.ts:31-43`
- Category: Architecture / Maintainability
- Problem: There is no async work inside; the `async` is only to allow callers to `await`. That hides the fact that React 18 hooks like `Suspense`/`use()` cannot resolve here — there is no streaming/async rendering. Callers may believe they get full data‑loading.
- Fix: Either keep sync (return non‑Promise) and document, or switch to `renderToString` (which still doesn't suspend) — or pivot to `renderToReadableStream` and consume.

### 12. `renderToStaticMarkup` strips React markers — output cannot hydrate
- Severity: **High**
- File: `libs/ssr/src/render-to-string.ts:37`
- Category: Bug
- Problem: `renderToStaticMarkup` is intentionally non‑hydratable (no `data-reactroot`, no comment markers). The edge adapter and static export hand the HTML to the browser; if the client `hydrateRoot`s into `<div id="root">…</div>` it will re‑render mismatching DOM, throwing hydration errors. The doc comment claims "no hydration mismatch" but the *opposite* is true — `renderToStaticMarkup` causes a guaranteed mismatch with `hydrateRoot`.
- Fix: Use `renderToString` for hydratable output; reserve `renderToStaticMarkup` for emails/static documents only.

### 13. `injectIntoTemplate` only replaces the FIRST occurrence
- Severity: **Low**
- File: `libs/ssr/src/render-to-string.ts:63`
- Category: Bug
- Problem: `template.replace('<!--ssr-outlet-->', html)` — if the placeholder appears twice, only the first is filled; secondary occurrences leak the literal comment to the client. Replacing all with `replaceAll` is safer.
- Fix: Use `template.replaceAll('<!--ssr-outlet-->', html)` or document single‑occurrence requirement.

### 14. Template HTML is split — large templates re‑allocate on every request
- Severity: **Low**
- File: `libs/ssr/src/render-to-string.ts:55-64`
- Category: Performance
- Problem: For SSR streams the template is split once into `head` + `tail` and reused. Here we re‑run `String.includes` + `String.replace` on every request.
- Fix: At adapter‑creation time, split the template into two halves and concatenate, avoiding scanning the whole shell per request.

---

## libs/ssr/src/render-to-stream.ts

### 15. Stream race: `pipe(passThrough)` happens after a microtask, can lose data
- Severity: **High**
- File: `libs/ssr/src/render-to-stream.ts:93-95`
- Category: Bug
- Problem:
  ```ts
  const { pipe } = renderToPipeableStream(element, { onShellReady() { resolveShell(); }, ... });
  shellReady.then(() => pipe(passThrough)).catch(() => {});
  ```
  React begins emitting bytes synchronously inside `onShellReady`. By scheduling `pipe(passThrough)` on a `.then()` microtask, React may have already buffered chunks but the writable target attaches one tick later. While Node `Readable` typically buffers, with backpressure or `autoDestroy` this can lose the shell. Even when it works, you've delayed first‑byte by a tick.
- Fix: Pipe synchronously inside `onShellReady`: `onShellReady() { pipe(passThrough); resolveShell(); }`.

### 16. `pipe()` can be called twice — once internally, once by consumer (.pipe handle returned)
- Severity: **High**
- File: `libs/ssr/src/render-to-stream.ts:97-100`
- Category: Bug
- Problem: `passThrough` is piped to `destination` in the returned `pipe` method, but consumers might call it before `shellReady`. The Node `PassThrough` would buffer fine, but the pattern is confusing — and if a consumer calls `pipe(res)` twice (e.g., on retry) the second pipe will fail because the first end already disconnected.
- Fix: Have `renderRouteToStream` accept the destination directly, or expose the underlying `Readable` and document one‑shot consumption.

### 17. `onError` (deferred Suspense errors) only logs to console — not surfaced to caller
- Severity: **High**
- File: `libs/ssr/src/render-to-stream.ts:86-89`
- Category: Bug / Observability
- Problem: Errors inside Suspense boundaries that happen *after* shell flush are silently `console.error`'d. They are not reported via `@mfjs/observability/reportError`, not appended to `error` in the result, and `allReady` resolves even if some boundaries errored. Production debugging will be blind.
- Fix: Emit via `reportError({ source: 'ssr', error })`. Optionally collect into an `errors: Error[]` array on the result.

### 18. `statusCode` getter on shell error is not propagated to first response unless caller awaits `shellReady`
- Severity: **Medium**
- File: `libs/ssr/src/render-to-stream.ts:52, 76-82, 102-105`
- Category: Bug / Architecture
- Problem: `statusCode` flips to 500 on shell error, but consumers commonly do `res.statusCode = stream.statusCode; pipe(res)` immediately after creating the stream — the shell hasn't been flushed yet so they read `200`. This produces 200 OK with broken HTML.
- Fix: Document strictly that callers must `await stream.shellReady` before setting status. Or expose `await renderRouteToStream(...)` that resolves only after shell readiness.

### 19. `collectStream` decoded as utf8 string from `Buffer.concat` — wastes memory and double‑copies
- Severity: **Low**
- File: `libs/ssr/src/render-to-stream.ts:115-122`
- Category: Performance
- Problem: For fully‑collected use, consider `node:stream/consumers` `text()` (Node ≥16.7) which is more efficient and handles chunk types correctly (the cast `chunk as Buffer` is brittle if `passThrough` is in objectMode somewhere upstream).
- Fix: `import { text } from 'node:stream/consumers'; return text(stream);`

### 20. No timeout, no abort signal
- Severity: **Medium**
- File: `libs/ssr/src/render-to-stream.ts` (entire file)
- Category: Architecture / Performance
- Problem: A misbehaving Suspense boundary that never resolves will hold the response open indefinitely — connection leak. There is no `AbortSignal`, no max wait for `allReady`, no `onShellReady` timer.
- Fix: Add `signal?: AbortSignal` and `shellTimeoutMs?: number` options. On timeout, call `stream.abort()`.

---

## libs/ssr/src/static-export.ts

### 21. Sequential renders defeat parallelism on large sites
- Severity: **Medium**
- File: `libs/ssr/src/static-export.ts:53-65`
- Category: Performance
- Problem: `for (const route of routes) { const result = await renderRouteToString(...) ... await writeFile(...) }`. 1000 routes render serially.
- Fix: Use `pMap` / `Promise.all` with a small concurrency cap (CPU count). Be careful: parallel React renders inside the same module load globals are NOT thread‑safe when async data fetching mutates module state — but `renderToStaticMarkup` itself is fine.

### 22. `pathToFile` produces identical paths for `/foo` and `/foo/`
- Severity: **Low**
- File: `libs/ssr/src/static-export.ts:35-39`
- Category: Bug
- Problem: Both produce `foo/index.html`, fine — but `/` also normalizes to `index.html`. Routes with trailing slashes vs. not are conflated; if both forms appear in the routes array, the second write silently overwrites the first.
- Fix: Detect duplicates and warn/throw. Optionally output `foo.html` for non‑dir routes.

### 23. Windows path separator collision in `pathToFile`
- Severity: **High** (Windows only)
- File: `libs/ssr/src/static-export.ts:35-39, 56-63`
- Category: Bug
- Problem: `pathToFile` returns `dashboard/settings/index.html` (POSIX). `join(outDir, file)` then resolves correctly on Windows. BUT `pages.push({ file, content })` returns a POSIX path to consumers. Consumers passing this back into `path.resolve` on Windows get `C:\out\dashboard/settings/index.html` — works for `fs` calls but breaks downstream consumers that compare paths or upload to S3/GCS keyed on POSIX path. Mostly harmless, but inconsistent.
- Fix: Document `file` as a POSIX URL‑style path, or normalize per‑platform.

### 24. No path traversal guard on `route.path`
- Severity: **High**
- File: `libs/ssr/src/static-export.ts:35-63`
- Category: Security
- Problem: `pathToFile('/../../etc/passwd')` produces `../../etc/passwd/index.html`. `join(outDir, ...)` then escapes `outDir` and writes outside. Routes are usually code‑provided, but if any are user‑authored (CMS routes), this is RCE/disk‑write.
- Fix: After `join`, assert `path.resolve(outPath).startsWith(path.resolve(outDir))`. Reuse `isSafePathname` from `@mfjs/security/sanitize`.

### 25. `pathToFile` mishandles query/hash and dynamic params
- Severity: **Low**
- File: `libs/ssr/src/static-export.ts:35`
- Category: Bug
- Problem: `urlPath.replace(/^\//, '').replace(/\/$/, '')` does not strip `?query` or `#hash`. A route with `path: '/blog?draft=1'` writes `blog?draft=1/index.html` — illegal on Windows (FAT/NTFS reject `?`).
- Fix: Strip query/hash via the existing `normalizePath` (currently file‑private to `route-utils.ts` — hoist it).

### 26. Static export does not propagate render errors
- Severity: **Medium**
- File: `libs/ssr/src/static-export.ts:53-65`
- Category: Bug / Architecture
- Problem: `result.statusCode === 500` and `result.error` are silently written to disk. The export "succeeds" and the user ships error pages.
- Fix: Aggregate failures and return them, or `throw` with `{ failed: [{route, error}] }`.

### 27. No content fingerprinting / overwrite check
- Severity: **Low**
- File: `libs/ssr/src/static-export.ts:60-63`
- Category: Performance
- Problem: Re‑exporting a 100k route site rewrites every file, busting any rsync/CDN diff cache.
- Fix: Hash content, skip writes when unchanged.

---

## libs/ssr/src/route-utils.ts

### 28. `normalizePath` runs twice per match call
- Severity: **Low**
- File: `libs/ssr/src/route-utils.ts:27, 41-42`
- Category: Performance / Maintainability
- Problem: `matchRoutePath` normalizes `pathname`, then `matchPattern` normalizes both pattern and pathname AGAIN. With 1000 routes this is 1000 redundant `indexOf`/`slice` calls per request.
- Fix: Normalize once at the call site; cache pre‑split pattern segments at adapter creation.

### 29. Splat `*` only matches at end of pattern; mid‑pattern `*` silently swallows everything
- Severity: **Medium**
- File: `libs/ssr/src/route-utils.ts:58-61`
- Category: Bug
- Problem: `if (ps === '*') { params['*'] = uSegs.slice(j).join('/'); return params; }` — works for `/blog/*`, but `/blog/*/comments` would never match `/blog/foo/comments` because the splat returns immediately. There's no validation that `*` is the last segment.
- Fix: Throw on construction if `*` is not terminal, or implement greedy/non‑greedy correctly.

### 30. First‑match wins — order of `routes` array matters
- Severity: **Low**
- File: `libs/ssr/src/route-utils.ts:29-34`
- Category: Architecture
- Problem: `/users/:id` declared before `/users/me` will match `/users/me` and bind `id="me"`. No specificity scoring.
- Fix: Document, or sort static segments before dynamic.

### 31. `decodeURIComponent` can throw on malformed URI
- Severity: **Medium**
- File: `libs/ssr/src/route-utils.ts:66`
- Category: Bug
- Problem: `decodeURIComponent('%E0%A4%A')` throws `URIError`. The match call is not wrapped — a single bad request crashes the handler.
- Fix: `try { decodeURIComponent(us); } catch { return null; }` (treat as non‑match) or `safeDecode`.

### 32. Splat captured value is not URL‑decoded
- Severity: **Low**
- File: `libs/ssr/src/route-utils.ts:59`
- Category: Bug
- Problem: Param segments are decoded; splat capture is not. Inconsistent — consumer must decode themselves but won't expect it given the param behavior.
- Fix: Decode each segment before joining.

---

## libs/ssr/src/state-hydration.ts

### 33. Forbidden `</script>` sequence not escaped — XSS via state injection
- Severity: **Critical**
- File: `libs/ssr/src/state-hydration.ts:4-12`
- Category: Security (XSS)
- Problem: `safeJson` escapes `<` and `>` individually but not the literal sequence `</script>` *that JSON.stringify can produce* — wait, `<` is escaped to `<`, so `</script>` becomes `</script>`. This DOES neutralize the `</script>` attack. **However:** the `<` regex only catches the LT char; an attacker who can land the byte `\x3c` directly via JSON's `<` would already have to come through `JSON.stringify`, which always emits raw `<` for that codepoint — so this part is OK. ✓
  
  The real bug: the `nonce` attribute uses a raw `value.replace(/"/g, '&quot;')`. If nonce contains `>` (it normally won't, since `generateNonce` is base64) the surrounding `<script…>` tag is fine. But if a caller passes a nonce containing a single quote / backtick / control char, it lands in the `nonce="…"` attribute unescaped beyond `"`. Not exploitable today but fragile.
- Fix: Validate nonce against `/^[A-Za-z0-9+/=_-]+$/` and throw on mismatch (CSP nonces must be base64url anyway).

### 34. Persisting hydrated state in `window` keeps it in DevTools/extensions
- Severity: **Low**
- File: `libs/ssr/src/state-hydration.ts:21-40`
- Category: Security / Privacy
- Problem: Server state survives until `clearHydratedState()` is called. PII (user object, tokens) is reachable by browser extensions.
- Fix: Recommend a single `consumeHydratedState()` that clears immediately. Document.

### 35. JSON.stringify default behavior loses `undefined`, `Date`, `BigInt`, `Map`, `Set`
- Severity: **Medium**
- File: `libs/ssr/src/state-hydration.ts:4`
- Category: Bug
- Problem: A common gotcha. `serializeState({ user: { createdAt: new Date() }})` → `"createdAt":"2024-...Z"` (string) on server but the client expects `Date`. Hydration mismatch in components that use `instanceof Date`.
- Fix: Document explicitly. Optionally accept a `replacer` and provide a `superjson`‑style helper.

### 36. `Buffer.from` in `csp.ts` may be missing in Workers
- Severity: **High**
- File: `libs/security/src/csp.ts:116`
- Category: Bug (cross-runtime)
- Problem: `generateNonce` returns `Buffer.from(arr).toString('base64')`. Cloudflare Workers and the browser do not have `Buffer`. `generateNonce` is needed at request time on the edge to derive a per‑request nonce. This will crash on the very first request.
- Fix: Use `btoa` (browser/Workers) or `globalThis.Buffer ?? base64encodeFromBytes(arr)` polyfill. Or expose as `(opts.encoder)`.

---

## libs/ssr/src/preload.ts

### 37. `escape()` only escapes `"` — query strings or hashes containing `<` or `>` break out of the attribute
- Severity: **High**
- File: `libs/ssr/src/preload.ts:35-37`
- Category: Security (XSS)
- Problem: `href="${escape(l.href)}"` — if `l.href` contains `"><script>alert(1)</script>` (e.g., user‑supplied entry URL via build config or remote registry), escaping only `"` yields `…"<script>…</script>"` injecting outside the tag is not possible because the `"` is escaped — but `&` is also unescaped, breaking valid entities. More importantly, `integrity` and `type` are passed through the same flawed escape.
- Fix: HTML‑entity‑escape `&`, `<`, `>`, `"`, `'`. Reuse `escapeHtml`. Validate that `href` parses as a URL.

### 38. `crossorigin="anonymous"` on `modulepreload` rejected by some browsers
- Severity: **Low**
- File: `libs/ssr/src/preload.ts:27-32`
- Category: Bug
- Problem: Spec: `<link rel="modulepreload">` does NOT take `crossorigin` to mean what `<link rel="preload">` does — it's only relevant for cross‑origin requests. Setting `crossorigin="anonymous"` for same‑origin remote entries is inert; for cross‑origin it's required. Setting it unconditionally on every remote is fine but redundant.
- Fix: Document. Optionally check origin match before adding.

### 39. `as=` is suppressed for `modulepreload` but added otherwise — but `as=script` is required for `rel=preload` of JS
- Severity: **Low**
- File: `libs/ssr/src/preload.ts:17`
- Category: Bug
- Problem: `if (l.as && rel !== 'modulepreload') attrs.push(...)` — fine. But `linkTag({ href, as: 'script' })` defaults `rel` to `modulepreload` (line 15) and silently drops `as`. Caller asked for `<link rel=preload as=script>`, got `<link rel=modulepreload>`. Surprise.
- Fix: When caller passes `as: 'script'` without explicit `rel`, decide once and document.

---

## libs/ssr/src/cache-headers.ts

### 40. `noCache` and `maxAge` can both be emitted — semantically contradictory
- Severity: **Low**
- File: `libs/ssr/src/cache-headers.ts:21-32`
- Category: Bug / Maintainability
- Problem: `cacheControl({ noCache: true, maxAge: 60 })` outputs `public, no-cache, max-age=60`. Behavior is confusing: `no-cache` forces revalidation while `max-age=60` says cache for 60s. Browsers honor `no-cache`, but the directive list is misleading.
- Fix: When `noCache` is set, drop `maxAge`/`sMaxAge` or warn.

### 41. `stale-while-revalidate` without `max-age` is invalid
- Severity: **Low**
- File: `libs/ssr/src/cache-headers.ts:21-32`
- Category: Bug
- Problem: SWR requires `max-age` to define what "fresh" means; without it, behavior is implementation‑defined.
- Fix: Throw if `staleWhileRevalidate` is set without `maxAge`/`sMaxAge`.

---

## libs/ssr/src/redirect.ts

### 42. `instanceof` check unreliable across module realms
- Severity: **Medium**
- File: `libs/ssr/src/redirect.ts:17-19`
- Category: Bug / Architecture
- Problem: When the SSR package is loaded twice (e.g., dual ESM/CJS, or workspace duplication), `err instanceof SsrRedirect` may be false even though the error has the right shape. Code falls back to `err.name === 'SsrRedirect'`, but only with `&&` after the instanceof — so the duck‑typing fallback is reached. Good. BUT `(err as { name?: string }).name === 'SsrRedirect'` doesn't validate `.location` / `.status`, so a random `{name:'SsrRedirect'}` object would short‑circuit the catch.
- Fix: Tighten duck‑type to require `typeof err.location === 'string'`.

---

## libs/ssr/src/remote-ssr.ts

### 43. `await import(specifier)` is dynamic and unanalyzable to bundlers
- Severity: **Medium**
- File: `libs/ssr/src/remote-ssr.ts:65`
- Category: Architecture
- Problem: Dynamic import with a runtime string blocks tree‑shaking and bundling. In edge runtimes (Workers), `import()` of a non‑bundled module fails — there is no Node module graph. The doc claims this works for monorepo remotes; it does not work for Workers/Vercel Edge at all, but the function lives in a package consumed by `createEdgeAdapter`.
- Fix: Document Node‑only. Provide a separate `ssrLoadRemoteEdge(map)` that takes a static `Record<name, Promise<Module>>`.

### 44. Catch‑all swallows real errors (typo in module ID, syntax error in remote)
- Severity: **High**
- File: `libs/ssr/src/remote-ssr.ts:69-71`
- Category: Bug / Maintainability
- Problem: `try { … } catch { return null; }` — collapses *any* error (network, syntax, missing peer dep, throw inside top‑level await) to a generic null. Debugging is impossible.
- Fix: Distinguish "module not found" (return null) from "module loaded but threw" (rethrow / report).

### 45. `subpath` forwarded to remote without any validation
- Severity: **Medium**
- File: `libs/ssr/src/remote-ssr.ts:155-163`
- Category: Security
- Problem: A request URL pathname is directly passed as `subpath` prop to a federated remote. Remote may reflect it into HTML, opening XSS through the remote layer. No `isSafePathname` check.
- Fix: Validate via `isSafePathname` before passing.

---

## libs/security/src/csp.ts

### 46. Nonce token added to `style-src` together with `'unsafe-inline'` (baseline) — `'unsafe-inline'` defeats nonce
- Severity: **High**
- File: `libs/security/src/csp.ts:35-46, 62-66`
- Category: Security
- Problem: Baseline `style-src: 'self', 'unsafe-inline'`. When a nonce is provided, the resulting policy is `style-src 'self' 'unsafe-inline' 'nonce-…'`. Per CSP3, *if `'unsafe-inline'` is present and a nonce is also present, browsers ignore `'unsafe-inline'`*. So this is mostly safe; but baseline still allows inline styles when no nonce is set, which is a footgun for users assuming the helper is secure by default.
- Fix: Drop `'unsafe-inline'` from baseline `style-src`. Require explicit opt‑in.

### 47. `script-src 'self'` baseline does not add `'strict-dynamic'`
- Severity: **Medium**
- File: `libs/security/src/csp.ts:35-46`
- Category: Security / Maintainability
- Problem: For module federation specifically, runtime adds `<script>` tags for remoteEntry.js etc. Without `'strict-dynamic'` (or proper origin allowlisting through `remotes`), browsers may block loaded chunks. The user has to rediscover this.
- Fix: When `nonce` is present, add `'strict-dynamic'` to `script-src` (this is the recommended pattern). Document.

### 48. `report-uri` is deprecated; should also emit `report-to`
- Severity: **Low**
- File: `libs/security/src/csp.ts:71`
- Category: Maintainability
- Problem: `report-uri` is deprecated since CSP3 in favor of `report-to`. The type already has both — but the option only sets `report-uri`.
- Fix: Add `reportTo` option.

### 49. `pushUnique` mutates baseline shared between calls
- Severity: **Low**
- File: `libs/security/src/csp.ts:48-49, 80-83`
- Category: Bug
- Problem: `structuredClone(BASELINE)` clones at start of each call — so OK. But if `BASELINE` is mutated through some path (it isn't currently) the bug would creep back. Also `structuredClone` requires Node ≥17 / modern browsers.
- Fix: Add a runtime polyfill or doc the requirement.

### 50. `'nonce-…'` token not validated for invalid characters
- Severity: **High**
- File: `libs/security/src/csp.ts:62-66`
- Category: Security
- Problem: Caller passes `nonce: 'abc"; script-src http://attacker'`. Token becomes `'nonce-abc"; script-src http://attacker'` — single quotes are inside `'…'`. The single quote is preserved by the helper. However, `serialize()` joins via `; `, and each directive is space‑separated within its own `; …` block. Adding `; script-src ...` inside a token DOES break out of the directive: result is `script-src 'self' 'nonce-abc'"; script-src http://attacker'` which the browser parses as two separate directives — the second one (`http://attacker`) is honored.
- Fix: Validate nonce strictly (`/^[A-Za-z0-9+/=_-]+$/`). Throw otherwise. Same for `reportUri`.

---

## libs/security/src/sri.ts

### 51. `sriHash` Node‑only; cannot run in edge
- Severity: **High**
- File: `libs/security/src/sri.ts:1-10`
- Category: Bug (cross-runtime)
- Problem: `import { createHash } from 'node:crypto'`. The export `sriHashFromUrl` is async and likely intended for build/edge use, but the underlying `createHash` is unavailable in Cloudflare Workers / Vercel Edge.
- Fix: Use `crypto.subtle.digest('SHA-384', bytes)` (universal) and base64‑encode via `btoa(String.fromCharCode(...new Uint8Array(buf)))`.

### 52. SRI of remote URL is insecure if URL is HTTP
- Severity: **High**
- File: `libs/security/src/sri.ts:20-25`
- Category: Security
- Problem: `await fetch(url)` does not enforce HTTPS; if the URL is `http://`, an in‑transit attacker can substitute the body. The hash you compute matches the attacker's payload, which then ships to clients.
- Fix: Reject non‑HTTPS URLs (or document).

### 53. SRI helper has no caching — re‑fetches on every call
- Severity: **Low**
- File: `libs/security/src/sri.ts:20-25`
- Category: Performance
- Problem: At build time `sriHashFromUrl` is fine; at runtime per‑request it re‑downloads.
- Fix: Document as build‑only. Add LRU cache.

---

## libs/security/src/allowlist.ts

### 54. Wildcard regex allows DOTS in subdomain via punycode bypass
- Severity: **Critical**
- File: `libs/security/src/allowlist.ts:37-44`
- Category: Security
- Problem: `https://*.example.com` → regex `^https:\/\/[^.]+\.example\.com$`. Looks tight — `[^.]+` forbids dots. But:
  1. The pattern only checks the entire `origin` string with `^…$`. ✓
  2. **IDN/punycode bypass**: `https://attacker.example.com.evil.com` — does NOT match (because of `$`). ✓
  3. **Underscore/colon bypass**: `https://a:b@evil.com` — `new URL().host` returns `evil.com`, and the credentials are stripped. ✓
  4. **Punycode**: `https://*.example.com` does not match `https://xn--examp1e-…` because the punycoded host has different chars. So Unicode lookalikes (`exаmple.com` with Cyrillic а) are NOT matched. ✓ (good, but consumers may be surprised they need to enroll punycode forms explicitly)
  5. **Trailing slash**: `toMatcher` strips one trailing slash, but `new URL('…').host` never has a trailing slash. ✓
  6. **Real bug**: `https://*.example.com` matches `https://api.example.com` and also `https://./example.com`? Let me check: `[^.]+` requires at least one non‑dot char, so `https://./example.com`: the host is `./example.com` — but `new URL('https://./example.com')` throws (invalid host). Browsers reject. ✓

  **Actual hole**: `[^.]+` matches `*` only one level — but caller writing `https://*.example.com` may EXPECT it to match `https://a.b.example.com`. It doesn't. This is a footgun that could cause configs to be loosened in the wrong direction (`https://*` → `https://[^.]+` which is essentially `https://hostnowithdots` — almost nothing matches). Likely to be replaced with a too‑permissive pattern at first failure.
  
  **Real real bug**: Pattern injection via origins entry. If an origin string contains regex metacharacters that `*` doesn't catch, what happens? `toMatcher` escapes most metas (`[.+?^${}()|[\]\\]`) but missed `-` (irrelevant outside `[…]`), `<`, `>`, and `=`. Probably safe.
  
  **Final, exploitable**: `toMatcher` lower‑cases nothing. `new URL('https://EXAMPLE.com').host` returns `example.com` (URL standard lowercases). But if the user passed origin `https://Example.com` to the allowlist constructor, `toMatcher` returns the literal string `https://Example.com` — and the comparison `origin === 'https://Example.com'` fails because `origin` is lowercased to `https://example.com`. Allowlist mis‑configured, requests rejected.
- Fix: Lower‑case origin strings on construction. Document `*` is single‑label only, expose `**` for multi‑label or accept regex directly.

### 55. No port validation
- Severity: **Medium**
- File: `libs/security/src/allowlist.ts:20-26`
- Category: Security
- Problem: `new URL().host` includes port (`example.com:8443`). If allowlist contains `https://example.com` and request URL is `https://example.com:8443/...`, host is `example.com:8443` and origin `https://example.com:8443`, which does NOT equal `https://example.com`. Allowlist denies — that's fine. But the wildcard pattern `https://*.example.com` does NOT account for ports either: `https://api.example.com:8443` won't match because of the trailing `:8443`. Surprising.
- Fix: Document; or add port wildcard support.

### 56. No scheme allowlist enforcement
- Severity: **Medium**
- File: `libs/security/src/allowlist.ts:20-26`
- Category: Security
- Problem: `new URL('javascript:alert(1)').host` returns empty string — origin `javascript://` — does NOT match any HTTPS entry. ✓ But `new URL('data:text/html,…').host` is empty too — same. ✓ However, if a user puts `data:` in their allowlist origins, this code would happily accept `data:` URIs as allowed remotes, leading to inline payload XSS.
- Fix: Reject schemes outside `http:`/`https:` in `toMatcher`.

### 57. No IPv6 / IP‑literal handling
- Severity: **Low**
- File: `libs/security/src/allowlist.ts:20-26`
- Category: Bug
- Problem: `new URL('https://[::1]:443').host` is `[::1]:443`. Allowlist that contains `https://localhost` won't match. Wildcards probably break too.
- Fix: Normalize / document.

---

## libs/security/src/sanitize.ts

### 58. `safeJsonForScript` emits `<` but does not protect against malformed input throwing
- Severity: **Low**
- File: `libs/security/src/sanitize.ts:17-25`
- Category: Bug
- Problem: `JSON.stringify(circular)` throws. State hydration calls `JSON.stringify` once, no catch. Server renders crash.
- Fix: Wrap in try/catch and report a clear error.

### 59. `escapeHtml` over‑escapes `/` — incorrect for attribute values that contain URLs
- Severity: **Low**
- File: `libs/security/src/sanitize.ts:1-12`
- Category: Bug / Maintainability
- Problem: `'/': '&#47;'` — `/` is not unsafe in HTML; it's only unsafe in `</script>` contexts (already handled via `<` escape). Encoding it makes `<a href="https://example.com">` into `https:&#47;&#47;example.com` if used for hrefs — visually identical but query strings break for naive consumers.
- Fix: Drop `/` from the table, or split into `escapeHtml` (for text) and `escapeHtmlAttr`.

### 60. No prototype pollution sanitizer despite being in `sanitize.ts`
- Severity: **Medium**
- File: `libs/security/src/sanitize.ts` (entire file)
- Category: Architecture / Security
- Problem: The module is named `sanitize` but only exports HTML/JSON helpers. There is no `sanitizeObject(obj)` that strips `__proto__` / `constructor` / `prototype` keys before assigning to merged config — even though `pushUnique` (csp.ts) and adapter options merge user input into mutable maps. A malicious config with `{ __proto__: { polluted: true } }` mutates `Object.prototype`.
- Fix: Add `safeObjectAssign` / `pruneProtoKeys`. Apply at adapter creation.

---

## libs/observability/src/hooks.ts

### 61. Module‑level singleton registry — leaks across SSR requests
- Severity: **High**
- File: `libs/observability/src/hooks.ts:35-39`
- Category: Bug / Architecture
- Problem: `const reg: Registry = { errors: new Set(), … }` is a module global. In Node SSR, all requests share these. If a request handler does `useConsoleAdapter()` per‑request to capture per‑request logs, every other concurrent request sees those handlers. Memory leak (handlers added per request, never removed unless caller explicitly disposes).
- Fix: Provide an `AsyncLocalStorage`‑based per‑request context, or document the global semantics and forbid per‑request adapter installation.

### 62. `safeCall` swallows all errors — debugging impossible
- Severity: **Medium**
- File: `libs/observability/src/hooks.ts:74-80`
- Category: Bug / Maintainability
- Problem: Per the comment "observer must never break the host" — fine — but errors are *also not logged*. A misbehaving observer is invisible.
- Fix: At minimum `console.error(err)`.

### 63. No batching, no async — every metric blocks the request
- Severity: **Medium**
- File: `libs/observability/src/hooks.ts:60-62`
- Category: Performance
- Problem: `reportMetric` iterates handlers synchronously. If an adapter posts to an HTTP endpoint with `fetch`, that's fine (it's async). But the Sentry adapter's `addBreadcrumb` is synchronous and adds to an in‑memory queue — many calls per render thrash the queue.
- Fix: Allow handlers to register a `flush()` and batch metrics over a window.

---

## libs/observability/src/logger.ts

### 64. PII not redacted — full `ctx` JSON‑stringified
- Severity: **High**
- File: `libs/observability/src/logger.ts:33-42, 53-59`
- Category: Security / Privacy
- Problem: `logger.info('login', { user: { email, password } })` writes the password to stdout. No redaction mechanism (pino has `redact` paths). Common dev mistake; must be discouraged at the logger level.
- Fix: Add `redactPaths?: string[]` option and apply before sink.

### 65. `JSON.stringify(entry)` throws on circular ctx
- Severity: **Medium**
- File: `libs/observability/src/logger.ts:54`
- Category: Bug
- Problem: A request object passed as `ctx` (commonly done) often has circular refs (`req.socket.parser.incoming === req`). `JSON.stringify` throws → the error path tries `console.error` of a thrown error → stack trace.
- Fix: Use a circular‑safe stringifier (e.g. `safe-stable-stringify` or a custom WeakSet replacer).

### 66. `time` formatted as ISO string (16 bytes, slow) instead of epoch ms
- Severity: **Low**
- File: `libs/observability/src/logger.ts:36`
- Category: Performance
- Problem: At ten million logs / day, `Date.toISOString()` is slower than `Date.now()`. ISO is human‑friendly though — fine default.
- Fix: Document; allow numeric override.

---

## libs/observability/src/web-vitals.ts

### 67. SSR safety check fires *only* before observation; subsequent code can still call window
- Severity: **Low**
- File: `libs/observability/src/web-vitals.ts:13`
- Category: Bug
- Problem: `if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return () => {};` — guards window access. ✓
  But `window.addEventListener(…)` inside the function is OK because we already returned. ✓
  Actually OK.
- Fix: None. (Marked as a non‑issue after rechecking.)

### 68. Visibility listener leak — never removed on dispose
- Severity: **High**
- File: `libs/observability/src/web-vitals.ts:35-37`
- Category: Bug / Performance
- Problem: `window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); })` is not added to `disposers`. The returned `dispose()` only disconnects PerformanceObservers; the visibilitychange listener stays forever, and on hot reload / SPA route change you get N listeners and N CLS reports.
- Fix: Capture the listener and push a remover into `disposers`.

### 69. CLS not reported on `pagehide` — the right event for bfcache
- Severity: **Medium**
- File: `libs/observability/src/web-vitals.ts:35-37`
- Category: Bug
- Problem: Modern web vitals best practice flushes on `pagehide` (or `visibilitychange === hidden`), but `pagehide` fires more reliably on iOS Safari.
- Fix: Listen to both.

### 70. `fcp` calculated as `domContentLoadedEventStart` — wrong metric
- Severity: **High**
- File: `libs/observability/src/web-vitals.ts:42-43`
- Category: Bug
- Problem: `reportMetric({ name: 'fcp', value: nav.domContentLoadedEventStart, unit: 'ms' })`. FCP is the time of the first contentful paint, NOT DCL. Use the `paint` PerformanceObserver type (`first-contentful-paint`).
- Fix: `observe('paint', e => { if (e.name === 'first-contentful-paint') report(e.startTime) })`.

### 71. FID dispatched per first input event but `disposers.push(observe(...))` not disconnected after first metric
- Severity: **Low**
- File: `libs/observability/src/web-vitals.ts:21-24`
- Category: Performance
- Problem: FID is by definition the FIRST input. The observer keeps firing on each input (not as FID — it's mislabeled). Should disconnect after first delivery.
- Fix: `disconnect()` after first FID.

### 72. INP not measured at all
- Severity: **Medium**
- File: `libs/observability/src/web-vitals.ts` (entire file)
- Category: Bug
- Problem: FID is replaced by INP in Core Web Vitals as of March 2024. The collector is already out of date.
- Fix: Add INP, or document and recommend the upstream `web-vitals` package as a hard dependency.

---

## libs/observability/src/adapters/console.ts & sentry.ts

### 73. Sentry adapter does not capture `metric` errors / `e.severity` mapping
- Severity: **Low**
- File: `libs/observability/src/adapters/sentry.ts:16-20`
- Category: Bug
- Problem: `level: e.severity ?? 'error'` — Sentry levels are `fatal | error | warning | info | debug | log`, MFJS severities are `debug | info | warn | error | fatal`. `'warn'` ≠ Sentry's `'warning'`. Sentry will reject the level or downgrade silently.
- Fix: Translate.

### 74. `console.debug` — silenced in production browsers by default
- Severity: **Low**
- File: `libs/observability/src/adapters/console.ts:15, 20`
- Category: Bug
- Problem: Most browsers hide `console.debug` unless verbose level is on. `[mfjs:metric]` and `[mfjs:remote]` debug entries silently disappear in prod debugging sessions.
- Fix: Use `console.log` for default, gate debug behind option.

---

## libs/adapter-cloudflare/src/index.ts

### 75. `Object.fromEntries(request.headers)` flattens duplicates
- Severity: **High**
- File: `libs/adapter-cloudflare/src/index.ts:14, 27`
- Category: Bug
- Problem: Workers `Headers.entries()` returns each header once even if multiple values are set, but the underlying `Headers` *combines* duplicate values with `, `. For `Cookie` this is fine (already comma‑joined), but for `Set-Cookie`, `Object.fromEntries` would only return the last value. (No incoming `Set-Cookie` though, so less critical.) The bigger issue: `Headers` keys come lowercased on Workers but uppercased on some other Fetch‑compliant runtimes — the `EdgeRequest.headers['if-none-match']` lookup is fragile.
- Fix: Wrap `request.headers` in a small case‑insensitive accessor instead of converting to a plain object.

### 76. No streaming support — buffers full body before responding
- Severity: **High**
- File: `libs/adapter-cloudflare/src/index.ts:16, 30`
- Category: Performance / Architecture
- Problem: `new Response(res.body, …)` — `res.body` is a string (per `EdgeResponse`), not a stream. The whole HTML is rendered to a buffer in memory before the worker responds. Workers support streaming via `ReadableStream`. For large pages or slow LCP this hurts TTFB significantly.
- Fix: Refactor `EdgeResponse.body` to allow `ReadableStream`. Wire `renderRouteToStream` through a Web‑stream bridge.

### 77. No request body forwarded
- Severity: **Medium**
- File: `libs/adapter-cloudflare/src/index.ts:11-15, 24-29`
- Category: Bug
- Problem: `EdgeRequest` has no `body` field (only `url`, `method`, `headers`). POST/PUT bodies cannot be passed through. The Node adapter even reads `req.body` and passes it (line 38‑43 of node adapter), but the type doesn't allow it — TypeScript won't catch this divergence.
- Fix: Add `body?: ReadableStream | string` to `EdgeRequest`. Forward in all adapters.

### 78. No `waitUntil` / context forwarding
- Severity: **Medium**
- File: `libs/adapter-cloudflare/src/index.ts:10-19`
- Category: Architecture
- Problem: Workers receive `(request, env, ctx)` and `ctx.waitUntil` is needed for after‑response work (cache writes, analytics POSTs). The handler signature drops `env` and `ctx` entirely.
- Fix: Forward env and ctx (also needed for KV bindings, secrets).

### 79. CSP nonce should be per‑request, but adapter passes `csp` once at construction
- Severity: **High**
- File: `libs/adapter-cloudflare/src/index.ts` + `libs/ssr/src/edge-adapter.ts:32, 65`
- Category: Security
- Problem: CSP nonces MUST be regenerated per request; reusing a nonce across requests defeats the purpose (XSS in one request gets nonced for all). The adapter accepts a static `csp: string` at construction time. There is no way to inject a fresh nonce per request.
- Fix: Allow `csp` to be `(req) => string` for per‑request generation. Wire the same nonce into `serializeState` (currently disconnected).

---

## libs/adapter-node/src/index.ts

### 80. `fs.existsSync` + `fs.statSync` race — TOCTOU
- Severity: **Medium**
- File: `libs/adapter-node/src/index.ts:28-32`
- Category: Bug / Security
- Problem: Between `existsSync` and `statSync` and `createReadStream`, the file can be replaced. While unlikely on a static dist, on a CI server the dir is often rebuilt under load — race produces 500s mid‑request.
- Fix: Use a single `fs.promises.stat` and stream the result.

### 81. Path traversal check insufficient on Windows
- Severity: **High**
- File: `libs/adapter-node/src/index.ts:27-28`
- Category: Security
- Problem: `path.resolve(staticDir, rel)` and `filePath.startsWith(path.resolve(staticDir))` — on Windows, `staticDir` resolved is `C:\app\dist`, and `filePath` may resolve to `C:\app\dist\..\secret.txt` → `C:\app\secret.txt`. The `startsWith` check correctly rejects this. ✓
  But: a request URL like `/static/..%2fsecret.txt` decoded → `../secret.txt`, then `path.resolve('C:\app\dist', '../secret.txt')` → `C:\app\secret.txt`, then `startsWith('C:\app\dist')` is false → rejected. ✓
  Concerning edge: case‑insensitive Windows. `filePath.startsWith` is case‑sensitive. If `staticDir` resolved is `C:\App\Dist` but URL casing produces `C:\App\dist\subdir\…` → still equal because `path.resolve` normalizes capitals on Windows? Actually `path.resolve` does NOT normalize case. If users pass `staticDir: 'Dist'` and the OS is `dist`, `startsWith` mismatches by case → false → file blocked.
- Fix: Compare via `path.relative` and check it doesn't start with `..`, or normalize case explicitly on Windows.

### 82. `cache-control: public, max-age=31536000, immutable` applied to ALL static files
- Severity: **High**
- File: `libs/adapter-node/src/index.ts:30-32`
- Category: Bug
- Problem: Every static file (including non‑fingerprinted ones like `index.html`, `favicon.ico`, source maps, manifests) gets a one‑year immutable cache. Updates are unreachable until the URL changes.
- Fix: Apply immutable only to fingerprinted assets (regex on filename: `*.[hash].*`); non‑fingerprinted files get a short max‑age or no‑cache.

### 83. Response not closed on early return paths if `pipe` errors
- Severity: **Medium**
- File: `libs/adapter-node/src/index.ts:32`
- Category: Bug
- Problem: `fs.createReadStream(filePath).pipe(res); return;` — if the read stream errors (file deleted mid‑stream), neither `res.end()` nor an error response is sent. Connection hangs until socket timeout.
- Fix: Listen for `'error'` on the read stream; emit 500 or destroy `res`.

### 84. `req.headers as Record<string, string>` lies — values are `string | string[] | undefined`
- Severity: **Medium**
- File: `libs/adapter-node/src/index.ts:41`
- Category: Bug
- Problem: Node's `IncomingMessage.headers` types are `IncomingHttpHeaders`. `Set-Cookie` is `string[]`. The cast to `Record<string,string>` loses type safety and may pass arrays into the edge handler, which then attempts `request.headers?.['if-none-match']` and might receive `undefined` or `string[]`.
- Fix: Coerce header values: `for (const [k,v] of Object.entries(req.headers)) headers[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : v ?? ''`.

### 85. `body` parsed as utf8 string — corrupts binary uploads
- Severity: **High**
- File: `libs/adapter-node/src/index.ts:62-70`
- Category: Bug
- Problem: `Buffer.concat(chunks).toString('utf8')` for *all* requests. PUT of a PNG / multipart upload becomes mojibake.
- Fix: Detect content‑type; pass `Buffer` for binary, string for text; or pass the raw stream.

### 86. No timeout on body read — slowloris attack
- Severity: **High**
- File: `libs/adapter-node/src/index.ts:64-69`
- Category: Security / Performance
- Problem: `req.on('data', …)` accumulates indefinitely. A slow client trickling bytes ties up a worker forever.
- Fix: Set `req.setTimeout(30_000)` and cap total bytes (`maxBodyBytes`), 413 on overflow.

### 87. `res.statusCode = out.status` after `setHeader` is fine, but `setHeader` after `end` would throw — code is brittle
- Severity: **Low**
- File: `libs/adapter-node/src/index.ts:44-47`
- Category: Bug
- Problem: Catch block at line 47‑51 unconditionally sets statusCode/headers — if `res.end` was already called by an earlier path, `setHeader` throws `ERR_HTTP_HEADERS_SENT`, then the catch errors → unhandled.
- Fix: Check `res.headersSent` before any setHeader in the catch.

### 88. Mime map missing `.avif`, `.wasm`, `.ico`, `.txt`, `.xml`
- Severity: **Low**
- File: `libs/adapter-node/src/index.ts:72-88`
- Category: Bug
- Problem: Common static assets fall through to `application/octet-stream`. `favicon.ico` served as octet‑stream is rendered as a download in some browsers.
- Fix: Add the obvious extensions, or fall back to a minimal `mime-types` lib.

### 89. `console.log` for server start — not structured
- Severity: **Low**
- File: `libs/adapter-node/src/index.ts:58`
- Category: Maintainability
- Problem: Doesn't go through `@mfjs/observability`; the rest of the stack is loggable.
- Fix: Accept a `logger` option.

### 90. Server has no `keepAliveTimeout`/`headersTimeout` configured
- Severity: **Low**
- File: `libs/adapter-node/src/index.ts:55-60`
- Category: Performance / Security
- Problem: Defaults are fine but explicit values prevent slowloris, fix CVE‑2019‑15605‑class issues.
- Fix: Allow override; set sensible defaults.

---

## libs/adapter-vercel/src/index.ts

### 91. Same `Object.fromEntries(request.headers)` issue as Cloudflare adapter
- Severity: **High**
- File: `libs/adapter-vercel/src/index.ts:16`
- Category: Bug
- Problem: Same as #75.
- Fix: Same.

### 92. Vercel Edge does not provide `Buffer` — yet `cache-headers.ts` and `csp.ts` use `Buffer`
- Severity: **High**
- File: `libs/adapter-vercel/src/index.ts:1-21`, `libs/security/src/csp.ts:116`
- Category: Bug (cross-runtime)
- Problem: When `runtime: 'edge'`, Node `Buffer` is not in scope. `generateNonce` will crash at first call. The Vercel adapter does not detect / warn about this.
- Fix: Polyfill or use Web crypto.

### 93. Streaming SSR not wired
- Severity: **High**
- File: `libs/adapter-vercel/src/index.ts:13-21`
- Category: Performance / Architecture
- Problem: Same as Cloudflare — `EdgeResponse.body` is a string. Vercel Edge supports `ReadableStream` natively. Lost TTFB benefit.
- Fix: Add streaming code path.

### 94. `vercelConfig.node.runtime = 'nodejs22.x'` hardcoded
- Severity: **Low**
- File: `libs/adapter-vercel/src/index.ts:25`
- Category: Maintainability
- Problem: Vercel deprecates Node runtimes annually; pinning to `nodejs22.x` will need maintenance.
- Fix: Read from package.json `engines.node` or expose option.

### 95. `runtime` option in `VercelAdapterOptions` is unused
- Severity: **Low**
- File: `libs/adapter-vercel/src/index.ts:6-7, 10-21`
- Category: Bug / Maintainability
- Problem: `options.runtime` is declared but never read inside `createVercelHandler`. It's only used externally via `vercelConfig`. Dead config.
- Fix: Either delete the field or branch on it (e.g., select streaming impl).

---

## libs/rspack-route-assets/src/index.ts

### 96. `apply(compiler: any)` — full type erasure
- Severity: **Medium**
- File: `libs/rspack-route-assets/src/index.ts:55-99`
- Category: Maintainability
- Problem: Every interaction is `any`. Type errors with rspack/webpack changes are invisible.
- Fix: Import types from `@rspack/core` or `webpack` as devDeps; cast at the boundaries only.

### 97. `apply` returns nothing if hooks are missing — silently no‑ops
- Severity: **Medium**
- File: `libs/rspack-route-assets/src/index.ts:56-57`
- Category: Bug
- Problem: `compiler.hooks?.thisCompilation?.tap(...)` — if `hooks.thisCompilation` is missing, the plugin silently does nothing and the build "succeeds" with a stale stats.json (or none).
- Fix: Throw with a clear "rspack/webpack version not supported" message.

### 98. `processAssets.tapPromise` after `PROCESS_ASSETS_STAGE_SUMMARIZE` may run after Compression plugins — assets unstable
- Severity: **Medium**
- File: `libs/rspack-route-assets/src/index.ts:60-64`
- Category: Architecture
- Problem: `SUMMARIZE` (1000) is the latest stage. Most stat plugins use `REPORT` (5000) or run after `processAssets`. Running at SUMMARIZE means `compilation.entrypoints` is final, but compressed (gzip/brotli) sibling assets may not be in the entrypoint files lists yet.
- Fix: Use `REPORT` stage for stats writes.

### 99. Both `emitAsset` and direct `writeFile` paths can run — duplicated stats
- Severity: **Low**
- File: `libs/rspack-route-assets/src/index.ts:81-94`
- Category: Bug
- Problem: When `emitAsset && compilation.emitAsset && RawSource`, returns early — good. Otherwise writes to disk. But if `outFile` is set, the user explicitly wants disk write, not the in‑build asset. Currently `emitAsset: true` (default) wins, ignoring `outFile`.
- Fix: When `outFile` is provided, prefer disk write; or do both.

### 100. `path.resolve(outPath)` when `outPath` is provided makes it relative to CWD, not output dir
- Severity: **Medium**
- File: `libs/rspack-route-assets/src/index.ts:90-93`
- Category: Bug
- Problem: A user setting `outFile: 'my-stats.json'` likely expects the file inside the build output. The plugin resolves it from `process.cwd()` instead.
- Fix: Document, or `path.resolve(distDir, outPath)` when outPath is relative.

### 101. `entrypointAssets` populated only via `forEach` — webpack 5 returns Map, but rspack future versions may return iterable
- Severity: **Low**
- File: `libs/rspack-route-assets/src/index.ts:64-72`
- Category: Maintainability
- Problem: Defensive use of `forEach` is fine but doesn't handle Map vs object cleanly.
- Fix: Guard explicitly or use a small adapter.

### 102. Asset filenames in `entrypoint.getFiles()` may have leading `/` or query suffixes
- Severity: **Low**
- File: `libs/rspack-route-assets/src/index.ts:69, 27-29`
- Category: Bug
- Problem: `normalizeAssetName` strips leading `/`. But rspack can produce `chunk.js?v=hash` query strings; those are not stripped, so consumers get keys with query strings.
- Fix: Strip the query suffix too.

### 103. JSON written without atomic rename
- Severity: **Low**
- File: `libs/rspack-route-assets/src/index.ts:93-94`
- Category: Bug
- Problem: `await writeFile(filePath, payload, 'utf8')` — concurrent reads (CDN deploy script reading `stats.json`) may see partial data.
- Fix: Write to `filePath + '.tmp'` then `rename`.

---

## Cross‑cutting / Architecture

### 104. Three adapters duplicate the same `Object.fromEntries(headers) → handler → new Response` boilerplate
- Severity: **Medium**
- File: `libs/adapter-cloudflare/src/index.ts:10-19`, `libs/adapter-vercel/src/index.ts:13-21`, partially `libs/adapter-node/src/index.ts`
- Category: Architecture / Maintainability
- Problem: Three+ near‑identical `fetch` shims diverge subtly (Vercel doesn't pass body, Node does, neither forwards env/ctx). A change to header handling has to be made N times.
- Fix: Create `libs/adapter-fetch` with one `toEdgeRequest(Request)` / `toFetchResponse(EdgeResponse)` pair; have Cloudflare/Vercel/Deno wrap it.

### 105. `EdgeRequest` / `EdgeResponse` types are too narrow vs. real Fetch
- Severity: **High**
- File: `libs/ssr/src/types.ts:79-90`
- Category: Architecture
- Problem: `body: string` (no streams), `headers: Record<string, string>` (no multi‑value, no case insensitivity), no `signal`, no `body`/`request body`, no `cookies`. The abstraction will be replaced when streaming/middleware lands.
- Fix: Either accept the real `Request`/`Response` (Web Fetch) as the canonical type and adapt Node ↔ Fetch with `node:stream/web`, or extend with `body?: ReadableStream | string`, `signal?: AbortSignal`, plus a case‑insensitive headers map.

### 106. Edge adapter cannot inject preload / state / SRI tags
- Severity: **High**
- File: `libs/ssr/src/edge-adapter.ts:46-58`
- Category: Architecture
- Problem: The handler renders only `match` HTML and calls `injectIntoTemplate(template, html)`. There is no slot for `serializeState`, `buildPreloadTags`, or per‑request CSP nonce mutation in the template. Users have to fork the adapter to integrate.
- Fix: Allow `template: string | ((ctx: { match, request }) => string)`, plus a hook `enrichHead?: (ctx) => string` that returns extra `<head>` injections.

### 107. No middleware / hooks pipeline
- Severity: **Medium**
- File: All adapters
- Category: Architecture
- Problem: Cannot add auth, A/B test, geo redirect, etc., without re‑implementing the handler. Edge frameworks (Next, SvelteKit, Astro) all expose middleware.
- Fix: Add `middleware?: Array<(req, next) => Promise<Response>>`.

### 108. CSP/SRI/observability/state‑hydration not composed in the SSR pipeline
- Severity: **High**
- File: cross‑package
- Category: Architecture
- Problem: `@mfjs/security` and `@mfjs/observability` exist, but the SSR adapter does not call them by default. A user wiring secure SSR has to discover ten exports and integrate manually. As a result, the secure default is "build your own".
- Fix: Provide a `createSecureEdgeAdapter` that defaults to: per‑request nonce → CSP → state hydration with the same nonce → preload tags with SRI → metrics emission for render duration / shell ready / render errors → optional onError hook to report to observability.

### 109. No HEAD / OPTIONS handling
- Severity: **Medium**
- File: `libs/ssr/src/edge-adapter.ts:34-86`
- Category: Bug
- Problem: HEAD and OPTIONS requests are routed through full SSR. Some CDNs probe with HEAD; renders are wasted, bodies are returned (browsers ignore body, but the cycles are spent). OPTIONS responses lack `Allow` headers.
- Fix: Short‑circuit HEAD to render‑sans‑body (or render then drop body); answer OPTIONS with `Allow`.

### 110. Race between concurrent renders mutating the same template through `injectIntoTemplate`
- Severity: **Low**
- File: `libs/ssr/src/render-to-string.ts:55-64`
- Category: Bug
- Problem: `injectIntoTemplate` is pure (`String.replace`), no shared mutable state. ✓ Marking as not‑an‑issue, but worth noting that any future template caching must remain pure.
- Fix: None.

### 111. Hydration mismatch risk: state injected AFTER `<!--ssr-outlet-->` but referenced inside the React tree
- Severity: **Medium**
- File: `libs/ssr/src/state-hydration.ts:21-25`, `libs/ssr/src/render-to-string.ts:55-64`
- Category: Bug / Architecture
- Problem: `serializeState` returns a `<script>` tag the user is supposed to inline. There is no documented place to put it — typically before `</head>` so it's available before client JS runs. But the SSR pipeline never wires it; users will inline it AFTER the SSR outlet, in which case `hydrateState()` returns `undefined` during initial hydration and `__MFJS_STATE__` becomes available only after the script tag below the React root parses → hydration mismatch on the FIRST render attempt.
- Fix: Provide a documented `injectIntoTemplate` that takes both `html` and `headExtra` (or use a separate `<!--ssr-head-->` placeholder).

### 112. No package‑level "isomorphic" detection — node modules imported by browser bundles
- Severity: **Medium**
- File: `libs/ssr/src/render-to-stream.ts:22-23` (`node:stream`), `libs/security/src/sri.ts:1` (`node:crypto`)
- Category: Bug / Architecture
- Problem: `@mfjs/ssr` re‑exports both `renderRouteToStream` (uses `node:stream`) and helpers usable in edge. A bundler that doesn't externalize Node specifiers (e.g., Workers' build) will fail at load.
- Fix: Split into `@mfjs/ssr/edge` (edge‑safe) and `@mfjs/ssr/node` (Node only) export conditions in package.json.

### 113. No tests visible alongside source — hard to know which bugs are caught
- Severity: **Medium**
- File: package‑level
- Category: Maintainability
- Problem: No `*.test.ts` siblings in any of the audited folders.
- Fix: At minimum unit‑test redirect, ETag, route matching, allowlist wildcards, state serialization round‑trip, path traversal in static export.

### 114. `request.headers` keyed lookups in `edge-adapter.ts` use lowercase but `Headers.entries()` casing differs across runtimes
- Severity: **Medium**
- File: `libs/ssr/src/edge-adapter.ts:75`, `libs/adapter-cloudflare/src/index.ts:14`, `libs/adapter-vercel/src/index.ts:16`
- Category: Bug
- Problem: Already covered in #8/#75; calling out the cross‑file impact: any future header read by name must rely on a casing convention enforced uniformly.
- Fix: Lowercase headers exactly once at the adapter boundary. Add a `getHeader(req, name)` helper.

---

## Summary Counts

- Critical: 3 (#1, #33, #54)
- High: ~25
- Medium: ~50
- Low: ~36

Top priority remediation order:
1. Fix the redirect/error swallowing bug (#1) — breaks redirects entirely.
2. Escape error/specifier interpolation (#2, #3, #37) — XSS.
3. `renderToStaticMarkup` vs hydration (#12) — every hydrated app is broken.
4. Streaming write race (#15) and observer error swallowing (#17) — production correctness.
5. CSP nonce per‑request handling (#79) and `Buffer` in edge (#36, #92) — workers crash.
6. Body decoding / slowloris in Node adapter (#85, #86) — DoS / corruption.
7. ETag work‑first ordering (#7) — wastes compute at scale.
8. Allowlist case sensitivity (#54) — silent misconfigurations.

---
---

# MFJS State / Comms / Types / UI / Examples / Release Audit

Scope: `libs/state`, `libs/event-bus`, `libs/events`, `libs/types`, `libs/ui`,
`libs/eslint-config`, `libs/tsconfig`, `libs/prettier-config`,
`examples/{basic,ecommerce,saas}`, `scripts/`, `.github/`, `.changeset/`,
root workspace files (`package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`,
`vitest.config.ts`, `playwright.config.ts`).

Each finding: **Severity · File:line · Category · Problem · Fix**.

---

## 1. `libs/state` (`@mfjs/state`)

### S-1. Reducer can be re-entered mid-notification — `dispatch()` re-entrancy is unsafe
- Severity: **High**
- File: `libs/state/src/index.ts:141-146`
- Category: Bug / Architecture
- Problem: `dispatch()` does `state = next; for (const l of [...listeners]) l(state)`. A listener that calls `dispatch()` re-enters the reducer **mid-notification**. Redux explicitly forbids this via an `isDispatching` flag (and throws if a reducer dispatches). With the current code, nested dispatches mutate `state` while the outer loop is still notifying with the original snapshot — listeners receive **out-of-order** values; a listener subscribed mid-dispatch may be missed because the listener snapshot was taken before subscription.
- Fix: Add `let isDispatching = false;` and throw if true; set true around the reducer call. Document "no nested dispatch."

### S-2. `subscribe()` during `dispatch()` semantics are undocumented
- Severity: **Medium**
- File: `libs/state/src/index.ts:145, 148-151`
- Category: Bug / DX
- Problem: `for (const l of [...listeners])` snapshots before iteration so a listener added mid-emit won't fire this cycle. But docs don't tell users this.
- Fix: Document, or use Redux-style `nextListeners = new Set(listeners)` swap.

### S-3. `SimpleStore.set` strict-equality only de-dupes primitives
- Severity: **Low**
- File: `libs/state/src/index.ts:88-92`
- Category: DX
- Problem: `if (next === this.value) return` always re-notifies for objects/arrays even when shallow-equal.
- Fix: Document; optionally accept an `equalityFn` constructor arg.

### S-4. `SimpleStore.set` is not re-entrancy / iteration-safe
- Severity: **Medium**
- File: `libs/state/src/index.ts:91`
- Category: Bug
- Problem: `for (const l of this.listeners) l(this.value)` iterates the **live** Set (no `[...]` snapshot like line 145). A listener that calls `set()`, `subscribe()`, or `unsubscribe()` triggers iteration on a mutated `Set` — implementation-defined behaviour.
- Fix: `for (const l of [...this.listeners]) l(this.value);`.

### S-5. No middleware support
- Severity: **Medium**
- File: `libs/state/src/index.ts` (whole file)
- Category: Architecture / DX
- Problem: Redux-style API with no middleware blocks logging/thunk/persistence/devtools. Adding it post-1.0 will break `Store<S, A>`.
- Fix: Add `createStore(initialState, reducer, enhancer?)` matching Redux's signature. Even a stub now keeps the door open.

### S-6. No persistence, devtools, or replay middleware
- Severity: **Medium**
- File: `libs/state/src/index.ts` (whole file)
- Category: Architecture
- Problem: For an MF runtime advertising "shared singleton state across MFEs", common needs are localStorage rehydration, Redux DevTools bridge, time-travel, action replay across tabs (BroadcastChannel). None exist.
- Fix: Provide opt-in helpers: `withPersistence(key)`, `withDevtools()`, `withCrossTabSync(channel)`.

### S-7. `getStore` silently ignores second-call args — silent reducer collision
- Severity: **Medium**
- File: `libs/state/src/index.ts:190-195`
- Category: Bug / DX
- Problem: Two MFEs that call `getStore('app', differentInitial, differentReducer)` get the *first* MFE's reducer permanently. No warning.
- Fix: Dev-mode `console.warn` when args differ from the cached store's.

### S-8. Registries are module-scoped — defeated by duplicate `@mfjs/state` bundles
- Severity: **High**
- File: `libs/state/src/index.ts:175, 211`
- Category: Bug / Architecture (MF correctness)
- Problem: When MF-singleton sharing fails (mismatched `requiredVersion`, eager-load issue, dev/prod drift), each bundle has its own `registry` Map — host and remote can't see each other's stores. The `getSimpleStore` "replay store" pattern (used by `examples/basic/apps/dashboard/src/pages/index.tsx:13-30`) silently breaks.
- Fix: Pin to `globalThis`: `const registry = ((globalThis as any).__MFJS_STATE_REGISTRY__ ??= new Map())`. Same for `simpleRegistry`.

### S-9. `_resetStore` / `_resetSimpleStore` exported as public API
- Severity: **Low**
- File: `libs/state/src/index.ts:200, 241`
- Category: DX
- Problem: Underscored "for testing only" names are still in the public `index.ts`. Apps can call them in production and crash other MFEs holding prior store references.
- Fix: Move to a `@mfjs/state/testing` subpath export, or guard with `process.env.NODE_ENV` check.

### S-10. No `useSyncExternalStore` React adapter
- Severity: **Medium**
- File: `libs/state/src/index.ts` (whole file)
- Category: DX / Architecture
- Problem: Framework targets React MFEs but ships zero React glue. Users hand-roll `useState`+`useEffect` (see `examples/basic/apps/dashboard/src/pages/index.tsx:13-30`) for what should be a one-liner.
- Fix: Provide `'@mfjs/state/react'` subpath with `useStore(store)` / `useStoreSelector(store, sel)` over `useSyncExternalStore`.

### S-11. `subscribe` returns `boolean` from `Set.delete` — type lies
- Severity: **Low**
- File: `libs/state/src/index.ts:97, 150`
- Category: Bug
- Problem: `return () => this.listeners.delete(listener)` declares `() => void` but the arrow returns `boolean` (the return value of `Set#delete`). Callers typing `unsub() satisfies void` see compile-time mismatch in strict configs.
- Fix: `return () => { this.listeners.delete(listener); };` (block body, no implicit return). Same at line 150.

### S-12. `createStore.subscribe` listener signature blocks concurrent React tearing safety
- Severity: **Medium**
- File: `libs/state/src/index.ts:109-124`
- Category: Architecture
- Problem: `useSyncExternalStore` requires `subscribe(cb: () => void)` and `getSnapshot()`. Current `subscribe(listener: (state) => void)` is fine to wrap, but ship a React adapter (S-10) so users don't accidentally pass a stale-state listener.
- Fix: Ship `'@mfjs/state/react'` adapter.

### S-13. `package.json` missing `exports`, `repository`, `description`, `license`, `keywords`, `homepage`
- Severity: **High**
- File: `libs/state/package.json:1-19`
- Category: Release
- Problem: No `"exports"` field — Node 16+ ESM resolution + TypeScript `Node16`/`NodeNext` consumers won't resolve types reliably. Missing `repository`, `description`, `license`, `keywords` makes the npm landing page empty and unsearchable.
- Fix:
```json
{
  "description": "Lightweight shared-state primitives for MFJS micro-frontends.",
  "license": "MIT",
  "repository": { "type": "git", "url": "https://github.com/<org>/MFJS.git", "directory": "libs/state" },
  "homepage": "https://github.com/<org>/MFJS#readme",
  "keywords": ["mfjs", "module-federation", "state", "store"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./package.json": "./package.json"
  },
  "files": ["dist", "README.md", "LICENSE"]
}
```

### S-14. No `files` field — `src/`, `test/`, `node_modules/.bin/` may all ship to npm
- Severity: **High**
- File: `libs/state/package.json` (and every other lib)
- Category: Release / Security
- Problem: Without `"files"`, npm uses `.npmignore` or falls back to `.gitignore`. Combined with no `.npmignore`, **`src/`, tests, and even `node_modules/.bin` shims** can land in published tarballs.
- Fix: `"files": ["dist", "README.md", "LICENSE"]` on every publishable package.

### S-15. Missing README in publishable libs
- Severity: **Medium**
- File: `libs/state/`, `libs/event-bus/`, `libs/events/`, `libs/types/`, `libs/ui/`
- Category: Release / DX
- Problem: No `README.md` (only `eslint-config`, `prettier-config`, `tsconfig` have one). npm landing page will be empty.
- Fix: Add a short README per package.

### S-16. Library tsconfigs ignore the in-repo `library.json` preset
- Severity: **Medium**
- File: `libs/state/tsconfig.json:1-9` (also event-bus, events, types, ui)
- Category: DX / Maintainability
- Problem: Repo ships `libs/tsconfig/library.json` with `declaration`/`declarationMap`/`sourceMap`, but the libs all extend `../../tsconfig.base.json` instead. The shared preset is dead code; libs lack declaration maps.
- Fix: `"extends": "../tsconfig/library.json"` (workspace path) or inline `"declaration": true, "declarationMap": true, "sourceMap": true`.

### S-17. No `sideEffects: false`
- Severity: **Low**
- File: every lib `package.json`
- Category: Release / Performance
- Problem: Bundlers can't tree-shake unused exports. `@mfjs/state` exports `_resetStore` etc. that consumers never use.
- Fix: `"sideEffects": false` on every pure-ESM lib.

---

## 2. `libs/event-bus` (`@mfjs/event-bus`)

### EB-1. No wildcard / `onAny` subscribe
- Severity: **High**
- File: `libs/event-bus/src/index.ts:33-37`
- Category: Architecture / DX
- Problem: No `bus.on('*', handler)` for logging, devtools, or analytics. Audit prompt explicitly flags this.
- Fix: Add `wildcardHandlers: Set<(event, payload) => void>`; have `emit` notify wildcards. Type as `bus.onAny(handler)`.

### EB-2. No replay / "last value" cache
- Severity: **High**
- File: `libs/event-bus/src/index.ts` (whole file)
- Category: Architecture
- Problem: A late-mounting remote that subscribes to `shell:ready` *after* the host emitted will never receive it. The repo papers this over with `getSimpleStore('shell:ready:ts')` (`examples/basic/apps/shell/src/bootstrap.tsx:38-41` and `dashboard/src/pages/index.tsx:13-30`). Every consumer re-implements the workaround.
- Fix: Add `bus.replay(key)` API or per-`on` opt-in: `on('shell:ready', h, { replay: true })`. Or ship a `BehaviorBus` alongside.

### EB-3. No cross-tab synchronisation
- Severity: **Medium**
- File: `libs/event-bus/src/index.ts` (whole file)
- Category: Architecture
- Problem: For SaaS with multiple tabs, `BroadcastChannel`/`storage`-event sync is a common need.
- Fix: Optional `bus.bridge(new BroadcastChannel('mfjs'))` helper.

### EB-4. `_globalBus` module-scoped — same singleton hazard as `@mfjs/state`
- Severity: **High**
- File: `libs/event-bus/src/index.ts:94-119`
- Category: Bug / Architecture
- Problem: Mirrors S-8: if `@mfjs/event-bus` is bundled twice, each bundle has its own `_globalBus`. Cross-MFE messages disappear silently.
- Fix: `const _globalBus = ((globalThis as any).__MFJS_EVENT_BUS__ ??= new EventBus());`.

### EB-5. `once` handler unsub fragile to handler exceptions
- Severity: **Low**
- File: `libs/event-bus/src/index.ts:43-50`
- Category: Bug
- Problem: `wrapper = (payload) => { unsub(); handler(payload); }` — if `handler` throws, `unsub()` already ran (good). But if a future refactor swaps the order, a thrown error leaves the once-listener attached.
- Fix: Wrap in `try { handler(payload); } finally { unsub(); }`.

### EB-6. `emit` swallows handler exceptions and stops iteration
- Severity: **Medium**
- File: `libs/event-bus/src/index.ts:63-70`
- Category: Bug / DX
- Problem: One throwing handler aborts iteration **and** propagates to the emitter. A buggy remote can crash a host's `useEffect`. No `onError` hook.
- Fix: Wrap each call: `try { handler(payload); } catch (e) { (this.errorHandler ?? console.error)(e, event); }`. Add `bus.onError(handler)` setter.

### EB-7. Default `EventBus<EventMap>` forces handlers to `unknown`
- Severity: **Low**
- File: `libs/event-bus/src/index.ts:1, 27`
- Category: DX
- Problem: `EventMap = Record<string, unknown>`; an untyped `new EventBus()` accepts any string but every payload is `unknown`. Documented in `looseBus` test, but DX is poor.
- Fix: Default to `Record<string, any>` (with note) or document.

### EB-8. `typecheck` script points at `tsconfig.test.json`, not `tsconfig.json`
- Severity: **Medium**
- File: `libs/event-bus/package.json:11`
- Category: CI / DX
- Problem: `"typecheck": "tsc -p tsconfig.test.json"` — checks tests, not source. A type error introduced only in `src/index.ts` (no test importing it) passes typecheck while breaking publish.
- Fix: `"tsc -p tsconfig.json --noEmit && tsc -p tsconfig.test.json --noEmit"`.

### EB-9. Same `package.json` gaps as S-13/14/15/17
- Severity: **High**
- File: `libs/event-bus/package.json`
- Category: Release
- Fix: Same as S-13/14.

---

## 3. `libs/events` (`@mfjs/events`)

### EV-1. Hard-coded "example" event contract published as a real package
- Severity: **High**
- File: `libs/events/src/index.ts:34-53`
- Category: Architecture / Release
- Problem: `MfAppEvents` ships hard-coded `'shell:ready' | 'mfe:navigate' | 'dashboard:action'` from a published library. These names belong to the *basic example*, not the framework. Real MFJS users have nothing to do with `dashboard:action`.
- Fix: Move to `examples/basic/libs/events/` (workspace-private), or rename `@mfjs/example-events` and mark `private: true`.

### EV-2. Same event-map duplicated in three places
- Severity: **Medium**
- File: `libs/events/src/index.ts:34-53`, `examples/basic/apps/shell/src/events.ts:9-18`, `examples/basic/apps/dashboard/src/events.ts:5-9`
- Category: Maintainability
- Problem: `MfAppEvents` defined identically in three files. The dashboard's local copy even *says* "In production, extract this to a shared `@app/events` package" — but `libs/events/` already exists and is a workspace dep (`examples/basic/apps/dashboard/package.json:14`).
- Fix: Delete the local copies; have apps `import type { MfAppEvents } from '@mfjs/events'`.

### EV-3. No runtime schema validation
- Severity: **Medium**
- File: `libs/events/src/index.ts`
- Category: Architecture
- Problem: Type-only contract. At runtime nothing checks payload conformance. A remote built against an older `@mfjs/events` can emit events the host can't parse, surfacing deep inside React.
- Fix: Ship Zod/Valibot schemas alongside types, or `defineEvent('shell:ready', schema)` for runtime validation in dev.

### EV-4. Same `package.json` gaps (S-13/14/15/17)
- Severity: **High**
- File: `libs/events/package.json`
- Category: Release
- Fix: Same as S-13/14.

---

## 4. `libs/types` (`@mfjs/types`)

### T-1. `validateFederationContract` doesn't validate exposed *modules*, only key strings
- Severity: **High**
- File: `libs/types/src/federation-contract.ts:162-199`
- Category: Bug / Architecture
- Problem: The function only asserts `key.startsWith('./')` — already enforced by `ExposesMap`. It does **not** call `container.get(key)` to verify the module actually exists in the loaded container. The JSDoc claim "check that a loaded remote container exposes all keys declared in the contract" is unimplemented.
- Fix: Make it `async` and `await container.get(key)` for each exposed key; push a violation if it throws or returns null.

### T-2. `validateFederationContract` is sync but the real check needs to be async
- Severity: **Medium**
- File: `libs/types/src/federation-contract.ts:162`
- Category: Architecture / Release
- Problem: As-shipped, sync — locking the API in. Fixing T-1 means breaking this once 0.1.0 is published.
- Fix: Ship the async version now (pre-0.1.0), or split sync `validateFederationContractKeys` and async `validateFederationContractRuntime`.

### T-3. `applyPlugins` uses `any` and only handles 2 of 3 documented hooks
- Severity: **Medium**
- File: `libs/types/src/plugins.ts:49-62`
- Category: DX / Maintainability
- Problem: `const fn = p[hook] as any; const next = await fn(out);` discards type safety. The `hook` param is `keyof Pick<MfjsPlugin, 'configResolved' | 'devPlan'>` — `federationConfig` is documented but unreachable through this helper.
- Fix: Refactor with conditional types so each hook is typed; add a switch to dispatch all three hooks.

### T-4. `MfjsWorkspaceConfig.plugins?: unknown[]`
- Severity: **Medium**
- File: `libs/types/src/mfjs-config.ts:60`
- Category: DX
- Problem: Plugin array is `unknown[]` — zero IntelliSense, consumers must cast.
- Fix: `plugins?: MfjsPlugin[]`.

### T-5. `defaultRoutingCompiler.routeFromPageFile` returns `/` for both `index.tsx` and empty input
- Severity: **Medium**
- File: `libs/types/src/routing-compiler.ts:45-73`
- Category: Bug
- Problem: `relFromPages = ""` → `segs = []` → `'/' + ''` = `'/'`, same as `index.tsx`. Two `/` routes silently collide; `sortRoutesForMatching` doesn't dedup.
- Fix: Validate input (throw on empty); have `sortRoutesForMatching` warn on duplicates.

### T-6. No `(group)` Next-style group folder support
- Severity: **Low**
- File: `libs/types/src/routing-compiler.ts:50-69`
- Category: DX
- Problem: Modern file-routers support `(auth)/login.tsx` → `/login`. Not supported.
- Fix: `if (s.startsWith('(') && s.endsWith(')')) continue;` before `out.push(s)`.

### T-7. `RouteTarget.expose` default conflicts with `exactOptionalPropertyTypes`
- Severity: **Low**
- File: `libs/types/src/routing.ts:17-22`
- Category: DX
- Problem: Comment says "Defaults to `'./App'` if not specified" but `expose?: string`; with `exactOptionalPropertyTypes: true` (set in `tsconfig.base.json:15`), `expose: undefined` is rejected. Consumers must `?? './App'` everywhere.
- Fix: Provide a `resolveRoute` helper that fills the default, or change to `expose: string` with a runtime default in the route loader.

### T-8. `NavigateDetail.state?: any`
- Severity: **Low**
- File: `libs/types/src/routing.ts:47`
- Category: DX
- Problem: `any` is weak; should be `unknown`.
- Fix: `state?: unknown;`. Drop the eslint-disable line above it.

### T-9. `tsconfig.test.json` `paths` mapping is dead config
- Severity: **Medium**
- File: `libs/types/tsconfig.test.json:6-8`, `libs/event-bus/tsconfig.test.json:6-8`
- Category: Bug / DX
- Problem: `"paths": { "../src/index.js": ["./src/index.ts"] }`. TS path mappings match module *specifiers*, not relative paths. Tests use `import { ... } from '../src/index.js'`; resolution to `.ts` happens via standard `Bundler`/`allowImportingTsExtensions`, **not** via this mapping. The mapping is dead.
- Fix: Remove, or replace with a real alias like `"@/*": ["./src/*"]`.

### T-10. Same `package.json` gaps (S-13/14/15/17)
- Severity: **High**
- File: `libs/types/package.json`
- Category: Release
- Fix: Same as S-13/14.

---

## 5. `libs/ui` (`@mfjs/ui`)

### UI-1. Stub component returns an HTML string — not a real component, and XSS-vulnerable
- Severity: **Critical**
- File: `libs/ui/src/index.ts:1-3`
- Category: Bug / Security / Architecture
- Problem:
  ```ts
  export function Button(label: string) {
    return `<button>${label}</button>`;
  }
  ```
  Template-string concatenation, not a component. **No HTML-escaping of `label`** — XSS via user input. Can't accept handlers, can't be rendered by React/Vue. Ships under `@mfjs/ui` implying a real UI kit.
- Fix: Either delete the package, mark `private: true`, or replace with a real React `Button` (`React.FC<ButtonProps>`, `forwardRef`, ARIA, focus management).

### UI-2. No accessibility (`type="button"`, `aria-*`, focus styles)
- Severity: **High**
- File: `libs/ui/src/index.ts:1-3`
- Category: a11y
- Problem: Generated `<button>` has no `type="button"` (so it submits inside a form), no `aria-label`, no focus ring.
- Fix: Default `type="button"`, expose `aria-label`, ship default focus ring CSS.

### UI-3. No theming primitives
- Severity: **High**
- File: `libs/ui/src/index.ts`
- Category: Architecture
- Problem: For a UI kit shared across MFEs, theme tokens (colors, radii, spacing) need a single source of truth — typically CSS variables wrapped by a `<ThemeProvider>` or shadow DOM. None of this exists. Inline styles are scattered across the example apps with hex literals (see `examples/basic/apps/shell/src/bootstrap.tsx:50, 56, 65`).
- Fix: Define a token surface (`--mfjs-color-primary`), provide `<ThemeProvider>`, document MF-singleton sharing.

### UI-4. Smoke test only
- Severity: **Medium**
- File: `libs/ui/test/smoke.test.ts:1-9`
- Category: DX
- Problem: One assertion: `expect(Button('Hi')).toContain('<button>')`. No render tests.
- Fix: Add `@testing-library/react` and behaviour tests when the component is real.

### UI-5. `tsconfig.json` doesn't extend any preset — same as S-16
- Severity: **Low**
- File: `libs/ui/tsconfig.json:1-9`
- Category: Maintainability
- Fix: Inline `"declaration": true` or extend `library.json`.

### UI-6. Missing `peerDependencies` for `react`/`react-dom`
- Severity: **High**
- File: `libs/ui/package.json:1-19`
- Category: Release
- Problem: Once the file becomes real React, no `peerDependencies` declares `react`/`react-dom`. Plus standard release-field gaps (S-13/14).
- Fix: Add `"peerDependencies": { "react": "^18.0.0", "react-dom": "^18.0.0" }`.

---

## 6. `libs/eslint-config`

### ESL-1. No prettier integration
- Severity: **Medium**
- File: `libs/eslint-config/index.js`, `package.json`
- Category: DX
- Problem: Repo ships `@mfjs/prettier-config` but `@mfjs/eslint-config` doesn't disable rules that conflict with prettier. Result: stylistic ESLint rules can fight prettier.
- Fix: Add `eslint-config-prettier` to deps and append it to the rule arrays.

### ESL-2. No `consistent-type-imports` enforcement
- Severity: **Low**
- File: `libs/eslint-config/index.js:23-31`
- Category: DX
- Problem: With `verbatimModuleSyntax: true` in `libs/tsconfig/base.json`, every type-only import must use `import type`. ESLint config doesn't enforce this; violations only fail at `tsc` time.
- Fix: Add `'@typescript-eslint/consistent-type-imports': 'error'`.

### ESL-3. `eqeqeq` allows null comparison
- Severity: **Low**
- File: `libs/eslint-config/index.js:30`
- Category: Maintainability
- Problem: `'eqeqeq': ['error', 'always', { null: 'ignore' }]` — deliberate soft spot.
- Fix: Document the trade-off, or remove the option.

### ESL-4. README doesn't mention installing `eslint`
- Severity: **Low**
- File: `libs/eslint-config/README.md`
- Category: DX
- Problem: Correct npm pattern for a peer dep, but first-time users hit a confusing error.
- Fix: README install step.

---

## 7. `libs/tsconfig`

### TC-1. Two competing base configs
- Severity: **High**
- File: `libs/tsconfig/base.json` vs `tsconfig.base.json` (root)
- Category: Maintainability
- Problem: `libs/tsconfig/base.json:17` sets `verbatimModuleSyntax: true`; root `tsconfig.base.json` doesn't. Libs extend the *root* base, so the publishable preset is unused. Strictness drifts; future contributors will pick whichever they find first.
- Fix: Pick `libs/tsconfig/base.json` as canonical; have root extend it; libs extend the publishable preset.

### TC-2. `library.json` lacks `composite`/`incremental`
- Severity: **Medium**
- File: `libs/tsconfig/library.json:8`
- Category: DX / Performance
- Problem: `composite: false` is explicit. With many libs, `composite: true` + project references would deliver faster `tsc -b`.
- Fix: Either set `composite: true` here or document why it's off.

### TC-3. `target`/`module` differ between root and lib presets
- Severity: **Low**
- File: `tsconfig.base.json:6` (`module: ES2022`) vs `libs/tsconfig/base.json:6` (`module: ESNext`)
- Category: Maintainability
- Fix: Pick one (`ESNext` is more permissive).

### TC-4. No project references
- Severity: **Medium**
- File: workspace root
- Category: DX
- Problem: No root `tsconfig.json` with `references: [...]` for libs. `tsc -b` from root has no dependency-aware build.
- Fix: Add a root `tsconfig.json` separate from base, with `references`.

---

## 8. `libs/prettier-config`

### PC-1. JSON-only config blocks future extensibility
- Severity: **Low**
- File: `libs/prettier-config/package.json:5`
- Category: DX
- Problem: `main: "index.json"`. Modern prettier configs are usually `.cjs`/`.mjs` for conditional plugin loading.
- Fix: Move to `.mjs` exporting an object.

---

## 9. `examples/basic`

### EX-1. Drift between e2e specs and example testids
- Severity: **High**
- File: `tests/e2e/event-bus.spec.ts:65, 76`, `tests/e2e/basic-example.spec.ts:20, 43, 50, 56, 66, 76, 87, 89` vs `examples/basic/apps/shell/src/bootstrap.tsx`, `apps/dashboard/src/pages/*.tsx`
- Category: Bug / CI
- Problem: E2E specs reference `getByTestId('remote-loaded')` and `getByTestId('nav-dashboard-settings')`, but **neither testid exists** in the example apps (verified — zero matches anywhere under `examples/basic`). Either the tests were authored against an older example or the example regressed. CI passes only because e2e is opt-in (SC-5).
- Fix: Add `data-testid="remote-loaded"` to the `RemoteOutlet` rendered output (or wrap), and `data-testid="nav-dashboard-settings"` to the shell's `NavLink to="/dashboard/settings"` (`bootstrap.tsx:59`).

### EX-2. Hard-coded ports `3000`/`3001` in 6+ files
- Severity: **Medium**
- File: `apps/shell/rspack.config.mjs:89`, `apps/dashboard/rspack.config.mjs:50`, `mfjs.app.json` files, `mfjs.federation.json` files, `tests/e2e/*.spec.ts`, `scripts/e2e.mjs:143-148`
- Category: DX / CI
- Problem: Rspack server port hard-coded; if 3000 is occupied locally, dev fails opaquely. CLI doesn't surface port collisions.
- Fix: Read `port` from `mfjs.app.json` in `rspack.config.mjs`. Add port-clash check to CLI `dev`.

### EX-3. `predev` builds cause race when `pnpm dev` runs in parallel across examples
- Severity: **Medium**
- File: `examples/basic/package.json:6`, `examples/ecommerce/package.json:16`, `examples/saas/package.json:16`
- Category: CI / DX
- Problem: All three examples spawn `pnpm -C ../../packages/cli build` in `predev`. When workspace-root `pnpm dev` runs, three concurrent CLI builds race on the same `dist/`.
- Fix: Move CLI/runtime builds to a workspace-level `prepare` or `build:libs`; have examples consume the artifact.

### EX-4. `examples/basic/package.json` has no deps but documents `pnpm install`
- Severity: **Low**
- File: `examples/basic/package.json:1-12`
- Category: DX
- Fix: Add `description`; reference apps in nested workspace if needed.

### EX-5. `dispatchMfjsNavigate({ to: '/' })` jumps out of the dashboard basePath
- Severity: **Medium**
- File: `apps/dashboard/src/pages/settings.tsx:11`, `users/[id].tsx:16`
- Category: Bug
- Problem: "Back to Home" navigates to `/` (root). Dashboard mounts at both `/` and `/dashboard/*`. When user landed via `/dashboard/...`, clicking Back navigates *out* of basePath — remote unmounts/remounts.
- Fix: Use a `useRemoteBasePath()` hook from `@mfjs/runtime`; `to` should be `'/dashboard/'` or computed.

### EX-6. `mfjs.routes.json` and `mfjs.routes.ts` can drift
- Severity: **Medium**
- File: `apps/dashboard/mfjs.routes.json` vs `mfjs.routes.ts`
- Category: Maintainability
- Problem: Two files encode the same route table. A new page only updates one if dev forgets `mfjs routes`. Header comment says "AUTO-GENERATED" but no check.
- Fix: Add `mfjs check` command failing if regenerated content differs; run in CI.

### EX-7. `mfjs.routes.host.json` order makes `/dashboard/*` unreachable when read literally
- Severity: **Low**
- File: `apps/shell/mfjs.routes.host.json:4-12` lists `/` first, `/dashboard/*` second; `bootstrap.tsx:16-19` lists `/dashboard/*` first.
- Category: Bug (ordering)
- Problem: A naive matcher iterating in array order would always match `/` first. The runtime currently uses `bootstrap.tsx` order (works), but the JSON manifest is wrong. Behaviour diverges if the host runtime ever consumes the JSON.
- Fix: Sort by `defaultRoutingCompiler.sortRoutesForMatching` semantics in the JSON. Make the runtime sort defensively.

### EX-8. Duplicate `events.ts` (see EV-2)
- Severity: **Medium**
- Fix: See EV-2.

### EX-9. Duplicated `mf-shim.js` between shell and dashboard with whitespace drift
- Severity: **Low**
- File: `apps/shell/src/mf-shim.js` vs `apps/dashboard/src/mf-shim.js`
- Category: Maintainability
- Problem: Same code, different indentation (tabs vs spaces). Drift risk.
- Fix: Extract to `@mfjs/runtime` (or `@mfjs/mf-shim`), import in `entry.main`.

### EX-10. Two implementations of the federation→webpack share-scope shim — only on shell
- Severity: **Low**
- File: `apps/shell/index.html:15-39` vs `apps/shell/src/mf-shim.js`
- Category: Maintainability
- Problem: Two implementations (defineProperty vs assignment), each load-bearing.
- Fix: Pick one. Inline-script in HTML is more reliable (synchronous before module scripts).

### EX-11. `bootstrap.tsx` hardcodes `HOST_ROUTES` instead of importing the JSON manifest
- Severity: **Medium**
- File: `apps/shell/src/bootstrap.tsx:16-19`
- Category: Architecture
- Problem: CLI generates `mfjs.routes.host.json`; shell hand-writes the same array. The JSON file is unused by the running app, only by tests/tooling.
- Fix: `import HOST_ROUTES from '../mfjs.routes.host.json' assert { type: 'json' };`. Type as `RouteTarget[]`.

### EX-12. Inline styles + repeated hex literals
- Severity: **Low**
- File: `bootstrap.tsx:50, 56, 65, 71`, `pages/index.tsx:41, 48, 56, 65`
- Category: Maintainability / a11y
- Problem: `#4f46e5`/`#1e1b4b`/`#6366f1` repeated; no contrast guarantee; cannot theme. Embodies UI-3.
- Fix: CSS variables / `@mfjs/ui` once it's real.

### EX-13. `mfjs.routes.ts` imports use `.tsx` extension
- Severity: **Low**
- File: `apps/dashboard/src/mfjs.routes.ts:6-8`
- Category: Bug (potential)
- Problem: `import("./pages/users/[id].tsx")` works in Rspack and in TS only because `apps/dashboard/tsconfig.json:14` enables `allowImportingTsExtensions`. Brittle if the flag is dropped.
- Fix: CLI route generator should emit extensionless paths or `.js`.

### EX-14. App tsconfigs don't extend any shared preset
- Severity: **Medium**
- File: `apps/dashboard/tsconfig.json:1-21`, `apps/shell/tsconfig.json:1-21`
- Category: DX
- Problem: Each re-declares `target`/`lib`/`module`/`strict`/`jsx`/`skipLibCheck`/etc. The whole point of `@mfjs/tsconfig/react.json` is to centralise this.
- Fix: `"extends": "@mfjs/tsconfig/react.json"`.

### EX-15. README install steps drift from package.json scripts
- Severity: **Medium**
- File: `examples/basic/README.md:14-25`
- Category: DX
- Problem: README recommends `pnpm -C ../../packages/cli dev -- --dir . --proxy-remotes`, but `package.json` script is just `pnpm dev`. Two paths, neither matches the e2e runner.
- Fix: Make README and scripts consistent — recommend `pnpm dev`.

---

## 10. `examples/ecommerce` and `examples/saas`

### EXS-1. `app.tsx` and `app.mjs` both committed with the same component
- Severity: **Medium**
- File: `examples/ecommerce/ssr/app.tsx`, `app.mjs` (also saas)
- Category: Maintainability
- Problem: `mfjs.ssr.json:11` imports `./ssr/app.mjs` (hand-rolled `React.createElement`). `app.tsx` exists for IDE/typing but is **not** loaded — they can diverge. No build step generating one from the other.
- Fix: Either add `tsc` step `app.tsx → app.mjs` and gitignore the output, or delete `.tsx` and keep `.mjs` only.

### EXS-2. `examples/ecommerce/ssr/app.tsx:63` — broken closing-paren indentation
- Severity: **Low**
- File: `examples/ecommerce/ssr/app.tsx:58-63`
- Category: Maintainability
- Problem: The final `)}` for the cart section is indented at the wrong level (visible visual mismatch). Reads correctly but jarring; suggests prettier wasn't run.
- Fix: Run `prettier`.

### EXS-3. SSG tests assert files but never run the export
- Severity: **High**
- File: `examples/ecommerce/test/ssg-export.test.ts:9-27`, `examples/saas/test/ssg-export.test.ts:9-25`
- Category: CI / Bug
- Problem: Tests read `dist-ssg/index.html` etc. — but no `beforeAll` runs `mfjs ssr export`. On clean checkout / fresh CI, every test fails with `ENOENT`. README says to run `pnpm ssr:export` first; Vitest's `test` script doesn't.
- Fix: `"test": "pnpm ssr:export && vitest run"`, or `beforeAll(async () => execSync('pnpm ssr:export'), 60_000)`.

### EXS-4. SSR examples share `prefederation`/`federation` scripts with no `mfjs.app.json`
- Severity: **Low**
- File: `examples/ecommerce/package.json:17-18`, saas same
- Category: DX
- Problem: `pnpm federation` here runs `node ../../packages/cli/dist/index.js federation --dir .` — but there's no `mfjs.app.json` to scan. Will fail.
- Fix: Remove these scripts from SSR-only examples.

### EXS-5. SSR examples lack scoped names
- Severity: **Low**
- File: all example `package.json`
- Category: Release
- Problem: `mfjs-example-ecommerce` (unscoped) — could clash with future user projects if `private` is ever flipped.
- Fix: Rename `@mfjs/example-*`; confirm `private: true`.

### EXS-6. `examples/README.md` index missing
- Severity: **Low**
- File: `examples/`
- Category: DX
- Problem: Three examples with very different shapes (federation vs SSR-only), no top-level index distinguishing them.
- Fix: Add `examples/README.md`.

---

## 11. `scripts/e2e.mjs`

### SC-1. Builds spawned without awaiting — race conditions guaranteed
- Severity: **Critical**
- File: `scripts/e2e.mjs:38-49`
- Category: Bug / CI
- Problem: `children.push(run('pnpm', ['-C', ..., 'build'], ...))` creates a child but **never awaits it before `runScenario` starts**. Lines 38-49 spawn six concurrent builds + `mfjs federation` + `mfjs routes`, then immediately fall through to writing `mfjs.federation.proxy.json` (which depends on the federation step finishing). Then `runScenario('direct')` starts dev servers depending on the artifacts. Works only by luck.
- Fix: Make `run()` return a `Promise<exitCode>`; `await Promise.all([...])` per phase.

### SC-2. `shell: false` breaks `pnpm` on Windows
- Severity: **High**
- File: `scripts/e2e.mjs:5-12`
- Category: Bug (Windows)
- Problem: On Windows, `pnpm` is a `.cmd` shim — `spawn('pnpm', [...], { shell: false })` fails with `ENOENT`. The repo lives on Windows (per `gitStatus`), so contributors hit this locally; CI on `ubuntu-latest` masks it.
- Fix: `shell: process.platform === 'win32'` or use `pnpm.cmd`.

### SC-3. `kill(child)` uses `SIGTERM` — Windows ignores it
- Severity: **Medium**
- File: `scripts/e2e.mjs:14-21`
- Category: Bug (Windows)
- Problem: Windows ignores `SIGTERM`; dev server keeps running, holds port 3000, next run fails.
- Fix: On Windows, `taskkill /pid <pid> /t /f` or use `tree-kill`.

### SC-4. `process.exit(0)` overrides earlier non-zero exit
- Severity: **Medium**
- File: `scripts/e2e.mjs:174`
- Category: CI
- Problem: After all scenarios, `process.exit(0)` is hard-coded. If `pnpm build` of the example failed at lines 170-171 (also unawaited!), e2e returns success.
- Fix: Capture build exit codes; `process.exit(allOk ? 0 : 1)`.

### SC-5. `MFJS_E2E !== '1'` early-exits with code 0 — silent skip
- Severity: **Low**
- File: `scripts/e2e.mjs:24-27`
- Category: CI
- Problem: A misconfigured CI without `MFJS_E2E=1` reports green.
- Fix: Document loudly; consider keeping exit 0 but printing a yellow warning.

### SC-6. `import.meta.url` `.pathname` produces `/C:/...` on Windows
- Severity: **High**
- File: `scripts/e2e.mjs:29, 31`
- Category: Bug (Windows)
- Problem: `new URL('../examples/basic/', import.meta.url).pathname` → `/C:/Users/...` on Windows. Passing that to `pnpm -C` breaks.
- Fix: `fileURLToPath(import.meta.url)` + `path.dirname` / `path.resolve`.

### SC-7. No retries / health probe before Playwright
- Severity: **Low**
- File: `scripts/e2e.mjs:73-87`
- Category: CI
- Problem: `wait-on -t 60000` is one-shot; no retry. Sporadic failures cascade.
- Fix: Wrap Playwright with `retries: process.env.CI ? 2 : 0`.

### SC-8. Scenario teardown doesn't await child exit
- Severity: **Medium**
- File: `scripts/e2e.mjs:159`
- Category: Bug
- Problem: `children.splice(0).forEach(kill)` is sync; doesn't wait for actual process exit. Next scenario starts while previous dev server is still releasing port 3000.
- Fix: Await each child's exit (with timeout race), then proceed.

---

## 12. `.github/workflows/release.yml`

### CI-1. No CI workflow — only release
- Severity: **Critical**
- File: `.github/workflows/`
- Category: CI
- Problem: One workflow only (`release.yml`). No `ci.yml` for PRs, so `pnpm lint`, `pnpm test`, `pnpm e2e` never run on incoming PRs. Bugs land on `main` unchallenged.
- Fix: Add `ci.yml` triggered on `pull_request` running install, build, lint, test, optionally `e2e:ci`. Cache pnpm store.

### CI-2. No matrix (Node, OS)
- Severity: **High**
- File: `.github/workflows/release.yml:28-32`
- Category: CI
- Problem: `node-version: 22` only. `windows-latest` not tested even though dev workstation is Windows. macOS not tested.
- Fix: `strategy.matrix.os: [ubuntu-latest, macos-latest, windows-latest]`, `node-version: [20, 22]` in CI workflow.

### CI-3. Release runs `pnpm -r test` — SSR examples flake without `dist-ssg/`
- Severity: **Medium**
- File: `.github/workflows/release.yml:38-40`
- Category: CI
- Problem: `pnpm -r test` runs vitest everywhere, including `examples/ecommerce/test/ssg-export.test.ts` which expects pre-built `dist-ssg/` (EXS-3). Release will fail on clean checkout.
- Fix: `pnpm -r --filter '!./examples/**' test` in release, or fix EXS-3 first.

### CI-4. No lint step in release workflow
- Severity: **Medium**
- File: `.github/workflows/release.yml`
- Category: CI
- Problem: `pnpm -r lint` not run anywhere (and CI-1 means it's not run on PRs either).
- Fix: Add `- run: pnpm -r lint` before `test`.

### CI-5. `NPM_TOKEN` + `id-token: write` simultaneously
- Severity: **Medium**
- File: `.github/workflows/release.yml:18, 51`
- Category: Security / Release
- Problem: Both static `NPM_TOKEN` and OIDC permissions configured. Static tokens are higher risk; if a workflow is compromised, the token leaks.
- Fix: Migrate to npm Trusted Publishing; drop `NPM_TOKEN`.

### CI-6. No JSON schema publishing
- Severity: **Medium**
- File: `.github/workflows/release.yml`
- Category: Release / DX
- Problem: MFJS config files (`mfjs.app.json`, `mfjs.federation.json`, `mfjs.ssr.json`, `mfjs.routes.json`, `mfjs.routes.host.json`) have no JSON Schema published anywhere — IDE intellisense for users is impossible.
- Fix: Generate schemas from `@mfjs/types` (`ts-json-schema-generator`); publish to `https://unpkg.com/@mfjs/types/schemas/*.json`; register on `schemastore.org`.

### CI-7. `concurrency.cancel-in-progress: false` undocumented
- Severity: **Low**
- File: `.github/workflows/release.yml:7-9`
- Category: CI
- Problem: Reasonable for releases (don't cancel mid-publish), but should be commented.
- Fix: Comment intent.

### CI-8. No build-artifact cache
- Severity: **Low**
- File: `.github/workflows/release.yml:24-31`
- Category: CI
- Problem: pnpm cache only; no caching for `dist/`.
- Fix: Optional `actions/cache` for `**/dist`.

---

## 13. `.changeset` & versioning

### CS-1. All packages in one `linked` group — every release bumps every version
- Severity: **High**
- File: `.changeset/config.json:6`
- Category: Release / DX
- Problem: `linked: [["@mfjs/cli", "@mfjs/runtime", "@mfjs/ssr", "@mfjs/event-bus", "@mfjs/state", "@mfjs/types", "@mfjs/ui", "@mfjs/events", "@mfjs/rspack-route-assets", "@mfjs/security", "@mfjs/observability"]]`. When one package bumps minor, all bump minor. Type-only `@mfjs/types` and runtime-coupled `@mfjs/runtime` shouldn't move in lockstep.
- Fix: Drop `linked`, or move only tightly coupled packages (e.g. `cli`/`runtime`/`ssr`) to `fixed`.

### CS-2. `initial-release.md` missing `@mfjs/security` and `@mfjs/observability`
- Severity: **Low**
- File: `.changeset/initial-release.md:1-13`
- Category: Release
- Problem: Both packages are in the `linked` array but not in this changeset's bump list. They'll start at `0.0.0`.
- Fix: Add them to the changeset.

### CS-3. `commit: false` — workflow commits manually
- Severity: **Low**
- File: `.changeset/config.json:5`, `.github/workflows/release.yml:47`
- Category: Release
- Problem: Fine; just confirm contributors don't manually `git commit` generated CHANGELOG.
- Fix: Document.

---

## 14. Workspace root

### W-1. `package.json:workspaces` and `pnpm-workspace.yaml` both present
- Severity: **Medium**
- File: `package.json:5-12` and `pnpm-workspace.yaml:1-7`
- Category: Maintainability
- Problem: pnpm reads `pnpm-workspace.yaml`; the `workspaces` array in `package.json` is ignored by pnpm but consumed by npm/yarn. Two sources of truth invite drift.
- Fix: Delete `package.json:workspaces` (pnpm-only repo).

### W-2. `pnpm dev` filters out `@mfjs/cli` but doesn't ensure libs are built first
- Severity: **High**
- File: `package.json:14`
- Category: DX / Bug
- Problem: `pnpm -r --parallel --filter '!@mfjs/cli' dev` runs all `dev` scripts in parallel. Example apps depend on `@mfjs/runtime/dist`, but the runtime's `dev` (likely `tsc --watch`) starts in parallel — race.
- Fix: Run `build:libs` first, or use turborepo/nx for dependency-aware orchestration.

### W-3. `vitest.config.ts` excludes `examples/**` from coverage but not from test discovery
- Severity: **Low**
- File: `vitest.config.ts:8-12`, `package.json:17`
- Category: CI
- Problem: Coverage excludes examples, but root `pnpm test` still runs them — failing per EXS-3.
- Fix: Align both.

### W-4. `playwright.config.ts` has `retries: 0` and no `webServer`
- Severity: **Medium**
- File: `playwright.config.ts:9, 1-14`
- Category: CI
- Problem: `retries: 0` means dev-server warmup flakes fail. No `webServer` config — relies on `scripts/e2e.mjs` (riddled with SC-1..SC-8 bugs).
- Fix: `retries: process.env.CI ? 2 : 0`. Migrate to Playwright's `webServer` config.

### W-5. `tsconfig.base.json` lacks project references
- Severity: **Medium**
- File: `tsconfig.base.json`
- Category: DX
- Problem: No `references: [...]` mapping libs. `tsc -b` from root has no dependency-aware build.
- Fix: Add a separate root `tsconfig.json` with `references`.

### W-6. No `engines` field
- Severity: **Low**
- File: root `package.json`
- Category: DX
- Problem: Pins `pnpm@9.15.5` via `packageManager` but no Node engine range. Users on Node 16/18 hit cryptic ESM errors.
- Fix: `"engines": { "node": ">=20" }`.

### W-7. No lint workflow
- Severity: **High**
- Category: CI
- Problem: `pnpm -r lint` defined but never invoked outside dev (CI-4 + CI-1 combined).
- Fix: See CI-1 + CI-4.

### W-8. `pnpm-workspace.yaml` glob `examples/*/apps/*` matches none of the SSR examples
- Severity: **Low**
- File: `pnpm-workspace.yaml:7`
- Category: Maintainability
- Problem: `examples/ecommerce/apps/*` doesn't exist; the glob silently no-ops there. Fine, but a typo in a future example path would also no-op.
- Fix: Document the glob's intent.

---

## Summary by Severity

| Severity | Approx. Count |
|---|---|
| Critical | 4 (UI-1, SC-1, CI-1, audit total includes 1 architectural) |
| High | 19 |
| Medium | 35 |
| Low | 22 |

**Total findings (this audit): 80.**

## Top 10 Quick Wins (highest impact, low effort)

1. **CI-1** — Add `.github/workflows/ci.yml` running build + lint + test on every PR.
2. **EX-1** — Add `data-testid="remote-loaded"` and `data-testid="nav-dashboard-settings"` to the example, fixing zero-match e2e specs.
3. **W-1 / W-2** — Delete `package.json:workspaces`; build libs before example `dev`.
4. **EV-2 / EX-8** — Delete duplicated `events.ts` files in apps; import from `@mfjs/events`.
5. **S-13 / EB-9 / EV-4 / T-10 / UI-6** — Add `exports`, `files`, `repository`, `description`, `license`, `keywords`, `sideEffects: false` to every publishable `package.json`.
6. **S-8 / EB-4** — Pin singleton registries to `globalThis`.
7. **S-11** — Fix `Unsubscribe` return-type bug (block-body arrow).
8. **SC-1 / SC-2 / SC-6** — Make `scripts/e2e.mjs` await builds; fix Windows shell + URL-pathname bugs.
9. **T-1** — Implement actual `container.get` validation in `validateFederationContract` (or rename existing to `...Keys`).
10. **UI-1** — Either delete `@mfjs/ui` or replace with an XSS-safe React `Button` and ship `peerDependencies`.

## Strategic Themes

- **Singleton fragility.** `@mfjs/state`, `@mfjs/event-bus`, `@mfjs/runtime` all depend on MF-singleton sharing working perfectly. Whenever it doesn't (mismatched versions, eager loading, dev/prod drift), state and events silently bifurcate. Pin every registry to `globalThis` and add a `getMfjsRegistryReport()` debug helper.
- **Demo-as-library bleed.** `@mfjs/events` ships demo event names; `examples/basic/src/events.ts` re-defines them locally; `bootstrap.tsx` hand-writes the host route table instead of consuming `mfjs.routes.host.json`. The framework→demo→user copy chain is muddy.
- **Release readiness.** `0.1.0` is about to ship from packages with no `exports`, no `repository`, no schema publishing, no PR-CI pipeline, hard-coded `NPM_TOKEN`, and one giant `linked` group. This is the highest-leverage cluster to fix before the first public release.
- **Windows hostility.** `scripts/e2e.mjs` cannot run on the maintainer's own platform. `playwright.config.ts` has no `webServer` config to bypass that script. Migrate to Playwright's native runner.
- **Plugin / runtime contract gaps.** `applyPlugins` only handles 2 of 3 documented hooks; `validateFederationContract` doesn't actually validate; `MfjsWorkspaceConfig.plugins` is `unknown[]`. The plugin/contract API surface is partly stubbed and will break under real third-party plugins.


---

# Cross-Project Top Priorities

Synthesized across all four audits (CLI, Runtime, SSR/Adapters, State/Libs/Examples). Fix in this order.

## Tier 0 — Ship-blocker for any 0.1.0 publish

1. **Bump versions, fill `package.json` metadata** for every publishable lib: `version`, `exports`, `files`, `repository`, `description`, `license`, `keywords`, `peerDependencies` (React on `@mfjs/runtime`/`@mfjs/ui`), `sideEffects: false`, `README.md`. Without this, `pnpm publish` produces unusable artifacts.
2. **Add `ci.yml`** running `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r test`, `pnpm -r build` on PRs; matrix Node 18/20/22; matrix Linux + Windows + macOS.
3. **Replace `Button(label) → string`** in `@mfjs/ui` with a real React component and unit tests — currently XSS-vulnerable, not even a JSX node.
4. **Fix `scripts/e2e.mjs`** — await spawned builds; restore `shell: true` for Windows pnpm; replace `URL.pathname` with `fileURLToPath`; use `tree-kill` for SIGTERM-equivalent.

## Tier 1 — Security & Correctness (production blockers)

5. **Sanitize all SSR HTML interpolation paths**: `render-to-string.ts:41`, `remote-ssr.ts:106-117`, `preload.ts:35-37`, 404 paths. Use `escapeHtml` from `@mfjs/security`. Re-throw `SsrRedirect` before generic catch.
6. **Origin allowlist + SRI at runtime remote load** (`remote-loader.ts:181-228`, `remote-registry.ts:45-54`). Wire `cfg.federation.allowlist`/`sri`/`csp` into the federation generator and `loadRemoteEntry`.
7. **Edge-runtime adapters** — replace `Buffer.from` (`csp.ts:116`) with `btoa`/`Uint8Array`; replace `node:crypto` (`sri.ts:1`) with `crypto.subtle`; split `@mfjs/ssr` into `@mfjs/ssr/edge` and `@mfjs/ssr/node` so Workers don't import `node:stream`.
8. **`mfjs.config.ts` loader** (`packages/cli/src/config.ts:67-93`) — surface load errors instead of `catch {}`; deep-merge JSON+TS instead of shallow spread; restrict to pre-transpiled JS or use `jiti`.
9. **Validate CLI string inputs** (`generate.ts:99-240`, `init.ts`, `ci.ts:24-178`): kebab-case regex + `JSON.stringify` for template substitution; YAML library or schema for workflow generation.

## Tier 2 — Reliability under load

10. **Dedupe `loadRemoteEntry`** in-flight calls (`remote-loader.ts:124-229`).
11. **Abort in-flight remote imports on rapid navigation** (`routing.tsx:283-298`).
12. **LRU + module-level caches** for `RemoteOutlet`, `useRemoteData`, `prefetch` (currently per-instance + unbounded).
13. **Process-singleton bleeding across SSR requests** — fix `server-router.ts:67-87`, `state` registries, `event-bus` global. Use `AsyncLocalStorage` or per-request context.
14. **`renderRouteToStream` timeout + observability** (`render-to-stream.ts:88-93`) — surface deferred Suspense errors through `@mfjs/observability`; `Promise.race` on `allReady`.
15. **ETag must be checked BEFORE render** (`edge-adapter.ts:72-77`) — keyed cache on `(method, pathname, lang, cookies-affecting)`.

## Tier 3 — Cross-platform / Windows

16. **Standardize on `execa` everywhere** — kill `spawn(..., { shell: false })` in `dev.ts`, `build.ts`. `pnpm.cmd` shim breaks on Windows today.
17. **Replace `SIGTERM`-only kills with `tree-kill`** + 3s SIGKILL escalation. Watch loop in `dev.ts:485-525` orphans Windows children.
18. **`fs.watch({recursive:true})`** unsupported on Linux (`routes.ts:232-237`). Fall back to `chokidar`.
19. **`process.chdir` race** in `generate.ts:462-486` and `scaffold.ts:26-35` — pass `--dir` explicitly to subcommands; never mutate cwd.

## Tier 4 — DX, Architecture, Missing Features

20. **Extract `discoverApps()`** — five files re-implement it (`build.ts`, `dev.ts`, `federation.ts`, `routes.ts`, `ci.ts`, `typecheck.ts`).
21. **Move generated `rspack.config.mjs` from string template into a real template file** (`generate.ts:99-240`) — currently 250 lines of unchecked stringified JS.
22. **Wire `cfg.federation.allowlist`/`sri`/`csp`** into actual generation + runtime — declared in types, never enforced.
23. **Schema publish** for `mfjs.config`, `mfjs.app`, `mfjs.federation`, `mfjs.ssr` — `init` template references `https://mfjs.dev/schemas/*` which 404s. Validate with Zod/AJV at load time.
24. **Unify routing models** — `RemoteOutlet`/`RouteTarget` vs `NestedRouter`/`NestedRoute` share no internals; merge.
25. **`@mfjs/state` middleware + persistence + devtools + SSR hydrate**; **`@mfjs/event-bus`** wildcard + replay + cross-tab sync.
26. **`@mfjs/observability`** error-boundary integration — `error-boundary.tsx` doesn't implement `componentDidCatch`.
27. **`@mfjs/types.validateFederationContract`** actually validates (currently only checks key strings start with `./`).
28. **Adapter packages** per `plan.md`: `@mfjs/adapter-vercel/-cloudflare/-node/-docker` published; `mfjs deploy --target=<adapter>` plugin-loaded.
29. **Global CLI flags**: `--cwd`, `-v/--verbose`, `--dry-run` on root program; consume from `command.parent?.opts()`. Unify on `--cwd` (vs current mix of `--dir`/`--cwd`).
30. **Test coverage** — 7 of 19 commands have zero unit tests (`diagnose`, `deploy`, `lint`, `test`, `env`, `sw`, `scaffold`). E2E spec references `data-testid` selectors that don't exist in the example app.

## Strategic themes (from the audits)

- The framework has solid building blocks (router, federation contracts, SSR primitives) but lacks the secure-by-default composition layer. A `createSecureEdgeAdapter()` that wires nonce → CSP → state injection → preload + SRI → metrics would close most production gaps in one helper.
- Three deploy adapters re-implement the same `Object.fromEntries(headers) → handler → new Response` shim with subtle divergence. Ship a shared `adapter-fetch` core; have Node/Vercel/Cloudflare specialize.
- Nearly every "feature gap" listed in `plan.md` and `improve.md` corresponds to at least one Critical or High finding above (config validation, security baseline, observability, runtime gaps, federation hardening, deploy adapters, testing). The roadmap is good — implementation has not caught up.
- Versioning, schemas, and CI are pre-publish blockers but they are *also* DX blockers: the `init` template emits a `$schema` URL that 404s, generated workspaces specify `pnpm@9.15.5` that will be wrong by the time Corepack defaults to pnpm 10, every package script falls back to `0.0.0`. Land Tier 0 first; everything else compounds on top of it.

*End of audit.*
