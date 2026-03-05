"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/data/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_FILTERS } from "@/lib/constants";
import { parseExplorerFilters, searchParamsToRecord } from "@/lib/utils/filters";

export type DashboardActionState = {
  error?: string;
  success?: string;
};

const nameSchema = z.string().trim().min(2).max(80);

export async function createSavedFilterAction(
  _: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const user = await requireUser();
  const name = nameSchema.safeParse(String(formData.get("name") ?? ""));

  if (!name.success) {
    return { error: "Saved filter name must be between 2 and 80 characters." };
  }

  const rawFilters = String(formData.get("filters") ?? "");

  try {
    const parsed = parseExplorerFilters(searchParamsToRecord(new URLSearchParams(rawFilters)));
    const supabase = await createSupabaseServerClient();
    const { error } = await (supabase.from("saved_filters") as any).insert({
      user_id: user.id,
      name: name.data,
      filters: {
        ...DEFAULT_FILTERS,
        ...parsed
      }
    });

    if (error) {
      return { error: error.message };
    }
  } catch {
    return { error: "Could not save the current filter state." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/saved-filters");

  return { success: "Saved filter created." };
}

export async function deleteSavedFilterAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const supabase = await createSupabaseServerClient();

  await (supabase.from("saved_filters") as any).delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/saved-filters");
}
