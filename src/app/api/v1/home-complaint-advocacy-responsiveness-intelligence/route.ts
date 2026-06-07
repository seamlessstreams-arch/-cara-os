// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME COMPLAINT & ADVOCACY RESPONSIVENESS INTELLIGENCE API ROUTE
// GET /api/v1/home-complaint-advocacy-responsiveness-intelligence
// Cross-domain composite: complaintOutcomeRecords + complaintTrends +
// advocacyRecords + childFeedbackLoops + participationEntries
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeComplaintAdvocacyResponsiveness,
  type ComplaintOutcomeInput,
  type ComplaintTrendInput,
  type AdvocacyRecordInput,
  type ChildFeedbackLoopInput,
  type ParticipationEntryInput,
} from "@/lib/engines/home-complaint-advocacy-responsiveness-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawComplaintOutcomes = (store.complaintOutcomeRecords ?? []) as any[];
    const complaint_outcomes: ComplaintOutcomeInput[] = rawComplaintOutcomes.map((c: any) => {
      // The canonical/seeded ComplaintOutcomeRecord uses `outcome`, `complainant_satisfied`,
      // `response_time_days`, `date_resolved`, `lessons_learned`, `practice_changes`. The
      // previous mapping read fields that don't exist (resolved/child_satisfied/acknowledged/
      // actual_resolution_days), so every complaint rate computed as 0% despite real data.
      const resolved = c.outcome != null && c.outcome !== "ongoing";
      const hasLesson = typeof c.lessons_learned === "string" && c.lessons_learned.trim().length > 0;
      const changesMade = Array.isArray(c.practice_changes) && c.practice_changes.length > 0;
      const responseDays =
        typeof c.response_time_days === "number" && c.response_time_days > 0
          ? c.response_time_days
          : null;
      return {
        id: c.id ?? "",
        child_id: c.child_id ?? "",
        complaint_date: (c.complaint_date ?? today).toString(),
        complaint_type: c.complaint_type ?? (c.source === "anonymous" ? "anonymous" : "formal"),
        category: c.category ?? c.theme ?? "",
        // No explicit acknowledged flag in the schema; an assigned investigator evidences acknowledgement.
        acknowledged: c.acknowledged ?? !!c.investigated_by,
        acknowledged_date: c.acknowledged_date ?? null,
        resolved: c.resolved ?? resolved,
        resolution_date: c.resolution_date ?? c.date_resolved ?? null,
        resolution_description:
          c.resolution_description ??
          (typeof c.findings === "string" && c.findings.trim() ? c.findings : c.lessons_learned ?? null),
        child_satisfied: c.child_satisfied ?? (c.complainant_satisfied === true),
        learning_actions_identified: c.learning_actions_identified ?? (hasLesson ? 1 : 0),
        learning_actions_implemented: c.learning_actions_implemented ?? (changesMade ? 1 : 0),
        target_resolution_days: c.target_resolution_days ?? 28,
        actual_resolution_days: c.actual_resolution_days ?? responseDays,
        created_at: (c.created_at ?? today).toString(),
      };
    });

    const rawComplaintTrends = (store.complaintTrends ?? []) as any[];
    const complaint_trends: ComplaintTrendInput[] = rawComplaintTrends.map((t: any) => ({
      id: t.id ?? "",
      period_start: (t.period_start ?? today).toString(),
      period_end: (t.period_end ?? today).toString(),
      total_complaints: t.total_complaints ?? 0,
      resolved_count: t.resolved_count ?? 0,
      average_resolution_days: t.average_resolution_days ?? 0,
      recurring_themes: Array.isArray(t.recurring_themes) ? t.recurring_themes : [],
      actions_taken: t.actions_taken ?? "",
      reviewed_by: t.reviewed_by ?? "",
      created_at: (t.created_at ?? today).toString(),
    }));

    const rawAdvocacy = (store.advocacyRecords ?? []) as any[];
    const advocacy_records: AdvocacyRecordInput[] = rawAdvocacy.map((a: any) => {
      // Seed/canonical AdvocacyRecord uses `provider`, `status`, and a `visits[]` array.
      // The previous mapping read provider_name/active/meetings_held/child_voice_captured,
      // none of which exist — so `active` defaulted to true for EVERY record (overstating
      // advocacy access to 100%) and child-voice / meeting signals were lost.
      const visits = Array.isArray(a.visits) ? a.visits : [];
      return {
        id: a.id ?? "",
        child_id: a.child_id ?? "",
        advocacy_type: a.advocacy_type ?? "independent",
        provider_name: a.provider_name ?? a.provider ?? "",
        start_date: (a.start_date ?? today).toString(),
        active: a.active ?? (a.status === "active"),
        meetings_held: a.meetings_held ?? visits.length,
        quality_rating: a.quality_rating ?? 3,
        child_voice_captured:
          a.child_voice_captured ?? visits.some((v: any) => v.private_session === true),
        outcomes_documented:
          a.outcomes_documented ??
          visits.some((v: any) => Array.isArray(v.actions_raised) && v.actions_raised.length > 0),
        created_at: (a.created_at ?? today).toString(),
      };
    });

    const rawFeedbackLoops = (store.childFeedbackLoops ?? []) as any[];
    const child_feedback_loops: ChildFeedbackLoopInput[] = rawFeedbackLoops.map((f: any) => ({
      id: f.id ?? "",
      child_id: f.child_id ?? "",
      feedback_date: (f.feedback_date ?? today).toString(),
      feedback_type: f.feedback_type ?? "informal",
      feedback_recorded: !!f.feedback_recorded,
      response_given: !!f.response_given,
      response_date: f.response_date ?? null,
      child_acknowledged_response: !!f.child_acknowledged_response,
      loop_closed: !!f.loop_closed,
      created_at: (f.created_at ?? today).toString(),
    }));

    const rawParticipation = (store.participationEntries ?? []) as any[];
    const participation_entries: ParticipationEntryInput[] = rawParticipation.map((p: any) => ({
      id: p.id ?? "",
      child_id: p.child_id ?? "",
      date: (p.date ?? today).toString(),
      participation_type: p.participation_type ?? "house_meeting",
      attended: !!p.attended,
      voice_heard: !!p.voice_heard,
      outcome_influenced: !!p.outcome_influenced,
      created_at: (p.created_at ?? today).toString(),
    }));

    const result = computeComplaintAdvocacyResponsiveness({
      today,
      total_children,
      complaint_outcomes,
      complaint_trends,
      advocacy_records,
      child_feedback_loops,
      participation_entries,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
