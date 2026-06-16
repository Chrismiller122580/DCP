# DCP Getting Started

## Prerequisites
- Node >= 20
- Docker + Docker Compose (for Postgres + Redis for BullMQ queues)
- (optional) Expo Go app for mobile testing

## 1. Install & Bootstrap DB + Redis
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

This uses Turborepo to run `dev` in parallel across packages/apps (API on 4000, Dashboard on 3000).

## 3. Test the API (MVP + Reliability features)
Use the magic dev key `dcp_dev_1234567890`:

```bash
# Create multi-coin invoice (XRPL real, others demo)
curl -X POST http://localhost:4000/v1/invoices \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dcp_dev_1234567890" \
  -d '{"amount":"5.25","currency":"XRP","chain":"xrpl"}'

# Check rates / balances / payouts
curl http://localhost:4000/v1/rates
curl http://localhost:4000/v1/balances?chain=xrpl
```

Open the merchant dashboard at http://localhost:3000 (use dev key), create invoices for any supported coin, view QR/URI, use "Simulate Payment (dev)" or "Reconcile (dev)".

Use the mobile app (Expo) to scan QR or paste URI and simulate pay.

## Reliability & Ops notes
- **Webhooks**: BullMQ-backed with retries, backoff, persistence in WebhookDelivery table, HMAC signatures.
- **Confirmation**: XRPL WS listener + polling fallback + periodic reconciliation job (catches missed payments).
- **Idempotency**: txHash checks + atomic DB updates.
- **Rate limiting**: 100 req/min global.
- **Health**: /health reports chain connectivity + features.

**For production (not yet implemented)**:
- Real providers for BTC/ETH/SOL (viem, @solana/web3.js full listeners).
- Proper merchant auth (Clerk/SIWE instead of dev key).
- Mainnet toggle with safety (never hardcode seeds).
- Full KYC flows + compliance logging.
- SDKs (JS client), more tests, Sentry, real deployments.

## XRPL
Real listener on public testnet (shared demo address). Use any XRPL wallet with destination + tag.

See main README for architecture and next steps.
