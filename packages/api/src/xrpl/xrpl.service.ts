import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XrplPaymentProvider } from '@dcp/xrpl-service';
import { CreateInvoiceInput } from '@dcp/core';
import { CreatePaymentResult, PaymentVerificationResult } from '@dcp/blockchain';

@Injectable()
export class XrplService implements OnModuleDestroy {
  private readonly network: 'testnet' | 'mainnet';
  private readonly provider: XrplPaymentProvider;

  constructor(private config: ConfigService) {
    this.network = (this.config.get('XRPL_NETWORK') as 'testnet' | 'mainnet') || 'testnet';
    this.provider = new XrplPaymentProvider({ network: this.network });
  }

  async createPaymentRequest(input: CreateInvoiceInput): Promise<CreatePaymentResult> {
    return this.provider.createPaymentRequest(input);
  }

  buildPaymentUri(destination: string, amount: string, tag?: number | string): string {
    return this.provider.buildPaymentUri(destination, amount, tag);
  }

  async subscribeToPayments(
    address: string,
    onPayment: (result: PaymentVerificationResult) => void | Promise<void>
  ): Promise<() => void> {
    return this.provider.subscribeToPayments(address, onPayment);
  }

  async getBalance(address: string): Promise<string> {
    return this.provider.getBalance ? this.provider.getBalance(address) : '0';
  }

  async onModuleDestroy() {
    // cleanup if needed in future
  }
}

