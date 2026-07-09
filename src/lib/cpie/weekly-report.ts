// ══════════════════════════════════════════════════════════════════════════════
// CARA — CPIE · Weekly REPORT (pure)
//
// The full sectioned weekly report a home actually produces (the Oak House
// template): written in the SECOND PERSON, TO the child ("This week has been a
// really strong one for you…"), section by section, day-by-day, warm and
// strengths-first — with a third-person Manager Summary at the end.
//
// Narrator layer over the deterministic Weekly Intelligence Object (facts) + the
// child's raw weekly records (day-by-day detail). NO LLM: it only phrases what the
// records hold; it never invents an event, and an empty section says so honestly.
//
// SAFEGUARDING GUARD: the child-facing "what I struggled with" section draws from
// concerning behaviour + NON-safeguarding, non-critical incidents only. A child
// must never have a safeguarding disclosure reflected back at them in their own
// report; that stays in the (professional) Manager Summary.
// ══════════════════════════════════════════════════════════════════════════════

import type { WeeklyIntelligenceObject } from "./weekly-intelligence-object";
import { composeWeeklyNarrative, type Pronouns } from "./weekly-narrative";

const THEY: Pronouns = { subject: "they", object: "them", possessive: "their" };

export interface WeeklyReportSection {
  group: string;
  heading: string;
  body: string;
  empty: boolean;
}
export interface WeeklyReport {
  childId: string;
  childName: string;
  weekStart: string;
  weekEnding: string;
  title: string;
  generatedAt: string;
  sections: WeeklyReportSection[];
}
interface Rec { [k: string]: unknown }

export interface WeeklyReportInput {
  childId: string;
  childName: string;
  now: string;
  weekEnding: string;
  windowDays?: number;
  wio: WeeklyIntelligenceObject;
  pronouns?: Pronouns;
  dailyLogs: Rec[];
  positiveAchievements: Rec[];
  incidents: Rec[];
  behaviourLog: Rec[];
  familyTimeSessions: Rec[];
  educationRecords: Rec[];
  medications: Rec[];
  activities: Rec[];
  healthRecordEntries: Rec[];
  ypFeedback: Rec[];
  keyWorkingSessions: Rec[];
}

// ── helpers ───────────────────────────────────────────────────────────────────
const s = (v: unknown): string => (typeof v === "string" ? v : "");
const stripEnd = (t: string): string => t.replace(/[.\s]+$/, "").trim();
const lower1 = (t: string): string => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t);
const cap = (t: string): string => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const endSentence = (t: string): string => (stripEnd(t) ? stripEnd(t) + "." : "");

