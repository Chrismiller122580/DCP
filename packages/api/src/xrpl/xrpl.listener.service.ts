import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { XrplService } from './xrpl.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { PaymentVerificationResult } from '@dcp/blockchain';

@Injectable()
export class XrplListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(XrplListenerService.name);
  private unsubscribe?: () => void;
  private pollInterval?: NodeJS.Timeout;
  private isConnected = false;

  // Shared test receive address for MVP/demo. Production: per-merchant funded addresses or dynamic subscribe.
  private readonly LISTEN_ADDRESS = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
  private readonly POLL_INTERVAL_MS = 30000; // 30s fallback poll for reliability
  private readonly MIN_CONFIRMATIONS = 1; // Increase for production (e.g. 3-5 ledgers)

  constructor(
    private readonly xrpl: XrplService,
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksService,
  ) {}

  async onModuleInit() {
    await this.startSubscription();
    this.startPollingFallback();
  }

  async onModuleDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.logger.log('XRPL listener unsubscribed');
    }
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  private async startSubscription() {
    try {
      this.unsubscribe = await this.xrpl.subscribeToPayments(
        this.LISTEN_ADDRESS,
        async (payment: PaymentVerificationResult) => {
          this.isConnected = true;
          if (payment.isValid && payment.destinationTag && payment.ledgerIndex) {
            await this.handlePayment(payment);
          }
        },
      );
      this.isConnected = true;
      this.logger.log(`XRPL listener subscribed to ${this.LISTEN_ADDRESS} (testnet)`);
    } catch (err) {
      this.isConnected = false;
      this.logger.error('Failed to start XRPL WS listener, relying on polling', err);
    }
  }

  private startPollingFallback() {
    // Reliability: periodic poll for pending invoices even if WS is down or missed events
    this.pollInterval = setInterval(async () => {
      if (this.isConnected) return; // Prefer WS when healthy

      try {
        const pending = await this.prisma.invoice.findMany({
          where: { chain: 'xrpl', status: 'pending' },
          take: 50,
        });

        for (const inv of pending) {
          if (!inv.destinationTag || !inv.destinationAddress) continue;

          // Use verifyPayment for reconciliation (depth check)
          const verified = await this.xrpl['provider']?.verifyPayment?.({
            destinationAddress: inv.destinationAddress,
            destinationTag: inv.destinationTag,
            expectedAmount: inv.amount,
          } as any);

          if (verified?.isValid && verified.txHash) {
            await this.handlePayment({
              isValid: true,
              txHash: verified.txHash,
              amountReceived: verified.amountReceived,
              fromAddress: verified.fromAddress,
              destinationTag: verified.destinationTag,
              confirmedAt: verified.confirmedAt,
              ledgerIndex: verified.ledgerIndex,
            } as any);
          }
        }
      } catch (e) {
        this.logger.warn('Polling fallback error', e);
      }
    }, this.POLL_INTERVAL_MS);
  }

  private async handlePayment(payment: PaymentVerificationResult) {
    const tag = payment.destinationTag;
    const received = payment.amountReceived;
    const txHash = payment.txHash;
    if (!tag || !received || !txHash) return;

    // Idempotency: skip if this tx already processed
    const existing = await this.prisma.invoice.findFirst({ where: { txHash } });
    if (existing) {
      this.logger.debug(`Tx ${txHash} already processed for invoice ${existing.id}`);
      return;
    }

    // Find pending invoices for this tag
    const pending = await this.prisma.invoice.findMany({
      where: {
        destinationTag: Number(tag),
        chain: 'xrpl',
        status: 'pending',
      },
      include: { merchant: true },
    });

    for (const invoice of pending) {
      const expected = parseFloat(invoice.amount);
      const got = parseFloat(received);

      if (got >= expected * 0.999) {
        // Use transaction for atomicity + event log
        const updated = await this.prisma.$transaction(async (tx) => {
          const inv = await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'paid',
              txHash,
              paidAt: payment.confirmedAt || new Date(),
              payerAddress: payment.fromAddress,
            },
          });

          await tx.paymentEvent.create({
            data: {
              invoiceId: inv.id,
              eventType: 'payment.confirmed',
              txHash,
              amount: received,
              payload: payment as any,
            },
          });

          return inv;
        });

        this.logger.log(`Invoice ${updated.id} auto-confirmed (tag=${tag}, tx=${txHash}, ledgers=${payment.ledgerIndex})`);

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
    }
  }
}
