import { describe, it, expect, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withShiftAccess } from "../with-shift-access";
import { db } from "@/lib/db/store";

afterEach(() => {
  delete process.env.SHIFT_BASED_ACCESS_ENFORCED;
});

const handler = async () => NextResponse.json({ ok: true });
const guarded = withShiftAccess("child_record", "view", handler);

function reqAs(userId: string): NextRequest {
  return new NextRequest("http://localhost/api/v1/young-people/yp1", { headers: { "x-user-id": userId } });
}

describe("withShiftAccess (enforcement ON by default)", () => {
  it("allows a manager (keeps off-shift access)", async () => {
    // staff_darren is seeded as a registered_manager
    const res = await guarded(reqAs("staff_darren"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("denies an off-shift general-staff user with 403", async () => {
    // unknown id → defaults to rsw (a gated role); no shift today → off shift
    const res = await guarded(reqAs("ghost_rsw_offshift"));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Access denied");
    expect(body.reason).toBeTruthy();
  });

  it("allows an on-shift general-staff user", async () => {
    const staffId = "staff_wsa_onshift";
    const today = new Date().toISOString().slice(0, 10);
    db.shifts.create({
      staff_id: staffId, date: today, shift_type: "day", start_time: "08:00", end_time: "16:00",
      break_minutes: 0, actual_start: null, actual_end: null, clock_in_at: `${today}T08:00:00.000Z`,
      clock_out_at: null, overtime_minutes: 0, notes: null, status: "in_progress", is_open_shift: false,
      home_id: "home_oak", created_by: staffId, updated_by: staffId,
    });
    const res = await guarded(reqAs(staffId));
    expect(res.status).toBe(200);
  });

  it("kill-switch (=false) lets everyone through", async () => {
    process.env.SHIFT_BASED_ACCESS_ENFORCED = "false";
    const res = await guarded(reqAs("ghost_rsw_offshift"));
    expect(res.status).toBe(200);
  });

  it("passes route context (params) through to the handler", async () => {
    let seen: unknown = null;
    const h = withShiftAccess("child_record", "view", async (_req, ctx) => {
      seen = ctx;
      return NextResponse.json({ ok: true });
    });
    await h(reqAs("staff_darren"), { params: Promise.resolve({ id: "yp1" }) });
    expect(seen).toEqual({ params: expect.anything() });
  });
});
