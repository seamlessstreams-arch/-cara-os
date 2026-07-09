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
import { buildChildEvaluations, buildHomeEvaluation } from "@/lib/ask-cara/build-evaluations";
import { buildPracticeDigest } from "@/lib/ask-cara/build-practice";
import { getChildTwin } from "@/lib/cpie/get-child-twin";
import { getWeeklyIntelligenceObject, getMonthlyIntelligenceObject } from "@/lib/cpie/get-weekly-intelligence-object";
import type { WeeklyIntelligenceObject } from "@/lib/cpie/weekly-intelligence-object";
import { composeWeeklyNarrative } from "@/lib/cpie/weekly-narrative";
import { pronounsForChild } from "@/lib/cpie/pronouns";
import { computeStaffingCoverFromStore, addDays } from "@/lib/rota/compute-cover";
import { buildOrgLearningReport } from "@/lib/org-learning-report/report-engine";
import { buildOrgLearningInputFromStore } from "@/lib/org-learning-report/build-input";
import type { AskCaraOpsIntelligence, AskCaraTwinDigest, AskCaraWeeklyDigest } from "@/lib/ask-cara/types";
import type { AskCaraSnapshot } from "@/lib/ask-cara/types";

const day = (v: unknown): string => (typeof v === "string" ? v.slice(0, 10) : "");
const s = (v: unknown): string => (typeof v === "string" ? v : "");

/** Operational domains for the orchestrator — computed from the store, honest
 *  about empty collections (a gap is an answer, not an error). */
/** Distil a CPIE period-intelligence object into the compact Ask CARA digest. */
function wioToDigest(w: WeeklyIntelligenceObject, store: ReturnType<typeof getStore>): AskCaraWeeklyDigest {
  return {
    childId: w.childId,
    weekStart: w.weekStart,
    weekEnding: w.weekEnding,
    narrative: composeWeeklyNarrative(w, pronounsForChild(w.childId, store)).body,
    picture: w.week.picture,
    who: w.wholeChild.who,
    directionOfTravel: w.wholeChild.directionOfTravel,
    achievements: w.week.achievements.map((a) => a.title),
    celebrations: w.week.celebrations,
    childVoiceMoments: w.week.childVoiceMoments.map((m) => m.quote),
    emotionalWellbeing: w.week.emotionalWellbeing,
    qualityStandardsEvidence: w.qualityStandardsEvidence,
    fiveOutcomesEvidence: w.fiveOutcomesEvidence,
    emergingThemes: w.emergingThemes,
    recommendations: w.recommendations,
    evidenceConfidence: w.evidenceConfidence,
    missingInformation: w.missingInformation,
  };
}

