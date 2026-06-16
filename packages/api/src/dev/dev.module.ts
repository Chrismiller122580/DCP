import { Module } from '@nestjs/common';
import { DevController } from './dev.controller';
import { XrplModule } from '../xrpl/xrpl.module';
import { ReconciliationModule } from '../reconciliation/reconciliation.module';

@Module({
  imports: [XrplModule, ReconciliationModule],
  controllers: [DevController],
})
export class DevModule {}
