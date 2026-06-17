/**
 * Resolve the API base URL for browser fetch calls.
 *
 * Priority:
 * 1. NEXT_PUBLIC_API_URL — explicit API base (may include /v1 suffix; stripped)
 * 2. NEXT_PUBLIC_API_ORIGIN — public Railway host (recommended on Vercel)
 * 3. '' — same-origin /v1/* (local dev via next.config rewrites)
 */
export function getApiBase(): string {
  const fromUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1\/?$/, '').replace(/\/$/, '');
  if (fromUrl) return fromUrl;

  const fromOrigin = process.env.NEXT_PUBLIC_API_ORIGIN?.replace(/\/$/, '');
  if (fromOrigin) return fromOrigin;

  return '';
}

export function apiPath(path: string): string {
  const base = getApiBase();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

/** Server-side rewrite target — must be a public URL (never *.railway.internal). */
export function getServerApiBase(): string {
  const candidates = [
    process.env.API_URL,
    process.env.NEXT_PUBLIC_API_ORIGIN,
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1\/?$/, ''),
    'http://localhost:4000',
  ];

  for (const raw of candidates) {
    if (!raw) continue;
    const base = raw.replace(/\/$/, '');
    if (base.includes('.internal') || base.includes('railway.internal')) continue;
    if (!base.startsWith('http://') && !base.startsWith('https://')) continue;
    return base;
  }

  return 'http://localhost:4000';
}