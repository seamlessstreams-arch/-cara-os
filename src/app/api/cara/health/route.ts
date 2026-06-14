// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/health — Health Intelligence (Physical)
//
// Analyses physical health: assessments, immunisations, registrations, meds.
// Pure deterministic — no AI. Returns structured assessment.
// CHR 2015 Reg 6(2)(b) alignment (Physical Health).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseHealth } from "@/lib/cara/health-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type {
  HealthInput,
  HealthAssessment,
  Immunisation,
  HealthAppointment,
  Medication,
} from "@/lib/cara/health-intelligence";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const childId = url.searchParams.get("childId");

    if (!childId) {
      return NextResponse.json(
        { error: "childId query parameter is required" },
        { status: 400 },
      );
    }

    const sb = createServerClient();
    let input: HealthInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchData(sb, childId);
    } else {
      input = buildDemoData(childId);
    }

    const assessment = analyseHealth(input);

    return NextResponse.json({ success: true, data: assessment });
  } catch (err) {
    console.error("[cara/health] Error:", err);
    return NextResponse.json(
      { error: "Health intelligence failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchData(sb: any, childId: string): Promise<HealthInput> {
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, date_of_birth")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const age = child?.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 15;

  // Health assessments
  const { data: rawAssessments } = await (sb.from("health_assessments") as SB)
    .select("*")
    .eq("child_id", childId)
    .order("date", { ascending: true });

  const healthAssessments: HealthAssessment[] = (rawAssessments ?? []).map((a: any) => ({
    date: a.date,
    type: a.type ?? "review",
    completedOnTime: a.completed_on_time ?? true,
    actionPlanCreated: a.action_plan_created ?? false,
  }));

  // Immunisations
  const { data: rawImmunisations } = await (sb.from("immunisations") as SB)
    .select("*")
    .eq("child_id", childId);

  const immunisations: Immunisation[] = (rawImmunisations ?? []).map((i: any) => ({
    name: i.name,
    due: i.due ?? false,
    overdue: i.overdue ?? false,
    dateGiven: i.date_given ?? undefined,
  }));

  // Appointments (last 6 months)
  const cutoff6m = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
  const { data: rawAppts } = await (sb.from("health_appointments") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff6m)
    .order("date", { ascending: true });

  const appointments: HealthAppointment[] = (rawAppts ?? []).map((a: any) => ({
    date: a.date,
    type: a.type ?? "gp",
    attended: a.attended ?? true,
    reason: a.reason ?? undefined,
  }));

  // Medications
  const { data: rawMeds } = await (sb.from("medications") as SB)
    .select("*")
    .eq("child_id", childId)
    .eq("active", true);

  const medications: Medication[] = (rawMeds ?? []).map((m: any) => ({
    name: m.name,
    prescribed: m.prescribed ?? true,
    administeredCorrectly: m.administered_correctly ?? true,
    consentInPlace: m.consent ?? false,
    reviewDue: m.review_due ?? false,
  }));

  // Health config
  const { data: config } = await (sb.from("health_config") as SB)
    .select("*")
    .eq("child_id", childId)
    .single();

  return {
    childId,
    childName,
    age,
    healthAssessments,
    lastAssessmentDate: config?.last_assessment_date ?? undefined,
    nextAssessmentDue: config?.next_assessment_due ?? undefined,
    assessmentOverdue: config?.assessment_overdue ?? (healthAssessments.length === 0),
    gpRegistered: config?.gp_registered ?? true,
    dentistRegistered: config?.dentist_registered ?? true,
    opticiansRegistered: config?.opticians_registered ?? true,
    dentalCheckLast6Months: config?.dental_check ?? true,
    opticalCheckLast12Months: config?.optical_check ?? true,
    lastDentalDate: config?.last_dental ?? undefined,
    lastOpticalDate: config?.last_optical ?? undefined,
    immunisations,
    immunisationsUpToDate: config?.immunisations_current ?? (immunisations.every(i => !i.overdue)),
    appointments,
    medications,
    healthActionPlanInPlace: config?.action_plan ?? true,
    healthActionPlanReviewed: config?.action_plan_reviewed ?? true,
    actionsTotal: config?.actions_total ?? 0,
    actionsCompleted: config?.actions_completed ?? 0,
    substanceMisuseIdentified: config?.substance_misuse ?? false,
    substanceMisuseSupport: config?.substance_support ?? false,
    healthyEatingSupported: config?.healthy_eating ?? true,
    physicalActivityRegular: config?.physical_activity ?? true,
    sleepRoutineGood: config?.sleep_good ?? true,
    staffHealthTrained: config?.staff_trained ?? true,
    childUnderstandsHealth: config?.child_understands ?? true,
    consentFormsComplete: config?.consent_forms ?? true,
    healthPassportUpToDate: config?.health_passport ?? true,
  };
}

// ── Demo Data ───────────────────────────────────────────────────────────────

function buildDemoData(childId: string): HealthInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";

  if (!isJordan) {
    // Sam — excellent health profile
    return {
      childId,
      childName: "Sam",
      age: 14,
      healthAssessments: [
        { date: "2025-09-15", type: "review", completedOnTime: true, actionPlanCreated: true },
        { date: "2026-04-10", type: "review", completedOnTime: true, actionPlanCreated: true },
      ],
      lastAssessmentDate: "2026-04-10",
      nextAssessmentDue: "2027-04-10",
      assessmentOverdue: false,
      gpRegistered: true,
      dentistRegistered: true,
      opticiansRegistered: true,
      dentalCheckLast6Months: true,
      opticalCheckLast12Months: true,
      lastDentalDate: "2026-03-01",
      lastOpticalDate: "2025-10-15",
      immunisations: [
        { name: "MMR", due: false, overdue: false, dateGiven: "2019-06-01" },
        { name: "Td/IPV", due: false, overdue: false, dateGiven: "2024-09-01" },
        { name: "MenACWY", due: false, overdue: false, dateGiven: "2024-09-01" },
        { name: "HPV", due: false, overdue: false, dateGiven: "2024-11-01" },
      ],
      immunisationsUpToDate: true,
      appointments: [
        { date: "2026-03-01", type: "dental", attended: true },
        { date: "2026-04-10", type: "gp", attended: true },
      ],
      medications: [],
      healthActionPlanInPlace: true,
      healthActionPlanReviewed: true,
      actionsTotal: 3,
      actionsCompleted: 3,
      substanceMisuseIdentified: false,
      substanceMisuseSupport: false,
      healthyEatingSupported: true,
      physicalActivityRegular: true,
      sleepRoutineGood: true,
      staffHealthTrained: true,
      childUnderstandsHealth: true,
      consentFormsComplete: true,
      healthPassportUpToDate: true,
    };
  }

  // Jordan — mostly good with some areas to monitor
  return {
    childId,
    childName: "Jordan",
    age: 15,
    healthAssessments: [
      { date: "2025-06-01", type: "initial", completedOnTime: true, actionPlanCreated: true },
      { date: "2026-03-01", type: "review", completedOnTime: true, actionPlanCreated: true },
    ],
    lastAssessmentDate: "2026-03-01",
    nextAssessmentDue: "2027-03-01",
    assessmentOverdue: false,
    gpRegistered: true,
    dentistRegistered: true,
    opticiansRegistered: true,
    dentalCheckLast6Months: true,
    opticalCheckLast12Months: true,
    lastDentalDate: "2026-02-15",
    lastOpticalDate: "2025-11-10",
    immunisations: [
      { name: "MMR", due: false, overdue: false, dateGiven: "2020-01-01" },
      { name: "Td/IPV", due: false, overdue: false, dateGiven: "2024-09-01" },
      { name: "MenACWY", due: false, overdue: false, dateGiven: "2024-09-01" },
      { name: "HPV", due: true, overdue: false }, // due but not overdue
    ],
    immunisationsUpToDate: false,
    appointments: [
      { date: "2026-02-15", type: "dental", attended: true },
      { date: "2026-03-01", type: "gp", attended: true },
      { date: "2026-03-20", type: "camhs", attended: true },
      { date: "2026-04-10", type: "gp", attended: true },
      { date: "2026-05-05", type: "specialist", attended: false, reason: "refused" },
    ],
    medications: [
      {
        name: "Melatonin",
        prescribed: true,
        administeredCorrectly: true,
        consentInPlace: true,
        reviewDue: false,
      },
    ],
    healthActionPlanInPlace: true,
    healthActionPlanReviewed: true,
    actionsTotal: 5,
    actionsCompleted: 3,
    substanceMisuseIdentified: false,
    substanceMisuseSupport: false,
    healthyEatingSupported: true,
    physicalActivityRegular: true,
    sleepRoutineGood: true,
    staffHealthTrained: true,
    childUnderstandsHealth: true,
    consentFormsComplete: true,
    healthPassportUpToDate: true,
  };
}
