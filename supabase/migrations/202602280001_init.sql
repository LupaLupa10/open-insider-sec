create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.filings (
  filing_id text primary key,
  accession_no text not null unique,
  issuer_cik text not null,
  issuer_ticker text,
  issuer_name text not null,
  reporting_owner_cik text not null,
  reporting_owner_name text not null,
  filing_date date not null,
  accepted_at timestamptz,
  sec_url text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.form4_transactions (
  id uuid primary key default gen_random_uuid(),
  filing_id text not null references public.filings (filing_id) on delete cascade,
  accession_no text not null,
  issuer_cik text not null,
  issuer_ticker text,
  issuer_name text not null,
  reporting_owner_cik text not null,
  reporting_owner_name text not null,
  reporting_owner_title text,
  is_director boolean not null default false,
  is_officer boolean not null default false,
  is_ten_percent_owner boolean not null default false,
  is_other boolean not null default false,
  officer_title text,
  security_title text,
  transaction_date date not null,
  filing_date date not null,
  transaction_code text not null,
  transaction_shares numeric,
  transaction_price_per_share numeric,
  acquired_disposed_code text,
  shares_owned_following numeric,
  ownership_type text,
  form_type text not null default '4',
  sec_url text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_filters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  filters jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists idx_form4_transactions_filing_id on public.form4_transactions (filing_id);
create index if not exists idx_form4_transactions_issuer_ticker on public.form4_transactions (issuer_ticker);
create index if not exists idx_form4_transactions_issuer_name on public.form4_transactions (issuer_name);
create index if not exists idx_form4_transactions_reporting_owner_name on public.form4_transactions (reporting_owner_name);
create index if not exists idx_form4_transactions_transaction_date_desc on public.form4_transactions (transaction_date desc);
create index if not exists idx_form4_transactions_filing_date_desc on public.form4_transactions (filing_date desc);
create index if not exists idx_form4_transactions_transaction_code on public.form4_transactions (transaction_code);
create index if not exists idx_form4_transactions_ownership_type on public.form4_transactions (ownership_type);
create index if not exists idx_form4_transactions_issuer_ticker_transaction_date on public.form4_transactions (issuer_ticker, transaction_date desc);
create index if not exists idx_form4_transactions_owner_transaction_date on public.form4_transactions (reporting_owner_name, transaction_date desc);
create unique index if not exists uq_form4_transactions_import_key
  on public.form4_transactions (
    filing_id,
    accession_no,
    transaction_date,
    transaction_code,
    reporting_owner_name,
    issuer_name
  );

alter table public.profiles enable row level security;
alter table public.filings enable row level security;
alter table public.form4_transactions enable row level security;
alter table public.saved_filters enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saved_filters_updated_at on public.saved_filters;
create trigger saved_filters_updated_at
  before update on public.saved_filters
  for each row execute procedure public.set_updated_at();

drop policy if exists "Public can read filings" on public.filings;
create policy "Public can read filings"
  on public.filings
  for select
  to public
  using (true);

drop policy if exists "Public can read transactions" on public.form4_transactions;
create policy "Public can read transactions"
  on public.form4_transactions
  for select
  to public
  using (true);

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can read own saved filters" on public.saved_filters;
create policy "Users can read own saved filters"
  on public.saved_filters
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own saved filters" on public.saved_filters;
create policy "Users can insert own saved filters"
  on public.saved_filters
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own saved filters" on public.saved_filters;
create policy "Users can update own saved filters"
  on public.saved_filters
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own saved filters" on public.saved_filters;
create policy "Users can delete own saved filters"
  on public.saved_filters
  for delete
  to authenticated
  using (auth.uid() = user_id);
