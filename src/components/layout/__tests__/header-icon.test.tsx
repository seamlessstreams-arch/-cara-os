// ══════════════════════════════════════════════════════════════════════════════
// PageShell's `icon` prop — 31 pages passed one and the shell dropped it.
//
// PageShell declared `icon?: React.ReactNode`, destructured it, and never
// forwarded it. Header had no icon prop at all, so there was nowhere for it to
// go. Every page that wrote `icon={<Sparkles … />}` rendered a header without
// one, and nothing failed: an unused prop is not a type error, and the page
// still looked plausible.
//
// These render the real components to static markup, so a regression that
// stopped forwarding the icon would show up as an absent mark rather than as a
// prop that merely exists.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children?: React.ReactNode; href?: string }) =>
    React.createElement("a", { href }, children),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/writing-quality" }));
vi.mock("@/components/common/global-create-menu", () => ({ GlobalCreateMenu: () => null }));
vi.mock("@/components/cara/cara-drawer", () => ({ CaraDrawer: () => null }));
vi.mock("@/components/layout/notification-centre", () => ({ NotificationCentre: () => null }));

import { Header } from "../header";

const mark = React.createElement("svg", { "data-mark": "page-icon" });

describe("header icon", () => {
  it("renders the icon the page supplied", () => {
    const html = renderToStaticMarkup(
      React.createElement(Header, { title: "Writing Quality", icon: mark }),
    );
    expect(html).toContain('data-mark="page-icon"');
    expect(html).toContain("Writing Quality");
  });

  it("renders nothing extra when a page supplies no icon", () => {
    const html = renderToStaticMarkup(
      React.createElement(Header, { title: "Writing Quality" }),
    );
    expect(html).not.toContain("data-mark");
    expect(html).toContain("Writing Quality");
  });

  it("marks the icon decorative so it is not announced twice", () => {
    const html = renderToStaticMarkup(
      React.createElement(Header, { title: "Writing Quality", icon: mark }),
    );
    // The title already names the page; the mark beside it repeats that name.
    const iconIndex = html.indexOf('data-mark="page-icon"');
    const hiddenIndex = html.lastIndexOf('aria-hidden="true"', iconIndex);
    expect(hiddenIndex).toBeGreaterThan(-1);
  });
});
