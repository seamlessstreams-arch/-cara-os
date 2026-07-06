// ══════════════════════════════════════════════════════════════════════════════
// CARA — ASK CARA ENGINE TESTS
//
// Pins: each intent classifies + answers from the snapshot; child resolution by
// name; time windows; the honest "I won't guess" fallback (answered:false); and
// NO fabrication — an empty snapshot yields "no X recorded", never a made-up fact.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { answerQuestion } from "../ask-cara-engine";
import type { AskCaraSnapshot, AskCaraQuery } from "../types";

const ASOF = "2026-07-05";

const emptySnap = (o: Partial<AskCaraSnapshot> = {}): AskCaraSnapshot => ({
  children: [],
  staff: [],
  incidents: [],
  tasks: [],
  restraints: [],
  missingEpisodes: [],
  dailyLogs: [],
  medications: [],
  reviews: [],
  shifts: [],
  keyWork: [],
  contacts: [],
  supervisions: [],
  training: [],
  ...o,
});

const SNAP = emptySnap({
  children: [
    { id: "yp_alex", firstName: "Alex", name: "Alex W", dob: "2010-03-14", status: "current", keyWorkerId: "staff_ed", legalStatus: "Section 20", socialWorker: "Priya Shah", iro: "Tom Reed", school: "Oak Academy", allergies: ["peanuts"], nextReviewDate: "2026-07-30" },
    { id: "yp_casey", firstName: "Casey", name: "Casey J", status: "current" },
  ],
  staff: [{ id: "staff_ed", name: "Edward Bright" }, { id: "staff_late", name: "Nina Roy" }],
  incidents: [
    { id: "inc1", type: "missing_from_care", severity: "high", childId: "yp_alex", date: "2026-07-03", status: "open", requiresOversight: true, hasOversight: false },
    { id: "inc2", type: "medication_error", severity: "medium", childId: "yp_casey", date: "2026-07-01", status: "closed", requiresOversight: true, hasOversight: true },
  ],
  tasks: [{ id: "t1", title: "Update risk assessment", dueDate: "2026-06-20", status: "in_progress", childId: "yp_alex" }],
  restraints: [
    { id: "r1", date: "2026-07-02", childId: "yp_alex", childDebriefed: false },
    { id: "r2", date: "2026-06-28", childId: "yp_alex", childDebriefed: true },
  ],
  missingEpisodes: [{ id: "m1", date: "2026-07-03", childId: "yp_alex", hasReturnInterview: false, status: "closed" }],
  medications: [{ id: "med1", childId: "yp_casey", name: "Melatonin" }],
  reviews: [{ id: "rev1", kind: "Risk assessment", childId: "yp_alex", nextReviewDate: "2026-06-01" }],
  shifts: [
    { id: "sh1", staffId: "staff_ed", date: "2026-07-05", shiftType: "day" },
    { id: "sh2", staffId: "staff_ed", date: "2026-07-04", shiftType: "night" },
  ],
  keyWork: [
    { childId: "yp_alex", date: "2026-07-01" },
    { childId: "yp_casey", date: "2026-05-01" }, // >14d before 07-05 → a gap
  ],
  dailyLogs: [
    { childId: "yp_alex", date: "2026-07-04", content: "Alex became distressed after a phone call and was supported to regulate.", significant: true },
    { childId: "yp_casey", date: "2026-07-02", content: "Ordinary settled day.", significant: false },
  ],
  contacts: [
    { childId: "yp_alex", role: "camhs", name: "Dr Owens", organisation: "CAMHS North", phone: "01234 555111" },
  ],
  supervisions: [
    { staffId: "staff_ed", date: "2026-06-30", status: "completed" }, // recent → not overdue
    { staffId: "staff_late", date: "2026-04-01", status: "completed" }, // >42d before 07-05 → overdue
  ],
  training: [
    { staffId: "staff_ed", course: "Safeguarding", expiryDate: "2026-01-01", status: "expired", mandatory: true },
    { staffId: "staff_ed", course: "First Aid", expiryDate: "2026-08-01", status: "expiring_soon", mandatory: true },
  ],
});

const ask = (question: string, extra: Partial<AskCaraQuery> = {}) =>
  answerQuestion({ question, asOf: ASOF, snapshot: SNAP, ...extra });

describe("greeting", () => {
  it("greets by first name on hello", () => {
    const a = ask("hi", { userName: "Darren Laville" });
    expect(a.intent).toBe("greeting");
    expect(a.text).toMatch(/Hi Darren/);
    expect(a.suggestions.length).toBeGreaterThan(0);
  });
  it("greets on an empty question", () => {
    expect(ask("").intent).toBe("greeting");
  });
});

