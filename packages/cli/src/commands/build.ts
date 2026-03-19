import { Command } from 'commander';
import path from 'node:path';
import fs from 'fs-extra';
import kleur from 'kleur';
import { spawnSync } from 'node:child_process';
import { compressDist } from './compress.js';

type AppMeta = {
  name: string;
  type: 'host' | 'remote';
  port: number;
};

function runBuild(cwd: string) {
  const result = spawnSync('pnpm', ['build'], {
    cwd,
    stdio: 'inherit',
    shell: false,
    env: process.env
  });

  if (result.status && result.status !== 0) {
    process.exitCode = result.status;
  }
}

export const buildCommand = new Command('build')
  .description('Build all apps under apps/* (those that have mfjs.app.json)')
  .option('-d, --dir <path>', 'Workspace root directory', process.cwd())
  .option(
    '--compress',
    'After building each app, generate .gz and .br assets in dist/ (defaults: JS/CSS/HTML/SVG/JSON/XML/TXT/MAP)',
    false
  )
  .option(
    '--compress-include <exts>',
    'Comma-separated list of file extensions to compress (example: .js,.css,.html)',
    '.js,.mjs,.cjs,.css,.html,.svg,.json,.xml,.txt,.map'
  )
  .option(
    '--compress-delete-original',
    'Delete original assets when compression is generated (useful only for CDN pipelines that serve precompressed assets)',
    false
  )
  .action(async (opts: { dir: string; compress: boolean; compressInclude: string; compressDeleteOriginal: boolean }) => {
    const workspaceDir = path.resolve(opts.dir);
    const appsDir = path.join(workspaceDir, 'apps');

    if (!(await fs.pathExists(appsDir))) {
      throw new Error(`No apps/ directory found in ${workspaceDir}`);
    }

    const appFolders = (await fs.readdir(appsDir)).filter((f) => !f.startsWith('.'));
    const appMetas: Array<{ dir: string; meta: AppMeta }> = [];

    for (const folder of appFolders) {
      const metaPath = path.join(appsDir, folder, 'mfjs.app.json');
      if (!(await fs.pathExists(metaPath))) continue;
      const meta = (await fs.readJson(metaPath)) as AppMeta;
      appMetas.push({ dir: path.join(appsDir, folder), meta });
    }

    if (appMetas.length === 0) {
      console.log(kleur.yellow('No apps found (missing mfjs.app.json).'));
      return;
    }

    const sorted = [...appMetas].sort((a, b) => (a.meta.type === 'host' ? -1 : 1) - (b.meta.type === 'host' ? -1 : 1));

    console.log(kleur.cyan(`Building ${sorted.length} app(s)...`));
    for (const app of sorted) {
      console.log(kleur.gray(`- ${app.meta.type} ${app.meta.name}`));
      runBuild(app.dir);
      if (process.exitCode && process.exitCode !== 0) return;

      if (opts.compress) {
        const distDir = path.join(app.dir, 'dist');
        const includeExts = opts.compressInclude
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        const existed = await fs.pathExists(distDir);
        if (!existed) {
          console.log(kleur.yellow(`  compress: skipping (missing ${path.relative(workspaceDir, distDir)})`));
        } else {
          const result = await compressDist(distDir, {
            includeExts,
            deleteOriginal: opts.compressDeleteOriginal,
          });
          console.log(
            kleur.gray(
              `  compress: wrote ${result.written} file(s) (${result.gzWritten} gz, ${result.brWritten} br), skipped ${result.skipped}`
            )
          );
        }
      }
    }

    console.log(kleur.green('Build complete.'));
  });
