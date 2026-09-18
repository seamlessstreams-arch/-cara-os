import { describe, it, expect } from "vitest";
import { db } from "@/lib/db/store";
import { dal } from "@/lib/db";

// Approve / decline / return-to-work used to be a local override on the page
// (gone on refresh) because the collection had no update path. Pins the dal.
describe("leave requests can be decided and RTW recorded", () => {
  it("dal.leave.update persists status and the return-to-work interview", async () => {
    const created = await dal.leave.create({ staff_id: "staff_b", leave_type: "sickness", start_date: "2026-09-01", end_date: "2026-09-03", total_days: 3, reason: "flu", return_to_work_required: true } as never);
    const approved = await dal.leave.update(created.id, { status: "approved", approved_by: "staff_darren", approved_at: "2026-09-01T09:00:00Z" });
    expect(approved?.status).toBe("approved");
    const rtw = await dal.leave.update(created.id, { return_to_work_completed: true, return_to_work_date: "2026-09-04", return_to_work_by: "staff_darren", return_to_work_notes: "Discussed; fit to return." });
    expect(rtw?.return_to_work_completed).toBe(true);
    expect(rtw?.return_to_work_notes).toContain("fit to return");
    expect(db.leave.findAll().find((l) => l.id === created.id)?.status).toBe("approved");
  });

  it("returns null for an unknown id rather than creating one", async () => {
    expect(await dal.leave.update("no-such-leave", { status: "approved" })).toBeNull();
  });
});
