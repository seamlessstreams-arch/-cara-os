// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF SUPERVISION & REFLECTIVE PRACTICE INTELLIGENCE API ROUTE
// GET /api/v1/home-staff-supervision-reflective-practice-intelligence
// Cross-domain composite: supervisions + staffReflectionRecords +
// safeguardingSupervisionRecords + staffSupervisionThemeRecords +
// supervisionMatrixRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeStaffSupervisionReflectivePractice,
  type SupervisionInput,
  type StaffReflectionInput,
  type SafeguardingSupervisionInput,
  type SupervisionThemeInput,
  type SupervisionMatrixInput,
} from "@/lib/engines/home-staff-supervision-reflective-practice-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const staff = (store.staff ?? []) as any[];
    const total_staff = staff.length;

    // Supervisions → SupervisionInput[] (only completed ones)
    const rawSupervisions = (store.supervisions ?? []) as any[];
    const supervisions: SupervisionInput[] = rawSupervisions
      .filter((s: any) => s.status === "completed")
      .map((s: any) => {
        const actionsAgreed = Array.isArray(s.actions_agreed) ? s.actions_agreed : [];
        const actionsIdentified = actionsAgreed.length;
        const actionsCompleted = actionsAgreed.filter(
          (a: any) => a.status === "completed",
        ).length;
        return {
          id: s.id ?? "",
          staff_id: s.staff_id ?? "",
          supervision_date: (s.actual_date ?? s.scheduled_date ?? today).toString(),
          supervisor_id: s.supervisor_id ?? "",
          type: (["formal", "informal", "group"].includes(s.type) ? s.type : "formal") as "formal" | "informal" | "group",
          duration_minutes: s.duration_minutes ?? 0,
          quality_rating: s.wellbeing_score != null ? Math.min(5, Math.max(1, Math.round(s.wellbeing_score / 2))) : 3,
          actions_identified: actionsIdentified,
          actions_completed: actionsCompleted,
          wellbeing_discussed: s.wellbeing_score != null && s.wellbeing_score > 0,
          professional_development_discussed: (s.discussion_points ?? "").toLowerCase().includes("development") || (s.discussion_points ?? "").toLowerCase().includes("training"),
          child_focused_topics_discussed: (s.discussion_points ?? "").toLowerCase().includes("child") || (s.discussion_points ?? "").toLowerCase().includes("young") || (s.discussion_points ?? "").toLowerCase().includes("alex") || (s.discussion_points ?? "").toLowerCase().includes("jordan") || (s.discussion_points ?? "").toLowerCase().includes("casey"),
          created_at: (s.created_at ?? today).toString(),
        };
      });

    // Staff reflections → StaffReflectionInput[]
    const rawReflections = (store.staffReflectionRecords ?? []) as any[];
    const staff_reflections: StaffReflectionInput[] = rawReflections.map((r: any) => ({
      id: r.id ?? "",
      staff_id: r.staff_id ?? "",
      reflection_date: (r.date ?? today).toString(),
      reflection_type: (["individual", "group", "peer"].includes(r.type) ? r.type : "individual") as "individual" | "group" | "peer",
      topic: r.title ?? r.what_happened ?? "",
      learning_identified: !!(r.what_i_learned && r.what_i_learned.trim().length > 0),
      action_planned: !!(r.what_i_would_do_differently && r.what_i_would_do_differently.trim().length > 0),
      shared_with_team: !!r.shared_with_manager,
      created_at: (r.created_at ?? today).toString(),
    }));

    // Safeguarding supervisions → SafeguardingSupervisionInput[]
    const rawSgSupervisions = (store.safeguardingSupervisionRecords ?? []) as any[];
    const safeguarding_supervisions: SafeguardingSupervisionInput[] = rawSgSupervisions.map((s: any) => {
      const actionsAgreed = Array.isArray(s.actions_agreed) ? s.actions_agreed : [];
      return {
        id: s.id ?? "",
        staff_id: s.supervisee ?? "",
        date: (s.date ?? today).toString(),
        supervisor_id: s.supervisor ?? "",
        cases_discussed: Array.isArray(s.cases_discussed) ? s.cases_discussed.length : (s.cases_discussed ?? 0),
        concerns_raised: Array.isArray(s.risk_themes) ? s.risk_themes.length : 0,
        actions_identified: actionsAgreed.length,
        actions_completed: actionsAgreed.filter((a: any) => a.status === "completed").length,
        competence_assessed: !!(s.supervisor_observations && s.supervisor_observations.trim().length > 0),
        created_at: (s.created_at ?? today).toString(),
      };
    });

    // Supervision themes → SupervisionThemeInput[]
    const rawThemes = (store.staffSupervisionThemeRecords ?? []) as any[];
    const supervision_themes: SupervisionThemeInput[] = rawThemes.map((t: any) => {
      // Map from store theme_area to engine theme
      const themeMap: Record<string, string> = {
        safeguarding: "safeguarding",
        practice: "practice_standards",
        wellbeing: "health_wellbeing",
        training: "professional_development",
        communication: "therapeutic_care",
        workload: "behaviour_management",
        reflective: "education",
      };
      const mappedTheme = themeMap[t.theme_area] ?? "practice_standards";
      return {
        id: t.id ?? "",
        supervision_id: "",
        theme: mappedTheme as SupervisionThemeInput["theme"],
        discussed: t.status !== "emerging",
        created_at: (t.identified_date ?? today).toString(),
      };
    });

    // Supervision matrix → SupervisionMatrixInput[]
    const rawMatrix = (store.supervisionMatrixRecords ?? []) as any[];
    const supervision_matrix: SupervisionMatrixInput[] = rawMatrix.map((m: any) => ({
      id: m.id ?? "",
      staff_id: m.supervisee_id ?? "",
      frequency_weeks: parseInt(m.frequency ?? "4", 10) || 4,
      last_supervision_date: (m.last_supervision_date ?? "").toString(),
      next_due_date: (m.next_supervision_date ?? "").toString(),
      overdue: m.status === "overdue",
      created_at: (m.created_at ?? today).toString(),
    }));

    const result = computeStaffSupervisionReflectivePractice({
      today,
      total_staff,
      supervisions,
      staff_reflections,
      safeguarding_supervisions,
      supervision_themes,
      supervision_matrix,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