function buildOpsIntelligence(store: ReturnType<typeof getStore>, todayIso: string): AskCaraOpsIntelligence | undefined {
  try {
    const st = store as unknown as Record<string, unknown[]>;
    const rows = (k: string) => (Array.isArray(st[k]) ? (st[k] as Record<string, unknown>[]) : []);
    const done = (v: unknown) => ["completed", "closed", "resolved", "done"].includes(s(v).toLowerCase());

    // Health & safety / premises
    const checks = rows("buildingSafetyChecks");
    const overdue = checks
      .filter((c) => day(c.due_date) && day(c.due_date) < todayIso && !done(c.status))
      .map((c) => ({ label: s(c.check_type).replace(/_/g, " ") || "check", dueDate: day(c.due_date), area: s(c.area) || undefined }));
    const actionRequired = checks
      .filter((c) => s(c.action_required) && !done(c.status))
      .map((c) => ({ label: s(c.check_type).replace(/_/g, " ") || "check", action: s(c.action_required) }));
    const openMaintenance = rows("maintenance").filter((m) => !done(m.status)).length;
    const fireDrills90d = rows("fireDrills").filter((f) => {
      const d = day(f.date ?? f.drill_date);
      return d && d >= addDays(todayIso, -90);
    }).length;
    const vehicleChecksOverdue = rows("vehicleChecks").filter((v) => {
      const d = day(v.due_date ?? v.next_due_date ?? v.next_check_due);
      return d && d < todayIso && !done(v.status);
    }).length;

    // Rota safety — the shared cover mapper (same read as /api/v1/staffing-cover).
    let rotaSafety: AskCaraOpsIntelligence["rotaSafety"];
    try {
      const cover = computeStaffingCoverFromStore(store, todayIso, addDays(todayIso, 6));
      rotaSafety = {
        headline: cover.headline,
        daysUnder: cover.summary.days_under,
        nightsNoWaking: cover.summary.nights_no_waking,
        openShiftPeriods: cover.summary.open_shift_periods,
        phantomDays: cover.summary.phantom_days,
        worst: cover.attention.slice(0, 3).map((p) => ({ date: p.date, period: String(p.period), message: p.message })),
      };
    } catch { /* rota read unavailable — the skill says so honestly */ }

    // Staff wellbeing — AGGREGATE ONLY (data minimisation: counts, never
    // individual health detail; names stay in supervision, not in answers).
    const openSickness = rows("staffSicknessRecords").filter((r) => !day(r.date_ended)).length;
    const onLeaveToday = rows("leaveRequests").filter(
      (l) => s(l.status) === "approved" && day(l.start_date) <= todayIso && day(l.end_date) >= todayIso,
    ).length;
    const checkInsRecorded = rows("staffWellbeingRecords").length;

    // Regulation 44 — outstanding actions (records + tasks referencing reg 44).
    const reg44FromRecords = rows("reg44ActionRecords")
      .filter((r) => !done(r.status))
      .map((r) => ({ label: s(r.action ?? r.title ?? r.description) || "Reg 44 action", due: day(r.due_date) || undefined, overdue: !!day(r.due_date) && day(r.due_date) < todayIso }));
    const reg44FromTasks = rows("tasks")
      .filter((t) => /reg(ulation)?\s*\.?\s*44/i.test(s(t.title)) && !done(t.status) && s(t.status) !== "cancelled")
      .map((t) => ({ label: s(t.title), due: day(t.due_date) || undefined, overdue: !!day(t.due_date) && day(t.due_date) < todayIso }));

    // Organisational learning — the §21 report digest via the shared mapper.
    let orgLearning: AskCaraOpsIntelligence["orgLearning"];
    try {
      const report = buildOrgLearningReport(buildOrgLearningInputFromStore(store, todayIso, "quarter"));
      orgLearning = {
        headline: report.headline,
        themes: report.sections
          .filter((sec) => !sec.insufficientData && sec.themes.length)
          .flatMap((sec) => sec.themes.slice(0, 1).map((t) => ({ section: sec.label, title: t.title, detail: t.detail })))
          .slice(0, 5),
        totalEvidence: report.totalEvidence,
      };
    } catch { /* the skill answers honestly without it */ }

    // Safer recruitment — staff FILE currency only (DBS presence/age/update
    // service). Compliance posture, never a character judgement.
    const threeYearsAgo = addDays(todayIso, -365 * 3);
    const saferRecruitment = {
      staff: ((store.staff ?? []) as Array<Record<string, unknown>>)
        .filter((st) => st.is_active !== false)
        .map((st) => ({
          staffId: String(st.id),
          name: s(st.full_name) || [st.first_name, st.last_name].filter(Boolean).join(" ") || String(st.id),
          hasDbs: !!s(st.dbs_number),
          dbsAgedOver3y: !!day(st.dbs_issue_date) && day(st.dbs_issue_date) < threeYearsAgo && !st.dbs_update_service,
          onUpdateService: !!st.dbs_update_service,
        })),
    };

    return {
      healthSafety: { overdue, actionRequired, openMaintenance, fireDrills90d, vehicleChecksOverdue },
      rotaSafety,
      wellbeing: { openSickness, onLeaveToday, checkInsRecorded },
      reg44: { outstanding: [...reg44FromRecords, ...reg44FromTasks] },
      orgLearning,
      saferRecruitment,
    };
  } catch {
    return undefined;
  }
}

