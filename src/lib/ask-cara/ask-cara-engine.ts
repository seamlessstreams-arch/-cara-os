// ══════════════════════════════════════════════════════════════════════════════
// CARA — ASK CARA (deterministic Q&A engine)
//
// answerQuestion(query) classifies a question to an intent and answers it from a
// STORE SNAPSHOT — no LLM, no network. Every fact comes from the snapshot; when
// Cara can't answer it says so and shows what it can. Pure + deterministic.
// ══════════════════════════════════════════════════════════════════════════════

import { mentionsAny } from "@/lib/text/keyword-match";
import { classifyProhibited } from "./prohibited-request-classifier";
import { findSubstitution } from "./shadow-ai-substitution-matrix";
import { answerPolicyQuestion } from "./policy-guidance-engine";
import { answerPracticeQuestion, looksLikePracticeQuestion, mentionsFramework } from "./practice-knowledge";
import {
  ASK_CARA_VERSION,
  type AccessTier,
  type AskCaraAnswer,
  type AskCaraChild,
  type AskCaraChildEvaluation,
  type AskCaraQuery,
  type AskCaraSnapshot,
  type AskCaraSource,
  type AskCaraSuggestion,
  type AskCaraTraining,
} from "./types";

const DISCLAIMER = "Cara answers from your live records to support your judgement — it never makes a safeguarding decision for you.";

// ── Role-based access ─────────────────────────────────────────────────────────
// Answers are scoped to who's asking. Care staff get everything about the children
// and the day's work; staff-management and governance data is management-only.
const MANAGEMENT_ROLES = new Set(["registered_manager", "deputy_manager", "responsible_individual", "org_director", "area_manager", "platform_admin"]);
const CARE_ROLES = new Set([...MANAGEMENT_ROLES, "residential_care_worker", "senior_residential_care_worker", "senior_residential_worker", "team_leader", "bank_worker", "support_worker", "waking_night_worker"]);
const TIER_RANK: Record<AccessTier, number> = { everyone: 0, care_team: 1, management: 2 };

function roleTier(role?: string): AccessTier {
  const r = (role ?? "").toLowerCase();
  if (!r) return "care_team"; // demo default — operational Q&A works; management still gated
  if (MANAGEMENT_ROLES.has(r)) return "management";
  if (CARE_ROLES.has(r)) return "care_team";
  return "everyone";
}

const TIER_LABEL: Record<AccessTier, string> = { everyone: "general", care_team: "care-team", management: "management" };

// Space-form so they match a type whose underscores have been normalised to spaces.
const SAFEGUARDING_TYPES = ["missing from care", "allegation", "disclosure", "self harm", "self-harm", "safeguarding", "exploitation", "cse", "cce", "online", "abuse"];

function daysBetween(a: string, b: string): number {
  const t = Date.parse(a);
  const n = Date.parse(b);
  if (Number.isNaN(t) || Number.isNaN(n)) return Number.POSITIVE_INFINITY;
  return Math.round((n - t) / 86_400_000);
}
const withinDays = (dateStr: string, asOf: string, n: number): boolean => {
  const d = daysBetween(dateStr, asOf);
  return d >= 0 && d <= n;
};

function ageFrom(dob: string | undefined, asOf: string): number | null {
  if (!dob) return null;
  const b = new Date(dob);
  const a = new Date(asOf);
  if (Number.isNaN(b.getTime()) || Number.isNaN(a.getTime())) return null;
  let age = a.getFullYear() - b.getFullYear();
  const m = a.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && a.getDate() < b.getDate())) age--;
  return age >= 0 && age < 120 ? age : null;
}

/** Time window from the wording; defaults to 30 days. */
function windowFromQuestion(q: string): { days: number; label: string } {
  if (mentionsAny(q, ["today"])) return { days: 1, label: "today" };
  if (mentionsAny(q, ["this week", "week", "7 days", "seven days"])) return { days: 7, label: "this week" };
  if (mentionsAny(q, ["this year", "year"])) return { days: 365, label: "this year" };
  if (mentionsAny(q, ["quarter", "90 days", "3 months", "three months"])) return { days: 90, label: "this quarter" };
  return { days: 30, label: "in the last 30 days" };
}

const childLabel = (c: AskCaraChild): string => c.firstName || c.name || c.id;

function resolveChild(q: string, snap: AskCaraSnapshot, contextChildId?: string): AskCaraChild | null {
  // Name in the question wins (word-boundary), else the page's child context.
  for (const c of snap.children) {
    const terms = [c.firstName, c.name].filter((t): t is string => !!t && t.length >= 2);
    if (terms.length && mentionsAny(q, terms)) return c;
  }
  if (contextChildId) return snap.children.find((c) => c.id === contextChildId) ?? null;
  return null;
}

const staffName = (snap: AskCaraSnapshot, id?: string): string => (id ? snap.staff.find((s) => s.id === id)?.name ?? "not recorded" : "not recorded");

function answer(partial: Omit<AskCaraAnswer, "engineVersion" | "disclaimer"> & { disclaimer?: string }): AskCaraAnswer {
  return { disclaimer: DISCLAIMER, engineVersion: ASK_CARA_VERSION, ...partial };
}

const sug = (labels: string[]): AskCaraSuggestion[] => labels.map((label) => ({ label }));

const STARTERS = sug([
  "What needs my attention today?",
  "How many incidents this week?",
  "Which restraints have no debrief?",
  "Who is currently placed here?",
]);

// ── Intent skills ─────────────────────────────────────────────────────────────

function skillGreeting(userName?: string): AskCaraAnswer {
  const name = userName?.trim() ? userName.trim().split(/\s+/)[0] : "there";
  return answer({
    intent: "greeting",
    answered: true,
    text: `Hi ${name} — I'm Cara. I can answer questions straight from this home's records: incidents, the children placed here, what needs your attention, restraints and debriefs, missing episodes, medication and overdue actions. Ask me anything, or start with one of these.`,
    sources: [],
    suggestions: STARTERS,
  });
}

