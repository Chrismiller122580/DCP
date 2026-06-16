# DCP Getting Started

## Prerequisites
- Node >= 20
- Docker + Docker Compose (for Postgres)
- (optional) Expo Go app for mobile testing

## 1. Install & Bootstrap DB
```bash
npm install
docker compose up -d
cd packages/api
npx prisma migrate dev --schema=../../prisma/schema.prisma
```

## 2. Run the stack
```bash
npm run dev
```

This uses Turborepo to run `dev` in parallel across packages/apps.

## 3. Test the API (MVP)
Use the magic dev key `dcp_dev_1234567890`:

```bash
curl -X POST http://localhost:4000/v1/invoices \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dcp_dev_1234567890" \
  -d '{"amount":"5.25","currency":"XRP","chain":"xrpl"}'
```

Response includes `qrCode` (data URL) and `paymentUri`.

Open the merchant dashboard at http://localhost:3000 , paste the key if needed, create invoices and view generated QR codes.

## XRPL
Currently points at public XRPL testnet. Payments can be sent using any XRPL wallet (Xumm, Ledger, etc) using the destination address + destinationTag.

The listener (future enhancement) will pick up validated payments via WebSocket and fire webhooks + update DB status.

## Next Steps (per roadmap)
See main README.
