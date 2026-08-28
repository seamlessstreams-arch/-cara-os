// Integration test: proves the full chain — REAL store → canonical event stream
// (projector) → stream-native analytics (event-intelligence engine).
import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildEventStream } from "@/lib/event-stream/event-projector";
import { computeEventIntelligence } from "../event-intelligence-engine";

const d = (v: unknown, fb = ""): string => (v == null ? fb : v.toString().slice(0, 10));

describe("event-intelligence integration (store → projector → analytics)", () => {
  const store = getStore();

  // Project the store into the canonical stream (subset of sources is enough here).
  const stream = buildEventStream({
    homeId: "home_oak",
    incidents: ((store.incidents)).map((i) => ({
      id: i.id, child_id: i.child_id, type: i.type, severity: i.severity, date: d(i.date ?? i.created_at), time: i.time,
      description: i.description, status: i.status, requires_oversight: i.requires_oversight, body_map_required: i.body_map_required,
      body_map_completed: i.body_map_completed, outcome: i.outcome, reported_by: i.reported_by, home_id: i.home_id, created_at: i.created_at, updated_at: i.updated_at,
    })),
    missingEpisodes: ((store.missingEpisodes)).map((m) => ({
      id: m.id, child_id: m.child_id, date_missing: d(m.date_missing ?? m.created_at), risk_level: m.risk_level,
      reported_to_police: m.reported_to_police, reported_to_la: m.reported_to_la, return_interview_completed: m.return_interview_completed,
      status: m.status, home_id: m.home_id, created_at: m.created_at,
    })),
    medicationErrors: ((store.medicationErrors)).map((e) => ({
      id: e.id, child_id: e.child_id, date_occurred: d(e.date_occurred ?? e.created_at), error_type: e.error_type, severity: e.severity,
      medication: e.medication, duty_of_candour: e.duty_of_candour, duty_of_candour_completed: e.duty_of_candour_completed, status: e.status, created_at: e.created_at,
    })),
    restraints: ((store.restraints)).map((r) => ({
      id: r.id, child_id: r.child_id, date: d(r.date ?? r.created_at), injuries_count: Array.isArray(r.injuries) ? r.injuries.length : 0,
      child_debriefed: r.child_debriefed, created_at: r.created_at,
    })),
  });

  const children = ((store.youngPeople))
    .filter((yp) => yp.status === "current")
    .map((yp) => ({ id: yp.id, name: yp.preferred_name || `${yp.first_name} ${yp.last_name}`.trim() }));

  // Feed the canonical stream straight into the analytics engine.
  const result = computeEventIntelligence({ events: stream.events, children });

  it("produces analytics directly from the canonical stream", () => {
    expect(stream.events.length).toBeGreaterThan(0);
    expect(result.overview.total_events).toBeGreaterThan(0);
    expect(result.child_radar.length).toBeGreaterThan(0);
  });

  it("builds a per-child risk radar with a top-ranked child", () => {
    expect(result.child_radar[0].risk_score).toBeGreaterThanOrEqual(result.child_radar[result.child_radar.length - 1].risk_score);
    expect(result.overview.most_at_risk_child).toBeTruthy();
  });

  it("surfaces an approval backlog and a compliance register from the stream", () => {
    expect(result.overview.pending_approvals).toBeGreaterThan(0);
    expect(result.compliance_register.length).toBeGreaterThan(0);
    expect(result.theme_trends.length).toBeGreaterThan(0);
  });
});
