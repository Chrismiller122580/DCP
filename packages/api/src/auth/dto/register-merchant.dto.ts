import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class RegisterMerchantDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  webhookUrl?: string;
}