import { IsBoolean, IsOptional, IsString, IsUrl, Matches } from 'class-validator';

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

  @IsOptional()
  @IsString()
  @Matches(/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/)
  xrplAddress?: string;
}