function skillChildSummary(child: AskCaraChild, snap: AskCaraSnapshot, asOf: string): AskCaraAnswer {
  const name = childLabel(child);
  const age = ageFrom(child.dob, asOf);
  const incidents = snap.incidents.filter((i) => i.childId === child.id);
  const recentInc = incidents.filter((i) => withinDays(i.date, asOf, 30));
  const openInc = recentInc.filter((i) => i.status !== "closed" && i.status !== "resolved");
  const restraints = snap.restraints.filter((r) => r.childId === child.id && withinDays(r.date, asOf, 30));
  const restraintsNoDebrief = restraints.filter((r) => !r.childDebriefed);
  const missing = snap.missingEpisodes.filter((m) => m.childId === child.id && withinDays(m.date, asOf, 30));
  const logs = snap.dailyLogs.filter((l) => l.childId === child.id).sort((a, b) => (a.date < b.date ? 1 : -1));
  const openTasks = snap.tasks.filter((t) => t.childId === child.id && t.status !== "completed" && t.status !== "cancelled");

  const lines: string[] = [];
  const bio = [age !== null ? `${age} years old` : null, child.legalStatus ? child.legalStatus : null].filter(Boolean).join(", ");
  lines.push(`${name}${bio ? ` — ${bio}` : ""}. Key worker: ${staffName(snap, child.keyWorkerId)}.`);
  const network = [child.socialWorker ? `social worker ${child.socialWorker}` : null, child.iro ? `IRO ${child.iro}` : null, child.school ? `school ${child.school}` : null].filter(Boolean);
  if (network.length) lines.push(`Around ${name}: ${network.join("; ")}.`);
  if (child.allergies && child.allergies.length) lines.push(`⚠ Allergies: ${child.allergies.join(", ")}.`);
  lines.push(`In the last 30 days: ${recentInc.length} incident${recentInc.length === 1 ? "" : "s"} (${openInc.length} still open), ${restraints.length} restraint${restraints.length === 1 ? "" : "s"}, ${missing.length} missing episode${missing.length === 1 ? "" : "s"}.`);
  if (restraintsNoDebrief.length > 0) lines.push(`⚠ ${restraintsNoDebrief.length} restraint${restraintsNoDebrief.length === 1 ? " has" : "s have"} no recorded child debrief — the repair conversation is outstanding.`);
  if (openTasks.length > 0) lines.push(`${openTasks.length} open action${openTasks.length === 1 ? "" : "s"} linked to ${name}.`);
  if (child.nextReviewDate) {
    const d = daysBetween(asOf, child.nextReviewDate);
    lines.push(d >= 0 ? `Next LAC review: ${child.nextReviewDate}${d <= 14 ? " (within a fortnight)" : ""}.` : `⚠ LAC review overdue (was due ${child.nextReviewDate}).`);
  }
  lines.push(logs[0] ? `Latest daily log: ${logs[0].date}.` : `No daily log on record for ${name}.`);

  // Leg three: the evaluation engines' read — assessment, not just a tally.
  const ev = evalFor(snap, child.id);
  if (ev && (ev.outcome || ev.relational || ev.emotional)) {
    lines.push("", "My read from the engines:");
    if (ev.outcome) lines.push(`- Direction of travel: ${ev.outcome.trajectory}${ev.outcome.focus.length ? ` — needs focus on ${ev.outcome.focus.join(", ").toLowerCase()}` : ""}.`);
    if (ev.relational) lines.push(`- Relationships: ${ev.relational.status}${ev.relational.trustedAdults.length ? ` (trusted adults: ${ev.relational.trustedAdults.slice(0, 2).join(", ")})` : ""}.`);
    if (ev.emotional) lines.push(`- Emotional safety: ${ev.emotional.status}${ev.emotional.topTriggers[0] ? ` — main trigger: ${ev.emotional.topTriggers[0].toLowerCase()}` : ""}.`);
  }

  return answer({
    intent: "child_summary",
    answered: true,
    text: lines.join("\n"),
    sources: [
      { label: "Incidents (30d)", count: recentInc.length },
      { label: "Restraints (30d)", count: restraints.length },
      { label: "Open actions", count: openTasks.length },
    ],
    suggestions: sug([`What triggers ${name}?`, `Show ${name}'s open incidents`, `Does ${name} have restraints without a debrief?`]),
  });
}

function skillAttention(snap: AskCaraSnapshot, asOf: string): AskCaraAnswer {
  const overdueTasks = snap.tasks.filter((t) => t.dueDate && daysBetween(t.dueDate, asOf) > 0 && t.status !== "completed" && t.status !== "cancelled");
  const missingOversight = snap.incidents.filter((i) => i.requiresOversight && !i.hasOversight && i.status !== "closed");
  const restraintGaps = snap.restraints.filter((r) => !r.childDebriefed);
  const missingRHI = snap.missingEpisodes.filter((m) => !m.hasReturnInterview);
  const overdueReviews = snap.reviews.filter((r) => r.nextReviewDate && daysBetween(r.nextReviewDate, asOf) > 0);

  const lines: string[] = [];
  const nameFor = (id?: string) => (id ? childLabel(snap.children.find((c) => c.id === id) ?? ({ id } as AskCaraChild)) : "");
  if (restraintGaps.length) lines.push(`- ${restraintGaps.length} restraint${restraintGaps.length === 1 ? "" : "s"} with no child debrief (safeguarding-critical repair gap).`);
  if (missingOversight.length) lines.push(`- ${missingOversight.length} incident${missingOversight.length === 1 ? "" : "s"} awaiting management oversight.`);
  if (missingRHI.length) lines.push(`- ${missingRHI.length} missing episode${missingRHI.length === 1 ? "" : "s"} with no return home interview.`);
  if (overdueTasks.length) lines.push(`- ${overdueTasks.length} overdue action${overdueTasks.length === 1 ? "" : "s"}${overdueTasks[0] ? ` (e.g. "${overdueTasks[0].title}")` : ""}.`);
  if (overdueReviews.length) lines.push(`- ${overdueReviews.length} overdue review${overdueReviews.length === 1 ? "" : "s"}.`);

  // Leg three: children the evaluation engines say need a closer look — not a
  // compliance gap, but the practitioner's scan of the home.
  const evs = snap.evaluations ?? [];
  const concern = evs.filter((e) => e.emotional?.status === "concern").map((e) => nameFor(e.childId)).filter(Boolean);
  const fragile = evs.filter((e) => e.relational?.status === "fragile").map((e) => nameFor(e.childId)).filter(Boolean);
  const declining = evs.filter((e) => e.outcome?.trajectory === "declining").map((e) => nameFor(e.childId)).filter(Boolean);
  if (concern.length) lines.push(`- Emotional safety is a concern for ${concern.join(", ")} (engine read — see their triggers).`);
  if (fragile.length) lines.push(`- Relationships look fragile for ${fragile.join(", ")} — the connection work is the priority.`);
  if (declining.length) lines.push(`- Direction of travel is declining for ${declining.join(", ")}.`);

  const total = restraintGaps.length + missingOversight.length + missingRHI.length + overdueTasks.length + overdueReviews.length + concern.length + fragile.length + declining.length;
  const text = total === 0
    ? "Nothing is outstanding in the records right now — no overdue actions, missing oversight, restraint repair gaps or missing return interviews. Keep going."
    : `Here's what the records say needs you, most safeguarding-critical first:\n${lines.join("\n")}`;

  return answer({
    intent: "attention",
    answered: true,
    text,
    sources: [
      { label: "Restraint repair gaps", count: restraintGaps.length },
      { label: "Awaiting oversight", count: missingOversight.length },
      { label: "Overdue actions", count: overdueTasks.length },
    ],
    suggestions: sug(["Which restraints have no debrief?", "How many incidents this week?", "What's overdue?"]),
  });
}

function skillIncidents(q: string, snap: AskCaraSnapshot, asOf: string, child: AskCaraChild | null): AskCaraAnswer {
  const win = windowFromQuestion(q);
  let list = snap.incidents.filter((i) => withinDays(i.date, asOf, win.days));
  if (child) list = list.filter((i) => i.childId === child.id);
  const high = list.filter((i) => ["high", "critical", "serious"].includes((i.severity ?? "").toLowerCase()));
  const byType = new Map<string, number>();
  for (const i of list) byType.set(i.type, (byType.get(i.type) ?? 0) + 1);
  const topType = [...byType.entries()].sort((a, b) => b[1] - a[1])[0];
  const who = child ? ` for ${childLabel(child)}` : "";
  const text = list.length === 0
    ? `No incidents recorded${who} ${win.label}.`
    : `${list.length} incident${list.length === 1 ? "" : "s"}${who} ${win.label} — ${high.length} high or critical.${topType ? ` Most common: ${topType[0].replace(/_/g, " ")} (${topType[1]}).` : ""}`;
  return answer({
    intent: "incidents",
    answered: true,
    text,
    sources: [{ label: `Incidents (${win.label})`, count: list.length }],
    suggestions: sug(["What needs my attention?", "Which restraints have no debrief?", child ? `Tell me about ${childLabel(child)}` : "Any open safeguarding concerns?"]),
  });
}

