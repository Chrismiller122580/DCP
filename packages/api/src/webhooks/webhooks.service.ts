import { Injectable, Logger, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private readonly MAX_RETRIES = 5;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    @InjectQueue('webhooks') private webhookQueue: Queue,
  ) {}

  /**
   * Send a webhook payload with HMAC signature.
   * Enqueues to BullMQ for reliable, distributed processing with retries and DLQ.
   */
  async sendWebhook(
    url: string | undefined,
    secret: string | undefined,
    event: 'payment.confirmed' | 'payment.expired',
    data: any,
  ): Promise<void> {
    if (!url) return;

    const payload = {
      id: crypto.randomUUID(),
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    const body = JSON.stringify(payload);
    const signature = secret
      ? 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
      : undefined;

    // Create delivery record for audit
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        invoiceId: data.invoiceId,
        eventType: event,
        url,
        payload: payload as any,
        signature,
        status: 'pending',
      },
    });

    // Enqueue job - BullMQ handles retries, backoff, DLQ automatically
    await this.webhookQueue.add(
      'deliver-webhook',
      {
        deliveryId: delivery.id,
        url,
        body,
        signature,
      },
      {
        attempts: this.MAX_RETRIES,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Webhook enqueued for ${url} (event: ${event}, delivery: ${delivery.id})`);
  }

  // Called by processor on success
  async markDelivered(deliveryId: string, attempts: number) {
    await this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'delivered',
        attempts,
        deliveredAt: new Date(),
      },
    });
  }
}
