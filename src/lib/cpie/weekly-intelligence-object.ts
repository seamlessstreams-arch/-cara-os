// ══════════════════════════════════════════════════════════════════════════════
// CARA — CPIE · Weekly Intelligence Object (pure)
//
// The master prompt's discipline: "Rather than generating reports directly,
// first create a structured intelligence object … Only after this deterministic
// object exists should any LLM generate narrative reports."
//
// buildWeeklyIntelligenceObject(input) composes the child's Digital Twin (the
// whole-child understanding) with a 7-day window over the records to produce the
// deterministic pre-report object every weekly/monthly summary and Reg 44
// evidence pull consumes. NO LLM: this IS the intelligence; a narrator only ever
// phrases what this object already holds.
//
// Significance over frequency; celebrate small progress; the whole child, never
// just incidents; evidence confidence + missing information + contradictions are
// first-class, not omitted.
// ══════════════════════════════════════════════════════════════════════════════

import type { ChildTwin } from "./types";

interface Rec {
  [k: string]: unknown;
}

export interface WeeklyIntelligenceInput {
  twin: ChildTwin;
  now: string; // injected ISO → deterministic
  weekEnding: string; // ISO date (YYYY-MM-DD), inclusive end of the 7-day window
  positiveAchievements: Rec[];
  lifeStoryEntries: Rec[];
  incidents: Rec[];
  missingEpisodes: Rec[];
  keyWorkingSessions: Rec[];
  familyTimeSessions: Rec[];
  dailyLogs: Rec[];
  behaviourLog: Rec[];
  educationRecords: Rec[];
  returnInterviews: Rec[];
}

export type WeeklyConfidence = "high" | "moderate" | "low";

export interface WeeklyEvidenceLine {
  label: string;
  evidence: string;
}

export interface WeeklyIntelligenceObject {
  childId: string;
  name: string;
  weekStart: string;
  weekEnding: string;
  generatedAt: string;
  engineVersion: string;

  /** The whole child, carried from the twin so the week is never read alone. */
  wholeChild: {
    who: string; // interests + a strength, in one line
    directionOfTravel: string; // improving | stable | declining (from outcome engine)
    relationalStatus: string; // secure | developing | fragile
    emotionalStatus: string; // secure | watch | concern
  };

  /** What actually happened in the 7-day window. */
  week: {
    picture: string; // deterministic headline synthesis
    achievements: { title: string; celebratedHow?: string }[];
    celebrations: string[];
    milestones: string[];
    positiveExperiences: string[]; // family time, outings, meaningful moments
    childVoiceMoments: { quote: string; source: string }[];
    emotionalWellbeing: string;
    strategiesWorking: string[];
    strategiesRequiringReview: string[];
    incidentCount: number;
    keyWorkSessions: number;
    familyTimeSessions: number;
    educationEngagement: number;
  };

  /** Ofsted-facing evidence, emitted ONLY where the week/twin actually evidences it. */
  qualityStandardsEvidence: WeeklyEvidenceLine[];
  fiveOutcomesEvidence: WeeklyEvidenceLine[];

  /** Practice intelligence — themes, observations, next steps. */
  emergingThemes: string[];
  practiceObservations: string[];
  recommendations: string[];

  /** Honesty — never omitted. */
  evidenceConfidence: WeeklyConfidence;
  missingInformation: string[];
  contradictions: string[];
}

const WEEKLY_ENGINE_VERSION = "1.0.0";

const s = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

function addDays(dateIso: string, n: number): string {
  const t = Date.parse(`${dateIso.slice(0, 10)}T00:00:00Z`);
  return new Date(t + n * 86_400_000).toISOString().slice(0, 10);
}

/** Inclusive 7-day window: [weekEnding-6, weekEnding]. */
function inWeek(dateStr: unknown, start: string, end: string): boolean {
  const d = s(dateStr).slice(0, 10);
  return !!d && d >= start && d <= end;
}

