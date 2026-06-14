// ══════════════════════════════════════════════════════════════════════════════
// Cara Reg 45 Live Evidence Bank — engine tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  runReg45EvidenceBuild,
  loadReg45Evidence,
} from "@/lib/cara/cara-reg45-evidence";
import type { CaraReg45EvidenceItem } from "@/types/cara-studio";

const HOME_ID = "home_oak";
const CHILD_ID = "yp_alex";

function todayMinus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function seedSafeguardingPattern() {
  return db.caraSafeguardingPatterns.create({
    home_id: HOME_ID,
    child_id: CHILD_ID,
    pattern_type: "repeat_missing",
    title: "Reg45 test pattern",
    description: "Two missing episodes in 14 days.",
    severity: "high",
    window_start: todayMinus(20),
    window_end: todayMinus(0),
    evidence_refs: [],
    reflective_prompt: "Reflect on contextual safeguarding.",
    status: "open",
    acknowledged_by: null,
    acknowledged_at: null,
    resolution_note: null,
    is_ai_draft: true,
    detected_at: new Date().toISOString(),
  });
}

function seedComplaint() {
  return db.complaintOutcomeRecords.create({
    complaint_date: todayMinus(10),
    complainant: "Parent A",
    source: "parent_carer",
    theme: "communication",
    outcome: "upheld",
    investigated_by: "u1",
    date_resolved: todayMinus(3),
    response_time_days: 7,
    child_id: CHILD_ID,
    summary: "Reg45 test complaint summary about communication.",
    findings: "Improvements needed.",
    lessons_learned: "Daily call back.",
    practice_changes: ["call schedule"],
    complainant_satisfied: true,
    escalated: false,
    escalated_to: null,
    ofsted_notified: false,
    created_at: new Date().toISOString(),
  });
}

function wipe() {
  for (const item of db.caraReg45EvidenceItems.findAll(HOME_ID)) {
    db.caraReg45EvidenceItems.patch(item.id, { status: "rejected" });
  }
  for (const p of db.caraSafeguardingPatterns.findAll(HOME_ID)) {
    if (p.title === "Reg45 test pattern") {
      db.caraSafeguardingPatterns.patch(p.id, { status: "dismissed" });
    }
  }
}

describe("runReg45EvidenceBuild", () => {
  beforeEach(() => {
    wipe();
  });

  it("returns an empty snapshot for an unknown home", () => {
    const snap = runReg45EvidenceBuild("home_with_no_evidence_xyz");
    expect(snap.summary.total).toBe(0);
    expect(snap.summary.concerns).toBe(0);
  });

  it("drafts safeguarding evidence chips from a recent pattern", () => {
    seedSafeguardingPattern();
    const snap = runReg45EvidenceBuild(HOME_ID);
    const safeguarding = snap.themes.safeguarding;
    expect(safeguarding.length).toBeGreaterThan(0);
    const chip = safeguarding.find((e) => e.title === "Reg45 test pattern");
    expect(chip).toBeDefined();
    expect(chip!.status).toBe("ai_draft");
    expect(chip!.is_ai_draft).toBe(true);
    expect(chip!.severity).toBe("high");
    expect(chip!.sentiment).toBe("concern");
    expect(chip!.source_table).toBe("aria_safeguarding_patterns");
  });

  it("drafts a complaints_voice chip from a recent complaint", () => {
    seedComplaint();
    const snap = runReg45EvidenceBuild(HOME_ID);
    const complaints = snap.themes.complaints_voice;
    expect(complaints.length).toBeGreaterThan(0);
    // Target the complaint we seeded (for CHILD_ID) — demo home-level complaints
    // are null-child, so matching on child_id isolates the seeded record.
    const chip = complaints.find(
      (e) => e.source_table === "complaint_outcome_records" && e.child_id === CHILD_ID,
    );
    expect(chip).toBeDefined();
    expect(chip!.sentiment).toBe("positive"); // complainant_satisfied=true
  });

  it("is idempotent: rerunning patches the existing chip rather than creating a duplicate", () => {
    seedSafeguardingPattern();
    const a = runReg45EvidenceBuild(HOME_ID);
    const b = runReg45EvidenceBuild(HOME_ID);
    const aChips = a.themes.safeguarding.filter(
      (e) => e.title === "Reg45 test pattern" && e.status === "ai_draft",
    );
    const bChips = b.themes.safeguarding.filter(
      (e) => e.title === "Reg45 test pattern" && e.status === "ai_draft",
    );
    expect(aChips).toHaveLength(1);
    expect(bChips).toHaveLength(1);
    expect(aChips[0].id).toBe(bChips[0].id);
  });

  it("preserves manager decisions across reruns", () => {
    seedSafeguardingPattern();
    const a = runReg45EvidenceBuild(HOME_ID);
    const chip = a.themes.safeguarding.find((e) => e.title === "Reg45 test pattern");
    expect(chip).toBeDefined();
    db.caraReg45EvidenceItems.patch(chip!.id, {
      status: "accepted" as CaraReg45EvidenceItem["status"],
      decided_by: "u_manager",
      decided_at: new Date().toISOString(),
    });

    const b = runReg45EvidenceBuild(HOME_ID);
    const after = b.themes.safeguarding.find((e) => e.id === chip!.id);
    expect(after).toBeDefined();
    expect(after!.status).toBe("accepted");
    expect(after!.decided_by).toBe("u_manager");
  });

  it("loadReg45Evidence returns persisted items for the period", () => {
    seedSafeguardingPattern();
    runReg45EvidenceBuild(HOME_ID);
    const loaded = loadReg45Evidence(HOME_ID);
    expect(loaded.summary.total).toBeGreaterThan(0);
  });
});
