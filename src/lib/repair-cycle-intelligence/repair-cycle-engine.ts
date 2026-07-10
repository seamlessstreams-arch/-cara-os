// ══════════════════════════════════════════════════════════════════════════════
// CARA — POST-INCIDENT REPAIR CYCLE INTELLIGENCE — pure engine
//
// Tracks whether the therapeutic repair cycle completes after every incident.
//
// The cycle (DDP / rupture-repair principle):
//   1. Incident occurs
//   2. Child-facing debrief happens (within 72h ideally)
//   3. Child perspective captured in debrief
//   4. Lessons learned documented on incident
//   5. Changes needed/follow-up actions recorded
//   6. Staff wellbeing support offered
//
// "When rupture happens in any relationship, the opportunity for repair is
//  therapeutic. The repair teaches the child: relationships survive difficulty."
// — Dan Hughes (DDP)
//
// Per-incident: repair cycle completion score (0–5 steps complete)
// Per-child: what % of their incidents have a complete repair cycle
// Per-home: overall cycle completion rate + most common missing step
//
// All deterministic. No LLM calls. Pure — the store is passed IN, so this is
// fully unit-testable and never touches NextResponse or getStore() itself.
// ══════════════════════════════════════════════════════════════════════════════

import type { getStore } from "@/lib/db/store";

export type RepairCycleStatus = "complete" | "partial" | "missing";

export interface RepairStep {
  id: string;
  label: string;
  complete: boolean;
  note: string;
}

export interface IncidentRepairProfile {
  incidentId: string;
  incidentDate: string;
  incidentType: string;
  incidentSeverity: string;
  childId: string;
  reportedBy: string;
  // Debrief linkage
  hasDebrief: boolean;
  debriefId: string | null;
  debriefDate: string | null;
  debriefTurnaroundDays: number | null;   // days between incident and debrief
  childPerspectiveCaptured: boolean;
  // Incident record completeness
  lessonsLearnedDocumented: boolean;
  // Debrief completeness
  changesNeedDocumented: boolean;
  staffSupportOffered: boolean;
  // Synthesis
  steps: RepairStep[];
  stepsComplete: number;
  totalSteps: number;
  cycleStatus: RepairCycleStatus;
  supervisionPrompt: string;
}

export interface ChildRepairSummary {
  childId: string;
  childName: string;
  totalIncidents: number;
  incidentsWithCompleteRepair: number;
  incidentsWithPartialRepair: number;
  incidentsWithNoRepair: number;
  cycleCompletionRate: number; // 0–100
  mostCommonMissingStep: string | null;
  supervisionPrompt: string;
}

export interface RepairCycleSummary {
  totalIncidents: number;
  incidentsWithDebrief: number;
  incidentsWithLessonsLearned: number;
  incidentsWithChildPerspective: number;
  incidentsWithCompleteRepair: number;
  avgDebriefTurnaroundDays: number | null;
  mostCommonMissingStep: string;
  overallCompletionRate: number; // 0–100
  ofstedNote: string;
}

