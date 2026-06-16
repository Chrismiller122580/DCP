import { generateId } from '@dcp/core';
import { XrplConfig, XrplInvoiceOptions, XrplPaymentDetails } from '../types';
import { getXrplClient } from '../client';
import { Client } from 'xrpl';

/**
 * Creates a fresh XRPL payment request.
 * - Generates (or accepts) a Destination Tag (0-4294967295)
 * - Optionally creates a new funded address per invoice (recommended for isolation, non-custodial monitor-only)
 * - Or reuses a merchant hot wallet address + unique tag (cheaper, still non-custodial)
 *
 * For MVP we default to merchant-provided or generated "receive" address + unique tag.
 * In production, best practice: generate unique destination account per invoice for maximum isolation.
 */
export async function createPaymentRequest(
  amount: string, // human XRP e.g. "10.5"
  options: XrplInvoiceOptions = {},
  config: XrplConfig = { network: 'testnet' }
): Promise<XrplPaymentDetails & { invoiceRef: string }> {
  const client = await getXrplClient(config);

  // In real impl, merchant can pass a funded "receiveAddress" or we generate ephemeral.
  // For simplicity + non-custodial: we expect caller (API) to provide the merchant's XRPL address.
  // Here we simulate / placeholder - in practice passed from merchant config.
  // We'll let caller inject the destination. For now use a test faucet style placeholder.
  const destinationAddress = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'; // classic XRPL genesis/test account - REPLACE in real use

  // Destination Tag: unique per invoice for correlation (0-4294967295)
  const destinationTag =
    options.destinationTag ??
    Math.floor(Math.random() * 2147483647); // safe positive 31-bit

  const memo = options.memo;

  // Validate amount looks reasonable
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    throw new Error('Invalid XRP amount');
  }

  const invoiceRef = generateId('xrpl');

  return {
    destinationAddress,
    destinationTag,
    memo,
    amount,
    currency: 'XRP',
    invoiceRef,
  };
}

/**
 * Fund a testnet account (helper for local dev / tests only).
 * Real merchants fund their own addresses.
 */
export async function fundTestnetAccount(address?: string, config: XrplConfig = { network: 'testnet' }): Promise<string | null> {
  if (config.network !== 'testnet') return null;
  const client = await getXrplClient(config);
  try {
    // fundWallet() creates + funds a fresh test account. We return the address.
    // To fund a specific pre-created address on XRPL testnet, use the public faucet endpoint.
    const { wallet } = await client.fundWallet();
    return wallet.classicAddress;
  } catch (e) {
    console.warn('[xrpl] fundTestnetAccount warning:', (e as Error).message);
    return null;
  }
}
