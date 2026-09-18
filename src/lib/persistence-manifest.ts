// ══════════════════════════════════════════════════════════════════════════════
// CARA — PERSISTENCE MANIFEST
//
// The honest, single source of truth for "what survives a redeploy?".
// Rendered on /data-persistence and returned by /api/v1/system/persistence.
// Two modes:
//   • Demo (Supabase off): everything runs on the seeded in-memory store —
//     fast, safe, resets on redeploy/instance recycle.
//   • Durable (Supabase on): entities marked `write_through: true` are written
//     to their real table as they're created, and read back through the dal.
//
// Keep this list TRUTHFUL — a wrong "true" here is worse than a gap.
//
// AND KEEP IT COMPLETE. This manifest was the selection rule for the July lean
// baseline ("the tables a live tenant persists to"). The intelligence layer was
// built in May to write to Supabase directly — bypassing the dal — but was never
// added here, so the baseline dropped its 14 tables and every one of its routes
// answered 503 on the first live tenant. A route that calls
// createServerClient().from(...) persists, whether or not it goes through the
// dal, and belongs in this list. scripts/check-storage-migrations.js is the
// ratchet that catches a table with no migration; nothing catches a table with
// no manifest entry except a reader of this file.
// ══════════════════════════════════════════════════════════════════════════════

export interface PersistenceEntry {
  entity: string;
  area: "Care records" | "Safeguarding & incidents" | "Workforce & comms" | "Cara Studio & AI" | "Intelligence layer" | "Recruitment" | "System";
  write_through: boolean;
  table: string | null;
  audit_trail: string;
  note?: string;
}