export interface RepairCycleData {
  incidentProfiles: IncidentRepairProfile[];
  childSummaries: ChildRepairSummary[];
  summary: RepairCycleSummary;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Signed day difference (B − A). Negative means B precedes A — used to detect a
// debrief dated before its own incident, which must not be reported as a 0-day
// turnaround (the old Math.max(0, …) clamp hid that inconsistency).
function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return NaN;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function cycleStatus(stepsComplete: number, total: number): RepairCycleStatus {
  if (stepsComplete === total) return "complete";
  if (stepsComplete >= 1) return "partial";
  return "missing";
}

function incidentSupervisionPrompt(
  type: string,
  severity: string,
  status: RepairCycleStatus,
  missingLabels: string[],
): string {
  if (status === "complete") {
    return `Repair cycle is complete for this ${type.replace(/_/g, " ")} incident. Use as an example of good practice in team meetings.`;
  }
  if (status === "missing") {
    return `No debrief has been completed for this ${severity} ${type.replace(/_/g, " ")} incident. This is a priority: who will lead the debrief, and when?`;
  }
  return `Repair cycle is partially complete. Missing steps: ${missingLabels.join(", ")}. Explore in supervision: what got in the way of completing the cycle?`;
}

function childSupervisionPrompt(
  childName: string,
  rate: number,
  totalIncidents: number,
  noRepair: number,
): string {
  if (totalIncidents === 0) {
    return `${childName} has no incidents recorded. Nothing to review in this domain.`;
  }
  if (rate >= 80) {
    return `${childName}'s repair cycle completion rate is strong (${rate}%). Continue reinforcing the therapeutic culture of repair after difficulty.`;
  }
  if (noRepair > 0) {
    return `${childName} has ${noRepair} incident${noRepair > 1 ? "s" : ""} with no repair cycle completed. Each missed repair is a missed therapeutic opportunity. Prioritise in supervision.`;
  }
  return `${childName}'s repair cycle is ${rate}% complete. Explore what is getting in the way of completing all steps consistently.`;
}

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildRepairCycleIntelligence(store: ReturnType<typeof getStore>): RepairCycleData {
  const incidents = (store.incidents ?? []) as Array<{
    id: string; child_id: string; date: string; type: string;
    severity: string; reported_by: string;
    lessons_learned: string | null;
  }>;

  const debriefRecords = (store.debriefRecords ?? []) as Array<{
    id: string; linked_incident_id: string; child_id: string;
    date: string; child_perspective: string;
    changes_needed: string[]; follow_up_actions: unknown[];
    support_offered: boolean;
    what_could_improve: string;
    lessons_learned: string[];
  }>;

  const youngPeople = (store.youngPeople ?? []) as Array<{
    id: string; first_name: string; last_name: string; status: string;
  }>;

  // ── Index debriefs by incident ────────────────────────────────────────────
  const debriefByIncident = new Map<string, typeof debriefRecords[0]>();
  for (const d of debriefRecords) {
    if (!debriefByIncident.has(d.linked_incident_id)) {
      debriefByIncident.set(d.linked_incident_id, d);
    }
  }

  // ── Index names ───────────────────────────────────────────────────────────
  const nameById = new Map<string, string>();
  for (const yp of youngPeople) {
    nameById.set(yp.id, `${yp.first_name} ${yp.last_name}`);
  }

  // ── Build per-incident profiles ───────────────────────────────────────────
  const TOTAL_STEPS = 5;
  const incidentProfiles: IncidentRepairProfile[] = incidents.map((inc) => {
    const debrief = debriefByIncident.get(inc.id) ?? null;
    const hasDebrief = !!debrief;
    const debriefDate = debrief?.date ?? null;
    // A debrief dated on/after its incident gives a real turnaround; a debrief
    // dated before the incident (data error / mis-linked record) is not a valid
    // 0-day turnaround, so leave it unmeasured rather than skew the home average.
    const rawTurnaround = debriefDate ? daysBetween(inc.date, debriefDate) : null;
    const turnaround = rawTurnaround !== null && Number.isFinite(rawTurnaround) && rawTurnaround >= 0 ? rawTurnaround : null;

    const childPerspective = !!debrief?.child_perspective && debrief.child_perspective.trim().length > 5;
    const lessonsLearned = !!inc.lessons_learned && inc.lessons_learned.trim().length > 5;
    const changesNeeded = (debrief?.changes_needed?.length ?? 0) > 0 || (debrief?.what_could_improve?.trim().length ?? 0) > 5;
    const supportOffered = debrief?.support_offered ?? false;

    const steps: RepairStep[] = [
      { id: "debrief_completed",       label: "Debrief completed",       complete: hasDebrief,         note: hasDebrief ? (turnaround !== null ? `${turnaround} day${turnaround !== 1 ? "s" : ""} after incident` : "Debrief on record") : "No debrief record linked to this incident" },
      { id: "child_perspective",       label: "Child's perspective",      complete: childPerspective,   note: childPerspective ? "Child perspective captured in debrief" : "Child's perspective not documented in debrief" },
      { id: "lessons_learned",         label: "Lessons learned",          complete: lessonsLearned,     note: lessonsLearned ? "Lessons learned documented on incident record" : "Lessons learned field is empty on the incident record" },
      { id: "changes_documented",      label: "Changes identified",       complete: changesNeeded,      note: changesNeeded ? "Changes needed or improvements documented" : "No changes needed or improvements documented in debrief" },
      { id: "staff_support_offered",   label: "Staff wellbeing support",  complete: supportOffered,     note: supportOffered ? "Staff wellbeing support offered" : "Staff wellbeing support not recorded as offered" },
    ];

    const stepsComplete = steps.filter((s) => s.complete).length;
    const status = cycleStatus(stepsComplete, TOTAL_STEPS);
    const missingLabels = steps.filter((s) => !s.complete).map((s) => s.label.toLowerCase());

    return {
      incidentId: inc.id,
      incidentDate: inc.date,
      incidentType: inc.type,
      incidentSeverity: inc.severity,
      childId: inc.child_id,
      reportedBy: inc.reported_by,
      hasDebrief,
      debriefId: debrief?.id ?? null,
      debriefDate,
      debriefTurnaroundDays: turnaround,
      childPerspectiveCaptured: childPerspective,
      lessonsLearnedDocumented: lessonsLearned,
      changesNeedDocumented: changesNeeded,
      staffSupportOffered: supportOffered,
      steps,
      stepsComplete,
      totalSteps: TOTAL_STEPS,
      cycleStatus: status,
      supervisionPrompt: incidentSupervisionPrompt(inc.type, inc.severity, status, missingLabels),
    };
  });

  // ── Per-child summaries ───────────────────────────────────────────────────
  const childIncidentMap = new Map<string, IncidentRepairProfile[]>();
  for (const p of incidentProfiles) {
    const arr = childIncidentMap.get(p.childId) ?? [];
    arr.push(p);
    childIncidentMap.set(p.childId, arr);
  }

  const childSummaries: ChildRepairSummary[] = [];
  for (const [childId, profiles] of childIncidentMap) {
    const name = nameById.get(childId) ?? "Unknown";
    const complete = profiles.filter((p) => p.cycleStatus === "complete").length;
    const partial  = profiles.filter((p) => p.cycleStatus === "partial").length;
    const missing  = profiles.filter((p) => p.cycleStatus === "missing").length;
    const rate = profiles.length > 0 ? Math.round((complete / profiles.length) * 100) : 0;

    // Most common missing step for this child
    const stepCount: Record<string, number> = {};
    for (const p of profiles) {
      for (const s of p.steps) {
        if (!s.complete) stepCount[s.label] = (stepCount[s.label] ?? 0) + 1;
      }
    }
    const topMissing = Object.entries(stepCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    childSummaries.push({
      childId,
      childName: name,
      totalIncidents: profiles.length,
      incidentsWithCompleteRepair: complete,
      incidentsWithPartialRepair: partial,
      incidentsWithNoRepair: missing,
      cycleCompletionRate: rate,
      mostCommonMissingStep: topMissing,
      supervisionPrompt: childSupervisionPrompt(name, rate, profiles.length, missing),
    });
  }
  childSummaries.sort((a, b) => a.cycleCompletionRate - b.cycleCompletionRate);

  // ── Home-level summary ────────────────────────────────────────────────────
  const total = incidentProfiles.length;
  const withDebrief = incidentProfiles.filter((p) => p.hasDebrief).length;
  const withLessons = incidentProfiles.filter((p) => p.lessonsLearnedDocumented).length;
  const withChildPerspective = incidentProfiles.filter((p) => p.childPerspectiveCaptured).length;
  const withCompleteRepair = incidentProfiles.filter((p) => p.cycleStatus === "complete").length;

  const turnaroundValues = incidentProfiles
    .map((p) => p.debriefTurnaroundDays)
    .filter((v): v is number => v !== null);
  const avgTurnaround = turnaroundValues.length > 0
    ? Math.round(turnaroundValues.reduce((s, v) => s + v, 0) / turnaroundValues.length)
    : null;

  const overallRate = total > 0 ? Math.round((withCompleteRepair / total) * 100) : 100;

  // Most common missing step across all incidents
  const allStepCount: Record<string, number> = {};
  for (const p of incidentProfiles) {
    for (const s of p.steps) {
      if (!s.complete) allStepCount[s.label] = (allStepCount[s.label] ?? 0) + 1;
    }
  }
  const topStep = Object.entries(allStepCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";

  const ofstedNote =
    total === 0 ? "No incidents recorded — no repair cycles to review."
    : overallRate >= 80 ? `Post-incident repair cycle is strong (${overallRate}% complete). Staff are consistently following through after difficult events.`
    : withDebrief === 0 ? `No post-incident debriefs found. Ofsted inspectors look specifically at what happens after incidents — this is a development area.`
    : `${overallRate}% of incidents have a complete repair cycle. The most commonly missed step is: ${topStep}.`;

  const summary: RepairCycleSummary = {
    totalIncidents: total,
    incidentsWithDebrief: withDebrief,
    incidentsWithLessonsLearned: withLessons,
    incidentsWithChildPerspective: withChildPerspective,
    incidentsWithCompleteRepair: withCompleteRepair,
    avgDebriefTurnaroundDays: avgTurnaround,
    mostCommonMissingStep: topStep,
    overallCompletionRate: overallRate,
    ofstedNote,
  };

  return {
    incidentProfiles,
    childSummaries,
    summary,
  };
}
