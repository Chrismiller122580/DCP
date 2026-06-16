import React, { useState } from 'react';

/**
 * DCP Checkout Widget (embeddable)
 * Usage:
 * <DcpCheckout invoiceId="..." apiBase="http://localhost:4000" onSuccess={...} />
 *
 * Supports multi-coin. Fetches invoice + shows details/QR + simulate pay for demo.
 */
export interface DcpCheckoutProps {
  invoiceId: string;
  apiBase?: string;
  onSuccess?: (txHash: string) => void;
  onExpired?: () => void;
}

export const DcpCheckout: React.FC<DcpCheckoutProps> = ({ 
  invoiceId, 
  apiBase = 'http://localhost:4000', 
  onSuccess 
}) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      // Note: in real embed use public invoice lookup or merchant key
      const res = await fetch(`${apiBase}/v1/invoices/${invoiceId}`, {
        headers: { 'X-API-Key': 'dcp_dev_1234567890' } // demo only
      });
      if (res.ok) setInvoice(await res.json());
    } catch {}
    setLoading(false);
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/v1/dev/simulate-payment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': 'dcp_dev_1234567890'
        },
        body: JSON.stringify({ invoiceId })
      });
      const data = await res.json();
      if (res.ok) {
        setPaid(true);
        onSuccess?.(data.simulatedTxHash);
      }
    } catch {}
    setLoading(false);
  };

  if (!invoice && !loading) {
    return (
      <div style={{ fontFamily: 'system-ui', padding: 20, border: '1px solid #222', borderRadius: 12, maxWidth: 380, background: '#111' }}>
        <button onClick={fetchInvoice} style={{ padding: '8px 16px', background: '#fff', color: '#000', border: 0, borderRadius: 6 }}>
          Load Invoice {invoiceId.slice(0,8)}...
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui', padding: 20, border: '1px solid #222', borderRadius: 12, maxWidth: 380, background: '#111', color: '#eee' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>DCP Checkout</div>
      
      {invoice && (
        <>
          <div style={{ fontSize: 13, marginBottom: 12 }}>
            {invoice.amount} {invoice.currency} on {invoice.chain.toUpperCase()}
            <br />
            <span style={{ fontSize: 11, opacity: 0.7 }}>To: {invoice.destinationAddress?.slice(0,16)}... {invoice.destinationTag ? `dt:${invoice.destinationTag}` : ''}</span>
          </div>

          {invoice.qrCode && (
            <div style={{ textAlign: 'center', margin: '12px 0' }}>
              <img src={invoice.qrCode} alt="QR" style={{ width: 160, height: 160, background: 'white', padding: 8, borderRadius: 8 }} />
            </div>
          )}

          {!paid ? (
            <button 
              onClick={handlePay} 
              disabled={loading}
              style={{ width: '100%', padding: '12px', background: '#22c55e', color: '#000', fontWeight: 600, border: 0, borderRadius: 8 }}
            >
              {loading ? 'Processing...' : `Pay ${invoice.amount} ${invoice.currency} (demo)`}
            </button>
          ) : (
            <div style={{ color: '#22c55e', textAlign: 'center' }}>✅ Paid! (tx: {invoice.txHash?.slice(0,12)}...)</div>
          )}

          <div style={{ fontSize: 10, opacity: 0.5, marginTop: 8, textAlign: 'center' }}>
            Embeddable widget • Real payments via listener
          </div>
        </>
      )}
    </div>
  );
};

export default DcpCheckout;
