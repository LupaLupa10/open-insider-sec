import Link from "next/link";

import { ActiveFilterChips } from "@/components/active-filter-chips";
import { ExplorerFilterForm } from "@/components/explorer-filter-form";
import { Pagination } from "@/components/pagination";
import { ResultsTable } from "@/components/results-table";
import { SaveFilterForm } from "@/components/save-filter-form";
import { getSessionUser } from "@/lib/data/auth";
import { getExplorerResults } from "@/lib/data/queries";
import { filtersToSearchParams, parseExplorerFilters } from "@/lib/utils/filters";

type ExplorerPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExplorerPage({ searchParams }: ExplorerPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = parseExplorerFilters(resolvedSearchParams);
  const [results, user] = await Promise.all([getExplorerResults(filters), getSessionUser()]);
  const serializedFilters = filtersToSearchParams(filters);

  return (
    <div className="shell explorer-layout">
      <ExplorerFilterForm initialFilters={filters} />
      <div className="stack">
        <section className="panel stack">
          <div className="split">
            <div>
              <div className="eyebrow">Explorer</div>
              <h2>Public SEC Form 4 results</h2>
              <p className="muted">{results.total.toLocaleString("en-US")} matching transaction rows.</p>
            </div>
            {user ? (
              <div className="muted">Signed in as {user.email}</div>
            ) : (
              <div className="muted">
                <Link href="/auth/login">Log in</Link> to save this view.
              </div>
            )}
          </div>
          <ActiveFilterChips filters={filters} />
        </section>

        {user ? <SaveFilterForm serializedFilters={serializedFilters} /> : null}

        <ResultsTable rows={results.rows} />
        <Pagination filters={filters} total={results.total} />
      </div>
    </div>
  );
}
