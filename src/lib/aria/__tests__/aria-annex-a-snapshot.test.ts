// ══════════════════════════════════════════════════════════════════════════════
// ARIA Annex A Live Snapshot — engine tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { db } from "@/lib/db/store";
import {
  buildAnnexASnapshotData,
  runAnnexASnapshot,
  lockAnnexASnapshot,
  loadAnnexASnapshots,
} from "@/lib/aria/aria-annex-a-snapshot";
import { ARIA_ANNEX_A_SECTIONS } from "@/types/aria-studio";

const HOME_ID = "home_oak";

function todayMinus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

describe("Annex A Snapshot engine", () => {
  it("produces a reading for every Annex A section", () => {
    const data = buildAnnexASnapshotData(HOME_ID);
    expect(data.sections.length).toBe(ARIA_ANNEX_A_SECTIONS.length);
    for (const def of ARIA_ANNEX_A_SECTIONS) {
      const reading = data.sections.find((s) => s.key === def.key);
      expect(reading, `missing section ${def.key}`).toBeDefined();
      expect(reading!.label).toBe(def.label);
    }
  });

  it("computes a readiness_score and overall traffic light", () => {
    const data = buildAnnexASnapshotData(HOME_ID);
    expect(data.readiness_score).toBeGreaterThanOrEqual(0);
    expect(data.readiness_score).toBeLessThanOrEqual(100);
    expect(["green", "amber", "red"]).toContain(data.overall_readiness);
  });

  it("returns a non-green readiness for an unknown home with no data", () => {
    const data = buildAnnexASnapshotData("home_with_no_data_xyz");
    expect(["red", "amber"]).toContain(data.overall_readiness);
    const s2 = data.sections.find((s) => s.key === "section_2");
    expect(s2!.record_count).toBe(0);
    const s3 = data.sections.find((s) => s.key === "section_3");
    // Staffing required → red when no staff.
    expect(s3!.readiness).toBe("red");
  });

  it("flags missing return interview as a section 6 gap", () => {
    const yp = db.youngPeople.findAll().find((y) => y.home_id === HOME_ID);
    expect(yp).toBeDefined();
    const ep = db.missingEpisodes.create({
      reference: "ME-AXA-TEST",
      child_id: yp!.id,
      date_missing: todayMinus(20),
      time_missing: "14:00",
      date_returned: todayMinus(20),
      time_returned: "20:00",
      duration_hours: 6,
      risk_level: "medium",
      location_last_seen: "Town centre",
      return_location: "Home",
      reported_to_police: true,
      police_reference: "P-1",
      reported_to_la: true,
      la_notified_at: new Date().toISOString(),
      return_interview_completed: false,
      return_interview_by: null,
      return_interview_date: null,
      return_interview_notes: null,
      contextual_safeguarding_risk: false,
      linked_incident_id: null,
      pattern_notes: null,
      status: "returned",
      home_id: HOME_ID,
      created_at: new Date().toISOString(),
      created_by: "u1",
    });
    try {
      const data = buildAnnexASnapshotData(HOME_ID);
      const s6 = data.sections.find((s) => s.key === "section_6")!;
      expect(s6.record_count).toBeGreaterThan(0);
      expect(s6.gap_count).toBeGreaterThan(0);
      expect(s6.issues.some((i) => i.includes("return interview"))).toBe(true);
    } finally {
      // Best-effort cleanup: mark closed with completed interview so it
      // doesn't leak into other tests.
      db.missingEpisodes.patch?.(ep.id, {
        return_interview_completed: true,
        status: "closed",
      });
    }
  });

  it("persists snapshots and refreshes the latest draft idempotently for the same period", () => {
    const a = runAnnexASnapshot(HOME_ID);
    const b = runAnnexASnapshot(HOME_ID);
    expect(b.id).toBe(a.id);
    expect(b.generated_at >= a.generated_at).toBe(true);
    const all = loadAnnexASnapshots(HOME_ID);
    const drafts = all.filter(
      (s) => s.status === "draft" && s.period_start === a.period_start && s.period_end === a.period_end,
    );
    expect(drafts.length).toBe(1);
  });

  it("locking a snapshot freezes it and a new run creates a fresh draft", () => {
    const a = runAnnexASnapshot(HOME_ID);
    const locked = lockAnnexASnapshot(a.id, "u1", "ready for inspection");
    expect(locked).toBeDefined();
    expect(locked!.status).toBe("locked");
    expect(locked!.locked_by).toBe("u1");
    expect(locked!.locked_at).toBeTruthy();

    const b = runAnnexASnapshot(HOME_ID);
    expect(b.id).not.toBe(a.id);
    expect(b.status).toBe("draft");

    // Locked snapshot stays locked even on second lock attempt.
    const reLocked = lockAnnexASnapshot(a.id, "u2", "again");
    expect(reLocked!.status).toBe("locked");
    expect(reLocked!.locked_by).toBe("u1");
  });
});
