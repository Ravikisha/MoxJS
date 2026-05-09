import { Command } from 'commander';
import path from 'node:path';
import fs from 'fs-extra';
import kleur from 'kleur';
import { execa } from 'execa';
import { compressDist } from './compress.js';
import { loadWorkspaceConfig } from '../config.js';

type AppMeta = {
  name: string;
  type: 'host' | 'remote';
  port: number;
};

async function runBuild(cwd: string, signal: AbortSignal): Promise<void> {
  // execa handles Windows .cmd shims correctly without shell:true.
  await execa('pnpm', ['build'], {
    cwd,
    stdio: 'inherit',
    env: process.env,
    cancelSignal: signal,
  });
}

export const buildCommand = new Command('build')
  .description('Build all apps under apps/* (those that have mfjs.app.json)')
  .option('-d, --dir <path>', 'Workspace root directory', process.cwd())
  .option(
    '--compress',
    'After building each app, generate .gz and .br assets in dist/ (defaults: JS/CSS/HTML/SVG/JSON/XML/TXT/MAP)',
    false,
  )
  .option(
    '--no-compress',
    'Disable compression (overrides workspace `build.compress`).',
  )
  .option(
    '--compress-include <exts>',
    'Comma-separated list of file extensions to compress (example: .js,.css,.html)',
    '.js,.mjs,.cjs,.css,.html,.svg,.json,.xml,.txt,.map',
  )
  .option(
    '--compress-delete-original',
    'Delete original assets when compression is generated (useful only for CDN pipelines that serve precompressed assets)',
    false,
  )
  .option('--allow-empty', 'Exit 0 even when no apps are present.', false)
  .action(
    async (opts: {
      dir: string;
      compress: boolean | undefined;
      compressInclude: string;
      compressDeleteOriginal: boolean;
      allowEmpty: boolean;
    }) => {
      const workspaceDir = path.resolve(opts.dir);
      const appsDir = path.join(workspaceDir, 'apps');

      if (!(await fs.pathExists(appsDir))) {
        throw new Error(`No apps/ directory found in ${workspaceDir}`);
      }

      const { cfg } = await loadWorkspaceConfig(workspaceDir);
      // Workspace config gives a default; CLI flag wins when set.
      const compressEnabled = opts.compress ?? cfg.build?.compress ?? false;

      const appFolders = (await fs.readdir(appsDir)).filter((f) => !f.startsWith('.'));
      const appMetas: Array<{ dir: string; meta: AppMeta }> = [];

      for (const folder of appFolders) {
        const metaPath = path.join(appsDir, folder, 'mfjs.app.json');
        if (!(await fs.pathExists(metaPath))) continue;
        const meta = (await fs.readJson(metaPath)) as AppMeta;
        appMetas.push({ dir: path.join(appsDir, folder), meta });
      }

      if (appMetas.length === 0) {
        if (opts.allowEmpty) {
          console.log(kleur.yellow('No apps found — exiting cleanly (--allow-empty).'));
          return;
        }
        console.error(kleur.yellow('No apps found (missing mfjs.app.json).'));
        process.exitCode = 2;
        return;
      }

      const sorted = [...appMetas].sort((a, b) =>
        (a.meta.type === 'host' ? -1 : 1) - (b.meta.type === 'host' ? -1 : 1),
      );

      console.log(kleur.cyan(`Building ${sorted.length} app(s)...`));

      const ac = new AbortController();
      const onSig = (sig: NodeJS.Signals) => {
        console.log(kleur.yellow(`\nReceived ${sig}, cancelling build.`));
        ac.abort();
      };
      process.once('SIGINT', () => onSig('SIGINT'));
      process.once('SIGTERM', () => onSig('SIGTERM'));

      for (const app of sorted) {
        console.log(kleur.gray(`- ${app.meta.type} ${app.meta.name}`));
        try {
          await runBuild(app.dir, ac.signal);
        } catch (err) {
          process.exitCode = 1;
          console.error(kleur.red(`Build failed in ${app.meta.name}: ${(err as Error).message}`));
          return;
        }

        if (compressEnabled) {
          const distDir = path.join(app.dir, 'dist');
          const includeExts = opts.compressInclude
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

          if (!(await fs.pathExists(distDir))) {
            console.log(
              kleur.yellow(`  compress: skipping (missing ${path.relative(workspaceDir, distDir)})`),
            );
          } else {
            const result = await compressDist(distDir, {
              includeExts,
              deleteOriginal: opts.compressDeleteOriginal,
            });
            console.log(
              kleur.gray(
                `  compress: wrote ${result.written} file(s) (${result.gzWritten} gz, ${result.brWritten} br), skipped ${result.skipped}`,
              ),
            );
          }
        }
      }

      console.log(kleur.green('Build complete.'));
    },
  );
