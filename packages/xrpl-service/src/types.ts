import { Client } from 'xrpl';

export interface XrplConfig {
  network: 'testnet' | 'mainnet';
  wsUrl?: string;
}

export interface XrplInvoiceOptions {
  destinationAddress?: string;
  destinationTag?: number;
  memo?: string;
}

export interface XrplPaymentDetails {
  destinationAddress: string;
  destinationTag: number;
  memo?: string;
  amount: string;
  currency: 'XRP';
}
