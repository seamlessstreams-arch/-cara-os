// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD WELLBEING TRAJECTORY INTELLIGENCE
// GET /api/v1/child-wellbeing-trajectory
//
// Synthesises five wellbeing domains across each child to show the direction
// of travel — not just current state, but whether things are getting better,
// holding, or getting harder. Answers the question every manager and Reg 44
// visitor asks: "How is this child doing, and are things improving?"
//
// Five domains (each scored: improving / stable / declining):
//   1. Emotional regulation  — mood trends from KW sessions and daily log
//   2. Safety                — incident + missing episode frequency trend
//   3. Therapeutic bond      — key work session quality and frequency trend
//   4. Agency & future hope  — aspiration ownership, outcome target progress
//   5. Daily stability       — recording frequency, significant event rate
//
// Overall trajectory signal: thriving / progressing / holding / struggling / crisis
//
// "Children flourish when they feel safe, connected, hopeful, and heard.
//  Our job is to be certain that the arc of each child's experience in our
//  care is bending towards those things — and to notice quickly when it isn't."
// — Reg 44; Social Pedagogy; DDP Practice Principles
//
// All deterministic. No LLM calls.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { londonDayDiff } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type DomainTrajectory = "improving" | "stable" | "declining";
type OverallTrajectory = "thriving" | "progressing" | "holding" | "struggling" | "crisis";

interface WellbeingDomain {
  name: string;
  trajectory: DomainTrajectory;
  detail: string;
  numerator: number;
  denominator: number;
}

interface ChildWellbeingProfile {
  childId: string;
  childName: string;
  placementDays: number;
  domains: WellbeingDomain[];
  improvingDomains: number;
  decliningDomains: number;
  overallTrajectory: OverallTrajectory;
  narrativeSummary: string;
  supervisionPrompt: string;
}

interface WellbeingTrajectorySummary {
  totalChildren: number;
  thriving: number;
  progressing: number;
  holding: number;
  struggling: number;
  crisis: number;
  homeTrend: "positive" | "mixed" | "concerning";
  priorityChildren: string[];
  ofstedNote: string;
}

// ── Domain calculators ────────────────────────────────────────────────────────

/** 1. Emotional regulation: mood trend from KW sessions + mood_score in daily log */
function emotionalDomain(
  childId: string,
  kwSessions: Array<{ child_id: string; date: string; mood_before: number; mood_after: number }>,
  dailyLog: Array<{ child_id: string; date: string; mood_score: number | null }>,
  cutoff30d: Date,
  cutoff60d: Date,
): WellbeingDomain {
  const childSessions = kwSessions.filter((s) => s.child_id === childId);
  const sessions30d = childSessions.filter((s) => new Date(s.date) >= cutoff30d);
  const sessionsPrior = childSessions.filter((s) => {
    const d = new Date(s.date);
    return d >= cutoff60d && d < cutoff30d;
  });

  const avgMoodLift = (sessions: typeof childSessions): number | null => {
    const valid = sessions.filter((s) => s.mood_before != null && s.mood_after != null);
    if (valid.length === 0) return null;
    return valid.reduce((s, r) => s + (r.mood_after - r.mood_before), 0) / valid.length;
  };

  const lift30 = avgMoodLift(sessions30d);
  const liftPrior = avgMoodLift(sessionsPrior);

  // Daily log mood scores
  const moodEntries = dailyLog.filter((e) => e.child_id === childId && e.mood_score != null);
  const moods30d = moodEntries.filter((e) => new Date(e.date) >= cutoff30d).map((e) => e.mood_score as number);
  const moodsPrior = moodEntries.filter((e) => {
    const d = new Date(e.date);
    return d >= cutoff60d && d < cutoff30d;
  }).map((e) => e.mood_score as number);

  const avgMood = (arr: number[]): number | null => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const avg30 = avgMood(moods30d);
  const avgPrior = avgMood(moodsPrior);

  // Combine signals
  let improvingSignals = 0;
  let decliningSignals = 0;
  const details: string[] = [];

  if (lift30 !== null && liftPrior !== null) {
    if (lift30 > liftPrior + 0.2) { improvingSignals++; details.push("Mood improving in KW sessions"); }
    else if (lift30 < liftPrior - 0.2) { decliningSignals++; details.push("Mood declining in KW sessions"); }
    else details.push("Mood stable in KW sessions");
  } else if (lift30 !== null) {
    if (lift30 > 0.5) { improvingSignals++; details.push("Positive mood after KW sessions"); }
    else if (lift30 < -0.3) { decliningSignals++; details.push("Mood dipping after KW sessions"); }
  }

  if (avg30 !== null && avgPrior !== null) {
    if (avg30 > avgPrior + 0.3) { improvingSignals++; details.push("Daily mood score rising"); }
    else if (avg30 < avgPrior - 0.3) { decliningSignals++; details.push("Daily mood score falling"); }
  }

  const traj: DomainTrajectory = improvingSignals > decliningSignals ? "improving"
    : decliningSignals > improvingSignals ? "declining" : "stable";

  const detail = details.length > 0 ? details[0] : (sessions30d.length === 0 ? "No KW mood data in 30 days" : "Mood data present, trend stable");

  return { name: "Emotional regulation", trajectory: traj, detail, numerator: improvingSignals, denominator: improvingSignals + decliningSignals + 1 };
}

