'use client';

import Image from 'next/image';
import Link from 'next/link';
import { clearSession, getStoredMerchantName } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/v1\/?$/, '')
    : '');

interface AppHeaderProps {
  subtitle?: string;
  active?: 'dashboard' | 'settings' | 'admin';
}

export function AppHeader({ subtitle = 'MERCHANT DASHBOARD', active = 'dashboard' }: AppHeaderProps) {
  const router = useRouter();
  const [merchantName, setMerchantName] = useState<string | null>(null);

  useEffect(() => {
    setMerchantName(getStoredMerchantName());
  }, []);

  function signOut() {
    clearSession();
    router.push('/login');
  }

  const linkClass = (key: AppHeaderProps['active']) =>
    key === active
      ? 'text-dcp-cyan font-medium'
      : 'text-dcp-teal hover:text-dcp-cyan transition-colors font-medium';

  return (
    <header className="dcp-header sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-[4.5rem] flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
          <Image
            src="/brand/dcp-icon.png"
            alt="Direct Connect Pay"
            width={48}
            height={48}
            className="rounded-xl shadow-lg shadow-[rgba(78,205,196,0.25)]"
            priority
          />
          <div>
            <Image
              src="/brand/dcp-logo-100.png"
              alt="Direct Connect Pay"
              width={140}
              height={42}
              className="h-8 w-auto brightness-110"
              priority
            />
            <div className="text-[11px] text-dcp-teal font-medium tracking-widest -mt-0.5">
              {subtitle}
              {merchantName ? ` · ${merchantName}` : ''}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className={linkClass('dashboard')}>
            Invoices
          </Link>
          <Link href="/settings" className={linkClass('settings')}>
            Settings
          </Link>
          <Link href="/admin" className={linkClass('admin')}>
            Admin
          </Link>
          {API_ORIGIN ? (
            <a
              href={`${API_ORIGIN}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dcp-teal hover:text-dcp-cyan transition-colors font-medium hidden sm:inline"
            >
              API Docs →
            </a>
          ) : null}
          <div className="h-3 w-px bg-zinc-700 hidden sm:block" />
          <button
            type="button"
            onClick={signOut}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}