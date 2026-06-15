import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { InlineSuggestions } from "../inline-suggestions";
import { CaraWritingField } from "../cara-writing-field";
import { checkWriting } from "@/lib/writing-assistant/engine";

const r = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("writing-assistant UI render smoke", () => {
  it("InlineSuggestions renders real engine issues without throwing", () => {
    const result = checkWriting({ text: "Child kicked off and didnt settle. Their behavior was challenging." }, "x");
    expect(() =>
      r(React.createElement(InlineSuggestions, { issues: result.issues, score: result.score, onApply: () => {}, onIgnore: () => {} })),
    ).not.toThrow();
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("InlineSuggestions renders nothing when there are no issues", () => {
    const html = r(React.createElement(InlineSuggestions, { issues: [], onApply: () => {}, onIgnore: () => {} }));
    expect(html).toBe("");
  });

  it("CaraWritingField mounts (textarea only until a check returns) without throwing", () => {
    expect(() =>
      r(React.createElement(CaraWritingField, { value: "Some record text here.", onChange: () => {}, fieldName: "notes" })),
    ).not.toThrow();
  });
});
