// ══════════════════════════════════════════════════════════════════════════════
// Ask CARA — shared store → snapshot mapper
//
// Maps the in-memory store into the AskCaraSnapshot the deterministic engine
// (answerQuestion) consumes. Shared by the Ask CARA chat route AND the Cara
// workflow-assistant route (/api/v1/cara), so the "assist" mode can answer
// workflow questions deterministically from records when the model is
// unavailable (e.g. exhausted credits) — never a dead end.
// ══════════════════════════════════════════════════════════════════════════════

import { getStore } from "@/lib/db/store";
import type { AskCaraSnapshot } from "@/lib/ask-cara/types";

const day = (v: unknown): string => (typeof v === "string" ? v.slice(0, 10) : "");
const s = (v: unknown): string => (typeof v === "string" ? v : "");

export function buildAskSnapshot(store: ReturnType<typeof getStore>): AskCaraSnapshot {
  const returnInterviews = (store.returnInterviews ?? []) as Array<{ episode_id?: string; missing_episode_id?: string; child_id?: string }>;
  const rec = (c: unknown) => (c ?? []) as Array<Record<string, unknown>>;
  // Earliest upcoming (or most recent) LAC review per child.
  const lacNext = new Map<string, string>();
  for (const r of rec(store.lacReviews)) {
    const cid = r.child_id ? String(r.child_id) : "";
    const d = day(r.next_review_date ?? r.next_review);
    if (cid && d && (!lacNext.has(cid) || d > lacNext.get(cid)!)) lacNext.set(cid, d);
  }
  return {
    children: rec(store.youngPeople).map((c) => ({
      id: String(c.id),
      firstName: s(c.preferred_name) || s(c.first_name) || s(c.full_name) || String(c.id),
      name: s(c.full_name) || [c.first_name, c.last_name].filter(Boolean).join(" ") || String(c.id),
      dob: day(c.date_of_birth),
      status: s(c.status) || "current",
      keyWorkerId: s(c.key_worker_id) || s(c.keyWorkerId) || s(c.key_worker) || undefined,
      legalStatus: s(c.legal_status) || undefined,
      socialWorker: s(c.social_worker_name) || undefined,
      iro: s(c.iro_name) || undefined,
      school: s(c.school_name) || undefined,
      gp: s(c.gp_name) || undefined,
      allergies: Array.isArray(c.allergies) ? (c.allergies as unknown[]).map(String) : undefined,
      dietary: s(c.dietary_requirements) || undefined,
      placementStart: day(c.placement_start),
      nextReviewDate: lacNext.get(String(c.id)) || undefined,
    })),
    staff: rec(store.staff).map((st) => ({ id: String(st.id), name: s(st.full_name) || [st.first_name, st.last_name].filter(Boolean).join(" ") || String(st.id) })),
    incidents: rec(store.incidents).map((i) => ({ id: String(i.id), type: s(i.type) || "other", severity: s(i.severity), childId: i.child_id ? String(i.child_id) : undefined, date: day(i.date), status: s(i.status) || "open", requiresOversight: !!i.requires_oversight, hasOversight: !!(i.oversight_note || i.oversight_by || i.oversight_at) })),
    tasks: rec(store.tasks).map((t) => ({ id: String(t.id), title: s(t.title) || "Action", dueDate: day(t.due_date), status: s(t.status), childId: t.linked_child_id ? String(t.linked_child_id) : undefined })),
    restraints: rec(store.restraints).map((r) => ({ id: String(r.id), date: day(r.date ?? r.created_at), childId: r.child_id ? String(r.child_id) : undefined, childDebriefed: !!r.child_debriefed })),
    missingEpisodes: rec(store.missingEpisodes).map((m) => ({ id: String(m.id), date: day(m.date ?? m.reported_at), childId: m.child_id ? String(m.child_id) : undefined, status: s(m.status) || "active", hasReturnInterview: returnInterviews.some((ri) => ri.episode_id === m.id || ri.missing_episode_id === m.id || (!!m.child_id && ri.child_id === m.child_id)) })),
    dailyLogs: rec(store.dailyLog).map((l) => ({ childId: String(l.child_id), date: day(l.date), content: s(l.content), significant: !!l.is_significant })),
    medications: rec(store.medications).map((m) => ({ id: String(m.id), childId: m.child_id ? String(m.child_id) : undefined, name: s(m.name) })),
    reviews: [
      ...rec(store.riskAssessments).map((r) => ({ id: String(r.id), kind: "Risk assessment", childId: r.child_id ? String(r.child_id) : undefined, nextReviewDate: day(r.next_review_date ?? r.review_date) })),
      ...rec(store.lacReviews).map((r) => ({ id: String(r.id), kind: "LAC review", childId: r.child_id ? String(r.child_id) : undefined, nextReviewDate: day(r.next_review_date ?? r.next_review) })),
    ].filter((r) => r.nextReviewDate),
    shifts: rec((store as Record<string, unknown>).shifts).map((sh) => ({ id: String(sh.id), staffId: String(sh.staff_id), date: day(sh.date), shiftType: s(sh.shift_type) || undefined })),
    keyWork: rec((store as Record<string, unknown>).keyWorkingSessions).map((k) => ({ childId: String(k.child_id), date: day(k.date ?? k.session_date) })),
    home: (() => {
      const h = (store as Record<string, unknown>).home as Record<string, unknown> | undefined;
      return h ? { name: s(h.name) || undefined, maxBeds: typeof h.max_beds === "number" ? h.max_beds : undefined, currentOccupancy: typeof h.current_occupancy === "number" ? h.current_occupancy : undefined } : undefined;
    })(),
    contacts: rec((store as Record<string, unknown>).professionalNetworkContacts).map((c) => ({ childId: String(c.child_id), role: s(c.role), name: s(c.name), organisation: s(c.organisation) || undefined, phone: s(c.phone) || undefined })),
    supervisions: [
      ...rec(store.supervisions).map((sv) => ({ staffId: String(sv.staff_id), date: day(sv.actual_date ?? sv.scheduled_date), nextDate: day(sv.next_date) || undefined, status: s(sv.status) || undefined })),
      ...rec((store as Record<string, unknown>).reflectiveSupervisions).map((sv) => ({ staffId: String(sv.staff_id), date: day(sv.date), nextDate: day(sv.follow_up_date) || undefined, status: "reflective" })),
    ].filter((sv) => sv.staffId && sv.date),
    training: rec(store.trainingRecords).map((t) => ({ staffId: String(t.staff_id), course: s(t.course_name) || "Training", expiryDate: day(t.expiry_date) || undefined, status: s(t.status) || undefined, mandatory: !!t.is_mandatory })),
    policies: rec((store as Record<string, unknown>).homePolicies).map((p) => ({
      id: String(p.id),
      title: s(p.title) || s(p.name) || String(p.id),
      category: s(p.category) || "general",
      description: s(p.description) || undefined,
      keyPoints: Array.isArray(p.key_points) ? (p.key_points as unknown[]).map(String) : undefined,
      statutoryBasis: s(p.statutory_basis) || undefined,
      linkedStandard: s(p.linked_standard) || undefined,
      status: s(p.status) || undefined,
      lastReviewed: day(p.last_reviewed) || undefined,
      nextReviewDate: day(p.next_review_date) || undefined,
    })),
  };
}
