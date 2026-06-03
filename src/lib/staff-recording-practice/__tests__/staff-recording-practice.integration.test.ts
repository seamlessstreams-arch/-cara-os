// Integration test: REAL store → recording-quality scores → staff practice rollup.
import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { computeRecordingQuality, type RecordInput } from "@/lib/recording-quality/recording-quality-engine";
import { computeStaffRecordingPractice } from "../staff-recording-practice-engine";

describe("staff-recording-practice integration (recording quality → by staff)", () => {
  const store = getStore();
  const nameById = new Map((store.youngPeople as any[]).map((yp) => [yp.id, yp.preferred_name || `${yp.first_name} ${yp.last_name}`.trim()]));
  const staff = (store.staff as any[]).map((s) => ({ id: s.id, name: s.full_name ?? s.id }));

  const records: RecordInput[] = [
    ...(store.dailyLog as any[]).map((l) => ({
      id: l.id, type: "daily_log", text: l.content ?? "",
      expected_fields: ["content"], present_fields: (l.content ?? "").trim() ? ["content"] : [],
      child_name: nameById.get(l.child_id), staff_id: l.staff_id, date: l.date,
      is_risk_related: !!l.is_significant,
    })),
    ...(store.keyWorkingSessions as any[]).map((k) => ({
      id: k.id, type: "keywork", text: `${k.worker_observations ?? ""} ${k.child_voice ?? ""}`.trim(),
      expected_fields: ["worker_observations"], present_fields: (k.worker_observations ?? "").trim() ? ["worker_observations"] : [],
      child_name: nameById.get(k.child_id), staff_id: k.staff_id, date: k.date,
    })),
  ];

  const quality = computeRecordingQuality({ records });
  const result = computeStaffRecordingPractice({ records: quality.records, staff });

  it("rolls record quality up to named staff", () => {
    expect(quality.records.length).toBeGreaterThan(0);
    expect(result.staff_profiles.length).toBeGreaterThan(0);
    // every profile is a real, named staff member with at least one record
    for (const p of result.staff_profiles) {
      expect(p.records_authored).toBeGreaterThan(0);
      expect(p.staff_name).not.toBe(p.staff_id); // resolved to a name
      expect(p.avg_overall).toBeGreaterThanOrEqual(0);
      expect(p.avg_overall).toBeLessThanOrEqual(100);
    }
  });

  it("orders weakest practice first and produces a usable overview", () => {
    for (let i = 1; i < result.staff_profiles.length; i++) {
      expect(result.staff_profiles[i - 1].avg_overall).toBeLessThanOrEqual(result.staff_profiles[i].avg_overall);
    }
    expect(result.overview.staff_analysed).toBe(result.staff_profiles.length);
    expect(result.overview.home_avg_overall).toBeGreaterThan(0);
  });

  it("gives each member a weakest dimension and (where relevant) a top suggestion", () => {
    for (const p of result.staff_profiles) {
      expect(["completeness", "clarity", "professionalLanguage", "factuality", "childCentredness", "riskRelevance"]).toContain(p.weakest_dimension);
    }
  });
});
