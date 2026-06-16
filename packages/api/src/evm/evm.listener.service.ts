import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { BasePaymentProvider } from '@dcp/evm-service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class EvmListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EvmListenerService.name);
  private unsubscribe?: () => void;

  private readonly LISTEN_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'; // demo

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksService,
  ) {}

  async onModuleInit() {
    try {
      await this.startListener();
    } catch (err) {
      this.logger.error('Failed to start EVM listener', err);
    }
  }

  private async startListener() {
    const provider = new BasePaymentProvider('testnet');
    this.unsubscribe = await provider.subscribeToPayments(this.LISTEN_ADDRESS, async (payment) => {
      if (payment.isValid) {
        const pending = await this.prisma.invoice.findMany({
          where: { destinationAddress: this.LISTEN_ADDRESS, chain: 'base', status: 'pending' },
          include: { merchant: true },
        });
        for (const inv of pending) {
          if (payment.amountReceived && parseFloat(payment.amountReceived) >= parseFloat(inv.amount)) {
            const updated = await this.prisma.$transaction(async (tx) => {
              const u = await tx.invoice.update({ where: { id: inv.id }, data: { status: 'paid', txHash: payment.txHash, paidAt: new Date() } });
              await tx.paymentEvent.create({ data: { invoiceId: u.id, eventType: 'payment.confirmed', txHash: payment.txHash, amount: payment.amountReceived, payload: payment as any } });
              return u;
            });
            this.logger.log(`Base invoice ${updated.id} confirmed via listener`);
            await this.webhooks.sendWebhook(inv.merchant.webhookUrl, inv.merchant.webhookSecret, 'payment.confirmed', { invoiceId: updated.id, merchantId: updated.merchantId, status: 'paid', txHash: updated.txHash, amount: updated.amount, currency: updated.currency, chain: 'base', paidAt: updated.paidAt?.toISOString() });
          }
        }
      }
    });
    this.logger.log('EVM (Base) listener started for reliability');
  }

  onModuleDestroy() {
    this.unsubscribe?.();
  }
}
