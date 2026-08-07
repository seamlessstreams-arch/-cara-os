// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PRACTICE SKILLS: store-shape → engine input (shared mapper)
//
// Extracted from /api/v1/staff-practice-skills so the API and the §31 export
// pack share ONE practice-skills read — one mapper, one answer. The shape is a
// typed Pick composed from the dual-mode dal by each route; the engine stays
// pure and this mapper stays deterministic.
// ══════════════════════════════════════════════════════════════════════════════

import type { getStore } from "@/lib/db/store";
import { COMPETENCY_DOMAIN_LABELS } from "@/types/extended";
import type { StaffPracticeSkillsInput } from "./types";

export type StaffSkillsShape = Pick<
  ReturnType<typeof getStore>,
  "competencyScores" | "keyWorkingSessions" | "practiceObservations" | "reflectiveSupervisions" | "staff" | "writingAssistantAuditEvents"
>;

const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);
const num = (v: unknown): number => (typeof v === "number" ? v : Number(v) || 0);

export const staffDisplayName = (s: {
  id?: string;
  name?: string | null;
  preferred_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}): string => s.name || s.preferred_name || [s.first_name, s.last_name].filter(Boolean).join(" ") || "Staff member";

export function buildStaffSkillsInput(store: StaffSkillsShape, staffId: string, staffName: string, asOf: string): StaffPracticeSkillsInput {
  return {
    staffId,
    staffName,
    asOf,
    windowDays: 180,
    domainLabels: COMPETENCY_DOMAIN_LABELS as unknown as Record<string, string>,
    competencyScores: (store.competencyScores ?? [])
      .filter((c: { staff_id?: string }) => c.staff_id === staffId)
      .map((c) => ({ id: String(c.id), staff_id: String(c.staff_id), domain: String(c.domain ?? ""), score: num(c.score), assessed_at: String(c.assessed_at ?? c.created_at ?? "") })),
    observations: (store.practiceObservations ?? [])
      .filter((o: { staff_id?: string }) => o.staff_id === staffId)
      .map((o) => ({ id: String(o.id), staff_id: String(o.staff_id), observation_date: String(o.observation_date ?? ""), outcome: String(o.outcome ?? ""), strengths_noted: arr(o.strengths_noted), areas_for_development: arr(o.areas_for_development) })),
    supervisions: (store.reflectiveSupervisions ?? [])
      .filter((s: { staff_id?: string }) => s.staff_id === staffId)
      .map((s) => ({ id: String(s.id), staff_id: String(s.staff_id), date: String(s.date ?? ""), wellbeing_score: num(s.wellbeing_score), confidence_level: num(s.confidence_level), training_needs: arr(s.training_needs) })),
    recordingAudits: (store.writingAssistantAuditEvents ?? [])
      .filter((a: { user_id?: string }) => a.user_id === staffId)
      .map((a) => ({ id: String(a.id), staff_id: String(a.user_id ?? ""), action: String(a.action ?? ""), created_at: String(a.created_at ?? "") })),
    keyWork: (store.keyWorkingSessions ?? [])
      .filter((k: { staff_id?: string }) => k.staff_id === staffId)
      .map((k) => ({ id: String(k.id), staff_id: String(k.staff_id), date: String(k.date ?? ""), child_voice: String(k.child_voice ?? "") })),
  };
}
