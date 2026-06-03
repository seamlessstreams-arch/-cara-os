// Integration test: scores the REAL store's narrative records (daily logs,
// incidents, key-working) — the same mapping the API route performs.
import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { computeRecordingQuality, type RecordInput } from "../recording-quality-engine";

describe("recording-quality integration (real seed records)", () => {
  const store = getStore();
  const nameById = new Map((store.youngPeople as any[]).map((yp) => [yp.id, yp.preferred_name || `${yp.first_name} ${yp.last_name}`.trim()]));

  const records: RecordInput[] = [
    ...(store.dailyLog as any[]).map((l) => {
      const present: string[] = [];
      if ((l.content ?? "").trim()) present.push("content");
      if (l.mood_score != null) present.push("mood_score");
      if (l.entry_type) present.push("entry_type");
      return {
        id: l.id, type: "daily_log", text: l.content ?? "",
        expected_fields: ["content", "mood_score", "entry_type"], present_fields: present,
        child_name: nameById.get(l.child_id), staff_id: l.staff_id, date: l.date,
        is_risk_related: !!l.is_significant || l.entry_type === "behaviour",
      };
    }),
    ...(store.incidents as any[]).map((i) => {
      const present: string[] = [];
      if ((i.description ?? "").trim()) present.push("description");
      if ((i.immediate_action ?? "").trim()) present.push("immediate_action");
      if ((i.outcome ?? "").toString().trim()) present.push("outcome");
      return {
        id: i.id, type: "incident", text: `${i.description ?? ""} ${i.immediate_action ?? ""}`.trim(),
        expected_fields: ["description", "immediate_action", "outcome"], present_fields: present,
        child_name: nameById.get(i.child_id), staff_id: i.reported_by, date: i.date, is_risk_related: true,
      };
    }),
    ...(store.keyWorkingSessions as any[]).map((k) => {
      const present: string[] = [];
      if ((k.worker_observations ?? "").trim()) present.push("worker_observations");
      if ((k.child_voice ?? "").trim()) present.push("child_voice");
      if (Array.isArray(k.actions_agreed) && k.actions_agreed.length) present.push("actions_agreed");
      return {
        id: k.id, type: "keywork", text: `${k.worker_observations ?? ""} ${k.child_voice ?? ""}`.trim(),
        expected_fields: ["worker_observations", "child_voice", "actions_agreed"], present_fields: present,
        child_name: nameById.get(k.child_id), staff_id: k.staff_id, date: k.date,
      };
    }),
  ];

  const result = computeRecordingQuality({ records });

  it("scores the home's narrative records", () => {
    expect(records.length).toBeGreaterThan(0);
    expect(result.overview.records_scored).toBe(records.length);
    expect(result.overview.avg_overall).toBeGreaterThan(0);
  });

  it("every record carries all six dimensions in range", () => {
    for (const r of result.records) {
      for (const dim of ["completeness", "clarity", "professionalLanguage", "factuality", "childCentredness", "riskRelevance"] as const) {
        expect(r.score[dim]).toBeGreaterThanOrEqual(0);
        expect(r.score[dim]).toBeLessThanOrEqual(100);
      }
      expect(["strong", "good", "needs_improvement", "poor"]).toContain(r.band);
    }
  });

  it("ranks records weakest-first and identifies the weakest dimension", () => {
    for (let i = 1; i < result.records.length; i++) {
      expect(result.records[i - 1].overall).toBeLessThanOrEqual(result.records[i].overall);
    }
    expect(result.overview.weakest_dimension).toBeTruthy();
  });
});
