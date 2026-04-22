import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'MFJS — Micro-Frontend Framework',
    template: '%s | MFJS',
  },
  description:
    'Opinionated micro-frontend framework built on Rspack Module Federation. Zero-config, SSR-ready, typed contracts.',
  metadataBase: new URL('https://mfjs.dev'),
  openGraph: {
    title: 'MFJS — Micro-Frontend Framework',
    description:
      'Zero-config federation, file-based routing, SSR, observability, and edge deploys — the Next.js-level DX for micro-frontends.',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <TopBar />
        <div className="flex-1 w-full">{children}</div>
        <Footer />
      </body>
    </html>
  );
}

function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
          <span>MFJS</span>
          <span className="hidden sm:inline text-xs font-normal text-zinc-500 ml-2">v0.1.0</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/docs/getting-started" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            Docs
          </Link>
          <Link href="/docs/cli" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            CLI
          </Link>
          <Link href="/docs/api/runtime" className="hover:text-indigo-600 dark:hover:text-indigo-400">
            API
          </Link>
          <a
            href="https://github.com/mfjs/mfjs"
            className="hover:text-indigo-600 dark:hover:text-indigo-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-zinc-600 dark:text-zinc-400 flex flex-col md:flex-row md:justify-between gap-4">
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">MFJS</p>
          <p className="mt-1">Micro-frontend framework on Rspack Module Federation.</p>
        </div>
        <div className="flex gap-6">
          <Link href="/docs/getting-started" className="hover:underline">
            Getting started
          </Link>
          <Link href="/docs/production-checklist" className="hover:underline">
            Production
          </Link>
          <a href="https://github.com/mfjs/mfjs" className="hover:underline">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
