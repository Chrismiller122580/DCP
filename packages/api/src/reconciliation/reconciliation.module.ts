import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReconciliationService } from './reconciliation.service';
import { ReconciliationProcessor } from '../webhooks/reconciliation.processor';
import { XrplModule } from '../xrpl/xrpl.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    XrplModule,
    WebhooksModule,
    BullModule.registerQueue({ name: 'reconciliation' }),
  ],
  providers: [ReconciliationService, ReconciliationProcessor],
  exports: [ReconciliationService],
})
export class ReconciliationModule {}
