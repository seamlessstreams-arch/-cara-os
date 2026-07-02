// Render smoke tests for the Cara Calm ProfileCard primitive.
// No browser available in this environment — assert on static markup
// (same convention as list-row.test.tsx).

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileCard } from "@/components/ui/profile-card";

describe("ProfileCard", () => {
  it("renders children without throwing", () => {
    const html = renderToStaticMarkup(
      <ProfileCard>
        <div className="p-5">Alex T</div>
      </ProfileCard>,
    );
    expect(html).toContain("Alex T");
  });

  it("renders a transparent top accent by default (neutral)", () => {
    const html = renderToStaticMarkup(<ProfileCard>x</ProfileCard>);
    expect(html).toContain("inset-x-0 top-0 h-[3px]");
    expect(html).toContain("bg-transparent");
  });

  it.each([
    ["risk", "bg-[--cs-risk]"],
    ["warning", "bg-[--cs-warning]"],
    ["success", "bg-[--cs-success]"],
    ["info", "bg-[--cs-info]"],
  ] as const)("severity=%s renders the %s accent", (severity, cls) => {
    const html = renderToStaticMarkup(<ProfileCard severity={severity}>x</ProfileCard>);
    expect(html).toContain(cls);
  });

  it("uses hairline border + elevated surface, never a shadow", () => {
    const html = renderToStaticMarkup(<ProfileCard>x</ProfileCard>);
    expect(html).toContain("border-[--cs-border]");
    expect(html).toContain("bg-[var(--cs-surface-elevated)]");
    expect(html).not.toContain("shadow");
  });

  it("interactive=false drops the pointer/hover affordance", () => {
    const html = renderToStaticMarkup(<ProfileCard interactive={false}>x</ProfileCard>);
    expect(html).not.toContain("cursor-pointer");
  });
});
