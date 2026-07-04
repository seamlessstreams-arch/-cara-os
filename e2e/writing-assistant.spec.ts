import { test, expect } from "@playwright/test";

// ══════════════════════════════════════════════════════════════════════════════
// CARA WRITING ASSISTANT — E2E (deterministic five-mode rewrite)
//
// Drives the real toolbar on the Recording Assistant page, which mounts an
// always-visible textarea + the five-mode EntryAssist. Proves the inline
// interactions end-to-end with NO AI key required (rules-first, deterministic):
//   • the Rewrite menu opens with all five modes
//   • a rewrite mode previews -> Apply updates the field / Discard leaves it
//   • Check Tone is analysis only (a report, never edits the field)
//   • the "No AI used" badge confirms the deterministic path
// ══════════════════════════════════════════════════════════════════════════════

const NOTE = "the child didnt want to talk and was gonna leave the room";

const textarea = (page: import("@playwright/test").Page) =>
  page.getByPlaceholder(/Write \(or dictate\)/i);
const rewriteBtn = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: "Rewrite", exact: true });
const previewDialog = (page: import("@playwright/test").Page) =>
  page.getByRole("dialog", { name: /preview/i });

test.describe("Cara Writing Assistant — deterministic rewrite (no AI)", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/cara/recording-assistant");
    // First navigation against a fresh dev server can hit a transient chunk-load
    // mismatch (global-error.tsx's "Updating Cara…" auto-recovery boundary),
    // which self-heals via a page reload — give it room to compile and recover
    // rather than the default 5s assertion timeout.
    await expect(textarea(page)).toBeVisible({ timeout: 30_000 });
  });

  test("the Rewrite menu opens with all five modes", async ({ page }) => {
    await textarea(page).fill(NOTE);
    await rewriteBtn(page).click();
    for (const mode of [
      "Improve writing",
      "Make professional",
      "Simplify language",
      "Write to the child",
      "Check tone",
    ]) {
      await expect(page.getByRole("menuitem", { name: mode })).toBeVisible();
    }
  });

  test("Improve writing previews a deterministic rewrite, then Apply updates the field", async ({ page }) => {
    const ta = textarea(page);
    await ta.fill(NOTE);
    await rewriteBtn(page).click();
    await page.getByRole("menuitem", { name: "Improve writing" }).click();

    const dialog = previewDialog(page);
    await expect(dialog).toBeVisible();
    await expect(page.getByText("No AI used")).toBeVisible(); // deterministic
    await expect(dialog).toContainText("didn't"); // the spelling/apostrophe fix

    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(ta).toHaveValue(/didn't/);
    await expect(ta).toHaveValue(/going to/);
  });

  test("Discard leaves the original text untouched", async ({ page }) => {
    const ta = textarea(page);
    await ta.fill(NOTE);
    await rewriteBtn(page).click();
    await page.getByRole("menuitem", { name: "Improve writing" }).click();
    await expect(previewDialog(page)).toBeVisible();

    await page.getByRole("button", { name: "Discard" }).click();
    await expect(previewDialog(page)).toBeHidden();
    await expect(ta).toHaveValue(NOTE);
  });

  test("Make professional reframes blaming language deterministically", async ({ page }) => {
    const ta = textarea(page);
    await ta.fill("Jordan was non-compliant and refused to engage today");
    await rewriteBtn(page).click();
    await page.getByRole("menuitem", { name: "Make professional" }).click();

    await expect(previewDialog(page)).toBeVisible();
    await expect(page.getByText("No AI used")).toBeVisible();
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(ta).not.toHaveValue(/non-compliant/);
  });

  test("Check tone shows a read-only report and never edits the field", async ({ page }) => {
    const original = "the child was non-compliant and kicked off at dinner";
    const ta = textarea(page);
    await ta.fill(original);
    await rewriteBtn(page).click();
    await page.getByRole("menuitem", { name: "Check tone" }).click();

    const dialog = previewDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/Tone Check/i);
    // Analysis, not a rewrite — there is no Apply control...
    await expect(dialog.getByRole("button", { name: "Apply", exact: true })).toHaveCount(0);
    // ...and the field is left exactly as written.
    await expect(ta).toHaveValue(original);
  });
});
