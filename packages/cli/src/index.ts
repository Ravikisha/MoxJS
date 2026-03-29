#!/usr/bin/env node
import { Command } from 'commander';
import kleur from 'kleur';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { initCommand } from './commands/init.js';
import { generateCommand } from './commands/generate.js';
import { devCommand } from './commands/dev.js';
import { buildCommand } from './commands/build.js';
import { federationCommand } from './commands/federation.js';
import { routesCommand } from './commands/routes.js';
import { ssrCommand } from './commands/ssr.js';
import { typecheckCommand } from './commands/typecheck.js';
import { ciCommand } from './commands/ci.js';
import { perfCommand } from './commands/perf.js';
import { lazyCommand } from './commands/lazy.js';
import { imageCommand } from './commands/image.js';
import { scaffoldCommand } from './commands/scaffold.js';
import { printCliError } from './errors.js';

export const program = new Command();

function getCliVersion(): string {
  try {
    const req = createRequire(import.meta.url);
    // package.json sits one level up from src/
    const pkg = req('../package.json') as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}


program
  .name('mfjs')
  .description('MFJS CLI (micro-frontend framework)')
  .version(getCliVersion());

program.addCommand(initCommand);
program.addCommand(generateCommand);
program.addCommand(devCommand);
program.addCommand(buildCommand);
program.addCommand(federationCommand);
program.addCommand(routesCommand);
program.addCommand(ssrCommand);
program.addCommand(typecheckCommand);
program.addCommand(ciCommand);
program.addCommand(perfCommand);
program.addCommand(lazyCommand);
program.addCommand(imageCommand);
program.addCommand(scaffoldCommand);

program.showHelpAfterError();

// Only parse argv when invoked via the CLI bin. When imported (tests, other
// programmatic use), consumers should call program.parse/parseAsync themselves.
//
// Heuristic: when Node executes this file as the entrypoint, `process.argv[1]`
// points at this file. When it's imported, argv[1] points elsewhere.
const isDirectInvocation = (() => {
  try {
    return path.resolve(process.argv[1] ?? '') === path.resolve(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (isDirectInvocation) {
  try {
    program.parse(process.argv);
  } catch (err) {
  printCliError(err);
  }
}
