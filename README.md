🇺🇸 [한국어](./README.ko.md)

# Parents Basic Pension Check — Eligibility Calculator

A Toss mini-app that helps users check if their parents are eligible for Korea's basic pension (기초연금). Users input birth date, spousal status, residential area, monthly income, and property information to receive an instant eligibility diagnosis, estimated monthly benefit amount, and application timing guidance.

## Features

- 📋 Structured input form for parents' personal info (birth date, spouse status, region)
- 💰 Monthly income entry (earned and other income sources)
- 🏠 Property assessment (real estate, financial assets, debt, luxury items)
- ✅ Instant eligibility diagnosis with three verdict levels
- 💵 Estimated monthly pension benefit calculations (per-person and household)
- 📅 Application timing with D-day countdown
- 🏷️ Reduction details (couple discount, income-reversal prevention)
- 📊 Detailed income/property breakdown display
- 💾 Automatic form save to device storage
- 📤 In-app sharing with customized messaging
- ⭐ App review request on successful diagnosis
- 📢 Banner ad slot integration

## Tech Stack

- **Framework**: React 18 + Vite
- **Routing**: React Router 7
- **UI**: Toss Design System (TDS) — `@toss/tds-mobile`
- **SDK**: App-in-Toss (`@apps-in-toss/web-framework`)
- **Language**: TypeScript
- **Testing**: Vitest (unit), Playwright (visual)
- **Styling**: Emotion + TDS adaptive CSS variables

## Getting Started

### Install dependencies
```bash
npm install
```

### Production build
```bash
npx vite build
```

### Deploy to Toss
```bash
npx ait build
```

Then submit the bundle via the Toss Developer Console for review.

### Run tests
```bash
npx vitest run              # Unit tests
npm run test:visual         # Visual regression tests (Playwright)
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_TOSS_AD_GROUP_ID` | Banner ad group ID from Toss Console | No |
| `VITE_TOSS_AD_SLOT_ID` | Full-screen ad slot ID | No |
| `VITE_TOSS_IAP_SKU` | In-app purchase SKU | No |
| `VITE_TOSS_PROMOTION_CODE` | Promotion reward code | No |
| `VITE_SHARE_OG_URL` | OG image URL for sharing preview | No |

Copy `.env.example` to `.env` and fill in values from the Toss Developer Console. Empty values degrade gracefully (features are omitted, not broken).

## Project Structure

```
src/
  pages/              — Screen components (Home, Result)
  components/         — Reusable TDS-based UI widgets
  lib/                — Business logic (pension calculation, validation, storage)
  __tests__/          — Unit and integration tests
  styles/             — Global styles
```

## Deployment

1. **Build**: `npx vite build` creates a static bundle in `dist/`
2. **Toss Console**: Use `npx ait build` to prepare the Toss-compatible bundle
3. **Review**: Submit via [Toss Developer Console](https://console.tossmini.com)
4. **CDN Hosting**: Toss CDN hosts the app automatically; no external deployment needed

The app runs on two origins:
- Production: `https://{appName}.web.tossmini.com`
- QR test: `https://{appName}.private-web.tossmini.com`

External APIs must allow both origins in CORS headers.

## License

MIT
