# Deployment guide

## 1. Create the Supabase project

Create a Supabase project and keep its project URL and anon key available. Never expose the service-role key in browser code.

## 2. Configure the frontend

Copy `.env.example` to `.env` and replace both placeholder values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Apply database migrations

Apply every SQL file in `supabase/migrations` in filename order. The migrations create the schema, Row Level Security policies, owner-scoped functions, public proposal functions, dashboard reporting, settings updates, and removable sample data.

## 4. Deploy the public proposal function

Deploy `supabase/functions/public-proposal`. Its JWT verification is disabled because a client opens a proposal using a high-entropy public token. The function validates that token before exposing or changing any proposal information.

Set these Edge Function secrets in Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGIN`, set to the exact production website origin

The service-role key must remain server-side.

## 5. Build and test

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

Test these workflows before launch:

- Sign up, sign in, password reset, and sign out
- Create, edit, archive, and search clients
- Create a proposal and verify line-item totals, discounts, and tax
- Prepare and share a proposal
- Open the public link in a private browser window
- Add a client comment and accept or decline the proposal
- Confirm the activity history and dashboard update
- Load and remove the labelled sample workspace
- Save business branding and proposal defaults
- Test desktop, tablet, mobile, keyboard navigation, and reduced motion

## 6. Deploy the frontend

Deploy the `dist` output to Bolt Hosting or another static host. Add the two `VITE_` values to the hosting environment before building. After deployment, set `ALLOWED_ORIGIN` to the exact public origin and redeploy the Edge Function if required.

## Security notes

- Do not add a service-role key to `.env` or any `VITE_` variable.
- Keep Row Level Security enabled on every user-owned table.
- Do not replace owner checks with client-supplied user IDs.
- Use the public token route only for proposal review actions.
- Rotate any credential that has been committed or shared accidentally.
- Repeat the private-window public-link test after changing CORS or hosting domains.
