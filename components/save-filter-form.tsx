"use client";

import { useActionState } from "react";

import { createSavedFilterAction, type DashboardActionState } from "@/app/dashboard/actions";

const initialState: DashboardActionState = {};

export function SaveFilterForm({ serializedFilters }: { serializedFilters: string }) {
  const [state, formAction, pending] = useActionState(createSavedFilterAction, initialState);

  return (
    <form action={formAction} className="save-filter-form panel">
      <div className="split">
        <div>
          <h3>Save this screen</h3>
          <p className="muted">Store the current filter state in your account.</p>
        </div>
      </div>
      <input name="filters" type="hidden" value={serializedFilters} />
      <label className="stack">
        <span>Name</span>
        <input name="name" placeholder="Large-cap officer purchases" required />
      </label>
      {state.error ? <div className="error">{state.error}</div> : null}
      {state.success ? <div className="success">{state.success}</div> : null}
      <button className="button" disabled={pending} type="submit">
        {pending ? "Saving..." : "Save filter"}
      </button>
    </form>
  );
}
