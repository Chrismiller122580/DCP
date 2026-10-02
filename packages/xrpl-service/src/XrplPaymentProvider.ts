import { PaymentProvider, CreatePaymentResult, VerifyPaymentParams, PaymentVerificationResult } from '@dcp/blockchain';
import { CreateInvoiceInput, Chain } from '@dcp/core';
import { createPaymentRequest } from './helpers/createPaymentRequest';
import { findAccountPayment } from './helpers/findAccountPayment';
import { dropsCoverInvoice, dropsToXrp } from './helpers/drops';
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
      throw new Error('XRPL provider currently only supports XRP (native). Use issued currencies in v1.');
    }

    const details = await createPaymentRequest(amount, {
      destinationAddress: options?.destinationAddress,
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
      if (params.destinationTag == null || !params.destinationAddress) {
        return { isValid: false };
      }
      const found = await findAccountPayment(
        params.destinationAddress,
        Number(params.destinationTag),
        params.expectedAmount,
        this.config,
      );
      return found ?? { isValid: false };
    }

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
      if (typeof payment.Amount !== 'string') return { isValid: false };
      if (!dropsCoverInvoice(payment.Amount, params.expectedAmount)) return { isValid: false };

      const tagMatch = params.destinationTag == null || Number(payment.DestinationTag) === Number(params.destinationTag);
      const addrMatch = payment.Destination === params.destinationAddress;
      if (!addrMatch || !tagMatch) return { isValid: false };

      return {
        isValid: true,
        txHash: tx.hash,
        amountReceived: dropsToXrp(payment.Amount),
        fromAddress: payment.Account,
        destinationTag: payment.DestinationTag,
        confirmedAt: tx.close_time_iso ? new Date(tx.close_time_iso) : new Date(),
        ledgerIndex: tx.ledger_index,
        rawTx: tx,
      };
    } catch {
      return { isValid: false };
    }
  }

  async subscribeToPayments(
    address: string,
    onPayment: (result: PaymentVerificationResult) => void | Promise<void>
  ): Promise<() => void> {
    const client = await getXrplClient(this.config);

    const handler = async (streamTx: any) => {
      try {
        if (!streamTx || streamTx.type !== 'transaction') return;

        const engineOk =
          streamTx.validated === true ||
          streamTx.meta?.TransactionResult === 'tesSUCCESS' ||
          streamTx.engine_result === 'tesSUCCESS';
        if (!engineOk) return;

        const payment = (streamTx.transaction ?? streamTx.tx_json) as Payment | undefined;
        if (!payment || payment.TransactionType !== 'Payment') return;
        if (payment.Destination !== address) return;
        if (typeof payment.Amount !== 'string') return;

        const txHash = streamTx.hash ?? payment.hash;
        if (!txHash) return;

        const result: PaymentVerificationResult = {
          isValid: true,
          txHash,
          amountReceived: dropsToXrp(payment.Amount),
          fromAddress: payment.Account,
          destinationTag: payment.DestinationTag,
          confirmedAt: new Date(streamTx.close_time_iso || Date.now()),
          ledgerIndex: streamTx.ledger_index,
          rawTx: streamTx,
        };

        await onPayment(result);
      } catch (err) {
        console.warn('[XRPL] payment stream handler skipped message:', err);
      }
    };

    await client.request({
      command: 'subscribe',
      accounts: [address],
    });

    client.on('transaction', handler as any);

    return async () => {
      try {
        await client.request({ command: 'unsubscribe', accounts: [address] });
      } catch {
        // already disconnected
      }
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
    return dropsToXrp(resp.result.account_data.Balance);
  }
}
