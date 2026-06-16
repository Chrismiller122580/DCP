# DCP Mobile (DCP Pay) - React Native + Expo

Customer-facing app for scanning QR, paying invoices, and viewing history.

## Quick Start (after full repo setup)

```bash
cd apps/mobile
npm install
npx expo start
```

MVP screens planned:
- Scan QR (or paste payment URI)
- Pay / Confirm screen (deep link into wallet or built-in XRPL pay)
- Payment history + receipts
- Settings (API endpoint toggle testnet/mainnet)

This is currently a stub created by `create-expo-app`. Replace / extend with real flows that call the public DCP API or use the XRPL listener for push updates.

See root README + roadmap.
