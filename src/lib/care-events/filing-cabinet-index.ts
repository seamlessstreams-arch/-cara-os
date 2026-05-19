// ══════════════════════════════════════════════════════════════════════════════
// Filing Cabinet Live Index  (Milestone 25)
//
// CLAUDE.md spec: "filing cabinet" must be a live update target and must be
// inspection-ready. Filing items are auto-created by the routing processor
// when a Care Event is verified. This engine produces a per-home index of
// what has been filed, organised by FilingCategory, with verified vs
// unverified counts and the most recent filings per category.
//
// Read-only.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type { FilingCabinetItem, FilingCategory } from "@/types/care-events";

export interface FilingCategoryGroup {
  category: FilingCategory;
  total: number;
  verified: number;
  unverified: number;
  most_recent_filed_at: string | null;
  recent_items: FilingCabinetItem[]; // up to 5 most recent
}

export interface FilingCabinetIndex {
  home_id: string;
  generated_at: string;
  total: number;
  verified: number;
  unverified: number;
  unverified_pct: number;       // 0..100, 0 dp
  categories: FilingCategoryGroup[];
  // most-recent first across the whole index
  recent_filings: FilingCabinetItem[];
}

const ALL_CATEGORIES: FilingCategory[] = [
  "daily_care",
  "incident",
  "health",
  "medication",
  "education",
  "safeguarding",
  "missing_episode",
  "physical_intervention",
  "family_contact",
  "professional_contact",
  "complaint",
  "regulation_45",
  "annex_a",
  "regulation_40",
  "management_oversight",
  "other",
];

export function loadFilingCabinetIndex(homeId: string): FilingCabinetIndex {
  const items = db.filingCabinet.findByHome(homeId);

  const groupsMap = new Map<FilingCategory, FilingCabinetItem[]>();
  for (const cat of ALL_CATEGORIES) groupsMap.set(cat, []);
  for (const it of items) {
    const arr = groupsMap.get(it.category) ?? [];
    arr.push(it);
    groupsMap.set(it.category, arr);
  }

  const categories: FilingCategoryGroup[] = [];
  for (const cat of ALL_CATEGORIES) {
    const arr = groupsMap.get(cat) ?? [];
    if (arr.length === 0) continue;
    const sorted = [...arr].sort((a, b) => b.filed_at.localeCompare(a.filed_at));
    const verified = sorted.filter((x) => x.is_verified).length;
    categories.push({
      category: cat,
      total: sorted.length,
      verified,
      unverified: sorted.length - verified,
      most_recent_filed_at: sorted[0]?.filed_at ?? null,
      recent_items: sorted.slice(0, 5),
    });
  }

  // sort categories: largest groups first
  categories.sort((a, b) => b.total - a.total);

  const total = items.length;
  const verified = items.filter((x) => x.is_verified).length;
  const unverified = total - verified;
  const unverified_pct = total === 0 ? 0 : Math.round((unverified / total) * 100);

  const recent_filings = [...items]
    .sort((a, b) => b.filed_at.localeCompare(a.filed_at))
    .slice(0, 20);

  return {
    home_id: homeId,
    generated_at: new Date().toISOString(),
    total,
    verified,
    unverified,
    unverified_pct,
    categories,
    recent_filings,
  };
}

export function filingCabinetCount(homeId: string): number {
  return db.filingCabinet.findByHome(homeId).length;
}
