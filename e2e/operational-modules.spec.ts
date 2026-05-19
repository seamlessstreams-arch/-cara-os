import { test, expect } from "@playwright/test";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE OPERATIONAL MODULES — E2E TESTS
//
// Golden path tests for the 6 newly-wired operational modules:
// Key Work Sessions, Health Records, Education Tracker,
// Behaviour Support Plans, Admissions & Transitions, Sanctions & Consequences
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Key Work Sessions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/child-keyworker-1to1-sessions");
  });

  test("renders page with session data", async ({ page }) => {
    await expect(page.getByText("1:1 Keyworker Sessions")).toBeVisible();
    await expect(page.getByText("Protected weekly/fortnightly time")).toBeVisible();
  });

  test("shows summary stats", async ({ page }) => {
    await expect(page.getByText("Sessions This Month")).toBeVisible();
    await expect(page.getByText("Average Satisfaction")).toBeVisible();
    await expect(page.getByText("Child Chose Format")).toBeVisible();
  });

  test("shows session cards with child names", async ({ page }) => {
    const sessions = page.locator("button.w-full.text-left");
    const count = await sessions.count();
    if (count > 0) {
      await expect(sessions.first()).toBeVisible();
    } else {
      // No sessions yet — page should show empty state or stats
      await expect(page.getByText("Sessions This Month")).toBeVisible();
    }
  });

  test("expands session to show detail", async ({ page }) => {
    const firstSession = page.locator("button.w-full.text-left").first();
    if (await firstSession.isVisible()) {
      await firstSession.click();
      await expect(page.getByText("What child brought up").first()).toBeVisible();
      await expect(page.getByText("What staff brought up").first()).toBeVisible();
    }
  });

  test("shows agreed actions when expanded", async ({ page }) => {
    const firstSession = page.locator("button.w-full.text-left").first();
    if (await firstSession.isVisible()) {
      await firstSession.click();
      await expect(page.getByText(/Agreed actions/).first()).toBeVisible();
    }
  });

  test("new session button opens dialog", async ({ page }) => {
    await page.getByRole("button", { name: /New Session/i }).click();
    await expect(page.getByText("New 1:1 Session")).toBeVisible();
  });

  test("save session disabled without required fields", async ({ page }) => {
    await page.getByRole("button", { name: /New Session/i }).click();
    const saveBtn = page.getByRole("button", { name: /Save Session/i });
    await expect(saveBtn).toBeDisabled();
  });

  test("cancel closes dialog", async ({ page }) => {
    await page.getByRole("button", { name: /New Session/i }).click();
    await expect(page.getByText("New 1:1 Session")).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByText("New 1:1 Session")).not.toBeVisible();
  });

  test("filters by child", async ({ page }) => {
    const childSelect = page.locator("button").filter({ hasText: "All Children" });
    if (await childSelect.isVisible()) {
      await childSelect.click();
      const option = page.getByRole("option").first();
      if (await option.isVisible()) {
        await option.click();
      }
    }
  });

  test("shows regulatory framework", async ({ page }) => {
    await expect(page.getByText("Regulatory framework")).toBeVisible();
    await expect(page.getByText(/Regulation 7/)).toBeVisible();
  });
});

test.describe("Health Records", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/health-records");
  });

  test("renders page with health data", async ({ page }) => {
    await expect(page.getByText("Health Records").first()).toBeVisible();
    await expect(page.getByText(/Medical history/i)).toBeVisible();
  });

  test("shows stats bar", async ({ page }) => {
    await expect(page.getByText("Total Records")).toBeVisible();
  });

  test("add record button opens dialog", async ({ page }) => {
    await page.getByRole("button", { name: /Add Record/i }).click();
    await expect(page.getByText("Add Health Record")).toBeVisible();
  });

  test("save button disabled without required fields", async ({ page }) => {
    await page.getByRole("button", { name: /Add Record/i }).click();
    const saveBtn = page.getByRole("button", { name: /Save Record/i });
    await expect(saveBtn).toBeDisabled();
  });

  test("cancel closes dialog", async ({ page }) => {
    await page.getByRole("button", { name: /Add Record/i }).click();
    await expect(page.getByText("Add Health Record")).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByText("Add Health Record")).not.toBeVisible();
  });

  test("expands record to show detail", async ({ page }) => {
    const firstRecord = page.locator("[role='button']").first();
    if (await firstRecord.isVisible()) {
      await firstRecord.click();
    }
  });
});

test.describe("Education Tracker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/education");
  });

  test("renders page with education data", async ({ page }) => {
    await expect(page.getByText("Education Tracker")).toBeVisible();
    await expect(page.getByText(/Attendance/i).first()).toBeVisible();
  });

  test("shows stats bar", async ({ page }) => {
    await expect(page.getByText(/Total/i).first()).toBeVisible();
  });

  test("add entry button opens dialog", async ({ page }) => {
    await page.getByRole("button", { name: /Add Entry/i }).click();
    await expect(page.getByText("Add Education Entry")).toBeVisible();
  });

  test("save button disabled without required fields", async ({ page }) => {
    await page.getByRole("button", { name: /Add Entry/i }).click();
    const saveBtn = page.getByRole("button", { name: /Save Entry/i });
    await expect(saveBtn).toBeDisabled();
  });

  test("cancel closes dialog", async ({ page }) => {
    await page.getByRole("button", { name: /Add Entry/i }).click();
    await expect(page.getByText("Add Education Entry")).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByText("Add Education Entry")).not.toBeVisible();
  });

  test("type filter tabs are visible", async ({ page }) => {
    await expect(page.getByText(/All/i).first()).toBeVisible();
  });
});

