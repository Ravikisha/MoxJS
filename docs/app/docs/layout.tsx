import Link from 'next/link';
import { DOC_NAV } from './nav';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
      <aside className="hidden lg:block sticky top-20 self-start h-[calc(100vh-6rem)] overflow-y-auto pr-4 border-r border-zinc-200 dark:border-zinc-800">
        <nav className="space-y-6">
          {DOC_NAV.map((section) => (
            <div key={section.title}>
              <div className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
                {section.title}
              </div>
              <ul className="space-y-1">
                {section.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="block px-2 py-1 text-sm rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <article className="prose-mfjs min-w-0">{children}</article>
    </div>
  );
}
