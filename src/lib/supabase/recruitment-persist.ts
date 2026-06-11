// ══════════════════════════════════════════════════════════════════════════════
// CARA — Safer-recruitment write-through helpers
//
// Same contract as the other persist modules: best-effort, never throws,
// no-op in demo mode. References upsert by their application TEXT id so the
// link-issue → referee-submission → verification lifecycle lands on one row.
// `createRecruitmentAuditRecord` is the canonical way for routes to write an
// audit entry: in-memory first, durable when Supabase is on.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { isSupabaseEnabled, createServerClient } from "./server";
import type { CandidateReference, RecruitmentAuditEntry } from "@/types/recruitment";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawClient = { from(table: string): any };
function raw(c: NonNullable<ReturnType<typeof createServerClient>>): RawClient {
  return c as unknown as RawClient;
}

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

/** Upsert the full reference row by its application id. */
export async function persistCandidateReference(ref: CandidateReference): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    await raw(c).from("recruitment_candidate_references").upsert(
      {
        id: ref.id,
        home_id: homeId(),
        candidate_id: ref.candidate_id,
        referee_name: ref.referee_name,
        referee_role: ref.referee_role,
        organisation_name: ref.organisation_name,
        email: ref.email,
        phone: ref.phone,
        relationship_to_candidate: ref.relationship_to_candidate,
        is_most_recent_employer: ref.is_most_recent_employer,
        requested_at: ref.requested_at,
        chased_at: ref.chased_at,
        received_at: ref.received_at,
        structured_response: ref.structured_response,
        verbal_verification_completed: ref.verbal_verification_completed,
        verbal_verified_by: ref.verbal_verified_by,
        verbal_verified_at: ref.verbal_verified_at,
        discrepancy_flag: ref.discrepancy_flag,
        discrepancy_notes: ref.discrepancy_notes,
        reliability_rating: ref.reliability_rating,
        status: ref.status,
        secure_token_hash: ref.secure_token_hash ?? null,
        token_expires_at: ref.token_expires_at ?? null,
        token_used_at: ref.token_used_at ?? null,
        submission_meta: ref.submission_meta ?? null,
        created_at: ref.created_at,
        updated_at: ref.updated_at,
      },
      { onConflict: "id" },
    );
  } catch {
    // best-effort — the in-memory write already succeeded
  }
}

async function persistRecruitmentAudit(entry: RecruitmentAuditEntry): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const c = createServerClient();
  if (!c) return;
  try {
    await raw(c).from("recruitment_audit").insert({
      id: entry.id,
      home_id: homeId(),
      candidate_id: entry.candidate_id,
      vacancy_id: entry.vacancy_id ?? null,
      actor_id: entry.actor_id,
      event_type: entry.event_type,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      before_state: entry.before_state,
      after_state: entry.after_state,
      notes: entry.notes,
      created_at: entry.created_at,
    });
  } catch {
    // best-effort
  }
}

/**
 * Canonical audit write for recruitment routes: in-memory store first,
 * durable write-through second. Use this instead of db.recruitmentAudit.create.
 */
export function createRecruitmentAuditRecord(data: Partial<RecruitmentAuditEntry>): RecruitmentAuditEntry {
  const entry = db.recruitmentAudit.create(data);
  void persistRecruitmentAudit(entry);
  return entry;
}

/** Update a reference in-store AND write it through. */
export function updateCandidateReferenceRecord(
  id: string,
  data: Partial<CandidateReference>,
): CandidateReference | null {
  const updated = db.candidateReferences.update(id, data);
  if (updated) void persistCandidateReference(updated);
  return updated;
}