function skillMissing(q: string, snap: AskCaraSnapshot, asOf: string, child: AskCaraChild | null): AskCaraAnswer {
  const win = windowFromQuestion(q);
  let list = snap.missingEpisodes.filter((m) => withinDays(m.date, asOf, win.days));
  if (child) list = list.filter((m) => m.childId === child.id);
  const noRHI = list.filter((m) => !m.hasReturnInterview);
  const active = list.filter((m) => (m.status ?? "").toLowerCase() === "active" || (m.status ?? "").toLowerCase() === "open");
  const text = list.length === 0
    ? `No missing-from-care episodes recorded ${win.label}${child ? ` for ${childLabel(child)}` : ""}.`
    : `${list.length} missing episode${list.length === 1 ? "" : "s"} ${win.label}${child ? ` for ${childLabel(child)}` : ""}${active.length ? `, ${active.length} still active` : ""}. ${noRHI.length ? `${noRHI.length} still need a return home interview.` : "All have a return home interview recorded."}`;
  return answer({
    intent: "missing",
    answered: true,
    text,
    sources: [{ label: `Missing episodes (${win.label})`, count: list.length }, { label: "No return interview", count: noRHI.length }],
    suggestions: sug(["What needs my attention?", "How many incidents this week?"]),
  });
}

function skillRestraints(q: string, snap: AskCaraSnapshot, asOf: string, child: AskCaraChild | null): AskCaraAnswer {
  const win = windowFromQuestion(q);
  const onlyGaps = mentionsAny(q, ["no debrief", "without debrief", "not debriefed", "missing debrief", "no repair", "outstanding"]);
  let list = snap.restraints.filter((r) => withinDays(r.date, asOf, win.days));
  if (child) list = list.filter((r) => r.childId === child.id);
  const gaps = list.filter((r) => !r.childDebriefed);
  if (onlyGaps) {
    const text = gaps.length === 0
      ? `Every restraint ${win.label}${child ? ` for ${childLabel(child)}` : ""} has a recorded child debrief.`
      : `${gaps.length} restraint${gaps.length === 1 ? "" : "s"} ${win.label}${child ? ` for ${childLabel(child)}` : ""} ha${gaps.length === 1 ? "s" : "ve"} no child debrief recorded — the repair conversation is outstanding and safeguarding-critical.`;
    return answer({ intent: "restraints", answered: true, text, sources: [{ label: "Restraints with no debrief", count: gaps.length }], suggestions: sug(["What needs my attention?", "How many restraints this month?"]) });
  }
  const text = list.length === 0
    ? `No restraints recorded ${win.label}${child ? ` for ${childLabel(child)}` : ""}.`
    : `${list.length} restraint${list.length === 1 ? "" : "s"} ${win.label}${child ? ` for ${childLabel(child)}` : ""}. ${gaps.length ? `${gaps.length} still ha${gaps.length === 1 ? "s" : "ve"} no child debrief recorded.` : "All have a child debrief recorded."}`;
  return answer({ intent: "restraints", answered: true, text, sources: [{ label: `Restraints (${win.label})`, count: list.length }, { label: "No debrief", count: gaps.length }], suggestions: sug(["Which restraints have no debrief?", "What needs my attention?"]) });
}

function skillOverdue(snap: AskCaraSnapshot, asOf: string): AskCaraAnswer {
  const overdue = snap.tasks.filter((t) => t.dueDate && daysBetween(t.dueDate, asOf) > 0 && t.status !== "completed" && t.status !== "cancelled").sort((a, b) => daysBetween(b.dueDate, asOf) - daysBetween(a.dueDate, asOf));
  const text = overdue.length === 0
    ? "Nothing is overdue — every action is on track."
    : `${overdue.length} overdue action${overdue.length === 1 ? "" : "s"}. The most overdue:\n${overdue.slice(0, 5).map((t) => `- "${t.title}" (${daysBetween(t.dueDate, asOf)} day${daysBetween(t.dueDate, asOf) === 1 ? "" : "s"} late)`).join("\n")}`;
  return answer({ intent: "overdue_tasks", answered: true, text, sources: [{ label: "Overdue actions", count: overdue.length }], suggestions: sug(["What needs my attention?", "Any incidents awaiting oversight?"]) });
}

function skillMedication(snap: AskCaraSnapshot, asOf: string, child: AskCaraChild | null): AskCaraAnswer {
  let meds = snap.medications;
  if (child) meds = meds.filter((m) => m.childId === child.id);
  const childrenOn = new Set(meds.map((m) => m.childId).filter(Boolean)).size;
  const medErrors = snap.incidents.filter((i) => (i.type ?? "").toLowerCase().includes("medication") && withinDays(i.date, asOf, 30));
  const text = meds.length === 0
    ? `No medications on record${child ? ` for ${childLabel(child)}` : ""}.`
    : `${meds.length} medication${meds.length === 1 ? "" : "s"} on record${child ? ` for ${childLabel(child)}` : `, across ${childrenOn} child${childrenOn === 1 ? "" : "ren"}`}. ${medErrors.length ? `${medErrors.length} medication-related incident${medErrors.length === 1 ? "" : "s"} in the last 30 days.` : "No medication incidents in the last 30 days."}`;
  return answer({ intent: "medication", answered: true, text, sources: [{ label: "Medications", count: meds.length }, { label: "Med incidents (30d)", count: medErrors.length }], suggestions: sug(["What needs my attention?", "How many incidents this week?"]) });
}

function skillSafeguarding(snap: AskCaraSnapshot, asOf: string): AskCaraAnswer {
  const open = snap.incidents.filter((i) => i.status !== "closed" && i.status !== "resolved" && mentionsAny((i.type ?? "").replace(/_/g, " "), SAFEGUARDING_TYPES));
  const children = new Set(open.map((i) => i.childId).filter(Boolean));
  const text = open.length === 0
    ? "No open safeguarding-type incidents in the records right now. Keep the wider picture under review — absence of a logged concern isn't the same as no risk."
    : `${open.length} open safeguarding-type incident${open.length === 1 ? "" : "s"} affecting ${children.size} child${children.size === 1 ? "" : "ren"}. These need your professional judgement — Cara surfaces them, it doesn't decide.`;
  return answer({ intent: "safeguarding", answered: true, text, sources: [{ label: "Open safeguarding incidents", count: open.length }], suggestions: sug(["What needs my attention?", "Which restraints have no debrief?"]) });
}