export function buildWeeklyIntelligenceObject(input: WeeklyIntelligenceInput): WeeklyIntelligenceObject {
  const { twin, now, weekEnding } = input;
  const end = weekEnding.slice(0, 10);
  const start = addDays(end, -6);
  const childId = twin.childId;
  const name = twin.name;
  const mine = <T extends Rec>(rows: T[]): T[] => rows.filter((r) => s(r.child_id) === childId || s(r.childId) === childId);
  const win = <T extends Rec>(rows: T[], dateKeys: string[]): T[] =>
    mine(rows).filter((r) => dateKeys.some((k) => inWeek(r[k], start, end)));

  // ── This week's records ─────────────────────────────────────────────────────
  const weekAchievements = win(input.positiveAchievements, ["date"]);
  const weekLifeStory = win(input.lifeStoryEntries, ["date"]);
  const weekIncidents = win(input.incidents, ["date"]);
  const weekMissing = win(input.missingEpisodes, ["date"]);
  const weekKeywork = win(input.keyWorkingSessions, ["date", "session_date"]);
  const weekFamily = win(input.familyTimeSessions, ["date", "session_date"]);
  const weekLogs = win(input.dailyLogs, ["date"]);
  const weekBehaviour = win(input.behaviourLog, ["date"]);
  const weekEducation = win(input.educationRecords, ["date", "record_date"]);

  // ── Achievements, celebrations, milestones ──────────────────────────────────
  const achievements = weekAchievements.map((a) => ({ title: s(a.title), celebratedHow: s(a.celebrated_how) || undefined }));
  const celebrations = weekAchievements.filter((a) => s(a.celebrated_how)).map((a) => s(a.title));
  const milestones = weekLifeStory.filter((m) => s(m.type) === "milestone" || s(m.type) === "achievement").map((m) => s(m.title));

  // ── Positive experiences (family time, outings, meaningful moments) ─────────
  const positiveExperiences: string[] = [];
  if (weekFamily.length) positiveExperiences.push(`${weekFamily.length} family-time session${weekFamily.length === 1 ? "" : "s"}`);
  for (const l of weekLogs) {
    const c = s(l.content);
    if (/\b(trip|outing|cinema|park|beach|fishing|swimming|day out|meal out|took .* to|went to)\b/i.test(c)) {
      positiveExperiences.push(c.slice(0, 90).trim());
    }
  }

  // ── Child voice moments captured this week ──────────────────────────────────
  const childVoiceMoments: { quote: string; source: string }[] = [];
  for (const l of weekLogs) {
    const m = s(l.content).match(/["“”']([^"“”']{4,140})["“”']/);
    if (m) childVoiceMoments.push({ quote: m[1], source: "Daily log" });
  }
  for (const ls of weekLifeStory) {
    if (s(ls.child_voice)) childVoiceMoments.push({ quote: s(ls.child_voice), source: "Life-story entry" });
  }

  // ── Strategies working / requiring review (from behaviour episodes) ─────────
  // A key-work session where mood lifted, or a de-escalation that ended settled,
  // credits the strategy; an unresolved escalation flags it for review.
  const strategiesWorking = new Set<string>();
  const strategiesRequiringReview = new Set<string>();
  for (const k of weekKeywork) {
    const before = num(k.mood_before);
    const after = num(k.mood_after);
    if (before !== undefined && after !== undefined && after > before && s(k.focus)) strategiesWorking.add(s(k.focus));
  }
  for (const b of weekBehaviour) {
    const strat = s(b.strategy_used ?? b.intervention);
    if (!strat) continue;
    if (/settled|regulated|calm|resolved|de-escalat/i.test(s(b.outcome))) strategiesWorking.add(strat);
    else if (/escalat|continued|unresolved|restraint/i.test(s(b.outcome))) strategiesRequiringReview.add(strat);
  }
  // Fall back to the twin's evidenced what-helps when the week is quiet.
  if (strategiesWorking.size === 0) for (const w of twin.emotional.data.whatHelps.slice(0, 2)) strategiesWorking.add(w);

  // ── Emotional wellbeing (twin read, framed for the week) ────────────────────
  const emo = twin.emotional.data;
  const emotionalWellbeing = emo.status
    ? `${emo.status === "concern" ? "Needs close attention" : emo.status === "watch" ? "Keep watch" : "Settled"} — ${emo.status} (${emo.trend ?? "steady"}${emo.peakTime ? `, escalations cluster ${emo.peakTime}` : ""}).`
    : "Not enough behaviour recording this period to read emotional wellbeing.";

  // ── Weekly picture (deterministic headline synthesis) ───────────────────────
  const pictureParts: string[] = [];
  if (achievements.length) pictureParts.push(`${achievements.length} achievement${achievements.length === 1 ? "" : "s"} to celebrate`);
  if (weekKeywork.length) pictureParts.push(`${weekKeywork.length} key-work session${weekKeywork.length === 1 ? "" : "s"}`);
  if (weekIncidents.length) pictureParts.push(`${weekIncidents.length} incident${weekIncidents.length === 1 ? "" : "s"}`);
  if (weekMissing.length) pictureParts.push(`${weekMissing.length} missing episode${weekMissing.length === 1 ? "" : "s"}`);
  const picture = pictureParts.length
    ? `A week of ${pictureParts.join(", ")}. Direction of travel: ${twin.progress.data.trajectory ?? "not yet readable"}.`
    : `A quiet week on the records for ${name} — check ordinary life and voice are being captured, not only events.`;

  // ── Quality Standards evidence (emit only where evidenced) ──────────────────
  const qs: WeeklyEvidenceLine[] = [];
  if (childVoiceMoments.length) qs.push({ label: "Children's views, wishes and feelings", evidence: `${childVoiceMoments.length} moment${childVoiceMoments.length === 1 ? "" : "s"} of ${name}'s own voice captured.` });
  if (weekEducation.length) qs.push({ label: "Education", evidence: `${weekEducation.length} education record${weekEducation.length === 1 ? "" : "s"} this week.` });
  if (achievements.length) qs.push({ label: "Enjoyment and achievement", evidence: `${achievements.map((a) => a.title).slice(0, 2).join("; ")}.` });
  if (twin.emotional.data.status) qs.push({ label: "Health and wellbeing", evidence: emotionalWellbeing });
  if (twin.relationships.data.trustedAdults.length) qs.push({ label: "Positive relationships", evidence: `Trusted adults: ${twin.relationships.data.trustedAdults.slice(0, 2).join(", ")}.` });
  if (weekIncidents.length || weekMissing.length) qs.push({ label: "Protection of children", evidence: `${weekIncidents.length} incident(s), ${weekMissing.length} missing episode(s) — safeguarding responses recorded.` });

  // ── Five Outcomes evidence ──────────────────────────────────────────────────
  const five: WeeklyEvidenceLine[] = [];
  if (twin.emotional.data.status) five.push({ label: "Be healthy", evidence: emotionalWellbeing });
  if (weekIncidents.length || weekMissing.length || twin.relationships.data.relationalStatus) five.push({ label: "Stay safe", evidence: `Relational safety ${twin.relationships.data.relationalStatus ?? "developing"}; safeguarding events responded to.` });
  if (achievements.length || weekEducation.length) five.push({ label: "Enjoy and achieve", evidence: `${achievements.length} achievement(s), ${weekEducation.length} education record(s).` });
  if (weekFamily.length || twin.relationships.data.trustedAdults.length) five.push({ label: "Make a positive contribution", evidence: weekFamily.length ? `Relationships and family links maintained (${weekFamily.length} family-time session${weekFamily.length === 1 ? "" : "s"} this week).` : `Trusted relationships maintained: ${twin.relationships.data.trustedAdults.slice(0, 2).join(", ")}.` });
  if (twin.aspirations.data.aspirations.length) five.push({ label: "Achieve economic wellbeing", evidence: `Aspirations held and worked toward: ${twin.aspirations.data.aspirations[0]?.aspiration ?? ""}.` });

  // ── Emerging themes ─────────────────────────────────────────────────────────
  const emergingThemes: string[] = [];
  const incTypes = new Map<string, number>();
  for (const i of weekIncidents) incTypes.set(s(i.type), (incTypes.get(s(i.type)) ?? 0) + 1);
  for (const [t, n] of incTypes) if (n >= 2) emergingThemes.push(`${n} incidents of type "${t.replace(/_/g, " ")}" this week — look for the pattern, not just the events.`);
  if (emo.status === "concern" && emo.peakTime) emergingThemes.push(`Escalations clustering ${emo.peakTime} — plan support around that window.`);
  if ((twin.relationships.data.ruptures ?? 0) > (twin.relationships.data.repairs ?? 0)) emergingThemes.push("Ruptures are outpacing repairs — prioritise the repair conversations.");

  // ── Practice observations ───────────────────────────────────────────────────
  const practiceObservations: string[] = [];
  if (achievements.length && !celebrations.length) practiceObservations.push("Achievements recorded but no celebration noted — celebration is parenting; record how each was marked.");
  if (weekIncidents.length && !weekKeywork.length) practiceObservations.push("Incidents this week but no key-work session recorded — the reflective space is where sense is made.");
  if (!childVoiceMoments.length && weekLogs.length) practiceObservations.push(`${name}'s own words aren't appearing in this week's records — capture what they said, not only what they did.`);

  // ── Recommendations ─────────────────────────────────────────────────────────
  const recommendations: string[] = [];
  if (strategiesRequiringReview.size) recommendations.push(`Review with the team: ${[...strategiesRequiringReview].slice(0, 2).join(", ")}.`);
  for (const gap of twin.missingInformation.slice(0, 2)) recommendations.push(gap);
  if (twin.progress.data.focus.length) recommendations.push(`Keep focus on ${twin.progress.data.focus.join(", ").toLowerCase()}.`);

  // ── Evidence confidence ─────────────────────────────────────────────────────
  const evidenceVolume = weekAchievements.length + weekKeywork.length + weekLogs.length + weekFamily.length + weekLifeStory.length + childVoiceMoments.length;
  const evidenceConfidence: WeeklyConfidence = evidenceVolume >= 8 ? "high" : evidenceVolume >= 3 ? "moderate" : "low";

  // ── Whole child (from twin) ─────────────────────────────────────────────────
  const interests = twin.identity.data.interests.slice(0, 3);
  const whoBits = [interests.length ? interests.join(", ") : "", twin.strengths.data.strengths[0] ?? ""].filter(Boolean);

  return {
    childId,
    name,
    weekStart: start,
    weekEnding: end,
    generatedAt: now,
    engineVersion: WEEKLY_ENGINE_VERSION,
    wholeChild: {
      who: whoBits.join(" · ") || "Little recorded yet about who this child is — close that first.",
      directionOfTravel: twin.progress.data.trajectory ?? "not yet readable",
      relationalStatus: twin.relationships.data.relationalStatus ?? "developing",
      emotionalStatus: twin.emotional.data.status ?? "unknown",
    },
    week: {
      picture,
      achievements,
      celebrations,
      milestones,
      positiveExperiences: [...new Set(positiveExperiences)].slice(0, 5),
      childVoiceMoments: childVoiceMoments.slice(0, 5),
      emotionalWellbeing,
      strategiesWorking: [...strategiesWorking].slice(0, 4),
      strategiesRequiringReview: [...strategiesRequiringReview].slice(0, 4),
      incidentCount: weekIncidents.length,
      keyWorkSessions: weekKeywork.length,
      familyTimeSessions: weekFamily.length,
      educationEngagement: weekEducation.length,
    },
    qualityStandardsEvidence: qs,
    fiveOutcomesEvidence: five,
    emergingThemes,
    practiceObservations,
    recommendations,
    evidenceConfidence,
    missingInformation: twin.missingInformation.slice(0, 5),
    contradictions: twin.contradictions,
  };
}
