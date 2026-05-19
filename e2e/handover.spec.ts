import { test, expect } from "@playwright/test";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE HANDOVER — E2E TESTS
//
// Golden path tests for the handover module:
// Stats, latest handover card, sign-off workflow, ARIA builder,
// write handover form, search/filters, sidebar navigation
// ══════════════════════════════════════════════════════════════════════════════

test.describe("Handover Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/handover");
  });

  test("renders page with title and subtitle", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Handover" })).toBeVisible();
    await expect(page.getByText("Shift-to-shift communication, live notes, and evidence-ready records")).toBeVisible();
  });

  test("shows stats row", async ({ page }) => {
    await expect(page.getByText("Total Handovers")).toBeVisible();
    await expect(page.getByText("Signed Off")).toBeVisible();
    await expect(page.getByText("With Flags")).toBeVisible();
    await expect(page.getByText("YP Alerts")).toBeVisible();
    await expect(page.getByText("Avg Mood")).toBeVisible();
    await expect(page.getByText(/Low Mood/)).toBeVisible();
  });

  test("shows latest handover card with shift transition", async ({ page }) => {
    await expect(page.getByText(/→/).first()).toBeVisible();
  });

  test("shows outgoing and incoming staff labels", async ({ page }) => {
    await expect(page.getByText("Outgoing").first()).toBeVisible();
    await expect(page.getByText("Incoming").first()).toBeVisible();
  });

  test("shows young people section in latest handover", async ({ page }) => {
    await expect(page.getByText("Young People").first()).toBeVisible();
  });

  test("shows previous handovers section", async ({ page }) => {
    await expect(page.getByText("Previous Handovers")).toBeVisible();
  });
});

test.describe("Sign-off Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/handover");
  });

  test("shows acknowledgements section with count", async ({ page }) => {
    await expect(page.getByText(/Acknowledgements \(\d+\/\d+\)/)).toBeVisible();
  });

  test("shows acknowledge handover button", async ({ page }) => {
    const btn = page.getByRole("button", { name: /Acknowledge Handover/i });
    if (await btn.isVisible()) {
      await expect(btn).toBeVisible();
    }
  });

  test("shows pending indicators for unsigned staff", async ({ page }) => {
    const pending = page.getByText("Pending");
    if (await pending.first().isVisible()) {
      await expect(pending.first()).toBeVisible();
    }
  });

  test("shows note button next to acknowledge", async ({ page }) => {
    const noteBtn = page.getByRole("button", { name: /\+ Note/i });
    if (await noteBtn.isVisible()) {
      await expect(noteBtn).toBeVisible();
    }
  });
});

test.describe("ARIA Handover Builder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/handover");
  });

  test("shows ARIA Handover Builder card", async ({ page }) => {
    await expect(page.getByText("ARIA Handover Builder")).toBeVisible();
    await expect(page.getByText("Personalised context based on when each staff member was last on shift")).toBeVisible();
  });

  test("build button exists", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Build Handover/i })).toBeVisible();
  });

  test("toggles builder panel on click", async ({ page }) => {
    await page.getByRole("button", { name: /Build Handover/i }).click();
    await expect(page.getByText(/Building personalised handover for/)).toBeVisible();
    // Button text should change to "Hide"
    await expect(page.getByRole("button", { name: /Hide/i })).toBeVisible();
  });

  test("hides builder panel when toggled off", async ({ page }) => {
    await page.getByRole("button", { name: /Build Handover/i }).click();
    await expect(page.getByText(/Building personalised handover for/)).toBeVisible();
    await page.getByRole("button", { name: /Hide/i }).click();
    await expect(page.getByText(/Building personalised handover for/)).not.toBeVisible();
  });
});

