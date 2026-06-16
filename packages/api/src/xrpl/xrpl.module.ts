import { Module, Global } from '@nestjs/common';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { XrplService } from './xrpl.service';
import { XrplListenerService } from './xrpl.listener.service';

@Global()
@Module({
  imports: [WebhooksModule],
  providers: [XrplService, XrplListenerService],
  exports: [XrplService],
})
export class XrplModule {}
