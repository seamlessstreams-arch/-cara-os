import { NextResponse } from "next/server";
import { dal } from "@/lib/db";

export const dynamic = "force-dynamic";

type Signal = "green" | "amber" | "red" | "grey";

export type PathwayDomainSummary = {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  signal: Signal;
};

export type IndependenceChildProfile = {
  childId: string;
  childName: string;
  overallReadiness: number;
  status: string;
  pathwayPlanLinked: boolean;
  reviewDate: string | null;
  daysUntilReview: number | null;
  reviewOverdue: boolean;
  domains: PathwayDomainSummary[];
  weakestDomains: string[];
  strongestDomains: string[];
  signal: Signal;
};

export type IndependencePathwayData = {
  totalChildren: number;
  childrenWithPathway: number;
  childrenWithoutPathway: number;
  avgReadiness: number | null;
  childrenNeedingAttention: number;
  overdueReviews: number;
  unlinkedPlans: number;
  childProfiles: IndependenceChildProfile[];
  insights: string[];
  overallSignal: Signal;
  regulatoryNote: string;
};

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

function domainSignal(pct: number): Signal {
  if (pct >= 70) return "green";
  if (pct >= 50) return "amber";
  return "red";
}

export async function GET() {
  const [independencePathwaysList, youngPeopleList] = await Promise.all([
      dal.independencePathways.findAll(),
      dal.youngPeople.findAll(),
    ]);
  const today = new Date().toISOString().slice(0, 10);

  const currentChildren = youngPeopleList.filter((yp) => yp.status === "current");
  const childMap = new Map(currentChildren.map((yp) => [yp.id, yp.preferred_name ?? yp.first_name]));

  const pathways = independencePathwaysList ?? [];
  const pathwaysByChild = new Map<string, typeof pathways[0]>();
  for (const p of pathways) {
    const existing = pathwaysByChild.get(p.child_id);
    if (!existing || p.assessment_date > existing.assessment_date) {
      pathwaysByChild.set(p.child_id, p);
    }
  }

  let totalReadiness = 0;
  let readinessCount = 0;
  let childrenNeedingAttention = 0;
  let overdueReviews = 0;
  let unlinkedPlans = 0;

  const childProfiles: IndependenceChildProfile[] = [];

  for (const child of currentChildren) {
    const pathway = pathwaysByChild.get(child.id);

    if (!pathway) {
      childProfiles.push({
        childId: child.id,
        childName: child.preferred_name ?? child.first_name,
        overallReadiness: 0,
        status: "not_assessed",
        pathwayPlanLinked: false,
        reviewDate: null,
        daysUntilReview: null,
        reviewOverdue: false,
        domains: [],
        weakestDomains: [],
        strongestDomains: [],
        signal: "grey",
      });
      continue;
    }

    const daysUntilReview = pathway.review_date
      ? daysBetween(today, pathway.review_date)
      : null;
    const reviewOverdue = daysUntilReview !== null && daysUntilReview < 0;
    if (reviewOverdue) overdueReviews++;
    if (!pathway.pathway_plan_linked) unlinkedPlans++;
    if (pathway.status === "attention_needed") childrenNeedingAttention++;

    const domains: PathwayDomainSummary[] = (pathway.domains ?? []).map((d) => {
      const pct = Math.round((d.score / d.max_score) * 100);
      return {
        name: d.name,
        score: d.score,
        maxScore: d.max_score,
        percentage: pct,
        signal: domainSignal(pct),
      };
    });

    const sortedDomains = [...domains].sort((a, b) => a.percentage - b.percentage);
    const weakestDomains = sortedDomains.slice(0, 2).map((d) => d.name);
    const strongestDomains = [...sortedDomains].reverse().slice(0, 2).map((d) => d.name);

    totalReadiness += pathway.overall_readiness;
    readinessCount++;

    let signal: Signal;
    if (pathway.status === "attention_needed" || reviewOverdue) signal = "red";
    else if (!pathway.pathway_plan_linked || (daysUntilReview !== null && daysUntilReview <= 30)) signal = "amber";
    else if (pathway.overall_readiness < 60) signal = "amber";
    else signal = "green";

    childProfiles.push({
      childId: child.id,
      childName: child.preferred_name ?? child.first_name,
      overallReadiness: pathway.overall_readiness,
      status: pathway.status,
      pathwayPlanLinked: pathway.pathway_plan_linked ?? false,
      reviewDate: pathway.review_date ?? null,
      daysUntilReview,
      reviewOverdue,
      domains,
      weakestDomains,
      strongestDomains,
      signal,
    });
  }

  const avgReadiness = readinessCount > 0 ? Math.round(totalReadiness / readinessCount) : null;
  const childrenWithPathway = childProfiles.filter((p) => p.status !== "not_assessed").length;
  const childrenWithoutPathway = currentChildren.length - childrenWithPathway;

  const insights: string[] = [];

  if (childrenWithoutPathway > 0) {
    insights.push(
      `${childrenWithoutPathway} child${childrenWithoutPathway === 1 ? " does" : "ren do"} not yet have an independence pathway assessment. All children approaching 16 should have a current pathway assessment to inform leaving care planning.`
    );
  }
  if (unlinkedPlans > 0) {
    insights.push(
      `${unlinkedPlans} independence pathway ${unlinkedPlans === 1 ? "is" : "are"} not linked to a Pathway Plan. The social worker must ensure the Pathway Plan is produced by age 16 and reviewed 3-monthly (Children (Leaving Care) Act 2000).`
    );
  }
  if (childrenNeedingAttention > 0) {
    insights.push(
      `${childrenNeedingAttention} child${childrenNeedingAttention === 1 ? "" : "ren"} flagged as needing focussed independence support. Prioritise cooking, money management, and practical skills in key work sessions.`
    );
  }
  if (overdueReviews > 0) {
    insights.push(
      `${overdueReviews} independence pathway review${overdueReviews === 1 ? " is" : "s are"} overdue. Schedule a review and update the score in each domain based on observed progress.`
    );
  }

  let overallSignal: Signal;
  if (childProfiles.some((p) => p.signal === "red")) overallSignal = "red";
  else if (childProfiles.some((p) => p.signal === "amber")) overallSignal = "amber";
  else if (childProfiles.every((p) => p.signal === "grey")) overallSignal = "grey";
  else overallSignal = "green";

  const data: IndependencePathwayData = {
    totalChildren: currentChildren.length,
    childrenWithPathway,
    childrenWithoutPathway,
    avgReadiness,
    childrenNeedingAttention,
    overdueReviews,
    unlinkedPlans,
    childProfiles,
    insights,
    overallSignal,
    regulatoryNote:
      "A Pathway Plan must be produced no later than the date a young person turns 16 (Children (Leaving Care) Act 2000). The plan must be reviewed at least every 3 months, and the young person must be at the centre of its development. Ofsted inspect whether homes support independence development (SCCIF, Quality Standard 7).",
  };

  return NextResponse.json({ data });
}
