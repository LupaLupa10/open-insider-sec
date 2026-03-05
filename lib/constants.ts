import type { ExplorerFilters } from "@/lib/types";

export const DEFAULT_PAGE_SIZE = 25;

export const DEFAULT_FILTERS: ExplorerFilters = {
  q: "",
  issuerTicker: [],
  issuerName: [],
  reportingOwnerName: [],
  roles: [],
  transactionCodes: [],
  ownershipTypes: [],
  acquiredDisposed: [],
  transactionDateFrom: null,
  transactionDateTo: null,
  filingDateFrom: null,
  filingDateTo: null,
  minShares: null,
  maxShares: null,
  minPrice: null,
  maxPrice: null,
  sortBy: "transactionDate",
  sortOrder: "desc",
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE
};

export const ROLE_OPTIONS = [
  { value: "director", label: "Director" },
  { value: "officer", label: "Officer" },
  { value: "tenPercentOwner", label: "10% Owner" },
  { value: "other", label: "Other" }
] as const;

export const TRANSACTION_CODE_OPTIONS = [
  "P",
  "S",
  "A",
  "D",
  "M",
  "F",
  "G",
  "C",
  "W",
  "X"
];

export const OWNERSHIP_TYPE_OPTIONS = [
  { value: "D", label: "Direct" },
  { value: "I", label: "Indirect" }
];

export const ACQUIRED_DISPOSED_OPTIONS = [
  { value: "A", label: "Acquire" },
  { value: "D", label: "Dispose" }
];
