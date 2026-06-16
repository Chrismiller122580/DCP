export interface WebhookPayload {
    id: string;
    event: 'payment.confirmed' | 'payment.expired';
    data: {
        invoiceId: string;
        merchantId: string;
        status: string;
        txHash?: string;
        amount: string;
        currency: string;
        chain: string;
        paidAt?: string;
    };
    timestamp: string;
    signature?: string;
}
//# sourceMappingURL=webhook.d.ts.map