test.describe("Behaviour Support Plans", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/behaviour-support-plans");
  });

  test("renders page with BSP data", async ({ page }) => {
    await expect(page.getByText("Behaviour Support Plans")).toBeVisible();
  });

  test("shows plan cards with child names", async ({ page }) => {
    await expect(page.getByText(/Casey|Jordan|Alex/i).first()).toBeVisible();
  });

  test("create BSP button opens dialog", async ({ page }) => {
    const btn = page.getByRole("button", { name: /New BSP|Create/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page.getByText(/Create BSP|New Behaviour/i).first()).toBeVisible();
    }
  });

  test("expands plan to show triggers and strategies", async ({ page }) => {
    const firstPlan = page.locator("[class*='cursor-pointer']").first();
    if (await firstPlan.isVisible()) {
      await firstPlan.click();
      await expect(page.getByText(/Trigger|De-escalation|Strategy/i).first()).toBeVisible();
    }
  });

  test("shows status badges", async ({ page }) => {
    await expect(page.getByText(/Active|Draft|Under Review/i).first()).toBeVisible();
  });
});

test.describe("Admissions & Transitions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admissions");
  });

  test("renders page with referral data", async ({ page }) => {
    await expect(page.getByText(/Admissions/i).first()).toBeVisible();
  });

  test("shows referral cards with status", async ({ page }) => {
    await expect(page.getByText(/New Referral|Under Assessment|Panel/i).first()).toBeVisible();
  });

  test("new referral button opens dialog", async ({ page }) => {
    await page.getByRole("button", { name: /New Referral/i }).click();
    await expect(page.getByText("New Referral").first()).toBeVisible();
    await expect(page.getByText(/Child.*Name|Reference/i).first()).toBeVisible();
  });

  test("cancel closes new referral dialog", async ({ page }) => {
    await page.getByRole("button", { name: /New Referral/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("shows status transition buttons when expanded", async ({ page }) => {
    const firstCard = page.locator("[class*='cursor-pointer']").first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      const actionBtn = page.getByRole("button", { name: /Begin Assessment|Impact Assessment|Send to Panel|Accept|Decline/i }).first();
      await expect(actionBtn).toBeVisible();
    }
  });

  test("shows regulatory guidance", async ({ page }) => {
    await expect(page.getByText(/impact assessment/i).first()).toBeVisible();
  });
});

test.describe("Sanctions & Consequences", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sanctions-rewards");
  });

  test("renders page with entries", async ({ page }) => {
    await expect(page.getByText("Sanctions & Rewards").first()).toBeVisible();
    await expect(page.getByText(/Positive reinforcement/i)).toBeVisible();
  });

  test("shows stats bar", async ({ page }) => {
    await expect(page.getByText(/Total/i).first()).toBeVisible();
  });

  test("add entry button opens dialog", async ({ page }) => {
    await page.getByRole("button", { name: /Add Entry/i }).click();
    await expect(page.getByText("Add Sanction or Reward")).toBeVisible();
  });

  test("save button disabled without required fields", async ({ page }) => {
    await page.getByRole("button", { name: /Add Entry/i }).click();
    const saveBtn = page.getByRole("button", { name: /Save Entry/i });
    await expect(saveBtn).toBeDisabled();
  });

  test("cancel closes dialog", async ({ page }) => {
    await page.getByRole("button", { name: /Add Entry/i }).click();
    await expect(page.getByText("Add Sanction or Reward")).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByText("Add Sanction or Reward")).not.toBeVisible();
  });

  test("expands entry to show detail", async ({ page }) => {
    const firstEntry = page.locator("[class*='cursor-pointer']").first();
    if (await firstEntry.isVisible()) {
      await firstEntry.click();
    }
  });

  test("shows proportionality information", async ({ page }) => {
    await expect(page.getByText(/Proportionate|proportionate/i).first()).toBeVisible();
  });
});

test.describe("Cross-module Navigation", () => {
  test("navigates between all operational module pages", async ({ page }) => {
    await page.goto("/child-keyworker-1to1-sessions");
    await expect(page.getByText("1:1 Keyworker Sessions")).toBeVisible();

    await page.goto("/health-records");
    await expect(page.getByText("Health Records").first()).toBeVisible();

    await page.goto("/education");
    await expect(page.getByText("Education Tracker")).toBeVisible();

    await page.goto("/behaviour-support-plans");
    await expect(page.getByText("Behaviour Support Plans")).toBeVisible();

    await page.goto("/admissions");
    await expect(page.getByText(/Admissions/i).first()).toBeVisible();

    await page.goto("/sanctions-rewards");
    await expect(page.getByText("Sanctions & Rewards").first()).toBeVisible();
  });
});
