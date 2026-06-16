import { Module } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { XrplModule } from '../xrpl/xrpl.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [XrplModule, WebhooksModule],
  providers: [ReconciliationService],
  exports: [ReconciliationService],
})
export class ReconciliationModule {}
