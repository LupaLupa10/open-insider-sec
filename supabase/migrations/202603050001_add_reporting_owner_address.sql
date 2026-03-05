alter table public.form4_transactions
  add column if not exists reporting_owner_street1 text,
  add column if not exists reporting_owner_street2 text,
  add column if not exists reporting_owner_city text,
  add column if not exists reporting_owner_state text,
  add column if not exists reporting_owner_zip text;
