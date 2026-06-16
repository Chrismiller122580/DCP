import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ReconciliationService } from '../reconciliation/reconciliation.service';

@Processor('reconciliation')
export class ReconciliationProcessor extends WorkerHost {
  private readonly logger = new Logger(ReconciliationProcessor.name);

  constructor(private readonly reconciliationService: ReconciliationService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Running reconciliation job ${job.id}`);
    await this.reconciliationService.reconcilePendingInvoices();
    return { success: true };
  }
}
