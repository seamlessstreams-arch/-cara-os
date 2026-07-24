import { describe, it, expect } from "vitest";
import {
  buildAdmissionTaskPlan,
  buildDraftRiskAssessments,
  mapRiskFactorsToDomains,
} from "../admission-intake";

const TODAY = "2026-07-13";

describe("buildAdmissionTaskPlan", () => {
  it("instantiates every auto-create step of the New Placement Admission workflow", () => {
    const plan = buildAdmissionTaskPlan({ placementStart: "2026-08-01", today: TODAY, childName: "Jordan Mensah" });
    // 8 template steps, Placement Agreement is auto_create_task: false
    expect(plan).toHaveLength(7);
    expect(plan.map((t) => t.title)).toEqual([
      "Referral Assessment — Jordan Mensah",
      "Impact Risk Assessment — Jordan Mensah",
      "Pre-Placement Planning — Jordan Mensah",
      "Room & Environment — Jordan Mensah",
      "Staff Briefing — Jordan Mensah",
      "Admission Day — Jordan Mensah",
      "72-Hour Review — Jordan Mensah",
    ]);
  });

  it("anchors due dates to the placement date, pre-steps before and review after", () => {
    const plan = buildAdmissionTaskPlan({ placementStart: "2026-08-01", today: TODAY, childName: "J" });
    const byTitle = Object.fromEntries(plan.map((t) => [t.title.split(" — ")[0], t.due_date]));
    expect(byTitle["Referral Assessment"]).toBe("2026-07-25");
    expect(byTitle["Pre-Placement Planning"]).toBe("2026-07-29");
    expect(byTitle["Admission Day"]).toBe("2026-08-01");
    expect(byTitle["72-Hour Review"]).toBe("2026-08-04");
  });

  it("clamps to tomorrow for a short-notice or retrospective admission — no tasks due in the past", () => {
    const plan = buildAdmissionTaskPlan({ placementStart: TODAY, today: TODAY, childName: "J" });
    for (const t of plan) expect(t.due_date >= "2026-07-14").toBe(true);
    // the post-placement review still lands after placement
    const review = plan.find((t) => t.title.startsWith("72-Hour Review"))!;
    expect(review.due_date).toBe("2026-07-16");
  });

  it("marks admission day and the 72-hour review urgent", () => {
    const plan = buildAdmissionTaskPlan({ placementStart: "2026-08-01", today: TODAY, childName: "J" });
    const urgent = plan.filter((t) => t.priority === "urgent").map((t) => t.title.split(" — ")[0]);
    expect(urgent).toEqual(["Admission Day", "72-Hour Review"]);
  });
});

describe("mapRiskFactorsToDomains", () => {
  it("maps referral wording onto recognised risk domains", () => {
    const map = mapRiskFactorsToDomains([
      "History of going missing",
      "Vulnerable to child criminal exploitation",
      "Self-harm (historic)",
    ]);
    expect([...map.keys()].sort()).toEqual(["absconding", "exploitation", "self_harm"]);
    expect(map.get("absconding")).toEqual(["History of going missing"]);
  });

  it("lets one factor line evidence more than one domain", () => {
    const map = mapRiskFactorsToDomains(["Goes missing and uses cannabis when absent"]);
    expect(map.has("absconding")).toBe(true);
    expect(map.has("substance_use")).toBe(true);
  });

  it("invents nothing for unrecognised wording", () => {
    expect(mapRiskFactorsToDomains(["Enjoys football"]).size).toBe(0);
  });
});

describe("buildDraftRiskAssessments", () => {
  const drafts = buildDraftRiskAssessments({
    extraction: {
      risk_factors: ["History of going missing", "Self-harm (historic)"],
      presenting_needs: ["Attachment difficulties"],
    },
    childId: "yp_test",
    homeId: "home_oak",
    actorId: "staff_darren",
    today: TODAY,
  });

  it("creates one DRAFT per recognised domain — never a completed assessment", () => {
    expect(drafts).toHaveLength(2);
    for (const d of drafts) {
      expect(d.status).toBe("draft");
      expect(d.child_id).toBe("yp_test");
    }
  });

  it("carries the referral's own wording as the triggers", () => {
    const absconding = drafts.find((d) => d.domain === "absconding")!;
    expect(absconding.triggers).toEqual(["History of going missing"]);
    expect(absconding.history_notes).toMatch(/from the initial referral/i);
    expect(absconding.history_notes).toMatch(/Attachment difficulties/);
  });
});
