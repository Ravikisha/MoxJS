import Link from 'next/link';
import { DOC_NAV } from './nav';

export const metadata = { title: 'Documentation' };

export default function DocsIndex() {
  return (
    <>
      <h1>MFJS documentation</h1>
      <p>
        Everything you need to build, deploy, and operate production micro-frontends on MFJS. Start with{' '}
        <Link href="/docs/getting-started">Getting started</Link> or jump to a topic below.
      </p>

      {DOC_NAV.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <ul>
            {section.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
