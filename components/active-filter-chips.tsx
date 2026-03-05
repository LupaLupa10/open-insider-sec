import { DEFAULT_FILTERS } from "@/lib/constants";
import type { ExplorerFilters } from "@/lib/types";

export function ActiveFilterChips({ filters }: { filters: ExplorerFilters }) {
  const chips: string[] = [];

  if (filters.q) chips.push(`Search: ${filters.q}`);
  if (filters.issuerTicker.length) chips.push(`Tickers: ${filters.issuerTicker.join(", ")}`);
  if (filters.reportingOwnerName.length) chips.push(`Owners: ${filters.reportingOwnerName.join(", ")}`);
  if (filters.roles.length) chips.push(`Roles: ${filters.roles.join(", ")}`);
  if (filters.transactionCodes.length) chips.push(`Codes: ${filters.transactionCodes.join(", ")}`);
  if (filters.ownershipTypes.length) chips.push(`Ownership: ${filters.ownershipTypes.join(", ")}`);
  if (filters.acquiredDisposed.length) chips.push(`Direction: ${filters.acquiredDisposed.join(", ")}`);
  if (filters.transactionDateFrom) chips.push(`Txn from ${filters.transactionDateFrom}`);
  if (filters.transactionDateTo) chips.push(`Txn to ${filters.transactionDateTo}`);
  if (filters.filingDateFrom) chips.push(`Filed from ${filters.filingDateFrom}`);
  if (filters.filingDateTo) chips.push(`Filed to ${filters.filingDateTo}`);

  const hasNonDefault = JSON.stringify({ ...filters, page: 1 }) !== JSON.stringify({ ...DEFAULT_FILTERS, page: 1 });

  if (!hasNonDefault || chips.length === 0) {
    return null;
  }

  return (
    <div className="pill-row">
      {chips.map((chip) => (
        <span className="pill" key={chip}>
          {chip}
        </span>
      ))}
    </div>
  );
}
