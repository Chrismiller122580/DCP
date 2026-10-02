/** Convert a human XRP decimal string to integer drops. No float rounding. */
export function xrpToDrops(amount: string): bigint {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid XRP amount: ${amount}`);
  }
  const [whole, frac = ''] = trimmed.split('.');
  if (frac.length > 6) {
    throw new Error(`XRP amount has more than 6 decimal places: ${amount}`);
  }
  const frac6 = (frac + '000000').slice(0, 6);
  return BigInt(whole) * 1_000_000n + BigInt(frac6);
}

export function dropsToXrp(drops: bigint | string): string {
  const value = typeof drops === 'string' ? BigInt(drops) : drops;
  const whole = value / 1_000_000n;
  const frac = (value % 1_000_000n).toString().padStart(6, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole.toString();
}

/** True when received drops cover the invoice. Overpay is accepted. Underpay is not. */
export function dropsCoverInvoice(receivedDrops: string, expectedXrp: string): boolean {
  return BigInt(receivedDrops) >= xrpToDrops(expectedXrp);
}
