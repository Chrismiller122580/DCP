export type Chain = 'xrpl' | 'bitcoin' | 'ethereum' | 'solana' | 'base' | 'dogecoin';
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'expired' | 'canceled' | 'overpaid' | 'underpaid';
export interface Invoice {
    id: string;
    merchantId: string;
    amount: string;
    currency: string;
    chain: Chain;
    destinationAddress: string;
    destinationTag?: number | string;
    memo?: string;
    status: InvoiceStatus;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    paidAt?: Date;
    txHash?: string;
    payerAddress?: string;
    metadata?: Record<string, unknown>;
}
export interface CreateInvoiceInput {
    merchantId: string;
    amount: string;
    currency: string;
    chain: Chain;
    expiresInMinutes?: number;
    metadata?: Record<string, unknown>;
    options?: {
        destinationTag?: number;
        memo?: string;
    };
}
export interface InvoiceWithQR extends Invoice {
    qrCodeDataUrl?: string;
    paymentUri?: string;
}