describe("children list", () => {
  it("lists the current young people by name", () => {
    const a = ask("who is placed here?");
    expect(a.intent).toBe("children_list");
    expect(a.text).toMatch(/Alex/);
    expect(a.text).toMatch(/Casey/);
    expect(a.sources[0].count).toBe(2);
  });
});

describe("child summary", () => {
  it("summarises a named child from records", () => {
    const a = ask("tell me about Alex");
    expect(a.intent).toBe("child_summary");
    expect(a.text).toMatch(/16 years old/); // dob 2010-03-14 vs 2026
    expect(a.text).toMatch(/Section 20/);
    expect(a.text).toMatch(/Key worker: Edward Bright/);
    expect(a.text).toMatch(/no recorded child debrief/); // r1 has no debrief
  });
  it("resolves a bare child name to a summary", () => {
    expect(ask("Casey").intent).toBe("child_summary");
  });
});

describe("incidents", () => {
  it("counts incidents in the asked window", () => {
    const a = ask("how many incidents this week?");
    expect(a.intent).toBe("incidents");
    // inc1 (07-03) within 7d of 07-05; inc2 (07-01) also within 7d
    expect(a.text).toMatch(/2 incidents this week/);
    expect(a.text).toMatch(/1 high or critical/);
  });
  it("filters incidents to a named child", () => {
    const a = ask("how many incidents for Casey this month?");
    expect(a.text).toMatch(/1 incident for Casey/);
  });
});

describe("restraints", () => {
  it("answers 'which restraints have no debrief' with only the gaps", () => {
    const a = ask("which restraints have no debrief?");
    expect(a.intent).toBe("restraints");
    expect(a.text).toMatch(/1 restraint/);
    expect(a.text).toMatch(/no child debrief/);
  });
  it("counts all restraints when not asked about debrief", () => {
    const a = ask("how many restraints this month?");
    expect(a.text).toMatch(/2 restraints/);
  });
});

describe("missing / overdue / medication / safeguarding", () => {
  it("reports missing episodes and RHI gaps", () => {
    const a = ask("any missing episodes?");
    expect(a.intent).toBe("missing");
    expect(a.text).toMatch(/1 missing episode/);
    expect(a.text).toMatch(/return home interview/);
  });
  it("lists overdue actions", () => {
    const a = ask("what's overdue?");
    expect(a.intent).toBe("overdue_tasks");
    expect(a.text).toMatch(/1 overdue action/);
    expect(a.text).toMatch(/Update risk assessment/);
  });
  it("answers medication", () => {
    expect(ask("what medication do we have?").intent).toBe("medication");
  });
  it("answers safeguarding with the open concern", () => {
    const a = ask("any safeguarding concerns?");
    expect(a.intent).toBe("safeguarding");
    expect(a.text).toMatch(/1 open safeguarding-type incident/); // inc1 missing_from_care, open
  });
});

describe("attention", () => {
  it("prioritises restraint repair gaps first", () => {
    const a = ask("what needs my attention today?");
    expect(a.intent).toBe("attention");
    expect(a.text).toMatch(/restraint/i);
    expect(a.text).toMatch(/oversight/i);
  });
});

describe("staffing / key work / events", () => {
  it("answers who is on shift today", () => {
    const a = ask("who's on shift?");
    expect(a.intent).toBe("staffing");
    expect(a.text).toMatch(/Edward Bright/); // only today's (07-05) shift, deduped
    expect(a.text).toMatch(/1 staff member on shift today/);
  });
  it("reports a child's key-work recency", () => {
    const a = ask("when did Alex last have key work?");
    expect(a.intent).toBe("key_work");
    expect(a.text).toMatch(/2026-07-01/);
  });
  it("flags key-work gaps across the home", () => {
    const a = ask("show me key work sessions");
    expect(a.intent).toBe("key_work");
    // Casey's last was 05-01 (>14d before 07-05) → a gap; Alex's 07-01 is recent.
    expect(a.text).toMatch(/Casey/);
  });
  it("summarises significant events", () => {
    const a = ask("anything significant happen this week?");
    expect(a.intent).toBe("events");
    expect(a.text).toMatch(/Alex/);
    expect(a.text).toMatch(/distressed after a phone call/);
  });
});

describe("reflector", () => {
  it("gives child-grounded reflective questions", () => {
    const a = ask("help me reflect on Alex");
    expect(a.intent).toBe("reflector");
    expect(a.text).toMatch(/reflect on your practice with Alex/i);
    expect(a.text).toMatch(/whose perspective is missing/i);
  });
  it("does not fall to missing-from-care for 'what am I missing'", () => {
    expect(ask("what am I missing about Alex?").intent).toBe("reflector");
  });
  it("gives generic reflective prompts with no child", () => {
    expect(ask("help me reflect").intent).toBe("reflector");
  });
});

