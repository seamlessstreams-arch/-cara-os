// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF DEVELOPMENT PACK EXPORT API (§31)
// GET ?staff_id=<id>&format=html|docx|json
//
// Renders one practitioner's practice-skills profile as a pack a supervisor
// can take into supervision or an appraisal. Deterministic; developmental —
// never a rank or a grade, and the no-data case is stated as a recording gap,
// not a judgement of the person. HTML renders inline for print / save-as-PDF;
// docx/json download as attachments.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { dal } from "@/lib/db";
import { synthesiseStaffPracticeSkills } from "@/lib/staff-practice-skills/skills-engine";
import { buildStaffSkillsInput, staffDisplayName } from "@/lib/staff-practice-skills/build-input";
import {
  buildStaffSkillsExportModel,
  renderStaffSkillsHtml,
  renderStaffSkillsJson,
} from "@/lib/staff-practice-skills/staff-skills-export";
import { renderStaffSkillsDocx } from "@/lib/staff-practice-skills/staff-skills-docx";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const { searchParams } = new URL(req.url);
    const staffId = (searchParams.get("staff_id") || "").trim();
    if (!staffId) {
      return NextResponse.json({ error: "A staff id is required (?staff_id=)." }, { status: 400 });
    }

    const [competencyScoresList, keyWorkingSessionsList, practiceObservationsList, reflectiveSupervisionsList, staffList, writingAssistantAuditEventsList] = await Promise.all([
      dal.competencyScores.findAll(), dal.keyWorkingSessions.findAll(), dal.practiceObservations.findAll(),
      dal.reflectiveSupervisions.findAll(), dal.staff.findAll(), dal.writingAssistantAuditEvents.findAll(),
    ]);
    const store = {
      competencyScores: competencyScoresList,
      keyWorkingSessions: keyWorkingSessionsList,
      practiceObservations: practiceObservationsList,
      reflectiveSupervisions: reflectiveSupervisionsList,
      staff: staffList,
      writingAssistantAuditEvents: writingAssistantAuditEventsList,
    };

    const staff = (store.staff ?? []).find((s: { id: string }) => s.id === staffId);
    if (!staff) {
      return NextResponse.json({ error: `No staff member "${staffId}".` }, { status: 404 });
    }

    const asOf = todayStr();
    const profile = synthesiseStaffPracticeSkills(buildStaffSkillsInput(store, staffId, staffDisplayName(staff), asOf));
    const model = buildStaffSkillsExportModel(profile);
    const base = `staff-development-${staffId}-${asOf}`;

    if (format(searchParams) === "json") {
      return new NextResponse(renderStaffSkillsJson(model), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${base}.json"`,
        },
      });
    }
    if (format(searchParams) === "docx") {
      const buf = await renderStaffSkillsDocx(model);
      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${base}.docx"`,
        },
      });
    }
    // Default: HTML (renders inline for print / save-as-PDF).
    return new NextResponse(renderStaffSkillsHtml(model), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: unknown) {
    console.error("[api] staff-practice-skills export error:", error);
    return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }
}

function format(searchParams: URLSearchParams): string {
  return (searchParams.get("format") || "html").toLowerCase();
}
