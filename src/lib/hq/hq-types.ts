// ══════════════════════════════════════════════════════════════════════════════
// CARA HQ — types
//
// Platform-owner ("Cara HQ") domain: customers, usage metering, AI cost and
// break-glass audit. Pure types — safe to import anywhere (store, hooks, UI).
//
// 🔴 Safeguarding boundary: HQ operates on METADATA only. Nothing in this
// module models or exposes children's record content.
// ══════════════════════════════════════════════════════════════════════════════

export type HqPlan = "pilot" | "essentials" | "professional" | "group";
export type HqOrgStatus = "active" | "suspended" | "churned";

export interface HqOrganisation {
  id: string;
  name: string;
  plan: HqPlan;
  status: HqOrgStatus;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  /** Metadata only — real multi-tenant home provisioning lands with auth. */
  first_home_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface HqUsageEvent {
  id: string;
  at: string;
  org_id: string | null;
  user_label: string | null;
  kind: string;
  meta: Record<string, unknown>;
}

export interface HqAiUsageRow {
  id: string;
  at: string;
  org_id: string | null;
  feature: string;
  model: string | null;
  tokens_input: number;
  tokens_output: number;
  /** Rough GBP estimate for margin watching — not billing. */
  cost_gbp: number;
  estimated: boolean;
}

export interface HqApiCallRow {
  id: string;
  at: string;
  org_id: string | null;
  /** Route family (the first /api/v1 slug segment, e.g. "incidents"). */
  feature: string;
  method: string;
  /** True when the route serves an intelligence / decision endpoint. */
  intelligence: boolean;
}

export interface HqDecisionRow {
  id: string;
  at: string;
  org_id: string | null;
  feature: string;
  /** "deterministic" = produced with no model call; "ai" = a model was used. */
  mode: "deterministic" | "ai";
}

export interface HqBreakGlassGrant {
  id: string;
  admin_label: string;
  org_id: string;
  reason: string;
  granted_at: string;
  expires_at: string;
  revoked_at: string | null;
}