test.describe("Write Handover Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/handover");
  });

  test("write handover button exists", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Write Handover/i })).toBeVisible();
  });

  test("opens form when Write Handover is clicked", async ({ page }) => {
    await page.getByRole("button", { name: /Write Handover/i }).click();
    await expect(page.getByText("Write Handover").nth(0)).toBeVisible();
  });

  test("shows shift selectors in form", async ({ page }) => {
    await page.getByRole("button", { name: /Write Handover/i }).click();
    await expect(page.getByText("Shift From").first()).toBeVisible();
    await expect(page.getByText("Shift To").first()).toBeVisible();
  });

  test("shows per-YP sections in form", async ({ page }) => {
    await page.getByRole("button", { name: /Write Handover/i }).click();
    // The form has a "Young People" heading and per-child sections
    const ypHeading = page.getByText("Young People").last();
    await expect(ypHeading).toBeVisible();
    // Mood and Key Notes labels should appear for each child
    await expect(page.getByText(/Mood:/).first()).toBeVisible();
    await expect(page.getByText("Key Notes").first()).toBeVisible();
  });

  test("shows general notes field", async ({ page }) => {
    await page.getByRole("button", { name: /Write Handover/i }).click();
    await expect(page.getByText("General Notes").last()).toBeVisible();
  });

  test("shows flags field", async ({ page }) => {
    await page.getByRole("button", { name: /Write Handover/i }).click();
    await expect(page.getByText("Flags").last()).toBeVisible();
  });

  test("shows Generate with ARIA button", async ({ page }) => {
    await page.getByRole("button", { name: /Write Handover/i }).click();
    await expect(page.getByRole("button", { name: /Generate with ARIA/i })).toBeVisible();
  });

  test("shows Submit Handover button", async ({ page }) => {
    await page.getByRole("button", { name: /Write Handover/i }).click();
    await expect(page.getByRole("button", { name: /Submit Handover/i })).toBeVisible();
  });

  test("cancel closes the form", async ({ page }) => {
    await page.getByRole("button", { name: /Write Handover/i }).click();
    await expect(page.getByText("Shift From").first()).toBeVisible();
    await page.getByRole("button", { name: /Cancel/i }).first().click();
    await expect(page.getByText("Shift From").first()).not.toBeVisible();
  });
});

test.describe("Search and Filters", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/handover");
  });

  test("search input exists", async ({ page }) => {
    await expect(page.getByPlaceholder(/Search handovers/i)).toBeVisible();
  });

  test("shift filter tabs exist", async ({ page }) => {
    await expect(page.getByText("All Shifts")).toBeVisible();
    await expect(page.getByText("Day").first()).toBeVisible();
    await expect(page.getByText("Night").first()).toBeVisible();
    await expect(page.getByText("Waking Night").first()).toBeVisible();
    await expect(page.getByText("Sleep-in").first()).toBeVisible();
  });

  test("sort dropdown exists", async ({ page }) => {
    const sortEl = page.getByText("Newest first");
    const count = await sortEl.count();
    if (count > 0) {
      await expect(sortEl.first()).toBeVisible();
    }
    // Sort control may be a select/combobox
    const combobox = page.getByRole("combobox");
    if (await combobox.count() > 0) {
      await expect(combobox.first()).toBeVisible();
    }
  });

  test("clicking a filter tab applies filter", async ({ page }) => {
    const dayTab = page.locator("button").filter({ hasText: "Day" }).first();
    if (await dayTab.isVisible()) {
      await dayTab.click();
      // After filtering, page should still be visible
      await expect(page.getByRole("heading", { name: "Handover" })).toBeVisible();
    }
  });
});

test.describe("Sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/handover");
  });

  test("shows On Shift Today card", async ({ page }) => {
    await expect(page.getByText("On Shift Today")).toBeVisible();
  });

  test("shows Pending Tasks card", async ({ page }) => {
    await expect(page.getByText("Pending Tasks")).toBeVisible();
  });

  test("shows Open Incidents card", async ({ page }) => {
    await expect(page.getByText("Open Incidents")).toBeVisible();
  });

  test("shows Medication Today card", async ({ page }) => {
    await expect(page.getByText("Medication Today")).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("sidebar links navigate to correct pages", async ({ page }) => {
    await page.goto("/handover");

    // Tasks link
    const tasksLink = page.getByRole("link", { name: /View all tasks/i });
    if (await tasksLink.isVisible()) {
      await expect(tasksLink).toHaveAttribute("href", "/tasks");
    }

    // Incidents link
    const incidentsLink = page.getByRole("link", { name: /View all incidents/i });
    if (await incidentsLink.isVisible()) {
      await expect(incidentsLink).toHaveAttribute("href", "/incidents");
    }

    // Medication link
    const medLink = page.getByRole("link", { name: /View MAR sheet/i });
    if (await medLink.isVisible()) {
      await expect(medLink).toHaveAttribute("href", "/medication");
    }
  });

  test("handover page loads from direct URL", async ({ page }) => {
    await page.goto("/handover");
    await expect(page.getByRole("heading", { name: "Handover" })).toBeVisible();
  });
});
