import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const email = "anshyadav@example.com";
  const password = "ansh#2006"; // TODO: move to env var before deploying

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
}
