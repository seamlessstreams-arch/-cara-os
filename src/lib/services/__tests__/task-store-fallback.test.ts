import { describe, it, expect, afterEach } from "vitest";
import { getStore } from "@/lib/db/store";
import {
  createTask, completeTask, signOffTask, getTask, listTasks,
} from "../task-service";

// Phase 2 write-path consolidation: task-service was Supabase-only, so the
// operations/tasks surface was dead in the demo. These prove the demo fallback
// makes the write paths live against the same db.tasks store /v1 uses.
// (Supabase is not configured in the test env, so these hit the fallback.)

const HOME = "home_oak";
const created: string[] = [];
afterEach(() => {
  const tasks = getStore().tasks;
  for (const id of created) {
    const i = tasks.findIndex((t) => t.id === id);
    if (i >= 0) tasks.splice(i, 1);
  }
  created.length = 0;
});

describe("task-service demo fallback (writes now live)", () => {
  it("createTask persists to db.tasks and returns a referenced task", async () => {
    const before = getStore().tasks.length;
    const r = await createTask({ homeId: HOME, title: "Check window restrictors", category: "compliance", created_by: "staff_darren" });
    expect(r.ok).toBe(true);
    if (!r.ok || !r.data) return;
    const task = r.data;
    created.push(task.id);
    expect(getStore().tasks.length).toBe(before + 1);
    expect(task.reference).toMatch(/^COM-\d{3}$/);
    expect(task.status).toBe("not_started");
    // visible to the same store /v1 reads
    expect(getStore().tasks.find((t) => t.id === task.id)).toBeTruthy();
  });

  it("completeTask honours requires_sign_off (→ awaiting_sign_off), signOffTask closes it", async () => {
    const c = await createTask({ homeId: HOME, title: "Medication audit", category: "medication", requires_sign_off: true, created_by: "staff_ryan" });
    expect(c.ok).toBe(true);
    if (!c.ok || !c.data) return;
    created.push(c.data.id);

    const done = await completeTask(c.data.id, "staff_ryan", "Counted against MAR");
    expect(done.ok).toBe(true);
    expect(done.ok && done.data?.status).toBe("awaiting_sign_off"); // not completed yet

    const signed = await signOffTask(c.data.id, "staff_darren");
    expect(signed.ok).toBe(true);
    if (!signed.ok || !signed.data) return;
    expect(signed.data.status).toBe("completed");
    expect(signed.data.signed_off_by).toBe("staff_darren");
    expect(signed.data.completed_at).toBeTruthy();
  });

  it("completeTask on a no-sign-off task completes immediately", async () => {
    const c = await createTask({ homeId: HOME, title: "Bins out", category: "admin", created_by: "staff_darren" });
    if (!c.ok || !c.data) return;
    created.push(c.data.id);
    const done = await completeTask(c.data.id, "staff_darren");
    expect(done.ok && done.data?.status).toBe("completed");
  });

  it("getTask + listTasks read the same store", async () => {
    const c = await createTask({ homeId: HOME, title: "Fire drill", category: "compliance", created_by: "staff_darren" });
    if (!c.ok || !c.data) return;
    created.push(c.data.id);
    const got = await getTask(c.data.id);
    expect(got.ok && got.data?.title).toBe("Fire drill");
    const list = await listTasks(HOME, { category: "compliance" });
    expect(list.ok).toBe(true);
    const cid = c.data.id;
    expect(list.ok && (list.data ?? []).some((t) => t.id === cid)).toBe(true);
  });
});
