// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — GAP DETECTION SERVICE
// Identifies missing evidence, overdue actions, and recording gaps.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { AriaStudioGap, AriaStudioGapType } from "@/types/aria-studio";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function detectGaps(
  hid: string,
  childId?: string,
): Promise<AriaStudioGap[]> {
  const sb = createServerClient();
  const gaps: AriaStudioGap[] = [];
  const now = new Date().toISOString();

  if (!sb) {
    // Demo mode — return illustrative gaps
    return getDemoGaps(hid, childId);
  }

  // Check for missing child voice in recent sources
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (sb.from("aria_studio_sources") as any)
      .select("id, source_type, title, content, summary, child_id")
      .eq("home_id", hid)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (childId) query = query.eq("child_id", childId);
    const { data: sources } = await query;

    if (sources?.length) {
      const hasChildVoice = sources.some((s: { content?: string; summary?: string }) => {
        const text = `${s.content ?? ""} ${s.summary ?? ""}`.toLowerCase();
        return text.includes("child said") || text.includes("child's voice") ||
          text.includes("wishes") || text.includes("young person said");
      });

      if (!hasChildVoice) {
        gaps.push(createGap(hid, childId ?? null, "missing_child_voice", "high",
          "Child voice not found in recent records",
          "No recent records contain the child's own words or views. Consider capturing wishes and feelings.",
          "Schedule a wishes and feelings session or key work session focused on the child's voice.",
        ));
      }
    }
  } catch { /* non-blocking */ }

  // Check for overdue actions
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: overdueActions } = await (sb.from("aria_studio_artifact_actions") as any)
      .select("id, action_title, due_date")
      .eq("status", "open")
      .lt("due_date", now)
      .limit(20);

    if (overdueActions?.length) {
      gaps.push(createGap(hid, null, "overdue_action", "high",
        `${overdueActions.length} overdue action${overdueActions.length !== 1 ? "s" : ""} found`,
        `There are ${overdueActions.length} actions past their due date that have not been completed.`,
        "Review and update overdue actions. Escalate where necessary.",
      ));
    }
  } catch { /* non-blocking */ }

  // Persist gaps
  for (const gap of gaps) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sb.from("aria_studio_gaps") as any).insert({
        home_id: gap.home_id,
        child_id: gap.child_id,
        gap_type: gap.gap_type,
        severity: gap.severity,
        title: gap.title,
        description: gap.description,
        recommended_action: gap.recommended_action,
        status: "open",
      });
    } catch { /* non-blocking */ }
  }

  return gaps;
}

export async function resolveGap(gapId: string, resolvedBy: string): Promise<void> {
  const sb = createServerClient();
  if (!sb) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (sb.from("aria_studio_gaps") as any).update({
    status: "resolved",
    resolved_at: new Date().toISOString(),
    assigned_to: resolvedBy,
  }).eq("id", gapId);
}

function createGap(
  hid: string, childId: string | null, gapType: AriaStudioGapType,
  severity: string, title: string, description: string, recommendedAction: string,
): AriaStudioGap {
  return {
    id: crypto.randomUUID(),
    home_id: hid, child_id: childId, staff_id: null,
    gap_type: gapType, severity, title, description,
    recommended_action: recommendedAction,
    linked_record_id: null, linked_record_type: null,
    status: "open", assigned_to: null, due_date: null,
    created_at: new Date().toISOString(), resolved_at: null,
  };
}

function getDemoGaps(hid: string, childId?: string): AriaStudioGap[] {
  return [
    createGap(hid, childId ?? null, "missing_child_voice", "high",
      "Child voice not recently captured",
      "The child's wishes and feelings have not been formally recorded in the past 30 days.",
      "Schedule a wishes and feelings session within the next 5 working days.",
    ),
    createGap(hid, childId ?? null, "missing_management_oversight", "medium",
      "Management oversight gap",
      "No management oversight comments have been recorded against recent incidents.",
      "Review recent incidents and add oversight comments.",
    ),
    createGap(hid, null, "weak_reg45_evidence", "medium",
      "Reg 45 evidence may be incomplete",
      "Some areas of the Quality Standards may lack sufficient evidence for the current reporting period.",
      "Run a Reg 45 evidence pull and review coverage across all Quality Standards.",
    ),
  ];
}
