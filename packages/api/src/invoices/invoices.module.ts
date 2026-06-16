import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { XrplModule } from '../xrpl/xrpl.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [XrplModule, WebhooksModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
