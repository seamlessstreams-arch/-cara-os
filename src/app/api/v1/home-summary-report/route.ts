// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SUMMARY REPORT API ROUTE
// GET /api/v1/home-summary-report
//
// Builds a single shareable, print-ready summary of the home's standing across
// six domains by fanning out to the relevant home-*-intelligence engines (same
// proven internal-fetch pattern as ofsted-readiness-composite / priority-
// briefing) and grouping their outputs into report sections.
//
// Pure read aggregation — no mutations, notifications, or external calls.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeSummaryReport,
  type ReportSignalInput,
} from "@/lib/engines/home-summary-report-engine";

export const dynamic = "force-dynamic";

// [engineRouteSlug, sectionKey] — every route is known-good (verified to exist).
const SECTION_ENGINES: [string, string][] = [
  // Safeguarding & Protection
  ["home-safeguarding-intelligence", "safeguarding"],
  ["home-safeguarding-depth-intelligence", "safeguarding"],
  ["home-self-harm-safety-plan-intelligence", "safeguarding"],
  ["home-risk-management-plan-intelligence", "safeguarding"],
  ["home-contextual-safeguarding-risk-intelligence", "safeguarding"],
  ["home-missing-episodes-intelligence", "safeguarding"],
  ["home-incident-safety-intelligence", "safeguarding"],
  ["home-behaviour-intelligence", "safeguarding"],
  ["home-restrictive-practice-intelligence", "safeguarding"],
  ["home-medication-governance-intelligence", "safeguarding"],
  // Health & Wellbeing
  ["home-health-wellbeing-intelligence", "health"],
  ["home-health-monitoring-intelligence", "health"],
  ["home-mental-health-intelligence", "health"],
  ["home-annual-health-assessment-intelligence", "health"],
  ["home-attachment-profile-intelligence", "health"],
  ["home-trauma-therapy-intelligence", "health"],
  ["home-sleep-quality-intelligence", "health"],
  // Education & Outcomes
  ["home-education-engagement-intelligence", "education"],
  ["home-education-achievement-intelligence", "education"],
  ["home-pep-education-quality-intelligence", "education"],
  ["home-outcomes-progress-intelligence", "education"],
  ["home-outcome-star-assessment-intelligence", "education"],
  ["home-independence-intelligence", "education"],
  // Relationships & Voice
  ["home-child-voice-intelligence", "relationships"],
  ["home-family-engagement-intelligence", "relationships"],
  ["home-social-worker-contact-intelligence", "relationships"],
  ["home-sibling-contact-protocol-intelligence", "relationships"],
  ["home-key-working-intelligence", "relationships"],
  ["home-cultural-identity-intelligence", "relationships"],
  // Workforce
  ["home-workforce-planning-intelligence", "workforce"],
  ["home-staff-development-intelligence", "workforce"],
  ["home-staff-wellbeing-intelligence", "workforce"],
  ["home-supervision-intelligence", "workforce"],
  ["home-safer-recruitment-intelligence", "workforce"],
  ["home-staff-recognition-morale-intelligence", "workforce"],
  // Leadership & Compliance
  ["home-regulatory-compliance-intelligence", "leadership"],
  ["home-quality-assurance-intelligence", "leadership"],
  ["home-reg44-intelligence", "leadership"],
  ["home-recording-quality-intelligence", "leadership"],
  ["home-lac-review-intelligence", "leadership"],
  ["home-management-walkround-oversight-intelligence", "leadership"],
];

function labelFor(route: string): string {
  return route
    .replace(/^home-/, "")
    .replace(/-intelligence$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extract(d: any, route: string, section: string): ReportSignalInput | null {
  if (!d || typeof d !== "object") return null;
  const ratingKey = Object.keys(d).find((k) => k.endsWith("_rating") || k === "rating");
  const scoreKey = Object.keys(d).find((k) => k.endsWith("_score") || k === "score");
  const rating = ratingKey && d[ratingKey] != null ? String(d[ratingKey]) : null;
  const score = scoreKey && typeof d[scoreKey] === "number" ? d[scoreKey] : null;
  const headline = typeof d.headline === "string" ? d.headline : null;
  const concerns = Array.isArray(d.concerns) ? d.concerns.filter((c: any) => typeof c === "string" && c.trim()) : [];
  const strengths = Array.isArray(d.strengths) ? d.strengths.filter((c: any) => typeof c === "string" && c.trim()) : [];
  return { engine_key: route, label: labelFor(route), section, rating, score, headline, concerns, strengths };
}

async function fetchSignal(baseUrl: string, route: string, section: string): Promise<ReportSignalInput | null> {
  try {
    const res = await fetch(`${baseUrl}/api/v1/${route}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return extract(json?.data, route, section);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const today = new Date().toISOString().slice(0, 10);

    const store = getStore();
    const youngPeople = (store.youngPeople ?? []) as any[];
    const total_children = youngPeople.filter((c) => c.status === "current").length || youngPeople.length;
    const total_staff = ((store.staff ?? []) as any[]).length;
    const home_name = (store.home as any)?.name ?? "Oak House";

    const results = await Promise.allSettled(SECTION_ENGINES.map(([route, section]) => fetchSignal(baseUrl, route, section)));
    const signals = results
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter((v): v is ReportSignalInput => v !== null);

    const result = computeHomeSummaryReport({
      period_label: `Current standing as at ${today}`,
      home_name,
      total_children,
      total_staff,
      signals,
      engines_queried: SECTION_ENGINES.length,
      engines_responded: signals.length,
      today,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    console.error("[api] server error:", err); return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
