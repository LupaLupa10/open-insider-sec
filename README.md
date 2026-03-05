# Insider Trading Explorer

Public SEC Form 4 explorer built with `Next.js App Router`, `Supabase`, and `Vercel`.

## What is included

- Public explorer with URL-based filters
- Filing detail pages
- Email/password authentication
- Saved filter presets per user
- Supabase SQL migrations and RLS policies
- Local import script for extracted Form 4 JSON/CSV

## Stack

- `Next.js`
- `React`
- `Supabase Auth + Postgres`
- `Vercel`

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

3. Apply the SQL in [supabase/migrations/202602280001_init.sql](/Users/derrine.chia/Documents/insider-trading/supabase/migrations/202602280001_init.sql) to your Supabase project.

4. Start development:

```bash
npm run dev
```

## Import existing extracted Form 4 data

The app assumes extracted records already exist outside the app.

Accepted source formats:

- JSON array of objects
- CSV with column headers

Required fields per row:

- `filing_id`
- `issuer_name`
- `reporting_owner_name`
- `transaction_date`
- `filing_date`
- `transaction_code`

Run the import:

```bash
npm run import:form4 -- ./path/to/form4.json
```

The importer normalizes common snake_case and camelCase field names and preserves the original row in `raw_payload`.

## Extract directly from SEC EDGAR

You can now fetch Form 4 filings directly from SEC and optionally upsert into Supabase.

Required env var:

- `SEC_USER_AGENT` (SEC requires contact info in user-agent, example: `Your Name your@email.com`)

Example extraction only (writes JSON output, no DB upsert):

```bash
npm run extract:sec -- --cik 1318605,320193 --limit 50 --since 2025-01-01 --out ./sec-form4.json
```

Example extraction + upsert to Supabase:

```bash
npm run extract:sec -- --cik 1318605 --limit 100 --since 2025-01-01 --upsert
```

Notes:

- `--cik` accepts one or multiple CIK values separated by commas.
- `--limit` applies per CIK to recent filings.
- The script parses non-derivative transaction rows from Form 4 XML when present.
- If no non-derivative transaction block exists, it inserts a minimal fallback transaction row.

## Auth configuration

In Supabase Auth URL settings, add:

- `http://localhost:3000/auth/callback`
- your production domain, for example `https://your-app.vercel.app/auth/callback`

If you enable email confirmations or password reset emails, use the same callback route.

## Deployment

1. Push the repo to Git.
2. Import the project into Vercel.
3. Add the four environment variables from `.env.example`.
4. Ensure Supabase Auth redirect URLs include the deployed Vercel domain.
5. Deploy.

## Tests

```bash
npm test
```

Current tests cover the filter parsing/serialization contract. The rest of the app still needs integration coverage once dependencies are installed and Supabase credentials are configured.
