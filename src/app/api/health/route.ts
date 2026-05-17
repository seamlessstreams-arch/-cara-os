// ══════════════════════════════════════════════════════════════════════════════
// API: /api/health — Health & Wellbeing Tracking
//
// Returns health compliance, assessment tracking, medication management,
// and appointment scheduling. Powers the health dashboard and LAC health
// monitoring screens.
//
// CHR 2015 Reg 10 — The health and wellbeing standard.
// Promoting Health of Looked After Children (DfE/DoH 2015).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  evaluateHealthCompliance,
  calculateHomeHealthMetrics,
} from "@/lib/health";
import type { ChildHealthRecord } from "@/lib/health";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const homeId = url.searchParams.get("homeId") ?? "home-oak";
    const childId = url.searchParams.get("childId");
    const view = url.searchParams.get("view") ?? "overview";

    const sb = createServerClient();

    if (sb && isSupabaseEnabled()) {
      return await handleLiveData(sb, homeId, childId, view);
    }

    return NextResponse.json(getDemoData(homeId, childId, view));
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

async function handleLiveData(sb: any, homeId: string, childId: string | null, view: string) {
  let query = (sb.from("health_records") as SB)
    .select("*, health_assessments(*), medications(*), appointments(*)")
    .eq("home_id", homeId);

  if (childId) query = query.eq("child_id", childId);

  const { data: rows, error } = await query;
  if (error) throw error;

  const records: ChildHealthRecord[] = (rows ?? []).map(mapToRecord);

  switch (view) {
    case "overview":
      return NextResponse.json(calculateHomeHealthMetrics(records, homeId));
    case "compliance":
      return NextResponse.json({ results: records.map(r => evaluateHealthCompliance(r)) });
    case "child":
      if (!childId || records.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ record: records[0], compliance: evaluateHealthCompliance(records[0]) });
    default:
      return NextResponse.json({ error: `Unknown view: ${view}` }, { status: 400 });
  }
}

function mapToRecord(row: any): ChildHealthRecord {
  return {
    childId: row.child_id,
    childName: row.child_name,
    homeId: row.home_id,
    dateOfBirth: row.date_of_birth,
    gpName: row.gp_name ?? "",
    gpSurgery: row.gp_surgery ?? "",
    dentist: row.dentist ?? "",
    optician: row.optician ?? "",
    healthAssessments: (row.health_assessments ?? []).map((a: any) => ({
      type: a.type, date: a.date, assessedBy: a.assessed_by ?? "",
      outcome: a.outcome ?? "", actionPlan: a.action_plan ?? [], nextDueDate: a.next_due_date ?? "",
    })),
    lacEntryDate: row.lac_entry_date ?? "",
    medications: (row.medications ?? []).map((m: any) => ({
      id: m.id, name: m.name ?? "", type: m.type ?? "regular",
      dose: m.dose ?? "", frequency: m.frequency ?? "",
      prescribedBy: m.prescribed_by ?? "", startDate: m.start_date ?? "",
      endDate: m.end_date, active: m.active ?? false,
      sideEffectsMonitored: m.side_effects_monitored ?? false,
      consentObtained: m.consent_obtained ?? false,
      lastReviewDate: m.last_review_date, nextReviewDate: m.next_review_date,
    })),
    appointments: (row.appointments ?? []).map((a: any) => ({
      id: a.id, type: a.type ?? "", date: a.date ?? "",
      provider: a.provider ?? "", status: a.status ?? "scheduled",
      notes: a.notes, followUpRequired: a.follow_up_required ?? false,
      followUpDate: a.follow_up_date,
    })),
    immunisationsUpToDate: row.immunisations_up_to_date ?? false,
    immunisationNotes: row.immunisation_notes,
    lastSDQDate: row.last_sdq_date,
    lastSDQScore: row.last_sdq_score,
    sdqBand: row.sdq_band,
    knownConditions: row.known_conditions ?? [],
    allergies: row.allergies ?? [],
    dietaryRequirements: row.dietary_requirements ?? [],
  };
}

// ── Demo Data ─────────────────────────────────────────────────────────────

function getDemoData(homeId: string, childId: string | null, view: string) {
  const allRecords = getDemoRecords(homeId);
  const records = childId ? allRecords.filter(r => r.childId === childId) : allRecords;

  switch (view) {
    case "overview":
      return calculateHomeHealthMetrics(allRecords, homeId);
    case "compliance":
      return { results: records.map(r => evaluateHealthCompliance(r)) };
    case "child":
      if (records.length === 0) return { error: "Not found" };
      return { record: records[0], compliance: evaluateHealthCompliance(records[0]) };
    default:
      return { error: `Unknown view: ${view}` };
  }
}

