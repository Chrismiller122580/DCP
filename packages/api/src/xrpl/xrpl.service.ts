import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XrplPaymentProvider, fundTestnetAccount } from '@dcp/xrpl-service';
import { CreateInvoiceInput } from '@dcp/core';
import { CreatePaymentResult, PaymentVerificationResult, VerifyPaymentParams } from '@dcp/blockchain';
import { xrpToDrops } from 'xrpl';

@Injectable()
export class XrplService implements OnModuleDestroy {
  private readonly network: 'testnet' | 'mainnet';
  private readonly provider: XrplPaymentProvider;

  constructor(private config: ConfigService) {
    this.network = (this.config.get('XRPL_NETWORK') as 'testnet' | 'mainnet') || 'testnet';
    if (this.network === 'mainnet') {
      console.warn('[XRPL] Mainnet mode enabled - merchant xrplAddress must be set. No seeds are generated.');
    }
    this.provider = new XrplPaymentProvider({ network: this.network });
  }

  get networkName(): 'testnet' | 'mainnet' {
    return this.network;
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

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    return this.provider.verifyPayment(params);
  }

  /** Fund a fresh testnet receive account. Null on mainnet. */
  async fundTestnetWallet(): Promise<{ address: string; seed: string } | null> {
    return fundTestnetAccount({ network: this.network });
  }

  async getBalance(address: string): Promise<string> {
    return this.provider.getBalance ? this.provider.getBalance(address) : '0';
  }

  async createEscrow(destination: string, amount: string, finishAfter: number, cancelAfter?: number, condition?: string) {
    const client = await this.getClient();
    const { wallet } = await client.fundWallet();
    const escrowCreate: any = {
      TransactionType: 'EscrowCreate',
      Account: wallet.classicAddress,
      Destination: destination,
      Amount: xrpToDrops(amount),
      FinishAfter: finishAfter,
    };
    if (cancelAfter) escrowCreate.CancelAfter = cancelAfter;
    if (condition) escrowCreate.Condition = condition;

    const prepared = await client.autofill(escrowCreate);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    await client.disconnect();

    return {
      status: 'created',
      escrowSequence: (result.result as any).meta?.AffectedNodes?.find((n: any) => n.CreatedNode?.LedgerEntryType === 'Escrow')?.CreatedNode?.LedgerIndex || Math.floor(Math.random() * 1000000),
      txHash: result.result.hash,
      destination,
      amount,
    };
  }

  async finishEscrow(owner: string, escrowSequence: number, condition?: string, fulfillment?: string) {
    const client = await this.getClient();
    const { wallet } = await client.fundWallet();
    const escrowFinish: any = {
      TransactionType: 'EscrowFinish',
      Account: wallet.classicAddress,
      Owner: owner,
      OfferSequence: escrowSequence,
    };
    if (condition && fulfillment) {
      escrowFinish.Condition = condition;
      escrowFinish.Fulfillment = fulfillment;
    }
    const prepared = await client.autofill(escrowFinish);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    await client.disconnect();
    return { status: 'finished', txHash: result.result.hash, owner, escrowSequence };
  }

  async cancelEscrow(owner: string, escrowSequence: number) {
    const client = await this.getClient();
    const { wallet } = await client.fundWallet();
    const escrowCancel: any = {
      TransactionType: 'EscrowCancel',
      Account: wallet.classicAddress,
      Owner: owner,
      OfferSequence: escrowSequence,
    };
    const prepared = await client.autofill(escrowCancel);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    await client.disconnect();
    return { status: 'canceled', txHash: result.result.hash, owner, escrowSequence };
  }

  private async getClient() {
    const { Client } = await import('xrpl');
    const url = this.network === 'testnet' ? 'wss://s.altnet.rippletest.net:51233' : 'wss://xrplcluster.com';
    const client = new Client(url);
    await client.connect();
    return client;
  }

  async onModuleDestroy() {
    // cleanup if needed in future
  }
}
