// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ENTITY DEEP-LINK CONFIG
//
// Maps the data entities surfaced on the operational boards (Shift Briefing,
// Plan Currency, Premises Compliance) to the platform page where you actually
// act on them. Keeping this in frontend config (not the pure engines) keeps the
// engines platform-agnostic — same approach as src/config/intelligence-links.ts.
//
// Every target here is a VERIFIED existing route under src/app/(platform)/.
// ══════════════════════════════════════════════════════════════════════════════

/** Statutory plan/assessment type → its dedicated platform page. */
export const PLAN_TYPE_HREF: Record<string, string> = {
  lac_review: "/lac-reviews",
  pathway_plan: "/pathway-plan-16plus",
  pep: "/pep-tracker",
  self_harm_safety_plan: "/self-harm-safety-plan",
  risk_management_plan: "/risk-management-plans",
  attachment_profile: "/attachment-profiles",
  behaviour_support_plan: "/behaviour-support-plans",
  mdt_formulation: "/multi-disciplinary-formulation",
  exploitation_screening: "/exploitation-screening",
  dietary_plan: "/dietary-requirements",
  annual_health_assessment: "/annual-health-assessment",
  cultural_identity_plan: "/cultural-identity",
};

/** Resolve a plan-type key to its page, falling back to the care-plans hub. */
export function planTypeHref(key?: string | null): string {
  return (key && PLAN_TYPE_HREF[key]) || "/care-plans";
}

/** Simple entity → page links used across the operational boards. */
export const ENTITY_HREF = {
  task: "/tasks",
  incident: "/incidents",
  log: "/daily-log",
  medication: "/medications",
  planCurrency: "/plan-currency",
} as const;

/** Shift-Briefing attention items carry a semantic `kind`; map it to a page. */
export function attentionHref(kind?: string | null): string {
  switch (kind) {
    case "incident": return ENTITY_HREF.incident;
    case "review": return ENTITY_HREF.planCurrency;
    case "task": return ENTITY_HREF.task;
    default: return "/dashboard";
  }
}
