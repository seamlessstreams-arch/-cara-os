// ══════════════════════════════════════════════════════════════════════════════
// Manager Oversight Inbox  (Milestone 24)
//
// CLAUDE.md spec: "management oversight queue" must be a live update target.
// This is the unified queue: a single ranked list of every item currently
// requiring a manager decision, drawn from the existing live engines:
//
//   - manager_review : care events with status "manager_review_required"
//   - reg40_triage   : pending Reg 40 triage rows (db.caraReg40Triages)
//   - amendment      : sensitive amendments awaiting re-verification (M19)
//   - reg45_chip     : Reg 45 evidence chips with status "ai_draft"     (M18)
//   - annex_a_chip   : Annex A evidence items with manager_decision "pending" (M21)
//   - routing_failure: failed care event routes/jobs                    (M16)
//
// Priority bands:
//   critical : safeguarding | reg40 awaiting | failed route on safeguarding
//   high     : sensitive amendment, manager_review_required (sensitive)
//   medium   : reg45/annex_a pending decisions
//   low      : routine routing failures, non-sensitive amendments
//
// Read-only. Each item links to the page where the manager actually decides.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { loadAmendmentReviewQueue } from "@/lib/care-events/amendment-review";
import { loadRoutingHealth } from "@/lib/care-events/routing-health";

export type OversightItemSource =
  | "manager_review"
  | "reg40_triage"
  | "amendment"
  | "reg45_chip"
  | "annex_a_chip"
  | "routing_failure";

export type OversightPriority = "critical" | "high" | "medium" | "low";

export interface OversightItem {
  id: string;                  // unique within source (source:source_id)
  source: OversightItemSource;
  source_id: string;
  home_id: string;
  child_id: string | null;
  title: string;
  detail: string;
  priority: OversightPriority;
  is_safeguarding_sensitive: boolean;
  created_at: string;          // age sort
  link_href: string;
}

export interface OversightSummary {
  home_id: string;
  generated_at: string;
  total: number;
  by_source: Record<OversightItemSource, number>;
  by_priority: Record<OversightPriority, number>;
  items: OversightItem[];
}

const PRIORITY_ORDER: Record<OversightPriority, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
};

