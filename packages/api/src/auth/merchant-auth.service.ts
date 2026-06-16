import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Merchant } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DEV_MERCHANT_KEY = 'dcp_dev_1234567890';

@Injectable()
export class MerchantAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveMerchant(apiKey: string): Promise<Merchant> {
    let merchant = await this.prisma.merchant.findFirst({
      where: { apiKeyHash: apiKey },
    });

    if (!merchant && apiKey === DEV_MERCHANT_KEY) {
      merchant = await this.prisma.merchant.upsert({
        where: { email: 'dev@local.test' },
        update: { kycVerified: true },
        create: {
          name: 'Local Dev Merchant',
          email: 'dev@local.test',
          apiKeyHash: apiKey,
          webhookUrl: null,
          webhookSecret: 'dev_webhook_secret_123',
          kycVerified: true,
        },
      });
    }

    if (!merchant) {
      throw new UnauthorizedException('Invalid API key');
    }

    return merchant;
  }

  maskApiKey(apiKey: string): string {
    if (apiKey.length <= 12) return '••••••••';
    return `${apiKey.slice(0, 8)}…${apiKey.slice(-4)}`;
  }
}