// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SAVINGS & BANKING SKILLS INTELLIGENCE API ROUTE
// GET /api/v1/home-savings-banking-skills-intelligence
// Cross-domain composite: savingsAccountRecords + bankingSkillsRecords +
// financialGoalRecords + moneyConfidenceRecords + financialIndependenceRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeSavingsBankingSkills,
  type SavingsAccountRecordInput,
  type BankingSkillsRecordInput,
  type FinancialGoalRecordInput,
  type MoneyConfidenceRecordInput,
  type FinancialIndependenceRecordInput,
} from "@/lib/engines/home-savings-banking-skills-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawSavingsAccounts = (store.savingsAccountRecords ?? []) as any[];
    const savings_account_records: SavingsAccountRecordInput[] = rawSavingsAccounts.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      account_type: r.account_type ?? "savings",
      opened_date: (r.opened_date ?? today).toString(),
      child_is_named_holder: !!r.child_is_named_holder,
      child_has_access: !!r.child_has_access,
      current_balance: r.current_balance ?? 0,
      monthly_deposit_target: r.monthly_deposit_target ?? 0,
      deposits_made_this_quarter: r.deposits_made_this_quarter ?? 0,
      deposits_target_this_quarter: r.deposits_target_this_quarter ?? 0,
      interest_earned: r.interest_earned ?? 0,
      statements_reviewed_with_child: !!r.statements_reviewed_with_child,
      child_understands_account: !!r.child_understands_account,
      staff_supported_opening: !!r.staff_supported_opening,
      last_activity_date: (r.last_activity_date ?? today).toString(),
      dormant: !!r.dormant,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawBankingSkills = (store.bankingSkillsRecords ?? []) as any[];
    const banking_skills_records: BankingSkillsRecordInput[] = rawBankingSkills.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      skill_type: r.skill_type ?? "budgeting",
      taught: !!r.taught,
      demonstrated_competence: !!r.demonstrated_competence,
      age_appropriate: !!r.age_appropriate,
      staff_assessed: !!r.staff_assessed,
      child_confident: !!r.child_confident,
      practice_opportunity_given: !!r.practice_opportunity_given,
      linked_to_independence_plan: !!r.linked_to_independence_plan,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawFinancialGoals = (store.financialGoalRecords ?? []) as any[];
    const financial_goal_records: FinancialGoalRecordInput[] = rawFinancialGoals.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      goal_description: r.goal_description ?? "",
      target_amount: r.target_amount ?? 0,
      current_amount: r.current_amount ?? 0,
      start_date: (r.start_date ?? today).toString(),
      target_date: (r.target_date ?? today).toString(),
      status: r.status ?? "active",
      child_set_goal: !!r.child_set_goal,
      child_tracking_progress: !!r.child_tracking_progress,
      staff_supporting: !!r.staff_supporting,
      reviewed_in_keywork: !!r.reviewed_in_keywork,
      celebration_on_achievement: !!r.celebration_on_achievement,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawMoneyConfidence = (store.moneyConfidenceRecords ?? []) as any[];
    const money_confidence_records: MoneyConfidenceRecordInput[] = rawMoneyConfidence.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      assessment_type: r.assessment_type ?? "staff_observation",
      confidence_level: r.confidence_level ?? 3,
      understands_value_of_money: !!r.understands_value_of_money,
      can_make_purchases_independently: !!r.can_make_purchases_independently,
      can_budget_pocket_money: !!r.can_budget_pocket_money,
      can_compare_prices: !!r.can_compare_prices,
      can_identify_needs_vs_wants: !!r.can_identify_needs_vs_wants,
      anxiety_around_money: !!r.anxiety_around_money,
      previous_confidence_level: r.previous_confidence_level ?? 0,
      improvement_noted: !!r.improvement_noted,
      support_plan_in_place: !!r.support_plan_in_place,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawFinancialIndependence = (store.financialIndependenceRecords ?? []) as any[];
    const financial_independence_records: FinancialIndependenceRecordInput[] = rawFinancialIndependence.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      milestone_type: r.milestone_type ?? "first_purchase_alone",
      achieved: !!r.achieved,
      age_appropriate: !!r.age_appropriate,
      child_initiated: !!r.child_initiated,
      staff_supported: !!r.staff_supported,
      documented_in_pathway_plan: !!r.documented_in_pathway_plan,
      linked_to_leaving_care: !!r.linked_to_leaving_care,
      child_proud_of_achievement: !!r.child_proud_of_achievement,
      next_milestone_identified: !!r.next_milestone_identified,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeSavingsBankingSkills({
      today,
      total_children,
      savings_account_records,
      banking_skills_records,
      financial_goal_records,
      money_confidence_records,
      financial_independence_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
