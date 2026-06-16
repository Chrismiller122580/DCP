import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Processor('webhooks')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private readonly webhooksService: WebhooksService) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { url, body, signature, deliveryId } = job.data;
    const attempt = job.attemptsMade;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'DCP-Webhook/1.0',
      };
      if (signature) headers['X-DCP-Signature'] = signature;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        await this.webhooksService.markDelivered(deliveryId, attempt + 1);
        this.logger.log(`Webhook job ${job.id} delivered to ${url} (attempt ${attempt + 1})`);
        return { success: true };
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err: any) {
      this.logger.warn(`Webhook job ${job.id} failed (attempt ${attempt + 1}): ${err.message}`);
      throw err; // BullMQ will handle retry based on config
    }
  }
}
