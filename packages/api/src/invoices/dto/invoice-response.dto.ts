import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InvoiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  merchantId: string;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  chain: string;

  @ApiProperty()
  destinationAddress: string;

  @ApiPropertyOptional()
  destinationTag?: number;

  @ApiPropertyOptional()
  memo?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  expiresAt: string;

  @ApiProperty()
  createdAt: string;

  @ApiPropertyOptional()
  paidAt?: string;

  @ApiPropertyOptional()
  txHash?: string;

  @ApiPropertyOptional()
  qrCode?: string; // data URL or payment uri for simplicity

  @ApiPropertyOptional()
  paymentUri?: string;
}
