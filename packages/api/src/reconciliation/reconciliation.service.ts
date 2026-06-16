import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { XrplService } from '../xrpl/xrpl.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class ReconciliationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReconciliationService.name);
  private readonly RECONCILE_INTERVAL_MS = 60000; // 1 minute

  constructor(
    private readonly prisma: PrismaService,
    private readonly xrpl: XrplService,
    private readonly webhooks: WebhooksService,
    @InjectQueue('reconciliation') private reconQueue: Queue,
  ) {}

  async onModuleInit() {
    // Use BullMQ repeatable job for reliable scheduled reconciliation (distributed, survives restarts)
    await this.reconQueue.add(
      'run-reconciliation',
      {},
      {
        repeat: {
          every: this.RECONCILE_INTERVAL_MS,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    );
    this.logger.log('Reconciliation queue job scheduled (BullMQ)');
  }

  onModuleDestroy() {
    // BullMQ handles cleanup
  }

  async reconcilePendingInvoices() {
    const pending = await this.prisma.invoice.findMany({
      where: { status: 'pending' },
      include: { merchant: true },
      take: 100, // batch
    });

    for (const invoice of pending) {
      try {
        let verified = false;
        let txHash: string | undefined;
        let amountReceived: string | undefined;
        let fromAddress: string | undefined;

        if (invoice.chain === 'xrpl' && invoice.destinationAddress && invoice.destinationTag) {
          // Use XRPL verify (leverages listener logic)
          const result = await this.xrpl['provider']?.verifyPayment?.({
            destinationAddress: invoice.destinationAddress,
            destinationTag: invoice.destinationTag,
            expectedAmount: invoice.amount,
          } as any);

          if (result?.isValid) {
            verified = true;
            txHash = result.txHash;
            amountReceived = result.amountReceived;
            fromAddress = result.fromAddress;
          }
        } else if (['bitcoin', 'ethereum', 'solana', 'base', 'dogecoin'].includes(invoice.chain)) {
          // For other chains: in real impl, query chain explorer or provider
          // Stub: if simulate was used, it would have marked already. Here we can check for recent "external" payments
          // For demo reliability: leave as pending or auto-confirm after time (not recommended for prod)
          // In production: integrate real providers and confirm with depth
          if (Math.random() > 0.95) { // Rare auto for demo
            verified = true;
            txHash = 'recon-' + Date.now();
            amountReceived = invoice.amount;
          }
        }

        if (verified && txHash) {
          // Idempotency check
          const existing = await this.prisma.invoice.findFirst({ where: { txHash } });
          if (existing) continue;

          const updated = await this.prisma.$transaction(async (tx) => {
            const inv = await tx.invoice.update({
              where: { id: invoice.id },
              data: {
                status: 'paid',
                txHash,
                paidAt: new Date(),
                payerAddress: fromAddress || 'reconciled',
              },
            });
            await tx.paymentEvent.create({
              data: {
                invoiceId: inv.id,
                eventType: 'payment.confirmed',
                txHash,
                amount: amountReceived,
                payload: { source: 'reconciliation' } as any,
              },
            });
            return inv;
          });

          this.logger.log(`Reconciled invoice ${updated.id} for ${invoice.chain}`);

          await this.webhooks.sendWebhook(
            invoice.merchant.webhookUrl,
            invoice.merchant.webhookSecret,
            'payment.confirmed',
            {
              invoiceId: updated.id,
              merchantId: updated.merchantId,
              status: 'paid',
              txHash: updated.txHash,
              amount: updated.amount,
              currency: updated.currency,
              chain: updated.chain,
              paidAt: updated.paidAt?.toISOString(),
              payerAddress: updated.payerAddress,
            },
          );
        }
      } catch (err) {
        this.logger.warn(`Reconciliation failed for invoice ${invoice.id}`, err);
      }
    }
  }

  // Manual trigger for dashboard / ops
  async triggerReconciliation() {
    await this.reconcilePendingInvoices();
    return { triggered: true, timestamp: new Date().toISOString() };
  }
}
