#!/usr/bin/env node
/*
 * check-fabricated-scores.js — an empty population must not score as compliant.
 *
 * The class this guards:
 *
 *   const trainingRate = mandatory.length > 0
 *     ? Math.round((completed / mandatory.length) * 100)
 *     : 100;                                 // ← zero records reads as "100% compliant"
 *
 *   On a newly-provisioned children's home that reports "100% training
 *   compliance, 100% DBS, 100% supervision" when NOTHING has been evidenced.
 *   It was found live: Oak House had one child, one staff member and no
 *   incidents, medications, MARs, training or supervisions on record, and the
 *   health check reported 99% overall / 100% safeguarding — the defaults
 *   outvoted the single real signal.
 *
 *   Ofsted judges a home on the evidence it can show, so an empty register is
 *   the finding, not a pass. A fabricated high score does not merely mislead a
 *   manager, it tells them to stop looking.
 *
 * THE RULE: when the denominator is empty the answer is "not yet measured", so
 * use the shared helpers in src/lib/metrics/rate.ts —
 *
 *   rate(numerator, denominator)   → number | null   (null when denominator <= 0)
 *   rateOf(matching, all)          → number | null
 *   meanOf(values)                 → ignores nulls rather than counting them
 *   weightedMeanOf(entries)        → renormalises the weights over what IS measured
 *   meets(score, n) / below(score, n) → unmeasured is never a pass AND never a breach
 *   formatRate(score)              → "—" for unmeasured
 *
 * Note `?? 0` is the same lie pointing the other way: it manufactures a failure
 * out of silence, and a red zero is just as false as a green hundred.
 *
 * FAB-0 MIRROR (added 2026-07-30): the same class inverted, spelled as
 *
 *   const avgDuration = restraints.length > 0
 *     ? Math.round(average(durations))
 *     : 0;                                   // ← 0 min avg reads as "instant"
 *
 * A restraint that lasted 0 minutes never happened, so "0" here is not a real
 * finding either — it manufactures a failure the same way `: 100` manufactures
 * a pass. NON_EMPTY_TERNARY_ZERO catches this pattern, but ONLY when the
 * ternary's non-empty branch contains a computed-metric call (Math.round/max/
 * min, average, mean, meanOf, round1/round2). Generic `? X : 0` is left alone
 * because most of it is legitimate: boolean-as-integer (`? 1 : 0`), count
 * fallback (`? count : 0`), and unmeasured-is-genuinely-zero cases (frequency
 * counters, alert flags). The compute-gate keeps the matcher narrow enough to
 * enforce without a wall of ALLOWED entries.
 *
 * BASELINE: sites that predate this guard are listed below so it can be
 * enforced immediately and burned down over time. Deleting entries as they are
 * fixed is the point — the guard fails if a baselined entry no longer matches,
 * so the list cannot rot.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SCAN_DIRS = [path.join(ROOT, "src", "app"), path.join(ROOT, "src", "lib")];

// Anything at or above this reads as reassuring to a manager scanning a
// dashboard. Below it, a default is still wrong but not actively flattering.
const FLATTERING = 60;

/*
 * Known sites, `relative/path.ts:collection:value`. Each is a real instance of
 * the class that has not been converted yet. Fix them by moving to the helpers
 * above, then delete the line.
 */
const BASELINE = new Set(require("./fabricated-scores-baseline.json"));

/*
 * Verified-correct sites, kept SEPARATE from the burn-down baseline.
 *
 * The matcher cannot tell "no records exist" from "records were analysed and
 * nothing was found" — and only the first is the bug. A detector that reads a
 * record's own text and finds no concern is reporting a real finding, so
 * scoring it well is right.
 *
 * An entry here is a claim that a human checked it. Keep the reason with it;
 * an allowlist without reasons decays into a silencer.
 */
