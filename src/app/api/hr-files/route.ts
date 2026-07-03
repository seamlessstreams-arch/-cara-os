// ══════════════════════════════════════════════════════════════════════════════
// Cara -- HR Files & Workforce Compliance API Route
//
// GET  -> returns Chamberlain House demo workforce data
// POST -> accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextResponse } from "next/server";
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
      startDate: "2020-03-01",
      contractHours: 37.5,
      isAgency: false,
      qualificationLevel: 5,
      qualificationTarget: 5,
      training: [
        { category: "induction", status: "completed", completedAt: "2020-03-15" },
        { category: "safeguarding_basic", status: "completed", completedAt: "2025-01-10", expiresAt: "2026-01-10", provider: "Local Authority", certificateRef: "SG-2025-001" },
        { category: "safeguarding_advanced", status: "completed", completedAt: "2025-02-10", expiresAt: "2027-02-10", provider: "Local Authority", certificateRef: "SGA-2025-001" },
        { category: "first_aid", status: "completed", completedAt: "2024-06-15", expiresAt: "2027-06-15", provider: "St John Ambulance", certificateRef: "FA-2024-012" },
        { category: "medication", status: "completed", completedAt: "2025-01-20", expiresAt: "2026-01-20", provider: "In-house" },
        { category: "fire_safety", status: "completed", completedAt: "2025-01-15", expiresAt: "2026-01-15", provider: "In-house" },
        { category: "data_protection", status: "completed", completedAt: "2025-01-25", expiresAt: "2026-01-25", provider: "E-learning" },
        { category: "equality_diversity", status: "completed", completedAt: "2025-03-10", provider: "External" },
        { category: "health_safety", status: "completed", completedAt: "2025-02-01", provider: "E-learning" },
        { category: "prevent", status: "completed", completedAt: "2024-06-01", expiresAt: "2027-06-01", provider: "Local Authority" },
        { category: "online_safety", status: "completed", completedAt: "2025-03-20", expiresAt: "2026-03-20", provider: "E-learning" },
        { category: "restraint", status: "completed", completedAt: "2025-03-20", expiresAt: "2026-03-20", provider: "PRICE Training" },
        { category: "attachment_trauma", status: "completed", completedAt: "2025-04-05", provider: "External" },
        { category: "cse_cce", status: "completed", completedAt: "2025-03-15", provider: "Local Authority" },
        { category: "mental_health", status: "completed", completedAt: "2025-04-20", provider: "External" },
        { category: "record_keeping", status: "completed", completedAt: "2025-02-15", provider: "In-house" },
      ],
      supervisions: [
        { id: "sv-s01", type: "formal", date: "2025-06-02", supervisorId: "staff-darren", supervisorName: "Darren Laville", durationMinutes: 60, topics: ["performance review", "reg 44 preparation"], actionPoints: 2, actionPointsCompleted: 1, signedOff: true },
        { id: "sv-s02", type: "formal", date: "2025-05-05", supervisorId: "staff-darren", supervisorName: "Darren Laville", durationMinutes: 60, topics: ["staff development", "Ofsted readiness"], actionPoints: 3, actionPointsCompleted: 3, signedOff: true },
        { id: "sv-s03", type: "formal", date: "2025-04-07", supervisorId: "staff-darren", supervisorName: "Darren Laville", durationMinutes: 55, topics: ["budget review", "placement stability"], actionPoints: 2, actionPointsCompleted: 2, signedOff: true },
      ],
      absences: [
        { type: "annual_leave", startDate: "2025-04-14", endDate: "2025-04-18", daysLost: 5 },
      ],
    },

    // ── Tom Richards — RSW, missing some training ────────────────────────
    {
      id: "staff-tom",
      name: "Tom Richards",
      role: "rsw",
      homeId: "oak-house",
      startDate: "2022-01-15",
      contractHours: 37.5,
      isAgency: false,
      qualificationLevel: 3,
      qualificationTarget: 3,
      training: [
        { category: "induction", status: "completed", completedAt: "2022-01-29" },
        { category: "safeguarding_basic", status: "completed", completedAt: "2025-02-15", expiresAt: "2026-02-15", provider: "Local Authority" },
        { category: "first_aid", status: "completed", completedAt: "2023-09-10", expiresAt: "2026-09-10", provider: "Red Cross" },
        { category: "fire_safety", status: "completed", completedAt: "2025-01-16", expiresAt: "2026-01-16", provider: "In-house" },
        { category: "medication", status: "completed", completedAt: "2025-01-20", expiresAt: "2026-01-20", provider: "In-house" },
        { category: "data_protection", status: "completed", completedAt: "2025-01-28", expiresAt: "2026-01-28", provider: "E-learning" },
        { category: "health_safety", status: "completed", completedAt: "2025-02-05", provider: "E-learning" },
        { category: "prevent", status: "completed", completedAt: "2024-05-10", expiresAt: "2027-05-10", provider: "Local Authority" },
        { category: "restraint", status: "completed", completedAt: "2025-03-22", expiresAt: "2026-03-22", provider: "PRICE Training" },
        { category: "attachment_trauma", status: "completed", completedAt: "2025-04-10", provider: "External" },
        { category: "cse_cce", status: "completed", completedAt: "2025-05-20", provider: "E-learning" },
        { category: "record_keeping", status: "completed", completedAt: "2025-02-10", provider: "In-house" },
        // MISSING: equality_diversity, online_safety, mental_health
      ],
      supervisions: [
        { id: "sv-t01", type: "formal", date: "2025-06-01", supervisorId: "staff-sarah", supervisorName: "Sarah Johnson", durationMinutes: 45, topics: ["key-working progress", "training plan"], actionPoints: 3, actionPointsCompleted: 1, signedOff: true },
        { id: "sv-t02", type: "formal", date: "2025-05-04", supervisorId: "staff-sarah", supervisorName: "Sarah Johnson", durationMinutes: 45, topics: ["incident debrief", "wellbeing"], actionPoints: 2, actionPointsCompleted: 2, signedOff: true },
        { id: "sv-t03", type: "observation", date: "2025-04-22", supervisorId: "staff-lisa", supervisorName: "Lisa Williams", durationMinutes: 30, topics: ["medication round observed"], actionPoints: 1, actionPointsCompleted: 1, signedOff: true },
      ],
      absences: [
        { type: "sickness", startDate: "2025-03-10", endDate: "2025-03-12", daysLost: 3, returnToWorkCompleted: true, reason: "Flu" },
        { type: "annual_leave", startDate: "2025-05-19", endDate: "2025-05-23", daysLost: 5 },
      ],
    },

    // ── Lisa Williams — Senior RSW, fully compliant ──────────────────────
    {
      id: "staff-lisa",
      name: "Lisa Williams",
      role: "senior_rsw",
      homeId: "oak-house",
      startDate: "2021-06-01",
      contractHours: 37.5,
      isAgency: false,
      qualificationLevel: 3,
      qualificationTarget: 3,
      training: [
        { category: "induction", status: "completed", completedAt: "2021-06-15" },
        { category: "safeguarding_basic", status: "completed", completedAt: "2025-02-12", expiresAt: "2026-02-12", provider: "Local Authority" },
        { category: "safeguarding_advanced", status: "completed", completedAt: "2025-02-12", expiresAt: "2027-02-12", provider: "Local Authority" },
        { category: "first_aid", status: "completed", completedAt: "2024-08-20", expiresAt: "2027-08-20", provider: "St John Ambulance" },
        { category: "medication", status: "completed", completedAt: "2025-01-22", expiresAt: "2026-01-22", provider: "In-house" },
        { category: "fire_safety", status: "completed", completedAt: "2025-01-18", expiresAt: "2026-01-18", provider: "In-house" },
        { category: "data_protection", status: "completed", completedAt: "2025-01-30", expiresAt: "2026-01-30", provider: "E-learning" },
        { category: "equality_diversity", status: "completed", completedAt: "2025-03-12", provider: "External" },
        { category: "health_safety", status: "completed", completedAt: "2025-02-08", provider: "E-learning" },
        { category: "prevent", status: "completed", completedAt: "2024-07-01", expiresAt: "2027-07-01", provider: "Local Authority" },
        { category: "online_safety", status: "completed", completedAt: "2025-03-25", expiresAt: "2026-03-25", provider: "E-learning" },
        { category: "restraint", status: "completed", completedAt: "2025-03-25", expiresAt: "2026-03-25", provider: "PRICE Training" },
        { category: "attachment_trauma", status: "completed", completedAt: "2025-04-08", provider: "External" },
        { category: "cse_cce", status: "completed", completedAt: "2025-03-18", provider: "Local Authority" },
        { category: "mental_health", status: "completed", completedAt: "2025-04-20", provider: "MHFA England" },
        { category: "record_keeping", status: "completed", completedAt: "2025-02-12", provider: "In-house" },
      ],
      supervisions: [
        { id: "sv-l01", type: "formal", date: "2025-06-03", supervisorId: "staff-sarah", supervisorName: "Sarah Johnson", durationMinutes: 50, topics: ["senior duties", "shift leading"], actionPoints: 2, actionPointsCompleted: 1, signedOff: true },
        { id: "sv-l02", type: "formal", date: "2025-05-06", supervisorId: "staff-sarah", supervisorName: "Sarah Johnson", durationMinutes: 50, topics: ["qualification progress", "team dynamics"], actionPoints: 2, actionPointsCompleted: 2, signedOff: true },
        { id: "sv-l03", type: "reflective", date: "2025-04-14", supervisorId: "staff-sarah", supervisorName: "Sarah Johnson", durationMinutes: 40, topics: ["restraint incident reflection"], actionPoints: 1, actionPointsCompleted: 1, signedOff: true },
      ],
      absences: [],
    },

    // ── Darren Laville — Registered Manager, fully compliant ─────────────
    {
      id: "staff-darren",
      name: "Darren Laville",
      role: "registered_manager",
      homeId: "oak-house",
      startDate: "2018-01-10",
      contractHours: 37.5,
      isAgency: false,
      qualificationLevel: 5,
      qualificationTarget: 5,
      training: [
        { category: "induction", status: "completed", completedAt: "2018-01-24" },
        { category: "safeguarding_basic", status: "completed", completedAt: "2025-01-08", expiresAt: "2026-01-08", provider: "Local Authority" },
        { category: "safeguarding_advanced", status: "completed", completedAt: "2025-01-08", expiresAt: "2027-01-08", provider: "Local Authority", certificateRef: "DSL-2025-001" },
        { category: "first_aid", status: "completed", completedAt: "2023-11-15", expiresAt: "2026-11-15", provider: "Red Cross" },
        { category: "medication", status: "completed", completedAt: "2025-01-18", expiresAt: "2026-01-18", provider: "In-house" },
        { category: "fire_safety", status: "completed", completedAt: "2025-01-10", expiresAt: "2026-01-10", provider: "In-house" },
        { category: "data_protection", status: "completed", completedAt: "2025-01-22", expiresAt: "2026-01-22", provider: "E-learning" },
        { category: "equality_diversity", status: "completed", completedAt: "2025-03-08", provider: "External" },
        { category: "health_safety", status: "completed", completedAt: "2025-02-03", provider: "E-learning" },
        { category: "prevent", status: "completed", completedAt: "2024-04-15", expiresAt: "2027-04-15", provider: "Local Authority" },
        { category: "online_safety", status: "completed", completedAt: "2025-03-18", expiresAt: "2026-03-18", provider: "E-learning" },
        { category: "restraint", status: "completed", completedAt: "2025-03-18", expiresAt: "2026-03-18", provider: "PRICE Training" },
        { category: "attachment_trauma", status: "completed", completedAt: "2025-04-02", provider: "External" },
        { category: "cse_cce", status: "completed", completedAt: "2025-03-20", provider: "Local Authority" },
        { category: "mental_health", status: "completed", completedAt: "2025-04-15", provider: "External" },
        { category: "record_keeping", status: "completed", completedAt: "2025-02-08", provider: "In-house" },
      ],
      supervisions: [
        { id: "sv-d01", type: "formal", date: "2025-05-28", supervisorId: "ext-ri", supervisorName: "RI (External)", durationMinutes: 75, topics: ["home performance", "Ofsted preparation", "budget management"], actionPoints: 3, actionPointsCompleted: 2, signedOff: true },
        { id: "sv-d02", type: "formal", date: "2025-04-30", supervisorId: "ext-ri", supervisorName: "RI (External)", durationMinutes: 60, topics: ["staff recruitment", "regulation 44 outcomes"], actionPoints: 2, actionPointsCompleted: 2, signedOff: true },
        { id: "sv-d03", type: "formal", date: "2025-03-31", supervisorId: "ext-ri", supervisorName: "RI (External)", durationMinutes: 60, topics: ["quality of care review", "complaints log"], actionPoints: 2, actionPointsCompleted: 2, signedOff: true },
      ],
      absences: [
        { type: "annual_leave", startDate: "2025-02-17", endDate: "2025-02-21", daysLost: 5 },
      ],
    },

    // ── Agency Worker — limited training, part-time ──────────────────────
    {
      id: "staff-agency-01",
      name: "Agency Worker",
      role: "rsw",
      homeId: "oak-house",
      startDate: "2025-03-01",
      contractHours: 20,
      isAgency: true,
      training: [
        { category: "induction", status: "completed", completedAt: "2025-03-02" },
        { category: "safeguarding_basic", status: "completed", completedAt: "2025-02-01", expiresAt: "2026-02-01", provider: "Agency Provider" },
        { category: "first_aid", status: "completed", completedAt: "2024-11-10", expiresAt: "2027-11-10", provider: "Agency Provider" },
        { category: "fire_safety", status: "completed", completedAt: "2025-03-03", expiresAt: "2026-03-03", provider: "In-house" },
        { category: "health_safety", status: "completed", completedAt: "2025-01-15", provider: "Agency Provider" },
        { category: "data_protection", status: "completed", completedAt: "2025-01-15", expiresAt: "2026-01-15", provider: "Agency Provider" },
        { category: "prevent", status: "completed", completedAt: "2024-09-01", expiresAt: "2027-09-01", provider: "Agency Provider" },
        // MISSING: equality_diversity, online_safety, medication, restraint,
        //          attachment_trauma, cse_cce, mental_health, record_keeping
      ],
      supervisions: [
        { id: "sv-a01", type: "formal", date: "2025-05-15", supervisorId: "staff-sarah", supervisorName: "Sarah Johnson", durationMinutes: 30, topics: ["induction review", "house routines"], actionPoints: 2, actionPointsCompleted: 0, signedOff: true },
      ],
      absences: [],
      probation: {
        startDate: "2025-03-01",
        expectedEndDate: "2025-09-01",
        status: "in_progress",
        reviews: [
          { date: "2025-04-01", outcome: "Satisfactory progress — training plan set", reviewedBy: "Sarah Johnson" },
        ],
      },
    },
  ];
}

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  try {
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
