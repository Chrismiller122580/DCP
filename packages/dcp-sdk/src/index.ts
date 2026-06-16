// @dcp/sdk - Minimal client for DCP API
export interface DcpClientOptions {
  baseUrl?: string;
  apiKey: string;
}

export interface CreateInvoiceParams {
  amount: string;
  currency: string;
  chain: string;
  expiresInMinutes?: number;
  metadata?: Record<string, any>;
}

export class DcpClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(options: DcpClientOptions) {
    this.baseUrl = (options.baseUrl || 'http://localhost:4000').replace(/\/$/, '');
    this.apiKey = options.apiKey;
  }

  async createInvoice(params: CreateInvoiceParams) {
    const res = await fetch(`${this.baseUrl}/v1/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async getInvoice(id: string) {
    const res = await fetch(`${this.baseUrl}/v1/invoices/${id}`, {
      headers: { 'X-API-Key': this.apiKey },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async simulatePayment(invoiceId: string) {
    const res = await fetch(`${this.baseUrl}/v1/dev/simulate-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({ invoiceId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async reconcile() {
    const res = await fetch(`${this.baseUrl}/v1/dev/reconcile`, {
      method: 'POST',
      headers: { 'X-API-Key': this.apiKey },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
}

// Example usage:
// const client = new DcpClient({ apiKey: 'dcp_dev_1234567890' });
// const inv = await client.createInvoice({ amount: '10', currency: 'XRP', chain: 'xrpl' });
