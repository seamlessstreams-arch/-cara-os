// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD VOICE INTELLIGENCE: DIMENSIONS & TRENDS API
// GET /api/v1/child-voice-dimensions?child_id=…  → one child's voice dimensions,
//     trends and highlights, assembled from the records that already hold their
//     voice (feedback, key work, LAC reviews, feedback loops, advocacy).
// GET /api/v1/child-voice-dimensions               → whole-home rollup (one row
//     per current child: top priority + counts), for the manager overview.
//
// UN CRC Article 12 · CHR 2015 Reg 7 · Ofsted SCCIF "voice of the child".
// The engine is pure; this route only reads store snapshots and maps them in.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { computeChildVoiceDimensions } from "@/lib/child-voice-dimensions/dimensions-engine";
import type { ChildVoiceDimensionInput } from "@/lib/child-voice-dimensions/types";

export const dynamic = "force-dynamic";

const day = (v: unknown): string => (typeof v === "string" ? v.slice(0, 10) : "");
const nameOf = (yp: { preferred_name?: string; first_name?: string; name?: string; id: string }): string =>
  yp.preferred_name || yp.first_name || yp.name || "Child";

/** Build the pure-engine input for one child from live store snapshots. */
function buildInput(store: ReturnType<typeof getStore>, childId: string, childName: string, asOf: string): ChildVoiceDimensionInput {
  return {
    childId,
    childName,
    asOf,
    windowDays: 90,
    feedback: (store.ypFeedback ?? [])
      .filter((f: { child_id?: string }) => f.child_id === childId)
      .map((f: Record<string, unknown>) => ({
        id: String(f.id),
        child_id: String(f.child_id),
        date: day(f.date),
        category: String(f.category ?? "general"),
        sentiment: String(f.sentiment ?? ""),
        response_given_to_child: !!f.response_given_to_child,
        child_satisfied: (f.child_satisfied ?? null) as boolean | null,
      })),
    keyWork: (store.keyWorkingSessions ?? [])
      .filter((k: { child_id?: string }) => k.child_id === childId)
      .map((k: Record<string, unknown>) => ({
        id: String(k.id),
        child_id: String(k.child_id),
        date: day(k.date),
        child_voice: String(k.child_voice ?? ""),
      })),
    lacReviews: (store.lacReviews ?? [])
      .filter((l: { child_id?: string }) => l.child_id === childId)
      .map((l: Record<string, unknown>) => ({
        id: String(l.id),
        child_id: String(l.child_id),
        date: day(l.date),
        child_participation: String(l.child_participation ?? "did_not_participate"),
        child_views: String(l.child_views ?? ""),
      })),
    feedbackLoops: (store.childFeedbackLoops ?? [])
      .filter((f: { child_id?: string }) => f.child_id === childId)
      .map((f: Record<string, unknown>) => ({
        id: String(f.id),
        child_id: String(f.child_id),
        feedback_date: day(f.feedback_date),
        child_words: String(f.child_words ?? ""),
        decision_made: String(f.decision_made ?? "pending_consideration"),
        child_accepts: !!f.child_accepts,
      })),
    advocacy: (store.advocacyRecords ?? [])
      .filter((a: { child_id?: string }) => a.child_id === childId)
      .map((a: Record<string, unknown>) => ({
        id: String(a.id),
        child_id: String(a.child_id),
        status: String(a.status ?? ""),
        referral_date: day(a.referral_date),
        visits: Array.isArray(a.visits) ? (a.visits as Array<{ date?: string }>).map((v) => ({ date: day(v?.date) })) : [],
        home_response: String(a.home_response ?? ""),
      })),
    houseMeetings: (store.houseMeetings ?? []).map((h: Record<string, unknown>) => ({
      id: String(h.id),
      date: day(h.date),
      child_feedback: Array.isArray(h.child_feedback) ? (h.child_feedback as string[]) : [],
    })),
  };
}

export async function GET(req: NextRequest) {
  try {
    const store = getStore();
    const asOf = new Date().toISOString().slice(0, 10);
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get("child_id");

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const denied = assertChildHomeAccess(identity, childId);
    if (denied) return denied;

    if (childId) {
      const yp = (store.youngPeople ?? []).find((y: { id: string }) => y.id === childId);
      const profile = computeChildVoiceDimensions(buildInput(store, childId, yp ? nameOf(yp) : "Child", asOf));
      return NextResponse.json({ data: profile });
    }

    // ── Whole-home rollup — one lightweight row per current child ──────────
    const children = (store.youngPeople ?? []).filter((y: { status?: string }) => y.status === "current");
    const rows = children.map((yp: { id: string }) => {
      const p = computeChildVoiceDimensions(buildInput(store, yp.id, nameOf(yp as { id: string }), asOf));
      const priorities = p.highlights.filter((h) => h.severity === "priority");
      return {
        childId: p.childId,
        childName: p.childName,
        hasData: p.hasData,
        priorityCount: priorities.length,
        watchCount: p.highlights.filter((h) => h.severity === "watch").length,
        strengthCount: p.highlights.filter((h) => h.severity === "strength").length,
        topPriority: priorities[0]?.title ?? null,
        dimensions: p.dimensions.map((d) => ({ key: d.key, label: d.label, status: d.status, trend: d.trend, score: d.score })),
      };
    });

    // Children with a priority signal first, then those with data, then the rest.
    rows.sort((a: { priorityCount: number; hasData: boolean }, b: { priorityCount: number; hasData: boolean }) =>
      b.priorityCount - a.priorityCount || Number(b.hasData) - Number(a.hasData),
    );

    return NextResponse.json({
      data: {
        asOf,
        windowDays: 90,
        childrenWithVoiceData: rows.filter((r: { hasData: boolean }) => r.hasData).length,
        childrenWithPriority: rows.filter((r: { priorityCount: number }) => r.priorityCount > 0).length,
        rows,
      },
    });
  } catch (error: unknown) {
    console.error("[api] child-voice-dimensions error:", error);
    return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }
}