function skillChildrenList(snap: AskCaraSnapshot): AskCaraAnswer {
  const current = snap.children.filter((c) => (c.status ?? "current") === "current");
  const names = current.map(childLabel).sort();
  const text = current.length === 0
    ? "No children are currently recorded as placed here."
    : `${current.length} young ${current.length === 1 ? "person is" : "people are"} currently placed here: ${names.join(", ")}.`;
  return answer({ intent: "children_list", answered: true, text, sources: [{ label: "Current young people", count: current.length }], suggestions: sug(names[0] ? [`Tell me about ${names[0]}`, "What needs my attention?"] : ["What needs my attention?"]) });
}

function skillStaffing(snap: AskCaraSnapshot, asOf: string): AskCaraAnswer {
  const today = snap.shifts.filter((sh) => sh.date === asOf);
  const names = today.map((sh) => snap.staff.find((st) => st.id === sh.staffId)?.name ?? sh.staffId);
  const uniq = [...new Set(names)];
  const text = today.length === 0
    ? "No shifts are recorded for today. Check the rota if that looks wrong."
    : `${uniq.length} staff member${uniq.length === 1 ? "" : "s"} on shift today: ${uniq.join(", ")}.`;
  return answer({ intent: "staffing", answered: true, text, sources: [{ label: "Shifts today", count: today.length }], suggestions: sug(["What needs my attention?", "Who is placed here?"]) });
}

function skillKeyWork(snap: AskCaraSnapshot, asOf: string, child: AskCaraChild | null): AskCaraAnswer {
  if (child) {
    const sessions = snap.keyWork.filter((k) => k.childId === child.id).sort((a, b) => (a.date < b.date ? 1 : -1));
    const recent = sessions.filter((k) => withinDays(k.date, asOf, 30));
    const last = sessions[0];
    const text = sessions.length === 0
      ? `No key-work sessions on record for ${childLabel(child)}.`
      : `${childLabel(child)} has had ${recent.length} key-work session${recent.length === 1 ? "" : "s"} in the last 30 days. Most recent: ${last.date} (${daysBetween(last.date, asOf)} day${daysBetween(last.date, asOf) === 1 ? "" : "s"} ago).`;
    return answer({ intent: "key_work", answered: true, text, sources: [{ label: "Key-work (30d)", count: recent.length }], suggestions: sug([`Tell me about ${childLabel(child)}`, "What needs my attention?"]) });
  }
  // Home rollup — who hasn't had key work recently.
  const overdue = snap.children
    .filter((c) => (c.status ?? "current") === "current")
    .map((c) => ({ c, last: snap.keyWork.filter((k) => k.childId === c.id).map((k) => k.date).sort().slice(-1)[0] }))
    .filter((x) => !x.last || daysBetween(x.last, asOf) > 14);
  const text = overdue.length === 0
    ? "Every child has had a key-work session in the last two weeks."
    : `${overdue.length} child${overdue.length === 1 ? "" : "ren"} ${overdue.length === 1 ? "hasn't" : "haven't"} had a key-work session in over two weeks: ${overdue.map((x) => childLabel(x.c)).join(", ")}.`;
  return answer({ intent: "key_work", answered: true, text, sources: [{ label: "Key-work gaps (>14d)", count: overdue.length }], suggestions: sug(["What needs my attention?", "Who is placed here?"]) });
}

function skillEvents(snap: AskCaraSnapshot, asOf: string, child: AskCaraChild | null): AskCaraAnswer {
  let logs = snap.dailyLogs.filter((l) => l.significant);
  if (child) logs = logs.filter((l) => l.childId === child.id);
  logs = logs.filter((l) => withinDays(l.date, asOf, 7)).sort((a, b) => (a.date < b.date ? 1 : -1));
  const nameFor = (id: string) => childLabel(snap.children.find((c) => c.id === id) ?? ({ id } as AskCaraChild));
  const text = logs.length === 0
    ? `Nothing flagged as significant in the daily logs${child ? ` for ${childLabel(child)}` : ""} in the last 7 days.`
    : `${logs.length} significant daily-log entr${logs.length === 1 ? "y" : "ies"} in the last 7 days:\n${logs.slice(0, 5).map((l) => `- ${child ? l.date : `${nameFor(l.childId)}, ${l.date}`}: ${l.content.slice(0, 120)}${l.content.length > 120 ? "…" : ""}`).join("\n")}`;
  return answer({ intent: "events", answered: true, text, sources: [{ label: "Significant logs (7d)", count: logs.length }], suggestions: sug(child ? [`Tell me about ${childLabel(child)}`, "What needs my attention?"] : ["What needs my attention?", "How many incidents this week?"]) });
}

function denied(needed: AccessTier): AskCaraAnswer {
  return answer({
    intent: "access_denied",
    answered: false,
    text: `That's ${TIER_LABEL[needed]}-level information, so I can't share it at your access level — please ask your manager. I can still help you with the children you work with, the day's actions, and reflection.`,
    sources: [],
    suggestions: sug(["What needs my attention?", "Help me reflect on a child", "Who is placed here?"]),
  });
}

function skillReflector(snap: AskCaraSnapshot, asOf: string, child: AskCaraChild | null): AskCaraAnswer {
  if (child) {
    const inc = snap.incidents.filter((i) => i.childId === child.id && withinDays(i.date, asOf, 30));
    const restraints = snap.restraints.filter((r) => r.childId === child.id && withinDays(r.date, asOf, 30));
    const name = childLabel(child);
    const context = `${name} has had ${inc.length} incident${inc.length === 1 ? "" : "s"}${restraints.length ? ` and ${restraints.length} restraint${restraints.length === 1 ? "" : "s"}` : ""} in the last 30 days.`;
    const lines = [
      `Let's reflect on your practice with ${name}. ${inc.length + restraints.length > 0 ? context : `There's little on record for ${name} recently — that itself is worth noticing.`}`,
      "",
      `- What do you think sits underneath ${name}'s behaviour — what might they be trying to tell us?`,
      `- What would ${name} say helps them feel safe and settled? Is their voice in the record?`,
      "- Whose perspective is missing here — the child's, a colleague's, a family member's?",
      "- What went well that you could do more of, deliberately?",
      "- What's one thing you'd do differently, and what would you need to do it?",
    ];
    return answer({ intent: "reflector", answered: true, text: lines.join("\n"), sources: [{ label: "Incidents (30d)", count: inc.length }, { label: "Restraints (30d)", count: restraints.length }], suggestions: sug([`Tell me about ${name}`, `What triggers ${name}?`, "What needs my attention?"]), disclaimer: "These are reflective prompts to think alongside — not judgements. There are no wrong answers; the point is to notice." });
  }
  const lines = [
    "Let's reflect together. Take a moment with these — there are no wrong answers:",
    "",
    "- What happened, and what were you feeling at the time?",
    "- What went well? What was hardest?",
    "- Whose voice is missing from how this has been recorded?",
    "- What might you be assuming that you haven't checked?",
    "- What does the child need next — and what do you need to do it well?",
    "- What's one thing you'll carry into your next shift?",
  ];
  return answer({ intent: "reflector", answered: true, text: lines.join("\n"), sources: [], suggestions: sug(["Help me reflect on Alex", "What needs my attention?"]), disclaimer: "Reflective prompts to think alongside — not judgements. Good reflection is a strength, not a sign anything went wrong." });
}

