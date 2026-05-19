import { test, expect } from "@playwright/test";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE COMPLIANCE WORKFLOW — E2E TESTS
//
// Golden path tests for the core compliance modules:
// Regulation 44 Independent Visits, Management Oversight Queue,
// Regulation 40 Triage, Regulation 45 Evidence Bank,
// Annex A Readiness, Filing Cabinet, Audit Trail,
// and Settings / Branding.
// ══════════════════════════════════════════════════════════════════════════════

// ── Regulation 44 ─────────────────────────────────────────────────────────────

test.describe("Regulation 44 Independent Visits", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/regulation-44");
  });

  test("renders page with title and subtitle", async ({ page }) => {
    await expect(page.getByText("Regulation 44 Visits")).toBeVisible();
    await expect(page.getByText("Independent visitor reports — Oak House")).toBeVisible();
  });

  test("shows summary stats strip", async ({ page }) => {
    await expect(page.getByText("Total visits")).toBeVisible();
    await expect(page.getByText(/Last visit|Visit overdue/)).toBeVisible();
    await expect(page.getByText("Outstanding")).toBeVisible();
    await expect(page.getByText("Completed")).toBeVisible();
  });

  test("shows regulatory context section", async ({ page }) => {
    await expect(page.getByText("Regulation 44 (Children's Homes Regulations 2015)")).toBeVisible();
  });

  test("shows links to Annex A and Regulation 45", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Annex A readiness/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Regulation 45 reports/i })).toBeVisible();
  });

  test("record visit button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Record Visit/i })).toBeVisible();
  });

  test("record visit button opens create modal", async ({ page }) => {
    await page.getByRole("button", { name: /Record Visit/i }).click();
    await expect(page.getByRole("heading", { name: "New Regulation 44 Visit" })).toBeVisible();
  });

  test("create modal has visit date field", async ({ page }) => {
    await page.getByRole("button", { name: /Record Visit/i }).click();
    await expect(page.getByText("Visit date *")).toBeVisible();
  });

  test("create modal has visitor name field", async ({ page }) => {
    await page.getByRole("button", { name: /Record Visit/i }).click();
    await expect(page.getByText("Visitor name *")).toBeVisible();
  });

  test("create modal has overall judgement selector", async ({ page }) => {
    await page.getByRole("button", { name: /Record Visit/i }).click();
    await expect(page.getByText("Overall judgement").first()).toBeVisible();
  });

  test("create modal has strengths field", async ({ page }) => {
    await page.getByRole("button", { name: /Record Visit/i }).click();
    await expect(page.getByText("Strengths (one per line)")).toBeVisible();
  });

  test("create modal cancel button closes modal", async ({ page }) => {
    await page.getByRole("button", { name: /Record Visit/i }).click();
    await expect(page.getByRole("heading", { name: "New Regulation 44 Visit" })).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByRole("button", { name: /Record Visit/i })).toBeVisible();
  });

  test("shows visit cards when visits exist or empty state", async ({ page }) => {
    const emptyState = page.getByText("No Regulation 44 visits recorded yet");
    const visitCard  = page.locator(".rounded-2xl.border").first();
    const hasEmpty   = await emptyState.isVisible();
    const hasCard    = await visitCard.isVisible();
    expect(hasEmpty || hasCard).toBe(true);
  });
});

// ── Management Oversight Queue ─────────────────────────────────────────────────

test.describe("Management Oversight Queue", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/management-oversight");
  });

  test("renders page with title", async ({ page }) => {
    await expect(page.getByText("Management Oversight Queue")).toBeVisible();
  });

  test("renders subtitle", async ({ page }) => {
    await expect(
      page.getByText("Care events and tasks requiring manager review, verification or sign-off")
    ).toBeVisible();
  });

  test("shows stats bar with Total label", async ({ page }) => {
    await expect(page.getByText("Total")).toBeVisible();
  });

  test("shows care events awaiting review section", async ({ page }) => {
    await expect(page.getByText("Care Events Awaiting Review")).toBeVisible();
  });

  test("shows care events awaiting review panel", async ({ page }) => {
    await expect(page.getByText("Care Events Awaiting Review")).toBeVisible();
  });

  test("filter tabs are visible", async ({ page }) => {
    // Tab filters (all, pending, etc.) exist as clickable elements
    const tabs = page.locator("button").filter({ hasText: /All|Pending|Overdue/i });
    await expect(tabs.first()).toBeVisible();
  });
});

// ── Regulation 40 Triage Queue ─────────────────────────────────────────────────

