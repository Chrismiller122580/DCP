import type { NextConfig } from "next";

function getRewriteApiBase(): string {
  const candidates = [
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_ORIGIN,
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1\/?$/, ''),
    'http://localhost:4000',
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const base = raw.replace(/\/$/, '');
    // Vercel cannot proxy to Railway private hostnames (*.railway.internal)
    if (base.includes('.internal')) continue;
    if (!base.startsWith('http://') && !base.startsWith('https://')) continue;
    return base;
  }

  return 'http://localhost:4000';
}

const nextConfig: NextConfig = {
  async rewrites() {
    const apiBase = getRewriteApiBase();
    return [
      {
        source: '/v1/:path*',
        destination: `${apiBase}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
