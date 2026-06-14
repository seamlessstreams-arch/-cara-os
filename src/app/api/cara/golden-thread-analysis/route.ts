// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/golden-thread-analysis
//
// GET — Analyse golden thread for a child
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseGoldenThread, type GoldenThreadInput } from "@/lib/cara/golden-thread-analyser";

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoInput(childId: string): GoldenThreadInput {
  const profiles: Record<string, GoldenThreadInput> = {
    child_jordan: {
      childId: "child_jordan",
      childName: "Jordan P",
      analysisWindowDays: 28,
      dailyLogs: [
        { id: "dl_1", date: "2026-05-14", content: "Jordan had a difficult morning.", hasChildVoice: true, linksToCarePlan: true, linkedObjectiveIds: ["obj_emotional"] },
        { id: "dl_2", date: "2026-05-13", content: "Good day. Jordan went to school.", hasChildVoice: false, linksToCarePlan: true, linkedObjectiveIds: ["obj_education"] },
        { id: "dl_3", date: "2026-05-12", content: "Jordan joined cooking activity.", hasChildVoice: true, linksToCarePlan: true, linkedObjectiveIds: ["obj_skills"] },
        { id: "dl_4", date: "2026-05-11", content: "Quiet day. Stayed in room mostly.", hasChildVoice: false, linksToCarePlan: false },
        { id: "dl_5", date: "2026-05-10", content: "Jordan had phone call with mum.", hasChildVoice: true, linksToCarePlan: true, linkedObjectiveIds: ["obj_family"] },
        { id: "dl_6", date: "2026-05-09", content: "Refused school. Low mood AM.", hasChildVoice: false, linksToCarePlan: false },
        { id: "dl_7", date: "2026-05-08", content: "Better day. DofE practice session.", hasChildVoice: true, linksToCarePlan: true, linkedObjectiveIds: ["obj_skills"] },
        { id: "dl_8", date: "2026-05-07", content: "Incident at bedtime.", hasChildVoice: false, linksToCarePlan: false },
      ],
      keyWorkSessions: [
        { id: "kw_1", date: "2026-05-12", content: "Discussed DofE and cooking goals.", hasChildVoice: true, linksToCarePlan: true, linkedObjectiveIds: ["obj_skills"] },
        { id: "kw_2", date: "2026-05-05", content: "Talked about family contact plan.", hasChildVoice: true, linksToCarePlan: true, linkedObjectiveIds: ["obj_family"] },
      ],
      carePlanObjectives: [
        { id: "obj_emotional", title: "Develop emotional regulation strategies", category: "emotional", basedOnChildView: true, sourceViewId: "view_1", status: "active", evidenceCount: 3 },
        { id: "obj_education", title: "Maintain school attendance above 80%", category: "education", basedOnChildView: true, sourceViewId: "view_2", status: "active", evidenceCount: 4 },
        { id: "obj_skills", title: "Build independence through cooking and DofE", category: "independence", basedOnChildView: true, sourceViewId: "view_3", status: "active", evidenceCount: 5 },
        { id: "obj_family", title: "Supported contact with mum weekly", category: "family", basedOnChildView: true, sourceViewId: "view_4", status: "active", evidenceCount: 2 },
        { id: "obj_health", title: "Consistent sleep routine", category: "health", basedOnChildView: false, status: "active", evidenceCount: 1 },
      ],
      reviewRecords: [
        { id: "rev_1", date: "2026-05-01", content: "Monthly review with social worker.", hasChildVoice: true, linksToCarePlan: true },
      ],
      incidentRecords: [
        { id: "inc_1", date: "2026-05-08", content: "Verbal aggression at bedtime.", hasChildVoice: true, linksToCarePlan: false },
      ],
      childViews: [
        { id: "view_1", date: "2026-04-20", content: "I want to learn to handle my anger better", category: "goals", capturedIn: "key_work", linkedToCarePlan: true, linkedObjectiveId: "obj_emotional" },
        { id: "view_2", date: "2026-04-20", content: "I want to finish Year 10 and do my GCSEs", category: "wishes", capturedIn: "review", linkedToCarePlan: true, linkedObjectiveId: "obj_education" },
        { id: "view_3", date: "2026-04-25", content: "I really enjoy cooking and want to do DofE", category: "wishes", capturedIn: "key_work", linkedToCarePlan: true, linkedObjectiveId: "obj_skills" },
        { id: "view_4", date: "2026-04-28", content: "I want to talk to mum every week", category: "wishes", capturedIn: "key_work", linkedToCarePlan: true, linkedObjectiveId: "obj_family" },
        { id: "view_5", date: "2026-05-10", content: "I dont want people telling me what to do all the time", category: "feelings", capturedIn: "daily_log", linkedToCarePlan: false },
      ],
    },
    child_sam: {
      childId: "child_sam",
      childName: "Sam W",
      analysisWindowDays: 28,
      dailyLogs: Array.from({ length: 10 }, (_, i) => ({
        id: `dl_s_${i}`, date: `2026-05-${String(14 - i).padStart(2, "0")}`,
        content: "Daily record", hasChildVoice: i % 2 === 0, linksToCarePlan: i % 3 === 0,
      })),
      keyWorkSessions: [
        { id: "kw_s_1", date: "2026-05-10", content: "DofE session", hasChildVoice: true, linksToCarePlan: true },
        { id: "kw_s_2", date: "2026-05-03", content: "Independence skills", hasChildVoice: true, linksToCarePlan: true },
      ],
      carePlanObjectives: [
        { id: "obj_s_1", title: "Complete DofE Bronze", category: "independence", basedOnChildView: true, status: "active", evidenceCount: 4 },
        { id: "obj_s_2", title: "Build confidence in social settings", category: "emotional", basedOnChildView: true, status: "active", evidenceCount: 2 },
      ],
      reviewRecords: [
        { id: "rev_s_1", date: "2026-05-05", content: "LAC review", hasChildVoice: true, linksToCarePlan: true },
      ],
      incidentRecords: [],
      childViews: [
        { id: "v_s_1", date: "2026-04-15", content: "I want to finish my DofE", category: "goals", capturedIn: "key_work", linkedToCarePlan: true, linkedObjectiveId: "obj_s_1" },
        { id: "v_s_2", date: "2026-04-20", content: "I get nervous around new people", category: "feelings", capturedIn: "review", linkedToCarePlan: true, linkedObjectiveId: "obj_s_2" },
      ],
    },
  };

  return profiles[childId] ?? profiles.child_jordan;
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const childId = req.nextUrl.searchParams.get("childId") ?? "child_jordan";
    const days = parseInt(req.nextUrl.searchParams.get("days") ?? "28", 10);

    const input = getDemoInput(childId);
    input.analysisWindowDays = days;

    const analysis = analyseGoldenThread(input);
    return NextResponse.json({ ok: true, data: analysis });
  } catch (err) {
    console.error("[cara/golden-thread-analysis] GET error:", err);
    return NextResponse.json({ error: "Failed to analyse golden thread" }, { status: 500 });
  }
}
