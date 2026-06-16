import { Client } from 'xrpl';

export interface XrplConfig {
  network: 'testnet' | 'mainnet';
  wsUrl?: string;
}

export interface XrplInvoiceOptions {
  destinationTag?: number;
  memo?: string;
  // future: useEscrow, useIssuedCurrency etc.
}

export interface XrplPaymentDetails {
  destinationAddress: string;
  destinationTag: number;
  memo?: string;
  amount: string; // in XRP (drops or decimal)
  currency: 'XRP';
}
