import { test, expect } from "@playwright/test";

// ══════════════════════════════════════════════════════════════════════════════
// Dictation must ACCUMULATE across pauses, never replace earlier text.
//
// The Web Speech API isn't available to Playwright, so we inject a controllable
// mock before the page loads: window.__fireFinal(text) simulates the browser
// finalising a spoken phrase, and window.__endSession() simulates the browser
// ending recognition on a pause (the component auto-restarts).
//
// Regression guard for the stale-closure bug where each finalised phrase
// overwrote everything dictated before it.
// ══════════════════════════════════════════════════════════════════════════════

const MOCK_SPEECH = `
(() => {
  class MockRecognition {
    constructor() { window.__rec = this; }
    start() { this.onstart && this.onstart(new Event('start')); }
    stop() { this.onend && this.onend(new Event('end')); }
    abort() {}
  }
  window.SpeechRecognition = MockRecognition;
  window.webkitSpeechRecognition = MockRecognition;
  window.__fireFinal = (text) => {
    const rec = window.__rec;
    if (!rec || !rec.onresult) return;
    const result = { isFinal: true, length: 1, 0: { transcript: text }, item: () => ({ transcript: text }) };
    rec.onresult({ resultIndex: 0, results: { length: 1, 0: result, item: () => result } });
  };
  window.__endSession = () => {
    const rec = window.__rec;
    if (rec && rec.onend) rec.onend(new Event('end'));
  };
})();
`;

const textarea = (page: import("@playwright/test").Page) =>
  page.getByPlaceholder(/Write \(or dictate\)/i);

const fireFinal = (page: import("@playwright/test").Page, text: string) =>
  page.evaluate((t) => (window as unknown as { __fireFinal: (s: string) => void }).__fireFinal(t), text);

test.describe("Dictation — continuous accumulation (no text loss)", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60_000);
    await page.addInitScript(MOCK_SPEECH);
    await page.goto("/cara/recording-assistant");
    await expect(textarea(page)).toBeVisible();
  });

  test("each paused phrase is appended, never replacing earlier text", async ({ page }) => {
    await page.getByRole("button", { name: "Start voice input" }).click();
    await expect(page.getByRole("button", { name: "Stop listening" })).toBeVisible();

    await fireFinal(page, "the young person came home from school");
    await expect(textarea(page)).toHaveValue("the young person came home from school");

    // A pause finalises the phrase; the next phrase must be ADDED, not replace it.
    await fireFinal(page, "he was in a calm and settled mood");
    await expect(textarea(page)).toHaveValue(
      "the young person came home from school he was in a calm and settled mood",
    );

    // The browser ends recognition on a pause; the component auto-restarts.
    await page.evaluate(() => (window as unknown as { __endSession: () => void }).__endSession());
    await fireFinal(page, "staff offered him a snack and a chat");
    await expect(textarea(page)).toHaveValue(
      "the young person came home from school he was in a calm and settled mood staff offered him a snack and a chat",
    );
  });

  test("a long multi-phrase dictation keeps every phrase", async ({ page }) => {
    await page.getByRole("button", { name: "Start voice input" }).click();
    await expect(page.getByRole("button", { name: "Stop listening" })).toBeVisible();

    const phrases = Array.from({ length: 12 }, (_, i) => `sentence number ${i + 1}`);
    for (const p of phrases) {
      await fireFinal(page, p);
    }
    await expect(textarea(page)).toHaveValue(phrases.join(" "));
  });
});