/** 2. Safety: incident + missing frequency trend */
function safetyDomain(
  childId: string,
  incidents: Array<{ child_id: string; date: string; incident_type: string }>,
  missing: Array<{ child_id: string; date_missing: string }>,
  cutoff30d: Date,
  cutoff60d: Date,
): WellbeingDomain {
  const childIncidents = incidents.filter((i) => i.child_id === childId);
  const inc30d = childIncidents.filter((i) => new Date(i.date) >= cutoff30d).length;
  const incPrior = childIncidents.filter((i) => {
    const d = new Date(i.date);
    return d >= cutoff60d && d < cutoff30d;
  }).length;

  const childMissing = missing.filter((m) => m.child_id === childId);
  const miss30d = childMissing.filter((m) => new Date(m.date_missing) >= cutoff30d).length;
  const missPrior = childMissing.filter((m) => {
    const d = new Date(m.date_missing);
    return d >= cutoff60d && d < cutoff30d;
  }).length;

  const total30d = inc30d + miss30d;
  const totalPrior = incPrior + missPrior;

  let traj: DomainTrajectory = "stable";
  let detail = `${total30d} safety events (30d)`;

  if (totalPrior === 0 && total30d === 0) {
    detail = "No safety events in 60 days";
  } else if (total30d === 0 && totalPrior > 0) {
    traj = "improving";
    detail = `Safety improving — 0 events in 30 days, ${totalPrior} in prior period`;
  } else if (total30d > totalPrior && total30d >= 2) {
    traj = "declining";
    detail = `Safety events rising: ${total30d} in 30d vs ${totalPrior} prior`;
  } else if (total30d < totalPrior && totalPrior >= 2) {
    traj = "improving";
    detail = `Safety events falling: ${total30d} in 30d vs ${totalPrior} prior`;
  }

  return { name: "Safety", trajectory: traj, detail, numerator: total30d, denominator: totalPrior + total30d + 1 };
}

