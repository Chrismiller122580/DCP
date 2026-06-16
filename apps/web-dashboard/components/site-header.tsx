'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getStoredApiKey } from '@/lib/auth';
import { useEffect, useState } from 'react';

export function SiteHeader() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getStoredApiKey());
  }, []);

  return (
    <header className="dcp-header sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-[4.5rem] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
          <Image
            src="/brand/dcp-icon.png"
            alt="Direct Connect Pay"
            width={44}
            height={44}
            className="rounded-xl shadow-lg shadow-[rgba(78,205,196,0.25)]"
            priority
          />
          <Image
            src="/brand/dcp-logo-100.png"
            alt="Direct Connect Pay"
            width={130}
            height={40}
            className="h-7 w-auto brightness-110 hidden sm:block"
            priority
          />
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <a href="#features" className="hidden md:inline text-zinc-400 hover:text-dcp-teal transition-colors">
            Features
          </a>
          <a href="#chains" className="hidden md:inline text-zinc-400 hover:text-dcp-teal transition-colors">
            Chains
          </a>
          {loggedIn ? (
            <Link href="/dashboard" className="btn btn-primary text-sm py-2 px-4">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-dcp-teal hover:text-dcp-cyan transition-colors font-medium">
                Sign in
              </Link>
              <Link href="/onboarding" className="btn btn-primary text-sm py-2 px-4">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}