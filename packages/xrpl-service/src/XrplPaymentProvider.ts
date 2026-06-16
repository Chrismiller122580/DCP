import { PaymentProvider, CreatePaymentResult, VerifyPaymentParams, PaymentVerificationResult } from '@dcp/blockchain';
import { CreateInvoiceInput, Chain } from '@dcp/core';
import { createPaymentRequest } from './helpers/createPaymentRequest';
import { monitorTransaction } from './helpers/monitorTransaction';
import { buildXrplPaymentUri } from './helpers/buildQR';
import { XrplConfig } from './types';
import { getXrplClient } from './client';
import { Payment } from 'xrpl';

/**
 * XRPL implementation of the PaymentProvider interface.
 * Primary chain for DCP MVP.
 */
export class XrplPaymentProvider implements PaymentProvider {
  readonly chain: Chain = 'xrpl';

  constructor(private readonly config: XrplConfig = { network: 'testnet' }) {}

  async createPaymentRequest(input: CreateInvoiceInput): Promise<CreatePaymentResult> {
    const { amount, currency, options } = input;

    if (currency.toUpperCase() !== 'XRP') {
      // For MVP we only support native XRP. Stablecoin (issued) support later.
      throw new Error('XRPL provider currently only supports XRP (native). Use issued currencies in v1.');
    }

    const details = await createPaymentRequest(amount, {
      destinationTag: options?.destinationTag,
      memo: options?.memo,
    }, this.config);

    return {
      destinationAddress: details.destinationAddress,
      destinationTag: details.destinationTag,
      memo: details.memo,
      amount: details.amount,
      currency: details.currency,
      expiresAt: new Date(Date.now() + (input.expiresInMinutes ?? 60) * 60 * 1000),
      extra: {
        network: this.config.network,
        invoiceRef: details.invoiceRef,
      },
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    if (!params.txHash) {
      // If no txHash we can still monitor for it (used by listener)
      if (!params.destinationTag || !params.destinationAddress) {
        return { isValid: false };
      }
      const res = await monitorTransaction(
        params.destinationAddress,
        Number(params.destinationTag),
        params.expectedAmount,
        30_000,
        this.config
      );
      return res || { isValid: false };
    }

    // Fast path: fetch specific tx by hash and validate
    const client = await getXrplClient(this.config);
    try {
      const txResponse = await client.request({
        command: 'tx',
        transaction: params.txHash,
        binary: false,
      });

      const tx = txResponse.result as any;
      if (tx.TransactionType !== 'Payment' || tx.meta?.TransactionResult !== 'tesSUCCESS') {
        return { isValid: false };
      }

      const payment = tx as Payment;
      const amountStr = typeof payment.Amount === 'string' ? payment.Amount : undefined;
      if (!amountStr) return { isValid: false };

      const drops = BigInt(amountStr);
      const xrpReceived = (Number(drops) / 1_000_000).toFixed(6).replace(/\.?0+$/, '');

      const tagMatch = params.destinationTag == null || Number(payment.DestinationTag) === Number(params.destinationTag);
      const addrMatch = payment.Destination === params.destinationAddress;

      return {
        isValid: addrMatch && tagMatch,
        txHash: tx.hash,
        amountReceived: xrpReceived,
        fromAddress: payment.Account,
        destinationTag: payment.DestinationTag,
        confirmedAt: tx.close_time_iso ? new Date(tx.close_time_iso) : new Date(),
        ledgerIndex: tx.ledger_index,
        rawTx: tx,
      };
    } catch (e) {
      return { isValid: false };
    }
  }

  async subscribeToPayments(
    address: string,
    onPayment: (result: PaymentVerificationResult) => void | Promise<void>
  ): Promise<() => void> {
    const client = await getXrplClient(this.config);

    const handler = async (streamTx: any) => {
      if (streamTx.type !== 'transaction' || streamTx.engine_result !== 'tesSUCCESS') return;
      if (streamTx.transaction.TransactionType !== 'Payment') return;

      const payment = streamTx.transaction as Payment;
      if (payment.Destination !== address) return;

      // Note: caller (listener) is responsible for matching tag + amount to known invoices
      const result: PaymentVerificationResult = {
        isValid: true,
        txHash: streamTx.hash,
        amountReceived: typeof payment.Amount === 'string' 
          ? (Number(payment.Amount) / 1_000_000).toFixed(6) 
          : undefined,
        fromAddress: payment.Account,
        destinationTag: payment.DestinationTag,
        confirmedAt: new Date(streamTx.close_time_iso || Date.now()),
        ledgerIndex: streamTx.ledger_index,
        rawTx: streamTx,
      };

      await onPayment(result);
    };

    await client.request({
      command: 'subscribe',
      accounts: [address],
    });

    client.on('transaction', handler as any);

    return async () => {
      try {
        await client.request({ command: 'unsubscribe', accounts: [address] });
      } catch {}
      client.off('transaction', handler as any);
    };
  }

  buildPaymentUri(destination: string, amount: string, tagOrMemo?: string | number): string {
    return `xrpl:${destination}?amount=${encodeURIComponent(amount)}${tagOrMemo != null ? `&dt=${tagOrMemo}` : ''}`;
  }

  async getBalance(address: string): Promise<string> {
    const client = await getXrplClient(this.config);
    const resp = await client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated',
    });
    const drops = resp.result.account_data.Balance;
    return (Number(drops) / 1_000_000).toFixed(6);
  }
}
