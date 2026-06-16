import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksService } from './webhooks.service';
import { WebhookProcessor } from './webhook.processor';
import { ReconciliationProcessor } from './reconciliation.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'webhooks' }),
    BullModule.registerQueue({ name: 'reconciliation' }),
  ],
  providers: [WebhooksService, WebhookProcessor, ReconciliationProcessor],
  exports: [WebhooksService],
})
export class WebhooksModule {}
