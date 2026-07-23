// ══════════════════════════════════════════════════════════════════════════════
// CARA VISUAL TOOLKIT — LESSONS LEARNED TRACKER
// GET /api/v1/cara-toolkit/lessons-learned
//
// Surfaces learning from incidents, Reg 44 visit reports, physical
// interventions, and safeguarding events. Tracks whether learning led to
// action and whether action led to change.
// CHR 2015 Reg 37 (records), Reg 45 (quality review), Ofsted SCCIF.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { below, meets, rateOf } from "@/lib/metrics/rate";
import type {
  LessonsLearnedAnalysis,
  LessonRecord,
  LessonSource,
  LessonTheme,
  SignalColour,
  ActionStatus,
} from "@/lib/cara-visual-toolkit/types";

const THEME_LABELS: Record<LessonTheme, string> = {
  safeguarding:         "Safeguarding",
  behaviour_support:    "Behaviour support",
  medication_management:"Medication management",
  staffing_oversight:   "Staffing and oversight",
  communication:        "Communication",
  environment_safety:   "Environment and safety",
  child_rights_voice:   "Child rights and voice",
  staff_practice:       "Staff practice",
  other:                "Other",
};

const SOURCE_LABELS: Record<LessonSource, string> = {
  incident:             "Incident",
  physical_intervention:"Physical intervention",
  safeguarding:         "Safeguarding event",
  medication_error:     "Medication error",
  reg44_visit:          "Reg 44 visit",
  supervision:          "Supervision",
  debrief:              "Staff debrief",
  complaint:            "Complaint",
  other:                "Other",
};

