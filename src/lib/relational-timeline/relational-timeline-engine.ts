// ─────────────────────────────────────────────────────────────────────────────
// Relational Timeline Engine
//
// Philosophy: "Relationships are the intervention."
//
// The sector records EVENTS. CARA records the child's RELATIONAL STORY. This
// engine is a PURE PROJECTION over records the child already has — it never
// duplicates or stores anything. It re-reads the existing collections (key-work,
// incidents, debriefs, family time, missing episodes, return interviews,
// achievements) and re-tells them through a relational lens: connection, repair,
// rupture, breakthrough, reunion, voice and achievement — then surfaces
// deterministic Relationship Intelligence (trusted adults, who the child
// connects with, repair-vs-rupture balance, mood trajectory, consistency).
//
// Intelligence informs practice. People decide. This engine never makes a
// safeguarding, care or disciplinary decision — it surfaces what a busy team
// might miss and leaves the judgement to the humans.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  KeyWorkingSession,
  DebriefRecord,
  FamilyTimeSession,
  MissingEpisode,
  PositiveAchievement,
  ReturnInterview,
  EducationRecord,
  LACReview,
} from "@/types/extended";
import type { Incident } from "@/types";

// ── Relational vocabulary ────────────────────────────────────────────────────

/** The relational MEANING of a moment — not the source form it was recorded in. */
export type RelationalLens =
  | "connection" // trusted time together (key-work, positive family time)
  | "repair" // reconnecting after rupture (debrief, return interview)
  | "breakthrough" // a measurable positive shift in the relationship/regulation
  | "achievement" // something celebrated together
  | "rupture" // a break in safety or relationship (incident, going missing)
  | "reunion" // family contact / coming back
  | "voice"; // the child's wishes & feelings captured

export type RelationalTone = "nurturing" | "neutral" | "concern" | "rupture";

export type RelationalStatus = "secure" | "developing" | "fragile";

export interface RelationalMoment {
  id: string;
  date: string; // ISO YYYY-MM-DD (sortable)
  lens: RelationalLens;
  tone: RelationalTone;
  source: string; // collection it was projected from
  sourceId: string;
  title: string;
  detail: string;
  staffIds: string[];
  staffNames: string[];
  /** The child's own words, where this record captured them. */
  childVoice: string | null;
  /** Mood 1–5 before/after, where the source measured it. */
  moodShift: { before: number; after: number } | null;
  /** True when a PACE-identified trusted adult was part of this moment. */
  trustedAdultPresent: boolean;
  /** True when a deliberate repair/reconnection attempt was recorded. */
  repairAttempted: boolean;
  riskLevel: "low" | "medium" | "high" | "critical" | null;
}

export interface RelationalInsight {
  /** A stable key so the UI can theme/dedupe; not shown to the user. */
  key: string;
  tone: "positive" | "watch" | "gap";
  text: string;
}

export interface RelationalStability {
  status: RelationalStatus;
  statusReason: string;
  trustedAdults: string[];
  /** Staff the child shares the most connection moments with, most first. */
  keyConnectors: { staffId: string; name: string; connections: number }[];
  connectionCount: number;
  repairCount: number;
  ruptureCount: number;
  achievementCount: number;
  /** Of key-work sessions that measured mood, how many improved. */
  moodImproved: number;
  moodMeasured: number;
  /** Connection moments in the last 30 days — a proxy for relational consistency. */
  connectionsLast30d: number;
}

export interface RelationalMonth {
  month: string; // YYYY-MM
  connection: number;
  repair: number;
  rupture: number;
  achievement: number;
}

export interface RelationalTrend {
  /** Per-month counts, oldest → newest, for a sparkline / mini-chart. */
  monthly: RelationalMonth[];
  /** Direction of travel of the relationship over the recent window. */
  direction: "improving" | "stable" | "declining";
  directionReason: string;
}

export interface RelationalTimeline {
  childId: string;
  childName: string;
  generatedAt: string;
  moments: RelationalMoment[]; // newest first
  stability: RelationalStability;
  trend: RelationalTrend;
  insights: RelationalInsight[];
}