export const PERSISTENCE_MANIFEST: PersistenceEntry[] = [
  // ── Care records ──
  { entity: "Daily logs", area: "Care records", write_through: true, table: "daily_logs", audit_trail: "Record history + author/timestamps on every entry" },
  { entity: "Care forms", area: "Care records", write_through: true, table: "care_forms", audit_trail: "Versioned form submissions" },
  { entity: "Young people profiles", area: "Care records", write_through: true, table: "young_people", audit_trail: "Change history fields" },
  { entity: "Medications (MAR)", area: "Care records", write_through: true, table: "medications", audit_trail: "Administration records with checker identity" },
  { entity: "Tasks & actions", area: "Care records", write_through: true, table: "tasks", audit_trail: "Status changes with actor + completion sign-off" },
  { entity: "Calendar events (meetings/appointments)", area: "Care records", write_through: true, table: "calendar_events", audit_trail: "Create/reschedule/cancel + attendees + linked tasks on the row", note: "Only the calendar's own events persist here; all other calendar items are projected live from their source tables (capture once)" },

  // ── Safeguarding & incidents ──
  { entity: "Incidents", area: "Safeguarding & incidents", write_through: true, table: "incidents", audit_trail: "Manager oversight fields + linked records" },
  { entity: "Care events (capture spine)", area: "Safeguarding & incidents", write_through: false, table: null, audit_trail: "In-memory event stream projection", note: "Projection is recomputed from source records, which do persist" },
  { entity: "Incident Mode sessions & timelines", area: "Safeguarding & incidents", write_through: true, table: "incident_sessions / incident_timeline_entries", audit_trail: "Raw + AI + final preserved; every action in cara_audit_logs" },
  { entity: "Recording reviews, restorative & reflections", area: "Safeguarding & incidents", write_through: true, table: "cara_recording_reviews / restorative_conversations / post_incident_reflections", audit_trail: "Manager-review fields on each row" },

  // ── Workforce & comms ──
  { entity: "Comms Centre (channels, messages, receipts)", area: "Workforce & comms", write_through: true, table: "comms_*", audit_trail: "Message governance + receipt trail" },
  { entity: "Sign-in / presence verifications", area: "Workforce & comms", write_through: true, table: "signin_verifications", audit_trail: "Who, where, method, when" },
  { entity: "Emergency alerts", area: "Workforce & comms", write_through: true, table: "emergency_alerts", audit_trail: "Trigger + acknowledgement trail" },
  { entity: "Reflective supervision records", area: "Workforce & comms", write_through: true, table: "reflective_supervisions", audit_trail: "Wellbeing, themes and sign-off fields on the row" },
  { entity: "Classic supervisions / training / rotas", area: "Workforce & comms", write_through: false, table: "(uuid schemas in migration 001)", audit_trail: "In-store records with author fields", note: "Tables expect real staff uuids — activates naturally with production staff data" },

  // ── Cara Studio & AI ──
  { entity: "Cara Studio outputs (all 7 modules)", area: "Cara Studio & AI", write_through: true, table: "cara_studio_outputs", audit_trail: "Guardrail flags + manager review decisions on the row" },
  { entity: "Cara Studio review decisions", area: "Cara Studio & AI", write_through: true, table: "cara_studio_outputs (update)", audit_trail: "reviewed_by / reviewed_at / note; no self-approval (DB constraint)" },
  { entity: "Cara AI run log", area: "Cara Studio & AI", write_through: true, table: "cara_ai_runs", audit_trail: "Every generation: who, child, module, flags, model" },
  { entity: "Cara guardrail events", area: "Cara Studio & AI", write_through: true, table: "cara_guardrail_events", audit_trail: "Each flag with severity and action taken" },
  { entity: "Resource library (ingest + approvals)", area: "Cara Studio & AI", write_through: true, table: "cara_resource_library", audit_trail: "approved_by on the row; no self-approval (DB constraint)" },

  // ── Recruitment ──
  { entity: "Safer-recruitment candidates & checks", area: "Recruitment", write_through: true, table: "recruitment_candidates / _candidate_checks / _conditional_offers", audit_trail: "Recruitment audit entries on every action (durable)", note: "Profiles, Schedule-2 checks and offers upsert by app id (migration 415); Command Centre recomputes from records" },
  { entity: "Referee submissions & secure links", area: "Recruitment", write_through: true, table: "recruitment_candidate_references", audit_trail: "Token lifecycle (hash only), IP + user-agent + timestamp on submission, verification outcome" },
  { entity: "Recruitment audit trail", area: "Recruitment", write_through: true, table: "recruitment_audit", audit_trail: "Every link issued, reference received, check verified, reminder synced and decision recorded" },

  // ── System ──
  { entity: "Sensitive-action audit log", area: "System", write_through: true, table: "audit_logs", audit_trail: "writeAuditLog() on sensitive routes" },
  { entity: "Platform customers (Cara HQ)", area: "System", write_through: true, table: "organisations", audit_trail: "Provisioning + status changes logged as usage events", note: "Metadata only — HQ never touches children's records" },
  { entity: "Usage metering (Cara HQ)", area: "System", write_through: true, table: "usage_events", audit_trail: "Append-only activity ledger", note: "HQ actions log automatically; app-wide activity wiring is incremental" },
  { entity: "AI usage & cost (Cara HQ)", area: "System", write_through: true, table: "ai_usage", audit_trail: "Per-call feature/model/tokens with estimated cost", note: "Metered at the provider seam — fills whenever AI runs" },
  { entity: "Break-glass grants (Cara HQ)", area: "System", write_through: true, table: "break_glass_grants", audit_trail: "Reason, time-box and revocation on the row", note: "Records intent only — does not open children's records" },

  // ── Intelligence layer (direct Supabase writes, not via the dal) ──
  // Restored to the live schema by 20260918120000_restore_direct_query_tables.
  { entity: "Manager attention items", area: "Intelligence layer", write_through: true, table: "manager_attention_items", audit_trail: "intelligence_audit_log via writeIntelligenceAudit()" },
  { entity: "Smart record links", area: "Intelligence layer", write_through: true, table: "smart_record_links", audit_trail: "suggested_by / approved_by / created_by on the row + intelligence audit" },
  { entity: "Reg 44 visits & actions", area: "Intelligence layer", write_through: true, table: "reg44_visits / reg44_actions", audit_trail: "created_by + timestamps; intelligence audit", note: "Route filters on `status`; column is `report_status` — filter fix pending" },
  { entity: "Reg 45 reviews", area: "Intelligence layer", write_through: true, table: "reg45_reviews", audit_trail: "created_by + timestamps; intelligence audit" },
  { entity: "Child progress goals, entries & outcome snapshots", area: "Intelligence layer", write_through: true, table: "child_progress_goals / child_progress_entries / child_outcome_snapshots", audit_trail: "created_by + timestamps; intelligence audit" },
  { entity: "Voice of the child entries & summaries", area: "Intelligence layer", write_through: true, table: "child_voice_entries / voice_summaries / voice_summary_audit_log", audit_trail: "Dedicated voice_summary_audit_log" },
  { entity: "Staff competence records", area: "Intelligence layer", write_through: true, table: "staff_competence_records", audit_trail: "created_by + timestamps; intelligence audit" },
  { entity: "Inspection evidence items", area: "Intelligence layer", write_through: true, table: "inspection_evidence_items", audit_trail: "created_by + timestamps; intelligence audit" },
  { entity: "Incident learning reviews", area: "Intelligence layer", write_through: true, table: "incident_learning_reviews", audit_trail: "created_by + timestamps; intelligence audit" },
  { entity: "Provider / RI home summaries", area: "Intelligence layer", write_through: true, table: "provider_home_summaries", audit_trail: "ri_reviewed_by / ri_reviewed_at on the row", note: "Route orders by `summary_date`; columns are `period_start` / `period_end` — route fix pending; 503 until then" },
  { entity: "Management oversight reviews, actions & audit", area: "Intelligence layer", write_through: true, table: "oversight_reviews / oversight_actions / oversight_audit_log", audit_trail: "Dedicated oversight_audit_log" },
  { entity: "Quality-ecology task templates, occurrences & staff profiles", area: "Intelligence layer", write_through: true, table: "task_templates / scheduled_occurrences / staff_profiles", audit_trail: "Timestamps on the row", note: "RLS enabled, no policies: service-role reads only" },
  { entity: "Cara assist requests, outputs & transcriptions (legacy cara_* layer)", area: "Cara Studio & AI", write_through: true, table: "cara_requests / cara_outputs / cara_transcriptions", audit_trail: "status + timestamps on the row", note: "Restored 2026-09-18; the orchestration tables (cara_sessions / cara_messages / …) are NOT restored — their archived DDL never enabled RLS" },
  { entity: "Early-access requests", area: "System", write_through: true, table: "early_access_requests", audit_trail: "Timestamps on the row", note: "RLS enabled, no policies: service-role only" },
];

export function persistenceSummary() {
  const total = PERSISTENCE_MANIFEST.length;
  const durable = PERSISTENCE_MANIFEST.filter((e) => e.write_through).length;
  return { total, durable, pending: total - durable };
}