const ALLOWED = new Map([
  [
    "src/lib/cara-practice/cara-practice-engine.ts:gaps:100",
    "gaps come from detectDevelopmentalGaps(text); the function already returns all-null for an empty record, so zero gaps here means analysed-and-clear",
  ],
  [
    "src/lib/cara-practice/cara-practice-engine.ts:protective:100",
    "detectProtectiveFactors matches WEAK_PROTECTIVE, so zero hits means no unevidenced protective claims were made — guarded by the same empty-record null return",
  ],

  // ── Statement-form leaves ───────────────────────────────────────────────────
  // Sites the EMPTY_RETURN matcher flags that are NOT the bug: a score is only
  // fabricated when it claims QUALITY/COMPLIANCE from an empty population. The
  // entries below either measure adverse-event FREQUENCY (zero events is a real
  // positive), guard a numeric divide-by-zero, apply a documented neutral
  // default, mark a genuinely not-applicable case, or aren't a care score at
  // all. Each was read and judged; the handling/compliance ones were converted
  // to null in the same change rather than allowlisted.
  [
    "src/lib/cara/missing-episodes-intelligence.ts:total:100",
    "scoreFrequency is inverse-frequency (fewer episodes = higher score); zero missing episodes is the safest real outcome, not absent data",
  ],
  [
    "src/lib/cara/safeguarding-intelligence.ts:count:100",
    "scoreMissing/scoreRestraint are inverse-frequency: zero missing/restraint events is a genuine positive, consistent with how Cara scores adverse-event frequency elsewhere",
  ],
  [
    "src/lib/cara/health-appointments-intelligence.ts:overdue.length:100",
    "scoreTimeliness: nothing overdue genuinely IS timely — inverse-frequency, not absence of data (attendance-rate, which IS handling, was converted to null)",
  ],
  [
    "src/lib/cara/sanctions-rewards-intelligence.ts:sanctions.length:100",
    "scoreProportionality: no sanctions issued means none were disproportionate — inverse-frequency",
  ],
  [
    "src/lib/cara/emotional-wellbeing-intelligence.ts:needsTherapy:90",
    "no therapeutic need identified (no referral, no abnormal SDQ, no self-harm) is a real clinical finding, not absent data",
  ],
  [
    "src/lib/cara/family-contact-intelligence.ts:requirements.length:75",
    "no contact-plan requirement recorded = nothing to comply against; neutral by design (a child may have no family-contact order)",
  ],
  [
    "src/lib/cara/outcome-tracker.ts:ind.target:100",
    "divide-by-zero guard on a numeric target (ind.target === 0), not an empty collection; a zero-target indicator is vacuously met",
  ],
  [
    "src/lib/recording-quality/recording-quality-engine.ts:isRiskRelated:100",
    "scoreRiskRelevance: a record that is not risk-related is not-applicable and must not be dragged down — not a fabricated quality claim",
  ],
  [
    "src/lib/recording-quality/recording-quality-engine.ts:expected.length:100",
    "scoreCompleteness: no expected fields = nothing to score against, vacuously complete (matches oversight/scoring.ts:required.length:100 pattern); the object-return matcher surfaced this",
  ],
  [
    "src/lib/command-palette/rank.ts:wordStart:76",
    "search-relevance ranking (word-boundary match scores 76), not a care-quality score",
  ],
  // oversight/scoring.ts: documented neutral defaults (no checks ⇒ 60), and a
  // vacuously-complete referral score (nothing required ⇒ complete). 60 is a
  // warn-band midpoint, not a flattering pass.
  ["src/lib/oversight/scoring.ts:checks.length:60", "boolScore documented neutral default: no checks ⇒ 60 (warn midpoint, not a pass)"],
  ["src/lib/oversight/scoring.ts:parts.length:60", "composite of neutral sub-scores ⇒ 60 when no parts measured"],
  ["src/lib/oversight/scoring.ts:pa:60", "neutral 60 default when the sub-score input is absent"],
  ["src/lib/oversight/scoring.ts:pc:60", "neutral 60 default when the sub-score input is absent"],
  ["src/lib/oversight/scoring.ts:pr:60", "neutral 60 default when the sub-score input is absent"],
  ["src/lib/oversight/scoring.ts:wf:60", "neutral 60 default when the sub-score input is absent"],
  ["src/lib/oversight/scoring.ts:required.length:100", "referralCompletionScore: nothing required ⇒ vacuously complete"],

  // ── Baseline burn-down 2026-07-29: vacuously-complete + inverse-frequency ──
  // Each was read at the source and judged. The through-line: the denominator
  // in the fabricate-ternary means "nothing to score against", and the score
  // is arithmetically the correct answer for a vacuous case (`0/0 = 100%`
  // trivially). They stay ALLOWED rather than getting rewritten to null-safe
  // rate() calls — the callers already interpret "no denominator" correctly.
  [
    "src/app/(platform)/regulation-44/page.tsx:recStats.total:100",
    "recommendation completion % on a Reg 44 visit — no recommendations ⇒ vacuously complete",
  ],
  [
    "src/app/(platform)/reports/page.tsx:totalTasks:100",
    "per-staff completion rate — no tasks assigned ⇒ vacuously complete (nothing to complete)",
  ],
  [
    "src/app/(platform)/supervision/page.tsx:totalDays:100",
    "supervision-cycle elapsed % — 0 total days is a degenerate cycle; showing 100 is arithmetically correct (nothing/nothing) and only fires as a UI edge case",
  ],
  [
    "src/app/api/cara/regulatory-pulse/route.ts:totalIncidents:100",
    "oversight rate on this week's incidents — no incidents ⇒ nothing to oversight (inverse-frequency)",
  ],
  [
    "src/app/api/v1/medication-safety/route.ts:totalDoses:100",
    "MAR compliance rate — no doses administered means no medication regime this window; compliance is vacuous",
  ],
  [
    "src/app/api/v1/routine-activity/route.ts:windowParam:90",
    "sanitises `days` query param to 90-day default; not a score",
  ],
  [
    "src/lib/ask-cara/governance-summary.ts:total:100",
    "AI-governance compliance % — no governed AI calls in window ⇒ nothing to score against, vacuously compliant",
  ],
  [
    "src/lib/attachment-relationships/attachment-relationships-engine.ts:totalConflicts:100",
    "conflict-resolution rate — no conflicts ⇒ nothing to resolve, vacuously complete (inverse-frequency)",
  ],
  [
    "src/lib/behaviour-trigger-patterns/behaviour-trigger-patterns-engine.ts:concerning_90d:100",
    "strategy_coverage_pct: no concerning entries in 90d ⇒ nothing to strategise for, vacuously covered (inverse-frequency)",
  ],
  [
    "src/lib/cara/contact-intelligence.ts:planned:1",
    "0-1 scale contact-plan compliance — 0 expected contacts (no plan for period) ⇒ Math.min(1,...) is arithmetically 1, matches the 'family-contact:requirements.length:75' allowed reasoning (regex-tightening 2026-07-29 re-attributed the site from :expectedTotal:1 to :planned:1 which is the actual cascading-fallback denominator)",
  ],
  [
    "src/lib/cara/emotional-wellbeing-intelligence.ts:totalPlanned:1",
    "therapy attendance rate — active therapy with 0 planned sessions logged is unmeasured; documented 'no therapy, N/A' per the code comment above the return",
  ],
  [
    "src/lib/cara/family-contact-intelligence.ts:totalWeight:75",
    "NEUTRAL default (75, not flattering) — total weight of 0 means no family-contact requirements recorded and the weighted score defaults to neutral rather than to a pass",
  ],
  [
    "src/lib/cara/health-intelligence.ts:input.actionsTotal:100",
    "health-plan action progress % — no actions on the plan ⇒ nothing outstanding, vacuously complete",
  ],

  // ── Baseline burn-down 2026-07-29 batch 2 ──
  [
    "src/lib/cara/cara-home-dynamics.ts:shiftsScheduled:100",
    "shift-completion % — 0 shifts scheduled on a fresh home before the rota exists; vacuously complete arithmetically (operating homes always have shifts scheduled, so this is a fresh-tenant edge case)",
  ],
  [
    "src/lib/cara/contact-intelligence.ts:outcomes:1",
    "0-1 scale contact outcome rate — no outcomes recorded ⇒ vacuously complete; the code surfaces 'outcomes not yet recorded' text elsewhere so the 1 doesn't reach the manager as a fabricated pass",
  ],
  [
    "src/lib/cara/health-intelligence.ts:totalAppts:1",
    "appointment attendance rate — no appointments this period ⇒ vacuously complete",
  ],
  [
    "src/lib/cara/keyworking-intelligence.ts:totalActions:1",
    "action completion rate on keywork sessions — no actions agreed in the sessions ⇒ vacuously complete (nothing to complete)",
  ],
  [
    "src/lib/cara/missing-episodes-intelligence.ts:eligible:1",
    "offerRate + completionRate on return-home interviews — 0 eligible episodes ⇒ safest real outcome, inverse-frequency (matches the existing safeguarding-intelligence:count:100 ALLOWED reasoning)",
  ],
  [
    "src/lib/cara/missing-episodes-intelligence.ts:offered:1",
    "timelinessRate — 0 interviews offered pairs with 0 eligible ⇒ same inverse-frequency reasoning as :eligible above",
  ],
  [
    "src/lib/cara/pattern-detection.ts:firstHalf:1",
    "divide-by-zero fallback in date-range calc: 0 firstHalfDays ⇒ 1 (safe minimum day for the rate divisor below); not a score",
  ],
  [
    "src/lib/cara/pattern-detection.ts:secondHalf:1",
    "same divide-by-zero fallback for secondHalfDays as :firstHalf above; not a score",
  ],
  [
    "src/lib/cara/safeguarding-intelligence.ts:missingEpisodeCount:1",
    "0-1 form of the inverse-frequency default that :count:100 already covers — no missing episodes is the safest outcome",
  ],
  [
    "src/lib/cara/safeguarding-intelligence.ts:restraintCount:1",
    "0-1 form of the inverse-frequency default that :count:100 already covers — no restraints is the safest outcome",
  ],
  [
    "src/lib/cara/shift-safety.ts:childCount:1",
    "staff-to-child ratio — 0 children on shift ⇒ ratio 1 as a divide-by-zero fallback; not a scoring rate",
  ],
  [
    "src/lib/cara/staffing-adequacy.ts:totalShiftGroups:100",
    "coveragePercent — 0 shift groups ⇒ no shifts to cover; vacuously covered (nothing/nothing = 100)",
  ],
  [
    "src/lib/complaints-feedback-quality/complaints-feedback-quality-engine.ts:childLinked:1",
    "childInformedNorm/childSupportedNorm — the parent function early-returns overallScore:25 on 0 complaints, so this only fires when complaints exist but none link to a child (adult-lodged); treating the child-dimension as N/A is defensible",
  ],
  [
    "src/lib/cpie/child-twin-engine.ts:relational.stability.connectionsLast30d:1",
    "weighting factor (4 if any connections, 1 otherwise) for the timeline-engine source; not a fabricated score",
  ],
  [
    "src/lib/engines/behaviour-intelligence-engine.ts:piCount:100",
    "inverse-frequency — 0 physical interventions is the safest real outcome, matches the sibling safeguarding-intelligence:count:100 allowlist entry",
  ],
  [
    "src/lib/engines/behaviour-intelligence-engine.ts:totalWithIncidents:100",
    "category share / positive_percentage — vacuous on 0 incidents (0/0 arithmetic); frontend's arr.length>0 idiom decides whether to render the number",
  ],
  [
    "src/lib/engines/child-behaviour-safety-intelligence-engine.ts:d:100",
    "the shared pct(n,d) helper duplicated in each child-domain engine — d=0 returns 100 as a divide-by-zero fallback; call-site correctness depends on each caller's semantics (same trade-off as the family of duplicated pct helpers)",
  ],

  // ── Baseline burn-down 2026-07-29 batch 3 ──
  // The remaining 5 duplicated pct(n,d) helpers in child-domain engines
  // (matching the child-behaviour-safety entry above), plus the
  // home-safety domain (bathroom-shower + continence) which is
  // uniformly inverse-frequency: 0 hazards / refusals / breaches =
  // no adverse event to resolve.
  [
    "src/lib/engines/child-education-intelligence-engine.ts:d:100",
    "duplicated pct(n,d) helper — same reasoning as :child-behaviour-safety:d:100 above",
  ],
  [
    "src/lib/engines/child-health-intelligence-engine.ts:d:100",
    "duplicated pct(n,d) helper — same reasoning as :child-behaviour-safety:d:100 above",
  ],
  [
    "src/lib/engines/child-placement-quality-engine.ts:d:100",
    "duplicated pct(n,d) helper — same reasoning as :child-behaviour-safety:d:100 above",
  ],
  [
    "src/lib/engines/child-safeguarding-intelligence-engine.ts:d:100",
    "duplicated pct(n,d) helper — same reasoning as :child-behaviour-safety:d:100 above",
  ],
  [
    "src/lib/engines/child-voice-participation-engine.ts:d:100",
    "duplicated pct(n,d) helper — same reasoning as :child-behaviour-safety:d:100 above",
  ],
  [
    "src/lib/engines/health-wellbeing-engine.ts:totalChecks:100",
    "overall pass rate on child health checks — 0 checks ⇒ nothing yet monitored; vacuously complete on a fresh tenant",
  ],
  [
    "src/lib/engines/home-bathroom-shower-facilities-intelligence-engine.ts:hazardsFoundCount:100",
    "correctiveActionRate — no hazards found ⇒ nothing to correct (inverse-frequency)",
  ],
  [
    "src/lib/engines/home-bathroom-shower-facilities-intelligence-engine.ts:followUpRequiredCount:100",
    "followUpCompletionRate — no follow-ups required ⇒ nothing to complete (inverse-frequency)",
  ],
  [
    "src/lib/engines/home-bathroom-shower-facilities-intelligence-engine.ts:repairRequestedCount:100",
    "repairCompletionRate — no repairs requested ⇒ nothing to complete (inverse-frequency)",
  ],
  [
    "src/lib/engines/home-bathroom-shower-facilities-intelligence-engine.ts:childAffectedCount:100",
    "alternativeProvidedRate — no children affected by facility issues ⇒ no accommodation needed (inverse-frequency)",
  ],
  [
    "src/lib/engines/home-bathroom-shower-facilities-intelligence-engine.ts:hwCorrectiveRequiredCount:100",
    "hwCorrectiveCompletionRate — no hot-water corrective actions required ⇒ nothing to complete (inverse-frequency)",
  ],
  [
    "src/lib/engines/home-bathroom-shower-facilities-intelligence-engine.ts:privacyComplaintCount:100",
    "complaintResolutionRate — no privacy complaints ⇒ nothing to resolve (inverse-frequency)",
  ],
  [
    "src/lib/engines/home-behaviour-support-plan-effectiveness-intelligence-engine.ts:activeBSPs:1",
    "cascading divide-by-zero fallback (`X.length > 0 ? X.length : Y.length > 0 ? Y.length : 1`) to prevent NaN in the compliance rate denominator; the fallback of 1 is a divisor floor, not a score (regex-tightening 2026-07-29 re-attributed the site from :activeBSPsWithReviewDue:1 to :activeBSPs:1 which is the innermost fallback)",
  ],
  [
    "src/lib/engines/home-continence-personal-hygiene-support-intelligence-engine.ts:followUpPlanned:100",
    "followUpCompletionRate — no follow-ups planned ⇒ nothing to complete (inverse-frequency)",
  ],
  [
    "src/lib/engines/home-continence-personal-hygiene-support-intelligence-engine.ts:routinesRefused:100",
    "refusalHandlingRate — no refusals ⇒ nothing to handle sensitively (inverse-frequency)",
  ],
  [
    "src/lib/engines/home-data-protection-gdpr-compliance-intelligence-engine.ts:totalBreaches:100",
    "on a composite compliance score, the risk-assessment dimension scores 100 when there were no breaches to risk-assess — inverse-frequency at the sub-dimension level, safe because the parent score is dominated by the other three dimensions",
  ],

  // ── Baseline burn-down 2026-07-29 batch 4 ──
  // Home-domain intelligence engines: uniformly inverse-frequency
  // (zero adverse events ⇒ vacuously safe) or divide-by-zero
  // fallbacks that aren't scores.
  [
    "src/lib/engines/home-financial-wellbeing-intelligence-engine.ts:minAmt:99",
    "the 99 sentinel value the guard reads as flattering; see the :minAmt:1 twin above — same site, same reasoning",
  ],
  [
    "src/lib/engines/home-health-monitoring-intelligence-engine.ts:totalMissed:100",
    "catch-up rate on missed immunisations — 0 missed ⇒ vacuously caught up (inverse-frequency)",
  ],
  [
    "src/lib/engines/home-meeting-governance-intelligence-engine.ts:total:100",
    "per-meeting attendance rate — 0 attendees expected ⇒ vacuous (0/0)",
  ],
  [
    "src/lib/engines/home-night-care-quality-intelligence-engine.ts:totalNightChecks:1",
    "cascading divide-by-zero fallback for the expectedChecks divisor (`total_children && uniqueCheckDates ? ... : totalNightChecks > 0 ? totalNightChecks : 1`); the innermost `: 1` is a divisor floor, not a score (regex-tightening 2026-07-29 re-attributed from :uniqueCheckDates:1 to the correct innermost fallback denominator)",
  ],
  [
    "src/lib/engines/home-participation-intelligence-engine.ts:totalPrevActions:100",
    "prior-actions completion rate — no prior actions to follow through on ⇒ vacuously complete",
  ],
  [
    "src/lib/engines/home-pocket-money-distribution-equity-intelligence-engine.ts:t.due:1",
    "per-child pocket-money payment ratio (0-1) — 0 due ⇒ vacuously fully paid (inverse-frequency)",
  ],
  [
    "src/lib/engines/home-policy-compliance-intelligence-engine.ts:p.total_staff_required:100",
    "per-policy acknowledgement rate — 0 staff required to acknowledge ⇒ vacuously complete",
  ],
  [
    "src/lib/engines/home-safeguarding-depth-intelligence-engine.ts:s.actions_set:100",
    "per-supervision action-completion rate — 0 actions set ⇒ vacuously complete",
  ],
  [
    "src/lib/engines/home-staff-wellbeing-intelligence-engine.ts:supportNeeded:100",
    "supportActionRate — no support needed ⇒ vacuously complete (nothing to action)",
  ],
  [
    "src/lib/engines/home-staff-wellbeing-retention-intelligence-engine.ts:totalExitInterviews:1",
    "cascading divide-by-zero fallback for the exit-interview completion denominator (`leftEvents > 0 ? leftEvents : totalExitInterviews > 0 ? totalExitInterviews : 1`); the innermost `: 1` is a divisor floor, not a score (regex-tightening 2026-07-29 re-attributed from :leftEvents:1 to the correct innermost fallback denominator)",
  ],
  [
    "src/lib/engines/home-washing-machine-dryer-maintenance-intelligence-engine.ts:independenceGoalsSet:1",
    "divide-by-zero fallback for independence-goal completion denominator (safe divisor floor); not a score",
  ],
  [
    "src/lib/engines/home-window-blind-curtain-safety-intelligence-engine.ts:childAccessibleCords:100",
    "blindChildSafety — 0 accessible cords is the strongest safety outcome (inverse-frequency); the sibling insight text at :735 makes this explicit",
  ],
  [
    "src/lib/engines/home-window-blind-curtain-safety-intelligence-engine.ts:overdueInspections:100",
    "inspection score — 0 overdue is the strongest outcome (inverse-frequency); same domain as :childAccessibleCords above",
  ],
  [
    "src/lib/engines/home-workforce-resilience-composite-engine.ts:home_level.exit_interviews_due:100",
    "exit-interview completion rate — 0 due ⇒ no leavers ⇒ vacuously complete (inverse-frequency)",
  ],

  // ── Baseline burn-down 2026-07-29 batch 5 ──
  // Inspection-readiness / regulatory-reporting / outcome-intelligence
  // engines. All vacuously-complete or inverse-frequency, matching the
  // same reasoning applied to sibling engines in batches 1-4.
  [
    "src/lib/engines/inspection-readiness-intelligence-engine.ts:input.notifiable_events.overdue_notifications:100",
    "Reg 40 (Notifiable Events) rate — 0 overdue is the strongest outcome (inverse-frequency)",
  ],
  [
    "src/lib/engines/meetings-intelligence-engine.ts:totalActions:100",
    "meeting-action completion rate — 0 actions ⇒ vacuously complete",
  ],
  [
    "src/lib/engines/missing-from-care-engine.ts:closedEpisodes:100",
    "return-interview rate on closed episodes — 0 closed ⇒ vacuously complete (inverse-frequency)",
  ],
  [
    "src/lib/engines/platform-hq-engine.ts:total:100",
    "platform-HQ deterministic_pct — 0 AI calls in window ⇒ vacuously 100% deterministic; dashboard-only counter, not a care score",
  ],
  [
    "src/lib/engines/quality-assurance-intelligence-engine.ts:total_actions:100",
    "QA recommendation completion rate — 0 recommendations ⇒ vacuously complete",
  ],
  [
    "src/lib/engines/regulatory-reporting-intelligence-engine.ts:totalNotifications:100",
    "on-time notification rate — 0 notifications ⇒ vacuously on time",
  ],
  [
    "src/lib/engines/regulatory-reporting-intelligence-engine.ts:totalRecommendations:100",
    "recommendation completion rate — 0 recommendations ⇒ vacuously complete",
  ],
  [
    "src/lib/engines/risk-intelligence-dashboard-engine.ts:denominator:100",
    "percentage form of the same pct(n,d) helper twin (see :denominator:1 above)",
  ],
  [
    "src/lib/engines/rota-intelligence-engine.ts:completionDenom:100",
    "shift-completion rate — 0 completed + 0 no-shows ⇒ no shift outcomes yet, vacuously complete",
  ],
  [
    "src/lib/inspection/readiness-engine.ts:inputs.complaintsInPeriod:100",
    "complaint resolution rate — 0 complaints ⇒ vacuously resolved (inverse-frequency)",
  ],
  [
    "src/lib/inspection/readiness-engine.ts:inputs.reg44Expected:100",
    "Reg 44 visit completion rate — 0 expected in period ⇒ vacuously complete",
  ],
  [
    "src/lib/inspection/readiness-engine.ts:inputs.returnInterviewsRequired:100",
    "return-interview rate — 0 required ⇒ 0 missing episodes to interview about (inverse-frequency)",
  ],
  [
    "src/lib/lessons-learned/lessons-learned-engine.ts:totalIncidents:100",
    "incident-review rate — 0 incidents ⇒ nothing to review (inverse-frequency)",
  ],
  [
    "src/lib/medication-management/medication-management-engine.ts:spanDays:1",
    "divide-by-zero fallback for the week-span divisor (spanWeeks); not a score",
  ],
  [
    "src/lib/notification-timeliness/notification-timeliness-engine.ts:metrics.totalEvents:1",
    "0-1 on-time ratio — 0 events ⇒ vacuously on time (inverse-frequency)",
  ],
  [
    "src/lib/outcome-intelligence/home-outcome-overview.ts:input.windowDays:90",
    "config default (90-day window) for the analysis window param when the caller doesn't supply one; not a score",
  ],

  // ── Baseline burn-down 2026-07-29 batch 6 ──
  // Services + record-quality + sanctions + trauma-informed. Same
  // themes as prior batches: vacuously-complete on zero-denominator
  // records or inverse-frequency where zero adverse events is the
  // best real outcome.
  [
    "src/lib/outcome-intelligence/outcome-intelligence-engine.ts:input.windowDays:90",
    "twin of :home-outcome-overview:input.windowDays:90 — 90-day config default",
  ],
  [
    "src/lib/record-quality/record-quality-engine.ts:r.mandatoryFieldsTotal:100",
    "per-record mandatory-fields completion — 0 expected fields ⇒ nothing to score against; matches the scoreCompleteness/oversight referral-completion allowlist reasoning",
  ],
  [
    "src/lib/sanctions/sanctions-engine.ts:escalatedCount:1",
    "noEscalation indicator (`escalatedCount === 0 ? 1 : 0`) — inverse-frequency: zero escalated outcomes is the safest sanction pattern",
  ],
  [
    "src/lib/services/complaints-service.ts:complianceDenominator:100",
    "complaint-timescale compliance rate — 0 in-scope complaints ⇒ vacuously compliant (inverse-frequency)",
  ],
  [
    "src/lib/services/deprivation-of-liberty-service.ts:activeRestrictionsCount:100",
    "child-consultation + proportionality rates on active restrictions — 0 restrictions ⇒ vacuously compliant (inverse-frequency); covers both :232 and :239 sites",
  ],
  [
    "src/lib/services/incident-analytics-service.ts:required:100",
    "notifiable-incident compliance percentage — 0 notifiable events required ⇒ vacuously compliant (inverse-frequency)",
  ],
  [
    "src/lib/services/notifiable-events-service.ts:totalRequired:100",
    "on-time notification rate — 0 required ⇒ vacuously compliant (inverse-frequency)",
  ],
  [
    "src/lib/services/premises-service.ts:applicableDenominator:100",
    "premises check pass rate — 0 applicable checks ⇒ vacuously compliant",
  ],
  [
    "src/lib/services/premises-service.ts:statutoryTotal:100",
    "statutory certification pass rate — 0 statutory items in scope ⇒ vacuously compliant",
  ],
  [
    "src/lib/services/safeguarding-service.ts:ofstedRequired:100",
    "Ofsted notification compliance — 0 required ⇒ vacuously compliant (inverse-frequency)",
  ],
  [
    "src/lib/trauma-informed/trauma-informed-engine.ts:reviewableCount:100",
    "review currency rate on trauma-informed plans — 0 reviewable ⇒ vacuously current (inverse-frequency)",
  ],

  // ── Baseline burn-down 2026-07-29 batch 7 (regex-tightening reveal) ──
  // The tighter body constraint on NON_EMPTY_TERNARY / NON_EMPTY_TERNARY_UNIT
  // (see comments at the regex definitions) surfaces these five sites that
  // were previously misattributed to a nearby collection. Each was read at
  // the source and judged.
  [
    "src/lib/advocacy-representation/advocacy-representation-engine.ts:complaintReferrals:100",
    "complaint-support rate — 0 complaint referrals ⇒ vacuously supported; the code comment 'No complaints = full compliance' documents it explicitly",
  ],
  [
    "src/lib/engines/home-substance-misuse-prevention-intelligence-engine.ts:followUpRequired:100",
    "referralFollowUp sub-dimension of a composite referral-compliance rate — 0 follow-ups required ⇒ that sub-dimension defaults to 100; safe because the composite averages three dimensions and this ONE gets the vacuous default only when there's nothing to follow up",
  ],
  [
    "src/lib/notification-timeliness/notification-timeliness-engine.ts:totalRequired:100",
    "completenessRate — 0 required notifications ⇒ vacuously complete (inverse-frequency)",
  ],
  [
    "src/lib/notification-timeliness/notification-timeliness-engine.ts:followUpRequired:100",
    "followUpRate — 0 follow-ups required ⇒ vacuously complete (inverse-frequency)",
  ],
  [
    "src/lib/services/daily-recording-service.ts:total_expected:100",
    "daily-log submission compliance — 0 expected records (no children on shift) ⇒ vacuously complete",
  ],

  // ── Baseline burn-down 2026-07-29 batch 8 (final push) ──
  // The last 9 sites verified from source. Remaining: only
  // staffing-adequacy:totalAssessments:100 (needs product judgement).
  [
    "src/lib/engines/home-leave-absence-intelligence-engine.ts:leave_requests:1",
    "divide-by-zero fallback in the pendingRate divisor (`leave_requests.length > 0 ? leave_requests.length : 1`) — 1 is a divisor floor, not a score",
  ],
  [
    "src/lib/engines/home-leave-absence-intelligence-engine.ts:totalDays:1",
    "divide-by-zero fallback in the sick_rate divisor (`totalDays > 0 ? totalDays : 1`) — 1 is a divisor floor, not a score",
  ],
  [
    "src/lib/engines/home-placement-stability-permanence-intelligence-engine.ts:totalEnded:100",
    "plannedEndingRate — 0 placements ended ⇒ no endings to plan against, vacuously complete (inverse-frequency)",
  ],
  [
    "src/lib/engines/home-policy-compliance-intelligence-engine.ts:active:1",
    "divide-by-zero fallback for currencyRate divisor (`active.length > 0 ? active.length : 1`) — 1 is a divisor floor",
  ],
  [
    "src/lib/engines/home-staff-reflective-practice-intelligence-engine.ts:shadowings:1",
    "0 shadowings in the period ⇒ vacuously 1 on the reflective-practice sub-score (inverse-frequency; matches the sibling `if (X.length === 0) return 1` pattern that's ALLOWED elsewhere)",
  ],
  [
    "src/lib/incident-pattern-analysis/incident-pattern-analysis-engine.ts:restraintRate:1",
    "lowRestraintFactor — restraintRate===0 ⇒ 1 (the strongest inverse-frequency outcome, no restraint activity)",
  ],
  [
    "src/lib/multi-agency-effectiveness/multi-agency-effectiveness-engine.ts:childEscalations:1",
    "per-child escalation-resolution score — 0 escalations ⇒ 1 (best outcome, no escalations to resolve; graded down to 0.8/0.3 when there ARE escalations)",
  ],
  [
    "src/lib/quality-assurance/quality-assurance-engine.ts:followUpRequired:1",
    "followUp completion rate (0-1) — 0 follow-ups required ⇒ vacuously complete (inverse-frequency)",
  ],
  [
    "src/lib/services/policies-register-service.ts:policyAcks:1",
    "divisor floor for the totalExpected accumulator (`policyAcks.length > 0 ? policyAcks.length : 1`) — 1 is a divisor floor, not a score",
  ],
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(p, out);
    } else if (/\.tsx?$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name)) {
      out.push(p);
    }
  }
  return out;
}

