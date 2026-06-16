# DCP JS/TS SDK Example (Minimal Client)

This is a lightweight example client for the DCP API. In production, publish as `@dcp/sdk` or use OpenAPI generators.

```ts
// dcp-client.ts
export interface CreateInvoiceParams {
  amount: string;
  currency: string;
  chain: string;
  expiresInMinutes?: number;
  metadata?: Record<string, any>;
}

export interface Invoice {
  id: string;
  amount: string;
  currency: string;
  chain: string;
  destinationAddress: string;
  destinationTag?: number;
  status: string;
  qrCode?: string;
  paymentUri?: string;
  // ...
}

export class DcpClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl = 'http://localhost:4000', apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  async createInvoice(params: CreateInvoiceParams): Promise<Invoice> {
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

  async getInvoice(id: string): Promise<Invoice> {
    const res = await fetch(`${this.baseUrl}/v1/invoices/${id}`, {
      headers: { 'X-API-Key': this.apiKey },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async listInvoices(): Promise<Invoice[]> {
    const res = await fetch(`${this.baseUrl}/v1/invoices`, {
      headers: { 'X-API-Key': this.apiKey },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // Simulate for dev (remove in prod)
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
}

// Usage example
// const client = new DcpClient('http://localhost:4000', 'dcp_dev_1234567890');
// const inv = await client.createInvoice({ amount: '10', currency: 'XRP', chain: 'xrpl' });
// console.log(inv.qrCode);
```

For webhooks, merchants should verify the `X-DCP-Signature` header using their webhook secret (HMAC SHA256 of the raw body).

See the main README for more integration notes.
