// Integration test: runs Staff–Child Continuity against the REAL demo store seed
// (the same mapping the API route performs), verifying the wiring end-to-end.
import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import {
  computeStaffChildContinuity,
  type ContinuityChildInput,
  type ContinuityStaffInput,
  type ContinuitySessionInput,
} from "../staff-child-continuity-engine";

const d = (v: unknown, fb = ""): string => (v == null ? fb : v.toString().slice(0, 10));

describe("staff-child-continuity integration (real seed data)", () => {
  const store = getStore();

  const children: ContinuityChildInput[] = (store.youngPeople as any[])
    .filter((yp) => yp.status === "current")
    .map((yp) => ({
      id: yp.id,
      name: yp.preferred_name || `${yp.first_name} ${yp.last_name}`.trim(),
      key_worker_id: yp.key_worker_id ?? null,
      secondary_worker_id: yp.secondary_worker_id ?? null,
    }));
  const staff: ContinuityStaffInput[] = (store.staff as any[]).map((s) => ({
    id: s.id,
    name: s.full_name ?? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
    active: s.is_active ?? s.employment_status === "active",
  }));
  const sessions: ContinuitySessionInput[] = (store.keyWorkingSessions as any[])
    .filter((k) => k.child_id && k.staff_id)
    .map((k) => ({ child_id: k.child_id, staff_id: k.staff_id, date: d(k.date ?? k.created_at) }));

  const result = computeStaffChildContinuity({ children, staff, sessions });
  const byName = (n: string) => result.children.find((c) => c.child_name === n);

  it("analyses every current child", () => {
    expect(result.children.length).toBe(children.length);
    expect(children.length).toBeGreaterThan(0);
  });

  it("surfaces Alex's continuity gap — his assigned key worker is not delivering his sessions", () => {
    const alex = byName("Alex");
    expect(alex).toBeDefined();
    // Alex's key worker (staff_edward) does not deliver his key-working sessions in the seed
    expect(alex!.key_worker_share).toBeLessThan(50);
    expect(alex!.flags.length).toBeGreaterThan(0);
  });

  it("rates Casey's continuity higher than Alex's (her key worker delivers her sessions)", () => {
    const alex = byName("Alex");
    const casey = byName("Casey");
    expect(casey).toBeDefined();
    expect(casey!.continuity_index).toBeGreaterThan(alex!.continuity_index);
  });

  it("orders weakest-first and produces a usable overview", () => {
    expect(result.children[0].continuity_index).toBeLessThanOrEqual(
      result.children[result.children.length - 1].continuity_index,
    );
    expect(result.overview.children_analysed).toBe(children.length);
    expect(typeof result.overview.avg_continuity_index).toBe("number");
  });
});
