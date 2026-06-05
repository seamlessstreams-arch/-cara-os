import { describe, it, expect } from "vitest";
import { persistSignInVerification, persistEmergencyAlert } from "../workforce";
import type { SignInVerification } from "@/lib/attendance/presence-verification";
import type { EmergencyAlert } from "@/lib/staffing/emergency-types";

// With Supabase not configured (the test/demo backend), write-through is a safe no-op.
describe("workforce write-through (no-op when Supabase off)", () => {
  it("persistSignInVerification returns persisted:false without throwing", async () => {
    const v: SignInVerification = {
      id: "siv_t", staff_id: "s", shift_id: "sh", home_id: "home_oak",
      method: "kiosk", verified: true, band: "on_site", created_at: "2026-09-22T12:00:00.000Z",
    };
    const r = await persistSignInVerification(v);
    expect(r.persisted).toBe(false);
  });

  it("persistEmergencyAlert returns persisted:false without throwing", async () => {
    const a: EmergencyAlert = {
      id: "emrg_t", home_id: "home_oak", type: "fire", raised_by: "s", raised_by_name: "S",
      location: null, note: null, status: "active", responders: [], broadcast_message_id: null,
      created_at: "2026-09-22T12:00:00.000Z", resolved_at: null, resolved_by: null,
    };
    const r = await persistEmergencyAlert(a);
    expect(r.persisted).toBe(false);
  });
});
