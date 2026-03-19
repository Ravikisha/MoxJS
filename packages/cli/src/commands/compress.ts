import path from 'node:path';
import fs from 'fs-extra';
import zlib from 'node:zlib';

export type CompressDistOptions = {
  includeExts: string[];
  /** If true, remove the original asset after writing compressed variants. */
  deleteOriginal?: boolean;
  /** If true, overwrite existing .gz/.br files. Default: false. */
  force?: boolean;
};

export type CompressDistResult = {
  written: number;
  skipped: number;
  gzWritten: number;
  brWritten: number;
};

function normalizeExt(ext: string) {
  if (!ext) return ext;
  return ext.startsWith('.') ? ext : `.${ext}`;
}

function shouldInclude(filePath: string, includeExts: string[]) {
  const ext = path.extname(filePath);
  return includeExts.includes(ext);
}

async function listFilesRecursive(dir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(d: string) {
    const entries = await fs.readdir(d);
    for (const e of entries) {
      const full = path.join(d, e);
      const st = await fs.stat(full);
      if (st.isDirectory()) await walk(full);
      else out.push(full);
    }
  }
  await walk(dir);
  return out;
}

async function writeIfNeeded(
  outPath: string,
  data: Buffer,
  opts: { force?: boolean }
): Promise<'written' | 'skipped'> {
  if (!opts.force) {
    const exists = await fs.pathExists(outPath);
    if (exists) return 'skipped';
  }
  await fs.outputFile(outPath, data);
  return 'written';
}

/**
 * Generate precompressed `.gz` and `.br` variants for assets under a dist folder.
 *
 * This is intended for static hosting/CDNs that support precompressed assets.
 */
export async function compressDist(
  distDir: string,
  opts: CompressDistOptions
): Promise<CompressDistResult> {
  const includeExts = opts.includeExts.map(normalizeExt);
  const files = await listFilesRecursive(distDir);

  let written = 0;
  let skipped = 0;
  let gzWritten = 0;
  let brWritten = 0;

  for (const full of files) {
    const rel = path.relative(distDir, full);

    // Skip already-compressed variants.
    if (rel.endsWith('.gz') || rel.endsWith('.br')) continue;

    if (!shouldInclude(full, includeExts)) continue;

    const buf = await fs.readFile(full);

    const gz = zlib.gzipSync(buf, { level: 9 });
    const br = zlib.brotliCompressSync(buf, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      },
    });

    const gzPath = `${full}.gz`;
    const brPath = `${full}.br`;

  const writeOpts = opts.force === undefined ? {} : { force: opts.force };
  const gzRes = await writeIfNeeded(gzPath, gz, writeOpts);
  const brRes = await writeIfNeeded(brPath, br, writeOpts);

    if (gzRes === 'written') {
      written += 1;
      gzWritten += 1;
    } else skipped += 1;

    if (brRes === 'written') {
      written += 1;
      brWritten += 1;
    } else skipped += 1;

    if (opts.deleteOriginal) {
      await fs.remove(full);
    }
  }

  return { written, skipped, gzWritten, brWritten };
}
