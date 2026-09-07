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

import { seedDay } from "@/lib/seed-date";
import type { SB } from "@/lib/supabase/loose-client";

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
      { error: "Health intelligence failed" },
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
    completedOnTime: a.completed_on_time ?? null,
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
    attended: a.attended ?? null,
    reason: a.reason ?? undefined,
  }));

  // Medications
  const { data: rawMeds } = await (sb.from("medications") as SB)
    .select("*")
    .eq("child_id", childId)
    .eq("active", true);

  const medications: Medication[] = (rawMeds ?? []).map((m: any) => ({
    name: m.name,
    prescribed: m.prescribed ?? null,
    administeredCorrectly: m.administered_correctly ?? null,
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
    gpRegistered: config?.gp_registered ?? null,
    dentistRegistered: config?.dentist_registered ?? null,
    opticiansRegistered: config?.opticians_registered ?? null,
    dentalCheckLast6Months: config?.dental_check ?? null,
    opticalCheckLast12Months: config?.optical_check ?? null,
    lastDentalDate: config?.last_dental ?? undefined,
    lastOpticalDate: config?.last_optical ?? undefined,
    immunisations,
    immunisationsUpToDate: config?.immunisations_current ?? (immunisations.every(i => !i.overdue)),
    appointments,
    medications,
    healthActionPlanInPlace: config?.action_plan ?? null,
    healthActionPlanReviewed: config?.action_plan_reviewed ?? null,
    actionsTotal: config?.actions_total ?? 0,
    actionsCompleted: config?.actions_completed ?? 0,
    substanceMisuseIdentified: config?.substance_misuse ?? false,
    substanceMisuseSupport: config?.substance_support ?? false,
    healthyEatingSupported: config?.healthy_eating ?? null,
    physicalActivityRegular: config?.physical_activity ?? null,
    sleepRoutineGood: config?.sleep_good ?? null,
    staffHealthTrained: config?.staff_trained ?? null,
    childUnderstandsHealth: config?.child_understands ?? null,
    consentFormsComplete: config?.consent_forms ?? null,
    healthPassportUpToDate: config?.health_passport ?? null,
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
        { date: seedDay(-266), type: "review", completedOnTime: true, actionPlanCreated: true },
        { date: seedDay(-59), type: "review", completedOnTime: true, actionPlanCreated: true },
      ],
      lastAssessmentDate: seedDay(-59),
      nextAssessmentDue: seedDay(306),
      assessmentOverdue: false,
      gpRegistered: true,
      dentistRegistered: true,
      opticiansRegistered: true,
      dentalCheckLast6Months: true,
      opticalCheckLast12Months: true,
      lastDentalDate: seedDay(-99),
      lastOpticalDate: seedDay(-236),
      immunisations: [
        { name: "MMR", due: false, overdue: false, dateGiven: seedDay(-2564) },
        { name: "Td/IPV", due: false, overdue: false, dateGiven: seedDay(-645) },
        { name: "MenACWY", due: false, overdue: false, dateGiven: seedDay(-645) },
        { name: "HPV", due: false, overdue: false, dateGiven: seedDay(-584) },
      ],
      immunisationsUpToDate: true,
      appointments: [
        { date: seedDay(-99), type: "dental", attended: true },
        { date: seedDay(-59), type: "gp", attended: true },
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
      { date: seedDay(-372), type: "initial", completedOnTime: true, actionPlanCreated: true },
      { date: seedDay(-99), type: "review", completedOnTime: true, actionPlanCreated: true },
    ],
    lastAssessmentDate: seedDay(-99),
    nextAssessmentDue: seedDay(266),
    assessmentOverdue: false,
    gpRegistered: true,
    dentistRegistered: true,
    opticiansRegistered: true,
    dentalCheckLast6Months: true,
    opticalCheckLast12Months: true,
    lastDentalDate: seedDay(-113),
    lastOpticalDate: seedDay(-210),
    immunisations: [
      { name: "MMR", due: false, overdue: false, dateGiven: seedDay(-2350) },
      { name: "Td/IPV", due: false, overdue: false, dateGiven: seedDay(-645) },
      { name: "MenACWY", due: false, overdue: false, dateGiven: seedDay(-645) },
      { name: "HPV", due: true, overdue: false }, // due but not overdue
    ],
    immunisationsUpToDate: false,
    appointments: [
      { date: seedDay(-113), type: "dental", attended: true },
      { date: seedDay(-99), type: "gp", attended: true },
      { date: seedDay(-80), type: "camhs", attended: true },
      { date: seedDay(-59), type: "gp", attended: true },
      { date: seedDay(-34), type: "specialist", attended: false, reason: "refused" },
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
