// ══════════════════════════════════════════════════════════════════════════════
// CARA — DEPRIVATION OF LIBERTY INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses active DoL orders, restriction tracking, proportionality reviews,
// child consultation compliance, social worker notification, and review
// schedule adherence.
//
// Regulatory: Reg 20 (Restraint and deprivation of liberty),
// Reg 21 (Privacy and access), SCCIF Helped & Protected,
// Children Act 1989 — inherent jurisdiction orders.
// ══════════════════════════════════════════════════════════════════════════════

import { rate, meets, below, formatRate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface DoLRestrictionInput {
  id: string;
  child_id: string;
  restriction_type: string; // internet_access, leave_unaccompanied, mobile_phone, contact_with_person, social_media, curfew
  reason: string;
  date_imposed: string;
  last_reviewed: string;
  next_review_due: string;
  child_consulted: boolean;
  child_view: string;
  social_worker_informed: boolean;
  proportionate: boolean;
  status: string; // active, removed, under_review
}

export interface DoLOrderInput {
  id: string;
  child_id: string;
  order_type: string; // inherent_jurisdiction, secure_accommodation, dol_order
  start_date: string;
  expiry_date: string;
  status: string; // active, expired, pending_renewal
  court: string;
  conditions: string[];
}

export interface ChildRef {
  id: string;
  name: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface DoLIntelligenceInput {
  restrictions: DoLRestrictionInput[];
  orders: DoLOrderInput[];
  children: ChildRef[];
  staff: StaffRef[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface DoLOverview {
  active_orders: number;
  active_restrictions: number;
  children_with_restrictions: number;
  total_children: number;
  // Null when there are no active restrictions — nothing to be proportionate about,
  // consulted on, or notified, so there is no rate to report.
  proportionality_rate: number | null;
  child_consultation_rate: number | null;
  social_worker_informed_rate: number | null;
  overdue_reviews: number;
  restrictions_removed_last_30_days: number;
}

export interface RestrictionTypeSummary {
  restriction_type: string;
  type_label: string;
  count: number;
  reviewed_on_time: number;
  overdue_count: number;
}

export interface ChildRestrictionProfile {
  child_id: string;
  child_name: string;
  active_restrictions: number;
  overdue_reviews: number;
  child_consulted_rate: number | null;
  has_dol_order: boolean;
}

export interface ActiveOrderSummary {
  order_id: string;
  child_name: string;
  order_type: string;
  type_label: string;
  expiry_date: string;
  days_until_expiry: number;
  status: string;
}

export interface DoLAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraDoLInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface DoLIntelligenceResult {
  overview: DoLOverview;
  restriction_types: RestrictionTypeSummary[];
  child_restrictions: ChildRestrictionProfile[];
  active_orders: ActiveOrderSummary[];
  alerts: DoLAlert[];
  insights: CaraDoLInsight[];
}

// ── Type Label Maps ─────────────────────────────────────────────────────────

const RESTRICTION_TYPE_LABELS: Record<string, string> = {
  internet_access: "Internet Access",
  leave_unaccompanied: "Leave Unaccompanied",
  mobile_phone: "Mobile Phone",
  contact_with_person: "Contact with Person",
  social_media: "Social Media",
  curfew: "Curfew",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  inherent_jurisdiction: "Inherent Jurisdiction",
  secure_accommodation: "Secure Accommodation",
  dol_order: "DoL Order",
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysBetween(a: string, b: string): number {
  const msA = new Date(a + "T00:00:00Z").getTime();
  const msB = new Date(b + "T00:00:00Z").getTime();
  return Math.round((msB - msA) / 86_400_000);
}

export function getRestrictionTypeLabel(type: string): string {
  return RESTRICTION_TYPE_LABELS[type] ?? type;
}

export function getOrderTypeLabel(type: string): string {
  return ORDER_TYPE_LABELS[type] ?? type;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeDoLIntelligence(input: DoLIntelligenceInput): DoLIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { restrictions, orders, children } = input;

  const activeRestrictions = restrictions.filter((r) => r.status === "active");
  const activeOrders = orders.filter((o) => o.status === "active" || o.status === "pending_renewal");

  // ── Overview ──────────────────────────────────────────────────────────────
  const childrenWithActiveRestrictions = new Set(activeRestrictions.map((r) => r.child_id));

  const overdueReviews = activeRestrictions.filter(
    (r) => daysBetween(today, r.next_review_due) < 0,
  );

  const proportionalCount = activeRestrictions.filter((r) => r.proportionate).length;
  const consultedCount = activeRestrictions.filter((r) => r.child_consulted).length;
  const swInformedCount = activeRestrictions.filter((r) => r.social_worker_informed).length;

  const totalActive = activeRestrictions.length;
  const pctRate = (n: number) => rate(n, totalActive);

  const removedLast30Days = restrictions.filter(
    (r) => r.status === "removed" && daysBetween(r.last_reviewed, today) <= 30,
  );

  const overview: DoLOverview = {
    active_orders: activeOrders.length,
    active_restrictions: totalActive,
    children_with_restrictions: childrenWithActiveRestrictions.size,
    total_children: children.length,
    proportionality_rate: pctRate(proportionalCount),
    child_consultation_rate: pctRate(consultedCount),
    social_worker_informed_rate: pctRate(swInformedCount),
    overdue_reviews: overdueReviews.length,
    restrictions_removed_last_30_days: removedLast30Days.length,
  };

  // ── Restriction Type Summaries ────────────────────────────────────────────
  const typeMap = new Map<string, DoLRestrictionInput[]>();
  for (const r of activeRestrictions) {
    const existing = typeMap.get(r.restriction_type) ?? [];
    existing.push(r);
    typeMap.set(r.restriction_type, existing);
  }

  const restriction_types: RestrictionTypeSummary[] = Array.from(typeMap.entries())
    .map(([type, items]) => {
      const overdueCount = items.filter((r) => daysBetween(today, r.next_review_due) < 0).length;
      return {
        restriction_type: type,
        type_label: getRestrictionTypeLabel(type),
        count: items.length,
        reviewed_on_time: items.length - overdueCount,
        overdue_count: overdueCount,
      };
    })
    .sort((a, b) => b.count - a.count);

  // ── Child Restriction Profiles ────────────────────────────────────────────
  const childOrderSet = new Set(activeOrders.map((o) => o.child_id));

  const child_restrictions: ChildRestrictionProfile[] = children
    .filter((c) => childrenWithActiveRestrictions.has(c.id))
    .map((child) => {
      const childActive = activeRestrictions.filter((r) => r.child_id === child.id);
      const childOverdue = childActive.filter((r) => daysBetween(today, r.next_review_due) < 0);
      const childConsulted = childActive.filter((r) => r.child_consulted).length;

      return {
        child_id: child.id,
        child_name: child.name,
        active_restrictions: childActive.length,
        overdue_reviews: childOverdue.length,
        child_consulted_rate: rate(childConsulted, childActive.length),
        has_dol_order: childOrderSet.has(child.id),
      };
    });

  // ── Active Orders ─────────────────────────────────────────────────────────
  const active_orders: ActiveOrderSummary[] = activeOrders.map((o) => {
    const child = children.find((c) => c.id === o.child_id);
    return {
      order_id: o.id,
      child_name: child?.name ?? "Unknown",
      order_type: o.order_type,
      type_label: getOrderTypeLabel(o.order_type),
      expiry_date: o.expiry_date,
      days_until_expiry: daysBetween(today, o.expiry_date),
      status: o.status,
    };
  });

  // ── Alerts ────────────────────────────────────────────────────────────────
  const alerts: DoLAlert[] = [];

  // Critical: DoL order expiring within 14 days without renewal pending
  for (const order of active_orders) {
    if (order.days_until_expiry <= 14 && order.status !== "pending_renewal") {
      alerts.push({
        severity: "critical",
        message: `DoL order (${order.type_label}) for ${order.child_name} expires in ${order.days_until_expiry} day${order.days_until_expiry !== 1 ? "s" : ""} — court renewal application required urgently`,
      });
    }
  }

  // Critical: Active restriction without child being consulted AND no social worker informed
  for (const r of activeRestrictions) {
    if (!r.child_consulted && !r.social_worker_informed) {
      const child = children.find((c) => c.id === r.child_id);
      alerts.push({
        severity: "critical",
        message: `${getRestrictionTypeLabel(r.restriction_type)} restriction for ${child?.name ?? "Unknown"} — child not consulted and social worker not informed — immediate action required`,
      });
    }
  }

  // High: Restriction review overdue
  for (const r of overdueReviews) {
    const child = children.find((c) => c.id === r.child_id);
    const daysOverdue = Math.abs(daysBetween(today, r.next_review_due));
    alerts.push({
      severity: "high",
      message: `${getRestrictionTypeLabel(r.restriction_type)} restriction review for ${child?.name ?? "Unknown"} is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`,
    });
  }

  // High: Proportionality not established for active restriction
  for (const r of activeRestrictions) {
    if (!r.proportionate) {
      const child = children.find((c) => c.id === r.child_id);
      alerts.push({
        severity: "high",
        message: `${getRestrictionTypeLabel(r.restriction_type)} restriction for ${child?.name ?? "Unknown"} — proportionality not established`,
      });
    }
  }

  // Medium: Child consultation rate below 80%
  if (below(overview.child_consultation_rate, 80)) {
    alerts.push({
      severity: "medium",
      message: `Child consultation rate is ${formatRate(overview.child_consultation_rate)} — below 80% threshold. Children's views must be sought on all restrictions per Reg 21`,
    });
  }

  // Medium: Social worker informed rate below 90%
  if (below(overview.social_worker_informed_rate, 90)) {
    alerts.push({
      severity: "medium",
      message: `Social worker informed rate is ${formatRate(overview.social_worker_informed_rate)} — below 90% threshold. All restrictions must be communicated to placing authorities`,
    });
  }

  // Low: Restriction active for > 90 days without removal consideration
  for (const r of activeRestrictions) {
    const daysActive = daysBetween(r.date_imposed, today);
    if (daysActive > 90) {
      const child = children.find((c) => c.id === r.child_id);
      alerts.push({
        severity: "low",
        message: `${getRestrictionTypeLabel(r.restriction_type)} restriction for ${child?.name ?? "Unknown"} has been active for ${daysActive} days — consider whether removal is appropriate`,
      });
    }
  }

  // ── Cara Insights ─────────────────────────────────────────────────────────
  const insights: CaraDoLInsight[] = [];

  // Critical: DoL orders expiring imminently without renewal
  const imminentOrders = active_orders.filter(
    (o) => o.days_until_expiry <= 14 && o.status !== "pending_renewal",
  );
  if (imminentOrders.length > 0) {
    insights.push({
      severity: "critical",
      text: `${imminentOrders.length} DoL order${imminentOrders.length > 1 ? "s" : ""} expiring within 14 days without renewal pending. Court application needed immediately — failure to renew means the restriction lacks legal authority under the Children Act 1989.`,
    });
  }

  // Warning: Multiple overdue reviews
  if (overdueReviews.length > 0) {
    insights.push({
      severity: "warning",
      text: `${overdueReviews.length} restriction review${overdueReviews.length > 1 ? "s" : ""} overdue. Reg 20 requires regular review of all restrictions to ensure continued necessity and proportionality. Overdue reviews represent a compliance gap.`,
    });
  }

  // Warning: Low child consultation rate
  if (below(overview.child_consultation_rate, 80)) {
    insights.push({
      severity: "warning",
      text: `Child consultation rate is ${formatRate(overview.child_consultation_rate)}. Reg 21 requires that children's views are sought on any restriction affecting their liberty or privacy. Low consultation undermines participation rights and regulatory compliance.`,
    });
  }

  // Positive: All restrictions reviewed on time
  if (totalActive > 0 && overdueReviews.length === 0) {
    insights.push({
      severity: "positive",
      text: `All ${totalActive} active restriction${totalActive > 1 ? "s" : ""} reviewed on time. This demonstrates strong compliance with Reg 20 review requirements and commitment to ongoing proportionality assessment.`,
    });
  }

  // Positive: 100% child consultation and social worker notification
  if (meets(overview.child_consultation_rate, 100) && meets(overview.social_worker_informed_rate, 100)) {
    insights.push({
      severity: "positive",
      text: `100% child consultation and social worker notification rate. Excellent compliance with Reg 21 participation rights and placing authority communication requirements.`,
    });
  }

  // Positive: Restrictions reduced (removals in last 30 days)
  if (removedLast30Days.length > 0) {
    insights.push({
      severity: "positive",
      text: `${removedLast30Days.length} restriction${removedLast30Days.length > 1 ? "s" : ""} removed in the last 30 days. Evidence of active consideration of least restrictive approaches and commitment to restoring children's freedoms.`,
    });
  }

  return {
    overview,
    restriction_types,
    child_restrictions,
    active_orders,
    alerts,
    insights,
  };
}
