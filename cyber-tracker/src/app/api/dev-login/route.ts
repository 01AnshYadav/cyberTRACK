import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  // Dev-only endpoint — guarded by env vars so it cannot run in production
  // unless DEV_LOGIN_EMAIL / DEV_LOGIN_PASSWORD are deliberately set.
  const email = process.env.DEV_LOGIN_EMAIL;
  const password = process.env.DEV_LOGIN_PASSWORD;

  if (!email || !password) {
    return NextResponse.json(
      {
        error:
          "DEV_LOGIN_EMAIL and/or DEV_LOGIN_PASSWORD env vars are not set. " +
          "Add them to .env.local — see .env.local.example.",
      },
      { status: 500 },
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.redirect(
    new URL("/dashboard", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  );
}
