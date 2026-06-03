import { describe, it, expect } from "vitest";
import { EVENT_TYPE_LABEL, EVENT_TYPE_LABEL_SHORT, eventTypeLabel } from "../event-type-meta";

describe("event-type display metadata", () => {
  it("full and short maps cover exactly the same event types, all non-empty", () => {
    const full = Object.keys(EVENT_TYPE_LABEL).sort();
    const short = Object.keys(EVENT_TYPE_LABEL_SHORT).sort();
    expect(full).toEqual(short);
    for (const v of [...Object.values(EVENT_TYPE_LABEL), ...Object.values(EVENT_TYPE_LABEL_SHORT)]) {
      expect(v.length).toBeGreaterThan(0);
    }
  });

  it("labels the 6 newer spine domains (no raw snake_case leaks)", () => {
    expect(eventTypeLabel("complaint")).toBe("Complaint");
    expect(eventTypeLabel("family_contact")).toBe("Family contact");
    expect(eventTypeLabel("risk_assessment")).toBe("Risk assessment");
    expect(eventTypeLabel("lac_review")).toBe("LAC review");
    expect(eventTypeLabel("notifiable_event")).toBe("Notifiable event");
    expect(eventTypeLabel("behaviour_support_plan")).toBe("Behaviour support plan");
  });

  it("returns the compact label when short is requested", () => {
    expect(eventTypeLabel("daily_log")).toBe("Daily log");
    expect(eventTypeLabel("daily_log", true)).toBe("Log");
    expect(eventTypeLabel("physical_intervention", true)).toBe("Restraint");
    expect(eventTypeLabel("behaviour_support_plan", true)).toBe("BSP");
  });

  it("humanises an unknown type rather than leaking snake_case", () => {
    expect(eventTypeLabel("some_future_type")).toBe("Some future type");
    expect(eventTypeLabel("some_future_type", true)).toBe("Some future type");
  });
});
