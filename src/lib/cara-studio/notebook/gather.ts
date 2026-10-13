// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO NOTEBOOK — live-safe gather
//
// Reads a child's record spine through the dal accessors that carry a live
// (Supabase) branch, so the notebook works on a LIVE tenant where the in-memory
// store is emptied. It maps drift-prone DB rows into the lean, pure
// NotebookInput the briefing builder consumes. The ONLY impure layer.
// ══════════════════════════════════════════════════════════════════════════════

import { dal } from "@/lib/db/dal";
import { todayStr } from "@/lib/utils";
import type { NotebookInput } from "./notebook-briefing";
import { buildNotebookTimeline } from "./notebook-timeline";
import type { RelationalTimeline } from "@/lib/relational-timeline/relational-timeline-engine";

type Row = Record<string, unknown>;
const r = (x: unknown): Row => (x ?? {}) as Row;
const s = (v: unknown): string => (typeof v === "string" ? v : "");
const day = (...vals: unknown[]): string | undefined => {
  for (const v of vals) if (typeof v === "string" && v.length >= 10) return v.slice(0, 10);
  return undefined;
};

/** Gather a child's live-safe record spine. Returns null if the child is not
 *  found (the route turns that into a 404). */
export async function gatherNotebookData(childId: string): Promise<NotebookInput | null> {
  const childRow = await dal.youngPeople.findById(childId);
  if (!childRow) return null;
  const c = r(childRow);

  const [incidents, missing, dailyLogs, keywork, education, lacReviews, riskAssessments] = await Promise.all([
    dal.incidents.findAll({ child_id: childId }),
    dal.missingEpisodes.findAll({ child_id: childId }),
    dal.dailyLog.findAll({ child_id: childId }),
    dal.keyWorkingSessions.findAll({ child_id: childId }),
    dal.educationRecords.findAll({ child_id: childId }),
    dal.lacReviews.findAll({ child_id: childId }),
    dal.riskAssessments.findAll({ child_id: childId }),
  ]);

  const firstName = s(c.preferred_name) || s(c.first_name) || s(c.full_name) || childId;
  const name = s(c.full_name) || [c.first_name, c.last_name].filter(Boolean).join(" ") || firstName;

  return {
    child: { id: childId, name, firstName, dob: day(c.date_of_birth) },
    todayIso: todayStr(),
    incidents: incidents.map((x) => { const o = r(x); return { id: String(o.id), type: s(o.type) || "other", severity: s(o.severity) || "", status: s(o.status) || undefined, date: day(o.date, o.created_at) }; }),
    missing: missing.map((x) => { const o = r(x); return { id: String(o.id), status: s(o.status) || undefined, date: day(o.date, o.date_missing, o.missing_episode_date, o.reported_at, o.created_at) }; }),
    dailyLogs: dailyLogs.map((x) => { const o = r(x); return { id: String(o.id), content: s(o.content), significant: !!o.is_significant, date: day(o.date, o.created_at) }; }),
    keywork: keywork.map((x) => { const o = r(x); return { id: String(o.id), topic: s(o.topic) || undefined, date: day(o.date, o.session_date, o.created_at) }; }),
    education: education.map((x) => { const o = r(x); return { id: String(o.id), date: day(o.date, o.created_at) }; }),
    lacReviews: lacReviews.map((x) => { const o = r(x); return { id: String(o.id), nextReviewDate: day(o.next_review_date, o.next_review) }; }),
    riskAssessments: riskAssessments.map((x) => { const o = r(x); return { id: String(o.id), nextReviewDate: day(o.next_review_date, o.review_date) }; }),
  };
}

/** Gather a child's live-safe relational timeline (reuses the pure engine).
 *  Returns null if the child is not found. */
export async function gatherNotebookTimeline(childId: string): Promise<RelationalTimeline | null> {
  const childRow = await dal.youngPeople.findById(childId);
  if (!childRow) return null;
  const c = r(childRow);

  const [keywork, incidents, missing, education, lac, staff] = await Promise.all([
    dal.keyWorkingSessions.findAll({ child_id: childId }),
    dal.incidents.findAll({ child_id: childId }),
    dal.missingEpisodes.findAll({ child_id: childId }),
    dal.educationRecords.findAll({ child_id: childId }),
    dal.lacReviews.findAll({ child_id: childId }),
    dal.staff.findAll(),
  ]);

  const staffMap = new Map<string, string>();
  for (const st of staff) {
    const o = r(st);
    staffMap.set(String(o.id), s(o.full_name) || [o.first_name, o.last_name].filter(Boolean).join(" ") || String(o.id));
  }
  const name = s(c.full_name) || [c.first_name, c.last_name].filter(Boolean).join(" ") || s(c.preferred_name) || s(c.first_name) || childId;

  return buildNotebookTimeline({
    childId,
    childName: name,
    now: new Date().toISOString(),
    keyWorkingSessions: keywork,
    incidents,
    missingEpisodes: missing,
    educationRecords: education,
    lacReviews: lac,
    trustedAdults: [],
    staffName: (id) => staffMap.get(id) ?? id,
  });
}
