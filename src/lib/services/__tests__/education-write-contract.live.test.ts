import { describe, it, expect, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

// Education consolidation's write-contract proof (queue #108): the recording
// fake captures what each of the four education capture writers persists, and
// every payload key is checked against the columns the promotion migration
// creates — the guard that the promoted schema and the services agree, and
// that no judgement default was reintroduced.
vi.mock("@/lib/supabase/server", async () => {
  const { makeFakeSupabaseModule } = await import("@/lib/test-utils/fake-supabase");
  return makeFakeSupabaseModule({
    cs_education_records: [{ id: "er-1" }],
    cs_attendance_entries: [],
    cs_activities: [],
    cs_education_attendance_tracking: [{ id: "trk-1" }],
  });
});

import { recordedWrites, clearRecordedWrites } from "@/lib/test-utils/fake-supabase";
import { createEducationRecord, recordAttendance, recordActivity } from "../education-service";
import { createRecord as createAttendanceTracking } from "../education-attendance-tracking-service";

function columnsOf(table: string): Set<string> {
  const dir = path.join(process.cwd(), "supabase", "migrations");
  for (const f of fs.readdirSync(dir)) {
    const m = fs.readFileSync(path.join(dir, f), "utf8")
      .match(new RegExp(`create table if not exists ${table} \\(([^;]*?)\\n\\);`, "i"));
    if (!m) continue;
    const cols = new Set<string>();
    for (const line of m[1].split("\n")) {
      const cm = line.trim().match(/^"?([a-z0-9_]+)"?\s/);
      if (cm) cols.add(cm[1]);
    }
    return cols;
  }
  throw new Error(`no live migration creates ${table}`);
}

function payloadFor(table: string): Record<string, unknown> {
  const w = recordedWrites.find((x) => x.table === table && x.op === "insert");
  expect(w, `no insert recorded for ${table}`).toBeDefined();
  return w!.payload as Record<string, unknown>;
}

function assertColumnsMatch(table: string) {
  const cols = columnsOf(table);
  const bad = Object.keys(payloadFor(table)).filter((k) => !cols.has(k));
  expect(bad, `${table} payload keys absent from migration`).toEqual([]);
}

const HOME = "00000000-0000-0000-0000-000000000001";

describe("education write contract — every writer's payload matches the promotion migration", () => {
  beforeEach(() => clearRecordedWrites());

  it("createEducationRecord (the profile)", async () => {
    await createEducationRecord({
      home_id: HOME, child_id: "yp-1", education_status: "full_time_school",
      school_name: "Riverside Academy", year_group: "Year 10", sen_status: "ehcp",
      pupil_premium_plus: true, virtual_school_contact: "J. Vance", designated_teacher: "M. Poole",
      pep_date: "2026-07-01", next_pep_date: "2026-10-01", attendance_percentage: 92.5,
      achievements: ["Merit in Art"], concerns: [],
    });
    assertColumnsMatch("cs_education_records");
  });

  it("recordAttendance (a daily mark)", async () => {
    await recordAttendance({
      home_id: HOME, child_id: "yp-1", education_record_id: "er-1",
      date: "2026-09-08", mark: "present", session: "am", notes: null, recorded_by: "staff_darren",
    });
    assertColumnsMatch("cs_attendance_entries");
  });

  it("recordActivity — the child_enjoyed judgement is sent, never defaulted", async () => {
    await recordActivity({
      home_id: HOME, child_id: "yp-1", activity_name: "Climbing wall",
      category: "sport", date: "2026-09-07", duration_minutes: 90, location: "Leisure centre",
      description: "Indoor bouldering", child_feedback: "Loved it", child_enjoyed: true,
      skills_developed: ["resilience"], staff_member: "staff_anna",
    });
    assertColumnsMatch("cs_activities");
    expect(payloadFor("cs_activities").child_enjoyed).toBe(true);
  });

  it("createRecord (attendance tracking) — sessions are the recorder's, not a phantom 2/2 default", async () => {
    await createAttendanceTracking({
      homeId: HOME, attendanceStatus: "present", absenceReason: "none",
      schoolEngagement: "fully_engaged", educationSetting: "mainstream_school",
      attendanceDate: "2026-09-08", childName: "Amara O.", childId: "yp-1",
      recordedBy: "staff_darren", sessionsAttended: 4, sessionsPossible: 5,
    });
    assertColumnsMatch("cs_education_attendance_tracking");
    const p = payloadFor("cs_education_attendance_tracking");
    expect(p.sessions_attended).toBe(4);
    expect(p.sessions_possible).toBe(5);
  });
});
