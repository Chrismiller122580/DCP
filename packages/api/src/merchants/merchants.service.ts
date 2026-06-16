import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { generateApiKey, generateWebhookSecret } from '@dcp/core';
import { PrismaService } from '../prisma/prisma.service';
import { MerchantAuthService } from '../auth/merchant-auth.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { MerchantCreatedDto, MerchantResponseDto } from './dto/merchant-response.dto';
import { ConnectionTestResultDto } from './dto/test-connection.dto';

@Injectable()
export class MerchantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantAuth: MerchantAuthService,
  ) {}

  async createMerchant(dto: CreateMerchantDto): Promise<MerchantCreatedDto> {
    const existing = await this.prisma.merchant.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException(`Merchant with email ${dto.email} already exists`);
    }

    const apiKey = generateApiKey();
    const merchant = await this.prisma.merchant.create({
      data: {
        name: dto.name,
        email: dto.email,
        apiKeyHash: apiKey,
        webhookUrl: dto.webhookUrl ?? null,
        webhookSecret: dto.webhookUrl ? generateWebhookSecret() : null,
        kycVerified: dto.kycVerified ?? false,
      },
      include: { _count: { select: { invoices: true } } },
    });

    return {
      ...this.toResponse(merchant, 0),
      apiKey,
    };
  }

  async listMerchants(): Promise<MerchantResponseDto[]> {
    const merchants = await this.prisma.merchant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { invoices: true } },
        invoices: { where: { status: 'paid' }, select: { id: true } },
      },
    });

    return merchants.map((m) =>
      this.toResponse(m, m.invoices.length),
    );
  }

  async getMerchant(id: string): Promise<MerchantResponseDto> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        _count: { select: { invoices: true } },
        invoices: { where: { status: 'paid' }, select: { id: true } },
      },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');
    return this.toResponse(merchant, merchant.invoices.length);
  }

  async updateMerchant(id: string, dto: UpdateMerchantDto): Promise<MerchantResponseDto> {
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });
    if (!merchant) throw new NotFoundException('Merchant not found');

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.webhookUrl !== undefined) data.webhookUrl = dto.webhookUrl;
    if (dto.kycVerified !== undefined) data.kycVerified = dto.kycVerified;
    if (dto.webhookSecret !== undefined) data.webhookSecret = dto.webhookSecret;
    if (dto.webhookUrl && !merchant.webhookSecret && dto.webhookSecret === undefined) {
      data.webhookSecret = generateWebhookSecret();
    }

    const updated = await this.prisma.merchant.update({
      where: { id },
      data,
      include: {
        _count: { select: { invoices: true } },
        invoices: { where: { status: 'paid' }, select: { id: true } },
      },
    });

    return this.toResponse(updated, updated.invoices.length);
  }

  async rotateApiKey(id: string): Promise<MerchantCreatedDto> {
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });
    if (!merchant) throw new NotFoundException('Merchant not found');

    const apiKey = generateApiKey();
    const updated = await this.prisma.merchant.update({
      where: { id },
      data: { apiKeyHash: apiKey },
      include: {
        _count: { select: { invoices: true } },
        invoices: { where: { status: 'paid' }, select: { id: true } },
      },
    });

    return {
      ...this.toResponse(updated, updated.invoices.length),
      apiKey,
    };
  }

  async getMe(apiKey: string): Promise<MerchantResponseDto> {
    const merchant = await this.merchantAuth.resolveMerchant(apiKey);
    const counts = await this.prisma.invoice.groupBy({
      by: ['status'],
      where: { merchantId: merchant.id },
      _count: true,
    });
    const paidCount = counts.find((c) => c.status === 'paid')?._count ?? 0;
    const invoiceCount = counts.reduce((sum, c) => sum + c._count, 0);

    return this.toResponse(
      { ...merchant, _count: { invoices: invoiceCount } },
      paidCount,
    );
  }

  async updateMe(apiKey: string, dto: UpdateMerchantDto): Promise<MerchantResponseDto> {
    const merchant = await this.merchantAuth.resolveMerchant(apiKey);
    return this.updateMerchant(merchant.id, dto);
  }

  async testConnection(apiKey: string, baseUrl?: string): Promise<ConnectionTestResultDto> {
    const merchant = await this.merchantAuth.resolveMerchant(apiKey);
    const origin = (baseUrl || 'http://localhost:4000').replace(/\/$/, '');

    let healthStatus: string | undefined;
    let xrplConnected: boolean | undefined;
    let apiReachable = false;

    try {
      const res = await fetch(`${origin}/v1/health`, { signal: AbortSignal.timeout(5000) });
      apiReachable = res.ok;
      if (res.ok) {
        const health = await res.json();
        healthStatus = health.status;
        xrplConnected = health.chains?.xrpl?.connected;
      }
    } catch {
      apiReachable = false;
    }

    const invoiceProbe = await this.prisma.invoice.findFirst({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ok: apiReachable,
      merchantId: merchant.id,
      merchantName: merchant.name,
      apiReachable,
      healthStatus,
      xrplConnected,
      message: apiReachable
        ? `Connected as ${merchant.name}. ${invoiceProbe ? 'Invoices found.' : 'No invoices yet — create one to test.'}`
        : 'API unreachable — check API_URL / deployment.',
      testedAt: new Date().toISOString(),
    };
  }

  async listWebhookDeliveries(limit = 50) {
    return this.prisma.webhookDelivery.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private toResponse(merchant: any, paidCount: number): MerchantResponseDto {
    return {
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      apiKeyMasked: this.merchantAuth.maskApiKey(merchant.apiKeyHash),
      webhookUrl: merchant.webhookUrl,
      hasWebhookSecret: Boolean(merchant.webhookSecret),
      kycVerified: merchant.kycVerified,
      invoiceCount: merchant._count?.invoices ?? 0,
      paidCount,
      createdAt: merchant.createdAt.toISOString(),
      updatedAt: merchant.updatedAt.toISOString(),
    };
  }
}