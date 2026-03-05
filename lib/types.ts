export type ExplorerSortField = "transactionDate" | "filingDate" | "shares" | "price";
export type ExplorerSortOrder = "asc" | "desc";

export type ExplorerRole = "director" | "officer" | "tenPercentOwner" | "other";

export type ExplorerFilters = {
  q: string;
  issuerTicker: string[];
  issuerName: string[];
  reportingOwnerName: string[];
  roles: ExplorerRole[];
  transactionCodes: string[];
  ownershipTypes: string[];
  acquiredDisposed: string[];
  transactionDateFrom: string | null;
  transactionDateTo: string | null;
  filingDateFrom: string | null;
  filingDateTo: string | null;
  minShares: number | null;
  maxShares: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: ExplorerSortField;
  sortOrder: ExplorerSortOrder;
  page: number;
  pageSize: number;
};

export type Form4Transaction = {
  id: string;
  filing_id: string;
  accession_no: string;
  issuer_cik: string;
  issuer_ticker: string | null;
  issuer_name: string;
  reporting_owner_cik: string;
  reporting_owner_name: string;
  reporting_owner_street1: string | null;
  reporting_owner_street2: string | null;
  reporting_owner_city: string | null;
  reporting_owner_state: string | null;
  reporting_owner_zip: string | null;
  reporting_owner_title: string | null;
  is_director: boolean;
  is_officer: boolean;
  is_ten_percent_owner: boolean;
  is_other: boolean;
  officer_title: string | null;
  security_title: string | null;
  transaction_date: string;
  filing_date: string;
  transaction_code: string;
  transaction_shares: string | null;
  transaction_price_per_share: string | null;
  acquired_disposed_code: string | null;
  shares_owned_following: string | null;
  ownership_type: string | null;
  form_type: string;
  sec_url: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
  reported_datetime?: string | null;
};

export type FilingDetail = {
  filing_id: string;
  accession_no: string;
  issuer_cik: string;
  issuer_ticker: string | null;
  issuer_name: string;
  reporting_owner_cik: string;
  reporting_owner_name: string;
  filing_date: string;
  accepted_at: string | null;
  sec_url: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
  transactions: Form4Transaction[];
};

export type SavedFilter = {
  id: string;
  user_id: string;
  name: string;
  filters: ExplorerFilters;
  created_at: string;
  updated_at: string;
};

export type UserProfile = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

export type ExplorerResult = {
  rows: Form4Transaction[];
  total: number;
  page: number;
  pageSize: number;
};