/** 3. Therapeutic bond: KW session frequency + child voice trend */
function bondDomain(
  childId: string,
  kwSessions: Array<{ child_id: string; date: string; child_voice: string }>,
  cutoff30d: Date,
  cutoff60d: Date,
): WellbeingDomain {
  const childSessions = kwSessions.filter((s) => s.child_id === childId);
  const sessions30d = childSessions.filter((s) => new Date(s.date) >= cutoff30d);
  const sessionsPrior = childSessions.filter((s) => {
    const d = new Date(s.date);
    return d >= cutoff60d && d < cutoff30d;
  });

  const richVoice = (s: { child_voice: string }) => s.child_voice && s.child_voice.trim().length >= 30;

  const count30 = sessions30d.length;
  const countPrior = sessionsPrior.length;
  const voiceRate30 = count30 > 0 ? sessions30d.filter(richVoice).length / count30 : 0;
  const voiceRatePrior = countPrior > 0 ? sessionsPrior.filter(richVoice).length / countPrior : 0;

  let traj: DomainTrajectory = "stable";
  let detail = `${count30} KW sessions (30d)`;

  if (count30 === 0) {
    traj = "declining";
    detail = "No key work sessions in 30 days";
  } else if (count30 > countPrior && voiceRate30 >= 0.5) {
    traj = "improving";
    detail = `Bond strengthening — more sessions and richer child voice`;
  } else if (count30 < countPrior && count30 <= 1) {
    traj = "declining";
    detail = `Fewer KW sessions: ${count30} in 30d vs ${countPrior} prior`;
  } else if (voiceRate30 > voiceRatePrior + 0.2) {
    traj = "improving";
    detail = "Child voice quality improving in sessions";
  }

  return { name: "Therapeutic bond", trajectory: traj, detail, numerator: count30, denominator: count30 + countPrior + 1 };
}

/** 4. Agency & future hope: aspiration ownership + outcome direction */
function agencyDomain(
  childId: string,
  aspirations: Array<{ child_id: string; child_chose: boolean }>,
  outcomes: Array<{ child_id: string; direction: string; status: string }>,
): WellbeingDomain {
  const childAsp = aspirations.filter((a) => a.child_id === childId);
  const childOut = outcomes.filter((o) => o.child_id === childId);

  const childChosen = childAsp.filter((a) => a.child_chose).length;
  const aspirationRate = childAsp.length > 0 ? childChosen / childAsp.length : 0;

  const improving = childOut.filter((o) => o.direction === "improving" || o.status === "achieved").length;
  const declining = childOut.filter((o) => o.direction === "declining").length;

  let traj: DomainTrajectory = "stable";
  let detail = `${childAsp.length} aspirations, ${childOut.length} outcomes`;

  if (childAsp.length === 0 && childOut.length === 0) {
    traj = "declining";
    detail = "No aspirations or outcome targets documented";
  } else if (childAsp.length > 0 && aspirationRate >= 0.5 && improving > declining) {
    traj = "improving";
    detail = `${Math.round(aspirationRate * 100)}% child-chosen aspirations; outcomes progressing`;
  } else if (declining > improving) {
    traj = "declining";
    detail = `${declining} outcomes declining vs ${improving} improving`;
  } else if (childAsp.length > 0 && aspirationRate >= 0.5) {
    detail = `${Math.round(aspirationRate * 100)}% child-chosen aspirations`;
  }

  return { name: "Agency & future hope", trajectory: traj, detail, numerator: improving, denominator: declining + improving + 1 };
}

/** 5. Daily stability: recording frequency + significant event rate */
function stabilityDomain(
  childId: string,
  dailyLog: Array<{ child_id: string; date: string; is_significant: boolean }>,
  cutoff30d: Date,
  cutoff60d: Date,
): WellbeingDomain {
  const childEntries = dailyLog.filter((e) => e.child_id === childId);
  const entries30d = childEntries.filter((e) => new Date(e.date) >= cutoff30d);
  const entriesPrior = childEntries.filter((e) => {
    const d = new Date(e.date);
    return d >= cutoff60d && d < cutoff30d;
  });

  const sig30d = entries30d.filter((e) => e.is_significant).length;
  const sigPrior = entriesPrior.filter((e) => e.is_significant).length;
  const sigRate30d = entries30d.length > 0 ? sig30d / entries30d.length : 0;

  let traj: DomainTrajectory = "stable";
  let detail = `${entries30d.length} daily records (30d)`;

  if (entries30d.length < 5) {
    traj = "declining";
    detail = "Low recording — fewer than 5 daily log entries in 30 days";
  } else if (entries30d.length > entriesPrior.length && sig30d <= sigPrior) {
    traj = "improving";
    detail = `More consistent daily recording with fewer significant events`;
  } else if (sig30d > sigPrior + 1 && sigRate30d > 0.3) {
    traj = "declining";
    detail = `${sig30d} significant events in 30d — more than prior period`;
  } else if (sigPrior > sig30d + 1) {
    traj = "improving";
    detail = `Fewer significant events: ${sig30d} in 30d vs ${sigPrior} prior`;
  }

  return { name: "Daily stability", trajectory: traj, detail, numerator: entries30d.length, denominator: entries30d.length + entriesPrior.length + 1 };
}

