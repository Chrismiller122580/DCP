import { IsBoolean, IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateMerchantDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  webhookUrl?: string;

  @IsOptional()
  @IsBoolean()
  kycVerified?: boolean;
}