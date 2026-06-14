// ══════════════════════════════════════════════════════════════════════════════
// Reg 44 Visit Evidence Pack — engine tests (Milestone 33)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import { generateReg44Pack } from "@/lib/care-events/reg44-pack";
import type { CareEvent } from "@/types/care-events";
import type { Incident, YoungPerson } from "@/types";

const HOME_ID = "home_reg44_pack_test";
const CHILD_ID = "yp_reg44_pack";

function todayMinus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function clearAll() {
  for (const arr of [
    db.youngPeople.findAll(),
    db.incidents.findAll(),
    db.missingEpisodes.findAll(),
    db.restraints.findAll(),
    db.careEvents.findAll(),
  ] as Array<{ home_id?: string; child_id?: string }[]>) {
    for (let i = arr.length - 1; i >= 0; i--) {
      const x = arr[i];
      if ((x.home_id && x.home_id === HOME_ID) || (x.child_id && x.child_id === CHILD_ID)) {
        arr.splice(i, 1);
      }
    }
  }
  // Reg45 chips for this home
  for (const r of db.caraReg45EvidenceItems.findAll(HOME_ID)) {
    db.caraReg45EvidenceItems.patch(r.id, { status: "rejected" });
  }
}

function seedChild() {
  const ypArr = db.youngPeople.findAll() as YoungPerson[];
  ypArr.push({
    id: CHILD_ID, home_id: HOME_ID,
    first_name: "Test", last_name: "Child", preferred_name: "Tess",
    date_of_birth: "2010-01-01", gender: "f", ethnicity: null, religion: null,
    placement_start: todayMinus(60), placement_end: null,
    placement_type: "long-term", local_authority: "LA",
    social_worker_name: "SW", social_worker_phone: null, social_worker_email: null,
    iro_name: "IRO", iro_phone: null,
    key_worker_id: null, secondary_worker_id: null,
    legal_status: "S20", risk_flags: ["mfh"],
    dietary_requirements: null, allergies: [], gp_name: null, gp_phone: null,
    school_name: null, school_contact: null, photo_url: null, status: "current",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    created_by: "test", updated_by: "test",
  });
}

function seedIncident(date: string, severity: "low" | "medium" | "high" | "critical" = "medium") {
  const arr = db.incidents.findAll() as Incident[];
  arr.push({
    id: `inc_${date}_${Math.random()}`, home_id: HOME_ID, child_id: CHILD_ID,
    reference: "INC-1", type: "other", severity, date, time: "12:00",
    location: null, description: "x", immediate_action: "x", reported_by: "u1",
    witnesses: [], body_map_required: false, body_map_completed: false, body_map_url: null,
    notifications: [], requires_oversight: false, oversight_note: null, oversight_by: null,
    oversight_at: null, status: "open", outcome: null, lessons_learned: null,
    linked_task_ids: [], linked_document_ids: [],
    created_at: date, updated_at: date, created_by: "u1", updated_by: "u1",
  });
}

function seedSafeguardingCareEvent(date: string): CareEvent {
  const e = db.careEvents.create({
    home_id: HOME_ID, child_id: CHILD_ID, title: "sg", content: "sg event",
    category: "safeguarding", is_current_version: true,
    event_date: date, status: "manager_review_required",
    is_safeguarding: true, contributes_to_reg45: true,
    submitted_at: new Date().toISOString(), staff_id: "staff_x",
  } as Parameters<typeof db.careEvents.create>[0]);
  db.careEvents.patch(e.id, { status: "verified", verified_at: `${date}T12:00:00.000Z` });
  return db.careEvents.findById(e.id)!;
}

describe("Reg 44 Visit Evidence Pack (M33)", () => {
  beforeEach(() => clearAll());

  it("returns an empty headline when nothing exists in the home", () => {
    const p = generateReg44Pack(HOME_ID);
    expect(p.home_id).toBe(HOME_ID);
    expect(p.children.length).toBe(0);
    expect(p.headline.children_in_residence).toBe(0);
    expect(p.headline.incidents).toBe(0);
    expect(p.previous_visit.visit_id).toBeNull();
  });

  it("includes children in residence", () => {
    seedChild();
    const p = generateReg44Pack(HOME_ID);
    expect(p.children.length).toBe(1);
    expect(p.children[0].child_id).toBe(CHILD_ID);
    expect(p.headline.children_in_residence).toBe(1);
  });

  it("filters incidents by window (default 30 days)", () => {
    seedChild();
    seedIncident(todayMinus(5), "critical");
    seedIncident(todayMinus(60));
    const p = generateReg44Pack(HOME_ID);
    expect(p.incidents.length).toBe(1);
    expect(p.headline.incidents).toBe(1);
    expect(p.headline.incidents_critical).toBe(1);
  });

  it("respects a custom window", () => {
    seedChild();
    seedIncident(todayMinus(5));
    seedIncident(todayMinus(60));
    const p = generateReg44Pack(HOME_ID, { window: { start: todayMinus(90), end: todayMinus(0) } });
    expect(p.incidents.length).toBe(2);
  });

  it("counts safeguarding events from verified care events", () => {
    seedChild();
    seedSafeguardingCareEvent(todayMinus(3));
    const p = generateReg44Pack(HOME_ID);
    expect(p.safeguarding_events.length).toBe(1);
    expect(p.headline.safeguarding_events).toBe(1);
  });

  it("records generated_by and a deterministic id shape", () => {
    const p = generateReg44Pack(HOME_ID, { generatedBy: "user_42" });
    expect(p.generated_by).toBe("user_42");
    expect(p.id.startsWith(`r44pack_${HOME_ID}_`)).toBe(true);
    expect(p.schema_version).toBe(1);
  });

  it("isolates by home — other-home records do not appear", () => {
    seedChild();
    seedIncident(todayMinus(2));
    const otherHome = "home_reg44_other";
    const p = generateReg44Pack(otherHome);
    expect(p.children.length).toBe(0);
    expect(p.incidents.length).toBe(0);
  });
});