test.describe("Regulation 40 Triage Queue", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/regulation-40");
  });

  test("renders page with title", async ({ page }) => {
    await expect(page.getByText("Regulation 40 Triage Queue")).toBeVisible();
  });

  test("renders subtitle", async ({ page }) => {
    await expect(
      page.getByText(
        "Events requiring triage to determine if an Ofsted notifiable event notification is required"
      )
    ).toBeVisible();
  });

  test("shows awaiting triage stat", async ({ page }) => {
    await expect(page.getByText("Awaiting Triage").first()).toBeVisible();
  });

  test("shows triaged filter option", async ({ page }) => {
    await expect(page.getByText("Triaged")).toBeVisible();
  });

  test("shows related care events panel", async ({ page }) => {
    await expect(page.getByText("Related Care Events")).toBeVisible();
  });
});

// ── Regulation 45 Evidence Bank ────────────────────────────────────────────────

test.describe("Regulation 45 Evidence Bank", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/regulation-45");
  });

  test("renders page with title", async ({ page }) => {
    await expect(page.getByText("Regulation 45 Evidence Bank")).toBeVisible();
  });

  test("renders subtitle", async ({ page }) => {
    await expect(
      page.getByText("AI-suggested evidence from Care Events — review, approve and draft your report")
    ).toBeVisible();
  });

  test("shows pending tab", async ({ page }) => {
    await expect(page.getByText("Pending").first()).toBeVisible();
  });

  test("shows approved tab", async ({ page }) => {
    await expect(page.getByText("Approved").first()).toBeVisible();
  });

  test("shows care events panel", async ({ page }) => {
    await expect(page.getByText("Related Care Events")).toBeVisible();
  });
});

// ── Annex A Readiness Dashboard ────────────────────────────────────────────────

test.describe("Annex A Readiness Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/annex-a");
  });

  test("renders page with title", async ({ page }) => {
    await expect(page.getByText("Annex A").first()).toBeVisible();
  });

  test("shows export readiness indicator", async ({ page }) => {
    await expect(
      page.getByText(/Export Readiness|Ready|Partial|Not Ready/i).first()
    ).toBeVisible();
  });

  test("shows children section", async ({ page }) => {
    await expect(page.getByText(/Children|Young People/i).first()).toBeVisible();
  });

  test("shows incidents section", async ({ page }) => {
    await expect(page.getByText(/Incidents/i).first()).toBeVisible();
  });

  test("shows staff section", async ({ page }) => {
    await expect(page.getByText(/Staff/i).first()).toBeVisible();
  });
});

// ── Filing Cabinet ──────────────────────────────────────────────────────────────

test.describe("Filing Cabinet", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/filing-cabinet");
  });

  test("renders page with title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Filing Cabinet" })).toBeVisible();
  });

  test("renders subtitle", async ({ page }) => {
    await expect(
      page.getByText("Auto-filed records from Care Events — searchable archive with source links")
    ).toBeVisible();
  });

  test("shows Total Filed stat", async ({ page }) => {
    await expect(page.getByText("Total Filed")).toBeVisible();
  });

  test("shows Verified stat", async ({ page }) => {
    await expect(page.getByText("Verified").first()).toBeVisible();
  });

  test("shows Unverified stat", async ({ page }) => {
    await expect(page.getByText("Unverified")).toBeVisible();
  });

  test("shows Categories stat", async ({ page }) => {
    await expect(page.getByText("Categories")).toBeVisible();
  });

  test("search input is visible", async ({ page }) => {
    await expect(page.getByPlaceholder("Search filed records...")).toBeVisible();
  });

  test("search button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^Search$/i })).toBeVisible();
  });

  test("related care events panel is visible", async ({ page }) => {
    await expect(page.getByText("Related Care Events")).toBeVisible();
  });
});

// ── Audit Trail ──────────────────────────────────────────────────────────────────

test.describe("Audit Trail", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/audit-trail");
  });

  test("renders page with title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Audit Trail" })).toBeVisible();
  });

  test("renders subtitle", async ({ page }) => {
    await expect(
      page.getByText(
        "Tamper-evident log of all Care Event actions — complete chronological record"
      )
    ).toBeVisible();
  });

  test("shows Total Entries stat", async ({ page }) => {
    await expect(page.getByText("Total Entries")).toBeVisible();
  });

  test("shows Care Events stat", async ({ page }) => {
    await expect(page.getByText("Care Events").first()).toBeVisible();
  });

  test("shows Actors stat", async ({ page }) => {
    await expect(page.getByText("Actors")).toBeVisible();
  });

  test("shows Errors/Failures stat", async ({ page }) => {
    await expect(page.getByText("Errors/Failures")).toBeVisible();
  });

  test("action filter buttons are visible", async ({ page }) => {
    // Filter group buttons include an 'All' option
    const allBtn = page.getByRole("button", { name: /^All$/i });
    await expect(allBtn).toBeVisible();
  });

  test("shows empty state or entries list", async ({ page }) => {
    const empty = page.getByText("No audit entries yet.");
    const list  = page.locator(".border-slate-200").first();
    const hasEmpty = await empty.isVisible();
    const hasList  = await list.isVisible();
    expect(hasEmpty || hasList).toBe(true);
  });

  test("related care events panel is visible", async ({ page }) => {
    await expect(page.getByText("Related Care Events")).toBeVisible();
  });
});

