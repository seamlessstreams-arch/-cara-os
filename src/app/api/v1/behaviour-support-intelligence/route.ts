import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Signal = "green" | "amber" | "red" | "grey";

export type BSPChildProfile = {
  childId: string;
  childName: string;
  hasBSP: boolean;
  bspStatus: string | null;
  reviewDate: string | null;
  daysUntilReview: number | null;
  reviewOverdue: boolean;
  lastReviewDate: string | null;
  highSeverityBehaviours: number;
  totalBehaviours: number;
  improvingBehaviours: number;
  triggerCount: number;
  topTriggers: string[];
  hasRestrictiveInterventions: boolean;
  diagnoses: string[];
  signal: Signal;
};

export type BehaviourSupportData = {
  totalChildren: number;
  childrenWithBSP: number;
  childrenWithoutBSP: number;
  overdueReviews: number;
  reviewsDueSoon: number;
  highSeverityTotal: number;
  improvingTotal: number;
  restrictiveInterventionCount: number;
  childProfiles: BSPChildProfile[];
  insights: string[];
  overallSignal: Signal;
  regulatoryNote: string;
};

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

export async function GET() {
  const [behaviourSupportPlansList, youngPeopleList] = await Promise.all([
      dal.behaviourSupportPlans.findAll(),
      dal.youngPeople.findAll(),
    ]);
  const today = todayStr();

  const currentChildren = youngPeopleList.filter((yp) => yp.status === "current");

  const bspByChild = new Map<string, (typeof behaviourSupportPlansList)[0]>();
  for (const bsp of behaviourSupportPlansList) {
    const existing = bspByChild.get(bsp.child_id);
    if (!existing || (bsp.status === "active" && existing.status !== "active")) {
      bspByChild.set(bsp.child_id, bsp);
    }
  }

  let overdueReviews = 0;
  let reviewsDueSoon = 0;
  let highSeverityTotal = 0;
  let improvingTotal = 0;
  let restrictiveInterventionCount = 0;

  const childProfiles: BSPChildProfile[] = [];

  for (const child of currentChildren) {
    const bsp = bspByChild.get(child.id);

    if (!bsp) {
      childProfiles.push({
        childId: child.id,
        childName: child.preferred_name ?? child.first_name,
        hasBSP: false,
        bspStatus: null,
        reviewDate: null,
        daysUntilReview: null,
        reviewOverdue: false,
        lastReviewDate: null,
        highSeverityBehaviours: 0,
        totalBehaviours: 0,
        improvingBehaviours: 0,
        triggerCount: 0,
        topTriggers: [],
        hasRestrictiveInterventions: false,
        diagnoses: [],
        signal: "grey",
      });
      continue;
    }

    const daysUntilReview = bsp.review_date ? daysBetween(today, bsp.review_date) : null;
    const reviewOverdue = daysUntilReview !== null && daysUntilReview < 0;
    if (reviewOverdue) overdueReviews++;
    if (daysUntilReview !== null && daysUntilReview >= 0 && daysUntilReview <= 14) reviewsDueSoon++;

    const primaryBehaviours = bsp.primary_behaviours ?? [];
    const highSeverity = primaryBehaviours.filter((b) => b.severity === "high").length;
    const improving = primaryBehaviours.filter((b) => b.trend === "improving").length;

    const triggers = bsp.known_triggers ?? [];
    const topTriggers = triggers.slice(0, 3).map((t) => t.trigger);

    const hasRestrictive = (bsp.restrictive_interventions ?? []).length > 0;
    if (hasRestrictive) restrictiveInterventionCount++;

    highSeverityTotal += highSeverity;
    improvingTotal += improving;

    const lastReview = bsp.review_history?.length > 0
      ? bsp.review_history.sort((a, b) => b.date.localeCompare(a.date))[0].date
      : null;

    let signal: Signal;
    if (reviewOverdue || highSeverity > 1) signal = "red";
    else if (
      (daysUntilReview !== null && daysUntilReview <= 14) ||
      highSeverity > 0 ||
      !bsp.child_views
    ) {
      signal = "amber";
    } else {
      signal = "green";
    }

    childProfiles.push({
      childId: child.id,
      childName: child.preferred_name ?? child.first_name,
      hasBSP: true,
      bspStatus: bsp.status,
      reviewDate: bsp.review_date ?? null,
      daysUntilReview,
      reviewOverdue,
      lastReviewDate: lastReview,
      highSeverityBehaviours: highSeverity,
      totalBehaviours: primaryBehaviours.length,
      improvingBehaviours: improving,
      triggerCount: triggers.length,
      topTriggers,
      hasRestrictiveInterventions: hasRestrictive,
      diagnoses: bsp.diagnosis ?? [],
      signal,
    });
  }

  const childrenWithBSP = childProfiles.filter((p) => p.hasBSP).length;
  const childrenWithoutBSP = currentChildren.length - childrenWithBSP;

  const insights: string[] = [];

  if (childrenWithoutBSP > 0) {
    insights.push(
      `${childrenWithoutBSP} child${childrenWithoutBSP === 1 ? " does" : "ren do"} not have a Behaviour Support Plan. Every child with identified behavioural needs requires a current, personalised plan.`
    );
  }
  if (overdueReviews > 0) {
    insights.push(
      `${overdueReviews} Behaviour Support Plan${overdueReviews === 1 ? " is" : "s are"} overdue for review. BSPs must be reviewed regularly — particularly following significant incidents or when strategies are no longer effective.`
    );
  }
  if (highSeverityTotal > 0) {
    insights.push(
      `${highSeverityTotal} high-severity behaviour${highSeverityTotal === 1 ? " is" : "s are"} documented across current plans. Ensure all staff have read and signed each plan and that de-escalation strategies are consistent across the team.`
    );
  }
  if (improvingTotal > 0) {
    insights.push(
      `${improvingTotal} identified behaviour${improvingTotal === 1 ? " is" : "s are"} showing an improving trend — a positive indicator. Note what strategies are working and ensure they are highlighted in reflective supervisions.`
    );
  }
  if (restrictiveInterventionCount > 0) {
    insights.push(
      `${restrictiveInterventionCount} child${restrictiveInterventionCount === 1 ? " has" : "ren have"} restrictive interventions documented in their BSP. Ensure all staff are trained, the RM has authorised each intervention, and post-incident review is completed within 24 hours.`
    );
  }

  let overallSignal: Signal;
  if (childProfiles.some((p) => p.signal === "red")) overallSignal = "red";
  else if (childProfiles.some((p) => p.signal === "amber") || childrenWithoutBSP > 0) overallSignal = "amber";
  else if (childProfiles.every((p) => p.signal === "grey")) overallSignal = "grey";
  else overallSignal = "green";

  const data: BehaviourSupportData = {
    totalChildren: currentChildren.length,
    childrenWithBSP,
    childrenWithoutBSP,
    overdueReviews,
    reviewsDueSoon,
    highSeverityTotal,
    improvingTotal,
    restrictiveInterventionCount,
    childProfiles,
    insights,
    overallSignal,
    regulatoryNote:
      "Children's Homes Regulations 2015 Reg 12 requires each child's individual needs to be met, including behaviour management approaches. The Quality Standards require that approaches are therapeutic, not punitive, and that restrictive interventions are used only as a last resort, with post-incident debrief (Reg 22 and SCCIF).",
  };

  return NextResponse.json({ data });
}