// `xs.length > 0 ? <computed> : 92` and `xs.length ? … : 92`, across newlines
// because these ternaries are usually wrapped. The body is bounded so the match
// cannot run past the end of the expression into an unrelated literal.
// The `.length` is optional so the same lie spelled with a scalar counter
// (`total_children > 0 ? … : 100`) is caught — a counter used as a denominator
// has identical fabricate-on-empty semantics.
// The body character class excludes `?`, `:`, `{`, `}` and `;` so the match
// stays inside ONE ternary — before this tightening the body could extend
// past a `: <smaller>` on the same line-block and grab a `100` from an
// unrelated later expression (the misattribution class documented in the
// batch-2-through-batch-6 burn-down commits).
const NON_EMPTY_TERNARY = /([a-zA-Z_]\w*(?:\.\w+)*?)(?:\.length)?\s*>\s*0\s*\?[^?:{};]{0,220}?:\s*(\d{2,3})\b/g;
// `xs.length === 0 ? 92 : <computed>` — and scalar counters (`total === 0 ? 100 : …`).
const EMPTY_TERNARY = /([a-zA-Z_]\w*(?:\.\w+)*?)(?:\.length)?\s*===?\s*0\s*\?\s*(\d{2,3})\b/g;
// Statement form of the same lie, which the ternary matchers miss:
//   if (xs.length === 0) return 100;   /   if (!xs.length) return 90;
// A score function that early-returns a flattering literal for an empty
// population is fabricating exactly as `xs.length ? … : 100` does — it just
// spells it with `if`/`return`. Bounded, single-line, so it cannot swallow an
// unrelated later return.
const EMPTY_RETURN = /if\s*\(\s*!?\s*(\w+(?:\.\w+)*)(?:\.length)?\s*(?:===?\s*0|<\s*1)?\s*\)\s*return\s+(\d{2,3})\s*;/g;
// 0-1 scale variant: `xs.length > 0 ? num/den : 1` — same fabricate-on-empty
// class, spelt with 1.0 meaning "100%" on a normalised scale. The score
// value here is always the literal `1`, so a separate FLATTERING_UNIT
// threshold (below) covers it while the primary FLATTERING (60-100) covers
// the percentage form. Same body-character constraint as the percentage-
// form matcher above, for the same misattribution-prevention reason.
const NON_EMPTY_TERNARY_UNIT = /([a-zA-Z_]\w*(?:\.\w+)*?)(?:\.length)?\s*>\s*0\s*\?[^?:{};]{0,220}?:\s*(1)(?!\d|\.\d)\b/g;
const EMPTY_TERNARY_UNIT = /([a-zA-Z_]\w*(?:\.\w+)*?)(?:\.length)?\s*===?\s*0\s*\?\s*(1)(?!\d|\.\d)\b/g;
// Fab-0 mirror form:
//   `xs.length > 0 ? Math.round((completed/xs.length) * 100) : 0`
// Body captured (m[2]) so the run loop can check for a computed-metric call
// (Math.round/max/min, average, mean, meanOf, round1/round2) — the "compute
// gate". Generic `? X : 0` (boolean-as-int, count fallback, alert-flag) is
// legitimate at ~200+ sites and does NOT match this gate. Same body-character
// containment as the sibling matchers, plus a trailing `(?!\.\d)` so `: 0.5`
// (which is a rate literal, not a fab-0) never matches.
const NON_EMPTY_TERNARY_ZERO = /([a-zA-Z_]\w*(?:\.\w+)*?)(?:\.length)?\s*>\s*0\s*\?([^?:{};]{0,220}?):\s*0\b(?!\.\d)/g;
// The compute-gate keeps the fab-0 matcher narrow enough to enforce. A body
// that computes a PERCENTAGE (contains `* 100`) is the shape that produces
// the most misleading dashboard output — "0% compliant on an empty register"
// is the mirror of "100% compliant on an empty register" and reads exactly
// as false. Duration/count/currency averages ARE also fab-0 in the strict
// sense, but they show up ~200x across page components and the burn-down
// would swamp the doctrine. Add another gate here (e.g. `average\\(` or
// `Math\\.max\\(`) only when a specific engine's regression is worth the
// class-wide baseline entry cost.
const COMPUTE_CALL = /Math\.round\s*\([^)]*\*\s*100\s*\)/;
// Object-return form:
//   if (expected.length === 0) return { score: 100, missing: [] };
// EMPTY_RETURN matches scalar `return N;` only, so a function that early-
// exits with a full score inside an object literal was silently uncaught.
// Field names limited to those Cara uses for scoring outputs (score, rate,
// percentage, pct, compliance, coverage) — widening would catch config /
// pagination defaults (limit: 100, size: 100) that aren't scoring at all.
const EMPTY_RETURN_OBJECT =
  /if\s*\(\s*!?\s*(\w+(?:\.\w+)*)(?:\.length)?\s*(?:===?\s*0|<\s*1)?\s*\)\s*return\s*\{[^}]*?\b(?:score|rate|percentage|pct|compliance|coverage)\s*:\s*(\d{2,3})\b/g;