// ── Settings / Branding ──────────────────────────────────────────────────────────

test.describe("Settings — Branding", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
  });

  test("renders settings page", async ({ page }) => {
    await expect(page.getByText("Settings").first()).toBeVisible();
  });

  test("branding tab is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Branding/i })).toBeVisible();
  });

  test("clicking branding tab shows organisation branding section", async ({ page }) => {
    await page.getByRole("button", { name: /Branding/i }).click();
    await expect(page.getByText("Organisation Branding").first()).toBeVisible({ timeout: 10000 });
  });

  test("organisation branding has company name field", async ({ page }) => {
    await page.getByRole("button", { name: /Branding/i }).click();
    await page.waitForSelector("text=Organisation Branding");
    await expect(page.getByText("Company name (legal)")).toBeVisible();
  });

  test("organisation branding has responsible individual field", async ({ page }) => {
    await page.getByRole("button", { name: /Branding/i }).click();
    await page.waitForSelector("text=Organisation Branding");
    await expect(page.getByText("Responsible Individual name").first()).toBeVisible();
  });

  test("home details section is visible on branding tab", async ({ page }) => {
    await page.getByRole("button", { name: /Branding/i }).click();
    await page.waitForSelector("text=Organisation Branding");
    await expect(page.getByText("Home Details").first()).toBeVisible();
  });

  test("home details has ofsted urn field", async ({ page }) => {
    await page.getByRole("button", { name: /Branding/i }).click();
    await page.waitForSelector("text=Organisation Branding");
    await expect(page.getByText("Ofsted URN").first()).toBeVisible();
  });

  test("home details has safeguarding contact field", async ({ page }) => {
    await page.getByRole("button", { name: /Branding/i }).click();
    await page.waitForSelector("text=Organisation Branding");
    await expect(page.getByText("Safeguarding contact").first()).toBeVisible();
  });

  test("save organisation branding button is visible", async ({ page }) => {
    await page.getByRole("button", { name: /Branding/i }).click();
    await page.waitForSelector("text=Organisation Branding");
    await expect(
      page.getByRole("button", { name: /Save Organisation Branding/i })
    ).toBeVisible();
  });

  test("save home branding button is visible", async ({ page }) => {
    await page.getByRole("button", { name: /Branding/i }).click();
    await page.waitForSelector("text=Organisation Branding");
    await expect(
      page.getByRole("button", { name: /Save Home/i })
    ).toBeVisible();
  });

  test("regulatory warning about missing fields is shown", async ({ page }) => {
    await page.getByRole("button", { name: /Branding/i }).click();
    await page.waitForSelector("text=Organisation Branding");
    await expect(
      page.getByText(/required for Regulation/i)
    ).toBeVisible();
  });
});

// ── Saved Time Dashboard ──────────────────────────────────────────────────────────

test.describe("Saved Time Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/saved-time");
  });

  test("renders page with title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Saved-Time Dashboard" })).toBeVisible();
  });

  test("shows total saved stat", async ({ page }) => {
    await expect(page.getByText("Total Saved")).toBeVisible();
  });

  test("shows routing events stat", async ({ page }) => {
    await expect(page.getByText("Routing Events")).toBeVisible();
  });
});

// ── Care Event Detail Page ─────────────────────────────────────────────────────

test.describe("Care Events List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/care-events");
  });

  test("renders page with title", async ({ page }) => {
    await expect(page.getByText("Care Events").first()).toBeVisible();
  });

  test("new event button is visible", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /New event/i })
    ).toBeVisible();
  });

  test("new event button opens dialog", async ({ page }) => {
    await page.getByRole("button", { name: /New event/i }).click();
    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText("New Care Event")).toBeVisible();
  });

  test("create dialog has title field", async ({ page }) => {
    await page.getByRole("button", { name: /New event/i }).click();
    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText("Title *")).toBeVisible();
  });

  test("create dialog has full account field", async ({ page }) => {
    await page.getByRole("button", { name: /New event/i }).click();
    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText("Full account *")).toBeVisible();
  });

  test("preview routing button disabled without required fields", async ({ page }) => {
    await page.getByRole("button", { name: /New event/i }).click();
    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    const previewBtn = dialog.getByRole("button", { name: /Preview routing/i });
    await expect(previewBtn).toBeDisabled();
  });

  test("preview routing button enabled when title and content filled", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /New event/i }).click();
    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await dialog.locator("input[placeholder='Brief summary']").fill("Test care event title");
    await dialog.locator("textarea").first().fill("Test care event content description");
    const previewBtn = dialog.getByRole("button", { name: /Preview routing/i });
    await expect(previewBtn).toBeEnabled();
  });

  test("shows status filters", async ({ page }) => {
    await expect(page.getByText(/All|Draft|Submitted|Routed/i).first()).toBeVisible();
  });
});
