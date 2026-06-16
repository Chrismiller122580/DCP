import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateMerchantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  webhookUrl?: string | null;

  @IsOptional()
  @IsString()
  webhookSecret?: string | null;

  @IsOptional()
  @IsBoolean()
  kycVerified?: boolean;
}