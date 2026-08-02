import { NextResponse } from "next/server";
import { dal } from "@/lib/db";

export const dynamic = "force-dynamic";

type Signal = "green" | "amber" | "red" | "grey";

export type LACReviewChildProfile = {
  childId: string;
  childName: string;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  daysUntilNextReview: number | null;
  reviewOverdue: boolean;
  totalReviews: number;
  mostRecentParticipation: string | null;
  totalActions: number;
  completedActions: number;
  overdueActions: number;
  actionCompletionRate: number | null;
  signal: Signal;
};

export type LACReviewComplianceData = {
  totalReviews: number;
  childrenWithNoReview: number;
  overdueReviews: number;
  reviewsDueSoon: number;
  totalActions: number;
  completedActions: number;
  overdueActions: number;
  childParticipationCount: number;
  totalChildren: number;
  childProfiles: LACReviewChildProfile[];
  insights: string[];
  overallSignal: Signal;
  regulatoryNote: string;
};

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

export async function GET() {
  const [lacReviewsList, youngPeopleList] = await Promise.all([
      dal.lacReviews.findAll(),
      dal.youngPeople.findAll(),
    ]);
  const today = new Date().toISOString().slice(0, 10);

  const currentChildren = youngPeopleList.filter((yp) => yp.status === "current");
  const allReviews = lacReviewsList;
  let totalActions = 0;
  let completedActions = 0;
  let overdueActions = 0;
  let childParticipationCount = 0;
  let overdueReviews = 0;
  let reviewsDueSoon = 0;
  let childrenWithNoReview = 0;

  const childProfiles: LACReviewChildProfile[] = [];

  for (const child of currentChildren) {
    const reviews = allReviews
      .filter((r) => r.child_id === child.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      childrenWithNoReview++;
      childProfiles.push({
        childId: child.id,
        childName: child.preferred_name ?? child.first_name,
        lastReviewDate: null,
        nextReviewDate: null,
        daysUntilNextReview: null,
        reviewOverdue: false,
        totalReviews: 0,
        mostRecentParticipation: null,
        totalActions: 0,
        completedActions: 0,
        overdueActions: 0,
        actionCompletionRate: null,
        signal: "grey",
      });
      continue;
    }

    const mostRecent = reviews[0];
    const lastReviewDate = mostRecent.date;
    const nextReviewDate = mostRecent.next_review_date ?? null;
    const daysUntilNextReview = nextReviewDate ? daysBetween(today, nextReviewDate) : null;
    const reviewOverdue = daysUntilNextReview !== null && daysUntilNextReview < 0;
    if (reviewOverdue) overdueReviews++;
    if (daysUntilNextReview !== null && daysUntilNextReview >= 0 && daysUntilNextReview <= 30) reviewsDueSoon++;

    const mostRecentParticipation = mostRecent.child_participation;
    if (mostRecentParticipation === "attended" || mostRecentParticipation === "views_submitted") {
      childParticipationCount++;
    }

    let childTotalActions = 0;
    let childCompleted = 0;
    let childOverdue = 0;
    for (const review of reviews) {
      for (const action of review.actions_agreed) {
        childTotalActions++;
        if (action.completed) {
          childCompleted++;
        } else if (action.due_date && action.due_date < today) {
          childOverdue++;
        }
      }
    }

    totalActions += childTotalActions;
    completedActions += childCompleted;
    overdueActions += childOverdue;

    const actionCompletionRate =
      childTotalActions > 0 ? Math.round((childCompleted / childTotalActions) * 100) : null;

    let signal: Signal;
    if (reviewOverdue || childOverdue > 0) {
      signal = "red";
    } else if (
      (daysUntilNextReview !== null && daysUntilNextReview <= 30) ||
      (actionCompletionRate !== null && actionCompletionRate < 75)
    ) {
      signal = "amber";
    } else {
      signal = "green";
    }

    childProfiles.push({
      childId: child.id,
      childName: child.preferred_name ?? child.first_name,
      lastReviewDate,
      nextReviewDate,
      daysUntilNextReview,
      reviewOverdue,
      totalReviews,
      mostRecentParticipation,
      totalActions: childTotalActions,
      completedActions: childCompleted,
      overdueActions: childOverdue,
      actionCompletionRate,
      signal,
    });
  }

  const insights: string[] = [];
  if (childrenWithNoReview > 0) {
    insights.push(
      `${childrenWithNoReview} child${childrenWithNoReview === 1 ? " has" : "ren have"} no LAC review on record. Ensure reviews are recorded as soon as they are completed.`
    );
  }
  if (overdueReviews > 0) {
    insights.push(
      `${overdueReviews} review${overdueReviews === 1 ? " is" : "s are"} overdue. LAC reviews are a statutory requirement — the IRO must be notified and a date agreed urgently.`
    );
  }
  if (overdueActions > 0) {
    insights.push(
      `${overdueActions} review action${overdueActions === 1 ? " is" : "s are"} past their due date. Contact action owners and update the record with progress or revised dates.`
    );
  }
  if (reviewsDueSoon > 0) {
    insights.push(
      `${reviewsDueSoon} LAC review${reviewsDueSoon === 1 ? " is" : "s are"} due within 30 days. Begin preparation with the social worker and ensure the young person knows their review is coming up.`
    );
  }
  if (childParticipationCount === currentChildren.length && currentChildren.length > 0) {
    insights.push(
      "All children participated in or submitted views for their most recent review — excellent practice for Article 12 compliance."
    );
  }

  let overallSignal: Signal;
  if (childProfiles.some((p) => p.signal === "red") || childrenWithNoReview > 0) overallSignal = "red";
  else if (childProfiles.some((p) => p.signal === "amber")) overallSignal = "amber";
  else if (childProfiles.every((p) => p.signal === "grey")) overallSignal = "grey";
  else overallSignal = "green";

  const data: LACReviewComplianceData = {
    totalReviews: allReviews.length,
    childrenWithNoReview,
    overdueReviews,
    reviewsDueSoon,
    totalActions,
    completedActions,
    overdueActions,
    childParticipationCount,
    totalChildren: currentChildren.length,
    childProfiles,
    insights,
    overallSignal,
    regulatoryNote:
      "LAC reviews are a statutory requirement under the Care Planning, Placement and Case Review Regulations 2010. First reviews must be within 20 working days of placement; subsequent reviews within 3 months of the first, then every 6 months. The IRO is responsible for chairing and monitoring actions.",
  };

  return NextResponse.json({ data });
}
