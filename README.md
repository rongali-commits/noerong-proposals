# Noerong Proposals

A production-ready, white-label proposal and client approval platform for freelancers, consultants, studios, and small agencies.

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-yqx1197s)

## What is included

- Branded public proposal pages with secure share links
- Structured line items, discounts, tax, and accurate totals
- Client comments plus accept and decline decisions
- Proposal activity history and decision records
- Client and proposal management
- Pipeline, acceptance, and expiry reporting
- Business branding and default proposal settings
- Clearly labelled sample workspace data for onboarding
- Responsive layouts, keyboard support, reduced-motion support, and print styles
- Supabase database migrations and Edge Function source

## Technology

- React 18 and TypeScript
- Vite
- Tailwind CSS
- Supabase Auth, PostgreSQL, Row Level Security, RPC functions, and Edge Functions
- Bolt for the original build and deployment workflow

## Quick start

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Add your Supabase project URL and anon key.
4. Apply the SQL migrations in `supabase/migrations` in filename order.
5. Deploy the `public-proposal` Edge Function.
6. Add the required server-side Edge Function secrets described in `DEPLOYMENT_GUIDE.md`.
7. Start locally with `npm run dev`.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```

The included source has been reviewed for exposed secrets. Real production credentials are intentionally not included.

## Documentation

- `DEPLOYMENT_GUIDE.md` covers Supabase, the Edge Function, CORS, testing, and production deployment.
- `LICENSE.md` explains the buyer licence.

## Live product

https://noerong-proposals-sa-ta7h.bolt.host

Built by Noerong. Built with Bolt.
