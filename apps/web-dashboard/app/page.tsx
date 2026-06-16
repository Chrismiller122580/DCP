import Image from 'next/image';
import Link from 'next/link';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

const features = [
  {
    title: 'XRPL-first payments',
    desc: '3–5 second settlement with destination tags, memos, and near-zero fees on the XRP Ledger.',
    accent: 'teal',
  },
  {
    title: 'Multi-chain ready',
    desc: 'Accept XRP, BTC, ETH, SOL, USDC on Base, and DOGE from one merchant dashboard.',
    accent: 'cyan',
  },
  {
    title: 'Reliable webhooks',
    desc: 'HMAC-signed delivery with retries, reconciliation, and real-time invoice status updates.',
    accent: 'blue',
  },
  {
    title: 'Non-custodial by default',
    desc: 'Generate payment addresses and tags — you never hold customer funds. Built for US merchant compliance.',
    accent: 'teal',
  },
];

const chains = ['XRPL', 'Bitcoin', 'Ethereum', 'Solana', 'Base', 'Dogecoin'];

export default function HomePage() {
  return (
    <div className="min-h-screen text-white flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/brand/dcp-hero.jpg"
              alt=""
              fill
              className="object-cover opacity-25"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/80 to-zinc-950" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-28">
            <div className="max-w-3xl">
              <span className="dcp-badge mb-6 inline-block">Direct Connect Pay</span>
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1]">
                Crypto payments for merchants who want{' '}
                <span className="text-dcp-teal">speed</span> and{' '}
                <span className="text-dcp-cyan">control</span>
              </h1>
              <p className="mt-6 text-lg text-zinc-300 max-w-2xl leading-relaxed">
                DCP is an XRPL-first payment gateway with a branded dashboard, public API,
                and mobile checkout — so you can accept crypto without giving up ownership of your stack.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/onboarding" className="btn btn-primary text-base px-8 py-3">
                  Start onboarding
                </Link>
                <Link href="/login" className="btn btn-secondary text-base px-8 py-3">
                  Sign in with API key
                </Link>
              </div>
              <p className="mt-6 text-sm text-zinc-500">
                Already integrated?{' '}
                <Link href="/dashboard" className="text-dcp-teal hover:underline">
                  Go to dashboard →
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold">Built for real merchants</h2>
            <p className="text-zinc-400 mt-3 max-w-xl mx-auto">
              Everything you need to create invoices, monitor payments, and wire webhooks into your existing systems.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card p-6">
                <h3 className="text-lg font-semibold text-dcp-teal">{f.title}</h3>
                <p className="text-zinc-400 mt-2 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Chains */}
        <section id="chains" className="max-w-7xl mx-auto px-6 pb-16">
          <div className="dcp-hero p-8 md:p-10 relative">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <h2 className="text-2xl font-semibold">One platform, six chains</h2>
                <p className="text-zinc-300 mt-2 max-w-lg">
                  Start with XRPL testnet in minutes. Expand to additional networks as your volume grows.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {chains.map((c) => (
                  <span key={c} className="dcp-badge dcp-badge-cyan">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[rgba(78,205,196,0.15)] bg-zinc-950/50">
          <div className="max-w-7xl mx-auto px-6 py-16 text-center">
            <h2 className="text-2xl font-semibold">Ready to connect?</h2>
            <p className="text-zinc-400 mt-2 mb-8">
              Onboarding takes about two minutes. You&apos;ll get an API key and access to the merchant dashboard.
            </p>
            <Link href="/onboarding" className="btn btn-primary text-base px-10 py-3">
              Create merchant account
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}