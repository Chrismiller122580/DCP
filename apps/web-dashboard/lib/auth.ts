const API_KEY_STORAGE = 'dcp_api_key';
const MERCHANT_NAME_STORAGE = 'dcp_merchant_name';
const ONBOARDED_STORAGE = 'dcp_onboarded';

export function getStoredApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(API_KEY_STORAGE);
}

export function getStoredMerchantName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(MERCHANT_NAME_STORAGE);
}

export function isOnboarded(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ONBOARDED_STORAGE) === 'true';
}

export function saveSession(apiKey: string, merchantName?: string, onboarded = true) {
  localStorage.setItem(API_KEY_STORAGE, apiKey);
  if (merchantName) localStorage.setItem(MERCHANT_NAME_STORAGE, merchantName);
  if (onboarded) localStorage.setItem(ONBOARDED_STORAGE, 'true');
}

export function clearSession() {
  localStorage.removeItem(API_KEY_STORAGE);
  localStorage.removeItem(MERCHANT_NAME_STORAGE);
  localStorage.removeItem(ONBOARDED_STORAGE);
}

export function getDevApiKey(): string {
  return process.env.NEXT_PUBLIC_DEV_API_KEY || 'dcp_dev_1234567890';
}