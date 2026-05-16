// ══════════════════════════════════════════════════════════════════════════════
// API: /api/aria/outcome-tracker
//
// GET — Track outcomes progress for a child
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { trackOutcomes, type OutcomeObjective, type EvidenceEntry } from "@/lib/aria/outcome-tracker";

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoData(childId: string) {
  const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
  const fd = (daysAhead: number) => new Date(Date.now() + daysAhead * 86400000).toISOString().slice(0, 10);

  const objectives: OutcomeObjective[] = [
    {
      id: "obj_edu_1",
      title: "Maintain school attendance above 85%",
      category: "education",
      targetDescription: "Consistent school attendance with support from home",
      startDate: d(90),
      targetDate: fd(90),
      indicators: [
        { id: "ind_1", description: "Weekly attendance %", measureType: "attendance", target: 85, current: 78, trend: "improving", lastUpdated: d(2) },
      ],
      currentStatus: "at_risk",
    },
    {
      id: "obj_emo_1",
      title: "Develop emotional regulation strategies",
      category: "emotional_wellbeing",
      targetDescription: "Use at least 3 coping strategies independently when distressed",
      startDate: d(60),
      targetDate: fd(60),
      indicators: [
        { id: "ind_2", description: "Coping strategies used independently", measureType: "frequency", target: 3, current: 2, trend: "improving", lastUpdated: d(5) },
        { id: "ind_3", description: "Incidents requiring staff intervention (lower is better)", measureType: "frequency", target: 2, current: 3, trend: "stable", lastUpdated: d(3) },
      ],
      currentStatus: "on_track",
    },
    {
      id: "obj_ind_1",
      title: "Complete DofE Bronze Award",
      category: "independence",
      targetDescription: "Complete all 4 sections of Bronze DofE",
      startDate: d(120),
      targetDate: fd(45),
      indicators: [
        { id: "ind_4", description: "Sections completed", measureType: "frequency", target: 4, current: 3, trend: "improving", lastUpdated: d(7) },
      ],
      currentStatus: "on_track",
    },
    {
      id: "obj_fam_1",
      title: "Positive weekly contact with mum",
      category: "family_relationships",
      targetDescription: "Weekly phone/video call rated as positive by child",
      startDate: d(45),
      indicators: [
        { id: "ind_5", description: "Positive contacts per month", measureType: "frequency", target: 4, current: 3, trend: "stable", lastUpdated: d(4) },
      ],
      currentStatus: "on_track",
    },
    {
      id: "obj_cook_1",
      title: "Cook 3 meals independently",
      category: "independence",
      targetDescription: "Prepare a full meal from start to finish without staff help",
      startDate: d(30),
      indicators: [
        { id: "ind_6", description: "Independent meals cooked", measureType: "frequency", target: 3, current: 3, trend: "improving", lastUpdated: d(2) },
      ],
      currentStatus: "achieved",
    },
  ];

  const evidence: EvidenceEntry[] = [
    { id: "ev_1", date: d(1), objectiveId: "obj_edu_1", type: "positive", content: "Attended school full day", source: "daily_log" },
    { id: "ev_2", date: d(3), objectiveId: "obj_edu_1", type: "negative", content: "Refused school - low mood", source: "daily_log" },
    { id: "ev_3", date: d(2), objectiveId: "obj_emo_1", type: "positive", content: "Used breathing technique independently when frustrated", source: "daily_log" },
    { id: "ev_4", date: d(5), objectiveId: "obj_emo_1", type: "positive", content: "Walked away from conflict — used safe space", source: "key_work" },
    { id: "ev_5", date: d(7), objectiveId: "obj_ind_1", type: "positive", content: "Completed volunteering section", source: "key_work" },
    { id: "ev_6", date: d(4), objectiveId: "obj_fam_1", type: "positive", content: "Good call with mum - discussed DofE", source: "daily_log" },
    { id: "ev_7", date: d(2), objectiveId: "obj_cook_1", type: "positive", content: "Made pasta bolognese start to finish", source: "daily_log" },
    { id: "ev_8", date: d(6), objectiveId: "obj_emo_1", type: "negative", content: "Incident at bedtime - verbal aggression", source: "incident" },
    { id: "ev_9", date: d(10), objectiveId: "obj_edu_1", type: "positive", content: "School report: good engagement in English", source: "school_report" },
    { id: "ev_10", date: d(14), objectiveId: "obj_fam_1", type: "neutral", content: "Mum cancelled planned call", source: "daily_log" },
  ];

  return { objectives, evidence, childName: childId === "child_jordan" ? "Jordan P" : "Sam W" };
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const childId = req.nextUrl.searchParams.get("childId") ?? "child_jordan";
    const { objectives, evidence, childName } = getDemoData(childId);

    const analysis = trackOutcomes(childId, childName, objectives, evidence);
    return NextResponse.json({ ok: true, data: analysis });
  } catch (err) {
    console.error("[aria/outcome-tracker] GET error:", err);
    return NextResponse.json({ error: "Failed to track outcomes" }, { status: 500 });
  }
}
