// ══════════════════════════════════════════════════════════════════════════════
// API: /api/allegations
//
// Allegations Against Staff Intelligence
//
// GET  — Returns allegations assessment with realistic Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateAllegationsIntelligence,
  getAllegationCategoryLabel,
  getAllegationOutcomeLabel,
  getStaffActionLabel,
  getSourceLabel,
} from "@/lib/allegations";
import type { Allegation, StaffMember } from "@/lib/allegations";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

const DEMO_STAFF: StaffMember[] = [
  { id: "staff-sarah", name: "Sarah Johnson", role: "Senior RCW", startDate: "2024-03-01", dbsNumber: "DBS-SJ-2024", currentlyEmployed: true },
  { id: "staff-tom", name: "Tom Richards", role: "RCW", startDate: "2025-01-15", dbsNumber: "DBS-TR-2025", currentlyEmployed: true },
  { id: "staff-lisa", name: "Lisa Williams", role: "RCW", startDate: "2024-08-01", dbsNumber: "DBS-LW-2024", currentlyEmployed: true },
  { id: "staff-agency-01", name: "James Cooper", role: "Agency RCW", startDate: "2026-02-01", currentlyEmployed: false },
];

const DEMO_ALLEGATIONS: Allegation[] = [
  // Allegation 1: Inappropriate restraint by agency worker — well managed
  {
    id: "alleg-001",
    staffId: "staff-agency-01",
    category: "inappropriate_restraint",
    source: "child",
    dateReported: "2026-02-15",
    dateOfIncident: "2026-02-14",
    summary: "Alex alleged that agency worker James used unnecessary force during a restraint incident following attempted absconding. Alex said James grabbed his arm too hard, leaving a red mark.",
    childrenInvolved: ["child-alex"],
    investigationStatus: "resolved",
    ladoReferralDate: "2026-02-15",
    ladoReferralTimely: true,
    policeInvolved: false,
    ofstedNotified: true,
    ofstedNotifiedDate: "2026-02-16",
    ofstedNotifiedTimely: true,
    placingAuthorityNotified: true,
    riNotified: true,
    outcome: "unsubstantiated",
    outcomeDate: "2026-03-20",
    staffAction: "training_required",
    dbsReferralMade: false,
    lessonsLearned: "Agency induction procedure updated to include mandatory TCI refresher before commencing first shift. Body map completed at point of allegation.",
    policyReviewRequired: false,
    supportOfferedToChild: true,
    supportOfferedToStaff: true,
  },
  // Allegation 2: Professional boundary concern — staff whistleblowing
  {
    id: "alleg-002",
    staffId: "staff-tom",
    category: "professional_boundary",
    source: "staff_member",
    dateReported: "2026-04-08",
    summary: "Sarah Johnson (Senior RCW) reported concern that Tom had given his personal mobile number to Morgan, and had been exchanging messages outside of work protocols. Tom stated it was to provide Morgan with support during a crisis.",
    childrenInvolved: ["child-morgan"],
    investigationStatus: "resolved",
    policeInvolved: false,
    ofstedNotified: false,
    placingAuthorityNotified: true,
    riNotified: true,
    outcome: "substantiated",
    outcomeDate: "2026-04-25",
    staffAction: "written_warning",
    lessonsLearned: "Personal device policy refreshed with all staff. Staff reminded that support must be channelled through home communications only. Tom attended professional boundaries training.",
    policyReviewRequired: true,
    supportOfferedToChild: true,
    supportOfferedToStaff: true,
  },
  // Allegation 3: Emotional abuse concern — placing authority raised
  {
    id: "alleg-003",
    staffId: "staff-tom",
    category: "emotional_abuse",
    source: "placing_authority",
    dateReported: "2026-05-05",
    dateOfIncident: "2026-05-03",
    summary: "Jordan's social worker raised concern after a LAC review that Jordan described feeling 'picked on' by Tom, saying he shouts and makes her feel stupid. Jordan's mood has declined over recent weeks.",
    childrenInvolved: ["child-jordan"],
    investigationStatus: "lado_referral_made",
    ladoReferralDate: "2026-05-05",
    ladoReferralTimely: true,
    policeInvolved: false,
    ofstedNotified: true,
    ofstedNotifiedDate: "2026-05-06",
    ofstedNotifiedTimely: true,
    placingAuthorityNotified: true,
    riNotified: true,
    outcome: "ongoing",
    staffAction: "restricted_duties",
    supportOfferedToChild: true,
    supportOfferedToStaff: true,
    policyReviewRequired: false,
  },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateAllegationsIntelligence(
    DEMO_ALLEGATIONS,
    DEMO_STAFF,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  // Enrich with labels for UI
  const enrichedPatterns = {
    ...result.patterns,
    categoryLabels: result.patterns.categoryBreakdown.map((c) => ({
      ...c,
      label: getAllegationCategoryLabel(c.category),
    })),
    sourceLabels: result.patterns.sourceBreakdown.map((s) => ({
      ...s,
      label: getSourceLabel(s.source),
    })),
    outcomeLabels: result.patterns.outcomeBreakdown.map((o) => ({
      ...o,
      label: getAllegationOutcomeLabel(o.outcome),
    })),
  };

  const enrichedProfiles = result.staffProfiles.map((p) => ({
    ...p,
    categoryLabels: p.categories.map(getAllegationCategoryLabel),
    outcomeLabels: p.outcomes.map(getAllegationOutcomeLabel),
    actionLabel: getStaffActionLabel(p.currentAction),
  }));

  return NextResponse.json({
    data: {
      ...result,
      patterns: enrichedPatterns,
      staffProfiles: enrichedProfiles,
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { allegations, staff, homeId, periodStart, periodEnd } = body as {
    allegations?: Allegation[];
    staff?: StaffMember[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!allegations || !Array.isArray(allegations)) {
    return NextResponse.json({ error: "allegations array is required" }, { status: 400 });
  }
  if (!staff || !Array.isArray(staff)) {
    return NextResponse.json({ error: "staff array is required" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateAllegationsIntelligence(
    allegations, staff, homeId ?? "unknown", periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
