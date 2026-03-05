import Link from "next/link";

import type { ExplorerFilters } from "@/lib/types";
import { filtersToSearchParams } from "@/lib/utils/filters";

export function Pagination({ filters, total }: { filters: ExplorerFilters; total: number }) {
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const previousFilters = { ...filters, page: Math.max(1, filters.page - 1) };
  const nextFilters = { ...filters, page: Math.min(totalPages, filters.page + 1) };

  return (
    <div className="pagination">
      <span className="muted">
        Page {filters.page} of {totalPages}
      </span>
      <div className="header-actions">
        <Link
          aria-disabled={filters.page <= 1}
          className="button-secondary"
          href={`/explorer?${filtersToSearchParams(previousFilters)}`}
        >
          Previous
        </Link>
        <Link
          aria-disabled={filters.page >= totalPages}
          className="button-secondary"
          href={`/explorer?${filtersToSearchParams(nextFilters)}`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
