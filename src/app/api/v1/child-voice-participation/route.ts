// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD VOICE & PARTICIPATION INTELLIGENCE API ROUTE
// GET /api/v1/child-voice-participation
// Home-level engine: aggregates how well children's voices are heard across
// the home — LAC review participation, advocacy, key work, feedback.
// CHR 2015 Reg 7 (welfare), Reg 16 (complaints), Reg 45 (independent person).
// SCCIF: "The voice of the child runs throughout all evidence."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeChildVoiceParticipation,
  type ChildInfo,
  type LacReviewInput,
  type AdvocacyInput,
  type KeyWorkSessionInput,
  type FeedbackEntryInput,
  type ParticipationType,
} from "@/lib/engines/child-voice-participation-engine";

// Map store's LACChildParticipation → engine's ParticipationType
function mapParticipation(storeValue: string): ParticipationType {
  switch (storeValue) {
    case "attended":              return "attended";
    case "views_submitted":       return "written_views";
    case "advocate_attended":     return "represented";
    case "did_not_participate":   return "did_not_participate";
    case "declined":              return "declined";
    default:                      return "did_not_participate";
  }
}

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ───────────────────────────────────────────────────────────
  const children: ChildInfo[] = (store.youngPeople ?? [])
    .filter((yp: any) => yp.status === "current")
    .map((yp: any) => ({
      id: yp.id,
      name: yp.name ?? `${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim() || yp.id,
    }));

  // ── LAC Reviews ────────────────────────────────────────────────────────
  const lac_reviews: LacReviewInput[] = (store.lacReviews ?? []).map((r: any) => ({
    id: r.id,
    child_id: r.child_id,
    date: typeof r.date === "string" ? r.date.slice(0, 10) : r.date,
    child_participation: mapParticipation(r.child_participation ?? "did_not_participate"),
    child_views_recorded: !!(r.child_views && r.child_views.trim().length > 0),
    iro_name: r.iro ?? r.iro_name ?? "",
  }));

  // ── Advocacy Records ───────────────────────────────────────────────────
  const advocacy_records: AdvocacyInput[] = (store.advocacyRecords ?? []).map((r: any) => {
    const visits = Array.isArray(r.visits) ? r.visits : [];
    const privateSessions = visits.filter((v: any) => v.private_session).length;

    return {
      id: r.id,
      child_id: r.child_id,
      status: r.status ?? "active",
      provider: r.provider ?? "",
      referral_date: typeof r.referral_date === "string" ? r.referral_date.slice(0, 10) : r.referral_date ?? today,
      visits_count: visits.length,
      issues_raised: Array.isArray(r.issues_raised) ? r.issues_raised : [],
      private_sessions: privateSessions,
    };
  });

  // ── Key Work Sessions ──────────────────────────────────────────────────
  const key_work_sessions: KeyWorkSessionInput[] = (store.keyWorkingSessions ?? []).map((k: any) => ({
    id: k.id,
    child_id: k.child_id,
    date: typeof k.date === "string" ? k.date.slice(0, 10) : k.date,
    child_engaged: k.child_engaged ?? (k.mood_after != null && k.mood_before != null ? k.mood_after >= k.mood_before : true),
    child_views_captured: k.child_views_captured ?? !!(k.child_voice && k.child_voice.trim().length > 0),
    themes: Array.isArray(k.topics) ? k.topics : Array.isArray(k.themes) ? k.themes : [],
  }));

  // ── YP Feedback ────────────────────────────────────────────────────────
  const feedback_entries: FeedbackEntryInput[] = (store.ypFeedback ?? []).map((f: any) => ({
    id: f.id,
    child_id: f.child_id,
    date: typeof f.date === "string" ? f.date.slice(0, 10) : f.date,
    type: f.category === "food" || f.category === "activities" || f.category === "bedroom"
      ? (f.sentiment === "positive" ? "compliment" : f.sentiment === "negative" ? "complaint" : "suggestion")
      : f.type ?? (f.sentiment === "positive" ? "compliment" : f.sentiment === "negative" ? "complaint" : "suggestion"),
    status: f.status ?? (f.response_given_to_child ? "resolved" : "open"),
    response_given: f.response_given_to_child ?? f.response_given ?? false,
    response_within_target: f.response_within_target ?? f.response_given_to_child ?? false,
  }));

  // ── Compute ────────────────────────────────────────────────────────────
  const result = computeChildVoiceParticipation({
    today,
    children,
    lac_reviews,
    advocacy_records,
    key_work_sessions,
    feedback_entries,
  });

  return NextResponse.json({ data: result });
}
