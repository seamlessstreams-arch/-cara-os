import { describe, it, expect } from "vitest";
import { detectReg40Category, requiresReg40FromText } from "../reg40-keywords";
import { classifyCareEvent } from "../routing-engine";

describe("detectReg40Category", () => {
  it("detects a death of a child", () => {
    expect(detectReg40Category("Sudden deterioration", "The young person sadly passed away overnight.")).toBe("death_of_child");
    expect(detectReg40Category("Update", "Child was pronounced dead at hospital.")).toBe("death_of_child");
  });

  it("detects a serious illness or accident", () => {
    expect(detectReg40Category("Fall in the garden", "Taken to hospital by ambulance, suspected fracture.")).toBe("serious_illness_or_accident");
    expect(detectReg40Category("Collapse", "Found unconscious, paramedics attended.")).toBe("serious_illness_or_accident");
  });

  it("detects an allegation against staff", () => {
    expect(detectReg40Category("Concern raised", "An allegation was made against a member of staff.")).toBe("allegation_against_staff");
    expect(detectReg40Category("Disclosure", "Child says a carer hurt them — allegation logged.")).toBe("allegation_against_staff");
  });

  it("detects police involvement", () => {
    expect(detectReg40Category("Incident", "Police attended and the young person was arrested.")).toBe("police_involvement");
  });

  it("prioritises the most serious category (death over police)", () => {
    expect(detectReg40Category("Tragedy", "The child died; police attended the scene.")).toBe("death_of_child");
  });

  it("returns null for benign care-log text", () => {
    expect(detectReg40Category("Lovely day", "Played football in the park and had dinner together.")).toBeNull();
    expect(detectReg40Category("School run", "Dropped off at school on time, good mood.")).toBeNull();
    expect(requiresReg40FromText("Reading", "We read a book about the seaside.")).toBe(false);
  });
});

describe("classifyCareEvent — Reg 40 gate (keyword fallback)", () => {
  it("flags a non-safeguarding event for Reg 40 when the text indicates a notifiable event", () => {
    const r = classifyCareEvent({
      category: "health",
      title: "Fall in the garden",
      content: "Taken to hospital by ambulance, suspected fracture.",
      event_date: "2026-06-06",
      is_significant: false,
    });
    expect(r.requires_reg40_triage).toBe(true);
  });

  it("does NOT flag a routine event of the same category", () => {
    const r = classifyCareEvent({
      category: "health",
      title: "GP appointment",
      content: "Routine check-up, everything fine.",
      event_date: "2026-06-06",
      is_significant: false,
    });
    expect(r.requires_reg40_triage).toBe(false);
  });

  it("still flags the established categories by category alone", () => {
    const r = classifyCareEvent({
      category: "safeguarding",
      title: "Concern",
      content: "A concern was noted.",
      event_date: "2026-06-06",
      is_significant: false,
    });
    expect(r.requires_reg40_triage).toBe(true);
  });
});
