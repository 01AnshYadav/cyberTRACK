import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  // ── Auth check ──
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ──
  let body: { inviteCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { inviteCode } = body;
  if (!inviteCode || typeof inviteCode !== "string") {
    return NextResponse.json(
      { error: "inviteCode is required" },
      { status: 400 },
    );
  }

  // ── Look up group by invite code ──
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, max_members")
    .eq("invite_code", inviteCode.trim())
    .single();

  if (groupError || !group) {
    return NextResponse.json(
      { error: "Invalid invite code" },
      { status: 404 },
    );
  }

  // ── Check if already a member ──
  const { data: existing } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You are already a member of this group" },
      { status: 409 },
    );
  }

  // ── Enforce member capacity ──
  const { count, error: countError } = await supabase
    .from("group_members")
    .select("id", { count: "exact", head: true })
    .eq("group_id", group.id);

  if (countError) {
    return NextResponse.json(
      { error: "Failed to check group capacity" },
      { status: 500 },
    );
  }

  const maxMembers = group.max_members ?? 3;

  if (count !== null && count >= maxMembers) {
    return NextResponse.json(
      { error: "Group is full (Max 3 members)" },
      { status: 400 },
    );
  }

  // ── Insert membership ──
  const { error: insertError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
  });

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, group_id: group.id });
}
