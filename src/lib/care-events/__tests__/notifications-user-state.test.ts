// ══════════════════════════════════════════════════════════════════════════════
// Notifications — per-user read/dismiss state tests (Milestone 34)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  loadNotifications,
  loadNotificationsForUser,
} from "@/lib/care-events/notifications";
import type { CareEvent } from "@/types/care-events";

const HOME_ID = "home_user_notif_test";
const USER_ID = "user_alice";

function clearAll() {
  const evs = db.careEvents.findAll();
  for (let i = evs.length - 1; i >= 0; i--) {
    if (evs[i].home_id === HOME_ID) evs.splice(i, 1);
  }
  const states = db.userNotificationStates.findForUser(USER_ID, HOME_ID);
  // Wipe tracked states by re-upserting them as un-read/un-dismissed —
  // collection has no delete; this mirrors normal user flow.
  for (const s of states) {
    db.userNotificationStates.upsert({
      user_id: USER_ID,
      notification_id: s.notification_id,
      home_id: HOME_ID,
      read_at: null,
      dismissed_at: null,
    });
  }
}

function seedManagerReview(): CareEvent {
  return db.careEvents.create({
    home_id: HOME_ID,
    child_id: "yp_x",
    title: "needs review",
    content: "c",
    category: "general",
    is_current_version: true,
    event_date: "2026-05-01",
    status: "manager_review_required",
  } as Parameters<typeof db.careEvents.create>[0]);
}

beforeEach(() => clearAll());

describe("loadNotificationsForUser (M34)", () => {
  it("populates empty per-user envelope when no state exists", () => {
    const e = seedManagerReview();
    const stream = loadNotificationsForUser(HOME_ID, USER_ID);
    const item = stream.items.find((i) => i.id === `manager_review_required:${e.id}`);
    expect(item).toBeDefined();
    expect(item!.read_at).toBeNull();
    expect(item!.dismissed_at).toBeNull();
    expect(stream.viewer_user_id).toBe(USER_ID);
    expect(stream.unread).toBe(stream.total);
    expect(stream.dismissed).toBe(0);
  });

  it("marks an item as read", () => {
    const e = seedManagerReview();
    const id = `manager_review_required:${e.id}`;
    db.userNotificationStates.upsert({
      user_id: USER_ID,
      notification_id: id,
      home_id: HOME_ID,
      read_at: "2026-05-02T10:00:00.000Z",
    });
    const stream = loadNotificationsForUser(HOME_ID, USER_ID);
    const item = stream.items.find((i) => i.id === id)!;
    expect(item.read_at).toBe("2026-05-02T10:00:00.000Z");
    expect(stream.unread).toBe(0);
  });

  it("hides dismissed items by default", () => {
    const e = seedManagerReview();
    const id = `manager_review_required:${e.id}`;
    db.userNotificationStates.upsert({
      user_id: USER_ID,
      notification_id: id,
      home_id: HOME_ID,
      dismissed_at: "2026-05-02T10:00:00.000Z",
    });
    const stream = loadNotificationsForUser(HOME_ID, USER_ID);
    expect(stream.items.find((i) => i.id === id)).toBeUndefined();
    expect(stream.total).toBe(0);
  });

  it("includes dismissed when asked", () => {
    const e = seedManagerReview();
    const id = `manager_review_required:${e.id}`;
    db.userNotificationStates.upsert({
      user_id: USER_ID,
      notification_id: id,
      home_id: HOME_ID,
      dismissed_at: "2026-05-02T10:00:00.000Z",
    });
    const stream = loadNotificationsForUser(HOME_ID, USER_ID, {
      includeDismissed: true,
    });
    expect(stream.items.find((i) => i.id === id)).toBeDefined();
    expect(stream.dismissed).toBe(1);
  });

  it("base loadNotifications ignores per-user state", () => {
    const e = seedManagerReview();
    db.userNotificationStates.upsert({
      user_id: USER_ID,
      notification_id: `manager_review_required:${e.id}`,
      home_id: HOME_ID,
      dismissed_at: "2026-05-02T10:00:00.000Z",
    });
    const stream = loadNotifications(HOME_ID);
    expect(stream.total).toBeGreaterThan(0);
    expect(stream.viewer_user_id).toBeNull();
    expect(stream.unread).toBeNull();
  });

  it("upsert is idempotent on (user_id, notification_id)", () => {
    db.userNotificationStates.upsert({
      user_id: USER_ID,
      notification_id: "n_1",
      home_id: HOME_ID,
      read_at: "2026-05-01T00:00:00.000Z",
    });
    db.userNotificationStates.upsert({
      user_id: USER_ID,
      notification_id: "n_1",
      home_id: HOME_ID,
      dismissed_at: "2026-05-02T00:00:00.000Z",
    });
    const all = db.userNotificationStates.findForUser(USER_ID, HOME_ID).filter(
      (s) => s.notification_id === "n_1",
    );
    expect(all.length).toBe(1);
    expect(all[0].read_at).toBe("2026-05-01T00:00:00.000Z");
    expect(all[0].dismissed_at).toBe("2026-05-02T00:00:00.000Z");
  });

  it("isolates state by user", () => {
    db.userNotificationStates.upsert({
      user_id: USER_ID,
      notification_id: "n_iso",
      home_id: HOME_ID,
      read_at: "2026-05-01T00:00:00.000Z",
    });
    const other = db.userNotificationStates.findForUser("user_bob", HOME_ID);
    expect(other.find((s) => s.notification_id === "n_iso")).toBeUndefined();
  });
});