/** Overall trajectory from 5 domain signals */
function overallTrajectory(domains: WellbeingDomain[]): OverallTrajectory {
  const improving = domains.filter((d) => d.trajectory === "improving").length;
  const declining = domains.filter((d) => d.trajectory === "declining").length;

  if (declining >= 3) return "crisis";
  if (declining >= 2) return "struggling";
  if (improving >= 3 && declining === 0) return "thriving";
  if (improving >= 2 && declining <= 1) return "progressing";
  return "holding";
}

/** Short narrative summary */
function buildNarrative(childName: string, traj: OverallTrajectory, domains: WellbeingDomain[]): string {
  const improvingNames = domains.filter((d) => d.trajectory === "improving").map((d) => d.name);
  const decliningNames = domains.filter((d) => d.trajectory === "declining").map((d) => d.name);

  if (traj === "thriving") {
    return `${childName} is showing positive trajectory across multiple domains. ${improvingNames.slice(0, 2).join(" and ")} are both improving. This should be celebrated and explored in supervision.`;
  }
  if (traj === "crisis") {
    return `${childName} is showing declining trajectory in ${decliningNames.length} domains including ${decliningNames.slice(0, 2).join(" and ")}. Urgent management review needed.`;
  }
  if (traj === "struggling") {
    return `${childName} is struggling in ${decliningNames.join(" and ")}. Explore in next supervision whether current support is meeting their needs.`;
  }
  if (traj === "progressing") {
    return `${childName} is progressing — ${improvingNames.slice(0, 2).join(" and ")} improving${decliningNames.length > 0 ? `, with attention needed on ${decliningNames[0]}` : ""}.`;
  }
  return `${childName}'s trajectory is holding across most domains. Review current support plans in supervision.`;
}

