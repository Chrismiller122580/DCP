import { Connection, PublicKey, ConfirmedSignatureInfo } from '@solana/web3.js';
import { PaymentProvider, CreatePaymentResult, VerifyPaymentParams, PaymentVerificationResult } from '@dcp/blockchain';
import { CreateInvoiceInput } from '@dcp/core';

export class SolanaPaymentProvider implements PaymentProvider {
  readonly chain = 'solana' as const;
  private conn: Connection;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    const url = network === 'testnet' 
      ? 'https://api.testnet.solana.com' 
      : 'https://api.mainnet-beta.solana.com';
    this.conn = new Connection(url, 'confirmed');
  }

  async createPaymentRequest(input: CreateInvoiceInput): Promise<CreatePaymentResult> {
    // For Solana, we typically use a merchant's existing address + memo or a unique reference account.
    // For simplicity in DCP demo: use a fixed merchant pubkey (in prod: per-merchant or generated).
    const destinationAddress = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin'; // demo merchant pubkey

    return {
      destinationAddress,
      amount: input.amount,
      currency: input.currency,
      expiresAt: new Date(Date.now() + (input.expiresInMinutes ?? 60) * 60 * 1000),
      extra: { network: 'testnet', memo: input.options?.memo || `DCP-${input.merchantId}` },
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    if (!params.destinationAddress) return { isValid: false };

    try {
      const pubkey = new PublicKey(params.destinationAddress);
      const sigs: ConfirmedSignatureInfo[] = await this.conn.getSignaturesForAddress(pubkey, { limit: 50 });

      for (const sigInfo of sigs) {
        if (sigInfo.err) continue;

        // In a full impl we would fetch tx and parse transfer amount + memo match.
        // For DCP demo we do a heuristic match on recent successful tx.
        if (params.txHash && sigInfo.signature === params.txHash) {
          return {
            isValid: true,
            txHash: sigInfo.signature,
            amountReceived: params.expectedAmount,
            confirmedAt: sigInfo.blockTime ? new Date(sigInfo.blockTime * 1000) : new Date(),
          };
        }
      }

      return { isValid: false };
    } catch {
      return { isValid: false };
    }
  }

  async subscribeToPayments(
    address: string,
    onPayment: (result: PaymentVerificationResult) => void | Promise<void>
  ): Promise<() => void> {
    // Solana has websocket subscription for account changes.
    // For simplicity in this build we poll; production would use conn.onAccountChange.
    const interval = setInterval(async () => {
      const res = await this.verifyPayment({ destinationAddress: address, expectedAmount: '0' });
      if (res.isValid) await onPayment(res);
    }, 15000);

    return () => clearInterval(interval);
  }

  buildPaymentUri(destination: string, amount: string, tagOrMemo?: string | number): string {
    return `solana:${destination}?amount=${amount}${tagOrMemo ? `&memo=${tagOrMemo}` : ''}`;
  }

  async getBalance(address: string): Promise<string> {
    try {
      const pubkey = new PublicKey(address);
      const bal = await this.conn.getBalance(pubkey);
      return (bal / 1e9).toFixed(9); // SOL has 9 decimals
    } catch {
      return '0';
    }
  }
}
