// Integration test: runs the Child Priority fusion against the REAL demo store
// seed data (the same mapping the API route performs), so the end-to-end wiring
// is verified without needing a running server.
import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import {
  computeChildPriority,
  type PriorityIncidentInput,
  type PriorityMedErrorInput,
} from "../child-priority-engine";

const d = (v: unknown, fb = ""): string => (v == null ? fb : v.toString().slice(0, 10));

describe("child-priority integration (real seed data)", () => {
  const store = getStore();

  const children = (store.youngPeople as any[])
    .filter((yp) => yp.status === "current")
    .map((yp) => ({
      id: yp.id,
      name: yp.preferred_name || `${yp.first_name} ${yp.last_name}`.trim(),
      date_of_birth: d(yp.date_of_birth),
      placement_start: d(yp.placement_start),
      placement_type: yp.placement_type ?? "unknown",
      risk_flags: Array.isArray(yp.risk_flags) ? yp.risk_flags : [],
    }));
  const incidents: PriorityIncidentInput[] = (store.incidents as any[])
    .filter((i) => i.child_id)
    .map((i) => ({ child_id: i.child_id, date: d(i.date ?? i.created_at), type: i.type ?? "other", severity: i.severity ?? "low" }));
  const complaints = (store.complaints as any[])
    .filter((c) => c.child_id)
    .map((c) => ({ child_id: c.child_id, date: d(c.date_received ?? c.created_at), category: c.category ?? "other", includes_safeguarding_element: !!c.includes_safeguarding_element, status: c.status ?? "received" }));
  const medicationErrors: PriorityMedErrorInput[] = (store.medicationErrors as any[])
    .filter((e) => e.child_id)
    .map((e) => ({ child_id: e.child_id, date: d(e.date_occurred ?? e.created_at), severity: e.severity ?? "no_harm" }));
  const missingEpisodes = (store.missingEpisodes as any[]).map((m) => ({ child_id: m.child_id ?? "", date_missing: d(m.date_missing ?? m.created_at), risk_level: m.risk_level ?? "low", return_interview_completed: !!m.return_interview_completed }));
  const restraints = (store.restraints as any[]).map((r) => ({ child_id: r.child_id ?? "", date: d(r.date ?? r.created_at) }));
  const sanctions = (store.sanctionRewards as any[]).map((s) => ({ child_id: s.child_id ?? "", date: d(s.date ?? s.created_at), direction: s.direction ?? "sanction", proportionate: s.proportionate !== false }));
  const behaviour = (store.behaviourLog as any[]).map((b) => ({ child_id: b.child_id ?? "", date: d(b.date ?? b.created_at), direction: b.direction ?? "concern", intensity: b.intensity ?? "low" }));
  const education = (store.educationRecords as any[]).map((e) => ({ child_id: e.child_id ?? "", date: d(e.date ?? e.created_at), attendance_status: e.attendance_status ?? null }));
  const keyworking = (store.keyWorkingSessions as any[]).map((k) => ({ child_id: k.child_id ?? "", date: d(k.date ?? k.created_at), mood_before: typeof k.mood_before === "number" ? k.mood_before : 3, mood_after: typeof k.mood_after === "number" ? k.mood_after : 3 }));
  const staff = (store.staff as any[]).map((s) => ({ id: s.id, name: s.full_name ?? s.id, active: s.is_active ?? s.employment_status === "active" }));
  const keyWorkingSessions = (store.keyWorkingSessions as any[]).filter((k) => k.child_id && k.staff_id).map((k) => ({ child_id: k.child_id, staff_id: k.staff_id, date: d(k.date ?? k.created_at) }));
  const keyWorkers = (store.youngPeople as any[]).filter((yp) => yp.status === "current").map((yp) => ({ child_id: yp.id, key_worker_id: yp.key_worker_id ?? null, secondary_worker_id: yp.secondary_worker_id ?? null }));

  const result = computeChildPriority({
    children, incidents, complaints, medicationErrors,
    missingEpisodes, restraints, sanctions, behaviour, education, keyworking,
    staff, keyWorkingSessions, keyWorkers,
  });

  it("produces a ranked priority list from real data", () => {
    expect(result.children.length).toBeGreaterThan(0);
    expect(result.overview.children_analysed).toBe(result.children.length);
  });

  it("ranks Alex #1 as a critical, multi-stream, safeguarding priority", () => {
    const top = result.children[0];
    expect(top.child_name).toBe("Alex");
    expect(top.rank).toBe(1);
    expect(top.multi_domain).toBe(true);
    expect(top.safeguarding).toBe(true);
    expect(top.priority_band).toBe("critical");
    // Alex is flagged across placement, complaints AND continuity streams
    const domains = top.domains.map((x) => x.domain);
    expect(domains).toContain("placement");
    expect(domains).toContain("complaints");
    expect(domains).toContain("continuity"); // his key worker delivers none of his sessions
  });

  it("surfaces a multi-stream ARIA insight and a top action for the lead child", () => {
    expect(result.overview.multi_domain_count).toBeGreaterThanOrEqual(1);
    expect(result.children[0].top_action).not.toBeNull();
    expect(result.insights.some((i) => i.severity === "critical")).toBe(true);
  });
});
