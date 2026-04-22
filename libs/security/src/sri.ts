import { createHash } from 'node:crypto';

export type SriAlgo = 'sha256' | 'sha384' | 'sha512';

export function sriHash(content: string | Buffer | Uint8Array, algo: SriAlgo = 'sha384'): string {
  const h = createHash(algo);
  if (typeof content === 'string') h.update(content, 'utf8');
  else h.update(content);
  return `${algo}-${h.digest('base64')}`;
}

export function sriAttributes(
  content: string | Buffer | Uint8Array,
  algo: SriAlgo = 'sha384',
  crossorigin: 'anonymous' | 'use-credentials' = 'anonymous',
): { integrity: string; crossorigin: string } {
  return { integrity: sriHash(content, algo), crossorigin };
}

export async function sriHashFromUrl(url: string, algo: SriAlgo = 'sha384'): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SRI fetch failed: ${url} (${res.status})`);
  const buf = new Uint8Array(await res.arrayBuffer());
  return sriHash(buf, algo);
}
