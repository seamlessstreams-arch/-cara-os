import { describe, it, expect } from "vitest";
import {
  computeHomeSummaryReport,
  REPORT_SECTIONS,
  type ReportSignalInput,
} from "../home-summary-report-engine";

const TODAY = "2026-06-08";

function sig(p: Partial<ReportSignalInput>): ReportSignalInput {
  return {
    engine_key: "home-x-intelligence",
    label: "X",
    section: "safeguarding",
    rating: null,
    score: null,
    headline: null,
    concerns: [],
    strengths: [],
    ...p,
  };
}

function base(signals: ReportSignalInput[]) {
  return computeHomeSummaryReport({
    period_label: "Week of 2 Jun 2026",
    home_name: "Chamberlain House",
    total_children: 3,
    total_staff: 12,
    signals,
    engines_queried: signals.length,
    engines_responded: signals.length,
    today: TODAY,
  });
}

describe("computeHomeSummaryReport", () => {
  it("always returns the six canonical sections in order", () => {
    const r = base([]);
    expect(r.sections.map((s) => s.key)).toEqual(REPORT_SECTIONS.map((s) => s.key));
    expect(r.title).toBe("Home Summary Report — Chamberlain House");
    expect(r.generated_for).toBe(TODAY);
  });

  it("marks sections with no rated data as no_data and overall stable", () => {
    const r = base([sig({ rating: "insufficient_data" })]);
    expect(r.sections.find((s) => s.key === "safeguarding")!.status).toBe("no_data");
    expect(r.overall_status).toBe("stable");
    expect(r.executive_summary).toMatch(/no domains have assessed data/i);
  });

  it("an inadequate engine makes its section red and overall serious_concern", () => {
    const r = base([
      sig({ section: "safeguarding", label: "Safeguarding", rating: "inadequate", headline: "Significant gaps", score: 30 }),
    ]);
    const sg = r.sections.find((s) => s.key === "safeguarding")!;
    expect(sg.status).toBe("red");
    expect(sg.inadequate).toEqual(["Safeguarding"]);
    expect(sg.highlights[0]).toBe("Safeguarding: Significant gaps");
    expect(r.overall_status).toBe("serious_concern");
    expect(r.executive_summary).toMatch(/Priority areas: Safeguarding & Protection/);
  });

  it("a requires_improvement engine makes its section amber and overall needs_attention", () => {
    const r = base([
      sig({ section: "health", label: "Health", rating: "requires_improvement", headline: "Needs work", score: 55 }),
    ]);
    const h = r.sections.find((s) => s.key === "health")!;
    expect(h.status).toBe("amber");
    expect(h.requires_improvement).toEqual(["Health"]);
    expect(r.overall_status).toBe("needs_attention");
  });

  it("good/outstanding engines make a section green with positives + overall good", () => {
    const r = base([
      sig({ section: "education", label: "Education", rating: "good", score: 80, strengths: ["Strong attendance"] }),
      sig({ section: "education", label: "Outcomes", rating: "outstanding", score: 90, strengths: ["Exceeding targets"] }),
    ]);
    const e = r.sections.find((s) => s.key === "education")!;
    expect(e.status).toBe("green");
    expect(e.avg_score).toBe(85);
    expect(e.positives).toEqual(expect.arrayContaining(["Education: Strong attendance", "Outcomes: Exceeding targets"]));
    expect(r.overall_status).toBe("good");
  });

  it("a healthy average but low score (<60) tips a section to amber", () => {
    const r = base([sig({ section: "workforce", label: "WF", rating: "adequate", score: 52 })]);
    expect(r.sections.find((s) => s.key === "workforce")!.status).toBe("amber");
  });

  it("computes avg score only over rated engines (ignores insufficient_data)", () => {
    const r = base([
      sig({ section: "leadership", label: "A", rating: "good", score: 80 }),
      sig({ section: "leadership", label: "B", rating: "insufficient_data", score: 0 }),
    ]);
    const l = r.sections.find((s) => s.key === "leadership")!;
    expect(l.rated_engines).toBe(1);
    expect(l.avg_score).toBe(80);
    expect(l.status).toBe("green");
  });

  it("red dominates amber/green for overall status", () => {
    const r = base([
      sig({ section: "safeguarding", label: "S", rating: "inadequate", score: 20 }),
      sig({ section: "education", label: "E", rating: "good", score: 80 }),
      sig({ section: "health", label: "H", rating: "requires_improvement", score: 50 }),
    ]);
    expect(r.overall_status).toBe("serious_concern");
    expect(r.executive_summary).toMatch(/Priority areas:/);
  });
});