export interface RelationalTimelineInput {
  childId: string;
  childName: string;
  now: string; // injected ISO timestamp → deterministic
  keyWorkingSessions: KeyWorkingSession[];
  debriefRecords: DebriefRecord[];
  incidents: Incident[];
  familyTimeSessions: FamilyTimeSession[];
  missingEpisodes: MissingEpisode[];
  returnInterviews: ReturnInterview[];
  positiveAchievements: PositiveAchievement[];
  educationRecords: EducationRecord[];
  lacReviews: LACReview[];
  /**
   * PACE-identified trusted adults the child turns to. These are stored as
   * display names (e.g. "Olivia (RM)"), not staff ids.
   */
  trustedAdults: string[];
  /** Injected name resolver so the engine stays pure & testable. */
  staffName: (id: string) => string;
}

/**
 * Build a predicate that decides whether a staff id belongs to a PACE trusted
 * adult. Trusted adults are free-text names with role suffixes ("Olivia (RM)"),
 * so match on the leading name token against the resolved staff name.
 */
function makeTrustMatcher(
  trustedAdults: string[],
  staffName: (id: string) => string,
): (staffId: string) => boolean {
  const firstTokens = trustedAdults
    .map((t) => t.split("(")[0].trim().toLowerCase())
    .filter(Boolean);
  return (staffId: string) => {
    const sn = staffName(staffId);
    if (!sn || sn.toLowerCase() === "unknown") return false;
    const snl = sn.toLowerCase();
    return firstTokens.some((t) => t === snl || snl.includes(t) || t.includes(snl));
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Signed age in days: positive when `iso` is in the past relative to `nowIso`,
// negative when it is in the future. (Previously used Math.abs, which made a
// future-dated moment read as "recent" — see recentlyWithin.)
function daysBetween(iso: string, nowIso: string): number {
  const a = Date.parse(iso);
  const b = Date.parse(nowIso);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.POSITIVE_INFINITY;
  return (b - a) / 86_400_000;
}

// True only for a moment that is in the past (or today) and within `days`. A
// future-dated record must never count toward a "recent" window.
function recentlyWithin(iso: string, nowIso: string, days: number): boolean {
  const d = daysBetween(iso, nowIso);
  return d >= 0 && d <= days;
}

const SEVERITY_RISK: Record<string, "low" | "medium" | "high" | "critical"> = {
  minor: "low",
  low: "low",
  moderate: "medium",
  medium: "medium",
  serious: "high",
  high: "high",
  major: "high",
  critical: "critical",
};

// ── Projection: each collection → relational moments ─────────────────────────

function projectKeywork(
  s: KeyWorkingSession,
  isTrusted: (staffId: string) => boolean,
  staffName: (id: string) => string,
): RelationalMoment {
  // Mood unrecorded → improvement unknowable → 0: never a fabricated breakthrough.
  const improved = s.mood_after != null && s.mood_before != null ? s.mood_after - s.mood_before : 0;
  const lens: RelationalLens = improved >= 2 ? "breakthrough" : "connection";
  return {
    id: `rt_kw_${s.id}`,
    date: s.date,
    lens,
    tone: improved < 0 ? "concern" : "nurturing",
    source: "keyWorkingSessions",
    sourceId: s.id,
    title:
      lens === "breakthrough"
        ? `Breakthrough in key-work with ${staffName(s.staff_id)}`
        : `Key-work time with ${staffName(s.staff_id)}`,
    detail:
      s.worker_observations?.trim() ||
      (s.topics?.length ? `Talked about ${s.topics.join(", ")}.` : "1:1 relational time."),
    staffIds: [s.staff_id],
    staffNames: [staffName(s.staff_id)],
    childVoice: s.child_voice?.trim() || null,
    moodShift:
      s.mood_before && s.mood_after ? { before: s.mood_before, after: s.mood_after } : null,
    trustedAdultPresent: isTrusted(s.staff_id),
    repairAttempted: false,
    riskLevel: null,
  };
}

function projectDebrief(
  d: DebriefRecord,
  isTrusted: (staffId: string) => boolean,
  staffName: (id: string) => string,
): RelationalMoment {
  const present = (d.staff_involved ?? []).some((id) => isTrusted(id));
  return {
    id: `rt_db_${d.id}`,
    date: d.date,
    lens: "repair",
    tone: "nurturing",
    source: "debriefRecords",
    sourceId: d.id,
    title: "Repair conversation after an incident",
    detail:
      d.what_worked_well?.trim() ||
      d.changes_needed?.join("; ") ||
      "Reflective debrief to reconnect and learn.",
    staffIds: d.staff_involved ?? [],
    staffNames: (d.staff_involved ?? []).map(staffName),
    childVoice: d.child_perspective?.trim() || null,
    moodShift: null,
    trustedAdultPresent: present,
    repairAttempted: true,
    riskLevel: null,
  };
}

function projectIncident(
  i: Incident,
  staffName: (id: string) => string,
): RelationalMoment {
  const risk = SEVERITY_RISK[String(i.severity)] ?? "medium";
  return {
    id: `rt_inc_${i.id}`,
    date: i.date,
    lens: "rupture",
    tone: risk === "critical" || risk === "high" ? "rupture" : "concern",
    source: "incidents",
    sourceId: i.id,
    title: `Incident — ${String(i.type).replace(/_/g, " ")}`,
    detail: i.description?.trim() || "Incident recorded.",
    staffIds: i.reported_by ? [i.reported_by] : [],
    staffNames: i.reported_by ? [staffName(i.reported_by)] : [],
    childVoice: null,
    moodShift: null,
    trustedAdultPresent: false,
    repairAttempted: false,
    riskLevel: risk,
  };
}

function projectFamilyTime(
  f: FamilyTimeSession,
  staffName: (id: string) => string,
): RelationalMoment {
  const safe = f.was_it_safe !== false;
  const hasConcerns = (f.concerns_raised ?? []).length > 0;
  return {
    id: `rt_ft_${f.id}`,
    date: f.date,
    lens: "reunion",
    tone: !safe || hasConcerns ? "concern" : "nurturing",
    source: "familyTimeSessions",
    sourceId: f.id,
    title: `Family time with ${f.family_member_name || "family"}`,
    detail:
      f.positive_observations?.join("; ") ||
      f.warmth_affection_shown?.trim() ||
      f.child_presentation_after?.trim() ||
      "Family contact session.",
    staffIds: f.supervised_by ? [f.supervised_by] : [],
    staffNames: f.supervised_by ? [staffName(f.supervised_by)] : [],
    childVoice: f.child_voice_after?.trim() || null,
    moodShift: null,
    trustedAdultPresent: false,
    repairAttempted: false,
    riskLevel: null,
  };
}

function projectMissing(m: MissingEpisode): RelationalMoment {
  return {
    id: `rt_miss_${m.id}`,
    date: m.date_missing,
    lens: "rupture",
    tone: "rupture",
    source: "missingEpisodes",
    sourceId: m.id,
    title: m.date_returned ? "Missing from care — returned safely" : "Missing from care",
    detail: m.date_returned
      ? `Away from ${m.date_missing}, returned ${m.date_returned}.`
      : `Currently away from care since ${m.date_missing}.`,
    staffIds: [],
    staffNames: [],
    childVoice: null,
    moodShift: null,
    trustedAdultPresent: false,
    repairAttempted: false,
    riskLevel: m.risk_level ?? "high",
  };
}

function projectReturnInterview(
  r: ReturnInterview,
  staffName: (id: string) => string,
): RelationalMoment {
  return {
    id: `rt_rhi_${r.id}`,
    date: r.interview_date || r.return_date,
    lens: "voice",
    tone: "nurturing",
    source: "returnInterviews",
    sourceId: r.id,
    title: "Return home interview — the child's perspective",
    detail: "A relational, non-judgemental conversation about what happened and what helps.",
    staffIds: r.interviewed_by ? [r.interviewed_by] : [],
    staffNames: r.interviewed_by ? [staffName(r.interviewed_by)] : [],
    childVoice:
      [r.child_view_on_safety, r.what_would_help]
        .map((t) => t?.trim())
        .filter(Boolean)
        .join(" — ") ||
      r.notes?.trim() ||
      null,
    moodShift: null,
    trustedAdultPresent: false,
    repairAttempted: true,
    riskLevel: null,
  };
}

function projectAchievement(
  a: PositiveAchievement,
  staffName: (id: string) => string,
): RelationalMoment {
  return {
    id: `rt_ach_${a.id}`,
    date: a.date,
    lens: "achievement",
    tone: "nurturing",
    source: "positiveAchievements",
    sourceId: a.id,
    title: a.title || "Achievement celebrated",
    detail: a.description?.trim() || a.celebrated_how?.trim() || "A positive moment, celebrated together.",
    staffIds: a.recorded_by ? [a.recorded_by] : [],
    staffNames: a.recorded_by ? [staffName(a.recorded_by)] : [],
    childVoice: a.child_reaction?.trim() || null,
    moodShift: null,
    trustedAdultPresent: false,
    repairAttempted: false,
    riskLevel: null,
  };
}

/** School successes (and ruptures) are part of the relational story too.
 *  Only the meaningful record types become moments; routine ones are skipped. */
function projectEducation(e: EducationRecord): RelationalMoment | null {
  const isWin = e.record_type === "achievement" || e.record_type === "attainment";
  const isRupture = e.record_type === "exclusion" || e.record_type === "concern";
  if (!isWin && !isRupture) return null;
  return {
    id: `rt_edu_${e.id}`,
    date: e.date,
    lens: isWin ? "achievement" : "rupture",
    tone: isWin ? "nurturing" : "concern",
    source: "educationRecords",
    sourceId: e.id,
    title: isWin ? `School success — ${e.title}` : `School ${e.record_type === "exclusion" ? "exclusion" : "concern"} — ${e.title}`,
    detail: e.details?.trim() || e.outcome?.trim() || (e.school ? `At ${e.school}.` : "Education record."),
    staffIds: [],
    staffNames: [],
    childVoice: null,
    moodShift: null,
    trustedAdultPresent: false,
    repairAttempted: false,
    riskLevel: isRupture ? "medium" : null,
  };
}

/** A LAC review is a relational "voice" moment when the child's views are on record. */
function projectLacReview(l: LACReview): RelationalMoment | null {
  if (!l.child_views?.trim()) return null;
  return {
    id: `rt_lac_${l.id}`,
    date: l.date,
    lens: "voice",
    tone: "nurturing",
    source: "lacReviews",
    sourceId: l.id,
    title: "LAC review — the child's views were heard",
    detail: "The child's wishes and feelings were recorded at their statutory review.",
    staffIds: [],
    staffNames: [],
    childVoice: l.child_views.trim(),
    moodShift: null,
    trustedAdultPresent: false,
    repairAttempted: false,
    riskLevel: null,
  };
}

// ── Stability + insights (the "intelligence" layer) ──────────────────────────

function computeStability(
  moments: RelationalMoment[],
  trustedAdultNames: string[],
  now: string,
): RelationalStability {
  const connection = moments.filter((m) => m.lens === "connection" || m.lens === "breakthrough");
  const repairs = moments.filter((m) => m.repairAttempted);
  const ruptures = moments.filter((m) => m.lens === "rupture");
  const achievements = moments.filter((m) => m.lens === "achievement");

  // Who does the child connect with most?
  const byStaff = new Map<string, { name: string; n: number }>();
  for (const m of connection) {
    m.staffIds.forEach((id, idx) => {
      const e = byStaff.get(id) ?? { name: m.staffNames[idx] ?? id, n: 0 };
      e.n += 1;
      byStaff.set(id, e);
    });
  }
  const keyConnectors = [...byStaff.entries()]
    .map(([staffId, v]) => ({ staffId, name: v.name, connections: v.n }))
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 3);

  const moodMeasured = moments.filter((m) => m.moodShift).length;
  const moodImproved = moments.filter((m) => m.moodShift && m.moodShift.after > m.moodShift.before).length;
  const connectionsLast30d = connection.filter((m) => recentlyWithin(m.date, now, 30)).length;

  // Deterministic relational status. Trusted adults + recent connection +
  // repair keeping pace with rupture ⇒ secure. Isolation + unrepaired rupture ⇒ fragile.
  let status: RelationalStatus;
  let statusReason: string;
  const hasTrusted = trustedAdultNames.length > 0;
  const repairsRupture = repairs.length >= ruptures.length;
  if (hasTrusted && connectionsLast30d >= 2 && repairsRupture) {
    status = "secure";
    statusReason = `${trustedAdultNames.length} trusted adult${trustedAdultNames.length === 1 ? "" : "s"}, regular connection, and repair keeping pace with rupture.`;
  } else if (!hasTrusted && connectionsLast30d === 0 && ruptures.length > 0) {
    status = "fragile";
    statusReason = "No trusted adult identified, no recent connection, and unresolved rupture — prioritise relational repair.";
  } else if (connectionsLast30d === 0) {
    status = "fragile";
    statusReason = "No connection moments recorded in the last 30 days — relational consistency needs attention.";
  } else {
    status = "developing";
    statusReason = hasTrusted
      ? "Trusted relationships forming; keep connection consistent and repair after every rupture."
      : "Connection is happening but no clear trusted adult yet — build relational anchors.";
  }

  return {
    status,
    statusReason,
    trustedAdults: trustedAdultNames,
    keyConnectors,
    connectionCount: connection.length,
    repairCount: repairs.length,
    ruptureCount: ruptures.length,
    achievementCount: achievements.length,
    moodImproved,
    moodMeasured,
    connectionsLast30d,
  };
}

function buildInsights(
  moments: RelationalMoment[],
  stability: RelationalStability,
  now: string,
): RelationalInsight[] {
  const out: RelationalInsight[] = [];

  if (stability.trustedAdults.length > 0) {
    out.push({
      key: "trusted-adults",
      tone: "positive",
      text: `Trusted adult${stability.trustedAdults.length === 1 ? "" : "s"} the child turns to: ${stability.trustedAdults.join(", ")}.`,
    });
  } else {
    out.push({
      key: "no-trusted-adult",
      tone: "gap",
      text: "No trusted adult is recorded in this child's PACE profile yet — a relational priority.",
    });
  }

  const top = stability.keyConnectors[0];
  if (top && top.connections >= 2) {
    out.push({
      key: "key-connector",
      tone: "positive",
      text: `Strongest connection is with ${top.name} (${top.connections} relational moments) — protect this relationship in rotas.`,
    });
  }

  if (stability.moodMeasured > 0) {
    out.push({
      key: "mood-trajectory",
      tone: stability.moodImproved * 2 >= stability.moodMeasured ? "positive" : "watch",
      text: `Mood improved in ${stability.moodImproved} of ${stability.moodMeasured} sessions that measured it.`,
    });
  }

  // Repair gap: a rupture in the last 30 days with no repair recorded after it.
  const recentRuptures = moments.filter((m) => m.lens === "rupture" && recentlyWithin(m.date, now, 30));
  const recentRepairs = moments.filter((m) => m.repairAttempted && recentlyWithin(m.date, now, 30));
  if (recentRuptures.length > 0 && recentRepairs.length === 0) {
    out.push({
      key: "repair-gap",
      tone: "gap",
      text: `${recentRuptures.length} rupture${recentRuptures.length === 1 ? "" : "s"} in the last 30 days with no repair conversation recorded — consider a restorative debrief.`,
    });
  } else if (recentRepairs.length > 0) {
    out.push({
      key: "repair-active",
      tone: "positive",
      text: `${recentRepairs.length} repair conversation${recentRepairs.length === 1 ? "" : "s"} in the last 30 days — repair is keeping pace.`,
    });
  }

  if (stability.achievementCount > 0) {
    out.push({
      key: "achievements",
      tone: "positive",
      text: `${stability.achievementCount} achievement${stability.achievementCount === 1 ? "" : "s"} celebrated together — strengthens belonging.`,
    });
  }

  return out;
}

function computeTrend(moments: RelationalMoment[], now: string): RelationalTrend {
  // Per-month buckets (oldest → newest).
  const byMonth = new Map<string, RelationalMonth>();
  for (const m of moments) {
    const month = m.date.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) continue;
    const e =
      byMonth.get(month) ?? { month, connection: 0, repair: 0, rupture: 0, achievement: 0 };
    if (m.lens === "connection" || m.lens === "breakthrough") e.connection += 1;
    if (m.repairAttempted) e.repair += 1;
    if (m.lens === "rupture") e.rupture += 1;
    if (m.lens === "achievement") e.achievement += 1;
    byMonth.set(month, e);
  }
  const monthly = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

  // Direction of travel: recent 60d connection+repair vs the prior 60d, tempered
  // by rupture. A relationship is "improving" when warmth is increasing and
  // ruptures aren't outpacing repair.
  const within = (m: RelationalMoment, lo: number, hi: number) => {
    const age = (Date.parse(now) - Date.parse(m.date)) / 86_400_000;
    return age >= lo && age < hi;
  };
  const warmth = (lo: number, hi: number) =>
    moments.filter((m) => within(m, lo, hi) && (m.lens === "connection" || m.lens === "breakthrough" || m.repairAttempted || m.lens === "achievement")).length;
  const rupture = (lo: number, hi: number) => moments.filter((m) => within(m, lo, hi) && m.lens === "rupture").length;

  const recentWarmth = warmth(0, 60);
  const priorWarmth = warmth(60, 120);
  const recentRupture = rupture(0, 60);

  // A direction of travel needs more than a single data point: one moment has no
  // trajectory. With fewer than two relational moments in the comparison window,
  // report "stable" rather than manufacture an improving/declining trend from a
  // lone event (e.g. a single incident must not read as "relationship declining").
  const trendMoments = moments.filter((m) => within(m, 0, 120)).length;
  if (trendMoments < 2) {
    return {
      monthly,
      direction: "stable",
      directionReason: "Not enough relational history yet to show a clear direction of travel.",
    };
  }

  let direction: RelationalTrend["direction"];
  let directionReason: string;
  if (recentWarmth > priorWarmth && recentWarmth >= recentRupture) {
    direction = "improving";
    directionReason = "More connection, repair and achievement recently than before — the relationship is warming.";
  } else if (recentWarmth < priorWarmth || (recentRupture > recentWarmth && recentRupture > 0)) {
    direction = "declining";
    directionReason =
      recentRupture > recentWarmth
        ? "Rupture is outpacing connection and repair this period — prioritise relational time."
        : "Less connection than the previous period — protect and increase relational time.";
  } else {
    direction = "stable";
    directionReason = "Connection and repair are holding steady.";
  }

  return { monthly, direction, directionReason };
}

