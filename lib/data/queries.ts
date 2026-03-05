import { DEFAULT_FILTERS } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ExplorerFilters, ExplorerResult, FilingDetail, SavedFilter, UserProfile } from "@/lib/types";

type TransactionsQuery = any;

export async function getExplorerResults(filters: ExplorerFilters): Promise<ExplorerResult> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("form4_transactions")
    .select("*", { count: "exact" })
    .range((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize - 1);

  query = applyExplorerFilters(query, filters);
  query = applyExplorerSort(query, filters);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as any[];
  const filingIds = [...new Set(rows.map((row) => row.filing_id))];
  const acceptedAtByFilingId = new Map<string, string | null>();

  if (filingIds.length > 0) {
    const { data: filingRows, error: filingError } = await supabase
      .from("filings")
      .select("filing_id,accepted_at")
      .in("filing_id", filingIds);

    if (filingError) {
      throw new Error(filingError.message);
    }

    (filingRows ?? []).forEach((row: any) => {
      acceptedAtByFilingId.set(row.filing_id, row.accepted_at ?? null);
    });
  }

  return {
    rows: rows.map((row: any) => ({
      ...row,
      reported_datetime: acceptedAtByFilingId.get(row.filing_id) ?? null
    })),
    total: count ?? 0,
    page: filters.page,
    pageSize: filters.pageSize
  };
}

export async function getFilingDetail(filingId: string): Promise<FilingDetail | null> {
  const supabase = await createSupabaseServerClient();
  const [{ data: filing, error: filingError }, { data: transactions, error: transactionsError }] = await Promise.all([
    supabase.from("filings").select("*").eq("filing_id", filingId).single(),
    supabase.from("form4_transactions").select("*").eq("filing_id", filingId).order("transaction_date", { ascending: false })
  ]);

  if (filingError && filingError.code !== "PGRST116") {
    throw new Error(filingError.message);
  }

  if (transactionsError) {
    throw new Error(transactionsError.message);
  }

  if (!filing) {
    return null;
  }

  const filingRow = filing as FilingDetail;

  return {
    ...filingRow,
    transactions: transactions ?? []
  };
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  return data;
}

export async function getSavedFilters(userId: string): Promise<SavedFilter[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("saved_filters").select("*").eq("user_id", userId).order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    created_at: row.created_at,
    updated_at: row.updated_at,
    filters: {
      ...DEFAULT_FILTERS,
      ...((row.filters as object) ?? {})
    }
  })) as SavedFilter[];
}

function applyExplorerFilters(query: TransactionsQuery, filters: ExplorerFilters) {
  if (filters.q) {
    const term = escapeLike(filters.q);
    query = query.or(
      `issuer_ticker.ilike.*${term}*,issuer_name.ilike.*${term}*,reporting_owner_name.ilike.*${term}*`
    );
  }

  if (filters.issuerTicker.length > 0) {
    query = query.in("issuer_ticker", filters.issuerTicker);
  }

  if (filters.issuerName.length > 0) {
    query = query.in("issuer_name", filters.issuerName);
  }

  if (filters.reportingOwnerName.length > 0) {
    query = query.in("reporting_owner_name", filters.reportingOwnerName);
  }

  if (filters.transactionCodes.length > 0) {
    query = query.in("transaction_code", filters.transactionCodes);
  }

  if (filters.ownershipTypes.length > 0) {
    query = query.in("ownership_type", filters.ownershipTypes);
  }

  if (filters.acquiredDisposed.length > 0) {
    query = query.in("acquired_disposed_code", filters.acquiredDisposed);
  }

  if (filters.transactionDateFrom) {
    query = query.gte("transaction_date", filters.transactionDateFrom);
  }

  if (filters.transactionDateTo) {
    query = query.lte("transaction_date", filters.transactionDateTo);
  }

  if (filters.filingDateFrom) {
    query = query.gte("filing_date", filters.filingDateFrom);
  }

  if (filters.filingDateTo) {
    query = query.lte("filing_date", filters.filingDateTo);
  }

  if (filters.minShares !== null) {
    query = query.gte("transaction_shares", String(filters.minShares));
  }

  if (filters.maxShares !== null) {
    query = query.lte("transaction_shares", String(filters.maxShares));
  }

  if (filters.minPrice !== null) {
    query = query.gte("transaction_price_per_share", String(filters.minPrice));
  }

  if (filters.maxPrice !== null) {
    query = query.lte("transaction_price_per_share", String(filters.maxPrice));
  }

  if (filters.roles.length > 0) {
    const roleClauses = filters.roles.map((role) => {
      switch (role) {
        case "director":
          return "is_director.eq.true";
        case "officer":
          return "is_officer.eq.true";
        case "tenPercentOwner":
          return "is_ten_percent_owner.eq.true";
        case "other":
          return "is_other.eq.true";
      }
    });

    query = query.or(roleClauses.join(","));
  }

  return query;
}

function applyExplorerSort(query: TransactionsQuery, filters: ExplorerFilters) {
  const ascending = filters.sortOrder === "asc";

  switch (filters.sortBy) {
    case "filingDate":
      return query.order("filing_date", { ascending }).order("transaction_date", { ascending }).order("id", { ascending });
    case "shares":
      return query
        .order("transaction_shares", { ascending, nullsFirst: false })
        .order("transaction_date", { ascending: false })
        .order("id", { ascending: false });
    case "price":
      return query
        .order("transaction_price_per_share", { ascending, nullsFirst: false })
        .order("transaction_date", { ascending: false })
        .order("id", { ascending: false });
    case "transactionDate":
    default:
      return query.order("transaction_date", { ascending }).order("filing_date", { ascending }).order("id", { ascending });
  }
}

function escapeLike(value: string) {
  return value.replace(/[,*]/g, "");
}
