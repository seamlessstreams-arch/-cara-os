// ══════════════════════════════════════════════════════════════════════════════
// CARA — CPIE · Digital Twin engine (pure)
//
// buildChildTwin(input) composes CARA's existing deterministic engines
// (emotional safety, outcome intelligence, relational timeline) with the
// identity/strengths/aspiration/life-story/voice records into ONE living
// profile. Pure function: arrays in, twin out — no store, no network, no LLM.
//
// Significance over frequency: evidence is weighted by a deterministic rubric
// (a celebrated achievement or a key-work session where the child's mood
// lifted counts for more than a routine observation). Conclusions carry
// confidence + evidence links; what CARA doesn't know is flagged, not guessed.
// ══════════════════════════════════════════════════════════════════════════════

import { buildEmotionalSafetyAnalysis, type EmotionalSafetyInput } from "@/lib/emotional-safety/emotional-safety-engine";
import { buildOutcomeIntelligence, type OutcomeIntelligenceInput } from "@/lib/outcome-intelligence/outcome-intelligence-engine";
import { buildRelationalTimeline, type RelationalTimelineInput } from "@/lib/relational-timeline/relational-timeline-engine";
import {
  CPIE_VERSION,
  type ChildTwin,
  type TwinConfidence,
  type TwinDimension,
  type TwinEvidence,
} from "./types";

// ── Input (loosely typed record slices; the chokepoint maps the store) ────────

interface Rec {
  [k: string]: unknown;
}

export interface ChildTwinInput {
  childId: string;
  childName: string;
  now: string; // injected ISO → deterministic
  child?: Rec; // the young-person record (dob, religion, ethnicity, sensory_profile…)
  paceProfile?: Rec;
  personalPassports: Rec[];
  aspirationRecords: Rec[];
  lifeStoryEntries: Rec[];
  positiveAchievements: Rec[];
  friendshipMaps: Rec[];
  dailyLogs: Rec[];
  keyWorkingSessions: Rec[];
  behaviourLog: Rec[];
  incidents: Rec[];
  missingEpisodes: Rec[];
  returnInterviews: Rec[];
  familyTimeSessions: Rec[];
  educationRecords: Rec[];
  lacReviews: Rec[];
  debriefRecords: Rec[];
  riskAssessments: Rec[];
  /** Injected staff-name resolver (keeps the relational engine pure). */
  staffName: (id: string) => string;
}

const s = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

function daysBetween(a: string, b: string): number {
  const t = Date.parse(a);
  const n = Date.parse(b);
  if (Number.isNaN(t) || Number.isNaN(n)) return Number.POSITIVE_INFINITY;
  return (n - t) / 86_400_000;
}
const withinDays = (d: string, now: string, n: number) => {
  const x = daysBetween(d, now);
  return x >= 0 && x <= n;
};

function ageFrom(dob: string, now: string): number | undefined {
  if (!dob) return undefined;
  const b = new Date(dob);
  const a = new Date(now);
  if (Number.isNaN(b.getTime()) || Number.isNaN(a.getTime())) return undefined;
  let age = a.getFullYear() - b.getFullYear();
  const m = a.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && a.getDate() < b.getDate())) age--;
  return age >= 0 && age < 120 ? age : undefined;
}

/** Confidence from the significance-weighted evidence sum (never raw counts). */
function confidenceFromWeight(total: number): TwinConfidence {
  if (total >= 10) return "high";
  if (total >= 5) return "moderate";
  if (total >= 1) return "low";
  return "none";
}

function dim<T>(data: T, evidence: TwinEvidence[], gaps: string[]): TwinDimension<T> {
  const total = evidence.reduce((acc, e) => acc + e.weight, 0);
  return { data, confidence: confidenceFromWeight(total), evidence, gaps };
}

