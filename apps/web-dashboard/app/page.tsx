'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface Invoice {
  id: string;
  merchantId: string;
  amount: string;
  currency: string;
  chain: string;
  destinationAddress: string;
  destinationTag?: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  paidAt?: string;
  txHash?: string;
  qrCode?: string;
  paymentUri?: string;
}

// Empty NEXT_PUBLIC_API_URL → same-origin /v1/* (proxied by next.config rewrites)
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const DEV_KEY = process.env.NEXT_PUBLIC_DEV_API_KEY || 'dcp_dev_1234567890';
const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  (API_URL ? API_URL.replace(/\/v1\/?$/, '') : '');

export default function DCPMerchantDashboard() {
  const [apiKey, setApiKey] = useState(DEV_KEY);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [amount, setAmount] = useState('10.00');
  const [currency, setCurrency] = useState('XRP');
  const [chain, setChain] = useState<'xrpl' | 'bitcoin' | 'ethereum' | 'solana' | 'base' | 'dogecoin'>('xrpl');
  const [expires, setExpires] = useState(60);

  // Modal for QR / details
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [webhookDeliveries, setWebhookDeliveries] = useState<any[]>([]);

  async function fetchInvoices(key = apiKey) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/invoices`, {
        headers: { 'X-API-Key': key },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Failed to load invoices: ${res.status} ${txt}`);
      }
      const data: Invoice[] = await res.json();
      setInvoices(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/v1/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          amount,
          currency,
          chain,
          expiresInMinutes: Number(expires),
          metadata: { source: 'merchant-dashboard' },
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Create failed: ${res.status} ${txt}`);
      }

      const created: Invoice = await res.json();
      setInvoices((prev) => [created, ...prev]);
      setSelected(created); // auto open the QR/details
      // reset form defaults
      setAmount('10.00');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function simulatePayment(invoiceId: string) {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/dev/simulate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ invoiceId }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Simulate failed: ${res.status} ${txt}`);
      }

      const result = await res.json();

      // Optimistic update for the selected invoice
      if (selected && selected.id === invoiceId) {
        const updated = { ...selected, status: 'paid', txHash: result.simulatedTxHash, paidAt: new Date().toISOString() };
        setSelected(updated);
      }

      // Refresh list after short delay (listener for XRPL, instant for others)
      setTimeout(() => fetchInvoices(), 1500);

      alert(result.message || 'Payment simulated!');
    } catch (e: any) {
      setError(e.message);
    }
  }

  function openInvoice(inv: Invoice) {
    setSelected(inv);
    setWebhookDeliveries([]);
    // Load recent webhook status for this invoice (dev)
    fetch(`${API_URL}/v1/dev/webhook-deliveries`, { headers: { 'X-API-Key': apiKey } })
      .then(r => r.json())
      .then(data => {
        const forInvoice = (data.deliveries || []).filter((d: any) => d.invoiceId === inv.id);
        setWebhookDeliveries(forInvoice);
      })
      .catch(() => {});
  }

  function closeModal() {
    setSelected(null);
  }

  // Auto-load on mount + when key changes
  useEffect(() => {
    fetchInvoices();

    // Auto-refresh every 8s (polling for listener updates)
    const interval = setInterval(() => {
      fetchInvoices();
    }, 8000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleString();

  const getStatusClass = (status: string) => {
    if (status === 'paid') return 'status status-paid';
    if (status === 'pending') return 'status status-pending';
    return 'status status-expired';
  };

  return (
    <div className="min-h-screen text-white">
      {/* Top nav */}
      <header className="dcp-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-[4.5rem] flex items-center justify-between">
          <a href="https://www.directconnectpay.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 hover:opacity-90 transition-opacity">
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
              <div className="text-[11px] text-dcp-teal font-medium tracking-widest -mt-0.5">MERCHANT DASHBOARD</div>
            </div>
          </a>

          <div className="flex items-center gap-4 text-sm">
            {API_ORIGIN ? (
              <a href={`${API_ORIGIN}/docs`} target="_blank" rel="noopener noreferrer" className="text-dcp-teal hover:text-dcp-cyan transition-colors font-medium">API Docs →</a>
            ) : null}
            <div className="h-3 w-px bg-zinc-700" />
            <button 
              onClick={async () => {
                try {
                  const r = await fetch(`${API_URL}/rates`);
                  const data = await r.json();
                  alert(`Demo rates (USD): ${Object.entries(data.rates).map(([k,v]) => `${k}=${v}`).join(', ')}`);
                } catch {}
              }}
              className="text-xs text-dcp-cyan hover:underline"
            >
              Rates
            </button>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[rgba(78,205,196,0.12)] text-dcp-teal border border-[rgba(78,205,196,0.25)]">
              XRPL + 5 chains
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Branded hero */}
        <section className="dcp-hero p-8 md:p-10 mb-8 relative">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-5">
              <Image
                src="/brand/dcp-icon.png"
                alt=""
                width={72}
                height={72}
                className="rounded-2xl hidden sm:block shadow-xl shadow-[rgba(78,205,196,0.3)]"
              />
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
                  Direct Connect Pay
                </h1>
                <p className="text-dcp-teal/90 mt-2 text-lg font-medium">
                  Crypto payment gateway for merchants
                </p>
                <blockquote className="mt-4 text-zinc-300 text-sm md:text-base max-w-2xl border-l-2 border-dcp-teal pl-4 italic">
                  &ldquo;Creating business to business relationships in the digital world.&rdquo;
                </blockquote>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-right shrink-0">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Powered by</span>
              <span className="text-dcp-cyan font-semibold text-lg">DCP Platform</span>
              <a
                href="https://www.directconnectpay.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-dcp-teal hover:underline"
              >
                directconnectpay.com →
              </a>
            </div>
          </div>
        </section>

        {/* Header + API Key */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Payments</h2>
            <p className="text-zinc-400 mt-1">Create invoices. Monitor. Get paid in seconds.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-zinc-500">X-API-KEY</div>
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="input w-80 mono text-xs"
              placeholder="dcp_..."
            />
            <button onClick={() => fetchInvoices()} className="btn btn-secondary text-xs">Refresh</button>
          </div>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <div className="text-xs text-zinc-400">TOTAL VOLUME</div>
            <div className="text-2xl font-semibold mt-1">
              {invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0).toFixed(2)} 
              <span className="text-sm text-zinc-400 ml-1">XRP equiv</span>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-zinc-400">PENDING</div>
            <div className="text-2xl font-semibold mt-1 text-amber-400">
              {invoices.filter(i => i.status === 'pending').length}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-zinc-400">PAID</div>
            <div className="text-2xl font-semibold mt-1 text-dcp-teal">
              {invoices.filter(i => i.status === 'paid').length}
            </div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-zinc-400">SUCCESS RATE</div>
            <div className="text-2xl font-semibold mt-1">
              {invoices.length > 0 
                ? Math.round((invoices.filter(i => i.status === 'paid').length / invoices.length) * 100) 
                : 0}%
            </div>
          </div>
        </div>

        {/* Create Invoice */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Create Invoice</div>
            <div className="text-xs px-3 py-1 rounded-full bg-zinc-800/70 text-zinc-400">Multi-coin • Non-custodial • KYC stub</div>
          </div>

          <form onSubmit={createInvoice} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-zinc-400 mb-1.5">COIN / CHAIN</label>
              <select
                value={chain}
                onChange={(e) => {
                  const selected = e.target.value;
                  setChain(selected as any);
                  // auto set sensible currency
                  const map: Record<string, string> = { xrpl: 'XRP', bitcoin: 'BTC', ethereum: 'ETH', solana: 'SOL', base: 'USDC', dogecoin: 'DOGE' };
                  setCurrency(map[selected] || 'XRP');
                }}
                className="input w-full"
              >
                <option value="xrpl">XRP (XRPL)</option>
                <option value="bitcoin">Bitcoin (BTC)</option>
                <option value="ethereum">Ethereum (ETH)</option>
                <option value="solana">Solana (SOL)</option>
                <option value="base">USDC (Base)</option>
                <option value="dogecoin">Dogecoin (DOGE)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">AMOUNT</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input w-full mono"
                placeholder="10.00"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">CURRENCY</label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input w-full mono"
                placeholder="XRP"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">EXPIRES (MIN)</label>
              <input
                type="number"
                value={expires}
                onChange={(e) => setExpires(Number(e.target.value))}
                className="input w-full mono"
                min={5}
                max={1440}
              />
            </div>
            <div className="flex items-end md:col-span-5">
              <button
                type="submit"
                disabled={creating}
                className="btn btn-primary w-full disabled:opacity-60"
              >
                {creating ? 'Creating…' : 'Create Invoice + QR'}
              </button>
            </div>
          </form>

          <div className="text-[11px] text-zinc-500 mt-3">
            Destination Tag + Memo (or equivalent) auto-generated per coin. Real-time confirmation via listener + reliable webhook delivery (retries + audit). KYC enforcement stub.
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm backdrop-blur-sm">{error}</div>
        )}

        {/* Invoices Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center justify-between">
            <div className="font-semibold">Recent Invoices</div>
            <button onClick={() => fetchInvoices()} className="text-xs text-zinc-400 hover:text-white">Reload</button>
            <button 
              onClick={async () => {
                try {
                  await fetch(`${API_URL}/v1/dev/reconcile`, { method: 'POST', headers: { 'X-API-Key': apiKey } });
                  setTimeout(() => fetchInvoices(), 2000);
                  alert('Reconciliation triggered - checking for missed payments...');
                } catch (e) { /* ignore */ }
              }}
              className="text-xs text-amber-400 hover:underline ml-2"
            >
              Reconcile (dev)
            </button>
            <button 
              onClick={() => {
                if (invoices.length === 0) return;
                const headers = ['ID', 'Amount', 'Currency', 'Chain', 'Status', 'Destination', 'Tag', 'TxHash', 'Created', 'Paid'];
                const rows = invoices.map(inv => [
                  inv.id,
                  inv.amount,
                  inv.currency,
                  inv.chain,
                  inv.status,
                  inv.destinationAddress,
                  inv.destinationTag || '',
                  inv.txHash || '',
                  inv.createdAt,
                  inv.paidAt || ''
                ]);
                const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `dcp-invoices-${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-xs text-emerald-400 hover:underline ml-2"
            >
              Export CSV
            </button>
          </div>

          <table className="table w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>AMOUNT</th>
                <th>ADDRESS + TAG</th>
                <th>STATUS</th>
                <th>CREATED / PAID</th>
                <th>TX</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && invoices.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">Loading invoices…</td></tr>
              )}
              {!loading && invoices.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500">No invoices yet. Create one above.</td></tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-900/40 cursor-pointer" onClick={() => openInvoice(inv)}>
                  <td className="mono text-xs text-emerald-400">{inv.id.slice(0, 12)}…</td>
                  <td className="mono font-medium">{inv.amount} {inv.currency}</td>
                  <td className="mono text-xs text-zinc-400">
                    {inv.destinationAddress.slice(0, 10)}…{inv.destinationTag ? ` • dt:${inv.destinationTag}` : ''}
                  </td>
                  <td>
                    <span className={getStatusClass(inv.status)}>{inv.status}</span>
                  </td>
                  <td className="text-xs text-zinc-400">
                    {formatDate(inv.createdAt)}
                    {inv.paidAt && <div className="text-emerald-400">paid {formatDate(inv.paidAt)}</div>}
                  </td>
                  <td className="text-xs mono">
                    {inv.txHash ? (
                      <a
                        href={`https://testnet.xrpl.org/transactions/${inv.txHash}`}
                        target="_blank"
                        className="text-emerald-400 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {inv.txHash.slice(0, 8)}…
                      </a>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); openInvoice(inv); }}
                      className="btn btn-secondary text-xs px-4"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-[11px] text-zinc-500 flex gap-x-6">
          <div>Non-custodial • Real-time via XRPL WebSocket</div>
          <div>POST /v1/invoices • GET /v1/invoices/:id • Webhooks</div>
          <div>Dev key pre-filled: <span className="mono text-zinc-400">{DEV_KEY}</span></div>
        </div>
      </div>

      {/* Invoice Detail / QR Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4" onClick={closeModal}>
          <div className="card max-w-lg w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-xs text-zinc-400">INVOICE</div>
                <div className="mono text-sm text-emerald-400 mt-0.5">{selected.id}</div>
              </div>
              <button onClick={closeModal} className="text-zinc-400 hover:text-white">✕</button>
            </div>

            <div className="text-center mb-8">
              <div className="text-5xl font-semibold tracking-tighter tabular-nums mb-1">
                {selected.amount} <span className="text-2xl align-super font-medium text-zinc-400">{selected.currency}</span>
              </div>
              <div className={getStatusClass(selected.status) + ' mt-2 text-base px-4 py-px'}>{selected.status.toUpperCase()}</div>
            </div>

            {selected.qrCode && (
              <div className="flex justify-center mb-6 bg-white p-6 rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.qrCode} alt="Payment QR" className="w-56 h-56" />
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-zinc-800 pb-3">
                <div className="text-zinc-400">Destination</div>
                <div className="mono text-right break-all text-xs">{selected.destinationAddress}</div>
              </div>
              {selected.destinationTag && (
                <div className="flex justify-between border-b border-zinc-800 pb-3">
                  <div className="text-zinc-400">Destination Tag</div>
                  <div className="mono font-medium">{selected.destinationTag}</div>
                </div>
              )}
              <div className="flex justify-between border-b border-zinc-800 pb-3">
                <div className="text-zinc-400">Expires</div>
                <div>{formatDate(selected.expiresAt)}</div>
              </div>
              {selected.paymentUri && (
                <div className="pt-2">
                  <div className="text-xs text-zinc-400 mb-1 flex justify-between">
                    <span>Payment URI (copy for wallet or mobile app)</span>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(selected.paymentUri!); alert('Copied! Paste in mobile DCP Pay app.'); }}
                      className="text-emerald-400 hover:underline text-[10px]"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="mono text-[11px] bg-black/60 p-3 rounded-xl break-all border border-zinc-800">{selected.paymentUri}</div>
                </div>
              )}

              {/* Reliability: Webhook delivery status */}
              <div className="pt-4 border-t border-zinc-800 mt-4">
                <div className="text-xs text-zinc-400 mb-2">Webhook Deliveries (retries + audit)</div>
                {webhookDeliveries.length > 0 ? (
                  webhookDeliveries.map((d, i) => (
                    <div key={i} className="text-[10px] mono bg-black/40 p-2 rounded mb-1">
                      {d.eventType} • {d.status} (attempts: {d.attempts}) {d.deliveredAt ? '✓ ' + new Date(d.deliveredAt).toLocaleTimeString() : ''}
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-zinc-500">No deliveries yet (or trigger simulate to see)</div>
                )}
                <div className="text-[9px] text-zinc-500 mt-1">Reliable: persisted, HMAC signed, exponential backoff retries up to 5x. Reconciliation runs periodically.</div>
              </div>
            </div>

            {selected.status === 'pending' && (
              <>
                <button
                  onClick={() => simulatePayment(selected.id)}
                  className="btn btn-secondary w-full mt-3 text-amber-400 border-amber-400/40 hover:bg-amber-400/10"
                >
                  Simulate Payment (dev) — sends real testnet tx
                </button>
                <button
                  onClick={async () => {
                    try {
                      await fetch(`${API_URL}/v1/dev/reconcile`, { 
                        method: 'POST', 
                        headers: { 'X-API-Key': apiKey } 
                      });
                      setTimeout(() => {
                        fetchInvoices();
                        if (selected) openInvoice(selected); // refresh modal
                      }, 1500);
                      alert('Reconciled this invoice');
                    } catch {}
                  }}
                  className="btn btn-secondary w-full mt-2 text-xs"
                >
                  Force Reconcile (dev)
                </button>
              </>
            )}
            <button onClick={closeModal} className="btn btn-primary w-full mt-8">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
