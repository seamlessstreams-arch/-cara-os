import { describe, it, expect, afterEach } from "vitest";
import { requireOnShift } from "../require-on-shift";
import { db } from "@/lib/db/store";

afterEach(() => {
  delete process.env.SHIFT_BASED_ACCESS_ENFORCED;
});

const reqAs = (uid: string) => new Request("http://localhost/api/v1/incidents/x", { headers: { "x-user-id": uid } });

describe("requireOnShift (enforcement ON by default)", () => {
  it("allows a manager (returns null)", () => {
    expect(requireOnShift(reqAs("staff_darren"))).toBeNull(); // staff_darren = registered_manager
  });

  it("blocks an off-shift general-staff user with a 403", () => {
    const res = requireOnShift(reqAs("ghost_rsw_offshift")); // unknown → rsw, off shift
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });

  it("allows an on-shift general-staff user", () => {
    const staffId = "staff_ros_onshift";
    const today = new Date().toISOString().slice(0, 10);
    db.shifts.create({
      staff_id: staffId, date: today, shift_type: "day", start_time: "08:00", end_time: "16:00",
      break_minutes: 0, actual_start: null, actual_end: null, clock_in_at: `${today}T08:00:00.000Z`,
      clock_out_at: null, overtime_minutes: 0, notes: null, status: "in_progress", is_open_shift: false,
      home_id: "home_oak", created_by: staffId, updated_by: staffId,
    });
    expect(requireOnShift(reqAs(staffId))).toBeNull();
  });

  it("kill-switch (=false) lets everyone proceed", () => {
    process.env.SHIFT_BASED_ACCESS_ENFORCED = "false";
    expect(requireOnShift(reqAs("ghost_rsw_offshift"))).toBeNull();
  });
});
