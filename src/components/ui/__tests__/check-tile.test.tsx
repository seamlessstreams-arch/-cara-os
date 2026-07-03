// Render smoke tests for the Cara Calm CheckTile primitive.
// No browser available in this environment — assert on static markup
// (same convention as list-row / profile-card / section-header tests).

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Lock } from "lucide-react";
import { CheckTile } from "@/components/ui/check-tile";

describe("CheckTile", () => {
  it("renders label and value without throwing", () => {
    const html = renderToStaticMarkup(
      <CheckTile ok icon={Lock} label="Building secured" value="Yes" />,
    );
    expect(html).toContain("Building secured");
    expect(html).toContain("Yes");
  });

  it("ok=true colours the value success and renders a success dot", () => {
    const html = renderToStaticMarkup(<CheckTile ok label="x" value="Yes" />);
    expect(html).toContain("text-[--cs-success]");
    expect(html).toContain("bg-[--cs-success]");
  });

  it("ok=false colours the value risk", () => {
    const html = renderToStaticMarkup(<CheckTile ok={false} label="x" value="No" />);
    expect(html).toContain("text-[--cs-risk]");
    expect(html).toContain("bg-[--cs-risk]");
  });

  it("state overrides the ok shorthand", () => {
    const html = renderToStaticMarkup(<CheckTile ok state="warning" label="x" value="Due" />);
    expect(html).toContain("text-[--cs-warning]");
    expect(html).not.toContain("text-[--cs-success]");
  });

  it("defaults to neutral with neither ok nor state", () => {
    const html = renderToStaticMarkup(<CheckTile label="x" value="—" />);
    expect(html).toContain("text-[var(--cs-text-secondary)]");
  });

  it("keeps a white surface + hairline border — never a full tint", () => {
    const html = renderToStaticMarkup(<CheckTile ok={false} label="x" value="No" />);
    expect(html).toContain("bg-[var(--cs-surface-elevated)]");
    expect(html).toContain("border-[--cs-border]");
    expect(html).not.toContain("bg-[--cs-risk-bg]");
  });
});
