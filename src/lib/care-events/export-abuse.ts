// ══════════════════════════════════════════════════════════════════════════════
// Export Abuse Detection  (Milestone 40)
//
// Derived signal over `db.exportHistory`. Flags unusual export activity so a
// manager / RI can review whether sensitive content is leaving the home in
// a safe and proportionate way.
//
// Heuristics (tuned for a single home; safe defaults):
//
//   1. high_volume_24h    – any single user records ≥ 5 exports in 24h
//   2. sensitive_burst_24h – any single user records ≥ 2 safeguarding-
//                            sensitive exports in 24h
//   3. off_hours_sensitive – any sensitive export outside 07:00-22:00 home
//                            local time (heuristic: UTC hour for now)
//   4. unreasoned_sensitive – any sensitive export with a null reason
//
// Read-only. No side effects.
// ══════════════════════════════════════════════════════════════════════════════

import { db, type ExportHistoryEntry } from "@/lib/db/store";

export type ExportAbuseFlagKind =
  | "high_volume_24h"
  | "sensitive_burst_24h"
  | "off_hours_sensitive"
  | "unreasoned_sensitive";

export type ExportAbuseSeverity = "info" | "warning" | "critical";

export interface ExportAbuseFlag {
  id: string; // deterministic per home + kind + user/entry
  kind: ExportAbuseFlagKind;
  severity: ExportAbuseSeverity;
  user_id: string;
  user_role: string;
  count: number;             // for window-based flags
  entries: ExportHistoryEntry[]; // contributing entries
  detected_at: string;
  message: string;
}

export interface ExportAbuseReport {
  home_id: string;
  generated_at: string;
  total_flags: number;
  by_severity: Record<ExportAbuseSeverity, number>;
  by_kind: Record<ExportAbuseFlagKind, number>;
  flags: ExportAbuseFlag[]; // severity desc, then newest first
}

const HIGH_VOLUME_THRESHOLD = 5;
const SENSITIVE_BURST_THRESHOLD = 2;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const OFF_HOURS_START = 22; // ≥ 22:00 or < 07:00 = off hours
const OFF_HOURS_END = 7;
const SEVERITY_ORDER: Record<ExportAbuseSeverity, number> = {
  critical: 0, warning: 1, info: 2,
};

export function detectExportAbuse(homeId: string): ExportAbuseReport {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const all = db.exportHistory.findAll(homeId);
  const recent = all.filter((e) => new Date(e.exported_at).getTime() >= cutoff);

  const flags: ExportAbuseFlag[] = [];

  // Group recent exports by user
  const byUser = new Map<string, ExportHistoryEntry[]>();
  for (const e of recent) {
    const arr = byUser.get(e.exported_by) ?? [];
    arr.push(e);
    byUser.set(e.exported_by, arr);
  }

  for (const [userId, entries] of byUser) {
    const role = entries[0]?.exported_by_role ?? "unknown";

    // 1. high_volume_24h
    if (entries.length >= HIGH_VOLUME_THRESHOLD) {
      flags.push({
        id: `abuse_high_volume_24h_${homeId}_${userId}`,
        kind: "high_volume_24h",
        severity: "warning",
        user_id: userId,
        user_role: role,
        count: entries.length,
        entries: [...entries].sort((a, b) =>
          b.exported_at.localeCompare(a.exported_at),
        ),
        detected_at: new Date(now).toISOString(),
        message: `${userId} recorded ${entries.length} exports in the last 24 hours.`,
      });
    }

    // 2. sensitive_burst_24h
    const sensitive = entries.filter((e) => e.is_safeguarding_sensitive);
    if (sensitive.length >= SENSITIVE_BURST_THRESHOLD) {
      flags.push({
        id: `abuse_sensitive_burst_24h_${homeId}_${userId}`,
        kind: "sensitive_burst_24h",
        severity: "critical",
        user_id: userId,
        user_role: role,
        count: sensitive.length,
        entries: [...sensitive].sort((a, b) =>
          b.exported_at.localeCompare(a.exported_at),
        ),
        detected_at: new Date(now).toISOString(),
        message:
          `${userId} recorded ${sensitive.length} safeguarding-sensitive exports ` +
          `in the last 24 hours.`,
      });
    }
  }

  // 3. off_hours_sensitive  &  4. unreasoned_sensitive
  for (const e of all) {
    if (!e.is_safeguarding_sensitive) continue;
    const hour = new Date(e.exported_at).getUTCHours();
    const offHours = hour >= OFF_HOURS_START || hour < OFF_HOURS_END;
    if (offHours) {
      flags.push({
        id: `abuse_off_hours_sensitive_${e.id}`,
        kind: "off_hours_sensitive",
        severity: "warning",
        user_id: e.exported_by,
        user_role: e.exported_by_role,
        count: 1,
        entries: [e],
        detected_at: e.exported_at,
        message:
          `Safeguarding-sensitive ${e.kind.replace(/_/g, " ")} exported at ` +
          `${new Date(e.exported_at).toISOString()} (off hours).`,
      });
    }
    if (!e.reason || e.reason.trim() === "") {
      flags.push({
        id: `abuse_unreasoned_sensitive_${e.id}`,
        kind: "unreasoned_sensitive",
        severity: "warning",
        user_id: e.exported_by,
        user_role: e.exported_by_role,
        count: 1,
        entries: [e],
        detected_at: e.exported_at,
        message:
          `Safeguarding-sensitive ${e.kind.replace(/_/g, " ")} exported with no reason recorded.`,
      });
    }
  }

  // Sort: severity desc, then newest detected first
  flags.sort((a, b) => {
    const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (s !== 0) return s;
    return b.detected_at.localeCompare(a.detected_at);
  });

  const by_severity: Record<ExportAbuseSeverity, number> =
    { critical: 0, warning: 0, info: 0 };
  const by_kind: Record<ExportAbuseFlagKind, number> = {
    high_volume_24h: 0,
    sensitive_burst_24h: 0,
    off_hours_sensitive: 0,
    unreasoned_sensitive: 0,
  };
  for (const f of flags) {
    by_severity[f.severity] += 1;
    by_kind[f.kind] += 1;
  }

  return {
    home_id: homeId,
    generated_at: new Date(now).toISOString(),
    total_flags: flags.length,
    by_severity,
    by_kind,
    flags,
  };
}
