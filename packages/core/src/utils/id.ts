import { randomBytes } from 'crypto';

export function generateId(prefix: string = 'inv'): string {
  const rand = randomBytes(12).toString('hex');
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export function generateApiKey(): string {
  return 'dcp_' + randomBytes(32).toString('hex');
}

export function generateWebhookSecret(): string {
  return randomBytes(32).toString('hex');
}
