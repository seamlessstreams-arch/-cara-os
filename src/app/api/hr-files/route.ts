// ══════════════════════════════════════════════════════════════════════════════
// Cara -- HR Files & Workforce Compliance API Route
//
// GET  -> in demo mode: returns Chamberlain House demo workforce data.
//         On a live tenant: returns an empty/no-data response (was leaking the
//         Chamberlain demo unconditionally until 2026-07-29).
// POST -> accepts custom data for any home; unaffected by the live gate.
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextResponse } from "next/server";
import { isLiveTenant } from "@/lib/db/live-mode";
import {
  calculateWorkforceMetrics,
  evaluateTrainingCompliance,
  evaluateSupervisionCompliance,
  identifyTrainingGaps,
  formatTrainingName,
} from "@/lib/hr-files/workforce-engine";
import type {
  StaffMember,
  TrainingRecord,
  SupervisionRecord,
  AbsenceRecord,
  WorkforceMetrics,
  TrainingComplianceResult,
  SupervisionComplianceResult,
  TrainingGap,
} from "@/lib/hr-files/workforce-engine";

import { seedDay } from "@/lib/seed-date";
// ── Chamberlain House Demo Data ──────────────────────────────────────────────────────

const NOW = "2025-06-15T12:00:00Z";

function getDemoStaff(): StaffMember[] {
  return [
    // ── Sarah Johnson — Registered Manager, fully compliant ──────────────
    {
      id: "staff-sarah",
      name: "Sarah Johnson",
      role: "registered_manager",
      homeId: "oak-house",
      startDate: seedDay(-2269),
      contractHours: 37.5,
      isAgency: false,
      qualificationLevel: 5,
      qualificationTarget: 5,
      training: [
        { category: "induction", status: "completed", completedAt: seedDay(-2255) },
        { category: "safeguarding_basic", status: "completed", completedAt: seedDay(-493), expiresAt: seedDay(-128), provider: "Local Authority", certificateRef: "SG-2025-001" },
        { category: "safeguarding_advanced", status: "completed", completedAt: seedDay(-462), expiresAt: seedDay(268), provider: "Local Authority", certificateRef: "SGA-2025-001" },
        { category: "first_aid", status: "completed", completedAt: seedDay(-702), expiresAt: seedDay(393), provider: "St John Ambulance", certificateRef: "FA-2024-012" },
        { category: "medication", status: "completed", completedAt: seedDay(-483), expiresAt: seedDay(-118), provider: "In-house" },
        { category: "fire_safety", status: "completed", completedAt: seedDay(-488), expiresAt: seedDay(-123), provider: "In-house" },
        { category: "data_protection", status: "completed", completedAt: seedDay(-478), expiresAt: seedDay(-113), provider: "E-learning" },
        { category: "equality_diversity", status: "completed", completedAt: seedDay(-434), provider: "External" },
        { category: "health_safety", status: "completed", completedAt: seedDay(-471), provider: "E-learning" },
        { category: "prevent", status: "completed", completedAt: seedDay(-716), expiresAt: seedDay(379), provider: "Local Authority" },
        { category: "online_safety", status: "completed", completedAt: seedDay(-424), expiresAt: seedDay(-59), provider: "E-learning" },
        { category: "restraint", status: "completed", completedAt: seedDay(-424), expiresAt: seedDay(-59), provider: "PRICE Training" },
        { category: "attachment_trauma", status: "completed", completedAt: seedDay(-408), provider: "External" },
        { category: "cse_cce", status: "completed", completedAt: seedDay(-429), provider: "Local Authority" },
        { category: "mental_health", status: "completed", completedAt: seedDay(-393), provider: "External" },
        { category: "record_keeping", status: "completed", completedAt: seedDay(-457), provider: "In-house" },
      ],
      supervisions: [
        { id: "sv-s01", type: "formal", date: seedDay(-350), supervisorId: "staff-darren", supervisorName: "Olivia Hayes", durationMinutes: 60, topics: ["performance review", "reg 44 preparation"], actionPoints: 2, actionPointsCompleted: 1, signedOff: true },
        { id: "sv-s02", type: "formal", date: seedDay(-378), supervisorId: "staff-darren", supervisorName: "Olivia Hayes", durationMinutes: 60, topics: ["staff development", "Ofsted readiness"], actionPoints: 3, actionPointsCompleted: 3, signedOff: true },
        { id: "sv-s03", type: "formal", date: seedDay(-406), supervisorId: "staff-darren", supervisorName: "Olivia Hayes", durationMinutes: 55, topics: ["budget review", "placement stability"], actionPoints: 2, actionPointsCompleted: 2, signedOff: true },
      ],
      absences: [
        { type: "annual_leave", startDate: seedDay(-399), endDate: seedDay(-395), daysLost: 5 },
      ],
    },

    // ── Tom Richards — RSW, missing some training ────────────────────────
    {
      id: "staff-tom",
      name: "Tom Richards",
      role: "rsw",
      homeId: "oak-house",
      startDate: seedDay(-1584),
      contractHours: 37.5,
      isAgency: false,
      qualificationLevel: 3,
      qualificationTarget: 3,
      training: [
        { category: "induction", status: "completed", completedAt: seedDay(-1570) },
        { category: "safeguarding_basic", status: "completed", completedAt: seedDay(-457), expiresAt: seedDay(-92), provider: "Local Authority" },
        { category: "first_aid", status: "completed", completedAt: seedDay(-981), expiresAt: seedDay(115), provider: "Red Cross" },
        { category: "fire_safety", status: "completed", completedAt: seedDay(-487), expiresAt: seedDay(-122), provider: "In-house" },
        { category: "medication", status: "completed", completedAt: seedDay(-483), expiresAt: seedDay(-118), provider: "In-house" },
        { category: "data_protection", status: "completed", completedAt: seedDay(-475), expiresAt: seedDay(-110), provider: "E-learning" },
        { category: "health_safety", status: "completed", completedAt: seedDay(-467), provider: "E-learning" },
        { category: "prevent", status: "completed", completedAt: seedDay(-738), expiresAt: seedDay(357), provider: "Local Authority" },
        { category: "restraint", status: "completed", completedAt: seedDay(-422), expiresAt: seedDay(-57), provider: "PRICE Training" },
        { category: "attachment_trauma", status: "completed", completedAt: seedDay(-403), provider: "External" },
        { category: "cse_cce", status: "completed", completedAt: seedDay(-363), provider: "E-learning" },
        { category: "record_keeping", status: "completed", completedAt: seedDay(-462), provider: "In-house" },
        // MISSING: equality_diversity, online_safety, mental_health
      ],
      supervisions: [
        { id: "sv-t01", type: "formal", date: seedDay(-351), supervisorId: "staff-sarah", supervisorName: "Sarah Johnson", durationMinutes: 45, topics: ["key-working progress", "training plan"], actionPoints: 3, actionPointsCompleted: 1, signedOff: true },
        { id: "sv-t02", type: "formal", date: seedDay(-379), supervisorId: "staff-sarah", supervisorName: "Sarah Johnson", durationMinutes: 45, topics: ["incident debrief", "wellbeing"], actionPoints: 2, actionPointsCompleted: 2, signedOff: true },
        { id: "sv-t03", type: "observation", date: seedDay(-391), supervisorId: "staff-lisa", supervisorName: "Lisa Williams", durationMinutes: 30, topics: ["medication round observed"], actionPoints: 1, actionPointsCompleted: 1, signedOff: true },
      ],
      absences: [
        { type: "sickness", startDate: seedDay(-434), endDate: seedDay(-432), daysLost: 3, returnToWorkCompleted: true, reason: "Flu" },
        { type: "annual_leave", startDate: seedDay(-364), endDate: seedDay(-360), daysLost: 5 },
      ],
    },

    // ── Lisa Williams — Senior RSW, fully compliant ──────────────────────
    {
      id: "staff-lisa",
      name: "Lisa Williams",
      role: "senior_rsw",
      homeId: "oak-house",
      startDate: seedDay(-1812),
      contractHours: 37.5,
      isAgency: false,
      qualificationLevel: 3,
      qualificationTarget: 3,
      training: [
        { category: "induction", status: "completed", completedAt: seedDay(-1798) },
        { category: "safeguarding_basic", status: "completed", completedAt: seedDay(-460), expiresAt: seedDay(-95), provider: "Local Authority" },
        { category: "safeguarding_advanced", status: "completed", completedAt: seedDay(-460), expiresAt: seedDay(270), provider: "Local Authority" },
        { category: "first_aid", status: "completed", completedAt: seedDay(-636), expiresAt: seedDay(459), provider: "St John Ambulance" },
        { category: "medication", status: "completed", completedAt: seedDay(-481), expiresAt: seedDay(-116), provider: "In-house" },
        { category: "fire_safety", status: "completed", completedAt: seedDay(-485), expiresAt: seedDay(-120), provider: "In-house" },
        { category: "data_protection", status: "completed", completedAt: seedDay(-473), expiresAt: seedDay(-108), provider: "E-learning" },
        { category: "equality_diversity", status: "completed", completedAt: seedDay(-432), provider: "External" },
        { category: "health_safety", status: "completed", completedAt: seedDay(-464), provider: "E-learning" },
        { category: "prevent", status: "completed", completedAt: seedDay(-686), expiresAt: seedDay(409), provider: "Local Authority" },
        { category: "online_safety", status: "completed", completedAt: seedDay(-419), expiresAt: seedDay(-54), provider: "E-learning" },
        { category: "restraint", status: "completed", completedAt: seedDay(-419), expiresAt: seedDay(-54), provider: "PRICE Training" },
        { category: "attachment_trauma", status: "completed", completedAt: seedDay(-405), provider: "External" },
        { category: "cse_cce", status: "completed", completedAt: seedDay(-426), provider: "Local Authority" },
        { category: "mental_health", status: "completed", completedAt: seedDay(-393), provider: "MHFA England" },
        { category: "record_keeping", status: "completed", completedAt: seedDay(-460), provider: "In-house" },
      ],
      supervisions: [
        { id: "sv-l01", type: "formal", date: seedDay(-349), supervisorId: "staff-sarah", supervisorName: "Sarah Johnson", durationMinutes: 50, topics: ["senior duties", "shift leading"], actionPoints: 2, actionPointsCompleted: 1, signedOff: true },
        { id: "sv-l02", type: "formal", date: seedDay(-377), supervisorId: "staff-sarah", supervisorName: "Sarah Johnson", durationMinutes: 50, topics: ["qualification progress", "team dynamics"], actionPoints: 2, actionPointsCompleted: 2, signedOff: true },
        { id: "sv-l03", type: "reflective", date: seedDay(-399), supervisorId: "staff-sarah", supervisorName: "Sarah Johnson", durationMinutes: 40, topics: ["restraint incident reflection"], actionPoints: 1, actionPointsCompleted: 1, signedOff: true },
      ],
      absences: [],
    },

    // ── Olivia Hayes — Registered Manager, fully compliant ─────────────
    {
      id: "staff-darren",
      name: "Olivia Hayes",
      role: "registered_manager",
      homeId: "oak-house",
      startDate: seedDay(-3050),
      contractHours: 37.5,
      isAgency: false,
      qualificationLevel: 5,
      qualificationTarget: 5,
      training: [
        { category: "induction", status: "completed", completedAt: seedDay(-3036) },
        { category: "safeguarding_basic", status: "completed", completedAt: seedDay(-495), expiresAt: seedDay(-130), provider: "Local Authority" },
        { category: "safeguarding_advanced", status: "completed", completedAt: seedDay(-495), expiresAt: seedDay(235), provider: "Local Authority", certificateRef: "DSL-2025-001" },
        { category: "first_aid", status: "completed", completedAt: seedDay(-915), expiresAt: seedDay(181), provider: "Red Cross" },
        { category: "medication", status: "completed", completedAt: seedDay(-485), expiresAt: seedDay(-120), provider: "In-house" },
        { category: "fire_safety", status: "completed", completedAt: seedDay(-493), expiresAt: seedDay(-128), provider: "In-house" },
        { category: "data_protection", status: "completed", completedAt: seedDay(-481), expiresAt: seedDay(-116), provider: "E-learning" },
        { category: "equality_diversity", status: "completed", completedAt: seedDay(-436), provider: "External" },
        { category: "health_safety", status: "completed", completedAt: seedDay(-469), provider: "E-learning" },
        { category: "prevent", status: "completed", completedAt: seedDay(-763), expiresAt: seedDay(332), provider: "Local Authority" },
        { category: "online_safety", status: "completed", completedAt: seedDay(-426), expiresAt: seedDay(-61), provider: "E-learning" },
        { category: "restraint", status: "completed", completedAt: seedDay(-426), expiresAt: seedDay(-61), provider: "PRICE Training" },
        { category: "attachment_trauma", status: "completed", completedAt: seedDay(-411), provider: "External" },
        { category: "cse_cce", status: "completed", completedAt: seedDay(-424), provider: "Local Authority" },
        { category: "mental_health", status: "completed", completedAt: seedDay(-398), provider: "External" },
        { category: "record_keeping", status: "completed", completedAt: seedDay(-464), provider: "In-house" },
      ],
      supervisions: [
        { id: "sv-d01", type: "formal", date: seedDay(-355), supervisorId: "ext-ri", supervisorName: "RI (External)", durationMinutes: 75, topics: ["home performance", "Ofsted preparation", "budget management"], actionPoints: 3, actionPointsCompleted: 2, signedOff: true },
        { id: "sv-d02", type: "formal", date: seedDay(-383), supervisorId: "ext-ri", supervisorName: "RI (External)", durationMinutes: 60, topics: ["staff recruitment", "regulation 44 outcomes"], actionPoints: 2, actionPointsCompleted: 2, signedOff: true },
        { id: "sv-d03", type: "formal", date: seedDay(-413), supervisorId: "ext-ri", supervisorName: "RI (External)", durationMinutes: 60, topics: ["quality of care review", "complaints log"], actionPoints: 2, actionPointsCompleted: 2, signedOff: true },
      ],
      absences: [
        { type: "annual_leave", startDate: seedDay(-455), endDate: seedDay(-451), daysLost: 5 },
      ],
    },

    // ── Agency Worker — limited training, part-time ──────────────────────
    {
      id: "staff-agency-01",
      name: "Agency Worker",
      role: "rsw",
      homeId: "oak-house",
      startDate: seedDay(-443),
      contractHours: 20,
      isAgency: true,
      training: [
        { category: "induction", status: "completed", completedAt: seedDay(-442) },
        { category: "safeguarding_basic", status: "completed", completedAt: seedDay(-471), expiresAt: seedDay(-106), provider: "Agency Provider" },
        { category: "first_aid", status: "completed", completedAt: seedDay(-554), expiresAt: seedDay(541), provider: "Agency Provider" },
        { category: "fire_safety", status: "completed", completedAt: seedDay(-441), expiresAt: seedDay(-76), provider: "In-house" },
        { category: "health_safety", status: "completed", completedAt: seedDay(-488), provider: "Agency Provider" },
        { category: "data_protection", status: "completed", completedAt: seedDay(-488), expiresAt: seedDay(-123), provider: "Agency Provider" },
        { category: "prevent", status: "completed", completedAt: seedDay(-624), expiresAt: seedDay(471), provider: "Agency Provider" },
        // MISSING: equality_diversity, online_safety, medication, restraint,
        //          attachment_trauma, cse_cce, mental_health, record_keeping
      ],
      supervisions: [
        { id: "sv-a01", type: "formal", date: seedDay(-368), supervisorId: "staff-sarah", supervisorName: "Sarah Johnson", durationMinutes: 30, topics: ["induction review", "house routines"], actionPoints: 2, actionPointsCompleted: 0, signedOff: true },
      ],
      absences: [],
      probation: {
        startDate: seedDay(-443),
        expectedEndDate: seedDay(-259),
        status: "in_progress",
        reviews: [
          { date: seedDay(-412), outcome: "Satisfactory progress — training plan set", reviewedBy: "Sarah Johnson" },
        ],
      },
    },
  ];
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
    // Live tenants have no workforce data source wired to this route yet —
    // return an empty, shape-preserving response instead of Chamberlain demo.
    // POST still accepts caller-supplied data if a caller has real inputs.
    if (isLiveTenant()) {
      return NextResponse.json({
        metrics: calculateWorkforceMetrics([], 0, 0, new Date().toISOString()),
        trainingCompliance: [],
        supervisionCompliance: [],
        trainingGaps: [],
        live_no_data: true,
      });
    }

    const staff = getDemoStaff();
    const establishedPosts = 6;
    const leaversInPeriod = 1;

    const metrics = calculateWorkforceMetrics(staff, establishedPosts, leaversInPeriod, NOW);
    const trainingCompliance = staff.map((s) => evaluateTrainingCompliance(s, NOW));
    const supervisionCompliance = staff.map((s) => evaluateSupervisionCompliance(s, NOW));
    const trainingGaps = identifyTrainingGaps(staff, NOW);

    return NextResponse.json({
      metrics,
      trainingCompliance,
      supervisionCompliance,
      trainingGaps,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate HR files intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { staff, establishedPosts, leaversInPeriod, now } = body;

    if (!staff || !Array.isArray(staff) || typeof establishedPosts !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: staff (array), establishedPosts (number)" },
        { status: 400 },
      );
    }

    const metrics = calculateWorkforceMetrics(
      staff,
      establishedPosts,
      leaversInPeriod ?? 0,
      now,
    );
    const trainingCompliance = staff.map((s: StaffMember) => evaluateTrainingCompliance(s, now));
    const supervisionCompliance = staff.map((s: StaffMember) => evaluateSupervisionCompliance(s, now));
    const trainingGaps = identifyTrainingGaps(staff, now);

    return NextResponse.json({
      metrics,
      trainingCompliance,
      supervisionCompliance,
      trainingGaps,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process HR files data", details: String(error) },
      { status: 500 },
    );
  }
}
