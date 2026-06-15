import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InlinePracticeLearning } from "../inline-practice-learning";
import { KnowledgeGraphInsights } from "@/components/knowledge-graph/knowledge-graph-insights";

function wrap(el: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client: qc }, el);
}

describe("Layer 5 inline components render smoke", () => {
  it("InlinePracticeLearning mounts (loading state) without throwing", () => {
    expect(() =>
      renderToStaticMarkup(wrap(React.createElement(InlinePracticeLearning, { childId: "yp_alex", childName: "Alex" }))),
    ).not.toThrow();
  });

  it("KnowledgeGraphInsights mounts (renders nothing while loading) without throwing", () => {
    expect(() => renderToStaticMarkup(wrap(React.createElement(KnowledgeGraphInsights, {})))).not.toThrow();
  });
});
