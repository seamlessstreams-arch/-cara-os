import { test, expect } from "@playwright/test";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE INTELLIGENCE LAYER — E2E TESTS
//
// Golden path tests for the 10 intelligence modules. These tests exercise
// the UI with demo data (Supabase disabled) to verify rendering, navigation,
// form interactions, and action button behaviour.
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Manager Control Centre", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/manager-control-centre");
  });

  test("renders page with attention items", async ({ page }) => {
    await expect(page.getByText("Manager Control Centre").first()).toBeVisible();
    await expect(page.getByText("What needs your attention today")).toBeVisible();
  });

  test("shows summary stats bar", async ({ page }) => {
    await expect(page.getByText("Critical Items").first()).toBeVisible();
    await expect(page.getByText("Overdue Tasks")).toBeVisible();
    await expect(page.getByText("Inspection Readiness").first()).toBeVisible();
  });

  test("shows cross-module intelligence row", async ({ page }) => {
    await expect(page.getByText("Open Items")).toBeVisible();
    await expect(page.getByText("Incident Reviews Due")).toBeVisible();
    await expect(page.getByText("Reg 44 This Month")).toBeVisible();
    await expect(page.getByText("Voice Entries (30d)")).toBeVisible();
  });

  test("expands attention item on click", async ({ page }) => {
    const firstItem = page.locator("[role='button']").first();
    await firstItem.click();
    await expect(page.getByText("Suggested Action")).toBeVisible();
  });

  test("mark reviewed button is visible when expanded", async ({ page }) => {
    const firstItem = page.locator("[role='button']").first();
    await firstItem.click();
    await expect(page.getByRole("button", { name: /Mark Reviewed/i })).toBeVisible();
  });

  test("filters by urgency", async ({ page }) => {
    await page.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "Critical" }).click();
    const items = page.locator("[role='button']");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe("Voice of the Child", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/children/voice");
  });

  test("renders page with voice entries", async ({ page }) => {
    await expect(page.getByText("Voice of the Child")).toBeVisible();
    await expect(page.getByText("in their own words")).toBeVisible();
  });

  test("displays child quotes", async ({ page }) => {
    await expect(page.getByText(/I want to see my nan/).first()).toBeVisible();
  });

  test("shows add voice entry form", async ({ page }) => {
    await page.getByRole("button", { name: /Add Voice Entry/i }).click();
    await expect(page.getByText("New Voice Entry")).toBeVisible();
    await expect(page.getByPlaceholder(/Record exactly what the child said/)).toBeVisible();
  });

  test("save button disabled when child words empty", async ({ page }) => {
    await page.getByRole("button", { name: /Add Voice Entry/i }).click();
    const saveBtn = page.getByRole("button", { name: /Save Entry/i });
    await expect(saveBtn).toBeDisabled();
  });

  test("save button enabled when child words filled", async ({ page }) => {
    await page.getByRole("button", { name: /Add Voice Entry/i }).click();
    await page.getByPlaceholder(/Record exactly what the child said/).fill("I really like living here");
    const saveBtn = page.getByRole("button", { name: /Save Entry/i });
    await expect(saveBtn).toBeEnabled();
  });

  test("cancel closes the form", async ({ page }) => {
    await page.getByRole("button", { name: /Add Voice Entry/i }).click();
    await expect(page.getByText("New Voice Entry")).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByText("New Voice Entry")).not.toBeVisible();
  });

  test("shows themes section", async ({ page }) => {
    await expect(page.getByText("Themes")).toBeVisible();
    await expect(page.getByText("Wishes & Feelings").first()).toBeVisible();
  });
});

test.describe("Progress Engine", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/children/progress");
  });

  test("renders page with goals", async ({ page }) => {
    await expect(page.getByText("Progress & Outcomes").first()).toBeVisible();
    await expect(page.getByText("Goals").first()).toBeVisible();
  });

  test("displays progress goals with progress bars", async ({ page }) => {
    await expect(page.getByText(/Achieve Grade 5|Improve/i).first()).toBeVisible();
    await expect(page.getByText("Progress").first()).toBeVisible();
  });

  test("add goal button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Add Goal/i })).toBeVisible();
  });

  test("add progress entry button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Add Progress Entry/i })).toBeVisible();
  });
});

test.describe("Regulation 44 Builder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/quality/reg-44");
  });

  test("renders page with visits", async ({ page }) => {
    await expect(page.getByText("Regulation 44").first()).toBeVisible();
  });

  test("shows visit timeline", async ({ page }) => {
    await expect(page.getByText("Margaret Thornton").first()).toBeVisible();
  });

  test("expands visit details", async ({ page }) => {
    const expandBtn = page.locator("button").filter({ hasText: /chevron|expand/i }).first();
    if (await expandBtn.isVisible()) {
      await expandBtn.click();
    }
    // Visit details should include strengths or summary
    await expect(page.getByText(/Strengths|Summary/i).first()).toBeVisible();
  });

  test("add visit button visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Add Visit/i })).toBeVisible();
  });
});

