import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { SolanaPaymentProvider } from '@dcp/solana-service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class SolanaListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SolanaListenerService.name);
  private unsubscribe?: () => void;

  private readonly LISTEN_ADDRESS = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin'; // demo merchant

  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksService,
  ) {}

  async onModuleInit() {
    const provider = new SolanaPaymentProvider('testnet');
    this.unsubscribe = await provider.subscribeToPayments(this.LISTEN_ADDRESS, async (payment) => {
      if (payment.isValid) {
        // Similar to XRPL: find pending Solana invoices by address and mark paid
        const pending = await this.prisma.invoice.findMany({
          where: { destinationAddress: this.LISTEN_ADDRESS, chain: 'solana', status: 'pending' },
          include: { merchant: true },
        });
        for (const inv of pending) {
          if (payment.amountReceived && parseFloat(payment.amountReceived) >= parseFloat(inv.amount)) {
            const updated = await this.prisma.$transaction(async (tx) => {
              const u = await tx.invoice.update({ where: { id: inv.id }, data: { status: 'paid', txHash: payment.txHash, paidAt: new Date() } });
              await tx.paymentEvent.create({ data: { invoiceId: u.id, eventType: 'payment.confirmed', txHash: payment.txHash, amount: payment.amountReceived, payload: payment as any } });
              return u;
            });
            this.logger.log(`Solana invoice ${updated.id} confirmed via listener`);
            await this.webhooks.sendWebhook(inv.merchant.webhookUrl, inv.merchant.webhookSecret, 'payment.confirmed', { invoiceId: updated.id, merchantId: updated.merchantId, status: 'paid', txHash: updated.txHash, amount: updated.amount, currency: updated.currency, chain: 'solana', paidAt: updated.paidAt?.toISOString() });
          }
        }
      }
    });
    this.logger.log('Solana listener started for reliability');
  }

  onModuleDestroy() {
    this.unsubscribe?.();
  }
}
