import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getClientEnv, getServerEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

type CookieMutation = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getClientEnv();

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieMutation[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
          });
        } catch {}
      }
    }
  });
}

export function createSupabaseAdminClient() {
  const env = getServerEnv();

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {}
    }
  });
}
