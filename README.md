# DCP – XRPL-First Custom Crypto Payment Gateway & App

**Full Custom Ownership • XRPL Primary • Public API • Branded Mobile + Web App**

## Vision
Build a **100% owned** crypto payment platform called **DCP** where XRP Ledger (XRPL) is the flagship chain for lightning-fast, near-zero-fee payments, with easy multi-chain support. Merchants integrate via clean REST + webhooks. Users get a beautiful React Native app. Everything is non-custodial by default for minimal regulatory overhead in Florida/US.

**Key Differentiators**  
- XRPL 3–5s finality + Destination Tags + Escrow  
- Clean public API + SDKs  
- Branded mobile checkout + merchant dashboard  
- Future white-label SaaS potential  

## Tech Stack (2026 Production-Ready)
- **Frontend / Mobile** — React Native (Expo) + Next.js 15 (web dashboard)  
- **Backend / API** — NestJS (TypeScript) + Prisma + PostgreSQL + Redis  
- **XRPL** — Official `xrpl.js` + WebSocket subscriptions  
- **Other Chains** — viem/wagmi (EVM), @solana/web3.js (easy to add)  
- **Auth** — Clerk + SIWE (MVP: API keys)  
- **Infra** — Docker + Turborepo monorepo + AWS/GCP + Vercel  
- **Tools** — OpenAPI (Swagger), BullMQ, Sentry, Prisma Studio, Zod  

## Project Folder Structure (Monorepo)

```
/dcp
├── apps/
│   ├── mobile/          # React Native Expo app (DCP Pay)
│   ├── web-dashboard/   # Next.js merchant portal
│   └── checkout-widget/ # Embeddable component
├── packages/
│   ├── api/             # NestJS REST + Webhooks
│   ├── xrpl-service/    # XRPL-specific logic
│   ├── core/            # Shared types & utils
│   └── blockchain/      # Multi-chain abstraction
├── docs/
├── prisma/
├── docker-compose.yml
├── turbo.json
├── README.md (this file)
└── package.json (workspace)
```

## Architecture Overview
- **API Gateway** → Merchant requests  
- **Payment Orchestrator** → Dispatches to XRPL / other handlers  
- **XRPL Listener** → WebSocket → validated ledger → webhook + DB  
- **Non-custodial Flow** → Generate address + tag → monitor only  

## Must-Have Features by Phase

**MVP (Week 1–8)**
- Create invoice (XRPL focus)
- Generate QR + Destination Tag + Memo
- Real-time confirmation webhook
- React Native customer app (scan/pay/history)
- Merchant dashboard (transactions)
- Basic API keys

**v1 (Week 9–20)**
- Webhooks + SDK examples
- Solana + Base support
- Escrow & stablecoin pathfinding on XRPL
- Analytics + exports
- KYC toggle + rate limiting

**Future**
- POS mode, WooCommerce plugin, white-label mode, fiat ramps

## Public API Specification (high-level)
- `POST /v1/invoices` (chain: "xrpl" supported)
- `GET /v1/invoices/:id`
- Webhook endpoints (`payment.confirmed`, `payment.expired`)
- `POST /v1/payouts`, `/rates`, `/balances`

All documented with OpenAPI.

## XRPL Implementation Notes
- Use `xrpl.js` for connection, Payment tx, subscribe to account.
- Use Destination Tag + Memo for invoice correlation.
- Start with XRPL testnet, then mainnet toggle.
- Include helper functions: createPaymentRequest, monitorTransaction, buildQR.

## Development Roadmap
1. Initialize Turborepo + packages (api, xrpl-service, mobile, web)
2. Set up NestJS API + Prisma + basic auth
3. Implement XRPL service with testnet connection + invoice creation
4. Build React Native mobile checkout flow
5. Add merchant Next.js dashboard
6. Wire webhooks + real-time updates
7. Add security, OpenAPI docs, Docker
8. Write tests + deployment scripts

## Security & Compliance
- Non-custodial default
- API key + HMAC webhooks
- Rate limiting + Zod validation
- Plan for Certik audit & Florida MSB readiness

## Getting Started (Local Dev)

```bash
git clone <repo>
cd dcp
npm install

# 1. Start infrastructure (Postgres + Redis)
docker compose up -d

# 2. Apply DB schema
cd packages/api
npx prisma migrate dev --schema=../../prisma/schema.prisma --name init
cd ../..

# 3. Start everything (API + Dashboard + ...)
npm run dev
```

- API + Swagger: http://localhost:4000 + /docs
- Merchant Dashboard: http://localhost:3000 (default Next port)
- Use magic dev key in dashboard or header: `dcp_dev_1234567890`

See individual package READMEs and `docs/` for deeper instructions.

## License
Proprietary / All Rights Reserved (DCP)