function skillShiftBrief(snap: AskCaraSnapshot, asOf: string): AskCaraAnswer {
  const onShift = [...new Set(snap.shifts.filter((sh) => sh.date === asOf).map((sh) => snap.staff.find((st) => st.id === sh.staffId)?.name ?? sh.staffId))];
  const restraintGaps = snap.restraints.filter((r) => !r.childDebriefed);
  const oversight = snap.incidents.filter((i) => i.requiresOversight && !i.hasOversight && i.status !== "closed");
  const rhiGaps = snap.missingEpisodes.filter((m) => !m.hasReturnInterview);
  const overdue = snap.tasks.filter((t) => t.dueDate && daysBetween(t.dueDate, asOf) > 0 && t.status !== "completed" && t.status !== "cancelled");
  const sig = snap.dailyLogs.filter((l) => l.significant && withinDays(l.date, asOf, 2));

  const lines: string[] = ["Here's your shift brief from the records:"];
  lines.push(onShift.length ? `- On shift today: ${onShift.join(", ")}.` : "- No staff recorded on shift today — check the rota.");
  if (restraintGaps.length) lines.push(`- Watch: ${restraintGaps.length} restraint${restraintGaps.length === 1 ? "" : "s"} still need${restraintGaps.length === 1 ? "s" : ""} a child debrief.`);
  if (oversight.length) lines.push(`- ${oversight.length} incident${oversight.length === 1 ? "" : "s"} awaiting manager oversight.`);
  if (rhiGaps.length) lines.push(`- ${rhiGaps.length} missing episode${rhiGaps.length === 1 ? "" : "s"} still need a return home interview.`);
  if (sig.length) lines.push(`- Recent significant event${sig.length === 1 ? "" : "s"}: ${sig.slice(0, 3).map((l) => l.content.slice(0, 80)).join(" · ")}`);
  if (overdue.length) lines.push(`- ${overdue.length} action${overdue.length === 1 ? "" : "s"} overdue.`);
  if (lines.length === 1) lines.push("- Nothing outstanding flagged. Have a good shift.");

  return answer({ intent: "shift_brief", answered: true, text: lines.join("\n"), sources: [{ label: "On shift", count: onShift.length }, { label: "To watch", count: restraintGaps.length + oversight.length + rhiGaps.length }], suggestions: sug(["What needs my attention?", "Anything significant happen this week?", "Who is placed here?"]) });
}

function skillWhatsDue(snap: AskCaraSnapshot, asOf: string): AskCaraAnswer {
  const overdueTasks = snap.tasks.filter((t) => t.dueDate && daysBetween(t.dueDate, asOf) > 0 && t.status !== "completed" && t.status !== "cancelled");
  const dueSoonTasks = snap.tasks.filter((t) => t.dueDate && daysBetween(asOf, t.dueDate) >= 0 && daysBetween(asOf, t.dueDate) <= 7 && t.status !== "completed" && t.status !== "cancelled");
  const overdueReviews = snap.reviews.filter((r) => daysBetween(r.nextReviewDate, asOf) > 0);
  const dueSoonReviews = snap.reviews.filter((r) => daysBetween(asOf, r.nextReviewDate) >= 0 && daysBetween(asOf, r.nextReviewDate) <= 14);

  const lines: string[] = [];
  if (overdueTasks.length) lines.push(`- ${overdueTasks.length} action${overdueTasks.length === 1 ? "" : "s"} overdue.`);
  if (dueSoonTasks.length) lines.push(`- ${dueSoonTasks.length} action${dueSoonTasks.length === 1 ? "" : "s"} due within 7 days.`);
  if (overdueReviews.length) lines.push(`- ${overdueReviews.length} review${overdueReviews.length === 1 ? "" : "s"} overdue (${overdueReviews.map((r) => r.kind.toLowerCase()).slice(0, 3).join(", ")}).`);
  if (dueSoonReviews.length) lines.push(`- ${dueSoonReviews.length} review${dueSoonReviews.length === 1 ? "" : "s"} due within a fortnight.`);
  const text = lines.length === 0 ? "Nothing is due or overdue in the next couple of weeks — you're on top of it." : `Here's what's due:\n${lines.join("\n")}`;
  return answer({ intent: "whats_due", answered: true, text, sources: [{ label: "Overdue", count: overdueTasks.length + overdueReviews.length }, { label: "Due soon", count: dueSoonTasks.length + dueSoonReviews.length }], suggestions: sug(["What's overdue?", "What needs my attention?"]) });
}

function skillHomeOverview(snap: AskCaraSnapshot, asOf: string): AskCaraAnswer {
  const current = snap.children.filter((c) => (c.status ?? "current") === "current").length;
  const beds = snap.home?.maxBeds;
  const occ = snap.home?.currentOccupancy ?? current;
  const incMonth = snap.incidents.filter((i) => withinDays(i.date, asOf, 30)).length;
  const restraintGaps = snap.restraints.filter((r) => !r.childDebriefed).length;
  const restraintsMonth = snap.restraints.filter((r) => withinDays(r.date, asOf, 30)).length;
  const rhiGaps = snap.missingEpisodes.filter((m) => !m.hasReturnInterview).length;
  const oversight = snap.incidents.filter((i) => i.requiresOversight && !i.hasOversight && i.status !== "closed").length;
  const overdue = snap.tasks.filter((t) => t.dueDate && daysBetween(t.dueDate, asOf) > 0 && t.status !== "completed" && t.status !== "cancelled").length;

  const text = [
    `${snap.home?.name || "The home"} — ${occ}${beds ? `/${beds}` : ""} place${occ === 1 ? "" : "s"} filled.`,
    `Last 30 days: ${incMonth} incident${incMonth === 1 ? "" : "s"}, ${restraintsMonth} restraint${restraintsMonth === 1 ? "" : "s"} (${restraintGaps} without a debrief).`,
    `Outstanding: ${oversight} incident${oversight === 1 ? "" : "s"} awaiting oversight, ${rhiGaps} missing return interview${rhiGaps === 1 ? "" : "s"}, ${overdue} overdue action${overdue === 1 ? "" : "s"}.`,
  ].join("\n");
  return answer({ intent: "home_overview", answered: true, text, sources: [{ label: "Occupancy", count: occ }, { label: "Incidents (30d)", count: incMonth }, { label: "Awaiting oversight", count: oversight }], suggestions: sug(["What needs my attention?", "Who's overdue supervision?", "How many incidents this week?"]) });
}

const ROLE_LABEL: Record<string, string> = { social_worker: "Social worker", iro: "IRO", camhs: "CAMHS", education: "Education", police: "Police", yot: "YOT / youth justice", gp: "GP", advocate: "Advocate" };
const roleLabel = (r: string): string => ROLE_LABEL[r.toLowerCase()] ?? (r.charAt(0).toUpperCase() + r.slice(1).replace(/_/g, " "));

