import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen text-white flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 md:py-16">
        <Link href="/" className="text-sm text-dcp-teal hover:underline">
          ← Back to home
        </Link>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mt-6">{title}</h1>
        <p className="text-sm text-zinc-500 mt-2">Last updated: {lastUpdated}</p>
        <div className="legal-prose mt-10">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}