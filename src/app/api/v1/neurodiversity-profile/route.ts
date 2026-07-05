// ══════════════════════════════════════════════════════════════════════════════
// CARA — UNIFIED NEURODIVERSITY PROFILE API
// GET ?child_id=…[&context=incident|behaviour|restraint|key_work|…]
//     → the child's unified profile + the point-of-work prompts for that context.
// GET (no child_id) → whole-home rollup: who has a profile, who has review gaps.
//
// Equality Act 2010 · SEND Code of Practice 2015 · CHR 2015 Reg 6/11.
// The engine is pure; this route only reads store snapshots and maps them in.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { unifyNeuroProfile, deriveRecordingPrompts } from "@/lib/neurodiversity-profile/unification-engine";
import type { NeuroRecordingContext, UnifyNeuroInput } from "@/lib/neurodiversity-profile/types";

export const dynamic = "force-dynamic";

const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);
const nameOf = (yp: { preferred_name?: string; first_name?: string; name?: string }): string =>
  yp.preferred_name || yp.first_name || yp.name || "Child";

const VALID_CONTEXTS: NeuroRecordingContext[] = ["incident", "behaviour", "restraint", "daily_log", "key_work", "care_plan", "overview"];

function buildInput(store: ReturnType<typeof getStore>, childId: string, childName: string, asOf: string): UnifyNeuroInput {
  const byChild = (x: { child_id?: string }) => x.child_id === childId;
  return {
    childId,
    childName,
    asOf,
    autismPlans: (store.autismPlans ?? []).filter(byChild).map((a: Record<string, unknown>) => ({
      id: String(a.id),
      child_id: String(a.child_id),
      plan_date: String(a.plan_date ?? ""),
      diagnosis_status: String(a.diagnosis_status ?? ""),
      diagnosis_date: a.diagnosis_date ? String(a.diagnosis_date) : undefined,
      diagnosing_clinician: a.diagnosing_clinician ? String(a.diagnosing_clinician) : undefined,
      special_interests: arr(a.special_interests),
      communication_preferences: arr(a.communication_preferences),
      sensory_profile: Array.isArray(a.sensory_profile)
        ? (a.sensory_profile as Array<Record<string, unknown>>).map((s) => ({ sense: String(s.sense ?? ""), seeking_or_avoiding: String(s.seeking_or_avoiding ?? ""), specific_notes: String(s.specific_notes ?? "") }))
        : [],
      predictability_needs: arr(a.predictability_needs),
      meltdown_triggers: arr(a.meltdown_triggers),
      meltdown_support: arr(a.meltdown_support),
      shutdown_indicators: arr(a.shutdown_indicators),
      shutdown_support: arr(a.shutdown_support),
      transition_support: arr(a.transition_support),
      staff_do_strategies: arr(a.staff_do_strategies),
      staff_do_not_strategies: arr(a.staff_do_not_strategies),
      child_voice: String(a.child_voice ?? ""),
      review_date: String(a.review_date ?? ""),
      key_worker: String(a.key_worker ?? ""),
    })),
    adhdPlans: (store.adhdPlans ?? []).filter(byChild).map((a: Record<string, unknown>) => ({
      id: String(a.id),
      child_id: String(a.child_id),
      plan_date: String(a.plan_date ?? ""),
      diagnosis_status: String(a.diagnosis_status ?? ""),
      diagnosis_date: a.diagnosis_date ? String(a.diagnosis_date) : undefined,
      strengths: arr(a.strengths),
      challenges: arr(a.challenges),
      executive_function_support: arr(a.executive_function_support),
      time_blindness_strategies: arr(a.time_blindness_strategies),
      school_adjustments: arr(a.school_adjustments),
      home_adjustments: arr(a.home_adjustments),
      staff_do_strategies: arr(a.staff_do_strategies),
      staff_do_not_strategies: arr(a.staff_do_not_strategies),
      child_voice: String(a.child_voice ?? ""),
      review_date: String(a.review_date ?? ""),
      key_worker: String(a.key_worker ?? ""),
    })),
    sensoryProfiles: (store.sensoryProfileRecords ?? []).filter(byChild).map((s: Record<string, unknown>) => ({
      id: String(s.id),
      child_id: String(s.child_id),
      status: String(s.status ?? ""),
      diagnosis: arr(s.diagnosis),
      entries: Array.isArray(s.entries)
        ? (s.entries as Array<Record<string, unknown>>).map((e) => ({ domain: String(e.domain ?? ""), response_pattern: String(e.response_pattern ?? ""), triggers: arr(e.triggers), calming: arr(e.calming), notes: String(e.notes ?? "") }))
        : [],
      environmental_adaptations: arr(s.environmental_adaptations),
      communication_preferences: arr(s.communication_preferences),
      child_views: String(s.child_views ?? ""),
      review_date: String(s.review_date ?? ""),
    })),
    ehcps: (store.ehcpRecords ?? []).filter(byChild).map((e: Record<string, unknown>) => ({
      id: String(e.id),
      child_id: String(e.child_id),
      plan_status: String(e.plan_status ?? ""),
      primary_need: String(e.primary_need ?? ""),
      secondary_needs: arr(e.secondary_needs),
      outstanding_actions: arr(e.outstanding_actions),
      next_annual_review_due: String(e.next_annual_review_due ?? ""),
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
      const profile = unifyNeuroProfile(buildInput(store, childId, yp ? nameOf(yp) : "Child", asOf));
      const ctxParam = searchParams.get("context");
      const context: NeuroRecordingContext = VALID_CONTEXTS.includes(ctxParam as NeuroRecordingContext)
        ? (ctxParam as NeuroRecordingContext)
        : "overview";
      const prompts = deriveRecordingPrompts(profile, context);
      return NextResponse.json({ data: { profile, context, prompts } });
    }

    // ── Whole-home rollup ─────────────────────────────────────────────────
    const children = (store.youngPeople ?? []).filter((y: { status?: string }) => y.status === "current");
    const rows = children.map((yp: { id: string }) => {
      const p = unifyNeuroProfile(buildInput(store, yp.id, nameOf(yp as { id: string }), asOf));
      return {
        childId: p.childId,
        childName: p.childName,
        hasProfile: p.hasProfile,
        conditions: p.conditions.map((c) => c.label),
        reviewGaps: p.reviewGaps.length,
        overdueOrMissing: p.reviewGaps.filter((g) => g.severity !== "due_soon").length,
      };
    });
    rows.sort((a: { overdueOrMissing: number; hasProfile: boolean }, b: { overdueOrMissing: number; hasProfile: boolean }) =>
      b.overdueOrMissing - a.overdueOrMissing || Number(b.hasProfile) - Number(a.hasProfile),
    );

    return NextResponse.json({
      data: {
        asOf,
        childrenWithProfile: rows.filter((r: { hasProfile: boolean }) => r.hasProfile).length,
        childrenWithGaps: rows.filter((r: { overdueOrMissing: number }) => r.overdueOrMissing > 0).length,
        rows,
      },
    });
  } catch (error: unknown) {
    console.error("[api] neurodiversity-profile error:", error);
    return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }
}
