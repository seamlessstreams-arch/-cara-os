import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import type { IncidentReflection, PostIncidentReflectionAnalysis, SignalColour } from "@/lib/cara-visual-toolkit/types";

export const dynamic = "force-dynamic";

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.round(Math.abs(d1 - d2) / 86_400_000);
}

function toArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string" && val.trim()) return [val];
  return [];
}

export async function GET() {
  const [debriefRecordsList, incidentsList] = await Promise.all([
      dal.debriefRecords.findAll(),
      dal.incidents.findAll(),
    ]);
  const incidents = (incidentsList as any[]) ?? [];
  const debriefRecords = (debriefRecordsList as any[]) ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Index debriefs by linked_incident_id
  const debriefByIncident = new Map<string, any>();
  for (const d of debriefRecords) {
    if (d.linked_incident_id) {
      debriefByIncident.set(d.linked_incident_id, d);
    }
  }

  const reflections: IncidentReflection[] = incidents
    .map((inc: any) => {
      const debrief = debriefByIncident.get(inc.id) ?? null;
      const incDate: string = inc.date ?? "";
      const debriefDate: string | null = debrief?.date ?? null;
      const daysToDebrief =
        incDate && debriefDate ? daysBetween(incDate, debriefDate) : null;

      return {
        incidentId: inc.id,
        incidentRef: inc.reference ?? inc.id,
        incidentDate: incDate,
        incidentType: inc.type ?? "unknown",
        severity: inc.severity ?? "unknown",
        hasDebrief: !!debrief,
        debriefDate,
        daysToDebrief,
        whatHappened: debrief?.what_happened ?? null,
        whatWorkedWell: debrief?.what_worked_well ?? null,
        whatCouldImprove: debrief?.what_could_improve ?? null,
        staffWellbeing: debrief?.staff_wellbeing ?? null,
        childPerspective: debrief?.child_perspective ?? null,
        lessonsLearned: debrief?.lessons_learned ?? null,
        changesNeeded: debrief?.changes_needed ?? null,
        followUpActions: toArray(debrief?.follow_up_actions),
      } satisfies IncidentReflection;
    })
    .sort((a: IncidentReflection, b: IncidentReflection) =>
      b.incidentDate.localeCompare(a.incidentDate)
    );

  const withDebrief = reflections.filter((r) => r.hasDebrief);
  const rate =
    incidents.length > 0
      ? Math.round((withDebrief.length / incidents.length) * 100)
      : null;

  const debriefTimes = withDebrief
    .filter((r) => r.daysToDebrief !== null)
    .map((r) => r.daysToDebrief as number);
  const avgDaysToDebrief =
    debriefTimes.length > 0
      ? Math.round(debriefTimes.reduce((a, b) => a + b, 0) / debriefTimes.length)
      : null;

  const overdueDebriefs = reflections.filter(
    (r) =>
      !r.hasDebrief &&
      r.incidentDate &&
      daysBetween(today, r.incidentDate) > 7
  ).length;

  const noChildVoice = withDebrief.filter(
    (r) => !r.childPerspective || r.childPerspective.trim() === ""
  ).length;

  const insights: string[] = [];
  if ((rate ?? 0) < 50 && incidents.length > 0) {
    insights.push(
      `Only ${rate}% of incidents have a completed debrief. Reflective practice after incidents is essential for team learning and Reg 34 compliance.`
    );
  }
  if (avgDaysToDebrief !== null && avgDaysToDebrief > 5) {
    insights.push(
      `Average time to debrief is ${avgDaysToDebrief} days. Best practice is within 48–72 hours while recollections are fresh and staff wellbeing can be assessed.`
    );
  }
  if (overdueDebriefs > 0) {
    insights.push(
      `${overdueDebriefs} incident${overdueDebriefs > 1 ? "s are" : " is"} overdue a debrief (more than 7 days since the incident with no reflection recorded).`
    );
  }
  if (noChildVoice > 0 && withDebrief.length > 0) {
    insights.push(
      `${noChildVoice} debrief${noChildVoice > 1 ? "s do" : " does"} not record the child's perspective. Including the child's voice in post-incident reflection strengthens trauma-informed practice.`
    );
  }
  if ((rate ?? 0) >= 80 && overdueDebriefs === 0 && incidents.length > 0) {
    insights.push(
      `Strong reflective culture — ${rate}% of incidents have been debriefed with no outstanding overdue reflections. Ensure learning from debriefs is fed back into practice.`
    );
  }

  const overallSignal: SignalColour =
    overdueDebriefs >= 3 || ((rate ?? 0) < 30 && incidents.length > 3)
      ? "red"
      : overdueDebriefs > 0 || (rate ?? 0) < 60
      ? "amber"
      : "green";

  const result: PostIncidentReflectionAnalysis = {
    totalIncidents: incidents.length,
    incidentsWithDebrief: withDebrief.length,
    debriefCompletionRate: rate,
    avgDaysToDebrief,
    overdueDebriefs,
    reflections,
    insights,
    overallSignal,
    regulatoryNote:
      "CHR 2015 Regulation 34 requires that staff are supported following physical interventions. Debriefing is the primary mechanism for both staff wellbeing and organisational learning after significant incidents.",
  };

  return NextResponse.json({ data: result });
}
