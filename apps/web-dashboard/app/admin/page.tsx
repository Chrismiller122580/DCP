'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

const DEFAULT_ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'dcp_admin_dev_key_1234567890';

interface Merchant {
  id: string;
  name: string;
  email: string;
  apiKeyMasked: string;
  webhookUrl?: string | null;
  hasWebhookSecret: boolean;
  kycVerified: boolean;
  invoiceCount: number;
  paidCount: number;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  invoiceId: string;
  eventType: string;
  url: string;
  status: string;
  attempts: number;
  createdAt: string;
}

export default function AdminPortalPage() {
  const [adminKey, setAdminKey] = useState(DEFAULT_ADMIN_KEY);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', email: '', webhookUrl: '', kycVerified: true });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', webhookUrl: '', kycVerified: false });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [m, d] = await Promise.all([
        apiFetch('/v1/admin/merchants', { adminKey }),
        apiFetch('/v1/admin/webhook-deliveries?limit=30', { adminKey }),
      ]);
      setMerchants(m);
      setDeliveries(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createMerchant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const created = await apiFetch('/v1/admin/merchants', {
        method: 'POST',
        adminKey,
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          webhookUrl: form.webhookUrl || undefined,
          kycVerified: form.kycVerified,
        }),
      });
      setNewKey(created.apiKey);
      setForm({ name: '', email: '', webhookUrl: '', kycVerified: true });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function saveEdit() {
    if (!editId) return;
    setError(null);
    try {
      await apiFetch(`/v1/admin/merchants/${editId}`, {
        method: 'PATCH',
        adminKey,
        body: JSON.stringify(editForm),
      });
      setEditId(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function rotateKey(id: string) {
    if (!confirm('Rotate API key? Old key stops working immediately.')) return;
    setError(null);
    try {
      const result = await apiFetch(`/v1/admin/merchants/${id}/rotate-key`, {
        method: 'POST',
        adminKey,
      });
      setNewKey(result.apiKey);
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  function startEdit(m: Merchant) {
    setEditId(m.id);
    setEditForm({
      name: m.name,
      webhookUrl: m.webhookUrl || '',
      kycVerified: m.kycVerified,
    });
  }

  return (
    <div className="min-h-screen text-white">
      <header className="dcp-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-[4.5rem] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90">
            <Image src="/brand/dcp-icon.png" alt="" width={40} height={40} className="rounded-lg" />
            <div>
              <div className="text-dcp-teal font-semibold">Admin Portal</div>
              <div className="text-[10px] text-dcp-cyan/70 tracking-widest">DIRECT CONNECT PAY</div>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-dcp-teal hover:text-dcp-cyan">Merchant Dashboard →</Link>
            <Link href="/settings" className="text-dcp-cyan hover:underline">API Connections</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <section className="dcp-hero p-6 mb-8 relative">
          <div className="relative z-10">
            <h1 className="text-2xl font-semibold text-white">Merchant & API Management</h1>
            <p className="text-dcp-teal/80 mt-1">Create merchants, manage API keys, webhooks, and monitor deliveries.</p>
          </div>
        </section>

        <div className="dcp-api-panel flex flex-wrap items-center gap-3 mb-8">
          <span className="stat-label">X-Admin-Key</span>
          <input
            className="input flex-1 min-w-[280px] mono text-xs"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
          />
          <button className="btn btn-secondary text-xs" onClick={load} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {newKey && (
          <div className="card p-4 mb-6 border-dcp-teal">
            <div className="stat-label mb-2">New API Key — copy now, shown once</div>
            <code className="mono text-dcp-cyan text-sm break-all">{newKey}</code>
            <button className="btn btn-secondary text-xs mt-3" onClick={() => { navigator.clipboard.writeText(newKey); }}>
              Copy Key
            </button>
            <button className="btn btn-secondary text-xs mt-3 ml-2" onClick={() => setNewKey(null)}>Dismiss</button>
          </div>
        )}

        {error && <div className="dcp-error p-4 mb-6 text-sm">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="card p-6 lg:col-span-1">
            <h2 className="font-semibold text-dcp-cyan mb-4">Create Merchant</h2>
            <form onSubmit={createMerchant} className="space-y-4">
              <div>
                <label className="label-dcp">Name</label>
                <input className="input w-full" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label-dcp">Email</label>
                <input className="input w-full" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label-dcp">Webhook URL</label>
                <input className="input w-full" placeholder="https://..." value={form.webhookUrl} onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-dcp-teal/80">
                <input type="checkbox" checked={form.kycVerified} onChange={(e) => setForm({ ...form, kycVerified: e.target.checked })} />
                KYC verified
              </label>
              <button type="submit" className="btn btn-primary w-full">Create + Issue API Key</button>
            </form>
          </div>

          <div className="card overflow-hidden lg:col-span-2 table-wrap">
            <div className="table-header-bar">
              <span className="font-semibold text-dcp-teal">Merchants ({merchants.length})</span>
            </div>
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>API Key</th>
                  <th>Invoices</th>
                  <th>KYC</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium">{m.name}</td>
                    <td className="text-sm text-zinc-400">{m.email}</td>
                    <td className="mono text-xs text-dcp-cyan">{m.apiKeyMasked}</td>
                    <td>
                      <span className="text-dcp-teal">{m.paidCount}</span>
                      <span className="text-zinc-500"> / {m.invoiceCount}</span>
                    </td>
                    <td>
                      <span className={m.kycVerified ? 'status status-paid' : 'status status-pending'}>
                        {m.kycVerified ? 'yes' : 'no'}
                      </span>
                    </td>
                    <td className="text-right space-x-1">
                      <button className="btn btn-secondary text-xs px-3 py-1" onClick={() => startEdit(m)}>Edit</button>
                      <button className="btn btn-secondary text-xs px-3 py-1" onClick={() => rotateKey(m.id)}>Rotate Key</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {editId && (
          <div className="fixed inset-0 dcp-modal-overlay flex items-center justify-center z-[100] p-4" onClick={() => setEditId(null)}>
            <div className="dcp-modal max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-dcp-teal mb-4">Edit Merchant</h3>
              <div className="space-y-4">
                <div>
                  <label className="label-dcp">Name</label>
                  <input className="input w-full" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="label-dcp">Webhook URL</label>
                  <input className="input w-full" value={editForm.webhookUrl} onChange={(e) => setEditForm({ ...editForm, webhookUrl: e.target.value })} />
                </div>
                <label className="flex items-center gap-2 text-sm text-dcp-teal/80">
                  <input type="checkbox" checked={editForm.kycVerified} onChange={(e) => setEditForm({ ...editForm, kycVerified: e.target.checked })} />
                  KYC verified
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button className="btn btn-primary flex-1" onClick={saveEdit}>Save</button>
                <button className="btn btn-secondary flex-1" onClick={() => setEditId(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="card overflow-hidden table-wrap">
          <div className="table-header-bar">
            <span className="font-semibold text-dcp-teal">Webhook Deliveries</span>
          </div>
          <table className="table w-full">
            <thead>
              <tr>
                <th>Event</th>
                <th>Invoice</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>URL</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-zinc-500">No deliveries yet</td></tr>
              )}
              {deliveries.map((d) => (
                <tr key={d.id}>
                  <td className="text-dcp-cyan text-sm">{d.eventType}</td>
                  <td className="mono text-xs">{d.invoiceId.slice(0, 10)}…</td>
                  <td><span className={d.status === 'delivered' ? 'status status-paid' : 'status status-pending'}>{d.status}</span></td>
                  <td>{d.attempts}</td>
                  <td className="text-xs text-zinc-400 truncate max-w-[200px]">{d.url}</td>
                  <td className="text-xs text-zinc-500">{new Date(d.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}