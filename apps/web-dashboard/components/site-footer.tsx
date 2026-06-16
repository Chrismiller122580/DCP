import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800 py-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <a
            href="https://www.directconnectpay.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dcp-teal hover:underline"
          >
            directconnectpay.com
          </a>
          <span className="hidden sm:inline text-zinc-700">|</span>
          <Link href="/domains" className="hover:text-dcp-teal transition-colors">
            Domains
          </Link>
          <Link href="/privacy" className="hover:text-dcp-teal transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-dcp-teal transition-colors">
            Terms
          </Link>
        </div>
        <p className="text-center md:text-right">
          Direct Connect Pay (DCP) Platform © {new Date().getFullYear()}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}