describe("shift brief / what's due", () => {
  it("composes a shift handover", () => {
    const a = ask("brief me for my shift");
    expect(a.intent).toBe("shift_brief");
    expect(a.text).toMatch(/shift brief/i);
  });
  it("lists what's due", () => {
    const a = ask("what's due this week?");
    expect(a.intent).toBe("whats_due");
  });
});

describe("role-based access (RBAC)", () => {
  it("lets a manager see the home overview", () => {
    const a = ask("how is the home doing?", { role: "registered_manager", snapshot: { ...SNAP, home: { name: "Oak House", maxBeds: 4, currentOccupancy: 3 } } });
    expect(a.intent).toBe("home_overview");
    expect(a.text).toMatch(/Oak House/);
    expect(a.text).toMatch(/3\/4/);
  });
  it("denies a care worker the management-only home overview", () => {
    const a = ask("how is the home doing?", { role: "residential_care_worker" });
    expect(a.intent).toBe("access_denied");
    expect(a.answered).toBe(false);
    expect(a.text).toMatch(/management-level information/i);
  });
  it("denies an everyone-tier role (candidate) care-team data", () => {
    const a = ask("how many incidents this week?", { role: "candidate" });
    expect(a.intent).toBe("access_denied");
  });
  it("still lets everyone-tier roles ask general things (who's placed, reflect)", () => {
    expect(ask("who is placed here?", { role: "candidate" }).intent).toBe("children_list");
    expect(ask("help me reflect", { role: "candidate" }).intent).toBe("reflector");
  });
  it("defaults (no role) to care-team so operational Q&A works", () => {
    expect(ask("how many incidents this week?").intent).toBe("incidents");
  });
});

describe("deep child / contacts", () => {
  it("enriches the child summary with social worker, IRO, allergies, next review", () => {
    const a = ask("tell me about Alex");
    expect(a.text).toMatch(/social worker Priya Shah/);
    expect(a.text).toMatch(/IRO Tom Reed/);
    expect(a.text).toMatch(/Allergies: peanuts/);
    expect(a.text).toMatch(/Next LAC review: 2026-07-30/);
  });
  it("answers who a child's social worker is", () => {
    const a = ask("who is Alex's social worker?");
    expect(a.intent).toBe("contacts");
    expect(a.text).toMatch(/Social worker: Priya Shah/);
    expect(a.text).toMatch(/CAMHS/); // network contact folded in
  });
});

describe("team: supervision / training (management)", () => {
  it("flags staff overdue supervision for a manager", () => {
    const a = ask("who's overdue supervision?", { role: "registered_manager" });
    expect(a.intent).toBe("supervision");
    expect(a.text).toMatch(/Nina Roy/); // last supervised 04-01, >42d
    expect(a.text).not.toMatch(/Edward Bright/); // supervised 06-30, recent
  });
  it("denies a care worker the supervision list", () => {
    const a = ask("who's overdue supervision?", { role: "residential_care_worker" });
    expect(a.intent).toBe("access_denied");
  });
  it("flags expired and expiring training for a manager", () => {
    const a = ask("who's overdue training?", { role: "registered_manager" });
    expect(a.intent).toBe("training");
    expect(a.text).toMatch(/expired/);
    expect(a.text).toMatch(/Safeguarding/);
  });
});

describe("policy classifier ordering (regression)", () => {
  it("routes a policy question about a topic to policy_guidance, not the topic skill", () => {
    // "...policy...about missing..." must NOT be caught by the missing skill.
    expect(ask("what does our policy say about missing from care?").intent).toBe("policy_guidance");
    expect(ask("what's the restraint policy?").intent).toBe("policy_guidance");
  });
  it("a topic question without 'policy' still hits the topic skill", () => {
    expect(ask("any missing episodes?").intent).toBe("missing");
  });
});

describe("honesty — no fabrication", () => {
  it("gives an honest fallback (answered:false) for an unmappable question", () => {
    const a = ask("what is the meaning of life?");
    expect(a.intent).toBe("unknown");
    expect(a.answered).toBe(false);
    expect(a.text).toMatch(/couldn't map that question/i);
  });
  it("says 'no X recorded' on an empty snapshot rather than inventing", () => {
    const a = answerQuestion({ question: "how many incidents this week?", asOf: ASOF, snapshot: emptySnap() });
    expect(a.text).toMatch(/No incidents recorded/i);
  });
  it("every answer carries the support-not-decide disclaimer", () => {
    expect(ask("what needs my attention?").disclaimer).toMatch(/never makes a safeguarding decision/i);
  });
});
