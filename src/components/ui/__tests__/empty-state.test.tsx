// ══════════════════════════════════════════════════════════════════════════════
// EmptyState — "none recorded" vs "could not look"
//
// `rows = data?.data ?? []` turns a FAILED query into an empty array, and an
// empty array into "No welfare checks recorded yet". That is a positive claim
// that nothing was recorded, made without ever having successfully read — the
// fabricate-on-empty prohibition applied to ABSENCE.
//
// So what is tested here is not that the component renders. It is that when
// the read failed it does NOT say the collection is empty, and does not offer
// to act on a state it does not know.
//
// Static markup only — no browser in this environment (same convention as
// check-tile / list-row / profile-card).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Moon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

const CLAIM = "No welfare checks recorded yet";

describe("EmptyState — a successful read that found nothing", () => {
  it("says the collection is empty, and offers the thing to do about it", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        icon={Moon}
        title={CLAIM}
        description="Start a round to document tonight's monitoring."
        actions={[{ label: "Start First Check" }]}
      />,
    );
    expect(html).toContain(CLAIM);
    expect(html).toContain("Start First Check");
  });

  it("an absent `error` prop changes nothing — undefined is not a failure", () => {
    const html = renderToStaticMarkup(<EmptyState title={CLAIM} error={undefined} />);
    expect(html).toContain(CLAIM);
  });

  it("`error={false}` is a read that succeeded and found none", () => {
    const html = renderToStaticMarkup(<EmptyState title={CLAIM} error={false} noun="welfare checks" />);
    expect(html).toContain(CLAIM);
    expect(html).not.toContain("could not be loaded");
  });
});

describe("EmptyState — a read that FAILED", () => {
  const failed = (extra = {}) =>
    renderToStaticMarkup(
      <EmptyState
        icon={Moon}
        title={CLAIM}
        description="Start a round to document tonight's monitoring."
        actions={[{ label: "Start First Check" }]}
        error={new Error("HTTP 500")}
        noun="welfare checks"
        {...extra}
      />,
    );

  it("does NOT claim the collection is empty", () => {
    expect(failed()).not.toContain(CLAIM);
  });

  it("says what actually happened, naming what could not be loaded", () => {
    expect(failed()).toContain("Welfare checks could not be loaded");
  });

  it("says explicitly that this is not the same as having none", () => {
    expect(failed()).toContain("not the same as having none");
  });

  it("says nothing has been lost — a failed READ has destroyed no records", () => {
    expect(failed()).toContain("Nothing has been lost");
  });

  it("drops the caller's action — \"Start First Check\" is the wrong offer on an unknown state", () => {
    const html = failed();
    expect(html).not.toContain("Start First Check");
  });

  it("drops the caller's description too — half the old message still reads as none", () => {
    expect(failed()).not.toContain("Start a round to document");
  });

  it("suppresses Ask Cara — Cara has nothing to reason about", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        title={CLAIM}
        error={new Error("x")}
        noun="welfare checks"
        caraPrompt="Why are there no checks?"
        onAskCara={() => {}}
      />,
    );
    expect(html).not.toContain("Ask Cara");
  });

  it("offers Try again when a retry is wired", () => {
    expect(failed({ onRetry: vi.fn() })).toContain("Try again");
  });

  it("offers no button at all when no retry is wired — never a dead control", () => {
    const html = failed();
    expect(html).not.toContain("<button");
    // …and does not tell anyone to press a button that is not there.
    expect(html).not.toContain("Try again");
    expect(html).toContain("Reload the page");
  });

  it("falls back to an honest generic when no noun is given", () => {
    const html = renderToStaticMarkup(<EmptyState title={CLAIM} error={new Error("x")} />);
    expect(html).toContain("This could not be loaded");
    expect(html).not.toContain(CLAIM);
  });

  it("capitalises the noun without mangling an acronym", () => {
    const html = renderToStaticMarkup(
      <EmptyState title={CLAIM} error={new Error("x")} noun="the MAR sheet" />,
    );
    expect(html).toContain("The MAR sheet could not be loaded");
  });

  it("treats a truthy `isError` boolean the same as an Error object", () => {
    const html = renderToStaticMarkup(
      <EmptyState title={CLAIM} error noun="welfare checks" />,
    );
    expect(html).toContain("Welfare checks could not be loaded");
  });
});
