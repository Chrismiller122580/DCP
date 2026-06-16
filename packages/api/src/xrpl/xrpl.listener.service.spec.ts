import { Test, TestingModule } from '@nestjs/testing';
import { XrplListenerService } from './xrpl.listener.service';
import { XrplService } from './xrpl.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';

describe('XrplListenerService', () => {
  let service: XrplListenerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XrplListenerService,
        { provide: XrplService, useValue: { subscribeToPayments: jest.fn().mockResolvedValue(() => {}) } },
        { provide: PrismaService, useValue: { invoice: { findMany: jest.fn().mockResolvedValue([]) }, $transaction: jest.fn() } },
        { provide: WebhooksService, useValue: { sendWebhook: jest.fn() } },
      ],
    }).compile();

    service = module.get<XrplListenerService>(XrplListenerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
