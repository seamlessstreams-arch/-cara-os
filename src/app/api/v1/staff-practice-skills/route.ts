// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PRACTICE SKILLS API
// GET ?staff_id=…  → one practitioner's unified practice picture (five lenses,
//     strengths, growing edges, supervision prompts).
// GET (no staff_id) → whole-team rollup (one row per staff member).
//
// A developmental view for supervision — never a rank or a grade. The engine is
// pure; this route only reads store snapshots and maps them in.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { dal } from "@/lib/db";
import { synthesiseStaffPracticeSkills } from "@/lib/staff-practice-skills/skills-engine";
// The store-shape → engine-input mapping lives in @/lib/staff-practice-skills/
// build-input so this API and the §31 export pack share ONE practice-skills read.
import { buildStaffSkillsInput, staffDisplayName } from "@/lib/staff-practice-skills/build-input";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

const buildInput = buildStaffSkillsInput;
const nameOf = staffDisplayName;

export async function GET(req: NextRequest) {
  try {
    const [competencyScoresList, keyWorkingSessionsList, practiceObservationsList, reflectiveSupervisionsList, staffList, writingAssistantAuditEventsList] = await Promise.all([dal.competencyScores.findAll(), dal.keyWorkingSessions.findAll(), dal.practiceObservations.findAll(), dal.reflectiveSupervisions.findAll(), dal.staff.findAll(), dal.writingAssistantAuditEvents.findAll()]);
  const store = { competencyScores: competencyScoresList, keyWorkingSessions: keyWorkingSessionsList, practiceObservations: practiceObservationsList, reflectiveSupervisions: reflectiveSupervisionsList, staff: staffList, writingAssistantAuditEvents: writingAssistantAuditEventsList };
    const asOf = todayStr();
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staff_id");

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    if (staffId) {
      const s = (store.staff ?? []).find((x: { id: string }) => x.id === staffId);
      const profile = synthesiseStaffPracticeSkills(buildInput(store, staffId, s ? nameOf(s) : "Staff member", asOf));
      return NextResponse.json({ data: profile });
    }

    // StaffMember has is_active/employment_status — the old active/status reads hit
    // nonexistent fields, so LEFT staff were never filtered out.
    const team = (store.staff ?? []).filter((s) => s.is_active !== false && s.employment_status !== "left");
    const rows = team.map((s) => {
      const p = synthesiseStaffPracticeSkills(buildInput(store, s.id, nameOf(s), asOf));
      return {
        staffId: p.staffId,
        staffName: p.staffName,
        hasData: p.hasData,
        overallPicture: p.overallPicture,
        strengths: p.strengths.slice(0, 2),
        developmentAreas: p.developmentAreas.slice(0, 2),
        needsSupportLenses: p.lenses.filter((l) => l.signal === "needs_support").length,
        supervisionPromptCount: p.supervisionPrompts.length,
      };
    });
    rows.sort((a: { needsSupportLenses: number; hasData: boolean }, b: { needsSupportLenses: number; hasData: boolean }) =>
      b.needsSupportLenses - a.needsSupportLenses || Number(b.hasData) - Number(a.hasData),
    );

    return NextResponse.json({
      data: {
        asOf,
        staffWithData: rows.filter((r: { hasData: boolean }) => r.hasData).length,
        staffNeedingSupport: rows.filter((r: { needsSupportLenses: number }) => r.needsSupportLenses > 0).length,
        rows,
      },
    });
  } catch (error: unknown) {
    console.error("[api] staff-practice-skills error:", error);
    return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }
}