/** Supervision prompt per overall trajectory */
function buildPrompt(childName: string, traj: OverallTrajectory, declining: string[], improving: string[]): string {
  if (traj === "crisis") {
    return `${childName} is showing a concerning decline across ${declining.length} domains: ${declining.join(", ")}. This warrants an urgent consultation in supervision. What has changed? Has the placement plan been reviewed recently? What does the child say?`;
  }
  if (traj === "thriving") {
    return `${childName} is thriving — ${improving.join(" and ")} all improving. Explore in supervision: what is the team doing that's working? Document it so it can be shared and sustained.`;
  }
  if (declining.length > 0) {
    return `${childName}'s ${declining[0]} is declining. In supervision, explore what's underneath this and whether the team's response needs to adapt. Is the current care plan still the right one?`;
  }
  return `${childName}'s trajectory is stable. In supervision, explore whether any domains are at risk of sliding and whether proactive support is in place.`;
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const [aspirationRecordsList, dailyLogList, incidentsList, keyWorkingSessionsList, missingEpisodesList, outcomeTargetsList, youngPeopleList] = await Promise.all([
      dal.aspirationRecords.findAll(),
      dal.dailyLog.findAll(),
      dal.incidents.findAll(),
      dal.keyWorkingSessions.findAll(),
      dal.missingEpisodes.findAll(),
      dal.outcomeTargets.findAll(),
      dal.youngPeople.findAll(),
    ]);
  const now = new Date();
  const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const cutoff60d = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const youngPeople = (youngPeopleList ?? []) as Array<{
    id: string; first_name: string; last_name: string; status: string; placement_start: string;
  }>;
  const kwSessions = (keyWorkingSessionsList ?? []) as Array<{
    child_id: string; date: string; child_voice: string; mood_before: number; mood_after: number;
  }>;
  const incidents = ((incidentsList ?? []) as unknown) as Array<{
    child_id: string; date: string; incident_type: string;
  }>;
  const missing = (missingEpisodesList ?? []) as Array<{
    child_id: string; date_missing: string;
  }>;
  const aspirations = (aspirationRecordsList ?? []) as Array<{
    child_id: string; child_chose: boolean;
  }>;
  const outcomes = (outcomeTargetsList ?? []) as Array<{
    child_id: string; direction: string; status: string;
  }>;
  const dailyLog = (dailyLogList ?? []) as Array<{
    child_id: string; date: string; mood_score: number | null; is_significant: boolean;
  }>;

  const currentChildren = youngPeople.filter((yp) => yp.status === "current");

  const childProfiles: ChildWellbeingProfile[] = currentChildren.map((yp) => {
    const placementDays = Math.floor(
      -londonDayDiff(yp.placement_start, now),
    );

    const domains = [
      emotionalDomain(yp.id, kwSessions, dailyLog, cutoff30d, cutoff60d),
      safetyDomain(yp.id, incidents, missing, cutoff30d, cutoff60d),
      bondDomain(yp.id, kwSessions, cutoff30d, cutoff60d),
      agencyDomain(yp.id, aspirations, outcomes),
      stabilityDomain(yp.id, dailyLog, cutoff30d, cutoff60d),
    ];

    const improving = domains.filter((d) => d.trajectory === "improving").map((d) => d.name);
    const declining = domains.filter((d) => d.trajectory === "declining").map((d) => d.name);
    const traj = overallTrajectory(domains);

    return {
      childId: yp.id,
      childName: `${yp.first_name} ${yp.last_name}`,
      placementDays,
      domains,
      improvingDomains: improving.length,
      decliningDomains: declining.length,
      overallTrajectory: traj,
      narrativeSummary: buildNarrative(`${yp.first_name} ${yp.last_name}`, traj, domains),
      supervisionPrompt: buildPrompt(`${yp.first_name} ${yp.last_name}`, traj, declining, improving),
    };
  });

  // Sort: crisis → struggling → holding → progressing → thriving
  const ORDER: Record<OverallTrajectory, number> = {
    crisis: 0, struggling: 1, holding: 2, progressing: 3, thriving: 4,
  };
  childProfiles.sort((a, b) => ORDER[a.overallTrajectory] - ORDER[b.overallTrajectory]);

  // ── Summary ────────────────────────────────────────────────────────────────

  const counts = childProfiles.reduce(
    (acc, p) => { acc[p.overallTrajectory]++; return acc; },
    { thriving: 0, progressing: 0, holding: 0, struggling: 0, crisis: 0 } as Record<OverallTrajectory, number>,
  );

  const priorityChildren = childProfiles
    .filter((p) => p.overallTrajectory === "crisis" || p.overallTrajectory === "struggling")
    .map((p) => p.childName);

  const homeTrend: "positive" | "mixed" | "concerning" =
    counts.crisis > 0 ? "concerning"
    : counts.struggling > 0 ? "mixed"
    : counts.thriving + counts.progressing > counts.holding ? "positive"
    : "mixed";

  const ofstedNote =
    counts.crisis > 0
      ? `${counts.crisis} child${counts.crisis > 1 ? "ren" : ""} showing a crisis trajectory across multiple wellbeing domains. Immediate management review and care plan consideration required.`
      : counts.struggling > 0
      ? `${counts.struggling} child${counts.struggling > 1 ? "ren" : ""} struggling in 2+ domains. Explore in supervision whether current support plans are sufficient.`
      : counts.thriving + counts.progressing >= currentChildren.length / 2
      ? `The majority of children are on a positive trajectory. Continue embedding current approaches and document what's working.`
      : `Most children are holding steady. A positive overall picture, but proactive planning reviews could support forward movement for those in the "holding" category.`;

  const summary: WellbeingTrajectorySummary = {
    totalChildren: currentChildren.length,
    ...counts,
    homeTrend,
    priorityChildren,
    ofstedNote,
  };

  return NextResponse.json({ data: { childProfiles, summary } });
}
