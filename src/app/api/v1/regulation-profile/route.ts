// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION PROFILE (§5.7)
//
// GET   /api/v1/regulation-profile?child_id=…   → the profile + evidence-based
//                                                 suggestions from the emotional-
//                                                 safety analysis + adult reflections
// PUT                                            → save the profile (upsert)
// POST                                           → record an adult co-regulation
//                                                 reflection after an incident
//
// Reads and suggestions are always on. WRITES are gated behind
// regulation_profile_write (opt-in, default OFF): a live profile is a
// consequential clinical-ish record, so the pen ships dark.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { getYPName } from "@/lib/seed-data";
import { generateId } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import { buildEmotionalSafetyAnalysis } from "@/lib/emotional-safety/emotional-safety-engine";
import {
  suggestFromAnalysis,
  readReflection,
  ADULT_REFLECTION_QUESTIONS,
  type RegulationProfile,
  type AdultRegulationReflection,
} from "@/lib/emotional-safety/regulation-profile-engine";

export const dynamic = "force-dynamic";

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const YN = ["yes", "partly", "no", "unsure"] as const;
const EFFECT = ["reduced_pressure", "neutral", "increased_pressure", "unsure"] as const;
const yn = (v: unknown): (typeof YN)[number] => (YN as readonly string[]).includes(str(v)) ? (v as (typeof YN)[number]) : "unsure";
const effect = (v: unknown): (typeof EFFECT)[number] =>
  (EFFECT as readonly string[]).includes(str(v)) ? (v as (typeof EFFECT)[number]) : "unsure";

// The free-text profile fields, so PUT can copy them without trusting a spread.
const PROFILE_FIELDS = [
  "baseline", "early_signs", "escalation_signs", "shutdown_signs", "body_cues",
  "sensory_preferences", "environment_needs", "helpful_adults", "helpful_approaches",
  "unhelpful_approaches", "helpful_language", "safe_places", "grounding_activities",
  "recovery_signs", "time_needed", "readiness_for_reflection", "child_own_words",
] as const;

export async function GET(req: NextRequest) {
  try {
    const childId = new URL(req.url).searchParams.get("child_id");
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const denied = assertChildHomeAccess(identity, childId);
    if (denied) return denied;
    if (!childId) return NextResponse.json({ error: "child_id is required" }, { status: 400 });

    const store = getStore();
    const profile = (store.regulationProfiles ?? []).find((p) => p.child_id === childId) ?? null;
    const reflections = (store.adultRegulationReflections ?? []).filter((r) => r.child_id === childId);

    // Evidence-based suggestions from the emotional-safety analysis (same input
    // assembly as /emotional-safety, so the two agree).
    const pace = (store.childPaceProfiles ?? []).find((p) => p.childId === childId);
    const analysis = buildEmotionalSafetyAnalysis({
      childId,
      childName: getYPName(childId),
      now: new Date().toISOString(),
      behaviourLog: store.behaviourLog ?? [],
      incidents: store.incidents ?? [],
      keyWorkingSessions: store.keyWorkingSessions ?? [],
      knownTriggers: pace?.knownTriggers ?? [],
      calmingApproaches: pace?.calmingApproaches ?? [],
    });
    const suggestions = suggestFromAnalysis(analysis);

    return NextResponse.json({
      data: {
        childId,
        childName: getYPName(childId),
        profile,
        suggestions,
        reflections: reflections.map((r) => ({ ...r, read: readReflection(r) })),
        questions: ADULT_REFLECTION_QUESTIONS,
        writeEnabled: isFeatureEnabled("regulation_profile_write"),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Upsert the child's regulation profile. */
export async function PUT(req: NextRequest) {
  try {
    if (!isFeatureEnabled("regulation_profile_write")) {
      return NextResponse.json({ error: "Regulation profile writing is not enabled (regulation_profile_write)." }, { status: 403 });
    }
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    if (!body?.child_id) return NextResponse.json({ error: "child_id is required" }, { status: 400 });

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const denied = assertChildHomeAccess(identity, String(body.child_id));
    if (denied) return denied;

    const store = getStore();
    const now = new Date().toISOString();
    const fields = Object.fromEntries(PROFILE_FIELDS.map((f) => [f, str(body[f])])) as Record<(typeof PROFILE_FIELDS)[number], string>;
    const existing = (store.regulationProfiles ?? []).find((p) => p.child_id === String(body.child_id));

    if (existing) {
      Object.assign(existing, fields, {
        review_date: body.review_date ? String(body.review_date) : existing.review_date,
        updated_at: now,
        updated_by: identity.userId,
      });
      return NextResponse.json({ data: existing });
    }

    const profile: RegulationProfile = {
      id: generateId("regprof"),
      child_id: String(body.child_id),
      home_id: String(body.home_id ?? store.home.id ?? ""),
      ...fields,
      review_date: body.review_date ? String(body.review_date) : null,
      updated_at: now,
      updated_by: identity.userId,
    };
    store.regulationProfiles.push(profile);
    return NextResponse.json({ data: profile }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Record one adult co-regulation reflection after an incident. */
export async function POST(req: NextRequest) {
  try {
    if (!isFeatureEnabled("regulation_profile_write")) {
      return NextResponse.json({ error: "Regulation profile writing is not enabled (regulation_profile_write)." }, { status: 403 });
    }
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    if (!body?.incident_id || !body?.child_id) {
      return NextResponse.json({ error: "incident_id and child_id are required" }, { status: 400 });
    }

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;
    const denied = assertChildHomeAccess(identity, String(body.child_id));
    if (denied) return denied;

    const store = getStore();
    const now = new Date().toISOString();
    const reflection: AdultRegulationReflection = {
      id: generateId("arr"),
      incident_id: String(body.incident_id),
      child_id: String(body.child_id),
      staff_id: identity.userId,
      adult_calm_enough: yn(body.adult_calm_enough),
      adult_behaviour_effect: effect(body.adult_behaviour_effect),
      language_proportionate: yn(body.language_proportionate),
      processing_time_given: yn(body.processing_time_given),
      sensory_needs_considered: yn(body.sensory_needs_considered),
      co_regulation_attempted: yn(body.co_regulation_attempted),
      what_worked: str(body.what_worked),
      what_i_would_change: str(body.what_i_would_change),
      support_i_need: str(body.support_i_need),
      created_at: now,
      created_by: identity.userId,
    };
    store.adultRegulationReflections.push(reflection);
    return NextResponse.json({ data: { ...reflection, read: readReflection(reflection) } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
