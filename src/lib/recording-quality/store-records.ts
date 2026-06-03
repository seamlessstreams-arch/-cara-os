// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STORE → RECORD INPUT MAPPER
// Single source of truth for turning the store's narrative records (daily logs,
// incidents, key-working) into RecordInput for the recording-quality engine.
// Used by both the recording-quality and staff-recording-practice routes.
// ══════════════════════════════════════════════════════════════════════════════

import type { RecordInput } from "./recording-quality-engine";

export function mapStoreToRecords(store: any): RecordInput[] {
  const nameById = new Map(((store.youngPeople ?? []) as any[]).map((yp: any) => [yp.id, yp.preferred_name || `${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim()]));

  return [
    ...((store.dailyLog ?? []) as any[]).map((l: any): RecordInput => {
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
    ...((store.incidents ?? []) as any[]).map((i: any): RecordInput => {
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
    ...((store.keyWorkingSessions ?? []) as any[]).map((k: any): RecordInput => {
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
}
