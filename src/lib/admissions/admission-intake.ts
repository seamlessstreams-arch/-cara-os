// ══════════════════════════════════════════════════════════════════════════════
// CARA — Admission intake (pure, deterministic)
//
// Turns an admission (optionally seeded from the initial referral's extracted
// fields) into the records that route its information where it needs to go:
//   • the New Placement Admission workflow steps → dated, role-assigned tasks
//     anchored to the placement date;
//   • the referral's risk factors → draft risk assessments in the child's risk
//     profile, one per recognised domain, carrying the referral wording so the
//     assessor starts from what the placing authority actually said.
// Pure builders — the route persists. `today` is injected; no clock.
// ══════════════════════════════════════════════════════════════════════════════

import { WORKFLOW_TEMPLATES } from "@/lib/services/workflow-service";
import type { ExtractedReferralFields } from "@/lib/referral-extraction/referral-extraction-engine";
import type { RiskAssessment, RiskDomain } from "@/types/extended";

// ── Date helpers (UTC, string-in string-out) ──────────────────────────────────
function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function maxDate(a: string, b: string): string {
  return a >= b ? a : b;
}

// ── Task plan from the admission workflow template ───────────────────────────
export interface AdmissionTaskPlan {
  title: string;
  description: string;
  priority: "medium" | "high" | "urgent";
  category: "compliance";
  due_date: string;
  workflow_step: number;
}

// Day offsets relative to the placement date for each template step. Pre-
// admission steps sit before the child arrives; the 72-hour review after.
const STEP_OFFSETS: Record<string, number> = {
  "Referral Assessment": -7,
  "Impact Risk Assessment": -5,
  "Pre-Placement Planning": -3,
  "Room & Environment": -1,
  "Staff Briefing": -1,
  "Admission Day": 0,
  "72-Hour Review": 3,
};

/**
 * Instantiate the "New Placement Admission" template as dated tasks.
 *
 * Anchored to the placement date, clamped so nothing is due in the past when a
 * child is admitted at short notice (or retrospectively) — a task due
 * yesterday is unactionable noise, not statutory rigour.
 */
export function buildAdmissionTaskPlan(args: {
  placementStart: string; // YYYY-MM-DD
  today: string; // YYYY-MM-DD
  childName: string;
}): AdmissionTaskPlan[] {
  const template = WORKFLOW_TEMPLATES.find((t) => t.code === "new_placement");
  if (!template) return [];
  const earliest = addDays(args.today, 1);

  return template.steps
    .filter((s) => s.auto_create_task)
    .map((s, i) => {
      const offset = STEP_OFFSETS[s.title] ?? 0;
      const anchored = addDays(args.placementStart, offset);
      const critical = s.title === "Admission Day" || s.title === "72-Hour Review";
      return {
        title: `${s.title} — ${args.childName}`,
        description: `${s.description}\n\n[New Placement Admission workflow · step ${i + 1} · ${s.assigned_role.replace(/_/g, " ")}]`,
        priority: critical ? ("urgent" as const) : ("high" as const),
        category: "compliance" as const,
        due_date: maxDate(anchored, earliest),
        workflow_step: i + 1,
      };
    });
}

// ── Referral risks → draft risk assessments ──────────────────────────────────
// Deterministic keyword → RiskDomain map. A referral names risks in prose;
// only domains it recognisably mentions get a draft — no invented risks.
const RISK_DOMAIN_RULES: { re: RegExp; domain: RiskDomain }[] = [
  { re: /self[- ]?harm|cutting|suicid|overdose|ligature/i, domain: "self_harm" },
  { re: /missing|abscond|runs? away|running away|went missing/i, domain: "absconding" },
  { re: /aggress|violen|assault|physical(ly)? (harm|attack)|fighting/i, domain: "aggression" },
  { re: /exploit|\bcse\b|\bcce\b|county lines|grooming|traffick/i, domain: "exploitation" },
  { re: /substance|drug|alcohol|cannabis|solvent|vaping? (cannabis|thc)/i, domain: "substance_use" },
  { re: /online|internet|social media|gaming|sexting|cyber/i, domain: "online_safety" },
  { re: /fire[- ]?setting|arson|lighting fires|matches|lighters/i, domain: "fire_setting" },
  { re: /sexual(ised|ly)? (behaviour|language)|harmful sexual|\bhsb\b/i, domain: "sexual_behaviour" },
  { re: /self[- ]?neglect|hygiene|refus(es|ing) to (eat|wash)|not eating/i, domain: "self_neglect" },
  { re: /emotional|anxiety|depress|low mood|trauma|attachment/i, domain: "emotional_harm" },
];

export function mapRiskFactorsToDomains(riskFactors: string[]): Map<RiskDomain, string[]> {
  const byDomain = new Map<RiskDomain, string[]>();
  for (const factor of riskFactors) {
    for (const rule of RISK_DOMAIN_RULES) {
      if (rule.re.test(factor)) {
        const list = byDomain.get(rule.domain) ?? [];
        list.push(factor);
        byDomain.set(rule.domain, list);
        // a single factor line can evidence more than one domain — keep matching
      }
    }
  }
  return byDomain;
}

/**
 * Draft risk assessments seeded from the referral — status "draft" throughout:
 * the referral is the placing authority's account, not an assessment. Each
 * draft carries the referral's own wording as triggers so the assessor
 * completes it rather than starting blank.
 */
export function buildDraftRiskAssessments(args: {
  extraction: Pick<ExtractedReferralFields, "risk_factors" | "presenting_needs">;
  childId: string;
  homeId: string;
  actorId: string;
  today: string;
}): Array<Omit<RiskAssessment, "id" | "created_at">> {
  const byDomain = mapRiskFactorsToDomains(args.extraction.risk_factors ?? []);
  const needs = (args.extraction.presenting_needs ?? []).join("; ");

  return [...byDomain.entries()].map(([domain, factors]) => ({
    child_id: args.childId,
    domain,
    current_level: "medium" as const,
    previous_level: "medium" as const,
    trend: "stable" as const,
    status: "draft" as const,
    assessed_by: args.actorId,
    assessed_date: args.today,
    review_date: addDays(args.today, 7),
    triggers: factors,
    indicators: [],
    mitigations: [],
    contingency_plan: "",
    child_views: "",
    history_notes:
      `Drafted automatically from the initial referral on admission — the level is a placeholder, not an assessment. ` +
      `Referral risk wording: ${factors.join("; ")}.` +
      (needs ? ` Presenting needs from referral: ${needs}.` : ""),
    linked_incidents: [],
    home_id: args.homeId,
  }));
}
