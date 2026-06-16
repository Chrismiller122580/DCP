import { XrplPaymentDetails } from '../types';

/**
 * Build XRPL payment URI for QR codes / deep links.
 * Format supported by many XRPL wallets: xrpl:<addr>?amount=<xrp>&dt=<tag>&memo=<text>
 */
export function buildXrplPaymentUri(details: XrplPaymentDetails): string {
  const { destinationAddress, destinationTag, memo, amount } = details;
  const params: string[] = [];
  if (amount) params.push(`amount=${encodeURIComponent(amount)}`);
  if (destinationTag != null) params.push(`dt=${destinationTag}`);
  if (memo) params.push(`memo=${encodeURIComponent(memo)}`);
  const qs = params.length ? `?${params.join('&')}` : '';
  return `xrpl:${destinationAddress}${qs}`;
}

/**
 * Convenience to generate a simple QR payload (string). 
 * For actual PNG generation use 'qrcode' package + canvas in consuming app (api or mobile).
 */
export function buildQrPayload(details: XrplPaymentDetails): string {
  return buildXrplPaymentUri(details);
}