function classifyIncidentTheme(type: string): LessonTheme {
  const map: Record<string, LessonTheme> = {
    physical_intervention: "behaviour_support",
    safeguarding_concern:  "safeguarding",
    medication_error:      "medication_management",
    complaint:             "child_rights_voice",
    missing_from_care:     "safeguarding",
    behaviour:             "behaviour_support",
    self_harm:             "safeguarding",
    injury:                "environment_safety",
  };
  return map[type] ?? "other";
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function childInitials(yp: any): string {
  const first = yp?.first_name?.[0] ?? "";
  const last  = yp?.last_name?.[0] ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const incidents       = (store.incidents as any[]) ?? [];
  const reg44Reports    = (store.reg44VisitReports as any[]) ?? [];
  const supervisions    = (store.reflectiveSupervisions as any[]) ?? [];
  const youngPeople     = (store.youngPeople as any[]) ?? [];

  const ypMap = new Map(youngPeople.map((yp: any) => [yp.id, yp]));

  const lessons: LessonRecord[] = [];
  let idxCounter = 1;

  // ── Extract lessons from incidents ───────────────────────────────────────

  for (const inc of incidents) {
    const hasLesson  = inc.lessons_learned && String(inc.lessons_learned).trim().length > 0;
    const hasOversight = inc.oversight_note && String(inc.oversight_note).trim().length > 0;

    if (!hasLesson && !hasOversight) continue;

    const source: LessonSource =
      inc.type === "physical_intervention" ? "physical_intervention" :
      inc.type === "safeguarding_concern"  ? "safeguarding" :
      inc.type === "medication_error"      ? "medication_error" :
      inc.type === "complaint"             ? "complaint" :
      "incident";

    const theme = classifyIncidentTheme(inc.type ?? "other");
    const yp    = ypMap.get(inc.child_id);

    // Determine action status from oversight_by / oversight_at
    let actionStatus: ActionStatus | null = null;
    let actionDescription: string | null = null;
    if (hasLesson) {
      actionDescription = String(inc.lessons_learned);
      actionStatus      = inc.oversight_by ? "completed" : "not_started";
    }

    lessons.push({
      id: `lesson_inc_${idxCounter++}`,
      date: String(inc.date ?? "").slice(0, 10),
      source,
      sourceLabel: SOURCE_LABELS[source],
      theme,
      themeLabel: THEME_LABELS[theme],
      summary: inc.oversight_note
        ? String(inc.oversight_note).slice(0, 200)
        : `Incident recorded — ${inc.type ?? "unknown type"}. Reference: ${inc.reference ?? inc.id}.`,
      lessonLearned: hasLesson
        ? String(inc.lessons_learned)
        : "Learning not yet recorded for this incident. Add the lesson to support team improvement.",
      actionRequired: hasLesson || hasOversight,
      actionDescription,
      actionStatus,
      actionOwner: inc.oversight_by ?? null,
      actionDueDate: null,
      evidenceOfChange: inc.status === "closed" ? "Incident closed — review oversight note for evidence of change." : null,
      childId:      inc.child_id ?? null,
      childInitials: yp ? childInitials(yp) : null,
      sharedWithTeam: inc.status === "closed",
      managerReviewed: !!inc.oversight_by,
    });
  }

  // ── Extract lessons from Reg 44 recommendations ───────────────────────────

  for (const report of reg44Reports) {
    const recs: any[] = report.recommendations ?? [];
    for (const rec of recs) {
      if (!rec.recommendation) continue;

      const dueDate = rec.completed_at
        ? String(rec.completed_at).slice(0, 10)
        : null;

      const isOverdue =
        rec.status !== "completed" &&
        dueDate !== null &&
        daysBetween(dueDate, today) > 0;

      const actionStatus: ActionStatus =
        rec.status === "completed"
          ? "completed"
          : isOverdue
          ? "overdue"
          : "in_progress";

      lessons.push({
        id: `lesson_r44_${idxCounter++}`,
        date: String(report.visit_date ?? "").slice(0, 10),
        source: "reg44_visit",
        sourceLabel: SOURCE_LABELS["reg44_visit"],
        theme: "staffing_oversight",
        themeLabel: THEME_LABELS["staffing_oversight"],
        summary: `Reg 44 visit by ${report.visitor ?? "Independent Visitor"} — overall judgement: ${report.overall_judgement ?? "not recorded"}.`,
        lessonLearned: String(rec.recommendation),
        actionRequired: true,
        actionDescription: rec.rm_response ?? null,
        actionStatus,
        actionOwner: "Registered Manager",
        actionDueDate: dueDate,
        evidenceOfChange:
          rec.evidence_notes && String(rec.evidence_notes).trim().length > 0
            ? String(rec.evidence_notes)
            : null,
        childId: null,
        childInitials: null,
        sharedWithTeam: actionStatus === "completed",
        managerReviewed: true,
      });
    }

    // Extract areas for development as lessons too
    for (const area of report.areas_for_development ?? []) {
      if (!area || String(area).trim().length === 0) continue;
      lessons.push({
        id: `lesson_r44dev_${idxCounter++}`,
        date: String(report.visit_date ?? "").slice(0, 10),
        source: "reg44_visit",
        sourceLabel: SOURCE_LABELS["reg44_visit"],
        theme: "staffing_oversight",
        themeLabel: THEME_LABELS["staffing_oversight"],
        summary: `Reg 44 area for development identified by ${report.visitor ?? "Independent Visitor"}.`,
        lessonLearned: String(area),
        actionRequired: true,
        actionDescription: null,
        actionStatus: "not_started",
        actionOwner: "Registered Manager",
        actionDueDate: null,
        evidenceOfChange: null,
        childId: null,
        childInitials: null,
        sharedWithTeam: false,
        managerReviewed: true,
      });
    }
  }

  // ── Extract learning from supervision records ─────────────────────────────

  for (const sup of supervisions) {
    const needs: string[] = sup.training_needs ?? [];
    if (needs.length === 0) continue;

    lessons.push({
      id: `lesson_sup_${idxCounter++}`,
      date: String(sup.date ?? "").slice(0, 10),
      source: "supervision",
      sourceLabel: SOURCE_LABELS["supervision"],
      theme: "staff_practice",
      themeLabel: THEME_LABELS["staff_practice"],
      summary: `Supervision with ${sup.staff_name ?? sup.staff_id}: training needs identified.`,
      lessonLearned: `Training needs identified: ${needs.join("; ")}.`,
      actionRequired: true,
      actionDescription: `Arrange training in: ${needs.join(", ")}.`,
      actionStatus: "not_started",
      actionOwner: "Registered Manager",
      actionDueDate: null,
      evidenceOfChange: null,
      childId: null,
      childInitials: null,
      sharedWithTeam: false,
      managerReviewed: true,
    });
  }

  // Sort newest first
  lessons.sort((a, b) => String(b.date).localeCompare(String(a.date)));

  // ── Summary stats ─────────────────────────────────────────────────────────

  const withActions = lessons.filter((l) => l.actionRequired);
  const completed   = lessons.filter((l) => l.actionStatus === "completed");
  const overdue     = lessons.filter((l) => l.actionStatus === "overdue");
  const open        = lessons.filter(
    (l) => l.actionStatus === "not_started" || l.actionStatus === "in_progress"
  );

  // No lesson carries an action, so there is nothing to have completed.
  const completionRate = rateOf(completed, withActions);

  // Theme breakdown
  const themeCount: Record<string, number> = {};
  for (const l of lessons) {
    themeCount[l.theme] = (themeCount[l.theme] ?? 0) + 1;
  }
  const themeBreakdown = Object.entries(themeCount)
    .map(([theme, count]) => ({
      theme: theme as LessonTheme,
      label: THEME_LABELS[theme as LessonTheme] ?? theme,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Source breakdown
  const srcCount: Record<string, number> = {};
  for (const l of lessons) {
    srcCount[l.source] = (srcCount[l.source] ?? 0) + 1;
  }
  const sourceBreakdown = Object.entries(srcCount)
    .map(([source, count]) => ({
      source: source as LessonSource,
      label: SOURCE_LABELS[source as LessonSource] ?? source,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Insights
  const insights: string[] = [];

  if (overdue.length > 0) {
    insights.push(
      `${overdue.length} action${overdue.length > 1 ? "s are" : " is"} overdue. Overdue actions from learning events suggest that learning is not being converted into change. The registered manager should review these and either complete the action or document the reason for delay.`
    );
  }
  if (open.length > 0) {
    insights.push(
      `${open.length} action${open.length > 1 ? "s are" : " is"} yet to be started or completed. Add a target date, named owner, and evidence of completion to close the learning loop.`
    );
  }
  if (below(completionRate, 50) && withActions.length >= 3) {
    insights.push(
      `Action completion rate is ${completionRate}%. This suggests that learning is being identified but not consistently converted into change. Review whether actions are realistic, time-bound, and ownership is clear.`
    );
  }
  if (meets(completionRate, 80) && withActions.length >= 3) {
    insights.push(
      `Action completion rate is ${completionRate}%. This is a positive indicator that learning from incidents and reviews is being followed through. Continue to document evidence of change alongside each completed action.`
    );
  }

  const physicalCount = lessons.filter((l) => l.source === "physical_intervention").length;
  if (physicalCount >= 2) {
    insights.push(
      `${physicalCount} lessons from physical interventions recorded. Review whether these share a common trigger, time pattern, or child — and whether the learning has been reflected in behaviour support plans.`
    );
  }

  const r44Overdue = lessons.filter(
    (l) => l.source === "reg44_visit" && l.actionStatus === "overdue"
  ).length;
  if (r44Overdue > 0) {
    insights.push(
      `${r44Overdue} Reg 44 recommendation${r44Overdue > 1 ? "s are" : " is"} overdue. Reg 44 actions are visible to Ofsted. Ensure these are completed with documented evidence before the next inspection or visit.`
    );
  }

  if (lessons.length === 0) {
    insights.push(
      "No learning records found. Ensure that incidents, Reg 44 visits, and supervision records include recorded lessons learned and linked actions."
    );
  }

  // Overall signal
  let overallSignal: SignalColour = completionRate === null ? "grey" : "green";
  if (overdue.length >= 3 || r44Overdue > 0) overallSignal = "red";
  else if (overdue.length > 0 || open.length >= 3 || below(completionRate, 50)) overallSignal = "amber";

  const result: LessonsLearnedAnalysis = {
    totalLessons: lessons.length,
    lessonsWithActions: withActions.length,
    completedActions: completed.length,
    overdueActions: overdue.length,
    openActions: open.length,
    actionCompletionRate: completionRate,
    themeBreakdown,
    sourceBreakdown,
    lessons,
    insights,
    overallSignal,
    regulatoryNote:
      "CHR 2015 Reg 45 requires the responsible individual to review the quality of care and learning from events. Lessons learned should be shared with the team, linked to practice changes, and evidenced for Ofsted inspection. An action completion rate below 80% may suggest learning is not being embedded.",
  };

  return NextResponse.json({ data: result });
}
