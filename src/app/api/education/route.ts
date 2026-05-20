// ══════════════════════════════════════════════════════════════════════════════
// API: /api/education — Education Intelligence
//
// GET — Returns Oak House demo intelligence data
//
// CHR 2015 Reg 8 — The education standard
// Virtual School Head statutory role (Children Act 2004)
// PEP requirements — termly review
// DfE: Promoting the education of looked-after children
// SEND Code of Practice 2015
// School Admissions Code — priority for LAC
// Children Act 1989 s22(3A) — duty to promote education
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateEducationIntelligence,
  getPlacementLabel,
  getAttainmentLabel,
} from "@/lib/education";
import type {
  EducationRecord,
  EducationPolicy,
  StaffEducationTraining,
} from "@/lib/education";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

const DEMO_RECORDS: EducationRecord[] = [
  // Alex — mainstream school, strong performance
  {
    id: "rec-001",
    childId: "child-alex",
    childName: "Alex",
    termDate: "2026-04-01",
    placement: "mainstream_school",
    attainment: "expected",
    pepReviewedThisTerm: true,
    attendanceAbove95: true,
    pupilPremiumAllocated: true,
    designatedTeacherEngaged: true,
    exclusionThisTerm: false,
    virtualSchoolInvolved: true,
  },
  {
    id: "rec-002",
    childId: "child-alex",
    childName: "Alex",
    termDate: "2026-01-15",
    placement: "mainstream_school",
    attainment: "expected",
    pepReviewedThisTerm: true,
    attendanceAbove95: true,
    pupilPremiumAllocated: true,
    designatedTeacherEngaged: true,
    exclusionThisTerm: false,
    virtualSchoolInvolved: true,
  },
  // Jordan — alternative provision, some concerns
  {
    id: "rec-003",
    childId: "child-jordan",
    childName: "Jordan",
    termDate: "2026-04-01",
    placement: "alternative_provision",
    attainment: "developing",
    pepReviewedThisTerm: true,
    attendanceAbove95: false,
    pupilPremiumAllocated: true,
    designatedTeacherEngaged: true,
    exclusionThisTerm: true,
    virtualSchoolInvolved: true,
  },
  {
    id: "rec-004",
    childId: "child-jordan",
    childName: "Jordan",
    termDate: "2026-01-15",
    placement: "alternative_provision",
    attainment: "below_expected",
    pepReviewedThisTerm: false,
    attendanceAbove95: false,
    pupilPremiumAllocated: true,
    designatedTeacherEngaged: false,
    exclusionThisTerm: true,
    virtualSchoolInvolved: false,
  },
  // Morgan — special school, good engagement
  {
    id: "rec-005",
    childId: "child-morgan",
    childName: "Morgan",
    termDate: "2026-04-01",
    placement: "special_school",
    attainment: "exceeding",
    pepReviewedThisTerm: true,
    attendanceAbove95: true,
    pupilPremiumAllocated: true,
    designatedTeacherEngaged: true,
    exclusionThisTerm: false,
    virtualSchoolInvolved: true,
  },
  {
    id: "rec-006",
    childId: "child-morgan",
    childName: "Morgan",
    termDate: "2026-01-15",
    placement: "special_school",
    attainment: "expected",
    pepReviewedThisTerm: true,
    attendanceAbove95: true,
    pupilPremiumAllocated: true,
    designatedTeacherEngaged: true,
    exclusionThisTerm: false,
    virtualSchoolInvolved: true,
  },
];

const DEMO_POLICY: EducationPolicy = {
  id: "pol-oak-001",
  educationStrategy: true,
  pepComplianceFramework: true,
  attendanceMonitoring: true,
  exclusionPrevention: true,
  pupilPremiumTracking: true,
  schoolLiaisonProtocol: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffEducationTraining[] = [
  {
    id: "tr-001",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    educationRegulations: true,
    pepProcess: true,
    attendanceSupport: true,
    senAwareness: true,
    virtualSchoolLiaison: true,
    educationAdvocacy: true,
  },
  {
    id: "tr-002",
    staffId: "staff-tom",
    staffName: "Tom Richards",
    educationRegulations: true,
    pepProcess: true,
    attendanceSupport: true,
    senAwareness: false,
    virtualSchoolLiaison: false,
    educationAdvocacy: false,
  },
  {
    id: "tr-003",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    educationRegulations: true,
    pepProcess: true,
    attendanceSupport: true,
    senAwareness: true,
    virtualSchoolLiaison: true,
    educationAdvocacy: true,
  },
  {
    id: "tr-004",
    staffId: "staff-darren",
    staffName: "Darren Laville",
    educationRegulations: true,
    pepProcess: true,
    attendanceSupport: true,
    senAwareness: true,
    virtualSchoolLiaison: true,
    educationAdvocacy: true,
  },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    const result = generateEducationIntelligence(
      DEMO_RECORDS,
      DEMO_POLICY,
      DEMO_TRAINING,
      "oak-house",
      "2026-01-01",
      "2026-05-20",
    );

    // Enrich child profiles with labels
    const enrichedProfiles = result.childProfiles.map((p) => ({
      ...p,
    }));

    // Enrich records summary with labels for UI
    const placementSummary = DEMO_RECORDS.reduce<Record<string, number>>((acc, r) => {
      const label = getPlacementLabel(r.placement);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    const attainmentSummary = DEMO_RECORDS.reduce<Record<string, number>>((acc, r) => {
      const label = getAttainmentLabel(r.attainment);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      data: {
        ...result,
        childProfiles: enrichedProfiles,
        meta: {
          placementSummary,
          attainmentSummary,
          totalRecords: DEMO_RECORDS.length,
          totalStaff: DEMO_TRAINING.length,
          demoMode: true,
        },
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