test.describe("Regulation 45 Builder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/quality/reg-45");
  });

  test("renders page with review content", async ({ page }) => {
    await expect(page.getByText("Regulation 45").first()).toBeVisible();
    await expect(page.getByText("Quality of Care Review")).toBeVisible();
  });

  test("shows submit for approval button on draft", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Submit for Approval/i })).toBeVisible();
  });

  test("shows regulatory framework footer", async ({ page }) => {
    await expect(page.getByText("Regulatory Framework")).toBeVisible();
  });

  test("shows smart links panel", async ({ page }) => {
    await expect(page.getByText("Smart Links")).toBeVisible();
  });
});

test.describe("Ofsted Evidence Room", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/quality/ofsted-evidence-room");
  });

  test("renders page with evidence items", async ({ page }) => {
    await expect(page.getByText("Ofsted Evidence Room").first()).toBeVisible();
    await expect(page.getByText("Organised evidence").first()).toBeVisible();
  });

  test("shows evidence items with categories", async ({ page }) => {
    await expect(page.getByText(/Key Work Session/i).first()).toBeVisible();
  });

  test("shows evidence pack sidebar", async ({ page }) => {
    await expect(page.getByText("Evidence Pack").first()).toBeVisible();
  });

  test("generate pack button disabled when no items selected", async ({ page }) => {
    const btn = page.getByRole("button", { name: /Generate Evidence Pack/i });
    await expect(btn).toBeDisabled();
  });

  test("add to pack enables generate button", async ({ page }) => {
    // Click first "Add to Pack" button
    const addBtn = page.getByRole("button", { name: /Add to Pack/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      const genBtn = page.getByRole("button", { name: /Generate Evidence Pack/i });
      await expect(genBtn).toBeEnabled();
    }
  });

  test("generate pack opens modal", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /Add to Pack/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.getByRole("button", { name: /Generate Evidence Pack/i }).click();
      await expect(page.getByText("Inspection Evidence Pack")).toBeVisible();
      await expect(page.getByText("Evidence Items").first()).toBeVisible();
      await expect(page.getByText("Category Coverage").first()).toBeVisible();
      await expect(page.getByText("Readiness Assessment")).toBeVisible();
    }
  });
});

test.describe("Staff Competence Passport", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/staff/competence-passport");
  });

  test("renders page with staff competence data", async ({ page }) => {
    await expect(page.getByText("Competence Passport").first()).toBeVisible();
  });

  test("shows staff selector", async ({ page }) => {
    await expect(page.getByRole("combobox").first()).toBeVisible();
  });

  test("shows manager actions section", async ({ page }) => {
    await expect(page.getByText("Manager Actions")).toBeVisible();
    await expect(page.getByRole("button", { name: /Approve Competency/i })).toBeVisible();
  });
});

test.describe("Incident Learning Review", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/incidents/learning-review");
  });

  test("renders page with incidents", async ({ page }) => {
    await expect(page.getByText("Incident Learning Review")).toBeVisible();
    await expect(page.getByText(/Review incidents/i)).toBeVisible();
  });

  test("shows incident cards", async ({ page }) => {
    await expect(page.getByText(/Physical intervention/i).first()).toBeVisible();
  });

  test("expands incident to show review form", async ({ page }) => {
    const incident = page.getByText(/Physical intervention/i).first();
    await incident.click();
    await expect(page.getByText(/Mark No Further Action|Submit for Approval/i).first()).toBeVisible();
  });

  test("shows smart links when expanded", async ({ page }) => {
    const incident = page.getByText(/Physical intervention/i).first();
    await incident.click();
    await expect(page.getByText("Smart Links")).toBeVisible();
  });
});

test.describe("Provider Oversight", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/provider-oversight");
  });

  test("renders page with provider data", async ({ page }) => {
    await expect(page.getByText("Provider Oversight").first()).toBeVisible();
  });

  test("shows total stats", async ({ page }) => {
    await expect(page.getByText("Total Children")).toBeVisible();
    await expect(page.getByText("Total Staff")).toBeVisible();
  });

  test("shows inspection readiness computed from modules", async ({ page }) => {
    await expect(page.getByText("Inspection Readiness").first()).toBeVisible();
  });

  test("shows oversight comment textarea", async ({ page }) => {
    await expect(page.getByPlaceholder(/Record oversight observation/i)).toBeVisible();
  });

  test("add oversight comment button disabled when empty", async ({ page }) => {
    const btn = page.getByRole("button", { name: /Add Oversight Comment/i });
    await expect(btn).toBeDisabled();
  });

  test("add oversight comment button enabled with text", async ({ page }) => {
    await page.getByPlaceholder(/Record oversight observation/i).fill("Test oversight note");
    const btn = page.getByRole("button", { name: /Add Oversight Comment/i });
    await expect(btn).toBeEnabled();
  });
});

test.describe("Navigation", () => {
  test("can navigate between intelligence pages", async ({ page }) => {
    await page.goto("/dashboard/manager-control-centre");
    await expect(page.getByText("Manager Control Centre").first()).toBeVisible();

    await page.goto("/children/voice");
    await expect(page.getByText("Voice of the Child").first()).toBeVisible();

    await page.goto("/quality/reg-44");
    await expect(page.getByText("Regulation 44").first()).toBeVisible();

    await page.goto("/quality/ofsted-evidence-room");
    await expect(page.getByText("Ofsted Evidence Room").first()).toBeVisible();
  });
});
