// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/health-appointments — Health Appointments Intelligence
//
// Tracks statutory health assessments (IHA, RHA), dental, optical,
// immunisations, SDQ, and appointment attendance patterns.
// Pure deterministic — no AI. Returns structured assessment.
// CHR 2015 Reg 6(2)(b), Promoting Health of LAC 2015, NICE PH28.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseHealthAppointments } from "@/lib/cara/health-appointments-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { HealthInput, HealthAppointment } from "@/lib/cara/health-appointments-intelligence";

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

    // ── Fetch or demo ───────────────────────────────────────────────────────
    const sb = createServerClient();
    let input: HealthInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchHealthData(sb, childId);
    } else {
      input = buildDemoData(childId);
    }

    // ── Run intelligence engine ─────────────────────────────────────────────
    const assessment = analyseHealthAppointments(input);

    return NextResponse.json({
      success: true,
      data: assessment,
    });
  } catch (err) {
    console.error("[cara/health-appointments] Error:", err);
    return NextResponse.json(
      { error: "Health appointments intelligence failed" },
      { status: 500 },
    );
  }
}

// ── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchHealthData(sb: any, childId: string): Promise<HealthInput> {
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, date_of_birth, date_entered_care")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const age = child?.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 14;

  // Fetch health record
  const { data: healthRecord } = await (sb.from("health_records") as SB)
    .select("*")
    .eq("child_id", childId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch appointments (last 12 months + future)
  const cutoff = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
  const { data: rawAppts } = await (sb.from("health_appointments") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff)
    .order("date", { ascending: true });

  const appointments: HealthAppointment[] = (rawAppts ?? []).map((a: any) => ({
    id: a.id,
    type: a.type ?? "other",
    date: a.date,
    status: a.status ?? "attended",
    provider: a.provider ?? undefined,
    outcome: a.outcome ?? undefined,
    followUpRequired: a.follow_up_required ?? false,
    followUpDate: a.follow_up_date ?? undefined,
    notes: a.notes ?? undefined,
  }));

  return {
    childId,
    childName,
    age,
    dateEnteredCare: child?.date_entered_care ?? "2025-01-01",
    hasIHA: healthRecord?.has_iha ?? false,
    ihaDate: healthRecord?.iha_date ?? undefined,
    ihaWithin20Days: healthRecord?.iha_within_20_days ?? undefined,
    lastRHADate: healthRecord?.last_rha_date ?? undefined,
    lastDentalDate: healthRecord?.last_dental_date ?? undefined,
    lastOpticalDate: healthRecord?.last_optical_date ?? undefined,
    lastSDQDate: healthRecord?.last_sdq_date ?? undefined,
    sdqScore: healthRecord?.sdq_score ?? undefined,
    immunisationsUpToDate: healthRecord?.immunisations_up_to_date ?? false,
    appointments,
    registeredWithGP: healthRecord?.registered_gp ?? null,
    registeredWithDentist: healthRecord?.registered_dentist ?? false,
    hasHealthPlan: healthRecord?.has_health_plan ?? false,
    healthPlanUpToDate: healthRecord?.health_plan_up_to_date ?? false,
    consentFormsComplete: healthRecord?.consent_forms_complete ?? false,
  };
}

// ── Demo Data ───────────────────────────────────────────────────────────────

function buildDemoData(childId: string): HealthInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";

  const baseAppts: HealthAppointment[] = isJordan ? [
    { id: "a1", type: "gp", date: seedDay(-118), status: "attended", provider: "Dr Smith" },
    { id: "a2", type: "dental", date: seedDay(-95), status: "attended", provider: "Smile Dental" },
    { id: "a3", type: "camhs", date: seedDay(-80), status: "dna" },
    { id: "a4", type: "gp", date: seedDay(-68), status: "attended", provider: "Dr Smith" },
    { id: "a5", type: "camhs", date: seedDay(-54), status: "attended", provider: "CAMHS Team" },
    { id: "a6", type: "specialist", date: seedDay(-19), status: "pending", provider: "Paediatrician" },
    { id: "a7", type: "dental", date: seedDay(2), status: "pending", provider: "Smile Dental" },
  ] : [
    { id: "a1", type: "gp", date: seedDay(-144), status: "attended", provider: "Dr Patel" },
    { id: "a2", type: "dental", date: seedDay(-108), status: "attended", provider: "Bright Dental" },
    { id: "a3", type: "gp", date: seedDay(-90), status: "attended", provider: "Dr Patel" },
    { id: "a4", type: "optical", date: seedDay(-64), status: "attended", provider: "Specsavers" },
    { id: "a5", type: "dental", date: seedDay(7), status: "pending", provider: "Bright Dental" },
  ];

  return {
    childId,
    childName: isJordan ? "Jordan" : "Sam",
    age: isJordan ? 15 : 14,
    dateEnteredCare: isJordan ? "2025-01-15" : "2024-09-01",
    hasIHA: true,
    ihaDate: isJordan ? "2025-02-01" : "2024-09-18",
    ihaWithin20Days: true,
    lastRHADate: isJordan ? "2026-02-05" : "2025-09-20",
    lastDentalDate: isJordan ? "2026-03-05" : "2026-02-20",
    lastOpticalDate: isJordan ? "2025-11-20" : "2026-04-05",
    lastSDQDate: isJordan ? "2026-01-15" : "2025-10-10",
    sdqScore: isJordan ? 18 : 8,
    immunisationsUpToDate: true,
    appointments: baseAppts,
    registeredWithGP: true,
    registeredWithDentist: true,
    hasHealthPlan: true,
    healthPlanUpToDate: isJordan ? true : true,
    consentFormsComplete: true,
  };
}