// ── Public entry point — pure ────────────────────────────────────────────────

export function buildRelationalTimeline(input: RelationalTimelineInput): RelationalTimeline {
  const name = input.staffName;
  const isTrusted = makeTrustMatcher(input.trustedAdults, name);

  const forChild = <T extends { child_id: string }>(rows: T[]): T[] =>
    (rows ?? []).filter((r) => r.child_id === input.childId);

  const moments: RelationalMoment[] = [
    ...forChild(input.keyWorkingSessions).map((s) => projectKeywork(s, isTrusted, name)),
    ...forChild(input.debriefRecords).map((d) => projectDebrief(d, isTrusted, name)),
    ...forChild(input.incidents).map((i) => projectIncident(i, name)),
    ...forChild(input.familyTimeSessions).map((f) => projectFamilyTime(f, name)),
    ...forChild(input.missingEpisodes).map((m) => projectMissing(m)),
    ...forChild(input.returnInterviews).map((r) => projectReturnInterview(r, name)),
    ...forChild(input.positiveAchievements).map((a) => projectAchievement(a, name)),
    ...forChild(input.educationRecords).map((e) => projectEducation(e)),
    ...forChild(input.lacReviews).map((l) => projectLacReview(l)),
  ].filter((m): m is RelationalMoment => !!m && !!m.date);

  // Newest first — the team's "what's happening now" view.
  moments.sort((a, b) => b.date.localeCompare(a.date));

  const trustedAdultNames = input.trustedAdults;
  const stability = computeStability(moments, trustedAdultNames, input.now);
  const trend = computeTrend(moments, input.now);
  const insights = buildInsights(moments, stability, input.now);

  return {
    childId: input.childId,
    childName: input.childName,
    generatedAt: input.now,
    moments,
    stability,
    trend,
    insights,
  };
}
