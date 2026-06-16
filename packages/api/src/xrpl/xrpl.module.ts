import { Module, Global } from '@nestjs/common';
import { XrplService } from './xrpl.service';
import { XrplListenerService } from './xrpl.listener.service';

@Global()
@Module({
  providers: [XrplService, XrplListenerService],
  exports: [XrplService],
})
export class XrplModule {}