function skillContacts(q: string, snap: AskCaraSnapshot, child: AskCaraChild | null): AskCaraAnswer {
  if (!child) {
    return answer({ intent: "contacts", answered: false, text: "Tell me which child, and I'll give you their professional contacts — e.g. \"who is Alex's social worker?\"", sources: [], suggestions: sug(snap.children.slice(0, 3).map((c) => `Who is ${childLabel(c)}'s social worker?`)) });
  }
  const name = childLabel(child);
  const network = snap.contacts.filter((c) => c.childId === child.id);
  // Also fold in the profile-level social worker / IRO if not already in the network list.
  const lines: string[] = [];
  if (child.socialWorker) lines.push(`- Social worker: ${child.socialWorker}`);
  if (child.iro) lines.push(`- IRO: ${child.iro}`);
  if (child.gp) lines.push(`- GP: ${child.gp}`);
  for (const c of network) {
    if (child.socialWorker && c.role.toLowerCase() === "social_worker") continue;
    if (child.iro && c.role.toLowerCase() === "iro") continue;
    lines.push(`- ${roleLabel(c.role)}: ${c.name}${c.organisation ? ` (${c.organisation})` : ""}${c.phone ? ` · ${c.phone}` : ""}`);
  }
  const text = lines.length === 0 ? `No professional contacts on record for ${name} yet.` : `${name}'s professional network:\n${lines.join("\n")}`;
  return answer({ intent: "contacts", answered: true, text, sources: [{ label: "Contacts", count: lines.length }], suggestions: sug([`Tell me about ${name}`, `What needs my attention?`]) });
}

function skillSupervision(snap: AskCaraSnapshot, asOf: string): AskCaraAnswer {
  const byStaff = new Map<string, string>(); // staffId → latest supervision date
  for (const s of snap.supervisions) {
    const prev = byStaff.get(s.staffId);
    if (!prev || s.date > prev) byStaff.set(s.staffId, s.date);
  }
  // Overdue = an explicit next date in the past, OR no supervision in 6 weeks (42d).
  const overdueByNext = snap.supervisions.filter((s) => s.nextDate && daysBetween(s.nextDate, asOf) > 0);
  const staleStaff = snap.staff.filter((st) => {
    const last = byStaff.get(st.id);
    return !last || daysBetween(last, asOf) > 42;
  });
  const names = [...new Set([...overdueByNext.map((s) => staffName(snap, s.staffId)), ...staleStaff.map((s) => s.name)])].filter((n) => n && n !== "not recorded");
  const text = names.length === 0
    ? "Everyone's supervision looks up to date — no one is overdue or without a recent session."
    : `${names.length} staff member${names.length === 1 ? " is" : "s are"} due or overdue supervision: ${names.slice(0, 8).join(", ")}. Supervision is a support, not a tick-box — worth prioritising.`;
  return answer({ intent: "supervision", answered: true, text, sources: [{ label: "Due/overdue supervision", count: names.length }], suggestions: sug(["Who's overdue training?", "How is the home doing?"]) });
}

function skillTraining(snap: AskCaraSnapshot, asOf: string): AskCaraAnswer {
  const expired = snap.training.filter((t) => t.status === "expired" || (t.expiryDate && daysBetween(t.expiryDate, asOf) > 0 && t.status !== "not_started"));
  const expiring = snap.training.filter((t) => t.status === "expiring_soon");
  const notStarted = snap.training.filter((t) => t.status === "not_started" && t.mandatory);
  const staffFor = (recs: AskCaraTraining[]) => [...new Set(recs.map((t) => `${staffName(snap, t.staffId)} (${t.course})`))];

  const lines: string[] = [];
  if (expired.length) lines.push(`- ${expired.length} expired: ${staffFor(expired).slice(0, 5).join("; ")}`);
  if (expiring.length) lines.push(`- ${expiring.length} expiring soon: ${staffFor(expiring).slice(0, 5).join("; ")}`);
  if (notStarted.length) lines.push(`- ${notStarted.length} mandatory not started: ${staffFor(notStarted).slice(0, 5).join("; ")}`);
  const text = lines.length === 0 ? "Training compliance looks good — nothing expired, expiring, or mandatory-not-started on record." : `Training that needs attention:\n${lines.join("\n")}`;
  return answer({ intent: "training", answered: true, text, sources: [{ label: "Expired", count: expired.length }, { label: "Expiring soon", count: expiring.length }], suggestions: sug(["Who's overdue supervision?", "How is the home doing?"]) });
}

function skillPolicy(q: string, snap: AskCaraSnapshot): AskCaraAnswer {
  const res = answerPolicyQuestion(q, snap.policies ?? []);
  const lines = [res.answer];
  if (res.steps.length) lines.push("", ...res.steps.map((s) => `- ${s}`));
  if (res.source?.statutoryBasis || res.source?.lastReviewed) {
    lines.push("", `Source: ${res.source.title}${res.source.statutoryBasis ? ` · ${res.source.statutoryBasis}` : ""}${res.source.lastReviewed ? ` · last reviewed ${res.source.lastReviewed}` : ""}.`);
  }
  const sources: AskCaraSource[] = res.source ? [{ label: res.source.title, count: 1 }] : [];
  return answer({
    intent: "policy_guidance",
    answered: res.status !== "none",
    text: lines.join("\n"),
    sources,
    suggestions: sug(["What needs my attention?", "Help me record what happened"]),
    disclaimer: "CARA answers policy questions only from your approved internal policies — never the web or an external AI. If there's no approved answer, check with a manager or policy owner.",
  });
}

// ── Evaluation reads (leg three: the platform's own engines) ──────────────────

const evalFor = (snap: AskCaraSnapshot, childId: string): AskCaraChildEvaluation | undefined =>
  (snap.evaluations ?? []).find((e) => e.childId === childId);

const PEAK_LABEL: Record<string, string> = { morning: "in the mornings", afternoon: "in the afternoons", evening: "in the evenings", night: "overnight" };

function needsChild(intent: "child_progress" | "child_triggers" | "child_relationships", snap: AskCaraSnapshot, ask: string): AskCaraAnswer {
  return answer({
    intent, answered: false,
    text: `Tell me which child and I'll give you my read — e.g. "${ask.replace("{name}", childLabel(snap.children[0] ?? ({ id: "Alex", firstName: "Alex", name: "Alex", status: "current" } as AskCaraChild)))}".`,
    sources: [],
    suggestions: sug(snap.children.slice(0, 3).map((c) => ask.replace("{name}", childLabel(c)))),
  });
}

function skillChildProgress(snap: AskCaraSnapshot, child: AskCaraChild | null): AskCaraAnswer {
  // Home rollup when no child named — the manager's scan.
  if (!child) {
    const evs = snap.evaluations ?? [];
    if (!evs.length) return needsChild("child_progress", snap, "how is {name} progressing?");
    const nameOf = (id: string) => childLabel(snap.children.find((c) => c.id === id) ?? ({ id } as AskCaraChild));
    const improving = evs.filter((e) => e.outcome?.trajectory === "improving").map((e) => nameOf(e.childId));
    const declining = evs.filter((e) => e.outcome?.trajectory === "declining").map((e) => nameOf(e.childId));
    const lines = [`My read across the home, from the outcome engine (recent window vs the one before):`];
    if (improving.length) lines.push(`- Improving: ${improving.join(", ")}.`);
    if (declining.length) lines.push(`- Declining — worth your attention: ${declining.join(", ")}.`);
    if (!improving.length && !declining.length) lines.push(`- Everyone is broadly stable — no marked shifts either way.`);
    return answer({ intent: "child_progress", answered: true, text: lines.join("\n"), sources: [{ label: "Outcome intelligence (children evaluated)", count: evs.length }], suggestions: sug(declining[0] ? [`How is ${declining[0]} progressing?`, "What needs my attention?"] : ["What needs my attention?", "How is the home doing?"]) });
  }

  const ev = evalFor(snap, child.id)?.outcome;
  const name = childLabel(child);
  if (!ev) {
    return answer({ intent: "child_progress", answered: false, text: `I don't have enough recorded for ${name} yet to give a fair read on direction — that gap is itself worth noticing.`, sources: [], suggestions: sug([`Tell me about ${name}`, "What needs my attention?"]) });
  }
  const lines = [
    `${ev.headline}`,
    "",
    `Direction of travel: **${ev.trajectory}** (${ev.improving} domain${ev.improving === 1 ? "" : "s"} improving, ${ev.declining} declining).`,
  ];
  if (ev.focus.length) lines.push(`Needs focus: ${ev.focus.join(", ")}.`);
  lines.push("", `That's the records' direction, not a verdict — you know ${name} beyond the data.`);
  return answer({
    intent: "child_progress", answered: true, text: lines.join("\n"),
    sources: [{ label: "Outcome intelligence (domains)", count: 5 }],
    suggestions: sug([`What triggers ${name}?`, `How are ${name}'s relationships?`, `Tell me about ${name}`]),
  });
}

