import { IsString, IsNumber, IsOptional, Min, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SupportedChain {
  XRPL = 'xrpl',
  BITCOIN = 'bitcoin',
  ETHEREUM = 'ethereum',
  SOLANA = 'solana',
  BASE = 'base',
  DOGECOIN = 'dogecoin',
}

export class CreateInvoiceDto {
  @ApiProperty({ example: '25.50', description: 'Amount as decimal string' })
  @IsString()
  amount: string;

  @ApiProperty({ example: 'XRP', default: 'XRP' })
  @IsString()
  currency: string;

  @ApiProperty({ enum: SupportedChain, example: 'xrpl', description: 'Chain / coin network' })
  @IsEnum(SupportedChain)
  chain: SupportedChain;

  @ApiPropertyOptional({ example: 60, description: 'Minutes until expiry' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expiresInMinutes?: number;

  @ApiPropertyOptional({ type: Object, example: { orderId: 'ORD-123' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
