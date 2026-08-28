import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { PATCH } from "../route";
import { getStore } from "@/lib/db/store";

// Filling an open shift used to set status "confirmed". The rota page treats
// confirmed as published — its Publish action only touches shifts that are not
// already confirmed, and reports "Rota is already published" when none are left
// — so assigning someone silently published that shift.

function patch(body: Record<string, unknown>) {
  return PATCH(
    new NextRequest("http://localhost/api/v1/rota", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("assigning a shift does not publish it", () => {
  it("sets the shift to scheduled, not confirmed", async () => {
    const store = getStore();
    const shift = store.shifts.find((s) => s.date && s.start_time);
    expect(shift, "the seed must hold a shift for this to prove anything").toBeTruthy();

    const res = await patch({
      shift_date: shift!.date,
      start_time: shift!.start_time,
      staff_id: "staff_darren",
    });
    expect(res.status).toBeLessThan(300);
    const { data } = await res.json();
    expect(data.status).toBe("scheduled");
    expect(data.is_open_shift).toBe(false);
  });

  it("still honours a status the caller states explicitly", async () => {
    const store = getStore();
    const shift = store.shifts.find((s) => s.date && s.start_time);
    const res = await patch({
      shift_date: shift!.date,
      start_time: shift!.start_time,
      staff_id: "staff_darren",
      status: "confirmed",
    });
    const { data } = await res.json();
    expect(data.status).toBe("confirmed");
  });
});
