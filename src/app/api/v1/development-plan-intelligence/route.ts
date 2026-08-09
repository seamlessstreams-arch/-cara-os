import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Signal = "green" | "amber" | "red" | "grey";

export type DevPlanAction = {
  title: string;
  domain: string;
  targetDate: string | null;
  completed: boolean;
  overdue: boolean;
};

export type DevPlanStaffProfile = {
  staffId: string;
  staffName: string;
  planTitle: string;
  fromStage: string;
  toStage: string;
  status: string;
  totalActions: number;
  completedActions: number;
  overdueActions: number;
  completionRate: number | null;
  recentActions: DevPlanAction[];
  caraGenerated: boolean;
  signal: Signal;
};

export type DevelopmentPlanIntelligenceData = {
  totalPlans: number;
  activePlans: number;
  staffWithPlan: number;
  staffWithoutPlan: number;
  totalActions: number;
  completedActions: number;
  overdueActions: number;
  overallCompletionRate: number | null;
  staffProfiles: DevPlanStaffProfile[];
  insights: string[];
  overallSignal: Signal;
  regulatoryNote: string;
};

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

const STAGE_LABELS: Record<string, string> = {
  rsw:             "RSW",
  senior_rsw:      "Senior RSW",
  deputy_manager:  "Deputy Manager",
  registered_manager: "Registered Manager",
  team_leader:     "Team Leader",
};

export async function GET() {
  const [developmentPlansList, staffList] = await Promise.all([
      dal.developmentPlans.findAll(),
      dal.staff.findAll(),
    ]);
  const today = todayStr();

  const staffMap = new Map<string, string>(
    staffList.map((s) => [s.id, `${s.first_name} ${s.last_name}`.trim()])
  );

  const staffWithPlanIds = new Set<string>();
  let totalActions = 0;
  let completedActions = 0;
  let overdueActions = 0;

  const staffProfiles: DevPlanStaffProfile[] = [];

  const activePlans = developmentPlansList.filter(
    (p) => p.status === "active" || p.status === "draft"
  );

  for (const plan of activePlans) {
    const staffName = staffMap.get(plan.staff_id) ?? plan.staff_id;
    staffWithPlanIds.add(plan.staff_id);

    const actions = plan.actions ?? [];
    const planCompleted = actions.filter((a) => a.completed).length;
    const planOverdue = actions.filter(
      (a) => !a.completed && a.target_date && daysBetween(today, a.target_date) < 0
    ).length;

    totalActions += actions.length;
    completedActions += planCompleted;
    overdueActions += planOverdue;

    const completionRate = actions.length > 0
      ? Math.round((planCompleted / actions.length) * 100)
      : null;

    const recentActions: DevPlanAction[] = actions.slice(0, 4).map((a) => ({
      title: a.title,
      domain: a.domain ?? "",
      targetDate: a.target_date ?? null,
      completed: a.completed,
      overdue: !a.completed && !!a.target_date && daysBetween(today, a.target_date) < 0,
    }));

    let signal: Signal;
    if (planOverdue > 0) signal = "red";
    else if (completionRate !== null && completionRate < 50) signal = "amber";
    else if (plan.status === "draft") signal = "amber";
    else signal = "green";

    staffProfiles.push({
      staffId: plan.staff_id,
      staffName,
      planTitle: plan.title,
      fromStage: STAGE_LABELS[plan.from_stage] ?? plan.from_stage,
      toStage: STAGE_LABELS[plan.to_stage] ?? plan.to_stage,
      status: plan.status,
      totalActions: actions.length,
      completedActions: planCompleted,
      overdueActions: planOverdue,
      completionRate,
      recentActions,
      caraGenerated: plan.cara_generated ?? false,
      signal,
    });
  }

  const staffWithoutPlan = staffMap.size - staffWithPlanIds.size;
  const overallCompletionRate = totalActions > 0
    ? Math.round((completedActions / totalActions) * 100)
    : null;

  const insights: string[] = [];

  if (overdueActions > 0) {
    insights.push(
      `${overdueActions} development plan action${overdueActions === 1 ? " is" : "s are"} past their target date. Review progress with each staff member in their next supervision session.`
    );
  }
  if (staffWithoutPlan > 0) {
    insights.push(
      `${staffWithoutPlan} staff member${staffWithoutPlan === 1 ? " does" : "s do"} not have an active development plan. All staff should have clear development goals aligned to their pathway stage and career aspirations.`
    );
  }
  if (overallCompletionRate !== null && overallCompletionRate >= 80) {
    insights.push(
      `${overallCompletionRate}% development plan actions are completed — strong progress. Ensure upcoming actions are scheduled before the next review cycle.`
    );
  }
  const draftProfiles = staffProfiles.filter((p) => p.status === "draft");
  if (draftProfiles.length > 0) {
    insights.push(
      `${draftProfiles.map((p) => p.staffName).join(", ")} ${draftProfiles.length === 1 ? "has" : "have"} a development plan in draft — these need to be agreed with the staff member and made active.`
    );
  }

  let overallSignal: Signal;
  if (staffProfiles.some((p) => p.signal === "red")) overallSignal = "red";
  else if (staffProfiles.some((p) => p.signal === "amber") || staffWithoutPlan > 0) overallSignal = "amber";
  else if (staffProfiles.length === 0) overallSignal = "grey";
  else overallSignal = "green";

  const data: DevelopmentPlanIntelligenceData = {
    totalPlans: developmentPlansList.length,
    activePlans: activePlans.length,
    staffWithPlan: staffWithPlanIds.size,
    staffWithoutPlan,
    totalActions,
    completedActions,
    overdueActions,
    overallCompletionRate,
    staffProfiles,
    insights,
    overallSignal,
    regulatoryNote:
      "Workforce development is a requirement under Children's Homes Regulations 2015 Reg 32 and the Quality Standards. Development plans should be linked to the individual's qualifications pathway, supervision outcomes, and practice observations. Ofsted inspect staff development as part of the 'How well is the home led and managed?' quality standard.",
  };

  return NextResponse.json({ data });
}