function sentenceList(items: string[]): string {
  const xs = [...new Set(items.map(stripEnd).filter(Boolean))];
  if (xs.length === 0) return "";
  if (xs.length === 1) return xs[0];
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`;
  return `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

function addDays(dateIso: string, n: number): string {
  const t = Date.parse(`${dateIso.slice(0, 10)}T00:00:00Z`);
  return new Date(t + n * 86_400_000).toISOString().slice(0, 10);
}
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayName = (dateIso: string): string => {
  const t = Date.parse(`${dateIso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(t) ? "" : DAY_NAMES[new Date(t).getUTCDay()];
};
const dateOf = (r: Rec, keys: string[]): string => { for (const k of keys) { const d = s(r[k]).slice(0, 10); if (d) return d; } return ""; };
const mine = (rows: Rec[], id: string): Rec[] => rows.filter((r) => s(r.child_id) === id || s(r.childId) === id);
const inWindow = (d: string, a: string, b: string): boolean => { const x = d.slice(0, 10); return !!x && x >= a && x <= b; };

interface Dated { day: string; date: string; r: Rec }
function weekly(rows: Rec[], id: string, keys: string[], a: string, b: string): Dated[] {
  return mine(rows, id).map((r) => ({ r, date: dateOf(r, keys) })).filter((x) => inWindow(x.date, a, b))
    .sort((x, y) => (x.date < y.date ? -1 : 1)).map((x) => ({ day: dayName(x.date), date: x.date, r: x.r }));
}

/** Subject-verb agreement + contraction fixes once the subject is "you". */
function fixYouAgreement(t: string): string {
  return t
    .replace(/\byou (need|want|feel|like|get|say|make|take|know|think|go|do|have|struggle|manage|prefer|enjoy)s\b/gi, "you $1")
    .replace(/\byou doesn'?t\b/gi, "you don't").replace(/\byou hasn'?t\b/gi, "you haven't")
    .replace(/\byou isn'?t\b/gi, "you aren't").replace(/\byou wasn'?t\b/gi, "you weren't")
    .replace(/\byou was\b/gi, "you were").replace(/\byou is\b/gi, "you are").replace(/\byou has\b/gi, "you have");
}
/** Replace the child's name + third-person pronouns with second person. No prefix. */
function swapPronouns(text: string, name: string): string {
  const first = (name.split(/\s+/)[0] || name).replace(/[^a-zA-Z]/g, "");
  let t = stripEnd(text).replace(/^[A-Za-z]+\s*[:\-]\s*/, ""); // strip a leading "Alex: " speaker tag
  if (first.length >= 2) {
    t = t.replace(new RegExp(`\\b${first}'s\\b`, "gi"), "your").replace(new RegExp(`\\b${first}\\b`, "gi"), "you");
  }
  t = t.replace(/\b(his|her|their)\b/gi, "your").replace(/\b(himself|herself|themselves)\b/gi, "yourself");
  t = t.replace(/\b(he|she|they)\b/gi, "you").replace(/\b(him|them)\b/gi, "you");
  t = t.replace(/\byou'?s\b/gi, "your");
  return fixYouAgreement(t);
}
/** A full free-text log clause → second person, first sentence, "you"-led. */
function toSecondPerson(text: string, name: string): string {
  let t = swapPronouns(s(text).split(/(?<=[.!?])\s/)[0] || text, name);
  if (!/^you\b/i.test(t.trim())) t = `you ${lower1(t.trim())}`;
  return fixYouAgreement(lower1(stripEnd(t)));
}
/** First DOUBLE-quoted phrase (never split on apostrophes); ≥8 chars, else "". */
function firstQuote(text: string): string {
  const m = s(text).match(/["“”]([^"“”]{8,200})["“”]/);
  return m ? stripEnd(m[1]) : "";
}
/** Is this a proper descriptive clause (has a verb-ish word), not a terse header? */
const looksDescriptive = (t: string): boolean => /\b(went|made|cooked|had|did|prepared|helped|completed|took|played|watched|visited|attended|cleaned|tidied|washed|brushed|walked|talked|spoke|asked|showed|used)\b/i.test(t);

// ── section composers ─────────────────────────────────────────────────────────
type SectionOut = { body: string; empty: boolean };
const HYGIENE_RE = /\b(wash|washed|washing|bath|bathed|shower|showered|shave|shaved|hygiene|teeth|brush|brushed|personal care|hair|shampoo|deodorant)\b/i;
const INDEP_RE = /\b(cook|cooked|cooking|breakfast|lunch|dinner|meal|baked|laundry|washing up|tidied|cleaned|hoover|shopping|budget|prepared|independent|independently|self-care|chores|ironing)\b/i;
const SAFEGUARDING_TYPES = /(safeguard|disclosure|allegation|abuse|exploit|cse|cce|missing|self.?harm|suicide)/i;
const uniqueDays = (rows: Dated[]): string[] => [...new Set(rows.map((r) => r.day).filter(Boolean))];

function secWellDone(i: WeeklyReportInput, name: string, a: string, b: string, pd: string): SectionOut {
  const ach = weekly(i.positiveAchievements, i.childId, ["date"], a, b);
  const pos = weekly(i.behaviourLog, i.childId, ["date"], a, b).filter((d) => s(d.r.direction) === "positive");
  if (!ach.length && !pos.length) return { body: `It's been a steadier ${pd}, ${name}, without a standout moment on the records — but every ordinary good day counts, and the small wins are worth capturing too.`, empty: true };
  const lines = [`This ${pd} has had real moments to be proud of, ${name}.`];
  for (const x of ach.slice(0, 3)) {
    let t = `You should be really proud — ${stripEnd(s(x.r.title))}`;
    const how = s(x.r.celebrated_how);
    if (how) t += `, and it was lovely this was marked (${lower1(stripEnd(swapPronouns(how, name)))})`;
    lines.push(endSentence(t));
  }
  const posTitle = pos.map((d) => stripEnd(s(d.r.title))).filter(Boolean).slice(0, 2);
  if (posTitle.length) lines.push(endSentence(`There were good moments day to day, too — ${sentenceList(posTitle.map(lower1))}`));
  lines.push(`You should be really proud of how that has gone.`);
  return { body: lines.join(" "), empty: false };
}

function secStruggled(i: WeeklyReportInput, name: string, a: string, b: string, pd: string): SectionOut {
  const beh = weekly(i.behaviourLog, i.childId, ["date"], a, b).filter((d) => s(d.r.direction) === "concerning");
  const inc = weekly(i.incidents, i.childId, ["date"], a, b).filter((d) => !SAFEGUARDING_TYPES.test(s(d.r.type)) && s(d.r.severity).toLowerCase() !== "critical");
  const events = [...beh, ...inc].sort((x, y) => (x.date < y.date ? -1 : 1));
  if (!events.length) return { body: `There was nothing of real concern recorded this ${pd} — that's a good ${pd}, and well done for that.`, empty: true };
  const lines = [`There were a few moments this ${pd} that were harder for you, and the team stayed close through them.`];
  for (const e of events.slice(0, 4)) {
    const trigger = s(e.r.trigger) || s(e.r.antecedent);
    const settled = /settl|regulat|calm|resolv|de-escalat|apolog|support|repair/i.test(s(e.r.outcome));
    let t = `On ${e.day}`;
    if (trigger) t += `, after ${lower1(stripEnd(swapPronouns(trigger, name)))},`;
    t += ` things felt harder for a while`;
    if (settled) t += `, but with the right support around you, you came through it`;
    lines.push(endSentence(t));
  }
  lines.push(`None of this changes how well you're doing overall.`);
  return { body: lines.join(" "), empty: false };
}

function secMedication(i: WeeklyReportInput, name: string, a: string, b: string, pd: string): SectionOut {
  const active = mine(i.medications, i.childId).filter((m) => m.is_active !== false && s(m.type) !== "prn");
  const prn = mine(i.medications, i.childId).filter((m) => s(m.type) === "prn");
  const health = weekly(i.dailyLogs, i.childId, ["date"], a, b).filter((d) => s(d.r.entry_type) === "health" && /medicat|meds|tablet|dose/i.test(s(d.r.content)));
  if (!active.length && !prn.length && !health.length) return { body: `You're not on any regular prescribed medication at the moment, and nothing was needed this ${pd}.`, empty: true };
  const lines: string[] = [];
  if (active.length) lines.push(endSentence(`This ${pd} you've continued to take your prescribed medication — ${sentenceList(active.map((m) => stripEnd(s(m.name))))}`));
  if (prn.length) lines.push(endSentence(health.length ? `You also had ${sentenceList(prn.map((m) => stripEnd(s(m.name))))} when you needed it` : `You have ${sentenceList(prn.map((m) => stripEnd(s(m.name))))} available if you need it, and it wasn't needed this ${pd}`));
  if (active.length || health.length) lines.push(`It's been recorded as taken consistently, which is really good to see.`);
  return { body: lines.join(" "), empty: false };
}

function secHygiene(i: WeeklyReportInput, name: string, a: string, b: string, pd: string): SectionOut {
  const logs = weekly(i.dailyLogs, i.childId, ["date"], a, b).filter((d) => HYGIENE_RE.test(s(d.r.content)));
  if (!logs.length) return { body: `There's little recorded about personal care this ${pd} — the everyday routines are worth capturing too, so your good habits show in the record.`, empty: true };
  const days = uniqueDays(logs);
  const example = logs.map((l) => toSecondPerson(s(l.r.content), name)).find(looksDescriptive);
  let body = `You kept up your personal care this ${pd}, with it recorded on ${sentenceList(days)}`;
  if (example) body += ` — including when ${example}`;
  return { body: endSentence(body), empty: false };
}

function secFamily(i: WeeklyReportInput, name: string, a: string, b: string, pd: string): SectionOut {
  const fam = weekly(i.familyTimeSessions, i.childId, ["date", "session_date"], a, b);
  const contact = weekly(i.dailyLogs, i.childId, ["date"], a, b).filter((d) => s(d.r.entry_type) === "contact");
  if (!fam.length && !contact.length) return { body: `There's no family contact recorded this ${pd}. If contact happened it's worth capturing; if it didn't, that's worth a gentle conversation about what you'd like.`, empty: true };
  const lines = [`It's been a connected ${pd} with your family.`];
  for (const f of fam.slice(0, 5)) {
    const who = s(f.r.family_member || f.r.family_member_name) || "family";
    const voice = firstQuote(s(f.r.child_voice_after));
    let t = `On ${f.day} you spent time with your ${lower1(who)}`;
    if (voice) t += `, and afterwards you said it was "${voice}"`;
    lines.push(endSentence(t));
  }
  for (const c of contact.slice(0, 2)) if (looksDescriptive(toSecondPerson(s(c.r.content), name))) lines.push(endSentence(`On ${c.day}, ${toSecondPerson(s(c.r.content), name)}`));
  return { body: lines.join(" "), empty: false };
}

function secEducation(i: WeeklyReportInput, name: string, a: string, b: string, pd: string): SectionOut {
  const edu = weekly(i.educationRecords, i.childId, ["date", "record_date"], a, b);
  if (!edu.length) return { body: `There's no formal education recorded this ${pd} — this may reflect a school holiday, or a gap worth checking.`, empty: true };
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const e of edu.slice(0, 5)) {
    const att = s(e.r.attendance_status), rtype = s(e.r.record_type);
    let t: string;
    if (att === "present") t = `On ${e.day} you attended ${s(e.r.school) || "your provision"} and engaged well`;
    else if (/exclusion/i.test(rtype) || att === "excluded") t = `There was a harder day at school this ${pd}, and the team is working through it with you so school stays a positive place`;
    else if (/pep/i.test(rtype)) t = `Your education plan was reviewed this ${pd} to make sure it's working for you`;
    else t = `On ${e.day}, ${lower1(stripEnd(s(e.r.title))) || "there was an education update"}`;
    if (!seen.has(t)) { seen.add(t); lines.push(endSentence(t)); }
  }
  return { body: lines.join(" "), empty: false };
}

function secActivities(i: WeeklyReportInput, name: string, a: string, b: string, pd: string): SectionOut {
  const acts = weekly(i.activities, i.childId, ["date"], a, b);
  const logs = weekly(i.dailyLogs, i.childId, ["date"], a, b).filter((d) => s(d.r.entry_type) === "activity");
  if (!acts.length && !logs.length) return { body: `There aren't any activities recorded this ${pd}. Getting out and trying things matters — let's plan some in for next ${pd}.`, empty: true };
  const lines = [`It's been a varied ${pd} for you.`];
  for (const x of acts.slice(0, 5)) {
    const title = stripEnd(s(x.r.title));
    const verb = /^(visit|trip|went)\b/i.test(title) ? `you went to ${lower1(title.replace(/^(visit to|trip to|went to|visit|trip|went)\s*/i, ""))}` : `you took part in ${lower1(title)}`;
    let t = `On ${x.day} ${verb}`;
    if (s(x.r.engagement) === "enthusiastic") t += `, which you really threw yourself into`;
    const fb = firstQuote(s(x.r.yp_feedback)) || stripEnd(s(x.r.yp_feedback));
    if (fb) t += ` — you said "${cap(fb)}"`;
    lines.push(endSentence(t));
  }
  for (const l of logs.slice(0, 2)) if (looksDescriptive(toSecondPerson(s(l.r.content), name))) lines.push(endSentence(`On ${l.day}, ${toSecondPerson(s(l.r.content), name)}`));
  return { body: lines.join(" "), empty: false };
}

function secAppointments(i: WeeklyReportInput, name: string, a: string, b: string, pd: string): SectionOut {
  const health = weekly(i.healthRecordEntries, i.childId, ["date"], a, b);
  const logs = weekly(i.dailyLogs, i.childId, ["date"], a, b).filter((d) => s(d.r.entry_type) === "health" && /appointment|gp|dentist|camhs|therapy|clinic|nurse/i.test(s(d.r.content)));
  if (!health.length && !logs.length) return { body: `You didn't have any appointments this ${pd}.`, empty: true };
  const lines: string[] = [];
  for (const h of health.slice(0, 4)) {
    let t = `On ${h.day} you had ${lower1(stripEnd(s(h.r.title)))}`;
    if (s(h.r.professional)) t += ` with ${stripEnd(s(h.r.professional))}`;
    if (s(h.r.outcome)) t += ` — ${lower1(stripEnd(swapPronouns(s(h.r.outcome), name)))}`;
    lines.push(endSentence(t));
  }
  for (const l of logs.slice(0, 2)) if (looksDescriptive(toSecondPerson(s(l.r.content), name))) lines.push(endSentence(`On ${l.day}, ${toSecondPerson(s(l.r.content), name)}`));
  if (lines.length) lines.push(`You handled these well and were able to say what you thought and felt.`);
  return { body: lines.join(" "), empty: false };
}

function secIndependence(i: WeeklyReportInput, name: string, a: string, b: string, pd: string): SectionOut {
  const logs = weekly(i.dailyLogs, i.childId, ["date"], a, b).filter((d) => INDEP_RE.test(s(d.r.content)));
  const life = weekly(i.activities, i.childId, ["date"], a, b).filter((d) => s(d.r.category) === "life_skills");
  if (!logs.length && !life.length) return { body: `There's little recorded about independence this ${pd} — the cooking, tidying and self-care you do are worth capturing, because they show how far you're coming on.`, empty: true };
  const days = uniqueDays(logs);
  const example = logs.map((l) => toSecondPerson(s(l.r.content), name)).find(looksDescriptive);
  let body = `You've shown real independence this ${pd}`;
  if (days.length) body += `, with it seen on ${sentenceList(days)}`;
  if (example) body += ` — including when ${example}`;
  else if (life.length) body += ` — including ${sentenceList(life.slice(0, 2).map((x) => lower1(stripEnd(s(x.r.title)))))}`;
  return { body: `${endSentence(body)} That's real maturity, and you should be proud of yourself.`, empty: false };
}

// Words that mark a child-voice quote as a WORRY, so it's sorted to "not well".
const NEG_VOICE = /worried|worry|point|nothing changes|scared|hate|angry|unsafe|not safe|ignored|struggl|upset|\bsad\b|anxious|can'?t|frightened|fed up|don'?t feel/i;
const cleanQuote = (v: string): string => stripEnd(s(v)).replace(/^[A-Za-z]+\s*[:\-]\s*/, "").replace(/^["'“]+|["'”]+$/g, "");

function secVoiceWell(i: WeeklyReportInput, name: string, a: string, b: string, pd: string): SectionOut {
  const fb = weekly(i.ypFeedback, i.childId, ["date"], a, b).filter((d) => /happy|ok/i.test(s(d.r.sentiment)) && !/unhappy/i.test(s(d.r.sentiment)));
  const kw = weekly(i.keyWorkingSessions, i.childId, ["date", "session_date"], a, b)
    .map((d) => cleanQuote(s(d.r.child_voice))).filter((v) => v.length >= 12 && !NEG_VOICE.test(v));
  const lines: string[] = [];
  for (const q of kw.slice(0, 2)) lines.push(`you said "${cap(q)}"`);
  for (const f of fb.slice(0, 2)) lines.push(`you let us know you were happy about ${lower1(stripEnd(s(f.r.category).replace(/_/g, " ")))}`);
  if (!lines.length) return { body: `You didn't share specific comments this ${pd} about what had gone well — but your mood and how you carried yourself across the ${pd} spoke for itself.`, empty: true };
  return { body: `In your own words, ${sentenceList(lines)}.`, empty: false };
}

function secVoiceNotWell(i: WeeklyReportInput, name: string, a: string, b: string, pd: string): SectionOut {
  const fb = weekly(i.ypFeedback, i.childId, ["date"], a, b).filter((d) => /unhappy/i.test(s(d.r.sentiment)));
  const kwNeg = weekly(i.keyWorkingSessions, i.childId, ["date", "session_date"], a, b)
    .map((d) => cleanQuote(s(d.r.child_voice))).filter((v) => v.length >= 12 && NEG_VOICE.test(v));
  if (!fb.length && !kwNeg.length) return { body: `You didn't raise anything this ${pd} that you felt hadn't gone well — but the door is always open if something's on your mind.`, empty: true };
  const lines: string[] = [];
  for (const f of fb.slice(0, 3)) {
    let t = `On ${f.day} you told us that ${toSecondPerson(s(f.r.feedback), name)}`;
    if (s(f.r.action_taken)) t += `, and we ${lower1(stripEnd(swapPronouns(s(f.r.action_taken), name)))}`;
    lines.push(endSentence(t));
  }
  for (const q of kwNeg.slice(0, 2)) lines.push(endSentence(`you said "${cap(q)}", and we're listening`));
  return { body: lines.join(" "), empty: false };
}

// ── main ─────────────────────────────────────────────────────────────────────
export function composeWeeklyReport(input: WeeklyReportInput): WeeklyReport {
  const p = input.pronouns ?? THEY;
  const name = input.childName;
  const windowDays = input.windowDays && input.windowDays > 0 ? input.windowDays : 7;
  const end = input.weekEnding.slice(0, 10);
  const start = addDays(end, -(windowDays - 1));
  const pd = input.wio.periodLabel || "week";
  const sec = (group: string, heading: string, o: SectionOut): WeeklyReportSection => ({ group, heading, body: o.body, empty: o.empty });

  const sections: WeeklyReportSection[] = [
    sec("What has my week been like?", "What have I done really well at this week?", secWellDone(input, name, start, end, pd)),
    sec("What has my week been like?", "What I have struggled with this week?", secStruggled(input, name, start, end, pd)),
    sec("Health and wellbeing", "What medication have I taken this week?", secMedication(input, name, start, end, pd)),
    sec("Health and wellbeing", "Have I attended to my personal hygiene this week?", secHygiene(input, name, start, end, pd)),
    sec("Family Time", "Who I have seen and spoken to this week?", secFamily(input, name, start, end, pd)),
    sec("Education", "A brief summary of my education", secEducation(input, name, start, end, pd)),
    sec("Activities", "What activities have I been on this week?", secActivities(input, name, start, end, pd)),
    sec("Appointments", "What appointments have I been on this week?", secAppointments(input, name, start, end, pd)),
    sec("Independence", "What have I done independently this week?", secIndependence(input, name, start, end, pd)),
    sec(`${name}'s Voice`, `What ${name} says has gone well?`, secVoiceWell(input, name, start, end, pd)),
    sec(`${name}'s Voice`, `What ${name} feels hasn't gone well?`, secVoiceNotWell(input, name, start, end, pd)),
    { group: "Manager Summary", heading: "Overall summary of the week", body: composeWeeklyNarrative(input.wio, p).body, empty: false },
  ];

  return { childId: input.childId, childName: name, weekStart: start, weekEnding: end, title: `Weekly Report — ${name} (${start} to ${end})`, generatedAt: input.now, sections };
}

export type { Pronouns };