function getDemoRecords(homeId: string): ChildHealthRecord[] {
  return [
    {
      childId: "child-jordan",
      childName: "Jordan Williams",
      homeId,
      dateOfBirth: "2010-06-15T00:00:00Z",
      gpName: "Dr Smith",
      gpSurgery: "Oakfield Medical Centre",
      dentist: "Mr Patel (Smile Dental)",
      optician: "Specsavers High Street",
      healthAssessments: [
        { type: "iha", date: "2024-09-20", assessedBy: "LAC Nurse Jones", outcome: "Satisfactory. ADHD managed.", actionPlan: ["Continue medication review"], nextDueDate: "2025-09-20" },
        { type: "rha", date: "2025-10-01", assessedBy: "LAC Nurse Jones", outcome: "Good progress. Weight healthy.", actionPlan: [], nextDueDate: "2026-10-01" },
        { type: "dental", date: "2026-02-15", assessedBy: "Mr Patel", outcome: "No concerns. Good hygiene.", actionPlan: [], nextDueDate: "2026-08-15" },
        { type: "optical", date: "2025-11-01", assessedBy: "Specsavers", outcome: "Vision normal. No correction needed.", actionPlan: [], nextDueDate: "2026-11-01" },
      ],
      lacEntryDate: "2024-09-01T00:00:00Z",
      medications: [
        { id: "m1", name: "Melatonin", type: "regular", dose: "2mg", frequency: "Once nightly", prescribedBy: "Dr Smith", startDate: "2025-01-01", active: true, sideEffectsMonitored: true, consentObtained: true, lastReviewDate: "2026-04-01", nextReviewDate: "2026-07-01" },
      ],
      appointments: [
        { id: "a1", type: "GP", date: "2026-05-10T10:00:00Z", provider: "Dr Smith", status: "attended", followUpRequired: false },
        { id: "a2", type: "CAMHS", date: "2026-04-20T14:00:00Z", provider: "Dr Hartley", status: "attended", followUpRequired: true, followUpDate: "2026-07-20" },
        { id: "a3", type: "Dentist", date: "2026-08-15T09:00:00Z", provider: "Mr Patel", status: "scheduled", followUpRequired: false },
      ],
      immunisationsUpToDate: true,
      lastSDQDate: "2026-01-15T00:00:00Z",
      lastSDQScore: 12,
      sdqBand: "normal",
      knownConditions: ["ADHD"],
      allergies: ["Penicillin"],
      dietaryRequirements: [],
    },
    {
      childId: "child-alex",
      childName: "Alex Reeves",
      homeId,
      dateOfBirth: "2009-11-20T00:00:00Z",
      gpName: "Dr Ahmed",
      gpSurgery: "Riverside Surgery",
      dentist: "NHS Dental Clinic",
      optician: "Vision Express",
      healthAssessments: [
        { type: "iha", date: "2025-07-01", assessedBy: "LAC Nurse Williams", outcome: "Concerns re substance use. Referral made.", actionPlan: ["Substance misuse referral", "Sexual health discussion"], nextDueDate: "2026-07-01" },
        { type: "rha", date: "2026-03-01", assessedBy: "LAC Nurse Williams", outcome: "Ongoing concerns. Engagement variable.", actionPlan: ["Continue monitoring"], nextDueDate: "2027-03-01" },
        { type: "dental", date: "2025-08-01", assessedBy: "NHS Dental", outcome: "2 fillings needed", actionPlan: ["Return for fillings"], nextDueDate: "2026-02-01" },
      ],
      lacEntryDate: "2025-06-15T00:00:00Z",
      medications: [],
      appointments: [
        { id: "a4", type: "GP", date: "2026-03-15T10:00:00Z", provider: "Dr Ahmed", status: "dna", followUpRequired: true },
        { id: "a5", type: "CAMHS", date: "2026-04-10T14:00:00Z", provider: "Exploitation Team", status: "attended", followUpRequired: true, followUpDate: "2026-05-20" },
        { id: "a6", type: "Substance Misuse", date: "2026-05-01T11:00:00Z", provider: "Turning Point", status: "dna", followUpRequired: true },
      ],
      immunisationsUpToDate: false,
      immunisationNotes: "Missing HPV and MenACWY boosters",
      lastSDQDate: "2025-09-01T00:00:00Z",
      lastSDQScore: 19,
      sdqBand: "abnormal",
      knownConditions: [],
      allergies: [],
      dietaryRequirements: [],
    },
    {
      childId: "child-mia",
      childName: "Mia Chen",
      homeId,
      dateOfBirth: "2012-02-28T00:00:00Z",
      gpName: "Dr Patel",
      gpSurgery: "Meadow Lane Surgery",
      dentist: "Bright Smile Dental",
      optician: "Boots Opticians",
      healthAssessments: [
        { type: "iha", date: "2026-05-10", assessedBy: "LAC Nurse Jones", outcome: "Healthy. Previous trauma noted.", actionPlan: ["Therapeutic referral"], nextDueDate: "2027-05-10" },
        { type: "dental", date: "2026-04-20", assessedBy: "Bright Smile", outcome: "All clear", actionPlan: [], nextDueDate: "2026-10-20" },
        { type: "optical", date: "2026-03-15", assessedBy: "Boots", outcome: "Mild short-sightedness. Glasses prescribed.", actionPlan: ["Wear glasses for board"], nextDueDate: "2027-03-15" },
      ],
      lacEntryDate: "2026-05-01T00:00:00Z",
      medications: [
        { id: "m2", name: "Sertraline", type: "regular", dose: "50mg", frequency: "Once daily morning", prescribedBy: "Dr Hartley (CAMHS)", startDate: "2026-03-01", active: true, sideEffectsMonitored: true, consentObtained: true, lastReviewDate: "2026-05-01", nextReviewDate: "2026-08-01" },
      ],
      appointments: [
        { id: "a7", type: "CAMHS", date: "2026-05-20T14:00:00Z", provider: "Dr Hartley", status: "scheduled", followUpRequired: false },
        { id: "a8", type: "GP", date: "2026-05-25T09:00:00Z", provider: "Dr Patel", status: "scheduled", followUpRequired: false },
      ],
      immunisationsUpToDate: true,
      lastSDQDate: "2026-05-05T00:00:00Z",
      lastSDQScore: 15,
      sdqBand: "borderline",
      knownConditions: ["Anxiety"],
      allergies: [],
      dietaryRequirements: ["Vegetarian"],
    },
  ];
}
