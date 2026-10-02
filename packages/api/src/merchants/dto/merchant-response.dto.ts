export class MerchantResponseDto {
  id!: string;
  name!: string;
  email!: string;
  apiKeyMasked!: string;
  webhookUrl?: string | null;
  hasWebhookSecret!: boolean;
  kycVerified!: boolean;
  xrplAddress?: string | null;
  hasXrplSeed!: boolean;
  invoiceCount!: number;
  paidCount!: number;
  createdAt!: string;
  updatedAt!: string;
}

export class MerchantCreatedDto extends MerchantResponseDto {
  apiKey!: string; // shown once on create / rotate
}