export function buildAskSnapshot(store: ReturnType<typeof getStore>): AskCaraSnapshot {
  const returnInterviews = (store.returnInterviews ?? []) as Array<{ episode_id?: string; missing_episode_id?: string; child_id?: string }>;
  const rec = (c: unknown) => (c ?? []) as Array<Record<string, unknown>>;
  const currentChildren = rec(store.youngPeople).filter((c) => (s(c.status) || "current") === "current");
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
    // Leg three: the platform's own evaluation engines, distilled per child so
    // the pure engine can narrate a practitioner's read, not just a tally.
    evaluations: buildChildEvaluations(store, new Date().toISOString()),
    // Home level: the Inspection Intelligence SCCIF projection (no-grade).
    homeEvaluation: buildHomeEvaluation(store, new Date().toISOString()),
    // CPIE Digital-Twin digests — the whole-child picture (identity, strengths,
    // aspirations, memories, voice) so no child is defined by incidents alone.
    twins: rec(store.youngPeople)
      .filter((c) => (s(c.status) || "current") === "current")
      .map((c): AskCaraTwinDigest | null => {
        const t = getChildTwin(String(c.id));
        if (!t) return null;
        return {
          childId: t.childId,
          interests: t.identity.data.interests,
          whatMakesThemHappy: t.identity.data.whatMakesThemHappy,
          strengths: t.strengths.data.strengths,
          recentAchievements: t.strengths.data.achievements.slice(0, 3).map((a) => ({ title: a.title, date: a.date, celebratedHow: a.celebratedHow })),
          aspirations: t.aspirations.data.aspirations.slice(0, 3).map((a) => ({ aspiration: a.aspiration, whyItMatters: a.whyItMatters })),
          memories: t.lifeStory.data.memories.slice(0, 3).map((m) => ({ title: m.title, date: m.date, childVoice: m.childVoice })),
          meaningfulMoments30d: t.livedExperience.data.meaningfulMoments30d,
          missingInformation: t.missingInformation.slice(0, 4),
          livedExperienceRead: t.goodParenting.data.livedExperienceRead,
          parentingPresent: t.goodParenting.data.signalsPresent.map((p) => p.label),
          parentingThin: t.goodParenting.data.signalsThin,
          curiosityPatterns: t.curiosity.data.noticedPatterns,
          curiosityQuestions: t.curiosity.data.reflectiveQuestions,
        };
      })
      .filter((t): t is AskCaraTwinDigest => !!t),
    // CPIE Weekly Intelligence Object digests — the structured weekly pre-report
    // per child, so "what should be in Alex's weekly summary?" reads the
    // intelligence rather than re-deriving it.
    weekly: currentChildren
      .map((c) => getWeeklyIntelligenceObject(String(c.id)))
      .filter((w): w is WeeklyIntelligenceObject => !!w)
      .map((w) => wioToDigest(w, store)),
    // CPIE Monthly Intelligence Object digests — same shape, 30-day window, so a
    // "monthly summary" request reads a month, not the last 7 days.
    monthly: currentChildren
      .map((c) => getMonthlyIntelligenceObject(String(c.id)))
      .filter((w): w is WeeklyIntelligenceObject => !!w)
      .map((w) => wioToDigest(w, store)),
    // Operational domains — health & safety, rota safety, wellbeing, reg 44.
    ops: buildOpsIntelligence(store, new Date().toISOString().slice(0, 10)),
    // Leg four: the child-level practice-intelligence engines' findings
    // (care language, child voice, recording gaps, cumulative risk) so a
    // practice question is answered from the engine's read, not KB theory.
    practice: buildPracticeDigest(store),
  };
}