export function loadOversightInbox(homeId: string): OversightSummary {
  const items: OversightItem[] = [];

  // ── Care events awaiting manager review ─────────────────────────────────
  for (const e of db.careEvents.findCurrent()) {
    if (e.home_id !== homeId) continue;
    if (e.status !== "manager_review_required") continue;
    const sensitive = Boolean(
      e.is_safeguarding ||
        e.requires_reg40_triage ||
        e.contributes_to_reg45 ||
        e.contributes_to_annex_a,
    );
    items.push({
      id: `manager_review:${e.id}`,
      source: "manager_review",
      source_id: e.id,
      home_id: e.home_id,
      child_id: e.child_id,
      title: e.title,
      detail: `${e.category.replace(/_/g, " ")} · event ${e.event_date}`,
      priority: e.is_safeguarding ? "critical" : sensitive ? "high" : "medium",
      is_safeguarding_sensitive: sensitive,
      created_at: e.updated_at ?? e.created_at,
      link_href: `/care-events/${e.id}`,
    });
  }

  // ── Reg 40 triages pending ──────────────────────────────────────────────
  for (const t of db.caraReg40Triages.findAll(homeId)) {
    if (t.status !== "pending") continue;
    items.push({
      id: `reg40_triage:${t.id}`,
      source: "reg40_triage",
      source_id: t.id,
      home_id: t.home_id,
      child_id: t.child_id ?? null,
      title: `Reg 40 triage: ${t.suggested_category.replace(/_/g, " ")}`,
      detail: t.reasoning?.slice(0, 140) ?? "Pending Reg 40 decision.",
      priority: "critical",
      is_safeguarding_sensitive: true,
      created_at: t.created_at,
      link_href: `/cara-studio/reg40-triage`,
    });
  }

  // ── Sensitive amendments awaiting re-verification ───────────────────────
  for (const a of loadAmendmentReviewQueue(homeId).rows) {
    items.push({
      id: `amendment:${a.care_event_id}`,
      source: "amendment",
      source_id: a.care_event_id,
      home_id: a.home_id,
      child_id: a.child_id,
      title: `Amendment review: ${a.title}`,
      detail: `v${a.version} · ${a.sensitive_flags.join(", ") || "sensitive"}` +
              (a.amendment_reason ? ` · ${a.amendment_reason.slice(0, 80)}` : ""),
      priority: a.sensitive_flags.includes("safeguarding") ? "critical" : "high",
      is_safeguarding_sensitive: a.sensitive_flags.includes("safeguarding"),
      created_at: a.amended_at ?? new Date().toISOString(),
      link_href: `/intelligence/care-events/amendment-review`,
    });
  }

  // ── Reg 45 chips awaiting decision ──────────────────────────────────────
  for (const c of db.caraReg45EvidenceItems.findAll(homeId)) {
    if (c.status !== "ai_draft") continue;
    items.push({
      id: `reg45_chip:${c.id}`,
      source: "reg45_chip",
      source_id: c.id,
      home_id: c.home_id,
      child_id: c.child_id ?? null,
      title: `Reg 45 evidence: ${c.title}`,
      detail: `${c.theme.replace(/_/g, " ")} · ${c.severity} · ${c.summary?.slice(0, 100) ?? ""}`,
      priority: c.severity === "critical" || c.severity === "high" ? "high" : "medium",
      is_safeguarding_sensitive: c.theme === "safeguarding",
      created_at: c.generated_at ?? new Date().toISOString(),
      link_href: `/cara-studio/reg45-evidence`,
    });
  }

  // ── Annex A items pending decision ──────────────────────────────────────
  for (const q of db.annexAEvidenceQueue.findAll()) {
    if (q.home_id !== homeId) continue;
    if (q.manager_decision !== "pending") continue;
    items.push({
      id: `annex_a_chip:${q.id}`,
      source: "annex_a_chip",
      source_id: q.id,
      home_id: q.home_id,
      child_id: null,
      title: `Annex A evidence: ${q.annex_section}`,
      detail: q.suggested_text.slice(0, 140),
      priority: q.annex_section === "section_3" ? "high" : "medium",
      is_safeguarding_sensitive: q.annex_section === "section_3",
      created_at: q.created_at,
      link_href: `/intelligence/care-events/inspection-readiness`,
    });
  }

  // ── Routing failures ────────────────────────────────────────────────────
  const routing = loadRoutingHealth(homeId);
  for (const ce of routing.rows) {
    const sensitive = ce.care_event_category === "safeguarding" ||
      ce.care_event_category === "missing_episode" ||
      ce.care_event_category === "physical_intervention" ||
      ce.care_event_category === "restraint";
    items.push({
      id: `routing_failure:${ce.care_event_id}`,
      source: "routing_failure",
      source_id: ce.care_event_id,
      home_id: homeId,
      child_id: ce.child_id,
      title: `Routing failed: ${ce.care_event_title}`,
      detail: `${ce.failed_routes.length} failed route${ce.failed_routes.length === 1 ? "" : "s"}, ` +
              `${ce.failed_jobs.length} failed job${ce.failed_jobs.length === 1 ? "" : "s"}`,
      priority: sensitive ? "critical" : "low",
      is_safeguarding_sensitive: sensitive,
      created_at: ce.care_event_date,
      link_href: `/intelligence/care-events/routing-health`,
    });
  }

  // Sort: priority asc, then sensitive first, then oldest first.
  items.sort((a, b) => {
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (p !== 0) return p;
    if (a.is_safeguarding_sensitive !== b.is_safeguarding_sensitive) {
      return a.is_safeguarding_sensitive ? -1 : 1;
    }
    return a.created_at.localeCompare(b.created_at);
  });

  const by_source: Record<OversightItemSource, number> = {
    manager_review: 0, reg40_triage: 0, amendment: 0,
    reg45_chip: 0, annex_a_chip: 0, routing_failure: 0,
  };
  const by_priority: Record<OversightPriority, number> = {
    critical: 0, high: 0, medium: 0, low: 0,
  };
  for (const i of items) {
    by_source[i.source] += 1;
    by_priority[i.priority] += 1;
  }

  return {
    home_id: homeId,
    generated_at: new Date().toISOString(),
    total: items.length,
    by_source,
    by_priority,
    items,
  };
}

export function oversightInboxCount(homeId: string): number {
  return loadOversightInbox(homeId).total;
}
