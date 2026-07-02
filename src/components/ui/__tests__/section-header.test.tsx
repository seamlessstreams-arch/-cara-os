// Render smoke tests for the Cara Calm SectionHeader primitive.
// No browser available in this environment — assert on static markup
// (same convention as list-row.test.tsx / profile-card.test.tsx).

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Users } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";

describe("SectionHeader", () => {
  it("renders the label without throwing", () => {
    const html = renderToStaticMarkup(<SectionHeader>On Shift Today</SectionHeader>);
    expect(html).toContain("On Shift Today");
  });

  it("uses the muted uppercase label + hairline underline, never a tinted icon", () => {
    const html = renderToStaticMarkup(<SectionHeader icon={Users}>Team</SectionHeader>);
    expect(html).toContain("uppercase tracking-wider");
    expect(html).toContain("text-[var(--cs-text-muted)]");
    expect(html).toContain("border-b border-[--cs-border-subtle]");
    // icon inherits the muted label colour — no blue/amber tint classes
    expect(html).not.toMatch(/text-(blue|amber|red|emerald|green)-\d/);
  });

  it("renders the icon when given", () => {
    const html = renderToStaticMarkup(<SectionHeader icon={Users}>Team</SectionHeader>);
    expect(html).toContain("<svg");
  });

  it("renders no icon markup when omitted", () => {
    const html = renderToStaticMarkup(<SectionHeader>Team</SectionHeader>);
    expect(html).not.toContain("<svg");
  });

  it("renders the right-aligned action slot", () => {
    const html = renderToStaticMarkup(
      <SectionHeader action={<span>3 open</span>}>Incidents</SectionHeader>,
    );
    expect(html).toContain("3 open");
    expect(html).toContain("justify-between");
  });
});
