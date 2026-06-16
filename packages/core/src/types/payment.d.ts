export interface PaymentConfirmation {
    invoiceId: string;
    txHash: string;
    chain: string;
    amount: string;
    fromAddress?: string;
    destinationTag?: number | string;
    memo?: string;
    confirmedAt: Date;
    ledgerIndex?: number;
}
export interface PaymentEvent {
    type: 'payment.confirmed' | 'payment.expired' | 'payment.failed';
    invoice: any;
    payment?: PaymentConfirmation;
    timestamp: string;
}
//# sourceMappingURL=payment.d.ts.map