// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILDREN'S POSSESSIONS & PROPERTY SERVICE
// Manages inventory of children's personal belongings, money records,
// valuables, and property on admission/departure. Evidence for Reg 21
// (privacy & access), Reg 36 (case records), and SCCIF Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface PossessionRecord {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  item_description: string;
  category: string;
  estimated_value?: number | null;
  condition_on_arrival: string;
  condition_on_departure?: string | null;
  stored_location?: string | null;
  photo_reference?: string | null;
  recorded_date: string;
  recorded_by: string;
  child_signed: boolean;
  staff_signed: boolean;
  status: "with_child" | "in_safe" | "returned" | "lost" | "damaged" | "disposed";
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MoneyRecord {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  transaction_type: "deposit" | "withdrawal";
  amount: number;
  description: string;
  balance_after: number;
  recorded_date: string;
  recorded_by: string;
  child_signed: boolean;
  receipt_reference?: string | null;
  created_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const POSSESSION_CATEGORIES: { category: string; label: string }[] = [
  { category: "clothing", label: "Clothing & Shoes" },
  { category: "electronics", label: "Electronics & Devices" },
  { category: "jewellery", label: "Jewellery & Accessories" },
  { category: "documents", label: "Documents & ID" },
  { category: "sentimental", label: "Sentimental Items" },
  { category: "toys_games", label: "Toys & Games" },
  { category: "books_media", label: "Books & Media" },
  { category: "sports", label: "Sports Equipment" },
  { category: "toiletries", label: "Toiletries & Personal Care" },
  { category: "furniture", label: "Bedroom Furniture/Items" },
  { category: "money", label: "Money & Gift Cards" },
  { category: "other", label: "Other Items" },
];

export const POSSESSION_STATUS: { status: string; label: string }[] = [
  { status: "with_child", label: "With Child" },
  { status: "in_safe", label: "Stored in Safe" },
  { status: "returned", label: "Returned on Departure" },
  { status: "lost", label: "Lost" },
  { status: "damaged", label: "Damaged" },
  { status: "disposed", label: "Disposed Of" },
];

export const CONDITION_OPTIONS: string[] = [
  "new", "excellent", "good", "fair", "poor", "damaged",
];

// ── Pure functions (no DB) ──────────────────────────────────────────────────

/**
 * Compute possession metrics for the home.
 */
function computePossessionSummary(
  possessions: PossessionRecord[],
  moneyRecords: MoneyRecord[],
): {
  total_items: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  items_with_child: number;
  items_in_safe: number;
  items_lost_damaged: number;
  signing_compliance: number;
  total_estimated_value: number;
  children_with_records: number;
  money_children_count: number;
  total_money_held: number;
} {
  const total = possessions.length;

  // By status
  const byStatus: Record<string, number> = {};
  for (const p of possessions) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
  }

  // By category
  const byCategory: Record<string, number> = {};
  for (const p of possessions) {
    byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
  }

  const withChild = possessions.filter((p) => p.status === "with_child").length;
  const inSafe = possessions.filter((p) => p.status === "in_safe").length;
  const lostDamaged = possessions.filter(
    (p) => p.status === "lost" || p.status === "damaged",
  ).length;

  // Signing compliance (both signatures)
  const bothSigned = possessions.filter(
    (p) => p.child_signed && p.staff_signed,
  ).length;
  const signingCompliance = total > 0
    ? Math.round((bothSigned / total) * 100)
    : 0;

  // Total estimated value
  let totalValue = 0;
  for (const p of possessions) {
    if (p.estimated_value && p.estimated_value > 0) {
      totalValue += p.estimated_value;
    }
  }
  totalValue = Math.round(totalValue * 100) / 100;

  // Unique children
  const childrenWithRecords = new Set(possessions.map((p) => p.child_id)).size;

  // Money records - compute current balance per child
  const childBalances: Record<string, number> = {};
  for (const m of moneyRecords) {
    childBalances[m.child_id] = m.balance_after;
  }
  const moneyChildrenCount = Object.keys(childBalances).length;
  let totalMoneyHeld = 0;
  for (const balance of Object.values(childBalances)) {
    totalMoneyHeld += balance;
  }
  totalMoneyHeld = Math.round(totalMoneyHeld * 100) / 100;

  return {
    total_items: total,
    by_status: byStatus,
    by_category: byCategory,
    items_with_child: withChild,
    items_in_safe: inSafe,
    items_lost_damaged: lostDamaged,
    signing_compliance: signingCompliance,
    total_estimated_value: totalValue,
    children_with_records: childrenWithRecords,
    money_children_count: moneyChildrenCount,
    total_money_held: totalMoneyHeld,
  };
}

