export function toSmallestUnit(amount: string, decimals: number): string {
  const [whole, frac = ''] = amount.split('.');
  const padded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  return (BigInt(whole || '0') * BigInt(10 ** decimals) + BigInt(padded || '0')).toString();
}

export function fromSmallestUnit(amount: string, decimals: number): string {
  const bn = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const whole = bn / divisor;
  const frac = (bn % divisor).toString().padStart(decimals, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole.toString();
}
