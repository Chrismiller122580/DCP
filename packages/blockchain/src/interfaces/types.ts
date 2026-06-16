import { Chain, Invoice, CreateInvoiceInput } from '@dcp/core';

export interface PaymentProvider {
  readonly chain: Chain;

  /**
   * Create a new payment request / invoice details for the chain.
   * Returns destination info needed to pay.
   */
  createPaymentRequest(input: CreateInvoiceInput): Promise<CreatePaymentResult>;

  /**
   * Verify / fetch status of a specific on-chain payment for correlation.
   */
  verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult>;

  /**
   * Subscribe to incoming payments for a given address + tag (for listener/orchestrator)
   */
  subscribeToPayments(
    address: string,
    onPayment: (result: PaymentVerificationResult) => void | Promise<void>
  ): Promise<() => void>; // return unsubscribe fn

  /**
   * Build a deep link / URI for wallet apps (e.g. xrpl: or solana pay)
   */
  buildPaymentUri(destination: string, amount: string, tagOrMemo?: string | number): string;

  /**
   * Get current balance for an address (optional for MVP)
   */
  getBalance?(address: string): Promise<string>;
}

export interface CreatePaymentResult {
  destinationAddress: string;
  destinationTag?: number | string;
  memo?: string;
  amount: string;
  currency: string;
  expiresAt: Date;
  // Any chain-specific extra data
  extra?: Record<string, unknown>;
}

export interface VerifyPaymentParams {
  txHash?: string;
  destinationAddress: string;
  destinationTag?: number | string;
  expectedAmount: string;
  fromBlockOrLedger?: number;
}

export interface PaymentVerificationResult {
  isValid: boolean;
  txHash?: string;
  amountReceived?: string;
  fromAddress?: string;
  destinationTag?: number | string;
  memo?: string;
  confirmedAt?: Date;
  ledgerIndex?: number;
  rawTx?: unknown;
}