/**
 * Identify possession-related alerts.
 */
function identifyPossessionAlerts(
  possessions: PossessionRecord[],
  moneyRecords: MoneyRecord[],
  totalChildren: number,
): { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [];

  // Lost or damaged items
  const lostItems = possessions.filter((p) => p.status === "lost");
  if (lostItems.length > 0) {
    alerts.push({
      type: "lost_items",
      severity: "medium",
      message: `${lostItems.length} item${lostItems.length > 1 ? "s" : ""} recorded as lost. Investigate and document resolution.`,
    });
  }

  const damagedItems = possessions.filter((p) => p.status === "damaged");
  if (damagedItems.length > 0) {
    alerts.push({
      type: "damaged_items",
      severity: "low",
      message: `${damagedItems.length} item${damagedItems.length > 1 ? "s" : ""} recorded as damaged. Ensure replacement or repair is arranged.`,
    });
  }

  // Unsigned records
  const unsigned = possessions.filter(
    (p) => !p.child_signed || !p.staff_signed,
  );
  if (unsigned.length > 0) {
    alerts.push({
      type: "unsigned_records",
      severity: "medium",
      message: `${unsigned.length} possession record${unsigned.length > 1 ? "s" : ""} missing signatures — Reg 21 requires proper documentation.`,
    });
  }

  // Children without possession records
  const childrenWithRecords = new Set(possessions.map((p) => p.child_id));
  const withoutRecords = totalChildren - childrenWithRecords.size;
  if (withoutRecords > 0 && totalChildren > 0) {
    alerts.push({
      type: "no_possession_record",
      severity: "high",
      message: `${withoutRecords} of ${totalChildren} children have no possession records. An inventory must be completed on admission (Reg 21).`,
    });
  }

  // High-value items in unsafe storage
  const highValueUnsafe = possessions.filter(
    (p) => p.estimated_value && p.estimated_value > 100 && p.status === "with_child" && !p.stored_location,
  );
  if (highValueUnsafe.length > 0) {
    alerts.push({
      type: "high_value_unsecured",
      severity: "medium",
      message: `${highValueUnsafe.length} high-value item${highValueUnsafe.length > 1 ? "s" : ""} (>£100) without documented storage location.`,
    });
  }

  return alerts;
}

// ── CRUD — Possessions ──────────────────────────────────────────────────────

export async function listPossessions(
  homeId: string,
  filters?: {
    childId?: string;
    category?: string;
    status?: string;
    limit?: number;
  },
): Promise<ServiceResult<PossessionRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<PossessionRecord[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<PossessionRecord[]>;

  let q = (s.from("cs_possession_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("recorded_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createPossession(
  input: Omit<PossessionRecord, "id" | "created_at" | "updated_at">,
): Promise<ServiceResult<PossessionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_possession_records") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      item_description: input.item_description,
      category: input.category,
      estimated_value: input.estimated_value ?? null,
      condition_on_arrival: input.condition_on_arrival,
      condition_on_departure: input.condition_on_departure ?? null,
      stored_location: input.stored_location ?? null,
      photo_reference: input.photo_reference ?? null,
      recorded_date: input.recorded_date,
      recorded_by: input.recorded_by,
      child_signed: input.child_signed,
      staff_signed: input.staff_signed,
      status: input.status,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updatePossession(
  id: string,
  updates: Partial<PossessionRecord>,
): Promise<ServiceResult<PossessionRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_possession_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Money Records ────────────────────────────────────────────────────

export async function listMoneyRecords(
  homeId: string,
  filters?: {
    childId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<MoneyRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [], persisted: false } as ServiceResult<MoneyRecord[]>;

  const s = sb();
  if (!s) return { ok: true, data: [], persisted: false } as ServiceResult<MoneyRecord[]>;

  let q = (s.from("cs_money_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.dateFrom) q = q.gte("recorded_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("recorded_date", filters.dateTo);
  q = q.order("recorded_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createMoneyRecord(
  input: Omit<MoneyRecord, "id" | "created_at">,
): Promise<ServiceResult<MoneyRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_money_records") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      transaction_type: input.transaction_type,
      amount: input.amount,
      description: input.description,
      balance_after: input.balance_after,
      recorded_date: input.recorded_date,
      recorded_by: input.recorded_by,
      child_signed: input.child_signed,
      receipt_reference: input.receipt_reference ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ────────────────────────────────────────────────────────

export const _testing = {
  computePossessionSummary,
  identifyPossessionAlerts,
};
