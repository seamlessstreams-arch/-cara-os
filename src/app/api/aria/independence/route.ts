// ══════════════════════════════════════════════════════════════════════════════
// API: /api/aria/independence — Independence & Pathway Planning Intelligence
//
// Analyses independence preparation, life skills, EET status, pathway planning.
// Pure deterministic — no AI. Returns structured assessment.
// CHR 2015 Reg 14 alignment (Preparing for Independence).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseIndependence } from "@/lib/aria/independence-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { IndependenceInput, LifeSkill, SkillCategory, SkillLevel, EETStatus } from "@/lib/aria/independence-intelligence";

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
    let input: IndependenceInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchData(sb, childId);
    } else {
      input = buildDemoData(childId);
    }

    const assessment = analyseIndependence(input);

    return NextResponse.json({ success: true, data: assessment });
  } catch (err) {
    console.error("[aria/independence] Error:", err);
    return NextResponse.json(
      { error: "Independence intelligence failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchData(sb: any, childId: string): Promise<IndependenceInput> {
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, date_of_birth")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const age = child?.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 16;

  // Life skills
  const { data: rawSkills } = await (sb.from("life_skills") as SB)
    .select("*")
    .eq("child_id", childId);

  const lifeSkills: LifeSkill[] = (rawSkills ?? []).map((s: any) => ({
    name: s.name ?? "Unnamed skill",
    category: (s.category ?? "personal_care") as SkillCategory,
    level: (s.level ?? "not_started") as SkillLevel,
    targetLevel: (s.target_level ?? "competent") as SkillLevel,
    lastAssessed: s.last_assessed ?? undefined,
    notes: s.notes ?? undefined,
  }));

  // Independence config
  const { data: config } = await (sb.from("independence_config") as SB)
    .select("*")
    .eq("child_id", childId)
    .single();

  // Pathway plan
  const { data: ppData } = await (sb.from("pathway_plans") as SB)
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const pathwayPlan = {
    exists: !!ppData,
    upToDate: ppData?.up_to_date ?? false,
    lastReviewDate: ppData?.last_review_date ?? undefined,
    nextReviewDue: ppData?.next_review_due ?? undefined,
    youngPersonParticipated: ppData?.yp_participated ?? false,
    personalAdviserAssigned: ppData?.pa_assigned ?? config?.pa_assigned ?? false,
    goalsSet: ppData?.goals_set ?? false,
    goalsProgress: ppData?.goals_progress ?? 0,
  };

  // Accommodation plan
  const accommodationPlan = {
    identified: config?.accommodation_identified ?? false,
    type: config?.accommodation_type ?? "not_yet_planned",
    readinessAssessed: config?.readiness_assessed ?? false,
    transitionPlanned: config?.transition_planned ?? false,
    emergencyPlanInPlace: config?.emergency_plan ?? false,
  };

  return {
    childId,
    childName,
    age,
    lifeSkills,
    eetStatus: (config?.eet_status ?? "in_education") as EETStatus,
    eetDetail: config?.eet_detail ?? undefined,
    pathwayPlan,
    accommodationPlan,
    hasBankAccount: config?.has_bank_account ?? false,
    financialLiteracyStarted: config?.financial_literacy ?? false,
    hasNINumber: config?.has_ni_number ?? false,
    hasBirthCertificate: config?.has_birth_certificate ?? false,
    hasPassportOrID: config?.has_passport_id ?? false,
    registeredWithGPIndependently: config?.gp_registered ?? false,
    canManageMedication: config?.can_manage_medication ?? false,
    hasSupportNetwork: config?.has_support_network ?? false,
    supportNetworkMapped: config?.support_mapped ?? false,
    keyRelationshipsIdentified: config?.key_relationships ?? false,
  };
}

// ── Demo Data ───────────────────────────────────────────────────────────────

function buildDemoData(childId: string): IndependenceInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";

  if (!isJordan) {
    // Sam — 14, early stages
    return {
      childId,
      childName: "Sam",
      age: 14,
      lifeSkills: [
        { name: "Making a snack", category: "cooking_nutrition", level: "developing", targetLevel: "competent" },
        { name: "Personal hygiene", category: "personal_care", level: "competent", targetLevel: "competent" },
        { name: "Using public transport", category: "transport_travel", level: "emerging", targetLevel: "developing" },
        { name: "Online safety", category: "digital_literacy", level: "developing", targetLevel: "competent" },
      ],
      eetStatus: "in_education",
      eetDetail: "Year 10 at local secondary",
      pathwayPlan: {
        exists: false,
        upToDate: false,
        youngPersonParticipated: false,
        personalAdviserAssigned: false,
        goalsSet: false,
        goalsProgress: 0,
      },
      accommodationPlan: {
        identified: false,
        type: "not_yet_planned",
        readinessAssessed: false,
        transitionPlanned: false,
        emergencyPlanInPlace: false,
      },
      hasBankAccount: false,
      financialLiteracyStarted: false,
      hasNINumber: false,
      hasBirthCertificate: true,
      hasPassportOrID: false,
      registeredWithGPIndependently: false,
      canManageMedication: false,
      hasSupportNetwork: true,
      supportNetworkMapped: false,
      keyRelationshipsIdentified: true,
    };
  }

  // Jordan — 16, good progress
  return {
    childId,
    childName: "Jordan",
    age: 16,
    lifeSkills: [
      { name: "Cooking a basic meal", category: "cooking_nutrition", level: "developing", targetLevel: "competent" },
      { name: "Food shopping", category: "cooking_nutrition", level: "competent", targetLevel: "competent" },
      { name: "Weekly budgeting", category: "budgeting_finance", level: "developing", targetLevel: "competent" },
      { name: "Paying bills", category: "budgeting_finance", level: "emerging", targetLevel: "developing" },
      { name: "Laundry", category: "household_tasks", level: "competent", targetLevel: "competent" },
      { name: "Cleaning room", category: "household_tasks", level: "competent", targetLevel: "competent" },
      { name: "Using buses independently", category: "transport_travel", level: "independent", targetLevel: "competent" },
      { name: "Booking GP appointment", category: "health_management", level: "developing", targetLevel: "competent" },
      { name: "Managing medication", category: "health_management", level: "developing", targetLevel: "competent" },
      { name: "Online banking", category: "digital_literacy", level: "emerging", targetLevel: "developing" },
    ],
    eetStatus: "in_education",
    eetDetail: "Year 12 — BTec Applied Science",
    pathwayPlan: {
      exists: true,
      upToDate: true,
      lastReviewDate: "2026-04-20",
      nextReviewDue: "2026-10-20",
      youngPersonParticipated: true,
      personalAdviserAssigned: true,
      goalsSet: true,
      goalsProgress: 65,
    },
    accommodationPlan: {
      identified: true,
      type: "semi_independent",
      readinessAssessed: true,
      transitionPlanned: false,
      emergencyPlanInPlace: false,
    },
    hasBankAccount: true,
    financialLiteracyStarted: true,
    hasNINumber: true,
    hasBirthCertificate: true,
    hasPassportOrID: true,
    registeredWithGPIndependently: false,
    canManageMedication: false,
    hasSupportNetwork: true,
    supportNetworkMapped: true,
    keyRelationshipsIdentified: true,
  };
}
