import { Module } from '@nestjs/common';
import { SolanaListenerService } from './solana.listener.service';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [WebhooksModule],
  providers: [SolanaListenerService],
})
export class SolanaModule {}
