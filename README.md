🇺🇸 [한국어](./README.ko.md)

# Parents Basic Pension Check — Diagnose basic pension eligibility in seconds

An App-in-Toss mini app that helps adult children determine whether their parents qualify for Korea's Basic Old Age Pension. Enter your parents' age, residence, and income/asset details, and get an instant eligibility verdict (likely / borderline / unlikely), estimated monthly pension amount, and application date.

## Features

- 💰 **Eligibility Diagnosis** — Calculates income-recognized amount by combining earned income, other income, and property income conversion, then compares against selection threshold to predict qualification likelihood
- 📊 **Pension Amount Forecast** — Estimates monthly pension including spousal reduction (20%) and income reversal prevention adjustments
- 📅 **Application Timing** — Calculates when your parents become eligible at age 65 with D-day countdown
- 📈 **Asset Breakdown** — Shows property conversion details by category (general property, financial assets, debt, basic property deduction, luxury auto/club membership)
- 💾 **Auto-Save** — Stores last input locally for quick re-check without re-entering everything

## Tech Stack

- **Framework**: Vite + React 18
- **Routing**: React Router DOM 7
- **UI Components**: Toss Design System (TDS Mobile)
- **State**: React Context + localStorage (SDK `Storage` for native persistence)
- **Testing**: Vitest (unit) + Playwright (visual)
- **Styling**: Emotion

## Getting Started

### Install dependencies
```bash
npm install
```

### Build for production
```bash
npx vite build
```

Outputs a static bundle to `dist/` ready for CDN hosting. No server-side rendering or dynamic routes.

### Deploy to Apps-in-Toss
```bash
npx ait build
npx ait deploy --api-key YOUR_API_KEY
```

Deploys the static bundle to Toss CDN. For first-time setup, register your app in the Toss Developer Console.

### Run tests
```bash
npx tsc --noEmit        # Type check
npx vitest run          # Unit tests
npm run test:visual     # Visual regression (Playwright)
```

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `VITE_SHARE_OG_URL` | Open Graph image URL for share preview (KakaoTalk, SMS) | No |
| `VITE_TOSS_AD_SLOT_ID` | Banner ad slot ID from Toss Developer Console | No |
| `VITE_TOSS_IAP_SKU` | In-app purchase SKU (unused in this app) | No |
| `VITE_TOSS_PROMOTION_CODE` | Promotion reward code for user incentives | No |

See `.env.example` for the template. Vite injects these at build time. Leave blank to degrade gracefully (feature unavailable, no white screen).

## Project Structure

```
src/
├── pages/                 # Screen components
│   ├── Home.tsx          # Input form: demographics, income, assets
│   └── Result.tsx        # Results: eligibility, pension forecast, timeline
├── components/           # Reusable UI (TDS wrappers + pre-built)
│   ├── ScreenScaffold.tsx
│   ├── SummaryHero.tsx
│   ├── Card.tsx
│   ├── BreakdownSection.tsx
│   └── ... (10+ support components)
├── lib/                  # Core logic
│   ├── calculator.ts     # Pension eligibility & amount calculation
│   ├── pension.ts        # Eligibility verdict logic
│   ├── policy.ts         # 2025 thresholds (update before 2026 launch)
│   ├── validation.ts     # Input field validation
│   ├── sanitize.ts       # Input cleanup (strip commas, parse numbers)
│   ├── storedInput.ts    # localStorage + state sync
│   ├── types.ts          # Shared TypeScript types
│   └── ... (analytics, share, review, schedule)
├── __tests__/            # Vitest unit tests
├── App.tsx               # Route definitions
└── main.tsx              # React root (do not edit)
```

## Policy Thresholds (2025 — Update Before 2026 Launch)

These constants in `src/lib/policy.ts` must be updated annually:

- Selection threshold: ₩2,280,000 (single) / ₩3,648,000 (couple)
- Base pension: ₩342,510/month
- Earned income deduction: ₩1,120,000
- Basic property deduction: ₩135M (metro) / ₩85M (mid-size) / ₩72.5M (rural)
- Property conversion rate: 4% annually

Before production launch in 2026, verify current-year values from the Ministry of Health and Welfare announcement.

## Deployment

The app is deployed to Toss via the Apps-in-Toss platform (not traditional CDN). The build process:

1. **Build static bundle**: `npx vite build` → `dist/` (CSR only, no SSR)
2. **Authenticate**: `npx ait build` compiles for Toss WebView
3. **Submit to Toss CDN**: `npx ait deploy` pushes to https://{appName}.web.tossmini.com

Toss review checklist:
- ✅ Zero console errors
- ✅ Zero CORS errors (API calls to external servers need CORS headers)
- ✅ No external domain navigation (no window.location.href to 3rd-party sites)
- ✅ Users 19+ only
- ✅ Back/close buttons work (use React Router, not custom history)
- ✅ No test ad/promo keys in code (use environment variables)

## License

MIT
