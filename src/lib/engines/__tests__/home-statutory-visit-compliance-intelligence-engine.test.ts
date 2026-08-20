import { describe, it, expect } from "vitest";
import {
  computeStatutoryVisitCompliance,
  type StatutoryVisitComplianceInput,
  type StatutoryVisitInput,
  type SocialWorkerContactInput,
  type UnannouncedVisitInput,
} from "../home-statutory-visit-compliance-intelligence-engine";

/* ── helpers ────────────────────────────────────────────────────────────────── */

function makeVisit(id: string, childId: string, o: Partial<StatutoryVisitInput> = {}): StatutoryVisitInput {
  return { id, child_id: childId, visit_date: "2026-05-01", type: "statutory", completed: true, child_seen_alone: true, views_recorded: true, ...o };
}

function makeSWContact(id: string, childId: string, o: Partial<SocialWorkerContactInput> = {}): SocialWorkerContactInput {
  return { id, child_id: childId, contact_date: "2026-05-01", method: "visit", outcome_recorded: true, ...o };
}

function makeUV(id: string, o: Partial<UnannouncedVisitInput> = {}): UnannouncedVisitInput {
  return { id, visit_date: "2026-05-01", completed: true, findings_documented: true, actions_raised: 1, actions_resolved: 1, ...o };
}

function baseInput(overrides: Partial<StatutoryVisitComplianceInput> = {}): StatutoryVisitComplianceInput {
  return {
    today: "2026-05-15",
    total_children: 4,
    statutory_visits_due_per_child_per_year: 6,
    statutory_visits: [
      // 4 children × 6 visits = 24 expected; provide 24 completed
      ...Array.from({ length: 6 }, (_, i) => makeVisit(`v1-${i}`, "c1", { visit_date: `2026-0${Math.min(i + 1, 5)}-01` })),
      ...Array.from({ length: 6 }, (_, i) => makeVisit(`v2-${i}`, "c2", { visit_date: `2026-0${Math.min(i + 1, 5)}-01` })),
      ...Array.from({ length: 6 }, (_, i) => makeVisit(`v3-${i}`, "c3", { visit_date: `2026-0${Math.min(i + 1, 5)}-01` })),
      ...Array.from({ length: 6 }, (_, i) => makeVisit(`v4-${i}`, "c4", { visit_date: `2026-0${Math.min(i + 1, 5)}-01` })),
    ],
    social_worker_contacts: [
      makeSWContact("sw1", "c1"), makeSWContact("sw2", "c2"),
      makeSWContact("sw3", "c3"), makeSWContact("sw4", "c4"),
    ],
    unannounced_visits: [makeUV("uv1"), makeUV("uv2")],
    reg22_records: [],
    ...overrides,
  };
}

/* ── tests ──────────────────────────────────────────────────────────────────── */

