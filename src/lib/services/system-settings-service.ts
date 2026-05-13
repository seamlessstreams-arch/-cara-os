// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SYSTEM SETTINGS SERVICE
// Home-level configuration: ARIA preferences, notification thresholds,
// compliance intervals, and operational defaults.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type SettingCategory =
  | "aria" | "notifications" | "compliance" | "operational" | "display";

export interface SystemSetting {
  id: string;
  home_id: string;
  category: SettingCategory;
  key: string;
  value: unknown;
  label: string;
  description: string | null;
  data_type: "string" | "number" | "boolean" | "json";
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

// ── Default settings ───────────────────────────────────────────────────────

export interface DefaultSetting {
  category: SettingCategory;
  key: string;
  label: string;
  description: string;
  dataType: "string" | "number" | "boolean" | "json";
  defaultValue: unknown;
}

export const DEFAULT_SETTINGS: DefaultSetting[] = [
  // ARIA
  { category: "aria", key: "aria.enabled", label: "ARIA Intelligence", description: "Enable or disable ARIA AI intelligence features", dataType: "boolean", defaultValue: true },
  { category: "aria", key: "aria.auto_scan_interval_hours", label: "Auto-Scan Interval", description: "How often ARIA scans for patterns (hours)", dataType: "number", defaultValue: 24 },
  { category: "aria", key: "aria.recommendation_expiry_days", label: "Recommendation Expiry", description: "Days before unacted recommendations expire", dataType: "number", defaultValue: 7 },
  { category: "aria", key: "aria.minimum_confidence", label: "Minimum Confidence", description: "Minimum confidence threshold for surfacing recommendations (0-1)", dataType: "number", defaultValue: 0.7 },
  { category: "aria", key: "aria.show_positive_patterns", label: "Show Positive Patterns", description: "Include positive recognition recommendations", dataType: "boolean", defaultValue: true },
  { category: "aria", key: "aria.oversight_prompts_enabled", label: "Oversight Quality Prompts", description: "Show ARIA prompts when writing management oversight", dataType: "boolean", defaultValue: true },

  // Notifications
  { category: "notifications", key: "notify.task_overdue_hours", label: "Task Overdue Alert", description: "Hours after due date before flagging task as overdue", dataType: "number", defaultValue: 2 },
  { category: "notifications", key: "notify.oversight_reminder_hours", label: "Oversight Reminder", description: "Hours after significant event before oversight reminder", dataType: "number", defaultValue: 48 },
  { category: "notifications", key: "notify.training_expiry_days", label: "Training Expiry Warning", description: "Days before training expiry to send warning", dataType: "number", defaultValue: 30 },
  { category: "notifications", key: "notify.shift_unfilled_days", label: "Shift Unfilled Warning", description: "Days in advance to flag unfilled shifts", dataType: "number", defaultValue: 7 },
  { category: "notifications", key: "notify.form_overdue_days", label: "Form Overdue Alert", description: "Days after form due date before alerting", dataType: "number", defaultValue: 1 },

  // Compliance
  { category: "compliance", key: "compliance.supervision_interval_weeks", label: "Supervision Interval", description: "Maximum weeks between staff supervisions", dataType: "number", defaultValue: 6 },
  { category: "compliance", key: "compliance.reg44_due_day", label: "Reg 44 Due Day", description: "Day of month for Reg 44 visit", dataType: "number", defaultValue: 28 },
  { category: "compliance", key: "compliance.max_consecutive_shifts", label: "Max Consecutive Shifts", description: "Maximum consecutive working days before wellbeing alert", dataType: "number", defaultValue: 6 },
  { category: "compliance", key: "compliance.missing_protocol_hours", label: "Missing Protocol Hours", description: "Hours after young person missing before escalating to police", dataType: "number", defaultValue: 1 },
  { category: "compliance", key: "compliance.medication_audit_interval_days", label: "Medication Audit Interval", description: "Days between medication stock audits", dataType: "number", defaultValue: 7 },

  // Operational
  { category: "operational", key: "ops.home_capacity", label: "Home Capacity", description: "Maximum number of young people the home is registered for", dataType: "number", defaultValue: 5 },
  { category: "operational", key: "ops.shift_types", label: "Shift Types", description: "Configured shift types (JSON array)", dataType: "json", defaultValue: ["day", "night", "sleep_in", "waking_night"] },
  { category: "operational", key: "ops.daily_log_min_length", label: "Daily Log Minimum Length", description: "Minimum character count for daily log entries", dataType: "number", defaultValue: 50 },
  { category: "operational", key: "ops.incident_sign_off_required", label: "Incident Sign-Off Required", description: "Require manager sign-off on all incident records", dataType: "boolean", defaultValue: true },
  { category: "operational", key: "ops.handover_yp_updates_required", label: "Handover YP Updates Required", description: "Require per-child updates in handover notes", dataType: "boolean", defaultValue: true },

  // Display
  { category: "display", key: "display.theme", label: "Theme", description: "Dashboard colour theme", dataType: "string", defaultValue: "default" },
  { category: "display", key: "display.date_format", label: "Date Format", description: "Date display format", dataType: "string", defaultValue: "DD/MM/YYYY" },
  { category: "display", key: "display.show_aria_badges", label: "Show ARIA Badges", description: "Display ARIA-generated badges on records", dataType: "boolean", defaultValue: true },
];

// ── CRUD ───────────────────────────────────────────────────────────────────

export async function getSettings(
  homeId: string,
  category?: SettingCategory,
): Promise<ServiceResult<SystemSetting[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_system_settings") as SB).select("*").eq("home_id", homeId);
  if (category) q = q.eq("category", category);
  q = q.order("key", { ascending: true });

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getSetting(
  homeId: string,
  key: string,
): Promise<ServiceResult<unknown>> {
  const s = sb();
  if (!s) {
    // Return default value when DB not available
    const def = DEFAULT_SETTINGS.find((d) => d.key === key);
    return { ok: true, data: def?.defaultValue ?? null };
  }

  const { data, error } = await (s.from("cs_system_settings") as SB)
    .select("value")
    .eq("home_id", homeId)
    .eq("key", key)
    .single();

  if (error) {
    // Return default if not found
    const def = DEFAULT_SETTINGS.find((d) => d.key === key);
    return { ok: true, data: def?.defaultValue ?? null };
  }
  return { ok: true, data: data.value };
}

export async function updateSetting(
  homeId: string,
  key: string,
  value: unknown,
  userId: string,
): Promise<ServiceResult<SystemSetting>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const def = DEFAULT_SETTINGS.find((d) => d.key === key);

  // Upsert
  const { data, error } = await (s.from("cs_system_settings") as SB)
    .upsert({
      home_id: homeId,
      category: def?.category ?? "operational",
      key,
      value,
      label: def?.label ?? key,
      description: def?.description ?? null,
      data_type: def?.dataType ?? "string",
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "home_id,key" })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function initializeSettings(
  homeId: string,
  userId: string,
): Promise<ServiceResult<number>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const inserts = DEFAULT_SETTINGS.map((d) => ({
    home_id: homeId,
    category: d.category,
    key: d.key,
    value: d.defaultValue,
    label: d.label,
    description: d.description,
    data_type: d.dataType,
    updated_by: userId,
  }));

  const { error } = await (s.from("cs_system_settings") as SB)
    .upsert(inserts, { onConflict: "home_id,key", ignoreDuplicates: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: inserts.length };
}

// ── Pure helper: merge DB settings with defaults ───────────────────────────

export function mergeWithDefaults(
  dbSettings: { key: string; value: unknown }[],
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};

  // Start with defaults
  for (const def of DEFAULT_SETTINGS) {
    merged[def.key] = def.defaultValue;
  }

  // Override with DB values
  for (const setting of dbSettings) {
    merged[setting.key] = setting.value;
  }

  return merged;
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  mergeWithDefaults,
  DEFAULT_SETTINGS,
};
