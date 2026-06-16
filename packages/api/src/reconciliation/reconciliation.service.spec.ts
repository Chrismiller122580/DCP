import { Test, TestingModule } from '@nestjs/testing';
import { ReconciliationService } from './reconciliation.service';
import { PrismaService } from '../prisma/prisma.service';
import { XrplService } from '../xrpl/xrpl.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';

describe('ReconciliationService', () => {
  let service: ReconciliationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReconciliationService,
        { provide: PrismaService, useValue: { invoice: { findMany: jest.fn(), update: jest.fn() }, $transaction: jest.fn() } },
        { provide: XrplService, useValue: { provider: { verifyPayment: jest.fn() } } },
        { provide: WebhooksService, useValue: { sendWebhook: jest.fn() } },
        { provide: getQueueToken('reconciliation'), useValue: { add: jest.fn() } },
      ],
    }).compile();

    service = module.get<ReconciliationService>(ReconciliationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should trigger reconciliation', async () => {
    const result = await service.triggerReconciliation();
    expect(result.triggered).toBe(true);
  });
});
