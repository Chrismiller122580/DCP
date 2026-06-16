'use client';

import React, { useEffect, useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { AuthGuard } from '@/components/auth-guard';
import { apiFetch } from '@/lib/api';
import { getStoredApiKey } from '@/lib/auth';

interface MerchantProfile {
  id: string;
  name: string;
  email: string;
  apiKeyMasked: string;
  webhookUrl?: string | null;
  hasWebhookSecret: boolean;
  kycVerified: boolean;
  invoiceCount: number;
  paidCount: number;
}

interface ConnectionTest {
  ok: boolean;
  merchantName: string;
  apiReachable: boolean;
  healthStatus?: string;
  xrplConnected?: boolean;
  message: string;
  testedAt: string;
}

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [connection, setConnection] = useState<ConnectionTest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const me = await apiFetch('/v1/merchants/me', { apiKey });
      setProfile(me);
      setWebhookUrl(me.webhookUrl || '');
    } catch (e: any) {
      setError(e.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const key = getStoredApiKey();
    if (key) {
      setApiKey(key);
    }
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  async function saveWebhook(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const updated = await apiFetch('/v1/merchants/me', {
        method: 'PATCH',
        apiKey,
        body: JSON.stringify({ webhookUrl: webhookUrl || null }),
      });
      setProfile(updated);
      setSaved(true);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function testConnection() {
    setError(null);
    try {
      const result = await apiFetch('/v1/merchants/me/test-connection', {
        method: 'POST',
        apiKey,
      });
      setConnection(result);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <AuthGuard>
    <div className="min-h-screen text-white">
      <AppHeader subtitle="MERCHANT SETTINGS" active="settings" />

      <div className="max-w-3xl mx-auto px-6 py-8">
        <section className="dcp-hero p-6 mb-8 relative">
          <div className="relative z-10">
            <h1 className="text-2xl font-semibold">Connect Your Integration</h1>
            <p className="text-dcp-teal/80 mt-1">Verify API access, configure webhooks, and manage your merchant connection.</p>
          </div>
        </section>

        <div className="dcp-api-panel flex items-center justify-between gap-3 mb-6 text-sm">
          <span className="text-dcp-teal/80">Authenticated session · API key stored locally</span>
          <button className="btn btn-secondary text-xs" onClick={loadProfile} disabled={loading}>
            Refresh
          </button>
        </div>

        {error && <div className="dcp-error p-4 mb-6 text-sm">{error}</div>}
        {saved && <div className="card p-4 mb-6 text-dcp-teal text-sm">Webhook settings saved.</div>}

        {profile && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="font-semibold text-dcp-cyan mb-4">Merchant Profile</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-dcp-teal/70">Name</span><div className="font-medium">{profile.name}</div></div>
                <div><span className="text-dcp-teal/70">Email</span><div>{profile.email}</div></div>
                <div><span className="text-dcp-teal/70">API Key</span><div className="mono text-dcp-cyan">{profile.apiKeyMasked}</div></div>
                <div><span className="text-dcp-teal/70">KYC</span><div><span className={profile.kycVerified ? 'status status-paid' : 'status status-pending'}>{profile.kycVerified ? 'verified' : 'pending'}</span></div></div>
                <div><span className="text-dcp-teal/70">Invoices</span><div>{profile.invoiceCount} total · {profile.paidCount} paid</div></div>
                <div><span className="text-dcp-teal/70">Webhook Secret</span><div>{profile.hasWebhookSecret ? 'configured' : 'not set'}</div></div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-semibold text-dcp-cyan mb-4">Test API Connection</h2>
              <p className="text-sm text-zinc-400 mb-4">Pings <code className="text-dcp-teal">/v1/health</code> and validates your API key against the merchant record.</p>
              <button className="btn btn-primary" onClick={testConnection}>Run Connection Test</button>
              {connection && (
                <div className={`mt-4 p-4 rounded-xl border ${connection.ok ? 'border-[rgba(78,205,196,0.3)] bg-[rgba(78,205,196,0.08)]' : 'border-red-500/30 bg-red-500/10'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={connection.ok ? 'status status-paid' : 'status status-pending'}>
                      {connection.ok ? 'connected' : 'failed'}
                    </span>
                    <span className="text-sm text-dcp-teal">{connection.merchantName}</span>
                  </div>
                  <p className="text-sm text-zinc-300">{connection.message}</p>
                  <div className="text-xs text-zinc-500 mt-2 mono">
                    health={connection.healthStatus || 'n/a'} · xrpl={connection.xrplConnected ? 'up' : 'down'} · {connection.testedAt}
                  </div>
                </div>
              )}
            </div>

            <div className="card p-6">
              <h2 className="font-semibold text-dcp-cyan mb-4">Webhook Endpoint</h2>
              <form onSubmit={saveWebhook} className="space-y-4">
                <div>
                  <label className="label-dcp">Webhook URL</label>
                  <input
                    className="input w-full"
                    placeholder="https://your-server.com/webhooks/dcp"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>
                <p className="text-xs text-zinc-500">Payment confirmations are POSTed with HMAC signature (X-DCP-Signature). A secret is auto-generated when a URL is set.</p>
                <button type="submit" className="btn btn-primary">Save Webhook</button>
              </form>
            </div>

            <div className="card p-6">
              <h2 className="font-semibold text-dcp-cyan mb-3">Quick Start</h2>
              <pre className="dcp-uri-box mono text-xs overflow-x-auto whitespace-pre-wrap">{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/v1/invoices \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey.slice(0, 12)}..." \\
  -d '{"amount":"10.00","currency":"XRP","chain":"xrpl"}'`}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
    </AuthGuard>
  );
}