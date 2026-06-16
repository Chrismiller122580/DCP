'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { saveSession } from '@/lib/auth';

const STEPS = ['Business', 'Webhooks', 'Review', 'API key'] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [skipWebhook, setSkipWebhook] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState<string | null>(null);

  function nextStep() {
    setError(null);
    if (step === 0 && (!name.trim() || !email.trim())) {
      setError('Business name and email are required.');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prevStep() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function createAccount() {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch('/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          webhookUrl: skipWebhook || !webhookUrl.trim() ? undefined : webhookUrl.trim(),
        }),
      });
      setApiKey(result.apiKey);
      setMerchantId(result.id);
      saveSession(result.apiKey, result.name);
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg.includes('already exists') ? 'An account with this email already exists. Try signing in.' : msg);
    } finally {
      setLoading(false);
    }
  }

  function copyKey() {
    if (apiKey) navigator.clipboard.writeText(apiKey);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="dcp-header">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/brand/dcp-icon.png" alt="" width={36} height={36} className="rounded-lg" />
            <span className="text-sm text-dcp-teal font-medium tracking-wide">MERCHANT ONBOARDING</span>
          </Link>
          <Link href="/login" className="text-sm text-zinc-400 hover:text-dcp-teal">
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        {/* Progress */}
        <div className="flex gap-2 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1 rounded-full transition-colors ${
                  i <= step ? 'bg-dcp-teal' : 'bg-zinc-800'
                }`}
              />
              <div className={`text-[10px] mt-2 uppercase tracking-wider ${i <= step ? 'text-dcp-teal' : 'text-zinc-600'}`}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="card p-8">
          {step === 0 && (
            <>
              <h1 className="text-2xl font-semibold">Tell us about your business</h1>
              <p className="text-zinc-400 text-sm mt-2">We&apos;ll use this to set up your merchant profile and API access.</p>
              <div className="mt-8 space-y-5">
                <div>
                  <label className="label-dcp">Business name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input w-full"
                    placeholder="Acme Corp"
                    required
                  />
                </div>
                <div>
                  <label className="label-dcp">Work email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input w-full"
                    placeholder="you@company.com"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-2xl font-semibold">Webhook notifications</h1>
              <p className="text-zinc-400 text-sm mt-2">
                Receive <code className="text-dcp-cyan">payment.confirmed</code> events when invoices are paid.
                You can configure this later in Settings.
              </p>
              <div className="mt-8 space-y-5">
                <div>
                  <label className="label-dcp">Webhook URL (optional)</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    disabled={skipWebhook}
                    className="input w-full mono text-sm"
                    placeholder="https://api.yoursite.com/webhooks/dcp"
                  />
                </div>
                <label className="flex items-center gap-3 text-sm text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipWebhook}
                    onChange={(e) => setSkipWebhook(e.target.checked)}
                    className="rounded border-zinc-600"
                  />
                  Skip for now — I&apos;ll add this in Settings
                </label>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-semibold">Review & create account</h1>
              <p className="text-zinc-400 text-sm mt-2">Confirm your details before we issue your API key.</p>
              <dl className="mt-8 space-y-4 text-sm">
                <div className="flex justify-between dcp-detail-row pb-3">
                  <dt className="text-dcp-teal/70">Business</dt>
                  <dd className="font-medium">{name}</dd>
                </div>
                <div className="flex justify-between dcp-detail-row pb-3">
                  <dt className="text-dcp-teal/70">Email</dt>
                  <dd>{email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-dcp-teal/70">Webhook</dt>
                  <dd className="mono text-xs text-right max-w-[60%] break-all">
                    {skipWebhook || !webhookUrl ? 'Not configured' : webhookUrl}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-zinc-500 mt-6">
                By creating an account you agree to our{' '}
                <Link href="/terms" className="text-dcp-teal hover:underline" target="_blank">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-dcp-teal hover:underline" target="_blank">
                  Privacy Policy
                </Link>
                . KYC verification can be enabled by an administrator when you go live.
              </p>
            </>
          )}

          {step === 3 && apiKey && (
            <>
              <h1 className="text-2xl font-semibold text-dcp-teal">You&apos;re all set</h1>
              <p className="text-zinc-400 text-sm mt-2">
                Save your API key now — it won&apos;t be shown again. Merchant ID:{' '}
                <span className="mono text-dcp-cyan">{merchantId}</span>
              </p>
              <div className="mt-8 glass-cyan rounded-xl p-4">
                <div className="text-xs text-dcp-teal/70 uppercase tracking-wider mb-2">Your API key</div>
                <div className="mono text-sm break-all text-white">{apiKey}</div>
                <button type="button" onClick={copyKey} className="btn btn-secondary text-xs mt-4">
                  Copy to clipboard
                </button>
              </div>
              <ul className="mt-6 text-sm text-zinc-400 space-y-2 list-disc list-inside">
                <li>Use this key in the <code className="text-dcp-cyan">X-API-Key</code> header</li>
                <li>Create your first invoice from the dashboard</li>
                <li>Configure webhooks anytime under Settings</li>
              </ul>
            </>
          )}

          {error ? <div className="dcp-error px-4 py-3 text-sm mt-6">{error}</div> : null}

          <div className="mt-8 flex gap-3">
            {step > 0 && step < 3 ? (
              <button type="button" onClick={prevStep} className="btn btn-secondary">
                Back
              </button>
            ) : null}

            {step < 2 ? (
              <button type="button" onClick={nextStep} className="btn btn-primary flex-1">
                Continue
              </button>
            ) : null}

            {step === 2 ? (
              <button type="button" onClick={createAccount} disabled={loading} className="btn btn-primary flex-1">
                {loading ? 'Creating account…' : 'Create merchant account'}
              </button>
            ) : null}

            {step === 3 ? (
              <button type="button" onClick={() => router.push('/dashboard')} className="btn btn-primary flex-1">
                Open dashboard
              </button>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}