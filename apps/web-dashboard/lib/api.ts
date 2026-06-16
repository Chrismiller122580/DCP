const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function apiPath(path: string) {
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function apiFetch(
  path: string,
  options: RequestInit & { apiKey?: string; adminKey?: string } = {},
) {
  const { apiKey, adminKey, headers, ...rest } = options;
  const h = new Headers(headers);
  if (apiKey) h.set('X-API-Key', apiKey);
  if (adminKey) h.set('X-Admin-Key', adminKey);
  if (!h.has('Content-Type') && rest.body) h.set('Content-Type', 'application/json');

  const res = await fetch(apiPath(path), { ...rest, headers: h });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${res.status}: ${txt}`);
  }
  return res.json();
}