/** Does free text carry the child's own words? (quotes or reported speech) */
function hasChildVoice(text: string): boolean {
  return /["“”']{1}[^"“”']{4,}["“”']{1}/.test(text) || /\b(said|told (?:me|us|staff)|asked)\b/i.test(text);
}

/** Pull a short child quote out of free text, if one is present. */
function extractQuote(text: string): string | undefined {
  const m = text.match(/["“”']([^"“”']{4,160})["“”']/);
  return m?.[1];
}

// ── The engine ─────────────────────────────────────────────────────────────────

export function buildChildTwin(input: ChildTwinInput): ChildTwin {
  const { childId, childName, now } = input;
  const mine = <T extends Rec>(rows: T[]): T[] => rows.filter((r) => s(r.child_id) === childId || s(r.childId) === childId);

  const child = input.child ?? {};
  const pace = input.paceProfile;
  const passport = mine(input.personalPassports).sort((a, b) => (s(b.created_at) < s(a.created_at) ? -1 : 1))[0];
  const aspirations = mine(input.aspirationRecords);
  const lifeStories = mine(input.lifeStoryEntries);
  const achievements = mine(input.positiveAchievements);
  const friendships = mine(input.friendshipMaps).sort((a, b) => (s(b.map_date) < s(a.map_date) ? -1 : 1))[0];
  const logs = mine(input.dailyLogs);
  const keywork = mine(input.keyWorkingSessions);

  // ── Identity ────────────────────────────────────────────────────────────────
  const identityEvidence: TwinEvidence[] = [];
  const identityGaps: string[] = [];
  const interests = [...new Set([...arr(passport?.my_interests), ...arr(passport?.my_strengths).slice(0, 0)])];
  const happy = arr(passport?.what_makes_me_happy);
  if (passport) identityEvidence.push({ source: "Personal passport (the child's own words)", recordId: s(passport.id), weight: 4 });
  if (pace) identityEvidence.push({ source: "PACE profile", weight: 2 });
  if (s(child.cultural_identity_notes)) identityEvidence.push({ source: "Cultural identity notes", weight: 2 });
  if (!passport) identityGaps.push("No personal passport — the child's own account of who they are is missing.");
  if (!s(child.religion) && !s(child.cultural_identity_notes)) identityGaps.push("Culture and faith not recorded.");
  if (interests.length === 0) identityGaps.push("No recorded interests — what do they love doing?");

  const identity = dim(
    {
      age: ageFrom(s(child.date_of_birth), now),
      culture: s(child.ethnicity) || s(child.cultural_identity_notes) || undefined,
      faith: s(child.religion) || undefined,
      interests,
      whatMakesThemHappy: happy,
      personality: [] as string[],
      communicationPreferences: [s(pace?.preferredDebriefStyle)].filter(Boolean),
      sensoryNeeds: [...arr(pace?.sensoryNeeds), ...(s(child.sensory_profile) ? [s(child.sensory_profile)] : [])],
    },
    identityEvidence,
    identityGaps,
  );

  // ── Strengths & achievements (significance-weighted) ───────────────────────
  const strengthsEvidence: TwinEvidence[] = achievements.map((a) => ({
    source: "Positive achievement",
    recordId: s(a.id),
    date: s(a.date),
    // Celebrated achievements weigh more — celebration is parenting, not admin.
    weight: 3 + (s(a.celebrated_how) ? 1 : 0),
    note: s(a.title),
  }));
  const strengthsGaps: string[] = [];
  const strengthsList = arr(passport?.my_strengths);
  if (strengthsList.length === 0 && achievements.length === 0) strengthsGaps.push("No strengths or achievements recorded — the record risks defining this child by difficulty alone.");
  const strengths = dim(
    {
      strengths: strengthsList,
      achievements: achievements
        .sort((a, b) => (s(b.date) < s(a.date) ? -1 : 1))
        .slice(0, 6)
        .map((a) => ({ date: s(a.date), title: s(a.title), category: s(a.category) || undefined, celebratedHow: s(a.celebrated_how) || undefined, childReaction: s(a.child_reaction) || undefined })),
    },
    strengthsEvidence,
    strengthsGaps,
  );

  // ── Aspirations ─────────────────────────────────────────────────────────────
  const aspirationDim = dim(
    {
      aspirations: aspirations.map((a) => ({
        domain: s(a.domain) || "general",
        aspiration: s(a.aspiration),
        whyItMatters: s(a.why_it_matters) || undefined,
        nextSteps: arr(a.steps_next),
      })),
    },
    aspirations.map((a) => ({ source: "Aspiration record", recordId: s(a.id), date: s(a.recorded_date), weight: 3 })),
    aspirations.length === 0 ? ["No recorded aspirations — who is this child becoming, in their own words?"] : [],
  );

  // ── Life story ──────────────────────────────────────────────────────────────
  const lifeStory = dim(
    {
      memories: lifeStories
        .sort((a, b) => (s(b.date) < s(a.date) ? -1 : 1))
        .slice(0, 6)
        .map((m) => ({ date: s(m.date), title: s(m.title), type: s(m.type) || undefined, childVoice: s(m.child_voice) || undefined })),
    },
    lifeStories.map((m) => ({ source: "Life-story entry", recordId: s(m.id), date: s(m.date), weight: 3 + (s(m.child_voice) ? 1 : 0) })),
    lifeStories.length === 0 ? ["No life-story memories captured — the moments they'll want to look back on are going unrecorded."] : [],
  );

  // ── Child's voice (quotes found in records) ────────────────────────────────
  const quotes: { date: string; quote: string; source: string }[] = [];
  for (const l of logs) {
    const q = extractQuote(s(l.content));
    if (q) quotes.push({ date: s(l.date), quote: q, source: "Daily log" });
  }
  for (const m of lifeStories) {
    if (s(m.child_voice)) quotes.push({ date: s(m.date), quote: s(m.child_voice), source: "Life-story entry" });
  }
  quotes.sort((a, b) => (b.date < a.date ? -1 : 1));
  const voice = dim(
    { recentQuotes: quotes.slice(0, 5) },
    quotes.slice(0, 5).map((q) => ({ source: q.source, date: q.date, weight: 2 })),
    quotes.length === 0 ? ["The child's own words are not appearing in the records."] : [],
  );

  // ── Relationships (compose the relational-timeline engine) ────────────────
  let relational: ReturnType<typeof buildRelationalTimeline> | undefined;
  try {
    relational = buildRelationalTimeline({
      childId,
      childName,
      now,
      keyWorkingSessions: input.keyWorkingSessions,
      debriefRecords: input.debriefRecords,
      incidents: input.incidents,
      familyTimeSessions: input.familyTimeSessions,
      missingEpisodes: input.missingEpisodes,
      returnInterviews: input.returnInterviews,
      positiveAchievements: input.positiveAchievements,
      educationRecords: input.educationRecords,
      lacReviews: input.lacReviews,
      trustedAdults: arr(pace?.trustedAdults),
      staffName: input.staffName,
    } as RelationalTimelineInput);
  } catch {
    /* dimension stays gap-flagged */
  }
  const relationships = dim(
    {
      trustedAdults: relational?.stability.trustedAdults ?? arr(pace?.trustedAdults),
      keyConnector: relational?.stability.keyConnectors[0]?.name,
      relationalStatus: relational?.stability.status,
      friendships: arr(friendships?.friendship_strengths),
      friendshipConcerns: arr(friendships?.friendship_challenges),
      connections30d: relational?.stability.connectionsLast30d,
      repairs: relational?.stability.repairCount,
      ruptures: relational?.stability.ruptureCount,
    },
    relational ? [{ source: "Relational timeline engine", weight: relational.stability.connectionsLast30d > 0 ? 4 : 1 }] : [],
    [
      ...(relational ? [] : ["Relational picture could not be computed."]),
      ...(friendships ? [] : ["No friendship map — who are their friends, and is anyone lonely here?"]),
    ],
  );

  // ── Emotional (compose the emotional-safety engine) ────────────────────────
  let emotionalRead: ReturnType<typeof buildEmotionalSafetyAnalysis> | undefined;
  try {
    emotionalRead = buildEmotionalSafetyAnalysis({
      childId,
      childName,
      now,
      behaviourLog: input.behaviourLog,
      incidents: input.incidents,
      keyWorkingSessions: input.keyWorkingSessions,
      knownTriggers: arr(pace?.knownTriggers),
      calmingApproaches: arr(pace?.calmingApproaches),
    } as EmotionalSafetyInput);
  } catch {
    /* gap-flagged below */
  }
  const emotional = dim(
    {
      status: emotionalRead?.status,
      trend: emotionalRead?.escalation.trend,
      peakTime: emotionalRead?.escalation.peakTime ?? null,
      triggers: emotionalRead?.triggers.slice(0, 4).map((t) => t.label) ?? arr(pace?.knownTriggers),
      whatHelps: emotionalRead?.whatHelps.slice(0, 4).map((w) => w.label) ?? arr(pace?.calmingApproaches),
      phrasesThatHelp: arr(pace?.phrasesThatHelp),
      phrasesThatEscalate: arr(pace?.phrasesThatEscalate),
    },
    emotionalRead ? [{ source: "Emotional safety engine", weight: 4 }] : [],
    emotionalRead ? [] : ["Emotional-safety read unavailable — not enough behaviour/incident recording."],
  );

  // ── Progress (compose the outcome engine) ──────────────────────────────────
  let outcome: ReturnType<typeof buildOutcomeIntelligence> | undefined;
  try {
    outcome = buildOutcomeIntelligence({
      childId,
      childName,
      now,
      keyWorkingSessions: input.keyWorkingSessions,
      incidents: input.incidents,
      missingEpisodes: input.missingEpisodes,
      educationRecords: input.educationRecords,
      positiveAchievements: input.positiveAchievements,
      familyTimeSessions: input.familyTimeSessions,
      returnInterviews: input.returnInterviews,
      lacReviews: input.lacReviews,
      trustedAdults: arr(pace?.trustedAdults),
    } as OutcomeIntelligenceInput);
  } catch {
    /* gap-flagged below */
  }
  const progress = dim(
    {
      trajectory: outcome?.overallTrajectory,
      headline: outcome?.headline,
      improving: outcome?.domainsImproving,
      declining: outcome?.domainsDeclining,
      focus: outcome?.domains.filter((d) => d.status === "needs_focus").map((d) => d.label) ?? [],
    },
    outcome ? [{ source: "Outcome intelligence engine (5 domains)", weight: 4 }] : [],
    outcome ? [] : ["Progress read unavailable."],
  );

  // ── Protective factors ──────────────────────────────────────────────────────
  const factors: { label: string; source: string }[] = [];
  for (const t of relationships.data.trustedAdults) factors.push({ label: `Trusted adult: ${t}`, source: "PACE profile / relational timeline" });
  if (relationships.data.friendships.length) factors.push({ label: "Positive friendships", source: "Friendship map" });
  if (mine(input.educationRecords).length) factors.push({ label: "Education engagement", source: "Education records" });
  for (const i of interests.slice(0, 3)) factors.push({ label: `Interest: ${i}`, source: "Personal passport" });
  for (const c of emotional.data.whatHelps.slice(0, 2)) factors.push({ label: `Coping strategy: ${c}`, source: "Emotional safety engine" });
  const protectiveFactors = dim(
    { factors },
    factors.length ? [{ source: "Composed from profile + engines", weight: Math.min(factors.length, 5) }] : [],
    factors.length === 0 ? ["No protective factors identified — that is itself a risk signal worth reviewing."] : [],
  );

  // ── Lived experience (significance-weighted, never a tally) ────────────────
  const livedEvidence: TwinEvidence[] = [];
  for (const a of achievements.filter((x) => withinDays(s(x.date), now, 30))) {
    livedEvidence.push({ source: "Achievement celebrated", date: s(a.date), weight: 3 + (s(a.celebrated_how) ? 1 : 0), note: s(a.title) });
  }
  for (const k of keywork.filter((x) => withinDays(s(x.date ?? x.session_date), now, 30))) {
    const before = num(k.mood_before);
    const after = num(k.mood_after);
    if (before !== undefined && after !== undefined && after - before >= 2) {
      livedEvidence.push({ source: "Key-work session — mood lifted", date: s(k.date ?? k.session_date), weight: 3 });
    } else if (before !== undefined && after !== undefined && after > before) {
      livedEvidence.push({ source: "Key-work session — mood improved", date: s(k.date ?? k.session_date), weight: 2 });
    }
  }
  for (const l of logs.filter((x) => withinDays(s(x.date), now, 30))) {
    const content = s(l.content);
    if (hasChildVoice(content)) livedEvidence.push({ source: "Daily log carrying the child's voice", date: s(l.date), weight: 2 });
  }
  for (const f of mine(input.familyTimeSessions).filter((x) => withinDays(s(x.date ?? x.session_date), now, 30))) {
    livedEvidence.push({ source: "Family time", date: s(f.date ?? f.session_date), weight: 2 });
  }
  const meaningful = livedEvidence.reduce((acc, e) => acc + e.weight, 0);
  const livedExperience = dim(
    {
      meaningfulMoments30d: meaningful,
      celebrations: achievements.filter((a) => s(a.celebrated_how)).slice(0, 3).map((a) => s(a.title)),
      ordinarySignals: livedEvidence.filter((e) => e.source === "Family time").length ? ["Regular family time"] : [],
    },
    livedEvidence,
    meaningful === 0 ? ["Little evidence of joy, celebration or ordinary childhood moments in the last 30 days — is the childhood being recorded, or only the care?"] : [],
  );

  // ── Risks & needs (proportionate — never the headline) ─────────────────────
  const openRisks = [...new Set(mine(input.riskAssessments).flatMap((r) => arr(r.risk_areas ?? r.categories)))];
  const risksAndNeeds = dim(
    { openRiskAreas: openRisks.slice(0, 6), knownTriggers: arr(pace?.knownTriggers) },
    mine(input.riskAssessments).length ? [{ source: "Risk assessments", weight: 2 }] : [],
    [],
  );

  // ── Contradictions (review prompts, never verdicts) ────────────────────────
  const contradictions: string[] = [];
  if (relationships.data.trustedAdults.length > 0 && (relationships.data.connections30d ?? 0) === 0) {
    contradictions.push("The profile names trusted adults, but the last 30 days show no recorded connection moments — is the relationship live, or is the recording missing it?");
  }
  if ((relationships.data.ruptures ?? 0) > (relationships.data.repairs ?? 0) && emotional.data.status === "secure") {
    contradictions.push("Ruptures outnumber repairs while the emotional read looks settled — worth checking the repair work is actually being recorded.");
  }

  // ── Missing information rollup ──────────────────────────────────────────────
  const missingInformation = [
    ...identity.gaps,
    ...strengths.gaps,
    ...aspirationDim.gaps,
    ...lifeStory.gaps,
    ...voice.gaps,
    ...relationships.gaps,
    ...livedExperience.gaps,
  ];

  return {
    childId,
    name: childName,
    generatedAt: now,
    engineVersion: CPIE_VERSION,
    identity,
    strengths,
    aspirations: aspirationDim,
    lifeStory,
    voice,
    relationships,
    emotional,
    progress,
    protectiveFactors,
    livedExperience,
    risksAndNeeds,
    contradictions,
    missingInformation,
  };
}
