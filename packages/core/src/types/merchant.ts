export interface Merchant {
  id: string;
  name: string;
  email: string;
  apiKey: string; // hashed in real storage
  webhookUrl?: string;
  webhookSecret?: string; // for HMAC
  createdAt: Date;
  settings?: {
    defaultChain?: string;
    rateLimit?: number;
    kycRequired?: boolean;
  };
}
