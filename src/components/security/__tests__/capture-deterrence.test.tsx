// Render smoke tests for the capture-deterrence components.
// No browser available in this environment — assert on static markup
// (same convention as the ui primitives' tests). AuthContext is not mounted
// here, so the watermark exercises its "Unattributed session" fallback.

import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttributionWatermark, SensitiveSurface } from "@/components/security/capture-deterrence";

describe("AttributionWatermark", () => {
  it("tiles an attribution stamp without an auth provider (fallback identity)", () => {
    const html = renderToStaticMarkup(<AttributionWatermark />);
    expect(html).toContain("Unattributed session");
    expect(html).toContain("data-capture-attribution");
  });

  it("is non-interactive, unselectable, and hidden from the a11y tree", () => {
    const html = renderToStaticMarkup(<AttributionWatermark />);
    expect(html).toContain("pointer-events-none");
    expect(html).toContain("select-none");
    expect(html).toContain('aria-hidden="true"');
  });

  it("prints stronger than it displays", () => {
    const html = renderToStaticMarkup(<AttributionWatermark />);
    expect(html).toContain("opacity-[0.05]");
    expect(html).toContain("print:opacity-20");
  });
});

describe("SensitiveSurface", () => {
  it("renders children with the watermark mounted", () => {
    const html = renderToStaticMarkup(
      <SensitiveSurface>
        <p>Safeguarding thread</p>
      </SensitiveSurface>,
    );
    expect(html).toContain("Safeguarding thread");
    expect(html).toContain("data-capture-attribution");
  });

  it("can drop the watermark but keep the blur shell", () => {
    const html = renderToStaticMarkup(
      <SensitiveSurface watermark={false}>
        <p>x</p>
      </SensitiveSurface>,
    );
    expect(html).not.toContain("data-capture-attribution");
    expect(html).toContain("transition-[filter]");
  });

  it("does not render blurred on first paint (SSR-safe default)", () => {
    const html = renderToStaticMarkup(
      <SensitiveSurface>
        <p>x</p>
      </SensitiveSurface>,
    );
    expect(html).not.toContain("blur-md");
    expect(html).not.toContain("Content hidden while the window is inactive");
  });
});
