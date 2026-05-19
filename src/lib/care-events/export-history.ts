// ══════════════════════════════════════════════════════════════════════════════
// Export History  (Milestone 36)
//
// Records every successful export of a persisted artifact (currently
// Inspection Snapshots and Reg 44 Visit Evidence Packs). CLAUDE.md:
//   "restricted export permissions" + audit trail of export events.
//
// Entries are append-only. Each call generates a deterministic id
// (`exp_${kind}_${artifact_id}_${exported_at}_${userId}`) so concurrent
// exports get distinct rows but accidental double-submits are deduped at
// the millisecond level. The persisted artifact remains the source of
// truth — the export entry is metadata only.
// ══════════════════════════════════════════════════════════════════════════════

import {
  db,
  type ExportHistoryEntry,
  type ExportHistoryFormat,
  type ExportHistoryKind,
} from "@/lib/db/store";

export const EXPORT_KINDS: ReadonlyArray<ExportHistoryKind> = [
  "inspection_snapshot",
  "reg44_pack",
];

export interface RecordExportInput {
  homeId: string;
  kind: ExportHistoryKind;
  artifactId: string;
  format?: ExportHistoryFormat;
  exportedBy: string;
  exportedByRole: string;
  isSafeguardingSensitive?: boolean;
  byteSize: number;
  reason?: string | null;
}

export function recordExport(input: RecordExportInput): ExportHistoryEntry {
  const exported_at = new Date().toISOString();
  const safeStamp = exported_at.replace(/[:.]/g, "");
  const entry: ExportHistoryEntry = {
    id: `exp_${input.kind}_${input.artifactId}_${safeStamp}_${input.exportedBy}`,
    home_id: input.homeId,
    kind: input.kind,
    artifact_id: input.artifactId,
    format: input.format ?? "json",
    exported_at,
    exported_by: input.exportedBy,
    exported_by_role: input.exportedByRole,
    is_safeguarding_sensitive: input.isSafeguardingSensitive ?? false,
    byte_size: input.byteSize,
    reason: input.reason ?? null,
  };
  return db.exportHistory.create(entry);
}

export interface ExportHistorySummary {
  home_id: string;
  generated_at: string;
  total: number;
  by_kind: Record<ExportHistoryKind, number>;
  by_user: Record<string, number>;
  safeguarding_sensitive: number;
  entries: ExportHistoryEntry[]; // newest first
}

export function loadExportHistory(homeId: string): ExportHistorySummary {
  const all = db.exportHistory
    .findAll(homeId)
    .slice()
    .sort((a, b) => b.exported_at.localeCompare(a.exported_at));

  const by_kind: Record<ExportHistoryKind, number> = {
    inspection_snapshot: 0,
    reg44_pack: 0,
    filing_cabinet_index: 0,
    inspection_bundle: 0,
  };
  const by_user: Record<string, number> = {};
  let safeguarding_sensitive = 0;
  for (const e of all) {
    by_kind[e.kind] += 1;
    by_user[e.exported_by] = (by_user[e.exported_by] ?? 0) + 1;
    if (e.is_safeguarding_sensitive) safeguarding_sensitive += 1;
  }

  return {
    home_id: homeId,
    generated_at: new Date().toISOString(),
    total: all.length,
    by_kind,
    by_user,
    safeguarding_sensitive,
    entries: all,
  };
}

export function listExportsForArtifact(artifactId: string): ExportHistoryEntry[] {
  return db.exportHistory
    .findForArtifact(artifactId)
    .slice()
    .sort((a, b) => b.exported_at.localeCompare(a.exported_at));
}
