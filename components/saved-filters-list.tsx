import Link from "next/link";

import { deleteSavedFilterAction } from "@/app/dashboard/actions";
import { filtersToSearchParams } from "@/lib/utils/filters";
import type { SavedFilter } from "@/lib/types";

export function SavedFiltersList({ filters }: { filters: SavedFilter[] }) {
  if (filters.length === 0) {
    return <div className="panel muted">No saved filters yet.</div>;
  }

  return (
    <div className="list">
      {filters.map((filter) => (
        <article className="list-item" key={filter.id}>
          <div className="split">
            <div className="stack">
              <strong>{filter.name}</strong>
              <span className="muted">Created {new Date(filter.created_at).toLocaleDateString("en-US")}</span>
            </div>
            <div className="header-actions">
              <Link className="button-secondary" href={`/explorer?${filtersToSearchParams(filter.filters)}`}>
                Open
              </Link>
              <form action={deleteSavedFilterAction}>
                <input name="id" type="hidden" value={filter.id} />
                <button className="button-danger" type="submit">
                  Delete
                </button>
              </form>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
