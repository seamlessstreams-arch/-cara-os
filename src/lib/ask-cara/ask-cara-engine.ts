// ══════════════════════════════════════════════════════════════════════════════
// CARA — ASK CARA (deterministic Q&A engine)
//
// answerQuestion(query) classifies a question to an intent and answers it from a
// STORE SNAPSHOT — no LLM, no network. Every fact comes from the snapshot; when
// Cara can't answer it says so and shows what it can. Pure + deterministic.
// ══════════════════════════════════════════════════════════════════════════════

import { mentionsAny } from "@/lib/text/keyword-match";
import {
  ASK_CARA_VERSION,
  type AskCaraAnswer,
  type AskCaraChild,
  type AskCaraQuery,
  type AskCaraSnapshot,
  type AskCaraSource,
  type AskCaraSuggestion,
} from "./types";

const DISCLAIMER = "Cara answers from your live records to support your judgement — it never makes a safeguarding decision for you.";

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
  lines.push(`In the last 30 days: ${recentInc.length} incident${recentInc.length === 1 ? "" : "s"} (${openInc.length} still open), ${restraints.length} restraint${restraints.length === 1 ? "" : "s"}, ${missing.length} missing episode${missing.length === 1 ? "" : "s"}.`);
  if (restraintsNoDebrief.length > 0) lines.push(`⚠ ${restraintsNoDebrief.length} restraint${restraintsNoDebrief.length === 1 ? " has" : "s have"} no recorded child debrief — the repair conversation is outstanding.`);
  if (openTasks.length > 0) lines.push(`${openTasks.length} open action${openTasks.length === 1 ? "" : "s"} linked to ${name}.`);
  lines.push(logs[0] ? `Latest daily log: ${logs[0].date}.` : `No daily log on record for ${name}.`);

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

  const total = restraintGaps.length + missingOversight.length + missingRHI.length + overdueTasks.length + overdueReviews.length;
  const text = total === 0
    ? "Nothing is outstanding in the records right now — no overdue actions, missing oversight, restraint repair gaps or missing return interviews. Keep going."
    : `Here's what the records say needs you, most safeguarding-critical first:\n${lines.join("\n")}`;

  void nameFor;
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

  if (!q || (q.length <= 24 && mentionsAny(q, ["hi", "hello", "hey", "help", "what can you do", "who are you", "start"]))) {
    return skillGreeting(query.userName);
  }

  // Most specific → least. Restraint & missing before generic "incident".
  if (mentionsAny(q, ["restraint", "physical intervention", "physical hold", "hold"])) return skillRestraints(q, snap, asOf, child);
  if (mentionsAny(q, ["missing", "ran away", "absconded", "absent without", "awol"])) return skillMissing(q, snap, asOf, child);
  if (mentionsAny(q, ["overdue", "late action", "past due", "outstanding task"])) return skillOverdue(snap, asOf);
  if (mentionsAny(q, ["medication", "meds", "medicine", "mar sheet", "prescribed"])) return skillMedication(snap, asOf, child);
  if (mentionsAny(q, ["safeguarding", "protection concern", "at risk", "disclosure"])) return skillSafeguarding(snap, asOf);
  if (mentionsAny(q, ["on shift", "who's working", "who is working", "who's on", "who is on", "staff on", "on duty", "on tonight", "rota today", "working today", "working tonight"])) return skillStaffing(snap, asOf);
  if (mentionsAny(q, ["key work", "keywork", "key-work", "one to one", "one-to-one", "1:1"])) return skillKeyWork(snap, asOf, child);
  if (mentionsAny(q, ["significant", "anything happen", "how was the day", "how was today", "how did today", "events today", "notable", "any events"])) return skillEvents(snap, asOf, child);
  if (mentionsAny(q, ["attention", "priority", "urgent", "what needs", "what should i", "briefing", "focus on", "worry"])) return skillAttention(snap, asOf);
  if (mentionsAny(q, ["how many children", "how many young people", "who lives", "who is placed", "who's placed", "list the children", "list young people", "how many kids"])) return skillChildrenList(snap);
  if (mentionsAny(q, ["incident", "incidents", "what happened"])) return skillIncidents(q, snap, asOf, child);

  // A child named with a summary-style verb, or just a child name → summary.
  if (child && (mentionsAny(q, ["tell me about", "summary", "summarise", "how is", "how's", "update on", "overview", "about"]) || raw.split(/\s+/).length <= 3)) {
    return skillChildSummary(child, snap, asOf);
  }

  return skillUnknown();
}

export { ASK_CARA_VERSION };
