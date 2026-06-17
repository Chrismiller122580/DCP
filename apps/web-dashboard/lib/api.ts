import { apiPath } from './api-config';

export { apiPath, getApiBase } from './api-config';

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