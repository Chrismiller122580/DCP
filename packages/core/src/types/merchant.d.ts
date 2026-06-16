export interface Merchant {
    id: string;
    name: string;
    email: string;
    apiKey: string;
    webhookUrl?: string;
    webhookSecret?: string;
    createdAt: Date;
    settings?: {
        defaultChain?: string;
        rateLimit?: number;
        kycRequired?: boolean;
    };
}
//# sourceMappingURL=merchant.d.ts.map