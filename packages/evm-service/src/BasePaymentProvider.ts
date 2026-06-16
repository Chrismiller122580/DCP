import { PaymentProvider, CreatePaymentResult, VerifyPaymentParams, PaymentVerificationResult } from '@dcp/blockchain';
import { CreateInvoiceInput } from '@dcp/core';

export class BasePaymentProvider implements PaymentProvider {
  readonly chain = 'base' as const;
  private rpcUrl: string;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.rpcUrl = network === 'testnet' 
      ? 'https://sepolia.base.org' 
      : 'https://mainnet.base.org';
  }

  async createPaymentRequest(input: CreateInvoiceInput): Promise<CreatePaymentResult> {
    // For EVM, merchant provides or we generate a receive address. Use fixed for demo.
    const destinationAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'; // demo

    return {
      destinationAddress,
      amount: input.amount,
      currency: input.currency,
      expiresAt: new Date(Date.now() + (input.expiresInMinutes ?? 60) * 60 * 1000),
      extra: { network: 'base-sepolia', memo: input.options?.memo },
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    if (!params.destinationAddress) return { isValid: false };

    // In prod: use viem or ethers to get tx receipt, check value, to, and confirmations.
    // For this build, simulate verification if txHash provided (demo).
    if (params.txHash) {
      // Mock a successful verification for demo purposes.
      return {
        isValid: true,
        txHash: params.txHash,
        amountReceived: params.expectedAmount,
        confirmedAt: new Date(),
      };
    }
    return { isValid: false };
  }

  async subscribeToPayments(
    address: string,
    onPayment: (result: PaymentVerificationResult) => void | Promise<void>
  ): Promise<() => void> {
    // For EVM, use websocket or polling on new blocks. Here, simple interval for demo.
    const interval = setInterval(async () => {
      // In real: watch for incoming tx to address.
      // For demo, do nothing (rely on manual simulate or reconciliation).
    }, 30000);

    return () => clearInterval(interval);
  }

  buildPaymentUri(destination: string, amount: string, tagOrMemo?: string | number): string {
    // EIP-681 or simple
    return `ethereum:${destination}?value=${amount}${tagOrMemo ? `&data=${tagOrMemo}` : ''}`;
  }

  async getBalance(address: string): Promise<string> {
    // In prod use provider.getBalance.
    return '0.0'; // stub
  }
}
