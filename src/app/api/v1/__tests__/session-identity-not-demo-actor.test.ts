// ══════════════════════════════════════════════════════════════════════════════
// The CALLER is the actor — never the demo seed id
//
// "staff_darren" is the demo store's Registered Manager. It leaked into live
// request paths two ways, and both were invisible:
//
//   • /api/v1/dashboard filtered "my tasks" to assigned_to === "staff_darren",
//     so on a live tenant (where the id is a staff_members UUID) the panel was
//     always empty however many tasks the manager had.
//   • POST /api/v1/calendar never received an organiser_id from the client, so
//     the Zod default stamped every live event "staff_darren" — a person absent
//     from staff_members. Each reminder then addressed a notification to nobody,
//     and every task linked to the event was assigned to nobody.
//
// Neither is fiction and neither throws, so CI and the live-fiction crawl both
// passed over them. These tests read the identity the way the routes now do:
// through getRequestIdentity, which is the x-user-id header in demo and the
// signed-in staff member on a live tenant.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as dashboardGET } from "../dashboard/route";
import { POST as calendarPOST } from "../calendar/route";
import { db, getStore } from "@/lib/db/store";

const OTHER = "staff_someone_else";

function req(url: string, init?: RequestInit) {
  return new NextRequest(new Request(url, init));
}

describe("/api/v1/dashboard — my tasks belong to the caller", () => {
  beforeEach(() => {
    getStore().tasks.length = 0;
    // Deliberately UNEVEN: two for the caller, one for the demo id. An even
    // split would let the old constant-filter pass by coincidence.
    for (const [assignee, title] of [[OTHER, "Theirs 1"], [OTHER, "Theirs 2"], ["staff_darren", "Darren's"]] as const) {
      db.tasks.create({
        title, description: "", category: "admin", priority: "medium",
        status: "not_started", due_date: null, assigned_to: assignee,
        linked_child_id: null, home_id: "home_oak",
        created_by: assignee, updated_by: assignee,
      } as Parameters<typeof db.tasks.create>[0]);
    }
  });

  it("counts only the caller's own tasks", async () => {
    const res = await dashboardGET(req("http://t/api/v1/dashboard", { headers: { "x-user-id": OTHER } }));
    const json = await res.json();
    expect(json.data.tasks.my_tasks).toBe(2);
  });

  it("a different caller gets a different count — the filter is not a constant", async () => {
    const mine = await (await dashboardGET(req("http://t/api/v1/dashboard", { headers: { "x-user-id": OTHER } }))).json();
    const theirs = await (await dashboardGET(req("http://t/api/v1/dashboard", { headers: { "x-user-id": "staff_darren" } }))).json();
    expect(mine.data.tasks.my_tasks).toBe(2);
    expect(theirs.data.tasks.my_tasks).toBe(1);
  });

  it("a caller with no tasks gets zero, not everyone's", async () => {
    const res = await dashboardGET(req("http://t/api/v1/dashboard", { headers: { "x-user-id": "staff_nobody" } }));
    const json = await res.json();
    expect(json.data.tasks.my_tasks).toBe(0);
  });
});

describe("POST /api/v1/calendar — the organiser is the caller", () => {
  const body = {
    title: "Supervision",
    start: "2099-01-01T10:00",
    attendees: [],
  };

  it("stamps the caller as organiser, not the schema's demo default", async () => {
    const res = await calendarPOST(req("http://t/api/v1/calendar", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": OTHER },
      body: JSON.stringify(body),
    }));
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.data.event.organiser_id).toBe(OTHER);
    expect(json.data.event.organiser_id).not.toBe("staff_darren");
  });

  it("ignores an organiser_id supplied in the body — the session decides", async () => {
    const res = await calendarPOST(req("http://t/api/v1/calendar", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": OTHER },
      body: JSON.stringify({ ...body, organiser_id: "staff_impersonated" }),
    }));
    const json = await res.json();
    expect(json.data.event.organiser_id).toBe(OTHER);
  });

  it("a task linked to the event is assigned to the caller, not the demo id", async () => {
    const res = await calendarPOST(req("http://t/api/v1/calendar", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": OTHER },
      body: JSON.stringify({ ...body, tasks: [{ title: "Prepare notes" }] }),
    }));
    const json = await res.json();
    const taskId = json.data.event.linked_task_ids[0];
    expect(taskId).toBeTruthy();
    const task = getStore().tasks.find((t) => t.id === taskId);
    expect(task?.assigned_to).toBe(OTHER);
  });
});
