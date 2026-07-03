// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGER PRIORITY BRIEFING API ROUTE
// GET /api/v1/manager-priority-briefing
//
// Broad critical-signal SWEEP across the fleet of home-*-intelligence engines.
// Fans out to each engine route internally (same proven pattern as
// home-ofsted-readiness-composite), defensively extracts the attention-worthy
// signals (critical insights, poor ratings, urgent recommendations, concerns),
// and ranks them via the pure manager-priority-briefing engine.
//
// Pure read aggregation — no mutations, no notifications, no external calls.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  computeManagerPriorityBriefing,
  type EngineSignalInput,
} from "@/lib/engines/manager-priority-briefing-engine";
import {
  mapInspectionToSignal,
  mapOutcomeHomeToSignal,
  mapRelationshipHomeToSignal,
  mapSopRealityCheckToSignal,
} from "@/lib/engines/briefing-native-mappers";

export const dynamic = "force-dynamic";

// Curated, high-signal engine set [routeSlug, domain]. Broad enough to be a real
// fleet sweep, curated to keep it signal over noise. Labels are derived from the
// slug. Routes are known-good (the ofsted-composite set) plus the recently-lit
// safeguarding / wellbeing / relationships engines.
const ENGINES: [string, string][] = [
  // ── Protection / safeguarding ──
  ["home-safeguarding-intelligence", "protection"],
  ["home-safeguarding-depth-intelligence", "protection"],
  ["home-safeguarding-prevention-intelligence", "protection"],
  ["home-self-harm-safety-plan-intelligence", "protection"],
  ["home-risk-management-plan-intelligence", "protection"],
  ["home-contextual-safeguarding-risk-intelligence", "protection"],
  ["home-exploitation-screening-intelligence", "protection"],
  ["home-substance-misuse-screening-intelligence", "protection"],
  ["home-missing-episodes-intelligence", "protection"],
  ["home-incident-safety-intelligence", "protection"],
  ["home-post-incident-child-debrief-intelligence", "protection"],
  ["home-behaviour-intelligence", "protection"],
  ["home-bsp-effectiveness-intelligence", "protection"],
  ["home-restrictive-practice-intelligence", "protection"],
  ["home-risk-assessment-intelligence", "protection"],
  ["home-risk-landscape-intelligence", "protection"],
  ["home-strategic-risk-intelligence", "protection"],
  ["home-notifiable-events-intelligence", "protection"],
  ["home-emergency-preparedness-intelligence", "protection"],
  ["home-fire-safety-intelligence", "protection"],
  ["home-premises-safety-intelligence", "protection"],
  ["home-medication-governance-intelligence", "protection"],
  ["home-medication-management-intelligence", "protection"],
  ["home-complaints-intelligence", "protection"],
  ["home-night-safety-intelligence", "protection"],
  // ── Experiences / wellbeing ──
  ["home-health-wellbeing-intelligence", "experiences"],
  ["home-health-monitoring-intelligence", "experiences"],
  ["home-mental-health-intelligence", "experiences"],
  ["home-annual-health-assessment-intelligence", "experiences"],
  ["home-attachment-profile-intelligence", "experiences"],
  ["home-trauma-therapy-intelligence", "experiences"],
  ["home-multidisciplinary-formulation-intelligence", "experiences"],
  ["home-sleep-quality-intelligence", "experiences"],
  ["home-nutrition-catering-intelligence", "experiences"],
  ["home-education-engagement-intelligence", "experiences"],
  ["home-education-achievement-intelligence", "experiences"],
  ["home-pep-education-quality-intelligence", "experiences"],
  ["home-therapeutic-progress-intelligence", "experiences"],
  ["home-enrichment-achievement-intelligence", "experiences"],
  ["home-activity-enrichment-intelligence", "experiences"],
  ["home-wellbeing-intelligence", "experiences"],
  ["home-outcomes-progress-intelligence", "experiences"],
  ["home-outcome-star-assessment-intelligence", "experiences"],
  ["home-independence-intelligence", "experiences"],
  ["home-placement-stability-intelligence", "experiences"],
  ["home-placement-impact-assessment-intelligence", "experiences"],
  ["home-cultural-identity-intelligence", "experiences"],
  ["home-child-voice-intelligence", "experiences"],
  ["home-family-engagement-intelligence", "experiences"],
  ["home-social-worker-contact-intelligence", "experiences"],
  ["home-sibling-contact-protocol-intelligence", "experiences"],
  ["home-transition-planning-intelligence", "experiences"],
  ["home-key-working-intelligence", "experiences"],
  ["home-digital-safety-intelligence", "experiences"],
  // ── Leadership / management ──
  ["home-regulatory-compliance-intelligence", "leadership"],
  ["home-policy-compliance-intelligence", "leadership"],
  ["home-quality-assurance-intelligence", "leadership"],
  ["home-reg44-intelligence", "leadership"],
  ["home-reg4445-evidence-intelligence", "leadership"],
  ["home-data-governance-intelligence", "leadership"],
  ["home-document-governance-intelligence", "leadership"],
  ["home-recording-quality-intelligence", "leadership"],
  ["home-organizational-learning-intelligence", "leadership"],
  ["home-meeting-governance-intelligence", "leadership"],
  ["home-multi-agency-intelligence", "leadership"],
  ["home-delegated-authority-intelligence", "leadership"],
  ["home-lac-review-intelligence", "leadership"],
  ["home-management-walkround-oversight-intelligence", "leadership"],
  // ── Workforce ──
  ["home-workforce-planning-intelligence", "workforce"],
  ["home-staff-lifecycle-intelligence", "workforce"],
  ["home-staff-development-intelligence", "workforce"],
  ["home-staff-wellbeing-intelligence", "workforce"],
  ["home-supervision-intelligence", "workforce"],
  ["home-competency-landscape-intelligence", "workforce"],
  ["home-safer-recruitment-intelligence", "workforce"],
  ["home-shift-pattern-intelligence", "workforce"],
  ["home-handover-continuity-intelligence", "workforce"],
  ["home-staff-recognition-morale-intelligence", "workforce"],
];

