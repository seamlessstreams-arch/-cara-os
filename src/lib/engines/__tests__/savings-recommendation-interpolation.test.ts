// ══════════════════════════════════════════════════════════════════════════════
// A `${...}` written inside a plain string literal is never interpolated.
//
// One of this engine's recommendations was authored with double quotes instead
// of backticks, so a manager in the 40–69% coverage band was told:
//
//   "Extend savings account coverage beyond ${savingsAccountCoverage}% — …"
//
// The characters, not the number. Nothing catches this: it type-checks, it
// lints clean, and the recommendation still renders — just with the source code
// showing through. Its siblings a few lines away use backticks and interpolate
// correctly, which is what makes it a slip rather than a style.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeSavingsBankingSkills,
  type SavingsBankingInput,
  type SavingsAccountRecordInput,
} from "../home-savings-banking-skills-intelligence-engine";

let _id = 0;
const uid = () => `sri_${++_id}`;

function account(childId: string): SavingsAccountRecordInput {
  return {
    id: uid(),
    child_id: childId,
    account_type: "savings",
    opened_date: "2026-01-01",
    child_is_named_holder: true,
    child_has_access: true,
    current_balance: 100,
    monthly_deposit_target: 20,
    deposits_made_this_quarter: 3,
    deposits_target_this_quarter: 3,
    interest_earned: 1,
    statements_reviewed_with_child: true,
    child_understands_account: true,
    staff_supported_opening: true,
    last_activity_date: "2026-05-01",
  } as SavingsAccountRecordInput;
}

function input(): SavingsBankingInput {
  return {
    today: "2026-05-29",
    total_children: 4,
    // 2 of 4 children hold an account → 50% coverage, inside the 40–69 band
    savings_account_records: [account("c1"), account("c2")],
    banking_skills_records: [],
    financial_goal_records: [],
    money_confidence_records: [],
    financial_independence_records: [],
  } as SavingsBankingInput;
}

describe("savings recommendations interpolate their numbers", () => {
  it("names the real coverage percentage, not the expression", () => {
    const result = computeSavingsBankingSkills(input());
    const texts = result.recommendations.map((r) => r.recommendation);
    const coverage = texts.find((t) => t.includes("Extend savings account coverage"));

    expect(coverage, "the 40-69% coverage recommendation should fire").toBeTruthy();
    expect(coverage).toContain("50%");
    expect(coverage).not.toContain("${");
  });

  it("leaves no unrendered expression in ANY recommendation", () => {
    const result = computeSavingsBankingSkills(input());
    const leaking = result.recommendations
      .map((r) => r.recommendation)
      .filter((t) => t.includes("${"));

    expect(leaking).toEqual([]);
  });
});
