import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FlatList, FlatListRow, FlatListRowDetail, type RowSeverity } from "../list-row";

const SEVERITIES: RowSeverity[] = ["risk", "warning", "success", "info", "neutral"];
const SEVERITY_TOKEN: Record<RowSeverity, string> = {
  risk: "--cs-risk",
  warning: "--cs-warning",
  success: "--cs-success",
  info: "--cs-info",
  neutral: "transparent",
};

describe("FlatList / FlatListRow (Cara Calm flat-list-row primitive)", () => {
  it("renders a list of rows without throwing", () => {
    expect(() =>
      renderToStaticMarkup(
        React.createElement(
          FlatList,
          null,
          React.createElement(FlatListRow, { severity: "risk", key: "a" }, "Row A"),
          React.createElement(FlatListRow, { severity: "success", key: "b" }, "Row B"),
        ),
      ),
    ).not.toThrow();
  });

  it("FlatList carries a hairline divider between rows, not per-row card chrome", () => {
    const html = renderToStaticMarkup(React.createElement(FlatList, null, "content"));
    expect(html).toContain("divide-y");
    // no per-row shadow/elevated-card treatment on the container
    expect(html).not.toContain("shadow-");
  });

  it.each(SEVERITIES)("FlatListRow renders exactly one severity bar for '%s'", (severity) => {
    const html = renderToStaticMarkup(React.createElement(FlatListRow, { severity }, "content"));
    expect(html).toContain(SEVERITY_TOKEN[severity]);
  });

  it("FlatListRow defaults to neutral (no colour cue) when severity is omitted", () => {
    const html = renderToStaticMarkup(React.createElement(FlatListRow, null, "content"));
    expect(html).toContain("bg-transparent");
  });

  it("FlatListRowDetail renders as a plain region (no card border/shadow chrome)", () => {
    const html = renderToStaticMarkup(React.createElement(FlatListRowDetail, null, "expanded content"));
    expect(html).not.toContain("shadow-");
    expect(html).toContain("expanded content");
  });
});
