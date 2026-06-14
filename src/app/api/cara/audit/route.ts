// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/audit
// GET — returns recent Cara audit events. Requires cara.view_audit_logs.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { checkCaraAccess, type CaraRole } from "@/lib/cara/cara-permissions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const actorUserId = url.searchParams.get("actorUserId") ?? "";
  const actorRole = (url.searchParams.get("actorRole") ?? "none") as CaraRole;
  const homeId = url.searchParams.get("homeId") ?? undefined;
  const limit = Math.min(Number.parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);

  if (!actorUserId) {
    return NextResponse.json({ error: "actorUserId query param is required" }, { status: 400 });
  }

  const access = checkCaraAccess(
    { userId: actorUserId, role: actorRole, homeId },
    { permission: "cara.view_audit_logs", homeId },
  );
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason ?? "Access denied" }, { status: 403 });
  }

  if (!isSupabaseEnabled()) {
    // Return demo audit events when Supabase is not configured
    return NextResponse.json({
      data: getDemoAuditEvents(),
    });
  }

  const supabaseRaw = createServerClient();
  if (!supabaseRaw) {
    return NextResponse.json({ data: getDemoAuditEvents() });
  }
  const supabase = loose(supabaseRaw);

  const { data, error } = await (supabase.from("aria_audit_events") as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ data: getDemoAuditEvents() });
  }

  return NextResponse.json({ data: data ?? [] });
}

function getDemoAuditEvents() {
  return [
    { id: "aud_1", event_type: "generated", actor_user_id: "staff_darren", actor_role: "registered_manager", event_detail: { commandId: "improve_writing" }, created_at: "2026-05-12T10:00:00Z" },
    { id: "aud_2", event_type: "approved", actor_user_id: "staff_darren", actor_role: "registered_manager", event_detail: { commandId: "draft_daily_log" }, created_at: "2026-05-12T10:05:00Z" },
    { id: "aud_3", event_type: "transcribed", actor_user_id: "staff_sarah", actor_role: "team_leader", event_detail: { sourceModule: "incident" }, created_at: "2026-05-12T09:30:00Z" },
    { id: "aud_4", event_type: "committed", actor_user_id: "staff_darren", actor_role: "registered_manager", event_detail: { commandId: "draft_management_oversight" }, created_at: "2026-05-12T09:00:00Z" },
    { id: "aud_5", event_type: "rejected", actor_user_id: "staff_darren", actor_role: "registered_manager", event_detail: { commandId: "incident_risk_analysis", reason: "Needs more detail on de-escalation" }, created_at: "2026-05-11T16:00:00Z" },
  ];
}
