// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/audit
// GET — returns recent Cara audit events. Requires cara.view_audit_logs.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { storageFailure } from "@/lib/http/storage-error";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { checkCaraAccess, type CaraRole } from "@/lib/cara/cara-permissions";

import { seedDay } from "@/lib/seed-date";
import type { SB as LooseSupabase } from "@/lib/supabase/loose-client";
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

  const { data, error } = await ((supabase.from("cara_audit_events")))
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
      // A failed read is not an absence of records, and it is certainly not
      // these invented ones. The table has no migration, so on live this is
      // the path that runs — it used to answer with demo content that the
      // page renders exactly as it renders real data.
    return storageFailure("Cara audit events", error);
  }

  return NextResponse.json({ data: data ?? [] });
}

function getDemoAuditEvents() {
  return [
    { id: "aud_1", event_type: "generated", actor_user_id: "staff_darren", actor_role: "registered_manager", event_detail: { commandId: "improve_writing" }, created_at: `${seedDay(-27)}T10:00:00Z` },
    { id: "aud_2", event_type: "approved", actor_user_id: "staff_darren", actor_role: "registered_manager", event_detail: { commandId: "draft_daily_log" }, created_at: `${seedDay(-27)}T10:05:00Z` },
    { id: "aud_3", event_type: "transcribed", actor_user_id: "staff_sarah", actor_role: "team_leader", event_detail: { sourceModule: "incident" }, created_at: `${seedDay(-27)}T09:30:00Z` },
    { id: "aud_4", event_type: "committed", actor_user_id: "staff_darren", actor_role: "registered_manager", event_detail: { commandId: "draft_management_oversight" }, created_at: `${seedDay(-27)}T09:00:00Z` },
    { id: "aud_5", event_type: "rejected", actor_user_id: "staff_darren", actor_role: "registered_manager", event_detail: { commandId: "incident_risk_analysis", reason: "Needs more detail on de-escalation" }, created_at: `${seedDay(-28)}T16:00:00Z` },
  ];
}
