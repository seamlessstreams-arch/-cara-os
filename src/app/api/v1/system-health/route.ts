// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTINUOUS HEALTH CHECK API
// GET → a deterministic integrity scan of the home's live records: overdue
// actions, missing management oversight, restraint repair gaps, missing return
// interviews, overdue reviews, recording gaps and orphaned references.
//
// Detection only — the report surfaces what needs a person; Cara never
// auto-alters a safeguarding record. The engine is pure; this route maps store
// snapshots into its input (reusing restraint→debrief and missing→return
// linkage from the org-learning / Reg44 routes).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { runSystemHealthCheck } from "@/lib/system-health/health-check-engine";
import type { SystemHealthInput } from "@/lib/system-health/types";

export const dynamic = "force-dynamic";

const day = (v: unknown): string => (typeof v === "string" ? v.slice(0, 10) : "");

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const store = getStore();
    const asOf = new Date().toISOString().slice(0, 10);

    // Restraint → debrief linkage: a debrief record exists for the restraint's incident.
    const debriefs = (store.debriefRecords ?? []) as Array<{ linked_incident_id?: string; child_id?: string }>;
    const hasDebrief = (rst: { id?: string; linked_incident_id?: string; child_id?: string }): boolean => {
      const incId = String(rst.linked_incident_id ?? "") || String(rst.id ?? "").replace("rst_", "inc_");
      return debriefs.some((d) => (d.linked_incident_id && d.linked_incident_id === incId) || (!!rst.child_id && d.child_id === rst.child_id));
    };

    // Missing episode → return interview linkage.
    const returnInterviews = (store.returnInterviews ?? []) as Array<{ episode_id?: string; missing_episode_id?: string; child_id?: string }>;
    const hasReturnInterview = (m: { id?: string; child_id?: string }): boolean =>
      returnInterviews.some((r) => r.episode_id === m.id || r.missing_episode_id === m.id || (!!m.child_id && r.child_id === m.child_id));

    // Daily-log dates grouped by child.
    const dailyLogDatesByChild: Record<string, string[]> = {};
    for (const log of (store.dailyLog ?? []) as unknown as Array<Record<string, unknown>>) {
      const cid = String(log.child_id ?? "");
      if (!cid) continue;
      (dailyLogDatesByChild[cid] ??= []).push(day(log.date));
    }

    // Reviews from risk assessments + LAC reviews.
    const reviews = [
      ...((store.riskAssessments ?? []) as unknown as Array<Record<string, unknown>>).map((r) => ({ id: String(r.id), kind: "Risk assessment", next_review_date: day(r.next_review_date ?? r.review_date), child_id: r.child_id ? String(r.child_id) : undefined })),
      ...((store.lacReviews ?? []) as unknown as Array<Record<string, unknown>>).map((r) => ({ id: String(r.id), kind: "LAC review", next_review_date: day(r.next_review_date ?? r.next_review), child_id: r.child_id ? String(r.child_id) : undefined })),
    ].filter((r) => r.next_review_date);

    const input: SystemHealthInput = {
      homeId: "home_oak",
      asOf,
      children: ((store.youngPeople ?? []) as unknown as Array<Record<string, unknown>>)
        .filter((c) => (c.status ?? "current") === "current") // real union: current|planned|ended|emergency — "former"/"discharged" never existed
        .map((c) => ({ id: String(c.id), name: String(c.preferred_name ?? c.name ?? c.id) })),
      tasks: ((store.tasks ?? []) as unknown as Array<Record<string, unknown>>).map((t) => ({ id: String(t.id), title: String(t.title ?? "Action"), due_date: day(t.due_date), status: String(t.status ?? ""), child_id: t.linked_child_id ? String(t.linked_child_id) : undefined })),
      incidents: ((store.incidents ?? []) as unknown as Array<Record<string, unknown>>).map((i) => ({ id: String(i.id), type: String(i.type ?? "other"), date: day(i.date), requires_oversight: !!i.requires_oversight, has_oversight: !!(i.oversight_note || i.oversight_by || i.oversight_at), child_id: i.child_id ? String(i.child_id) : undefined, status: String(i.status ?? "open") })),
      restraints: ((store.restraints ?? []) as unknown as Array<Record<string, unknown>>).map((r) => ({ id: String(r.id), date: day(r.date ?? r.created_at), child_debriefed: !!r.child_debriefed, has_debrief: hasDebrief(r as { id?: string; linked_incident_id?: string; child_id?: string }), child_id: r.child_id ? String(r.child_id) : undefined })),
      missingEpisodes: ((store.missingEpisodes ?? []) as unknown as Array<Record<string, unknown>>).map((m) => ({ id: String(m.id), date: day(m.date_missing ?? m.date ?? m.reported_at), has_return_interview: hasReturnInterview(m as { id?: string; child_id?: string }), child_id: m.child_id ? String(m.child_id) : undefined })),
      reviews,
      dailyLogDatesByChild,
    };

    return NextResponse.json({ data: runSystemHealthCheck(input) });
  } catch (err) {
    console.error("[system-health] failed", err);
    return NextResponse.json({ error: "Failed to run health check" }, { status: 500 });
  }
}
