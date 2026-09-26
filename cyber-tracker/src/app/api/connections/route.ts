import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/connections
// Fetch all connected platforms for current user
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("connected_accounts")
    .select("id, platform, platform_username, external_id")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ accounts: data ?? [] });
}

// POST /api/connections
// Connect or update a platform account (e.g. TryHackMe, Hack The Box, PicoCTF, GitHub)
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    platform?: string;
    username?: string;
    token?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { platform, username, token } = body;

  if (!platform || !username?.trim()) {
    return NextResponse.json(
      { error: "platform and username are required" },
      { status: 400 },
    );
  }

  const cleanPlatform = platform.toLowerCase().trim();
  const cleanUsername = username.trim();

  const allowedPlatforms = ["github", "tryhackme", "hackthebox", "picoctf"];
  if (!allowedPlatforms.includes(cleanPlatform)) {
    return NextResponse.json(
      { error: `Platform '${platform}' is not supported.` },
      { status: 400 },
    );
  }

  // Upsert the connected account
  const { data, error } = await supabase
    .from("connected_accounts")
    .upsert(
      {
        user_id: user.id,
        platform: cleanPlatform,
        platform_username: cleanUsername,
        access_token: token?.trim() || null,
        external_id: cleanUsername,
      },
      {
        onConflict: "user_id,platform",
      },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Failed to connect ${cleanPlatform}: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, account: data });
}

// DELETE /api/connections
// Disconnect a platform account
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { platform?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { platform } = body;
  if (!platform) {
    return NextResponse.json(
      { error: "platform is required" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("connected_accounts")
    .delete()
    .eq("user_id", user.id)
    .eq("platform", platform.toLowerCase().trim());

  if (error) {
    return NextResponse.json(
      { error: `Failed to disconnect ${platform}: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
