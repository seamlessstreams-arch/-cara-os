import { describe, it, expect } from "vitest";
import {
  buildReg45Queue,
  buildAnnexAQueue,
  buildOversightQueue,
  buildReg40Queue,
  buildReg40NotifiableDraft,
  reg40NotifiableEventType,
  careEventRef,
} from "@/lib/care-events/compliance-queues";
import type { CareEvent, Reg45EvidenceItem, AnnexAEvidenceItem } from "@/types/care-events";

function ce(partial: Partial<CareEvent>): CareEvent {
  return {
    id: "ce1",
    home_id: "home_oak",
    child_id: "child1",
    staff_id: "staff1",
    category: "safeguarding",
    title: "Test event",
    content: "Some content that is reasonably long for an excerpt test.",
    status: "manager_review_required",
    event_date: "2026-05-01",
    is_significant: false,
    is_safeguarding: false,
    requires_manager_review: true,
    requires_reg40_triage: true,
    manager_review_completed: false,
    manager_id: null,
    manager_review_at: null,
    manager_review_note: null,
    ...partial,
  } as CareEvent;
}

function r45(partial: Partial<Reg45EvidenceItem>): Reg45EvidenceItem {
  return {
    id: "r1",
    care_event_id: "ce1",
    home_id: "home_oak",
    suggested_text: "x",
    suggested_theme: "wellbeing",
    suggested_section: null,
    manager_decision: "pending",
    manager_approved_text: null,
    reviewed_by: null,
    reviewed_at: null,
    review_notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...partial,
  };
}

function aae(partial: Partial<AnnexAEvidenceItem>): AnnexAEvidenceItem {
  return {
    id: "a1",
    care_event_id: "ce1",
    home_id: "home_oak",
    annex_section: "section_1",
    suggested_text: "x",
    manager_decision: "pending",
    manager_approved_text: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...partial,
  };
}

describe("careEventRef", () => {
  it("returns null for missing event and includes excerpt only when asked", () => {
    expect(careEventRef(null)).toBeNull();
    const ref = careEventRef(ce({}), { excerpt: true });
    expect(ref?.id).toBe("ce1");
    expect(ref?.content_excerpt).toContain("Some content");
    expect(careEventRef(ce({}))?.content_excerpt).toBeUndefined();
  });
});

describe("buildReg45Queue", () => {
  const items = [
    r45({ id: "r1", manager_decision: "pending" }),
    r45({ id: "r2", manager_decision: "approved" }),
    r45({ id: "r3", manager_decision: "rejected", suggested_theme: "education" }),
  ];
  const find = (id: string) => (id === "ce1" ? ce({}) : undefined);

  it("computes counts over the whole queue and joins the care event", () => {
    const { data, meta } = buildReg45Queue(items, find);
    expect(meta.counts).toEqual({ pending: 1, approved: 1, rejected: 1, deferred: 0, total: 3 });
    expect(data[0].care_event?.id).toBe("ce1");
  });

  it("filters by decision and theme without changing counts", () => {
    const { data, meta } = buildReg45Queue(items, find, { decision: "rejected" });
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("r3");
    expect(meta.counts.total).toBe(3);
  });
});

describe("buildAnnexAQueue", () => {
  it("builds sections, gaps and readiness score", () => {
    const items = [
      aae({ id: "a1", annex_section: "s1", manager_decision: "approved" }),
      aae({ id: "a2", annex_section: "s2", manager_decision: "pending" }),
    ];
    const { meta } = buildAnnexAQueue(items, () => undefined);
    expect(meta.sections).toHaveLength(2);
    expect(meta.gaps).toEqual(["s2"]); // s2 has no approved evidence
    expect(meta.readiness_score).toBe(50); // 1 of 2 sections gap-free
    expect(meta.approved_count).toBe(1);
    expect(meta.pending_decisions).toBe(1);
  });

  it("is 100% ready with no evidence (no sections, no gaps)", () => {
    const { meta } = buildAnnexAQueue([], () => undefined);
    expect(meta.readiness_score).toBe(100);
    expect(meta.gaps).toEqual([]);
  });
});

describe("buildOversightQueue", () => {
  it("maps care events to tasks and computes meta", () => {
    const events = [
      ce({ id: "ce1", is_safeguarding: true, event_date: "2026-01-01" }), // urgent + overdue
      ce({ id: "ce2", manager_review_completed: true, status: "verified" }), // completed
    ];
    const { data, meta } = buildOversightQueue(events, "2026-05-01");
    expect(meta.total).toBe(2);
    expect(meta.active).toBe(1);
    expect(meta.urgent).toBe(1);
    expect(meta.overdue).toBe(1);
    expect(data[0].priority).toBe("urgent");
    expect(data[1].status).toBe("completed");
  });

  it("filters by priority", () => {
    const events = [ce({ id: "ce1", is_safeguarding: true }), ce({ id: "ce2" })];
    const { data } = buildOversightQueue(events, "2026-05-01", { priority: "urgent" });
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("ce1");
  });
});

describe("buildReg40Queue", () => {
  it("maps events to triage tasks with content excerpt and pending count", () => {
    const events = [ce({ id: "ce1", event_date: "2026-01-01" })];
    const { data, meta } = buildReg40Queue(events, 1, "2026-05-01");
    expect(meta).toEqual({ total: 1, active: 1, overdue: 1, care_events_pending_triage: 1 });
    expect(data[0].care_event?.content_excerpt).toContain("Some content");
  });
});

describe("reg40NotifiableEventType", () => {
  it("maps category/safeguarding to a notifiable type, defaulting to serious_incident", () => {
    expect(reg40NotifiableEventType(ce({ category: "restraint" }))).toBe("restraint");
    expect(reg40NotifiableEventType(ce({ category: "missing_episode" }))).toBe("absconding");
    expect(reg40NotifiableEventType(ce({ category: "general", is_safeguarding: true }))).toBe("child_protection");
    expect(reg40NotifiableEventType(ce({ category: "general", is_safeguarding: false }))).toBe("serious_incident");
  });
});

describe("buildReg40NotifiableDraft", () => {
  it("builds a PENDING (unsent) notifiable event from a care event", () => {
    const draft = buildReg40NotifiableDraft(ce({ child_id: "child9", title: "Serious event" }), {
      reportedBy: "staff_darren",
      note: "Manager note",
      today: "2026-05-19",
    });
    expect(draft.ofsted_status).toBe("pending"); // queued for a human, never auto-sent
    expect(draft.ofsted?.notified_date).toBeNull();
    expect(draft.child_id).toBe("child9");
    expect(draft.reported_by).toBe("staff_darren");
    expect(draft.summary).toBe("Serious event");
    expect(draft.date).toBe("2026-05-19");
  });
});
