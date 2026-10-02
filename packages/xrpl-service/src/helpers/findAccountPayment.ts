import { Payment } from 'xrpl';
import { PaymentVerificationResult } from '@dcp/blockchain';
import { getXrplClient } from '../client';
import type { XrplConfig } from '../types';
import { dropsCoverInvoice, dropsToXrp } from './drops';

/**
 * Look up a validated Payment to address+tag that covers expectedAmount.
 * Uses account_tx so a missed websocket event can still confirm. Does not block on a subscribe.
 */
export async function findAccountPayment(
  destinationAddress: string,
  destinationTag: number,
  expectedAmountXrp: string,
  config: XrplConfig = { network: 'testnet' },
): Promise<PaymentVerificationResult | null> {
  const client = await getXrplClient(config);
  const response = await client.request({
    command: 'account_tx',
    account: destinationAddress,
    limit: 40,
    forward: false,
  });

  const rows = (response.result.transactions ?? []) as Array<Record<string, any>>;
  for (const row of rows) {
    const tx = (row.tx_json ?? row.tx ?? row.transaction) as Payment | undefined;
    if (!tx || tx.TransactionType !== 'Payment') continue;
    if (tx.Destination !== destinationAddress) continue;
    if (Number(tx.DestinationTag) !== destinationTag) continue;

    const resultCode = row.meta?.TransactionResult ?? row.engine_result;
    const validated = row.validated !== false;
    if (!validated || (resultCode && resultCode !== 'tesSUCCESS')) continue;
    if (typeof tx.Amount !== 'string') continue;
    if (!dropsCoverInvoice(tx.Amount, expectedAmountXrp)) continue;

    const txHash = row.hash ?? (tx as { hash?: string }).hash;
    if (!txHash) continue;

    return {
      isValid: true,
      txHash,
      amountReceived: dropsToXrp(tx.Amount),
      fromAddress: tx.Account,
      destinationTag: tx.DestinationTag,
      confirmedAt: new Date(),
      ledgerIndex: row.ledger_index,
      rawTx: row,
    };
  }

  return null;
}
