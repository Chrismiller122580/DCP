import { Client, Payment, SubscribeRequest, TransactionStream } from 'xrpl';
import { PaymentVerificationResult } from '@dcp/blockchain';
import { getXrplClient } from '../client';
import type { XrplConfig } from '../types';

/**
 * Monitor an XRPL account + destination tag for a matching Payment.
 * Returns a promise that resolves on first matching validated payment,
 * or use subscribe for long-lived listener.
 */
export async function monitorTransaction(
  destinationAddress: string,
  destinationTag: number,
  expectedAmountXRP: string,
  timeoutMs = 1000 * 60 * 15, // 15 min default
  config: XrplConfig = { network: 'testnet' }
): Promise<PaymentVerificationResult | null> {
  const client = await getXrplClient(config);

  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve(null); // timeout = treat as not found / expired
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeout);
      // In practice, client.request unsubscribe or disconnect if owned
    };

    try {
      // Subscribe to account tx stream
      await client.request({
        command: 'subscribe',
        accounts: [destinationAddress],
      } as SubscribeRequest);

      const listener = async (tx: TransactionStream) => {
        if (tx.type !== 'transaction' || tx.engine_result !== 'tesSUCCESS') return;

        const txData: any = (tx as any).transaction ?? tx;
        if (!txData || txData.TransactionType !== 'Payment') return;

        const payment = txData as Payment;

        // Match destination
        if (payment.Destination !== destinationAddress) return;

        // Match destination tag (can be number or absent)
        const tag = payment.DestinationTag;
        if (tag !== undefined && Number(tag) !== destinationTag) return;

        // Amount match (only handle XRP drops for MVP - "drops" field or Amount as string drops)
        let receivedDrops: string | undefined;
        const amt: any = payment.Amount;
        if (typeof amt === 'string') {
          receivedDrops = amt;
        } else if (amt && typeof amt === 'object' && 'value' in amt) {
          // issued currency path - skip for pure XRP MVP
          return;
        }

        if (!receivedDrops) return;

        // Convert drops to XRP decimal for comparison (1 XRP = 1e6 drops)
        const receivedXRP = (BigInt(receivedDrops) / BigInt(1_000_000)).toString() + '.' + 
          (BigInt(receivedDrops) % BigInt(1_000_000)).toString().padStart(6, '0').replace(/0+$/, '');

        // Loose amount check (allow overpay for now)
        if (parseFloat(receivedXRP) < parseFloat(expectedAmountXRP) * 0.999) {
          // underpaid - could emit separate event
          return;
        }

        const result: PaymentVerificationResult = {
          isValid: true,
          txHash: tx.hash,
          amountReceived: receivedXRP,
          fromAddress: payment.Account,
          destinationTag: tag,
          confirmedAt: new Date(tx.close_time_iso || Date.now()),
          ledgerIndex: tx.ledger_index,
          rawTx: tx,
        };

        cleanup();
        // Unsubscribe best-effort
        try {
          await client.request({ command: 'unsubscribe', accounts: [destinationAddress] });
        } catch {}
        resolve(result);
      };

      client.on('transaction', listener as any);

      // Also resolve immediately if we want historic lookup first (optional)
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
    }
  });
}
