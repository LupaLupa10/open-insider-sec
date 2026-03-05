import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getClientEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

type CookieMutation = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request
  });
  const env = getClientEnv();

  const supabase = createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieMutation[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
        });
      }
    }
  });

  await supabase.auth.getUser();

  return response;
}
