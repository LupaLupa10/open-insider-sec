import { SavedFiltersList } from "@/components/saved-filters-list";
import { requireUser } from "@/lib/data/auth";
import { getSavedFilters } from "@/lib/data/queries";

export default async function SavedFiltersPage() {
  const user = await requireUser();
  const filters = await getSavedFilters(user.id);

  return (
    <div className="shell stack">
      <div className="section-heading">
        <div className="eyebrow">Saved filters</div>
        <h2>All presets for {user.email}</h2>
      </div>
      <SavedFiltersList filters={filters} />
    </div>
  );
}