describe("Home Statutory Visit Compliance Intelligence Engine", () => {
  describe("insufficient data", () => {
    it("returns insufficient_data when no children", () => {
      const r = computeStatutoryVisitCompliance({
        today: "2026-05-15", total_children: 0,
        statutory_visits_due_per_child_per_year: 6,
        statutory_visits: [], social_worker_contacts: [],
        unannounced_visits: [], reg22_records: [],
      });
      expect(r.visit_rating).toBe("insufficient_data");
    });
  });

  describe("outstanding threshold (≥80)", () => {
    it("rates outstanding with full compliance", () => {
      const r = computeStatutoryVisitCompliance(baseInput());
      expect(r.visit_score).toBeGreaterThanOrEqual(80);
      expect(r.visit_rating).toBe("outstanding");
    });
  });

  describe("good threshold (65–79)", () => {
    it("rates good with some gaps", () => {
      const r = computeStatutoryVisitCompliance(baseInput({
        statutory_visits: [
          // 4 children, 5 visits each = 20 out of 24 expected (83%)
          ...Array.from({ length: 5 }, (_, i) => makeVisit(`v1-${i}`, "c1", { visit_date: `2026-0${Math.min(i + 1, 5)}-01` })),
          ...Array.from({ length: 5 }, (_, i) => makeVisit(`v2-${i}`, "c2", { visit_date: `2026-0${Math.min(i + 1, 5)}-01`, child_seen_alone: i < 3 })),
          ...Array.from({ length: 5 }, (_, i) => makeVisit(`v3-${i}`, "c3", { visit_date: `2026-0${Math.min(i + 1, 5)}-01` })),
          ...Array.from({ length: 5 }, (_, i) => makeVisit(`v4-${i}`, "c4", { visit_date: `2026-0${Math.min(i + 1, 5)}-01` })),
        ],
        social_worker_contacts: [
          makeSWContact("sw1", "c1"), makeSWContact("sw2", "c2"),
          makeSWContact("sw3", "c3"),
          // c4 missing
        ],
      }));
      expect(r.visit_score).toBeGreaterThanOrEqual(65);
      expect(r.visit_score).toBeLessThan(80);
      expect(r.visit_rating).toBe("good");
    });
  });

  describe("inadequate threshold (<45)", () => {
    it("rates inadequate with severe non-compliance", () => {
      const r = computeStatutoryVisitCompliance(baseInput({
        statutory_visits: [
          // Only 8 visits for 4 children (33%)
          makeVisit("v1", "c1", { visit_date: "2026-03-01" }),
          makeVisit("v2", "c1", { visit_date: "2026-01-01", child_seen_alone: false, views_recorded: false }),
          makeVisit("v3", "c2", { visit_date: "2026-02-01", child_seen_alone: false }),
          makeVisit("v4", "c2", { visit_date: "2026-01-01", child_seen_alone: false, views_recorded: false }),
          makeVisit("v5", "c3", { visit_date: "2026-01-15", child_seen_alone: false, views_recorded: false }),
          makeVisit("v6", "c3", { visit_date: "2025-11-01", child_seen_alone: false, views_recorded: false }),
          makeVisit("v7", "c4", { visit_date: "2025-09-01", child_seen_alone: false, views_recorded: false }),
          makeVisit("v8", "c4", { visit_date: "2025-08-01", child_seen_alone: false, views_recorded: false }),
        ],
        social_worker_contacts: [makeSWContact("sw1", "c1")],
        unannounced_visits: [],
      }));
      expect(r.visit_score).toBeLessThan(45);
      expect(r.visit_rating).toBe("inadequate");
    });
  });

  describe("metrics", () => {
    it("calculates completion rate correctly", () => {
      const r = computeStatutoryVisitCompliance(baseInput());
      expect(r.statutory_visit_completion_rate).toBe(100);
    });

    it("calculates seen alone rate", () => {
      const r = computeStatutoryVisitCompliance(baseInput());
      expect(r.children_seen_alone_rate).toBe(100);
    });

    it("detects children without recent visit", () => {
      const r = computeStatutoryVisitCompliance(baseInput({
        statutory_visits: [
          // c1 and c2 visited recently, c3 and c4 not
          makeVisit("v1", "c1", { visit_date: "2026-05-01" }),
          makeVisit("v2", "c2", { visit_date: "2026-04-15" }),
        ],
      }));
      expect(r.children_without_recent_visit).toBeGreaterThanOrEqual(2);
    });
  });

  describe("strengths", () => {
    it("generates completion rate strength", () => {
      const r = computeStatutoryVisitCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("visit completion") || s.includes("statutory"))).toBe(true);
    });

    it("generates seen alone strength", () => {
      const r = computeStatutoryVisitCompliance(baseInput());
      expect(r.strengths.some(s => s.includes("seen alone"))).toBe(true);
    });
  });

  describe("concerns", () => {
    it("raises concern for children without recent visits", () => {
      const r = computeStatutoryVisitCompliance(baseInput({
        statutory_visits: [
          makeVisit("v1", "c1", { visit_date: "2026-05-01" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("statutory visit") || c.includes("not had a recent"))).toBe(true);
    });
  });

  describe("recommendations", () => {
    it("recommends immediate visits for overdue children", () => {
      const r = computeStatutoryVisitCompliance(baseInput({
        statutory_visits: [makeVisit("v1", "c1", { visit_date: "2026-05-01" })],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate")).toBe(true);
    });
  });

  describe("insights", () => {
    it("generates outstanding positive insight", () => {
      const r = computeStatutoryVisitCompliance(baseInput());
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });
  });

  describe("headline", () => {
    it("outstanding headline", () => {
      const r = computeStatutoryVisitCompliance(baseInput());
      expect(r.headline).toContain("Outstanding");
    });
  });

  describe("edge cases", () => {
    it("handles zero visits but children present", () => {
      const r = computeStatutoryVisitCompliance(baseInput({
        statutory_visits: [], social_worker_contacts: [],
        unannounced_visits: [], reg22_records: [],
      }));
      expect(r.visit_rating).not.toBe("insufficient_data");
      expect(r.children_without_recent_visit).toBe(4);
    });

    it("scores are 0-100", () => {
      const r = computeStatutoryVisitCompliance(baseInput());
      expect(r.visit_score).toBeGreaterThanOrEqual(0);
      expect(r.visit_score).toBeLessThanOrEqual(100);
    });
  });
});
