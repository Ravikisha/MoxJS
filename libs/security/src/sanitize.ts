const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#47;',
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"'/]/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}

const LS_CHAR = String.fromCharCode(0x2028);
const PS_CHAR = String.fromCharCode(0x2029);

export function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .split(LS_CHAR)
    .join('\\u2028')
    .split(PS_CHAR)
    .join('\\u2029');
}

const SAFE_PATHNAME = /^\/[A-Za-z0-9\-._~!$&'()*+,;=:@/%?#]*$/;

export function isSafePathname(p: string): boolean {
  return SAFE_PATHNAME.test(p) && !p.includes('..');
}
