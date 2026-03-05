import { z } from "zod";

import { DEFAULT_FILTERS, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { ExplorerFilters, ExplorerRole, ExplorerSortField, ExplorerSortOrder } from "@/lib/types";

const sortFields = new Set<ExplorerSortField>(["transactionDate", "filingDate", "shares", "price"]);
const sortOrders = new Set<ExplorerSortOrder>(["asc", "desc"]);
const roles = new Set<ExplorerRole>(["director", "officer", "tenPercentOwner", "other"]);

const numberSchema = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number(value)))
  .refine((value) => value === null || Number.isFinite(value), "Must be a valid number");

function asArray(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
}

export function parseExplorerFilters(searchParams: Record<string, string | string[] | undefined>): ExplorerFilters {
  const page = Number(searchParams.page ?? DEFAULT_FILTERS.page);
  const pageSize = Number(searchParams.pageSize ?? DEFAULT_PAGE_SIZE);
  const sortByValue = Array.isArray(searchParams.sortBy) ? searchParams.sortBy[0] : searchParams.sortBy;
  const sortOrderValue = Array.isArray(searchParams.sortOrder) ? searchParams.sortOrder[0] : searchParams.sortOrder;

  const filters: ExplorerFilters = {
    q: Array.isArray(searchParams.q) ? searchParams.q[0] ?? "" : searchParams.q ?? "",
    issuerTicker: asArray(searchParams.issuerTicker),
    issuerName: asArray(searchParams.issuerName),
    reportingOwnerName: asArray(searchParams.reportingOwnerName),
    roles: asArray(searchParams.roles).filter((value): value is ExplorerRole => roles.has(value as ExplorerRole)),
    transactionCodes: asArray(searchParams.transactionCodes),
    ownershipTypes: asArray(searchParams.ownershipTypes),
    acquiredDisposed: asArray(searchParams.acquiredDisposed),
    transactionDateFrom: getDateValue(searchParams.transactionDateFrom),
    transactionDateTo: getDateValue(searchParams.transactionDateTo),
    filingDateFrom: getDateValue(searchParams.filingDateFrom),
    filingDateTo: getDateValue(searchParams.filingDateTo),
    minShares: parseNullableNumber(searchParams.minShares),
    maxShares: parseNullableNumber(searchParams.maxShares),
    minPrice: parseNullableNumber(searchParams.minPrice),
    maxPrice: parseNullableNumber(searchParams.maxPrice),
    sortBy: sortFields.has(sortByValue as ExplorerSortField) ? (sortByValue as ExplorerSortField) : DEFAULT_FILTERS.sortBy,
    sortOrder: sortOrders.has(sortOrderValue as ExplorerSortOrder)
      ? (sortOrderValue as ExplorerSortOrder)
      : DEFAULT_FILTERS.sortOrder,
    page: Number.isFinite(page) && page > 0 ? page : DEFAULT_FILTERS.page,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 100 ? pageSize : DEFAULT_PAGE_SIZE
  };

  return filters;
}

export function searchParamsToRecord(searchParams: URLSearchParams) {
  const record: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    const existing = record[key];

    if (existing === undefined) {
      record[key] = value;
      return;
    }

    if (Array.isArray(existing)) {
      existing.push(value);
      return;
    }

    record[key] = [existing, value];
  });

  return record;
}

export function filtersToSearchParams(filters: ExplorerFilters) {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  appendMany(params, "issuerTicker", filters.issuerTicker);
  appendMany(params, "issuerName", filters.issuerName);
  appendMany(params, "reportingOwnerName", filters.reportingOwnerName);
  appendMany(params, "roles", filters.roles);
  appendMany(params, "transactionCodes", filters.transactionCodes);
  appendMany(params, "ownershipTypes", filters.ownershipTypes);
  appendMany(params, "acquiredDisposed", filters.acquiredDisposed);
  appendIfValue(params, "transactionDateFrom", filters.transactionDateFrom);
  appendIfValue(params, "transactionDateTo", filters.transactionDateTo);
  appendIfValue(params, "filingDateFrom", filters.filingDateFrom);
  appendIfValue(params, "filingDateTo", filters.filingDateTo);
  appendIfValue(params, "minShares", filters.minShares);
  appendIfValue(params, "maxShares", filters.maxShares);
  appendIfValue(params, "minPrice", filters.minPrice);
  appendIfValue(params, "maxPrice", filters.maxPrice);

  if (filters.sortBy !== DEFAULT_FILTERS.sortBy) {
    params.set("sortBy", filters.sortBy);
  }

  if (filters.sortOrder !== DEFAULT_FILTERS.sortOrder) {
    params.set("sortOrder", filters.sortOrder);
  }

  if (filters.page !== DEFAULT_FILTERS.page) {
    params.set("page", String(filters.page));
  }

  if (filters.pageSize !== DEFAULT_FILTERS.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }

  return params.toString();
}

function appendMany(params: URLSearchParams, key: string, values: string[]) {
  values.forEach((value) => params.append(key, value));
}

function appendIfValue(params: URLSearchParams, key: string, value: string | number | null) {
  if (value !== null && value !== "") {
    params.set(key, String(value));
  }
}

function getDateValue(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate || !/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    return null;
  }

  return candidate;
}

function parseNullableNumber(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (candidate === undefined) {
    return null;
  }

  const parsed = numberSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}
