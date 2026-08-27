import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { below, formatRate, meanOf, meets, rate, weightedMeanOf } from "@/lib/metrics/rate";
import type {
  QualityDimension,
  QualityOfCareAnalysis,
  SignalColour,
} from "@/lib/cara-visual-toolkit/types";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.round(Math.abs(d1 - d2) / 86_400_000);
}

function signal(score: number | null): SignalColour {
  if (score === null) return "grey";
  if (score >= 75) return "green";
  if (score >= 50) return "amber";
  return "red";
}

export async function GET() {
  const [debriefRecordsList, incidentsList, keyWorkingSessionsList, reflectiveSupervisionsList, reg44VisitReportsList, riskAssessmentsList, staffList, trainingRecordsList, youngPeopleList] = await Promise.all([
      dal.debriefRecords.findAll(),
      dal.incidents.findAll(),
      dal.keyWorkingSessions.findAll(),
      dal.reflectiveSupervisions.findAll(),
      dal.reg44VisitReports.findAll(),
      dal.riskAssessments.findAll(),
      dal.staff.findAll(),
      dal.trainingRecords.findAll(),
      dal.youngPeople.findAll(),
    ]);
  const today = todayStr();
  const thirtyAgo = new Date(new Date().getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
  const ninetyAgo = new Date(new Date().getTime() - 90 * 86_400_000).toISOString().slice(0, 10);

  const youngPeople = ((youngPeopleList)) ?? [];
  const activeChildren = youngPeople.filter(
    (y) => y.status === "current" || y.status === "emergency"
  );

  const incidents = ((incidentsList)) ?? [];
  const keyWorkingSessions = ((keyWorkingSessionsList)) ?? [];
  const reflectiveSupervisions = ((reflectiveSupervisionsList)) ?? [];
  const reg44 = ((reg44VisitReportsList)) ?? [];
  const riskAssessments = ((riskAssessmentsList)) ?? [];
  const trainingRecords = ((trainingRecordsList)) ?? [];
  const staff = ((staffList)) ?? [];
  const debriefs = ((debriefRecordsList)) ?? [];

  // ── Dimension 1: Quality of relationships ────────────────────────────────
  const recentKeyWork = keyWorkingSessions.filter((k) => (k.date ?? "") >= thirtyAgo).length;
  const childrenWithKeyWork = new Set(
    keyWorkingSessions
      .filter((k) => (k.date ?? "") >= thirtyAgo)
      .map((k) => k.child_id)
  ).size;
  const kwCoverage = rate(childrenWithKeyWork, activeChildren.length);
  const d1Score = kwCoverage === null ? null : Math.min(100, kwCoverage);
  const d1: QualityDimension = {
    id: "relationships",
    label: "Quality of relationships",
    score: d1Score,
    signal: signal(d1Score),
    evidence: [
      `${recentKeyWork} key work sessions in the last 30 days`,
      `${childrenWithKeyWork} of ${activeChildren.length} children had key work recently`,
    ],
    gaps: below(kwCoverage, 80)
      ? [`${activeChildren.length - childrenWithKeyWork} children have not had key work in the last 30 days`]
      : [],
  };

  // ── Dimension 2: Safety and risk management ───────────────────────────────
  const openHighRisk = riskAssessments.filter(
    (r) => (r.current_level === "high" || r.current_level === "very_high") && (r.status === "current" || r.status === "under_review")
  ).length;
  const overdueRAs = riskAssessments.filter(
    (r) => r.review_date && r.review_date < today && (r.status === "current" || r.status === "under_review")
  ).length;
  const openCriticalIncidents = incidents.filter(
    (i) => i.severity === "critical" && i.status !== "closed"
  ).length;
  // An empty risk register and an empty incident log mean nothing has been
  // recorded yet — not that risk is being managed well, so there is no score.
  let d2Score: number | null = null;
  if (riskAssessments.length > 0 || incidents.length > 0) {
    let s = 100;
    if (openCriticalIncidents > 0) s -= 30;
    if (openHighRisk > 2) s -= 20;
    if (overdueRAs > 0) s -= Math.min(30, overdueRAs * 10);
    d2Score = Math.max(0, s);
  }
  const d2: QualityDimension = {
    id: "safety",
    label: "Safety and risk management",
    score: d2Score,
    signal: signal(d2Score),
    evidence: [
      `${riskAssessments.length} risk assessments on record`,
      riskAssessments.length > 0 && overdueRAs === 0
        ? "All risk assessments are within review dates"
        : "",
    ].filter(Boolean),
    gaps: [
      openCriticalIncidents > 0 ? `${openCriticalIncidents} critical incident${openCriticalIncidents > 1 ? "s" : ""} still open` : "",
      overdueRAs > 0 ? `${overdueRAs} overdue risk assessment review${overdueRAs > 1 ? "s" : ""}` : "",
      openHighRisk > 2 ? `${openHighRisk} open high/critical risk domains` : "",
    ].filter(Boolean),
  };

  // ── Dimension 3: Reflective practice and learning ─────────────────────────
  const recentSupervisions = reflectiveSupervisions.filter(
    (s) => (s.date ?? "") >= ninetyAgo
  ).length;
  const activeStaff = staff.filter(
    (s) => s.employment_status !== "left" && s.is_active !== false
  );
  const supCoverage = rate(
    new Set(
      reflectiveSupervisions
        .filter((s) => (s.date ?? "") >= ninetyAgo)
        .map((s) => s.staff_id)
    ).size,
    activeStaff.length
  );
  // No incidents means no debriefs were due — an unmeasured rate, not a perfect one.
  const debriefRate = rate(
    debriefs.filter((d) => d.linked_incident_id).length,
    incidents.length
  );
  const d3Score = weightedMeanOf([
    { score: supCoverage, weight: 0.6 },
    { score: debriefRate, weight: 0.4 },
  ]);
  const d3: QualityDimension = {
    id: "reflective_practice",
    label: "Reflective practice and learning",
    score: d3Score,
    signal: signal(d3Score),
    evidence: [
      `${recentSupervisions} supervision sessions in the last 90 days`,
      debriefRate !== null
        ? `${debriefRate}% of incidents have a completed debrief`
        : "No incidents recorded — debrief completion not yet measured",
    ],
    gaps: [
      below(supCoverage, 80) ? `${activeStaff.length - Math.round(((supCoverage ?? 0) / 100) * activeStaff.length)} staff members have not had supervision in 90 days` : "",
      below(debriefRate, 50) ? `Post-incident debrief completion rate is low (${debriefRate}%)` : "",
    ].filter(Boolean),
  };

  // ── Dimension 4: Staff development and wellbeing ─────────────────────────
  const mandatory = trainingRecords.filter((t) => t.is_mandatory === true);
  const compliant = mandatory.filter(
    (t) => (t.status === "compliant" || t.status === "expiring_soon") && (!t.expiry_date || t.expiry_date >= today)
  );
  const trainingRate = rate(compliant.length, mandatory.length);
  const wellbeingScores = reflectiveSupervisions
    .filter((s) => s.wellbeing_score != null && (s.date ?? "") >= ninetyAgo)
    .map((s) => Number(s.wellbeing_score));
  const avgWellbeing =
    wellbeingScores.length > 0
      ? wellbeingScores.reduce((a: number, b: number) => a + b, 0) / wellbeingScores.length
      : null;
  const wellbeingScore = avgWellbeing !== null ? Math.round((avgWellbeing / 5) * 100) : null;
  const d4Score = weightedMeanOf([
    { score: trainingRate, weight: 0.6 },
    { score: wellbeingScore, weight: 0.4 },
  ]);
  const d4: QualityDimension = {
    id: "staff_development",
    label: "Staff development and wellbeing",
    score: d4Score,
    signal: signal(d4Score),
    evidence: [
      `Mandatory training compliance: ${formatRate(trainingRate, "no mandatory training recorded")}`,
      avgWellbeing !== null ? `Average staff wellbeing score: ${avgWellbeing.toFixed(1)}/5` : "",
    ].filter(Boolean),
    gaps: [
      trainingRate === null ? "No mandatory training records — compliance cannot be evidenced" : "",
      below(trainingRate, 80) ? `Mandatory training compliance below 80% (${trainingRate}%)` : "",
      avgWellbeing !== null && avgWellbeing < 3 ? `Average wellbeing score is low (${avgWellbeing.toFixed(1)}/5) — consider additional support` : "",
    ].filter(Boolean),
  };

  // ── Dimension 5: Regulatory compliance and oversight ─────────────────────
  const latestReg44 = reg44.sort((a, b) =>
    (b.visit_date ?? "").localeCompare(a.visit_date ?? "")
  )[0];
  const daysSinceReg44 = latestReg44?.visit_date
    ? daysBetween(today, latestReg44.visit_date)
    : 999;
  const reg44Overdue = daysSinceReg44 > 28;
  const positiveReg44 = latestReg44?.overall_judgement === "good" || latestReg44?.overall_judgement === "outstanding";
  let d5Score = 80;
  if (reg44Overdue) d5Score -= 25;
  if (positiveReg44) d5Score = Math.min(100, d5Score + 15);
  d5Score = Math.max(0, d5Score);
  const d5: QualityDimension = {
    id: "regulatory",
    label: "Regulatory compliance and oversight",
    score: d5Score,
    signal: signal(d5Score),
    evidence: [
      latestReg44 ? `Most recent Reg 44 visit: ${latestReg44.visit_date} — ${latestReg44.overall_judgement ?? "no judgement recorded"}` : "",
      !reg44Overdue ? `Reg 44 visits are within the 28-day requirement` : "",
    ].filter(Boolean),
    gaps: [
      reg44Overdue ? `Reg 44 visit is overdue (${daysSinceReg44 < 999 ? `${daysSinceReg44} days` : "no visits recorded"})` : "",
    ].filter(Boolean),
  };

  const dimensions = [d1, d2, d3, d4, d5];
  const overallScore = meanOf(dimensions.map((d) => d.score));
  const overallSignal = signal(overallScore);

  const strengths = dimensions
    .filter((d) => d.signal === "green")
    .map((d) => d.label);
  const areasForImprovement = dimensions
    .filter((d) => d.signal !== "green")
    .flatMap((d) => d.gaps)
    .filter(Boolean)
    .slice(0, 6);

  const insights: string[] = [];
  const red = dimensions.filter((d) => d.signal === "red");
  if (red.length > 0) {
    insights.push(
      `${red.length} dimension${red.length > 1 ? "s" : ""} scoring below 50: ${red.map((d) => d.label).join(", ")}. These should be prioritised in the quality improvement plan.`
    );
  }
  const unmeasured = dimensions.filter((d) => d.score === null);
  if (unmeasured.length > 0) {
    insights.push(
      `${unmeasured.length} dimension${unmeasured.length > 1 ? "s have" : " has"} no records to score against: ${unmeasured.map((d) => d.label).join(", ")}. An absent evidence base is itself the finding — Ofsted judges on what is recorded, so these are excluded from the overall score rather than counted as compliant.`
    );
  }
  if (meets(overallScore, 75)) {
    insights.push(
      `Overall quality of care score is ${overallScore}/100 — above the good threshold. Maintain focus on continuous improvement and evidence-gathering for Reg 45 and Ofsted.`
    );
  }
  if (d5.signal !== "green") {
    insights.push(
      "Regulatory oversight dimension needs attention. Ensure Reg 44 visits are scheduled and actions from previous visits are completed."
    );
  }

  const result: QualityOfCareAnalysis = {
    overallScore,
    overallSignal,
    dimensions,
    strengths,
    areasForImprovement,
    insights,
    regulatoryNote:
      "CHR 2015 Regulation 45 (annual quality of care review). The registered person must review the quality of care at least annually and produce a written report. This tool supports continuous quality monitoring between formal reviews.",
  };

  return NextResponse.json({ data: result });
}
