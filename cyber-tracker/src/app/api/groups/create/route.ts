import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `POD-${part1}-${part2}`;
}

// POST /api/groups/create
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; maxMembers?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim() || "My Cyber Pod";
  const maxMembers = Math.min(Math.max(body.maxMembers || 3, 2), 50);
  const inviteCode = generateInviteCode();

  // Create the group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name,
      invite_code: inviteCode,
      max_members: maxMembers,
    })
    .select()
    .single();

  if (groupError || !group) {
    return NextResponse.json(
      { error: `Failed to create group: ${groupError?.message}` },
      { status: 500 },
    );
  }

  // Add the creator as the first member
  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
  });

  if (memberError) {
    return NextResponse.json(
      { error: `Group created but failed to join: ${memberError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    group: {
      id: group.id,
      name: group.name,
      invite_code: group.invite_code,
      max_members: group.max_members,
    },
  });
}
