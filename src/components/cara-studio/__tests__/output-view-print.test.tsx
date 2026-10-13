import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OutputView, type CaraApiResult } from "../studio-bits";

const material = {
  materialType: "scenario_cards", title: "Trust — scenario cards for Alex", childFriendlyIntro: "This is for you.",
  blocks: [{ heading: "Card 1", body: "A friend asks you to keep a secret.", childPrompt: "What would you do?", options: ["Tell someone", "Wait"] }],
  printableText: "CARD 1 PLAIN TEXT COPY", lowWritingAlternative: "Point or draw.",
};
const result = (output: Record<string, unknown>, extra: Partial<CaraApiResult> = {}): CaraApiResult => ({
  id: "r1", title: "Session plan", manager_review_status: "not_reviewed", manager_review_reasons: [], guardrails: { severity: null, flags: [] },
  blocked: false, review_banner: null, blocked_message: null, output, ...extra,
});
const html = (r: CaraApiResult) => renderToStaticMarkup(<OutputView result={r} />);

describe("OutputView printing", () => {
  const plan = { mainActivity: "Card sort", staffGuidance: "STAFF ONLY NOTE", producedMaterial: material };

  it("a session plan shows the staff sheet and a separate hand-out with its own print buttons", () => {
    const h = html(result(plan));
    expect(h).toContain("Print staff sheet");
    expect(h).toContain("Print hand-out");
    expect(h).toContain("Print both");
    expect(h).toContain("A friend asks you to keep a secret.");
    expect(h).toContain("☐");
    expect(h).toContain("Checked by:");
  });

  it("the hand-out never contains the staff notes, and the plain-text copy is not printed twice", () => {
    const h = html(result(plan));
    const start = h.indexOf("(prints separately)");
    expect(start).toBeGreaterThan(-1);
    const handoutPart = h.slice(start);
    expect(handoutPart).not.toContain("STAFF ONLY NOTE");
    expect(h).not.toContain("CARD 1 PLAIN TEXT COPY");
    expect(h.match(/A friend asks you to keep a secret\./g)).toHaveLength(1);
  });

  it("the hand-out starts its own page when both are printed", () => {
    expect(html(result(plan))).toContain("print:break-before-page");
  });

  it("an output with no piece of work keeps a single Print button and no hand-out", () => {
    const h = html(result({ mainActivity: "Debrief", questions: ["a"] }));
    expect(h).toContain("Print</button>");
    expect(h).not.toContain("Print hand-out");
    expect(h).not.toContain("prints separately");
  });

  it("a material is split too: its guidance stays on the staff sheet, the work moves to the hand-out", () => {
    const h = html(result({ ...material, staffGuidance: "STAFF ONLY NOTE" }));
    expect(h).toContain("Print hand-out");
    expect(h.indexOf("STAFF ONLY NOTE")).toBeLessThan(h.indexOf("(prints separately)"));
  });

  it("a script for the adult is labelled as not for the child and has no answer boxes", () => {
    const h = html(result({ ...material, materialType: "staff_script" }));
    expect(h).toContain("Script for staff");
    expect(h).toContain("Print script");
    expect(h).not.toContain("No writing needed");
  });

  it("a hand-out waiting on manager review says so on the page", () => {
    expect(html(result(plan, { manager_review_status: "review_required", review_banner: "Review first" }))).toContain("Needs manager review before use.");
  });

  it("a blocked output shows no print buttons and no hand-out", () => {
    const h = html(result(plan, { blocked: true, blocked_message: "Held" }));
    expect(h).not.toContain("Print");
    expect(h).not.toContain("A friend asks you");
  });
});
