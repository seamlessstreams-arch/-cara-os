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
// ══════════════════════════════════════════════════════════════════════════════

export interface PersistenceEntry {
  entity: string;
  area: "Care records" | "Safeguarding & incidents" | "Workforce & comms" | "Cara Studio & AI" | "Recruitment" | "System";
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

  // ── Safeguarding & incidents ──
  { entity: "Incidents", area: "Safeguarding & incidents", write_through: true, table: "incidents", audit_trail: "Manager oversight fields + linked records" },
  { entity: "Care events (capture spine)", area: "Safeguarding & incidents", write_through: false, table: null, audit_trail: "In-memory event stream projection", note: "Projection is recomputed from source records, which do persist" },
  { entity: "Incident Mode sessions & timelines", area: "Safeguarding & incidents", write_through: false, table: "incident_sessions (migration 409, ready)", audit_trail: "Raw + AI + final versions kept in-store", note: "Write-through planned — schema already migrated" },

  // ── Workforce & comms ──
  { entity: "Comms Centre (channels, messages, receipts)", area: "Workforce & comms", write_through: true, table: "comms_*", audit_trail: "Message governance + receipt trail" },
  { entity: "Sign-in / presence verifications", area: "Workforce & comms", write_through: true, table: "signin_verifications", audit_trail: "Who, where, method, when" },
  { entity: "Emergency alerts", area: "Workforce & comms", write_through: true, table: "emergency_alerts", audit_trail: "Trigger + acknowledgement trail" },
  { entity: "Supervisions / training / rotas", area: "Workforce & comms", write_through: false, table: "(schema ready in early migrations)", audit_trail: "In-store records with author fields", note: "Reads are dal-ready; write-through to be wired" },

  // ── Cara Studio & AI ──
  { entity: "Cara Studio outputs (all 7 modules)", area: "Cara Studio & AI", write_through: true, table: "cara_studio_outputs", audit_trail: "Guardrail flags + manager review decisions on the row" },
  { entity: "Cara Studio review decisions", area: "Cara Studio & AI", write_through: true, table: "cara_studio_outputs (update)", audit_trail: "reviewed_by / reviewed_at / note; no self-approval (DB constraint)" },
  { entity: "Cara AI run log", area: "Cara Studio & AI", write_through: true, table: "cara_ai_runs", audit_trail: "Every generation: who, child, module, flags, model" },
  { entity: "Cara guardrail events", area: "Cara Studio & AI", write_through: true, table: "cara_guardrail_events", audit_trail: "Each flag with severity and action taken" },
  { entity: "Cara assist requests (legacy aria_* layer)", area: "Cara Studio & AI", write_through: false, table: "aria_requests/aria_outputs (migration 013, ready)", audit_trail: "In-store approval trail", note: "Schema migrated; wiring planned" },

  // ── Recruitment ──
  { entity: "Safer-recruitment candidates & checks", area: "Recruitment", write_through: false, table: "(v2 schema to be migrated)", audit_trail: "Recruitment audit entries on every action (durable)", note: "Command Centre recomputes from records; durable write-through planned" },
  { entity: "Referee submissions & secure links", area: "Recruitment", write_through: true, table: "recruitment_candidate_references", audit_trail: "Token lifecycle (hash only), IP + user-agent + timestamp on submission, verification outcome" },
  { entity: "Recruitment audit trail", area: "Recruitment", write_through: true, table: "recruitment_audit", audit_trail: "Every link issued, reference received, check verified, reminder synced and decision recorded" },

  // ── System ──
  { entity: "Sensitive-action audit log", area: "System", write_through: true, table: "audit_logs", audit_trail: "writeAuditLog() on sensitive routes" },
];

export function persistenceSummary() {
  const total = PERSISTENCE_MANIFEST.length;
  const durable = PERSISTENCE_MANIFEST.filter((e) => e.write_through).length;
  return { total, durable, pending: total - durable };
}
