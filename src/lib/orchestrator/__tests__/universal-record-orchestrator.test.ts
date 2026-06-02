import { describe, it, expect } from "vitest";
import { createRecord, getAuditLog, type CreateRecordInput } from "../universal-record-orchestrator";

function base(overrides?: Partial<CreateRecordInput>): CreateRecordInput {
  return {
    record_type: "observation",
    staff_id: "staff_darren",
    home_id: "home_oak",
    title: "Test record",
    description: "A neutral description with enough length to be meaningful for routing.",
    data: {},
    ...overrides,
  };
}

describe("Universal Record Orchestrator — createRecord", () => {
  // ── Reference prefixes ──────────────────────────────────────────────────
  describe("reference generation", () => {
    const cases: [string, RegExp][] = [
      ["safeguarding_concern", /^SAF-\d{4}-\d{4}$/],
      ["risk_assessment", /^RSK-\d{4}-\d{4}$/],
      ["supervision", /^SUP-\d{4}-\d{4}$/],
      ["wellbeing_check", /^WBC-\d{4}-\d{4}$/],
      ["performance_support", /^PSP-\d{4}-\d{4}$/],
      ["health_safety_check", /^HSC-\d{4}-\d{4}$/],
      ["maintenance_request", /^MNT-\d{4}-\d{4}$/],
      ["home_audit", /^AUD-\d{4}-\d{4}$/],
    ];
    for (const [type, pattern] of cases) {
      it(`generates ${pattern.source} for ${type}`, () => {
        const r = createRecord(base({ record_type: type, child_id: "yp_alex", severity: "medium" }));
        expect(r.record.reference as string).toMatch(pattern);
      });
    }
  });

  // ── Core save + shape ───────────────────────────────────────────────────
  describe("record creation", () => {
    it("saves with an id, status open, and recorder", () => {
      const r = createRecord(base({ record_type: "supervision", staff_id: "staff_sarah" }));
      expect(r.record.id).toBeTruthy();
      expect(r.record.status).toBe("open");
      expect(r.record.created_by).toBe("staff_sarah");
    });
    it("merges custom data fields onto the record", () => {
      const r = createRecord(base({ data: { tags: ["x"], custom_field: 42 } }));
      expect(r.record.custom_field).toBe(42);
    });
    it("defaults home_id to home_oak", () => {
      const r = createRecord({ record_type: "observation", staff_id: "s1", title: "t", description: "d".repeat(20), data: {} });
      expect(r.record.home_id).toBe("home_oak");
    });
  });

  // ── Audit entry ─────────────────────────────────────────────────────────
  describe("audit entry", () => {
    it("creates an audit entry with the right event type and linkage", () => {
      const r = createRecord(base({ record_type: "supervision" }));
      expect(r.audit_entry.event_type).toBe("supervision_created");
      expect(r.audit_entry.entity_type).toBe("supervision");
      expect(r.audit_entry.entity_id).toBe(r.record.id);
      expect(r.audit_entry.actor_id).toBe("staff_darren");
    });
    it("audit risk level reflects severity", () => {
      expect(createRecord(base({ record_type: "complaint", severity: "critical" })).audit_entry.risk_level).toBe("critical");
      expect(createRecord(base({ record_type: "complaint", severity: "low" })).audit_entry.risk_level).toBe("low");
    });
    it("getAuditLog accumulates entries", () => {
      const before = getAuditLog().length;
      createRecord(base({ record_type: "observation" }));
      createRecord(base({ record_type: "observation" }));
      expect(getAuditLog().length).toBeGreaterThanOrEqual(before + 2);
    });
  });

  // ── Timeline event ──────────────────────────────────────────────────────
  describe("timeline event", () => {
    it("links the timeline event to the record", () => {
      const r = createRecord(base({ record_type: "supervision" }));
      expect(r.timeline_event.linked_record_type).toBe("supervision");
      expect(r.timeline_event.linked_record_id).toBe(r.record.id);
    });
    it("uses safeguarding visibility for safeguarding concerns", () => {
      const r = createRecord(base({ record_type: "safeguarding_concern", child_id: "yp_alex", severity: "high" }));
      expect(r.timeline_event.visibility_level).toBe("safeguarding");
    });
    it("uses standard visibility for routine types", () => {
      const r = createRecord(base({ record_type: "supervision" }));
      expect(r.timeline_event.visibility_level).toBe("standard");
    });
  });

  // ── Task generation per type ────────────────────────────────────────────
  describe("follow-up tasks", () => {
    it("safeguarding concern generates RM review + SW notification + strategy + Reg 40", () => {
      const r = createRecord(base({ record_type: "safeguarding_concern", child_id: "yp_alex", severity: "critical" }));
      expect(r.tasks_created.length).toBeGreaterThanOrEqual(4);
      const titles = r.tasks_created.map((t) => t.title as string).join(" | ");
      expect(titles).toMatch(/RM review/i);
      expect(titles).toMatch(/social worker|notify/i);
      expect(titles).toMatch(/Reg 40/i);
    });
    it("restraint generates child debrief + staff debrief + body map + Reg 40", () => {
      const r = createRecord(base({ record_type: "restraint", child_id: "yp_alex", severity: "high" }));
      expect(r.tasks_created.length).toBe(4);
      const titles = r.tasks_created.map((t) => t.title as string).join(" | ");
      expect(titles).toMatch(/child debrief/i);
      expect(titles).toMatch(/staff debrief/i);
      expect(titles).toMatch(/body map/i);
    });
    it("missing from care generates return interview + police + risk review", () => {
      const r = createRecord(base({ record_type: "missing_from_care", child_id: "yp_alex", severity: "high" }));
      expect(r.tasks_created.length).toBe(3);
      expect(r.tasks_created.map((t) => t.title as string).join(" | ")).toMatch(/return interview/i);
    });
    it("complaint generates acknowledge + investigate", () => {
      const r = createRecord(base({ record_type: "complaint", severity: "medium" }));
      expect(r.tasks_created.length).toBe(2);
    });
    it("medication error generates error report + pharmacy liaison", () => {
      const r = createRecord(base({ record_type: "medication", child_id: "yp_alex", data: { type: "error" } }));
      expect(r.tasks_created.length).toBeGreaterThanOrEqual(2);
    });
    it("routine types generate no auto-tasks", () => {
      expect(createRecord(base({ record_type: "supervision" })).tasks_created.length).toBe(0);
      expect(createRecord(base({ record_type: "training_record" })).tasks_created.length).toBe(0);
      expect(createRecord(base({ record_type: "health_safety_check" })).tasks_created.length).toBe(0);
    });
    it("all generated tasks link back to the source record", () => {
      const r = createRecord(base({ record_type: "restraint", child_id: "yp_alex", severity: "high" }));
      for (const t of r.tasks_created) {
        expect(t.linked_record_type).toBe("restraint");
        expect(t.linked_record_id).toBe(r.record.id);
      }
    });
  });

  // ── Alert detection ─────────────────────────────────────────────────────
  describe("alerts", () => {
    it("flags safeguarding language in free text", () => {
      const r = createRecord(base({ record_type: "observation", description: "Concern that the child may be a victim of exploitation." }));
      expect(r.alerts.some((a) => /SAFEGUARDING LANGUAGE DETECTED/.test(a))).toBe(true);
    });
    it("flags high/critical severity", () => {
      const r = createRecord(base({ record_type: "complaint", severity: "high" }));
      expect(r.alerts.some((a) => /High severity/.test(a))).toBe(true);
    });
    it("warns when a child-related record has no child_id", () => {
      const r = createRecord(base({ record_type: "risk_assessment", severity: "medium" }));
      expect(r.alerts.some((a) => /No child linked/.test(a))).toBe(true);
    });
    it("warns when a severity-expected type has no severity", () => {
      const r = createRecord(base({ record_type: "complaint" }));
      expect(r.alerts.some((a) => /No severity set/.test(a))).toBe(true);
    });
    it("no spurious alerts for a clean routine record", () => {
      const r = createRecord(base({ record_type: "supervision", description: "Routine monthly catch-up, all going well." }));
      expect(r.alerts.length).toBe(0);
    });
  });

  // ── Delegation to specialised orchestrators ─────────────────────────────
  describe("delegation", () => {
    it("delegates incident to the incident orchestrator (INC- reference)", () => {
      const r = createRecord(base({ record_type: "incident", child_id: "yp_alex", severity: "high", description: "Aggressive outburst during the evening." }));
      expect(r.record.reference as string).toMatch(/^INC-/);
      expect(r.tasks_created.length).toBeGreaterThan(0);
    });
    it("delegates daily_log to the daily-log orchestrator (dl_ id)", () => {
      const r = createRecord(base({ record_type: "daily_log", child_id: "yp_alex", description: "Settled day, ate well, enjoyed football." }));
      expect(r.record.id as string).toMatch(/^dl_/);
      expect(r.linked_updates.length).toBeGreaterThan(0);
    });
  });

  // ── Linked updates summary ──────────────────────────────────────────────
  describe("linked updates", () => {
    it("summarises saved + audit + timeline at minimum", () => {
      const r = createRecord(base({ record_type: "supervision" }));
      const joined = r.linked_updates.join(" | ");
      expect(joined).toMatch(/saved/i);
      expect(joined).toMatch(/Audit trail/i);
      expect(joined).toMatch(/Timeline event/i);
    });
    it("includes task and alert lines when present", () => {
      const r = createRecord(base({ record_type: "safeguarding_concern", child_id: "yp_alex", severity: "critical", description: "Disclosure of abuse." }));
      const joined = r.linked_updates.join(" | ");
      expect(joined).toMatch(/Task created/i);
      expect(joined).toMatch(/Alert/i);
    });
  });
});
