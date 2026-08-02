import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import type {
  ChildRiskDomain,
  ChildSafetyPlan,
  MySafetyPlanAnalysis,
  RiskLevel,
  SignalColour,
} from "@/lib/cara-visual-toolkit/types";

export const dynamic = "force-dynamic";

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a).getTime();
  const d2 = new Date(b).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.round(Math.abs(d1 - d2) / 86_400_000);
}

function initials(yp: any): string {
  const f = ((yp.first_name || yp.preferred_name || "?")[0] ?? "?").toUpperCase();
  const l = ((yp.last_name || "?")[0] ?? "?").toUpperCase();
  return `${f}.${l}.`;
}

function overallRisk(highCount: number, domains: ChildRiskDomain[]): RiskLevel {
  if (highCount >= 3 || domains.some((d) => d.level === "critical")) return "critical";
  if (highCount >= 2) return "high";
  if (highCount >= 1) return "medium";
  return "low";
}

export async function GET() {
  const [keyWorkingSessionsList, riskAssessmentsList, staffList, youngPeopleList] = await Promise.all([
      dal.keyWorkingSessions.findAll(),
      dal.riskAssessments.findAll(),
      dal.staff.findAll(),
      dal.youngPeople.findAll(),
    ]);
  const youngPeople = (youngPeopleList as any[]) ?? [];
  const riskAssessments = (riskAssessmentsList as any[]) ?? [];
  const keyWorkingSessions = (keyWorkingSessionsList as any[]) ?? [];

  const today = new Date().toISOString().slice(0, 10);

  const childPlans: ChildSafetyPlan[] = youngPeople
    .filter((yp: any) => yp.status !== "moved_on" && yp.status !== "discharged")
    .map((yp: any) => {
      const childRAs = riskAssessments.filter((r: any) => r.child_id === yp.id);
      const childKW = keyWorkingSessions
        .filter((k: any) => k.child_id === yp.id)
        .sort((a: any, b: any) => (b.date ?? "").localeCompare(a.date ?? ""));

      const riskDomains: ChildRiskDomain[] = childRAs.map((r: any) => {
        const reviewDate = r.review_date ?? null;
        const overdueReview =
          reviewDate && daysBetween(today, reviewDate) > 0 && new Date(reviewDate) < new Date(today);
        return {
          domain: r.domain ?? "Unknown",
          level: r.current_level ?? "unknown",
          trend: r.trend ?? "stable",
          reviewDate,
          overdueReview: !!overdueReview,
        };
      });

      const highRiskDomainCount = riskDomains.filter(
        (d) => d.level === "high" || d.level === "critical"
      ).length;
      const overdueReviewCount = riskDomains.filter((d) => d.overdueReview).length;

      const staffMember = (staffList as any[])?.find(
        (s: any) => s.id === yp.key_worker_id
      );
      const keyWorker = staffMember
        ? staffMember.full_name ?? `${staffMember.first_name} ${staffMember.last_name}`
        : null;

      const lastKeyWork = childKW[0]?.date ?? null;
      const lastRiskAssessment =
        childRAs.sort((a: any, b: any) => (b.assessed_date ?? "").localeCompare(a.assessed_date ?? ""))[0]
          ?.assessed_date ?? null;

      const risk = overallRisk(highRiskDomainCount, riskDomains);
      const signal: SignalColour =
        risk === "critical"
          ? "red"
          : risk === "high"
          ? "red"
          : risk === "medium" || overdueReviewCount > 0
          ? "amber"
          : "green";

      return {
        childId: yp.id,
        childInitials: initials(yp),
        keyWorker,
        riskDomains,
        highRiskDomainCount,
        overdueReviewCount,
        lastKeyWork,
        lastRiskAssessment,
        overallRisk: risk,
        overallSignal: signal,
      } satisfies ChildSafetyPlan;
    });

  const childrenWithHighRisk = childPlans.filter(
    (c) => c.overallRisk === "high" || c.overallRisk === "critical"
  ).length;
  const overdueRiskReviews = childPlans.reduce(
    (sum, c) => sum + c.overdueReviewCount,
    0
  );
  const thirtyDaysAgo = new Date(
    new Date().getTime() - 30 * 86_400_000
  ).toISOString().slice(0, 10);
  const childrenWithRecentKeyWork = childPlans.filter(
    (c) => c.lastKeyWork && c.lastKeyWork >= thirtyDaysAgo
  ).length;

  const insights: string[] = [];
  if (childrenWithHighRisk > 0) {
    insights.push(
      `${childrenWithHighRisk} child${childrenWithHighRisk > 1 ? "ren have" : " has"} one or more high or critical risk domains. Review risk management plans and ensure multi-agency strategy is current.`
    );
  }
  if (overdueRiskReviews > 0) {
    insights.push(
      `${overdueRiskReviews} risk assessment review${overdueRiskReviews > 1 ? "s are" : " is"} overdue. Outdated risk assessments may not reflect the child's current circumstances.`
    );
  }
  if (childrenWithRecentKeyWork < childPlans.length && childPlans.length > 0) {
    insights.push(
      `${childPlans.length - childrenWithRecentKeyWork} child${childPlans.length - childrenWithRecentKeyWork > 1 ? "ren have" : " has"} not had a key work session in the last 30 days. Regular key work is fundamental to the therapeutic relationship.`
    );
  }

  const overallSignal: SignalColour =
    childrenWithHighRisk >= 2 || overdueRiskReviews >= 3
      ? "red"
      : childrenWithHighRisk > 0 || overdueRiskReviews > 0
      ? "amber"
      : childPlans.length === 0
      ? "grey"
      : "green";

  const result: MySafetyPlanAnalysis = {
    totalChildren: childPlans.length,
    childrenWithHighRisk,
    overdueRiskReviews,
    childrenWithRecentKeyWork,
    childPlans: childPlans.sort(
      (a, b) => b.highRiskDomainCount - a.highRiskDomainCount
    ),
    insights,
    overallSignal,
    regulatoryNote:
      "CHR 2015 Reg 13 (risk assessments) and Reg 7 (key working). Risk assessments must be reviewed regularly and whenever a child's circumstances change. The child's views must be sought and recorded.",
  };

  return NextResponse.json({ data: result });
}
