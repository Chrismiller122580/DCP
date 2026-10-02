import { XrplConfig, XrplInvoiceOptions, XrplPaymentDetails } from '../types';
import { generateId } from '@dcp/core';
import { getXrplClient } from '../client';
import { xrpToDrops } from './drops';

/** Classic XRPL genesis account. Never a merchant receive address. */
export const XRPL_GENESIS_ADDRESS = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';

/**
 * Build a payment request for a merchant-owned receive address and a caller-allocated tag.
 * Does not pick an address. The API funds a testnet account (or the merchant sets one) and
 * allocates the tag from Merchant.nextDestinationTag.
 */
export async function createPaymentRequest(
  amount: string,
  options: XrplInvoiceOptions = {},
  _config: XrplConfig = { network: 'testnet' },
): Promise<XrplPaymentDetails & { invoiceRef: string }> {
  const destinationAddress = options.destinationAddress;
  if (!destinationAddress || destinationAddress === XRPL_GENESIS_ADDRESS) {
    throw new Error('XRPL receive address is required and cannot be the genesis account');
  }
  if (options.destinationTag == null || !Number.isInteger(options.destinationTag) || options.destinationTag < 1) {
    throw new Error('XRPL destination tag must be a positive integer allocated by the API');
  }
  xrpToDrops(amount);

  return {
    destinationAddress,
    destinationTag: options.destinationTag,
    memo: options.memo,
    amount,
    currency: 'XRP',
    invoiceRef: generateId('xrpl'),
  };
}

/** Fund a fresh testnet account. Returns null off testnet. Seed is for the receive wallet only. */
export async function fundTestnetAccount(
  config: XrplConfig = { network: 'testnet' },
): Promise<{ address: string; seed: string } | null> {
  if (config.network !== 'testnet') return null;
  const client = await getXrplClient(config);
  const { wallet } = await client.fundWallet();
  if (!wallet.seed) return null;
  return { address: wallet.classicAddress, seed: wallet.seed };
}
