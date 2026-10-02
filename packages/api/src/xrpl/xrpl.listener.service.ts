import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { XrplService } from './xrpl.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { PaymentVerificationResult } from '@dcp/blockchain';
import { xrpToDrops } from '@dcp/xrpl-service';

const GENESIS_ADDRESS = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';

@Injectable()
export class XrplListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(XrplListenerService.name);
  private readonly unsubscribers = new Map<string, () => void>();
  private pollInterval?: NodeJS.Timeout;
  private readonly POLL_INTERVAL_MS = 45000;

  constructor(
    private readonly xrpl: XrplService,
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhooksService,
  ) {}

  async onModuleInit() {
    await this.syncSubscriptions();
    this.pollInterval = setInterval(() => {
      void this.syncSubscriptions();
      void this.pollPending();
    }, this.POLL_INTERVAL_MS);
  }

  async onModuleDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    for (const [address, unsubscribe] of this.unsubscribers) {
      try {
        unsubscribe();
      } catch {
        this.logger.warn(`Unsubscribe failed for ${address}`);
      }
    }
    this.unsubscribers.clear();
  }

  private async syncSubscriptions() {
    const merchants = await this.prisma.merchant.findMany({
      where: { xrplAddress: { not: null } },
      select: { xrplAddress: true },
    });
    const wanted = new Set(
      merchants
        .map((m) => m.xrplAddress)
        .filter((address): address is string => Boolean(address) && address !== GENESIS_ADDRESS),
    );

    for (const address of this.unsubscribers.keys()) {
      if (!wanted.has(address)) {
        this.unsubscribers.get(address)?.();
        this.unsubscribers.delete(address);
      }
    }

    for (const address of wanted) {
      if (this.unsubscribers.has(address)) continue;
      try {
        const unsubscribe = await this.xrpl.subscribeToPayments(address, async (payment) => {
          if (payment.isValid && payment.destinationTag != null) {
            await this.handlePayment(address, payment);
          }
        });
        this.unsubscribers.set(address, unsubscribe);
        this.logger.log(`XRPL listener subscribed to ${address}`);
      } catch (err) {
        this.logger.error(`Failed to subscribe to ${address}`, err);
      }
    }
  }

  private async pollPending() {
    const pending = await this.prisma.invoice.findMany({
      where: { chain: 'xrpl', status: 'pending', destinationTag: { not: null } },
      take: 50,
    });

    for (const invoice of pending) {
      if (!invoice.destinationAddress || invoice.destinationTag == null) continue;
      if (invoice.destinationAddress === GENESIS_ADDRESS) continue;
      try {
        const verified = await this.xrpl.verifyPayment({
          destinationAddress: invoice.destinationAddress,
          destinationTag: invoice.destinationTag,
          expectedAmount: invoice.amount,
        });
        if (verified.isValid && verified.txHash) {
          await this.handlePayment(invoice.destinationAddress, verified);
        }
      } catch (err) {
        this.logger.warn(`Poll failed for invoice ${invoice.id}`, err);
      }
    }
  }

  private async handlePayment(destinationAddress: string, payment: PaymentVerificationResult) {
    const tag = payment.destinationTag;
    const received = payment.amountReceived;
    const txHash = payment.txHash;
    if (tag == null || !received || !txHash) return;

    const existing = await this.prisma.invoice.findFirst({ where: { txHash } });
    if (existing) return;

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        destinationAddress,
        destinationTag: Number(tag),
        chain: 'xrpl',
        status: 'pending',
      },
      include: { merchant: true },
    });
    if (!invoice) return;
    if (xrpToDrops(received) < xrpToDrops(invoice.amount)) return;

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

    this.logger.log(`Invoice ${updated.id} confirmed (address=${destinationAddress}, tag=${tag}, tx=${txHash})`);

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
