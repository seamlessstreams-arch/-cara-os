// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — FILING CABINET SERVICE
// Pushes a committed Cara artifact into the filing cabinet so that the
// official record is searchable, indexed, and inspection-ready alongside
// every other care event derived document.
//
// Idempotent: re-committing or re-filing the same artifact upserts on
// (care_event_id + category) so we never duplicate.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type { CaraArtifact, CaraArtifactType } from "@/types/cara-studio";
import type { FilingCategory, FilingCabinetItem } from "@/types/care-events";

// ── Artifact type → filing category mapping ───────────────────────────────────

const ARTIFACT_TO_CATEGORY: Record<CaraArtifactType, FilingCategory> = {
  // Regulatory
  reg45_summary: "regulation_45",
  annex_a_update: "annex_a",
  ofsted_readiness_summary: "annex_a",

  // Safeguarding / risk
  safeguarding_review: "safeguarding",
  risk_review: "safeguarding",
  incident_learning_review: "incident",

  // Management
  management_oversight: "management_oversight",
  ri_briefing: "management_oversight",
  supervision_prompt: "management_oversight",
  team_meeting_discussion: "management_oversight",

  // Plans
  child_plan: "daily_care",
  placement_plan_update: "daily_care",
  care_plan_update: "daily_care",
  action_plan: "management_oversight",

  // Direct practice with the child
  keywork_session: "daily_care",
  direct_work_session: "daily_care",
  child_friendly_worksheet: "daily_care",
  child_friendly_explanation: "daily_care",
  reflective_workbook: "daily_care",
  visual_formulation: "daily_care",

  // Communication
  social_worker_update: "professional_contact",
  parent_professional_letter: "family_contact",

  // Training / staff development
  staff_training: "other",
  quiz: "other",
  flashcards: "other",
  reflective_practice_prompt: "other",
  scenario_simulation: "other",

  // Other generative outputs
  audio_briefing_script: "other",
  video_briefing_script: "other",
  slide_deck_outline: "other",
  mind_map: "other",
  timeline: "other",
};

// ── Filing path builder ───────────────────────────────────────────────────────

export function buildCaraFilingPath(artifact: CaraArtifact, category: FilingCategory): string {
  const filedAt = artifact.committed_at ? new Date(artifact.committed_at) : new Date();
  const year = filedAt.getFullYear();
  const month = filedAt.toLocaleString("en-GB", { month: "long" });
  const scope = artifact.child_id ? `Children/${artifact.child_id}` : `Home/${artifact.home_id}`;
  return `${scope}/${category}/${year}/${month}/${artifact.artifact_type}/${artifact.title}`;
}

// ── File a committed artifact ─────────────────────────────────────────────────

export interface FileArtifactResult {
  filed: boolean;
  reason?: string;
  item?: FilingCabinetItem;
  path: string;
}

export function fileCommittedArtifact(artifact: CaraArtifact): FileArtifactResult {
  if (artifact.status !== "committed") {
    return {
      filed: false,
      reason: "Artifact is not committed; only committed artifacts may be filed.",
      path: "",
    };
  }

  const category = ARTIFACT_TO_CATEGORY[artifact.artifact_type] ?? "other";
  const path = buildCaraFilingPath(artifact, category);

  // Idempotency key: pseudo-care-event id derived from artifact id.
  // Ensures upsert on (care_event_id + category) never duplicates.
  const careEventKey = `cara_${artifact.id}`;

  const item = db.filingCabinet.upsert({
    care_event_id: careEventKey,
    home_id: artifact.home_id,
    child_id: artifact.child_id,
    category,
    sub_category: artifact.artifact_type,
    title: artifact.title,
    description: artifact.plain_text_content
      ? artifact.plain_text_content.slice(0, 280)
      : artifact.generated_content.slice(0, 280),
    source_type: "cara_studio",
    linked_record_id: artifact.id,
    linked_record_table: "cara_artifacts",
    is_verified: true,
    verified_at: artifact.committed_at,
    verified_by: artifact.committed_by,
    tags: [
      "cara_studio",
      artifact.artifact_type,
      ...(artifact.framework && artifact.framework !== "none" ? [artifact.framework] : []),
    ],
    filed_at: artifact.committed_at ?? new Date().toISOString(),
  });

  return { filed: true, item, path };
}
