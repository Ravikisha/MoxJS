import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <h1>Page not found</h1>
      <p>
        No doc matches this URL.{' '}
        <Link href="/docs">Return to the docs index</Link>.
      </p>
    </>
  );
}
