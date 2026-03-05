import Link from "next/link";

import { SavedFiltersList } from "@/components/saved-filters-list";
import { getProfile, getSavedFilters } from "@/lib/data/queries";
import { requireUser } from "@/lib/data/auth";

export default async function DashboardPage() {
  const user = await requireUser();
  const [profile, savedFilters] = await Promise.all([getProfile(user.id), getSavedFilters(user.id)]);

  return (
    <div className="shell stack">
      <section className="detail-card stack">
        <div className="eyebrow">Dashboard</div>
        <h1>{profile?.display_name ?? user.email}</h1>
        <p className="muted">Your saved screens live here. Public explore access is available without login.</p>
        <div className="header-actions">
          <Link className="button" href="/explorer">
            Open explorer
          </Link>
          <Link className="button-secondary" href="/dashboard/saved-filters">
            Manage saved filters
          </Link>
        </div>
      </section>

      <section className="stack">
        <div className="section-heading">
          <div className="eyebrow">Saved filters</div>
          <h2>Recent presets</h2>
        </div>
        <SavedFiltersList filters={savedFilters.slice(0, 5)} />
      </section>
    </div>
  );
}
