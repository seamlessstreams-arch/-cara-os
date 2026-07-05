// ══════════════════════════════════════════════════════════════════════════════
// CARA — ENTITY-STABLE REDACTION TESTS
//
// Pins: deterministic + stable codes; full names and unique first names redact,
// word-boundary (never inside a larger word); the same person is the same code
// across a document set; shared first names go to a safe generic (never
// mis-attributed); rehydrate round-trips and doesn't clobber "Child A" inside
// "Child AB"; residual-name QA catches a leak.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  buildCodebook,
  redactText,
  redactDocuments,
  rehydrateText,
  findResidualNames,
  redactDocumentSet,
} from "../entity-redaction-engine";
import type { Codebook, EntityRef } from "../types";

const ENTITIES: EntityRef[] = [
  { id: "yp_alex", name: "Alex Smith", kind: "child" },
  { id: "yp_casey", name: "Casey Jones", kind: "child" },
  { id: "staff_ed", name: "Edward Bright", kind: "staff" },
];

describe("buildCodebook", () => {
  it("assigns deterministic, kind-ordered codes by id", () => {
    const cb = buildCodebook(ENTITIES);
    const code = (id: string) => cb.entries.find((e) => e.id === id)!.code;
    expect(code("yp_alex")).toBe("Child A"); // yp_alex < yp_casey
    expect(code("yp_casey")).toBe("Child B");
    expect(code("staff_ed")).toBe("Staff 1");
  });

  it("is stable across calls (same input → same codebook)", () => {
    expect(buildCodebook(ENTITIES)).toEqual(buildCodebook(ENTITIES));
  });
});

describe("redactText", () => {
  const cb = buildCodebook(ENTITIES);

  it("redacts full names and unique first names to the code", () => {
    expect(redactText("Alex Smith spoke to Edward.", cb)).toBe("Child A spoke to Staff 1.");
    expect(redactText("Casey was upset.", cb)).toBe("Child B was upset.");
  });

  it("respects word boundaries — never redacts inside a larger word", () => {
    // "Alexander" must be untouched even though "Alex" is a code term.
    expect(redactText("Alexander is not Alex.", cb)).toBe("Alexander is not Child A.");
  });

  it("redacts the full name before the first name (longest-first)", () => {
    expect(redactText("Alex Smith", cb)).toBe("Child A");
  });

  it("leaves unknown names untouched", () => {
    expect(redactText("Jordan went to school.", cb)).toBe("Jordan went to school.");
  });
});

describe("shared first names are never mis-attributed", () => {
  const shared: EntityRef[] = [
    { id: "yp_a", name: "Alex Smith", kind: "child" },
    { id: "yp_b", name: "Alex Jones", kind: "child" },
  ];
  const cb = buildCodebook(shared);

  it("redacts full names to distinct codes but a bare shared first name to a generic", () => {
    const out = redactText("Alex Smith argued with Alex Jones. Then Alex calmed down.", cb);
    expect(out).toContain("Child A argued with Child B");
    expect(out).toContain("Then a child calmed down");
    expect(out).not.toMatch(/\bAlex\b/); // no real first name leaks
  });
});

describe("stability across a document set", () => {
  it("maps the same person to the same code in every document", () => {
    const cb = buildCodebook(ENTITIES);
    const docs = [
      { id: "d1", text: "Alex Smith had a good day." },
      { id: "d2", text: "Edward supported Alex Smith again." },
    ];
    const out = redactDocuments(docs, cb);
    expect(out[0].text).toBe("Child A had a good day.");
    expect(out[1].text).toBe("Staff 1 supported Child A again.");
  });
});

describe("rehydrate", () => {
  const cb = buildCodebook(ENTITIES);

  it("round-trips a redacted document back to real names", () => {
    const redacted = redactText("Alex Smith met Edward Bright.", cb);
    expect(rehydrateText(redacted, cb)).toBe("Alex Smith met Edward Bright.");
  });

  it("does not rehydrate 'Child A' inside 'Child AB'", () => {
    const cb2: Codebook = {
      version: "1.0.0",
      entries: [
        { id: "1", kind: "child", name: "Real One", code: "Child A", matchTerms: ["Real One"] },
        { id: "2", kind: "child", name: "Real Two", code: "Child AB", matchTerms: ["Real Two"] },
      ],
    };
    expect(rehydrateText("Child AB arrived", cb2)).toBe("Real Two arrived");
  });
});

describe("residual-name QA", () => {
  it("redactDocumentSet reports no residual names on a clean redaction", () => {
    const out = redactDocumentSet([{ id: "d1", text: "Alex Smith and Casey Jones." }], ENTITIES);
    expect(out.residualNames).toEqual([]);
    expect(out.documents[0].text).toBe("Child A and Child B.");
  });

  it("findResidualNames detects a name the redaction missed", () => {
    const cb = buildCodebook(ENTITIES);
    // A raw (un-redacted) string still contains real names.
    expect(findResidualNames("Alex Smith is here", cb)).toContain("Alex Smith");
  });
});
