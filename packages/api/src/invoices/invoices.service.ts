import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { XrplService } from '../xrpl/xrpl.service';
import * as QRCode from 'qrcode';
import { Prisma } from '@prisma/client';
import { POPULAR_COINS } from '@dcp/core';

const GENESIS_ADDRESS = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xrpl: XrplService,
  ) {}

  async createInvoice(dto: CreateInvoiceDto, apiKey: string) {
    let merchant = await this.prisma.merchant.findFirst({
      where: { apiKeyHash: apiKey },
    });

    // MVP DEV HELPER: allow instant testing with magic dev key (never use in prod)
    if (!merchant && apiKey === 'dcp_dev_1234567890') {
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
      throw new UnauthorizedException('Invalid API key. For local dev use header X-API-Key: dcp_dev_1234567890');
    }

    if ((merchant as any).kycVerified === false) {
      throw new BadRequestException('KYC verification required before creating invoices. Update merchant settings or contact support.');
    }

    const expiresAt = new Date(Date.now() + (dto.expiresInMinutes ?? 60) * 60 * 1000);

    let destinationAddress: string;
    let destinationTag: number | null = null;
    let memo: string | null = null;
    let paymentUri: string;
    let currency = dto.currency.toUpperCase();

    const coinInfo = POPULAR_COINS.find(c => c.chain === dto.chain) || POPULAR_COINS[0];
    void coinInfo;

    if (dto.chain === 'xrpl') {
      const receive = await this.ensureReceiveAccount(merchant);
      const tag = await this.allocateDestinationTag(merchant.id);
      const paymentRequest = await this.xrpl.createPaymentRequest({
        merchantId: merchant.id,
        amount: dto.amount,
        currency,
        chain: 'xrpl',
        expiresInMinutes: dto.expiresInMinutes ?? 60,
        metadata: dto.metadata,
        options: {
          destinationAddress: receive.address,
          destinationTag: tag,
        },
      });
      destinationAddress = paymentRequest.destinationAddress;
      destinationTag = paymentRequest.destinationTag ? Number(paymentRequest.destinationTag) : null;
      memo = paymentRequest.memo ?? null;
      paymentUri = this.xrpl.buildPaymentUri(destinationAddress, dto.amount, destinationTag ?? undefined);
    } else {
      const placeholders: Record<string, string> = {
        bitcoin: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        ethereum: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        solana: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
        base: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        dogecoin: 'nV1q6v3kN2pL8mX7bY5tR9wE4uI3oP6aS',
      };
      destinationAddress = placeholders[dto.chain] || 'demo-address-' + dto.chain;
      destinationTag = Math.floor(Math.random() * 1000000);
      paymentUri = `${dto.chain}:${destinationAddress}?amount=${dto.amount}${destinationTag ? `&tag=${destinationTag}` : ''}`;
      if (dto.chain === 'base') currency = 'USDC';
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        merchantId: merchant.id,
        amount: dto.amount,
        currency,
        chain: dto.chain,
        destinationAddress,
        destinationTag,
        memo,
        status: 'pending',
        expiresAt,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    let qrCode: string | undefined;
    try {
      qrCode = await QRCode.toDataURL(paymentUri);
    } catch {
      qrCode = paymentUri;
    }

    return this.toResponseDto(invoice, qrCode, paymentUri);
  }

  async getInvoice(id: string, apiKey: string): Promise<InvoiceResponseDto | null> {
    const merchant = await this.prisma.merchant.findFirst({
      where: { apiKeyHash: apiKey },
    });
    if (!merchant) throw new UnauthorizedException('Invalid API key');

    const invoice = await this.prisma.invoice.findFirst({
      where: { id, merchantId: merchant.id },
    });
    if (!invoice) return null;

    return this.toResponseDto(invoice);
  }

  async listInvoices(apiKey: string): Promise<InvoiceResponseDto[]> {
    const merchant = await this.prisma.merchant.findFirst({
      where: { apiKeyHash: apiKey },
    });
    if (!merchant) throw new UnauthorizedException('Invalid API key');

    const invoices = await this.prisma.invoice.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return invoices.map((inv) => this.toResponseDto(inv));
  }

  private async ensureReceiveAccount(merchant: { id: string; xrplAddress: string | null; xrplSeed: string | null }) {
    if (merchant.xrplAddress && merchant.xrplAddress !== GENESIS_ADDRESS) {
      return { address: merchant.xrplAddress };
    }
    if (this.xrpl.networkName !== 'testnet') {
      throw new BadRequestException('Set a funded merchant xrplAddress before creating mainnet invoices.');
    }

    const funded = await this.xrpl.fundTestnetWallet();
    if (!funded) {
      throw new BadRequestException('XRPL testnet faucet did not return a receive account.');
    }

    const claimed = await this.prisma.merchant.updateMany({
      where: { id: merchant.id, OR: [{ xrplAddress: null }, { xrplAddress: GENESIS_ADDRESS }] },
      data: { xrplAddress: funded.address, xrplSeed: funded.seed },
    });
    if (claimed.count === 0) {
      const current = await this.prisma.merchant.findUnique({ where: { id: merchant.id } });
      if (!current?.xrplAddress) {
        throw new BadRequestException('Could not store XRPL receive account.');
      }
      return { address: current.xrplAddress };
    }
    merchant.xrplAddress = funded.address;
    return { address: funded.address };
  }

  private async allocateDestinationTag(merchantId: string): Promise<number> {
    const updated = await this.prisma.merchant.update({
      where: { id: merchantId },
      data: { nextDestinationTag: { increment: 1 } },
    });
    return updated.nextDestinationTag - 1;
  }

  private toResponseDto(invoice: any, qrCode?: string, paymentUri?: string): InvoiceResponseDto {
    return {
      id: invoice.id,
      merchantId: invoice.merchantId,
      amount: invoice.amount,
      currency: invoice.currency,
      chain: invoice.chain,
      destinationAddress: invoice.destinationAddress,
      destinationTag: invoice.destinationTag,
      memo: invoice.memo,
      status: invoice.status,
      expiresAt: invoice.expiresAt.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      paidAt: invoice.paidAt?.toISOString(),
      txHash: invoice.txHash,
      qrCode,
      paymentUri,
    };
  }
}
