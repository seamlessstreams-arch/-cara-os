// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POSSESSIONS INTELLIGENCE ENGINE
// Pure deterministic engine for children's property and possessions analysis.
// Analyses inventory completeness, photo compliance, insurance coverage,
// missing/damaged items, and generates ARIA intelligence insights.
// Reg 20: children's belongings must be safeguarded
// SCCIF: evidence that children's property is respected and well-managed
// Children Act 1989 s26: right to personal property
// ══════════════════════════════════════════════════════════════════════════════

export interface PossessionInput {
  id: string;
  child_id: string;
  item_name: string;
  category: string; // electronics, clothing, sentimental, documents, money, other
  date_logged: string;
  value_estimate: number;
  condition: string; // excellent, good, fair, poor, missing, returned
  photo_logged: boolean;
  insured: boolean;
  notes: string;
}

export interface ChildRef {
  id: string;
  name: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface PossessionsOverview {
  total_items: number;
  items_with_photos: number;
  photo_compliance_rate: number;
  items_insured: number;
  insurance_rate: number;
  missing_items: number;
  damaged_items: number;
  total_value_estimate: number;
  avg_items_per_child: number;
}

export interface ChildInventoryProfile {
  child_id: string;
  child_name: string;
  total_items: number;
  items_with_photos: number;
  missing_count: number;
  total_value: number;
  categories_used: string[];
}

export interface CategoryBreakdown {
  category: string;
  category_label: string;
  count: number;
  missing_count: number;
  avg_value: number;
}

export interface PossessionsAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface AriaPossessionsInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface PossessionsIntelligenceResult {
  overview: PossessionsOverview;
  child_inventories: ChildInventoryProfile[];
  category_breakdown: CategoryBreakdown[];
  alerts: PossessionsAlert[];
  insights: AriaPossessionsInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  electronics: "Electronics",
  clothing: "Clothing",
  sentimental: "Sentimental",
  documents: "Documents",
  money: "Money",
  other: "Other",
};

function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computePossessionsIntelligence(input: {
  possessions: PossessionInput[];
  children: ChildRef[];
  staff: StaffRef[];
  today?: string;
}): PossessionsIntelligenceResult {
  const { possessions, children, staff, today = new Date().toISOString().slice(0, 10) } = input;

  if (possessions.length === 0) {
    // All children have 0 items — generate low alerts for each
    const alerts: PossessionsAlert[] = children.map((c) => ({
      severity: "low" as const,
      message: `${c.name} has no possessions logged — inventory not started`,
    }));

    const insights: AriaPossessionsInsight[] = [];

    return {
      overview: {
        total_items: 0,
        items_with_photos: 0,
        photo_compliance_rate: 0,
        items_insured: 0,
        insurance_rate: 0,
        missing_items: 0,
        damaged_items: 0,
        total_value_estimate: 0,
        avg_items_per_child: 0,
      },
      child_inventories: [],
      category_breakdown: [],
      alerts,
      insights,
    };
  }

  // ── Overview ────────────────────────────────────────────────────────────
  const totalItems = possessions.length;
  const itemsWithPhotos = possessions.filter((p) => p.photo_logged).length;
  const photoComplianceRate = Math.round((itemsWithPhotos / totalItems) * 100);
  const itemsInsured = possessions.filter((p) => p.insured).length;
  const insuranceRate = Math.round((itemsInsured / totalItems) * 100);
  const missingItems = possessions.filter((p) => p.condition === "missing").length;
  const damagedItems = possessions.filter((p) => p.condition === "poor").length;
  const totalValueEstimate = round2(possessions.reduce((sum, p) => sum + p.value_estimate, 0));
  const avgItemsPerChild = children.length > 0 ? round2(totalItems / children.length) : 0;

  const overview: PossessionsOverview = {
    total_items: totalItems,
    items_with_photos: itemsWithPhotos,
    photo_compliance_rate: photoComplianceRate,
    items_insured: itemsInsured,
    insurance_rate: insuranceRate,
    missing_items: missingItems,
    damaged_items: damagedItems,
    total_value_estimate: totalValueEstimate,
    avg_items_per_child: avgItemsPerChild,
  };

  // ── Child Inventories ───────────────────────────────────────────────────
  const childMap = new Map<string, string>();
  for (const c of children) {
    childMap.set(c.id, c.name);
  }

  const childGrouped = new Map<string, PossessionInput[]>();
  for (const p of possessions) {
    const existing = childGrouped.get(p.child_id) ?? [];
    existing.push(p);
    childGrouped.set(p.child_id, existing);
  }

  const childInventories: ChildInventoryProfile[] = [];
  for (const [childId, items] of childGrouped.entries()) {
    const childName = childMap.get(childId) ?? childId;
    const categories = [...new Set(items.map((i) => i.category))];
    childInventories.push({
      child_id: childId,
      child_name: childName,
      total_items: items.length,
      items_with_photos: items.filter((i) => i.photo_logged).length,
      missing_count: items.filter((i) => i.condition === "missing").length,
      total_value: round2(items.reduce((sum, i) => sum + i.value_estimate, 0)),
      categories_used: categories.sort(),
    });
  }

  // Sort by child_name for consistency
  childInventories.sort((a, b) => a.child_name.localeCompare(b.child_name));

  // ── Category Breakdown ──────────────────────────────────────────────────
  const catGrouped = new Map<string, PossessionInput[]>();
  for (const p of possessions) {
    const existing = catGrouped.get(p.category) ?? [];
    existing.push(p);
    catGrouped.set(p.category, existing);
  }

  const categoryBreakdown: CategoryBreakdown[] = [];
  for (const [cat, items] of catGrouped.entries()) {
    const avgValue = round2(items.reduce((sum, i) => sum + i.value_estimate, 0) / items.length);
    categoryBreakdown.push({
      category: cat,
      category_label: categoryLabel(cat),
      count: items.length,
      missing_count: items.filter((i) => i.condition === "missing").length,
      avg_value: avgValue,
    });
  }

  // Sort by count descending
  categoryBreakdown.sort((a, b) => b.count - a.count);

  // ── Alerts ──────────────────────────────────────────────────────────────
  const alerts: PossessionsAlert[] = [];

  // Critical: any child with > 2 missing items
  for (const profile of childInventories) {
    if (profile.missing_count > 2) {
      alerts.push({
        severity: "critical",
        message: `${profile.child_name} has ${profile.missing_count} missing items — immediate investigation required`,
      });
    }
  }

  // High: total missing > 0 AND photo compliance < 50%
  if (missingItems > 0 && photoComplianceRate < 50) {
    alerts.push({
      severity: "high",
      message: `${missingItems} missing item(s) with photo compliance at only ${photoComplianceRate}% — evidence gaps undermine recovery`,
    });
  }

  // Medium: photo compliance < 80% across all items
  if (photoComplianceRate < 80) {
    alerts.push({
      severity: "medium",
      message: `Photo compliance is ${photoComplianceRate}% — below 80% target for property evidence`,
    });
  }

  // Medium: insurance rate < 50% for items valued over £50
  const highValueItems = possessions.filter((p) => p.value_estimate > 50);
  if (highValueItems.length > 0) {
    const highValueInsured = highValueItems.filter((p) => p.insured).length;
    const highValueInsuranceRate = Math.round((highValueInsured / highValueItems.length) * 100);
    if (highValueInsuranceRate < 50) {
      alerts.push({
        severity: "medium",
        message: `Only ${highValueInsuranceRate}% of high-value items (>£50) are insured — ${highValueItems.length - highValueInsured} item(s) at risk`,
      });
    }
  }

  // Low: any child with 0 logged items
  for (const child of children) {
    if (!childGrouped.has(child.id)) {
      alerts.push({
        severity: "low",
        message: `${child.name} has no possessions logged — inventory not started`,
      });
    }
  }

  // ── Insights ────────────────────────────────────────────────────────────
  const insights: AriaPossessionsInsight[] = [];

  // Critical: missing items with no resolution
  if (missingItems > 0) {
    const childrenWithMissing = childInventories.filter((c) => c.missing_count > 0);
    insights.push({
      severity: "critical",
      text: `${missingItems} item(s) reported missing across ${childrenWithMissing.length} child(ren) — requires tracking and resolution`,
    });
  }

  // Warning: low photo compliance — mention specific children below threshold
  const childrenBelowPhotoThreshold = childInventories.filter((c) => {
    if (c.total_items === 0) return false;
    const rate = Math.round((c.items_with_photos / c.total_items) * 100);
    return rate < 80;
  });
  if (childrenBelowPhotoThreshold.length > 0) {
    const names = childrenBelowPhotoThreshold.map((c) => c.child_name).join(", ");
    insights.push({
      severity: "warning",
      text: `Photo compliance below 80% for: ${names} — photographic evidence supports property protection`,
    });
  }

  // Warning: uninsured high-value items
  if (highValueItems.length > 0) {
    const uninsuredHighValue = highValueItems.filter((p) => !p.insured);
    if (uninsuredHighValue.length > 0) {
      const totalUninsuredValue = round2(uninsuredHighValue.reduce((sum, p) => sum + p.value_estimate, 0));
      insights.push({
        severity: "warning",
        text: `${uninsuredHighValue.length} high-value item(s) worth £${totalUninsuredValue} are uninsured — consider coverage for Reg 20 compliance`,
      });
    }
  }

  // Positive: 100% photo compliance
  if (photoComplianceRate === 100 && totalItems > 0) {
    insights.push({
      severity: "positive",
      text: "100% photo compliance achieved — excellent evidence base for property protection",
    });
  }

  // Positive: all children have comprehensive inventories (≥5 items logged)
  const allChildrenHaveInventory = children.length > 0 && children.every((c) => {
    const items = childGrouped.get(c.id);
    return items !== undefined && items.length >= 5;
  });
  if (allChildrenHaveInventory) {
    insights.push({
      severity: "positive",
      text: "All children have comprehensive inventories (≥5 items logged) — strong Reg 20 compliance",
    });
  }

  // Positive: no missing items
  if (missingItems === 0 && totalItems > 0) {
    insights.push({
      severity: "positive",
      text: "No missing items reported — excellent property management and safeguarding",
    });
  }

  return {
    overview,
    child_inventories: childInventories,
    category_breakdown: categoryBreakdown,
    alerts,
    insights,
  };
}
