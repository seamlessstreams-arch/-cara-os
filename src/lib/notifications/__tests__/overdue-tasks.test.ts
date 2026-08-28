import { describe, it, expect } from "vitest";
import { generateNotifications } from "../notification-engine";
import { getStore } from "@/lib/db/store";

// The overdue filter asked for `status === "pending"`, which is not a
// TaskStatus, so it never matched and this engine never raised an overdue-task
// notification. Same literal as the Shift Mode filter fixed in #1047.

describe("overdue task notifications", () => {
  it("the seed has an overdue task to find — otherwise this proves nothing", () => {
    const today = new Date().toISOString().slice(0, 10);
    const overdue = getStore().tasks.filter(
      (t) =>
        t.status !== "completed" &&
        t.status !== "cancelled" &&
        t.due_date &&
        t.due_date < today,
    );
    expect(overdue.length).toBeGreaterThan(0);
  });

  it("raises one, rather than reporting nothing overdue", () => {
    const notifications = generateNotifications("staff_darren");
    expect(notifications.some((n) => n.type === "task_overdue")).toBe(true);
  });

  it("never raises one for a task that is finished or called off", () => {
    const raised = generateNotifications("staff_darren").filter((n) => n.type === "task_overdue");
    const byId = new Map(getStore().tasks.map((t) => [`notif_task_${t.id}`, t]));
    for (const n of raised) {
      const task = byId.get(n.id);
      expect(task).toBeTruthy();
      expect(["completed", "cancelled"]).not.toContain(task!.status);
    }
  });
});
