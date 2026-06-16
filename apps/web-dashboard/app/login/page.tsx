'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getDevApiKey, getStoredApiKey, saveSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredApiKey();
    if (stored) {
      router.replace('/dashboard');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const merchant = await apiFetch('/v1/merchants/me', { apiKey: apiKey.trim() });
      saveSession(apiKey.trim(), merchant.name);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid API key';
      setError(msg.includes('401') ? 'Invalid API key. Check your credentials or complete onboarding.' : msg);
    } finally {
      setLoading(false);
    }
  }

  function useDevKey() {
    setApiKey(getDevApiKey());
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-3 mb-10 hover:opacity-90 transition-opacity">
            <Image src="/brand/dcp-icon.png" alt="" width={40} height={40} className="rounded-xl" />
            <Image src="/brand/dcp-logo-100.png" alt="Direct Connect Pay" width={120} height={36} className="h-7 w-auto" />
          </Link>

          <div className="card p-8">
            <h1 className="text-2xl font-semibold text-white">Sign in</h1>
            <p className="text-zinc-400 text-sm mt-2">
              Enter your merchant API key to access the dashboard.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="apiKey" className="label-dcp">
                  API key
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="input w-full mono text-sm"
                  placeholder="dcp_..."
                  required
                  autoComplete="off"
                />
              </div>

              {error ? <div className="dcp-error px-4 py-3 text-sm">{error}</div> : null}

              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                {loading ? 'Verifying…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-800 text-center text-sm text-zinc-500 space-y-3">
              <p>
                New to DCP?{' '}
                <Link href="/onboarding" className="text-dcp-teal hover:underline">
                  Complete onboarding
                </Link>
              </p>
              <button type="button" onClick={useDevKey} className="text-xs text-dcp-cyan hover:underline">
                Use dev key for local testing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}