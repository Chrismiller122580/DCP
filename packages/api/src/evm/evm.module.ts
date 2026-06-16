import { Module } from '@nestjs/common';
import { EvmListenerService } from './evm.listener.service';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [WebhooksModule],
  providers: [EvmListenerService],
})
export class EvmModule {}
