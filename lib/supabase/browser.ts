"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getClientEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createSupabaseBrowserClient() {
  if (client) {
    return client;
  }

  const env = getClientEnv();
  client = createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return client;
}
