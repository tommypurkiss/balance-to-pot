# PotSaver - Credit Card to Monzo Pot Automation

A UK-focused web application that automatically transfers credit card balances to Monzo pots by connecting Monzo accounts (via Monzo API) and external credit cards (via TrueLayer API).

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **APIs**: Monzo, TrueLayer, Stripe

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

**Phase 2 (Monzo) requires:**

- Supabase project with migrations applied (`supabase/migrations/`)
- Monzo developer credentials from [developers.monzo.com](https://developers.monzo.com)
- `MONZO_REDIRECT_URI` must match your Monzo app config (e.g. `http://localhost:3000/api/auth/monzo/callback`)

**Phase 3 (TrueLayer) requires:**

- TrueLayer credentials from [console.truelayer.com](https://console.truelayer.com)
- `TRUELAYER_REDIRECT_URI` must match your TrueLayer app config (e.g. `http://localhost:3000/api/auth/truelayer/callback`)

**TrueLayer Console setup checklist:**

1. **Application** – Create an app in [TrueLayer Console](https://console.truelayer.com) and copy Client ID & Client Secret.
2. **Redirect URI** – Add your callback URL exactly (e.g. `http://localhost:3000/api/auth/truelayer/callback` for local dev). Must match `TRUELAYER_REDIRECT_URI` in `.env.local`.
3. **Products** – Ensure the **Cards** product is enabled for your app (Console → Your App → Products).
4. **Environment** – Use Sandbox for testing (mock data) or Live for real cards. Credentials differ per environment.
5. **Provider types** – The app uses `enable_open_banking_providers: true` and `enable_credentials_sharing_providers: false`. Some credit card providers (e.g. Amex, Barclaycard) use credentials sharing; if your bank doesn’t appear, try setting `enable_credentials_sharing_providers` to `true` in `src/lib/api/truelayer.ts`.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router (routes only)
│   ├── api/auth/monzo/    # Monzo OAuth connect & callback
│   ├── auth/              # Auth pages
│   ├── dashboard/         # Dashboard pages
│   └── ...
├── views/                  # Page components (standardized)
│   ├── auth/              # Login, signup
│   ├── dashboard/         # Dashboard, accounts, automations
│   └── home.tsx, privacy.tsx, terms.tsx
├── components/
│   ├── accounts/          # MonzoAccountCard, etc.
│   ├── landing/           # Landing page sections
│   ├── layout/            # Navbar, Footer
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── api/               # Monzo, TrueLayer, Supabase clients
│   ├── constants/         # Limits, errors
│   └── utils/             # formatCurrency, reconnection
├── hooks/                  # useMonzoAccounts, etc.
└── types/                  # TypeScript interfaces
```

## Development Roadmap

- **Phase 1** ✓: Foundation - Next.js, Tailwind, shadcn/ui, theme system, landing page
- **Phase 2** ✓: Monzo Integration - OAuth flow, accounts & pots display, reconnection countdown
- **Phase 3** ✓: TrueLayer Integration - OAuth flow, credit cards display, wire to automations
- **Phase 4** ✓: Automation Core - create rules, select pots, schedule (weekly/monthly)
- **Phase 5**: Scheduled Transfers
- **Phase 6+**: Dashboard metrics, notifications, Stripe, PWA, polish

## License

Private - All rights reserved
