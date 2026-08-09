import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Signal = "green" | "amber" | "red" | "grey";

export type RiskAssessmentChildProfile = {
  childId: string;
  childName: string;
  totalAssessments: number;
  overdueAssessments: number;
  dueWithin14Days: number;
  highOrVeryHighDomains: string[];
  improvingDomains: string[];
  decliningDomains: string[];
  domainsCovered: string[];
  daysUntilEarliestReview: number | null;
  signal: Signal;
};

export type RiskAssessmentCurrencyData = {
  totalAssessments: number;
  overdueAssessments: number;
  dueWithin14Days: number;
  highRiskCount: number;
  veryHighRiskCount: number;
  improvingCount: number;
  decliningCount: number;
  childProfiles: RiskAssessmentChildProfile[];
  insights: string[];
  overallSignal: Signal;
  regulatoryNote: string;
};

const DOMAIN_LABELS: Record<string, string> = {
  self_harm:        "Self-harm",
  absconding:       "Absconding",
  aggression:       "Aggression",
  exploitation:     "Exploitation",
  substance_use:    "Substance use",
  online_safety:    "Online safety",
  fire_setting:     "Fire setting",
  sexual_behaviour: "Sexual behaviour",
  self_neglect:     "Self-neglect",
  emotional_harm:   "Emotional harm",
};

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

export async function GET() {
  const [riskAssessmentsList, youngPeopleList] = await Promise.all([
      dal.riskAssessments.findAll(),
      dal.youngPeople.findAll(),
    ]);
  const today = todayStr();

  const currentChildren = youngPeopleList.filter((yp) => yp.status === "current");

  const currentAssessments = riskAssessmentsList.filter((ra) => ra.status === "current");

  let totalOverdue = 0;
  let totalDueWithin14 = 0;
  let highRiskCount = 0;
  let veryHighRiskCount = 0;
  let improvingCount = 0;
  let decliningCount = 0;

  for (const ra of currentAssessments) {
    const daysUntil = daysBetween(today, ra.review_date);
    if (daysUntil < 0) totalOverdue++;
    else if (daysUntil <= 14) totalDueWithin14++;
    if (ra.current_level === "high") highRiskCount++;
    if (ra.current_level === "very_high") veryHighRiskCount++;
    if (ra.trend === "decreasing") improvingCount++;
    if (ra.trend === "increasing") decliningCount++;
  }

  const childProfiles: RiskAssessmentChildProfile[] = [];

  for (const child of currentChildren) {
    const assessments = currentAssessments.filter((ra) => ra.child_id === child.id);

    if (assessments.length === 0) {
      childProfiles.push({
        childId: child.id,
        childName: child.preferred_name ?? child.first_name,
        totalAssessments: 0,
        overdueAssessments: 0,
        dueWithin14Days: 0,
        highOrVeryHighDomains: [],
        improvingDomains: [],
        decliningDomains: [],
        domainsCovered: [],
        daysUntilEarliestReview: null,
        signal: "grey",
      });
      continue;
    }

    let childOverdue = 0;
    let childDueWithin14 = 0;
    const highOrVeryHighDomains: string[] = [];
    const improvingDomains: string[] = [];
    const decliningDomains: string[] = [];
    const domainsCovered: string[] = [];
    let minDaysUntilReview: number | null = null;

    for (const ra of assessments) {
      const daysUntil = daysBetween(today, ra.review_date);
      if (daysUntil < 0) childOverdue++;
      else if (daysUntil <= 14) childDueWithin14++;

      if (minDaysUntilReview === null || daysUntil < minDaysUntilReview) {
        minDaysUntilReview = daysUntil;
      }

      const domainLabel = DOMAIN_LABELS[ra.domain] ?? ra.domain;
      domainsCovered.push(domainLabel);

      if (ra.current_level === "high" || ra.current_level === "very_high") {
        highOrVeryHighDomains.push(domainLabel);
      }
      if (ra.trend === "decreasing") improvingDomains.push(domainLabel);
      if (ra.trend === "increasing") decliningDomains.push(domainLabel);
    }

    let signal: Signal;
    if (
      assessments.some((ra) => ra.current_level === "very_high") ||
      childOverdue > 0
    ) {
      signal = "red";
    } else if (
      assessments.some((ra) => ra.current_level === "high") ||
      decliningDomains.length > 0 ||
      (minDaysUntilReview !== null && minDaysUntilReview <= 7)
    ) {
      signal = "amber";
    } else {
      signal = "green";
    }

    childProfiles.push({
      childId: child.id,
      childName: child.preferred_name ?? child.first_name,
      totalAssessments: assessments.length,
      overdueAssessments: childOverdue,
      dueWithin14Days: childDueWithin14,
      highOrVeryHighDomains,
      improvingDomains,
      decliningDomains,
      domainsCovered,
      daysUntilEarliestReview: minDaysUntilReview,
      signal,
    });
  }

  const insights: string[] = [];

  if (veryHighRiskCount > 0) {
    insights.push(
      `${veryHighRiskCount} risk assessment${veryHighRiskCount === 1 ? "" : "s"} currently at VERY HIGH level. These require frequent review and immediate escalation if indicators present.`
    );
  }
  if (totalOverdue > 0) {
    insights.push(
      `${totalOverdue} risk assessment${totalOverdue === 1 ? " is" : "s are"} overdue for review. Risk assessments must be reviewed within the specified interval — the registered manager should prioritise these immediately.`
    );
  }
  if (decliningCount > 0) {
    insights.push(
      `${decliningCount} risk domain${decliningCount === 1 ? " is" : "s are"} trending towards higher risk. Consider whether the current mitigation strategies need strengthening.`
    );
  }
  if (improvingCount > 0) {
    insights.push(
      `${improvingCount} domain${improvingCount === 1 ? "" : "s"} showing decreasing risk — a positive sign. Ensure the interventions driving improvement are maintained and documented.`
    );
  }
  if (totalDueWithin14 > 0) {
    insights.push(
      `${totalDueWithin14} assessment${totalDueWithin14 === 1 ? " is" : "s are"} due for review within 14 days. Schedule these reviews now to avoid them becoming overdue.`
    );
  }

  let overallSignal: Signal;
  if (childProfiles.some((p) => p.signal === "red")) overallSignal = "red";
  else if (childProfiles.some((p) => p.signal === "amber")) overallSignal = "amber";
  else if (childProfiles.every((p) => p.signal === "grey")) overallSignal = "grey";
  else overallSignal = "green";

  const data: RiskAssessmentCurrencyData = {
    totalAssessments: currentAssessments.length,
    overdueAssessments: totalOverdue,
    dueWithin14Days: totalDueWithin14,
    highRiskCount,
    veryHighRiskCount,
    improvingCount,
    decliningCount,
    childProfiles,
    insights,
    overallSignal,
    regulatoryNote:
      "Each child must have up-to-date risk assessments covering all identified domains (Children's Homes Regulations 2015, Reg 12; Children's Homes Quality Standards 2015). Risk assessments must be reviewed following any significant incident or change in circumstances, and at the frequency specified in each assessment.",
  };

  return NextResponse.json({ data });
}