// Blank out line and block comments BEFORE matching, so a memory-doc line
// quoting the bug pattern (line comments in engine headers, block comments
// on domain scoring) doesn't itself count as one. Whitespace-preserving so
// line numbers stay stable. Not a full JS parser: inside a string literal a
// `//` is still zeroed to whitespace, but score literals don't appear inside
// quoted strings in practice, so this is fine for what the scan measures.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, prefix) => prefix + " ".repeat(m.length - prefix.length));
}

const found = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const rawSrc = fs.readFileSync(file, "utf8");
    const src = stripComments(rawSrc);
    const rel = path.relative(ROOT, file);
    // Percentage-form matchers: value must be in the FLATTERING (60-100) band.
    for (const re of [NON_EMPTY_TERNARY, EMPTY_TERNARY, EMPTY_RETURN, EMPTY_RETURN_OBJECT]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(src)) !== null) {
        const value = Number(m[2]);
        if (value < FLATTERING || value > 100) continue;
        const line = src.slice(0, m.index).split("\n").length;
        found.push({ key: `${rel}:${m[1]}:${value}`, rel, line, collection: m[1], value });
      }
    }
    // Unit-scale (0-1) matchers: the literal is always `1`, which is the
    // same lie as `100` on a 0-100 scale. Tracked in the same baseline so
    // the class stays enforced regardless of numeric scale.
    for (const re of [NON_EMPTY_TERNARY_UNIT, EMPTY_TERNARY_UNIT]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(src)) !== null) {
        const line = src.slice(0, m.index).split("\n").length;
        // Key uses `:1` as the value marker so it can never collide with a
        // percentage-form entry at the same site.
        found.push({ key: `${rel}:${m[1]}:1`, rel, line, collection: m[1], value: 1 });
      }
    }
    // Fab-0 mirror: `X.length > 0 ? <computed metric> : 0`. The compute-gate
    // (COMPUTE_CALL against the body) is what keeps this narrow — without it
    // the matcher would false-positive on every `? 1 : 0` (boolean-as-int)
    // and `? count : 0` (count fallback) in the codebase.
    NON_EMPTY_TERNARY_ZERO.lastIndex = 0;
    let m;
    while ((m = NON_EMPTY_TERNARY_ZERO.exec(src)) !== null) {
      const body = m[2];
      if (!COMPUTE_CALL.test(body)) continue;
      const line = src.slice(0, m.index).split("\n").length;
      // Key uses `:0` as the value marker; distinct from `:1` (unit) and
      // `:60..100` (percentage) so it can never collide at the same site.
      found.push({ key: `${rel}:${m[1]}:0`, rel, line, collection: m[1], value: 0 });
    }
  }
}

