import { Command } from 'commander';
import { execa } from 'execa';
import kleur from 'kleur';

export const testCommand = new Command('test')
  .description('Run vitest across the workspace.')
  .option('--coverage', 'Emit coverage reports')
  .option('--watch', 'Watch mode')
  .action(async (opts: { coverage?: boolean; watch?: boolean }) => {
    if (opts.watch) {
      await execa('pnpm', ['-r', '--parallel', 'vitest'], { stdio: 'inherit' });
      return;
    }
    const script = opts.coverage ? 'test:coverage' : 'test';
    try {
      await execa('pnpm', ['-r', script], { stdio: 'inherit' });
    } catch {
      console.error(kleur.red('tests failed'));
      process.exit(1);
    }
  });
