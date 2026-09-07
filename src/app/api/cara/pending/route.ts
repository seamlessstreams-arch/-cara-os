// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/pending
// GET — returns Cara outputs awaiting human review. Powers the approval
// queue in the manager's Cara review page.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { storageFailure } from "@/lib/http/storage-error";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { checkCaraAccess, type CaraRole } from "@/lib/cara/cara-permissions";

import { seedDay } from "@/lib/seed-date";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

export interface PendingOutput {
  id: string;
  requestId: string;
  commandId: string;
  generatedText: string;
  confidence: string;
  status: string;
  userId: string;
  createdAt: string;
  guardrailFlagged: boolean;
  guardrailSummary: string | null;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const actorUserId = url.searchParams.get("actorUserId") ?? "";
  const actorRole = (url.searchParams.get("actorRole") ?? "none") as CaraRole;
  const homeId = url.searchParams.get("homeId") ?? undefined;
  const limit = Math.min(
    Number.parseInt(url.searchParams.get("limit") ?? "50", 10) || 50,
    200,
  );

  if (!actorUserId) {
    return NextResponse.json(
      { error: "actorUserId query param is required" },
      { status: 400 },
    );
  }

  // Require approve permission to view the pending queue
  const access = checkCaraAccess(
    { userId: actorUserId, role: actorRole, homeId },
    { permission: "cara.approve_outputs", homeId },
  );
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.reason ?? "Access denied" },
      { status: 403 },
    );
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ data: getDemoPending() });
  }

  const supabaseRaw = createServerClient();
  if (!supabaseRaw) {
    return NextResponse.json({ data: getDemoPending() });
  }
  const supabase = loose(supabaseRaw);

  // Fetch outputs in pending statuses
  const { data, error } = await ((supabase.from("cara_outputs")))
    .select(
      "id, request_id, generated_text, confidence, status, guardrail_flagged, guardrail_summary, created_at, cara_requests(command_id, user_id)",
    )
    .in("status", ["draft", "edited", "submitted_for_approval"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
      // A failed read is not an absence of records, and it is certainly not
      // these invented ones. The table has no migration, so on live this is
      // the path that runs — it used to answer with demo content that the
      // page renders exactly as it renders real data.
    return storageFailure("Cara pending approvals", error);
  }

  const outputs: PendingOutput[] = ((data) ?? []).map((row) => {
    // PostgREST returns an embedded relation as an array unless it can see the
    // join is to-one, and the generated types say array here. Reading
    // `.command_id` straight off it was always undefined, so every pending
    // output reported command "unknown" with no user against it.
    const request = Array.isArray(row.cara_requests) ? row.cara_requests[0] : row.cara_requests;
    return {
    id: row.id,
    requestId: row.request_id,
    commandId: request?.command_id ?? "unknown",
    generatedText: row.generated_text ?? "",
    confidence: row.confidence ?? "medium",
    status: row.status,
    userId: request?.user_id ?? "",
    createdAt: row.created_at,
    guardrailFlagged: row.guardrail_flagged ?? false,
    guardrailSummary: row.guardrail_summary ?? null,
    };
  });

  return NextResponse.json({ data: outputs });
}

export function getDemoPending(): PendingOutput[] {
  return [
    {
      id: "out_pending_1",
      requestId: "req_1",
      commandId: "draft_management_oversight",
      generatedText:
        "Jayden has shown improved emotional regulation this week, with only one minor escalation...",
      confidence: "high",
      status: "submitted_for_approval",
      userId: "staff_sarah",
      createdAt: `${seedDay(-27)}T11:30:00Z`,
      guardrailFlagged: false,
      guardrailSummary: null,
    },
    {
      id: "out_pending_2",
      requestId: "req_2",
      commandId: "incident_risk_analysis",
      generatedText:
        "Risk analysis for missing-from-care incident INC-2026-047. The pattern suggests...",
      confidence: "medium",
      status: "submitted_for_approval",
      userId: "staff_darren",
      createdAt: `${seedDay(-27)}T10:15:00Z`,
      guardrailFlagged: true,
      guardrailSummary:
        "Contains safeguarding-related language about missing from care. Mandatory review required.",
    },
    {
      id: "out_pending_3",
      requestId: "req_3",
      commandId: "improve_writing",
      generatedText:
        "The care plan review for Amara should reflect her recent progress in education engagement...",
      confidence: "high",
      status: "draft",
      userId: "staff_mark",
      createdAt: `${seedDay(-27)}T09:45:00Z`,
      guardrailFlagged: false,
      guardrailSummary: null,
    },
    {
      id: "out_pending_4",
      requestId: "req_4",
      commandId: "draft_daily_log",
      generatedText:
        "Reuben had a positive morning, attending his online tutoring session for the full hour...",
      confidence: "high",
      status: "edited",
      userId: "staff_sarah",
      createdAt: `${seedDay(-28)}T18:00:00Z`,
      guardrailFlagged: false,
      guardrailSummary: null,
    },
  ];
}
