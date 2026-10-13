// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO NOTEBOOK — grounded Ask (live-safe)
//
// Reuses the Ask CARA engine (answerQuestion) — deterministic, record-grounded
// Q&A with epistemic labelling (fact / account / analysis / hypothesis / action)
// and per-source citations. answerQuestion takes the snapshot as a parameter, so
// the only work to make it live-safe is feeding it a LIVE-SAFE snapshot.
//
// buildAskSnapshot reads the emptied in-memory store (and getChildTwin), so it is
// empty on a live tenant. buildLiveAskSnapshot instead maps the live-safe dal
// collections into the same AskCaraSnapshot shape; the store-only fields
// (restraints, shifts, supervisions, …) are left EMPTY — honest, never invented.
// The notebook Ask is child-scoped, so those are not central. No LLM layer: the
// deterministic answer stands on its own (the point — it cannot hallucinate).
// ══════════════════════════════════════════════════════════════════════════════

import { dal } from "@/lib/db/dal";
import { todayStr } from "@/lib/utils";
import { answerQuestion } from "@/lib/ask-cara/ask-cara-engine";
import type { AskCaraSnapshot, AskCaraAnswer } from "@/lib/ask-cara/types";

type Row = Record<string, unknown>;
const r = (x: unknown): Row => (x ?? {}) as Row;
const s = (v: unknown): string => (typeof v === "string" ? v : "");
const day = (v: unknown): string => (typeof v === "string" ? v.slice(0, 10) : "");

export async function buildLiveAskSnapshot(): Promise<AskCaraSnapshot> {
  const [childrenRows, staffRows, incidentRows, missingRows, logRows, keyworkRows, riskRows, lacRows] = await Promise.all([
    dal.youngPeople.findAll(),
    dal.staff.findAll(),
    dal.incidents.findAll(),
    dal.missingEpisodes.findAll(),
    dal.dailyLog.findAll(),
    dal.keyWorkingSessions.findAll(),
    dal.riskAssessments.findAll(),
    dal.lacReviews.findAll(),
  ]);

  // Latest upcoming LAC review per child (mirrors build-snapshot).
  const lacNext = new Map<string, string>();
  for (const row of lacRows) {
    const o = r(row);
    const cid = o.child_id ? String(o.child_id) : "";
    const d = day(o.next_review_date ?? o.next_review);
    if (cid && d && (!lacNext.has(cid) || d > lacNext.get(cid)!)) lacNext.set(cid, d);
  }

  return {
    children: childrenRows.map((x) => {
      const c = r(x);
      return {
        id: String(c.id),
        firstName: s(c.preferred_name) || s(c.first_name) || s(c.full_name) || String(c.id),
        name: s(c.full_name) || [c.first_name, c.last_name].filter(Boolean).join(" ") || String(c.id),
        dob: day(c.date_of_birth),
        status: s(c.status) || "current",
        keyWorkerId: s(c.key_worker_id) || s(c.key_worker) || undefined,
        legalStatus: s(c.legal_status) || undefined,
        socialWorker: s(c.social_worker_name) || undefined,
        iro: s(c.iro_name) || undefined,
        school: s(c.school_name) || undefined,
        gp: s(c.gp_name) || undefined,
        allergies: Array.isArray(c.allergies) ? (c.allergies as unknown[]).map(String) : undefined,
        dietary: s(c.dietary_requirements) || undefined,
        placementStart: day(c.placement_start),
        nextReviewDate: lacNext.get(String(c.id)) || undefined,
      };
    }),
    staff: staffRows.map((x) => {
      const o = r(x);
      return { id: String(o.id), name: s(o.full_name) || [o.first_name, o.last_name].filter(Boolean).join(" ") || String(o.id) };
    }),
    incidents: incidentRows.map((x) => {
      const i = r(x);
      return {
        id: String(i.id),
        type: s(i.type) || "other",
        severity: s(i.severity),
        childId: i.child_id ? String(i.child_id) : undefined,
        date: day(i.date),
        status: s(i.status) || "open",
        requiresOversight: !!i.requires_oversight,
        hasOversight: !!(i.oversight_note || i.oversight_by || i.oversight_at),
      };
    }),
    missingEpisodes: missingRows.map((x) => {
      const m = r(x);
      return {
        id: String(m.id),
        date: day(m.date ?? m.reported_at ?? m.created_at),
        childId: m.child_id ? String(m.child_id) : undefined,
        status: s(m.status) || "active",
        hasReturnInterview: !!(m.return_interview_completed || m.has_return_interview),
      };
    }),
    dailyLogs: logRows.map((x) => {
      const l = r(x);
      return { childId: String(l.child_id), date: day(l.date), content: s(l.content), significant: !!l.is_significant };
    }),
    keyWork: keyworkRows.map((x) => {
      const k = r(x);
      return { childId: String(k.child_id), date: day(k.date ?? k.session_date) };
    }),
    reviews: [
      ...riskRows.map((x) => {
        const ra = r(x);
        return { id: String(ra.id), kind: "Risk assessment", childId: ra.child_id ? String(ra.child_id) : undefined, nextReviewDate: day(ra.next_review_date ?? ra.review_date) };
      }),
      ...lacRows.map((x) => {
        const l = r(x);
        return { id: String(l.id), kind: "LAC review", childId: l.child_id ? String(l.child_id) : undefined, nextReviewDate: day(l.next_review_date ?? l.next_review) };
      }),
    ].filter((rv) => rv.nextReviewDate),
    // Store-only on live → empty (honest; the notebook Ask is child-scoped).
    tasks: [],
    restraints: [],
    medications: [],
    shifts: [],
    contacts: [],
    supervisions: [],
    training: [],
  };
}

export async function answerNotebookQuestion(opts: { childId: string; question: string; role?: string }): Promise<AskCaraAnswer> {
  const snapshot = await buildLiveAskSnapshot();
  return answerQuestion({
    question: opts.question,
    asOf: todayStr(),
    role: opts.role,
    snapshot,
    context: { childId: opts.childId },
  });
}
