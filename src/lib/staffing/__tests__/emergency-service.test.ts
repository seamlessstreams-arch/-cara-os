import { describe, it, expect } from "vitest";
import { triggerEmergency, acknowledgeEmergency, resolveEmergency } from "../emergency-service";
import { db } from "@/lib/db/store";

const NOW = "2026-09-22T12:00:00.000Z";

describe("emergency service", () => {
  it("raises an alert and posts a privacy-safe broadcast to the emergency channel", () => {
    const { alert, broadcast_message_id } = triggerEmergency(
      { homeId: "home_oak", raisedBy: "staff_test_e1", raisedByName: "Test Worker", type: "fire", location: "kitchen" },
      NOW,
    );
    expect(alert.status).toBe("active");
    expect(alert.type).toBe("fire");
    expect(broadcast_message_id).toBeTruthy();

    // the broadcast message exists, is emergency priority, and is privacy-safe
    const msg = db.commsMessages.findById(broadcast_message_id!);
    expect(msg).toBeTruthy();
    expect(msg!.priority).toBe("emergency");
    expect(msg!.body).toMatch(/EMERGENCY/i);
    expect(msg!.body).toContain("Fire");
    expect(msg!.body).toContain("kitchen");
    // no child / medical / safeguarding detail leaks into the broadcast
    expect(msg!.body).not.toMatch(/child|medication|allegation|safeguarding|diagnos/i);
  });

  it("acknowledge adds a responder and is idempotent", () => {
    const { alert } = triggerEmergency(
      { homeId: "home_oak", raisedBy: "staff_test_e2", raisedByName: "Raiser", type: "medical" },
      NOW,
    );
    acknowledgeEmergency(alert.id, "staff_resp", "Responder", NOW);
    const again = acknowledgeEmergency(alert.id, "staff_resp", "Responder", NOW);
    expect(again?.responders).toHaveLength(1);
    expect(again?.responders[0].name).toBe("Responder");
  });

  it("resolve closes the alert and removes it from active", () => {
    const { alert } = triggerEmergency(
      { homeId: "home_oak", raisedBy: "staff_test_e3", raisedByName: "Raiser", type: "security" },
      NOW,
    );
    expect(db.emergencyAlerts.findActive("home_oak").some((a) => a.id === alert.id)).toBe(true);
    const resolved = resolveEmergency(alert.id, "staff_mgr", "2026-09-22T12:30:00.000Z");
    expect(resolved?.status).toBe("resolved");
    expect(resolved?.resolved_by).toBe("staff_mgr");
    expect(db.emergencyAlerts.findActive("home_oak").some((a) => a.id === alert.id)).toBe(false);
  });

  it("acknowledging a resolved alert returns null", () => {
    const { alert } = triggerEmergency(
      { homeId: "home_oak", raisedBy: "staff_test_e4", raisedByName: "Raiser", type: "other" },
      NOW,
    );
    resolveEmergency(alert.id, "m", NOW);
    expect(acknowledgeEmergency(alert.id, "x", "X", NOW)).toBeNull();
  });
});
