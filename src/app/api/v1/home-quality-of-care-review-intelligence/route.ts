import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeQualityOfCareReview,
  type QocReviewInput,
} from "@/lib/engines/home-quality-of-care-review-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);
  const totalChildren = (store.youngPeople ?? []).filter(
    (yp: any) => yp.status === "current",
  ).length;

  // Quality of care reviews → QocReviewInput[]
  const rawReviews = (store.qualityOfCareReviews as any[] ?? []);
  const reviews: QocReviewInput[] = rawReviews.map((r: any) => {
    const domains = (r.domains ?? []) as any[];
    const goodOrOutstandingDomains = domains.filter(
      (d: any) => d.rating === "outstanding" || d.rating === "good"
    ).length;
    const actions = (r.actions ?? []) as any[];
    const completedActions = actions.filter((a: any) => a.status === "completed").length;

    return {
      id: r.id ?? "",
      type: r.type ?? "monthly",
      overall_rating: r.overall_rating ?? "requires_improvement",
      domains_count: domains.length,
      domains_good_or_outstanding: goodOrOutstandingDomains,
      actions_total: actions.length,
      actions_completed: completedActions,
      has_children_feedback: !!(r.children_feedback && r.children_feedback.trim().length > 0),
      has_staff_feedback: !!(r.staff_feedback && r.staff_feedback.trim().length > 0),
      has_strengths: !!((r.strengths ?? []).length > 0),
      has_improvements: !!((r.areas_for_improvement ?? []).length > 0),
    };
  });

  const result = computeQualityOfCareReview({
    today,
    total_children: totalChildren,
    reviews,
  });

  return NextResponse.json({ data: result });
}
