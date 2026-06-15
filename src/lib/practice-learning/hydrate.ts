// ══════════════════════════════════════════════════════════════════════════════
// CARA — Learning Layer · hydration
//
// Pure transform from real records (incidents + their linked debriefs) into the
// LearningInput the engine consumes. Records are injected (no store access) so
// this stays deterministic + testable. Only verified fields are read.
// ══════════════════════════════════════════════════════════════════════════════

import type { LearningInput, LearningEvent } from "./types";

interface IncidentLike {
  id: string;
  type: string;
  date: string;
  description?: string;
  immediate_action?: string;
  outcome?: string | null;
  lessons_learned?: string | null;
  oversight_note?: string | null;
  oversight_by?: string | null;
}
interface DebriefLike {
  linked_incident_id?: string | null;
  what_worked_well?: string;
  what_could_improve?: string;
  lessons_learned?: string[];
  changes_needed?: string[];
}

export interface LearningHydrationArgs {
  scope: "child" | "home";
  childName?: string;
  incidents: IncidentLike[];
  debriefs?: DebriefLike[];
  today: string;
  windowDays?: number;
}

const POSITIVE_OUTCOME = /no injur|settled|safely|resolved|no adverse|no harm|de-?escalat/i;

/** Split a free-text lessons field into discrete items. */
function splitText(s: string | null | undefined): string[] {
  if (!s) return [];
  return s
    .split(/[.\n;]+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 3);
}

function cutoff(today: string, windowDays: number): string {
  const d = new Date(today);
  if (isNaN(d.getTime())) return "0000-00-00";
  d.setDate(d.getDate() - windowDays);
  return d.toISOString().slice(0, 10);
}
const day = (s: string) => (s ?? "").slice(0, 10);

export function buildLearningInput(args: LearningHydrationArgs): LearningInput {
  const windowDays = args.windowDays ?? 180; // learning looks back further than reasoning
  const from = cutoff(args.today, windowDays);
  const inWindow = (date: string) => day(date) >= from && day(date) <= day(args.today);
  const debriefs = args.debriefs ?? [];

  const events: LearningEvent[] = args.incidents
    .filter((i) => inWindow(i.date))
    .sort((a, b) => day(b.date).localeCompare(day(a.date)))
    .map((i) => {
      const linked = debriefs.filter((d) => d.linked_incident_id === i.id);
      const outcome = i.outcome ?? undefined;
      const positive = !!outcome && POSITIVE_OUTCOME.test(outcome);

      const whatWorked = [
        ...linked.map((d) => d.what_worked_well ?? "").filter(Boolean),
        ...(positive ? ["The response achieved a safe resolution (no injury or harm recorded)."] : []),
      ];
      const whatDidntWork = linked.map((d) => d.what_could_improve ?? "").filter(Boolean);
      const lessonsLearned = [...splitText(i.lessons_learned), ...linked.flatMap((d) => d.lessons_learned ?? [])];
      const changesNeeded = linked.flatMap((d) => d.changes_needed ?? []);

      return {
        type: i.type,
        date: day(i.date),
        text: `${i.description ?? ""} ${i.immediate_action ?? ""} ${outcome ?? ""} ${i.oversight_note ?? ""}`.trim(),
        outcome,
        lessonsLearned,
        whatWorked,
        whatDidntWork,
        changesNeeded,
        reviewed: !!i.oversight_by,
      };
    });

  return {
    scope: args.scope,
    childName: args.childName,
    events,
    windowDays,
    today: args.today,
  };
}