function labelFor(route: string): string {
  return route
    .replace(/^home-/, "")
    .replace(/-intelligence$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Defensively pull the attention-worthy signal payload out of one engine's `data`. */
function extractSignal(d: any, route: string, domain: string): EngineSignalInput | null {
  if (!d || typeof d !== "object") return null;
  const ratingKey = Object.keys(d).find((k) => k.endsWith("_rating") || k === "rating");
  const scoreKey = Object.keys(d).find((k) => k.endsWith("_score") || k === "score");
  const rating = ratingKey && d[ratingKey] != null ? String(d[ratingKey]) : null;
  const score = scoreKey && typeof d[scoreKey] === "number" ? d[scoreKey] : null;
  const headline = typeof d.headline === "string" ? d.headline : null;

  const insights = Array.isArray(d.insights)
    ? d.insights
        .map((i: any) => ({
          text: String(i?.text ?? i?.message ?? (typeof i === "string" ? i : "")),
          severity: String(i?.severity ?? i?.level ?? ""),
        }))
        .filter((i: { text: string }) => i.text.trim().length > 0)
    : [];

  const concerns = Array.isArray(d.concerns)
    ? d.concerns.filter((c: any) => typeof c === "string" && c.trim().length > 0)
    : [];

  const recommendations = Array.isArray(d.recommendations)
    ? d.recommendations
        .map((r: any) => ({
          text: String(r?.recommendation ?? r?.text ?? r?.action ?? (typeof r === "string" ? r : "")),
          urgency: String(r?.urgency ?? r?.priority ?? ""),
          regulatory_ref: (r?.regulatory_ref ?? r?.reg_ref ?? null) as string | null,
        }))
        .filter((r: { text: string }) => r.text.trim().length > 0)
    : [];

  return { engine_key: route, label: labelFor(route), domain, rating, score, headline, insights, concerns, recommendations };
}

async function fetchSignal(baseUrl: string, route: string, domain: string): Promise<EngineSignalInput | null> {
  try {
    const res = await fetch(`${baseUrl}/api/v1/${route}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return extractSignal(json?.data, route, domain);
  } catch {
    return null;
  }
}

/**
 * The newer CARA intelligence engines (relationship / outcome / inspection) have
 * richer, differently-shaped payloads than the home-* fleet, so map them to
 * manager signals natively rather than via the generic extractor. This surfaces
 * the new intelligence in the same "what needs me" feed — one feed, many
 * contributors, never a duplicate dashboard.
 */
async function fetchNativeSignals(baseUrl: string): Promise<EngineSignalInput[]> {
  const get = async (route: string): Promise<any | null> => {
    try {
      const res = await fetch(`${baseUrl}/api/v1/${route}`, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json())?.data ?? null;
    } catch {
      return null;
    }
  };

  const [insp, outc, rel, sop] = await Promise.all([
    get("inspection-intelligence"),
    get("outcome-intelligence/home"),
    get("relationship-intelligence/home"),
    get("sop-reality-check"),
  ]);

  return [
    mapInspectionToSignal(insp),
    mapOutcomeHomeToSignal(outc),
    mapRelationshipHomeToSignal(rel),
    mapSopRealityCheckToSignal(sop),
  ].filter((s): s is EngineSignalInput => s !== null);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const today = new Date().toISOString().slice(0, 10);

    const [results, nativeSignals] = await Promise.all([
      Promise.allSettled(ENGINES.map(([route, domain]) => fetchSignal(baseUrl, route, domain))),
      fetchNativeSignals(baseUrl),
    ]);
    const httpSignals = results
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter((v): v is EngineSignalInput => v !== null);
    const signals = [...httpSignals, ...nativeSignals];

    const NATIVE_COUNT = 4;
    const result = computeManagerPriorityBriefing({
      signals,
      engines_queried: ENGINES.length + NATIVE_COUNT,
      engines_responded: signals.length,
      today,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    console.error("[api] server error:", err); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