const fresh = found.filter((f) => !BASELINE.has(f.key) && !ALLOWED.has(f.key));
// A baselined key that no longer appears has been fixed (or moved) — drop it
// from the list so the baseline can only ever shrink.
const foundKeys = new Set(found.map((f) => f.key));
const stale = [...BASELINE].filter((k) => !foundKeys.has(k));
// An allowlist entry whose site is gone is no longer vouching for anything;
// leaving it would let a future site silently inherit someone else's sign-off.
const staleAllowed = [...ALLOWED.keys()].filter((k) => !foundKeys.has(k));

let failed = false;

if (fresh.length > 0) {
  failed = true;
  console.error(
    `check-fabricated-scores: ${fresh.length} new site(s) fabricate a score from an EMPTY population.\n` +
      "A percentage/duration/count with no records behind it must be null (\"not yet measured\"), not a placeholder — 0 lies the same way 100 does:\n",
  );
  for (const f of fresh) {
    console.error(`  ✗ ${f.rel}:${f.line} — empty \`${f.collection}\` yields ${f.value}`);
  }
  console.error("\nUse rate()/rateOf()/meanOf()/weightedMeanOf() + meets()/below()/above() from src/lib/metrics/rate.ts. See this file's header.");
}

if (stale.length > 0) {
  failed = true;
  console.error(
    `\ncheck-fabricated-scores: ${stale.length} baselined site(s) no longer match — they look fixed.\n` +
      "Remove them from scripts/fabricated-scores-baseline.json so the baseline keeps shrinking:\n",
  );
  for (const k of stale) console.error(`  – ${k}`);
}

if (staleAllowed.length > 0) {
  failed = true;
  console.error(
    `\ncheck-fabricated-scores: ${staleAllowed.length} allowlisted site(s) no longer exist.\n` +
      "Remove them from the ALLOWED map in this file — a sign-off must point at real code:\n",
  );
  for (const k of staleAllowed) console.error(`  – ${k}`);
}

if (failed) process.exit(1);

const remaining = BASELINE.size > 0
  ? `${BASELINE.size} baselined site(s) remaining to burn down`
  : "baseline empty — the class is fully burned down";
console.log(
  `check-fabricated-scores: no new fabricated-on-empty scores ✓ (${remaining}; ${ALLOWED.size} verified-correct site(s) allowlisted)`,
);
