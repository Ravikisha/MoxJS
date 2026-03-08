---
title: CI/CD Automation
description: Automate builds, tests, previews, and deployments for your MFJS monorepo using the built-in CI/CD commands.
---

MFJS ships with first-class CI/CD tooling under the `mfjs ci` command family. It generates ready-to-use GitHub Actions workflows, detects which apps were affected by a change, and scaffolds PR preview and production deployment pipelines.

## Quick Start

If you created your workspace with `mfjs init`, all three workflows are already in `.github/workflows/`. If you added CI later, run:

```bash
mfjs ci generate
```

This writes three workflow files into the current directory:

| File | Trigger | Purpose |
|---|---|---|
| `.github/workflows/ci.yml` | `push` / `pull_request` | Type-check + test, then build affected apps |
| `.github/workflows/pr-preview.yml` | `pull_request` | Deploy a preview to Netlify and comment the URL |
| `.github/workflows/deploy.yml` | `push` to `main` | Production deploy (Netlify / S3 / Azure) |

---

## `mfjs ci generate`

Generates all three workflow files.

```bash
mfjs ci generate [options]
```

### Options

| Flag | Default | Description |
|---|---|---|
| `--dir <path>` | `.` | Output directory (project root) |
| `--node <version>` | `22` | Node.js version string used in workflows |
| `--package-manager <pm>` | `pnpm` | Package manager (`pnpm`, `npm`, `yarn`) |
| `--deploy-target <target>` | `netlify` | Production deploy target: `netlify`, `s3`, or `azure` |
| `--no-preview` | — | Skip generating `pr-preview.yml` |
| `--no-deploy` | — | Skip generating `deploy.yml` |

### Examples

```bash
# Default — generates all three workflows (Netlify)
mfjs ci generate

# Use npm and deploy to S3
mfjs ci generate --package-manager npm --deploy-target s3

# Only generate ci.yml (skip preview and deploy)
mfjs ci generate --no-preview --no-deploy

# Target a specific subdirectory
mfjs ci generate --dir ./infra/ci
```

---

## `mfjs ci affected`

Detects which apps changed between two Git refs by inspecting `apps/` and `packages/` paths in `git diff`. Use this in CI pipelines to skip rebuilding apps that haven't changed.

```bash
mfjs ci affected [options]
```

### Options

| Flag | Default | Description |
|---|---|---|
| `--dir <path>` | `.` | Workspace root to run git diff from |
| `--base <ref>` | `HEAD~1` | Base Git ref for the diff |
| `--head <ref>` | `HEAD` | Head Git ref for the diff |
| `--format <fmt>` | `text` | Output format: `text` (newline-separated) or `json` (JSON array) |

### Examples

```bash
# List affected apps between last two commits
mfjs ci affected

# Compare current branch against main
mfjs ci affected --base origin/main --head HEAD

# Output JSON (useful inside GitHub Actions with fromJSON)
mfjs ci affected --format json
```

### Using in a GitHub Actions Matrix

The generated `ci.yml` already wires this up. The pattern is:

```yaml
- name: Get affected apps
  id: affected
  run: echo "apps=$(mfjs ci affected --format json)" >> $GITHUB_OUTPUT

- name: Build affected apps
  if: steps.affected.outputs.apps != '[]'
  strategy:
    matrix:
      app: ${{ fromJSON(steps.affected.outputs.apps) }}
  run: mfjs build --app ${{ matrix.app }}
```

Any change under `packages/` (shared libraries) marks **all** apps as affected.

---

## `mfjs ci preview`

Generates only the PR preview workflow (`pr-preview.yml`).

```bash
mfjs ci preview [options]
```

### Options

| Flag | Default | Description |
|---|---|---|
| `--dir <path>` | `.` | Output directory |
| `--node <version>` | `22` | Node.js version |
| `--package-manager <pm>` | `pnpm` | Package manager |

The generated workflow:
1. Builds all apps on every pull request
2. Deploys the build output to Netlify
3. Posts the preview URL as a PR comment via `nwtgck/actions-netlify`

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `NETLIFY_AUTH_TOKEN` | Personal access token from Netlify |
| `NETLIFY_SITE_ID` | Site ID from your Netlify dashboard |

---

## Deployment Targets

### Netlify (default)

Uses [`nwtgck/actions-netlify`](https://github.com/nwtgck/actions-netlify). Requires `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` secrets.

```bash
mfjs ci generate --deploy-target netlify
```

### AWS S3 + CloudFront

Syncs `dist/` to an S3 bucket and invalidates a CloudFront distribution. Requires:

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret key |
| `AWS_REGION` | e.g. `us-east-1` |
| `S3_BUCKET` | e.g. `my-mfjs-app` |
| `CLOUDFRONT_DISTRIBUTION_ID` | e.g. `E1EXAMPLE` |

```bash
mfjs ci generate --deploy-target s3
```

### Azure Static Web Apps

Uses [`Azure/static-web-apps-deploy`](https://github.com/Azure/static-web-apps-deploy). Requires:

| Secret | Description |
|---|---|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token from Azure portal |

```bash
mfjs ci generate --deploy-target azure
```

---

## Scaffolded by `mfjs init`

When you run `mfjs init <name>`, all CI/CD files are scaffolded automatically alongside the standard workspace files:

```
my-workspace/
├── .github/
│   └── workflows/
│       ├── ci.yml          ← quality + affected build
│       ├── pr-preview.yml  ← Netlify PR preview
│       └── deploy.yml      ← production deploy (netlify)
├── tsconfig.base.json
├── .gitignore
├── package.json            ← includes typecheck + ci:affected scripts
└── ...
```

The root `package.json` also gets two convenience scripts:

```json
{
  "scripts": {
    "typecheck": "mfjs typecheck",
    "ci:affected": "mfjs ci affected"
  }
}
```