function skillChildTriggers(snap: AskCaraSnapshot, child: AskCaraChild | null): AskCaraAnswer {
  if (!child) return needsChild("child_triggers", snap, "what triggers {name}?");
  const ev = evalFor(snap, child.id)?.emotional;
  const name = childLabel(child);
  if (!ev) {
    return answer({ intent: "child_triggers", answered: false, text: `There isn't enough behaviour/incident recording for ${name} yet for me to read triggers reliably. The PACE profile is the place to capture what the team already knows.`, sources: [], suggestions: sug([`Tell me about ${name}`, "Help me reflect on " + name]) });
  }
  const lines: string[] = [`Emotional safety for ${name}: **${ev.status}** — ${ev.reason}`];
  if (ev.topTriggers.length) {
    lines.push("", "What tends to trigger dysregulation:");
    for (const t of ev.topTriggers) lines.push(`- ${t}`);
  }
  if (ev.whatHelps.length) {
    lines.push("", "What helps them regulate (evidenced in the records):");
    for (const w of ev.whatHelps) lines.push(`- ${w}`);
  }
  const peak = ev.peakTime ? PEAK_LABEL[ev.peakTime] ?? ev.peakTime : null;
  lines.push("", `Escalation trend: ${ev.trend}${peak ? `, clustering ${peak}` : ""}.${peak ? ` Worth planning support around that window.` : ""}`);
  return answer({
    intent: "child_triggers", answered: true, text: lines.join("\n"),
    sources: [{ label: "Emotional safety analysis — triggers", count: ev.topTriggers.length }, { label: "Regulation strategies", count: ev.whatHelps.length }],
    suggestions: sug([`How are ${name}'s relationships?`, `How is ${name} progressing?`, `Help me reflect on ${name}`]),
  });
}

function skillChildRelationships(snap: AskCaraSnapshot, child: AskCaraChild | null): AskCaraAnswer {
  if (!child) return needsChild("child_relationships", snap, "how are {name}'s relationships?");
  const ev = evalFor(snap, child.id)?.relational;
  const name = childLabel(child);
  if (!ev) {
    return answer({ intent: "child_relationships", answered: false, text: `Not enough relational recording for ${name} yet (key work, debriefs, family time) to read the relationships fairly — worth checking that's being captured.`, sources: [], suggestions: sug([`Tell me about ${name}`, "What needs my attention?"]) });
  }
  const lines: string[] = [`Relational safety for ${name}: **${ev.status}** — ${ev.reason}`];
  if (ev.trustedAdults.length) lines.push("", `Trusted adults: ${ev.trustedAdults.join(", ")}.`);
  if (ev.keyConnector) lines.push(`Strongest current connection: ${ev.keyConnector}.`);
  lines.push("", `Last 30 days: ${ev.connections30d} connection moment${ev.connections30d === 1 ? "" : "s"}; ${ev.repairs} repair${ev.repairs === 1 ? "" : "s"} against ${ev.ruptures} rupture${ev.ruptures === 1 ? "" : "s"}.${ev.ruptures > ev.repairs ? " The repair work is behind the ruptures — that's the relationship telling you what it needs." : ""}`);
  return answer({
    intent: "child_relationships", answered: true, text: lines.join("\n"),
    sources: [{ label: "Relational timeline — connections (30d)", count: ev.connections30d }, { label: "Repairs", count: ev.repairs }, { label: "Ruptures", count: ev.ruptures }],
    suggestions: sug([`What triggers ${name}?`, `How is ${name} progressing?`, `Tell me about ${name}`]),
  });
}

// Practice knowledge — answers "how do I / what does this mean / what would good
// look like" from the loaded frameworks (Knowledge Base + practice modules), in a
// practitioner's voice. Returns null when nothing matches with confidence, so the
// engine falls through to records rather than inventing.
function skillPracticeGuidance(rawQuestion: string, child: AskCaraChild | null): AskCaraAnswer | null {
  const pg = answerPracticeQuestion(rawQuestion, { childName: child ? childLabel(child) : undefined });
  if (!pg) return null;
  return answer({
    intent: "practice_guidance",
    answered: true,
    text: pg.text,
    sources: pg.sources,
    suggestions: sug(child ? [`Help me reflect on ${childLabel(child)}`, "What needs my attention?", "Help me record what happened"] : ["Help me reflect on a child", "What needs my attention?", "Help me record what happened"]),
    disclaimer: "Practice guidance from CARA's loaded knowledge base (PACE, DDP, Contextual Safeguarding, the regs…) to think alongside — never the web or an external AI. The decision, and the record, stay yours.",
  });
}

function skillUnknown(): AskCaraAnswer {
  return answer({
    intent: "unknown",
    answered: false,
    text: "I can only answer from what's in your records, and I couldn't map that question to them yet — so I won't guess. Here's what I can answer right now:\n- What needs my attention\n- Incidents (this week / month, or for a child)\n- Restraints and which have no debrief\n- Missing-from-care episodes\n- Medication\n- Overdue actions\n- Open safeguarding concerns\n- Who is placed here, and a summary of any child",
    sources: [],
    suggestions: STARTERS,
  });
}

// ── Classifier + entry ────────────────────────────────────────────────────────

