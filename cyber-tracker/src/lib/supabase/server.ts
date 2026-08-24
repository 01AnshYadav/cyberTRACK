import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL environment variable. " +
        "Add it to .env.local — see .env.local.example for the expected format."
    );
  }
  if (!key) {
    throw new Error(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. " +
        "Add it to .env.local — see .env.local.example for the expected format."
    );
  }
  try {
    new URL(url);
  } catch {
    throw new Error(
      `[Supabase] NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${url}". ` +
        "It should look like https://<project-ref>.supabase.co"
    );
  }
  return { url, key };
}

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    },
  );
}