export function answerQuestion(query: AskCaraQuery): AskCaraAnswer {
  const raw = (query.question ?? "").trim();
  const q = raw.toLowerCase();
  const snap = query.snapshot;
  const asOf = query.asOf;
  const child = resolveChild(q, snap, query.context?.childId);

  // Safety first: refuse/escalate a request that asks CARA to decide, diagnose,
  // minimise, protect reputation, fabricate or manipulate a child's account.
  const banned = classifyProhibited(raw);
  if (banned.prohibited) {
    return answer({
      intent: "prohibited",
      answered: false,
      text: banned.safeResponse!,
      sources: [],
      suggestions: sug(["What needs my attention?", "Help me record what happened", "Who do I contact about this?"]),
      disclaimer: "CARA supports your practice — it does not make safeguarding, risk or regulatory decisions. Those stay with you and your manager.",
    });
  }

  // Role-based access: answers are scoped to who is asking.
  const tier = roleTier(query.role);
  const gate = (need: AccessTier, fn: () => AskCaraAnswer): AskCaraAnswer => (TIER_RANK[tier] >= TIER_RANK[need] ? fn() : denied(need));

  // Reflector first — before greeting ("help me reflect" contains "help") and
  // before missing-from-care ("what am I missing").
  if (mentionsAny(q, ["reflect", "reflection", "reflective", "what am i missing", "what might i be missing", "am i missing", "missing anything", "help me think", "challenge me", "supervise me", "what should i consider", "make me think"])) return gate("everyone", () => skillReflector(snap, asOf, child));

  if (!q || (q.length <= 24 && mentionsAny(q, ["hi", "hello", "hey", "help", "what can you do", "who are you", "start"]))) {
    return skillGreeting(query.userName);
  }

  // Handover before attention (so "brief me" isn't caught by "briefing").
  if (mentionsAny(q, ["brief me", "shift brief", "handover", "hand over", "coming on shift", "start of shift", "my shift", "start of my shift", "coming on duty"])) return gate("care_team", () => skillShiftBrief(snap, asOf));

  // Staff supervision / training (management) — before the generic "overdue".
  if (mentionsAny(q, ["supervision", "overdue supervision", "due supervision", "supervisions"])) return gate("management", () => skillSupervision(snap, asOf));
  if (mentionsAny(q, ["training", "certificate", "certificates", "mandatory training", "training compliance", "qualifications overdue"])) return gate("management", () => skillTraining(snap, asOf));

  // Policy questions first — "what does our policy say about missing/restraint/…"
  // must go to policy guidance, not the topic skill for that word.
  if (mentionsAny(q, ["policy", "policies", "procedure", "what does our policy", "which policy", "what's the procedure", "our guidance says", "guidance on"])) return gate("care_team", () => skillPolicy(raw, snap));

  // Evaluation reads (leg three) — a question about a NAMED child's triggers,
  // regulation, relationships or direction goes to the engines' read of THAT
  // child first: the experienced answer starts with your child, not the theory.
  if (child && mentionsAny(q, ["trigger", "triggers", "what helps", "calm", "calms", "calming", "settle", "settles", "regulate", "regulates", "regulation", "dysregulat", "escalation pattern", "escalates", "time of day"])) {
    return gate("care_team", () => skillChildTriggers(snap, child));
  }
  if (child && mentionsAny(q, ["relationship", "relationships", "trusted adult", "trusted adults", "connection", "connections", "bond", "trust", "getting on with", "attachment to", "attachment with"])) {
    return gate("care_team", () => skillChildRelationships(snap, child));
  }
  if (mentionsAny(q, ["progress", "progressing", "making progress", "direction of travel", "trajectory", "getting better", "getting worse", "improving", "declining", "on track", "outcomes"])) {
    return gate("care_team", () => skillChildProgress(snap, child));
  }

  // Practice knowledge — a clearly practice-framed question ("how do I…/what does X
  // mean") or a named framework ("PACE", "contextual safeguarding") is tried before
  // the record-topic skills so a topic keyword doesn't hijack it. Comes AFTER policy
  // (an approved-policy question wins) and falls through to records when the loaded
  // knowledge base has no confident match.
  if (looksLikePracticeQuestion(q) || mentionsFramework(q)) {
    const pg = skillPracticeGuidance(raw, child);
    if (pg) return pg;
  }

  // Most specific → least. Restraint & missing before generic "incident".
  if (mentionsAny(q, ["restraint", "physical intervention", "physical hold", "hold"])) return gate("care_team", () => skillRestraints(q, snap, asOf, child));
  if (mentionsAny(q, ["missing", "ran away", "absconded", "absent without", "awol"])) return gate("care_team", () => skillMissing(q, snap, asOf, child));
  if (mentionsAny(q, ["what's due", "whats due", "what is due", "due this week", "due soon", "deadlines", "coming up", "upcoming"])) return gate("care_team", () => skillWhatsDue(snap, asOf));
  if (mentionsAny(q, ["overdue", "late action", "past due", "outstanding task"])) return gate("care_team", () => skillOverdue(snap, asOf));
  if (mentionsAny(q, ["medication", "meds", "medicine", "mar sheet", "prescribed"])) return gate("care_team", () => skillMedication(snap, asOf, child));
  if (mentionsAny(q, ["safeguarding", "protection concern", "at risk", "disclosure"])) return gate("care_team", () => skillSafeguarding(snap, asOf));
  if (mentionsAny(q, ["on shift", "who's working", "who is working", "who's on", "who is on", "staff on", "on duty", "on tonight", "rota today", "working today", "working tonight"])) return gate("everyone", () => skillStaffing(snap, asOf));
  if (mentionsAny(q, ["key work", "keywork", "key-work", "one to one", "one-to-one", "1:1"])) return gate("care_team", () => skillKeyWork(snap, asOf, child));
  if (mentionsAny(q, ["significant", "anything happen", "how was the day", "how was today", "how did today", "events today", "notable", "any events"])) return gate("care_team", () => skillEvents(snap, asOf, child));
  if (mentionsAny(q, ["home overview", "how is the home", "how's the home", "management overview", "whole home", "home summary", "state of the home", "how are we doing"])) return gate("management", () => skillHomeOverview(snap, asOf));
  if (mentionsAny(q, ["attention", "priority", "urgent", "what needs", "what should i", "briefing", "focus on", "worry"])) return gate("care_team", () => skillAttention(snap, asOf));
  if (mentionsAny(q, ["how many children", "how many young people", "who lives", "who is placed", "who's placed", "list the children", "list young people", "how many kids"])) return gate("everyone", () => skillChildrenList(snap));
  if (mentionsAny(q, ["incident", "incidents", "what happened"])) return gate("care_team", () => skillIncidents(q, snap, asOf, child));
  if (mentionsAny(q, ["social worker", "iro", "independent reviewing", "contact for", "who is the gp", "professional network", "who do i contact", "contact details"])) return gate("care_team", () => skillContacts(q, snap, child));

  // A child named with a summary-style verb, or just a child name → summary.
  if (child && (mentionsAny(q, ["tell me about", "summary", "summarise", "how is", "how's", "update on", "overview", "about"]) || raw.split(/\s+/).length <= 3)) {
    return gate("care_team", () => skillChildSummary(child, snap, asOf));
  }

  // Shadow-AI substitution: this looks like something people paste into ChatGPT.
  // Route them to the safe CARA engine instead of the generic fallback. Checked
  // before the late practice catch so "make this sound professional"-style asks
  // route to the safe substitution, not the knowledge base.
  const sub = findSubstitution(raw);
  if (sub.matched && sub.substitution) {
    const s = sub.substitution;
    return answer({
      intent: "shadow_ai_route",
      answered: true,
      text: `${s.saferMessage}\n\nThe safe CARA route for this:`,
      sources: [],
      suggestions: s.caraRoutes.map((r) => ({ label: r.label })),
      disclaimer: "Please don't paste child, staff, family, safeguarding, health or placement information into external AI tools — CARA does this safely and keeps a record.",
    });
  }

  // Late knowledge catch — a question that fell through the record skills and isn't a
  // shadow-AI pattern, but does match the loaded frameworks (shares KB vocabulary).
  const pgLate = skillPracticeGuidance(raw, child);
  if (pgLate) return pgLate;

  return skillUnknown();
}

export { ASK_CARA_VERSION };
