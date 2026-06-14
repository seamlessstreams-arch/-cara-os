// ══════════════════════════════════════════════════════════════════════════════
// Cara ORCHESTRATOR — RISK CLASSIFIER
//
// Pure function risk classifier. Scans input text for risk indicators,
// considers user role and context, and returns a risk classification with
// factors found and escalation recommendations.
//
// This is the first gate in the orchestration pipeline — everything
// downstream (agent selection, model choice, approval requirements) flows
// from the risk level determined here.
// ══════════════════════════════════════════════════════════════════════════════

import type { RiskClassification, RiskLevel } from "./types";

// ── Keyword Sets ──────────────────────────────────────────────────────────

const CRITICAL_KEYWORDS = [
  "allegation",
  "sexual abuse",
  "physical abuse",
  "sexual exploitation",
  "criminal exploitation",
  "county lines",
  "missing",
  "absconded",
  "restraint",
  "serious injury",
  "ligature",
  "self-harm",
  "suicide",
  "suicidal",
  "overdose",
  "medication error",
  "police",
  "arrested",
  "charged",
  "LADO",
  "designated officer",
  "Ofsted notification",
  "serious incident",
  "death",
  "radicalisation",
  "forced marriage",
  "FGM",
  "trafficking",
  "modern slavery",
  "child protection",
  "section 47",
  "s47",
  "emergency placement",
  "secure accommodation",
  "deprivation of liberty",
  "DoLS",
  "Reg 40",
  "regulation 40",
  "Schedule 5",
] as const;

const HIGH_KEYWORDS = [
  "Reg 44",
  "Reg 45",
  "regulation 44",
  "regulation 45",
  "Annex A",
  "Quality Standards",
  "SCCIF",
  "Ofsted",
  "inspection",
  "compliance",
  "safeguarding",
  "risk assessment",
  "risk register",
  "child protection plan",
  "looked after review",
  "LAC review",
  "independent visitor",
  "CAMHS",
  "escalating",
  "pattern of concern",
  "persistent absence",
  "exclusion",
  "placement breakdown",
  "disruption meeting",
  "strategy meeting",
  "multi-agency",
  "MASH",
  "notification",
  "significant event",
  "blood-borne",
  "substance misuse",
  "alcohol",
  "drugs",
  "weapons",
  "knife",
  "gang",
  "peer-on-peer",
  "bullying",
  "online harm",
  "indecent images",
  "grooming",
] as const;

const MEDIUM_KEYWORDS = [
  "keywork",
  "direct work",
  "PACE",
  "DDP",
  "ARC framework",
  "trauma",
  "trauma-informed",
  "therapeutic",
  "attachment",
  "relationship repair",
  "behaviour support",
  "positive behaviour",
  "de-escalation",
  "restorative",
  "regulation",
  "sensory",
  "life story",
  "identity work",
  "transitions",
  "contact",
  "family time",
  "education",
  "health",
  "medication",
  "appointment",
  "care plan",
  "placement plan",
  "review",
  "supervision",
  "staff development",
  "training",
] as const;

// ── Roles that escalate risk consideration ────────────────────────────────

const FRONTLINE_ROLES = ["rsw", "residential_care_worker", "support_worker", "bank_staff"];
const MANAGEMENT_ROLES = ["registered_manager", "deputy_manager", "responsible_individual", "ri", "operations", "director"];

// ── Page contexts that elevate risk consideration ─────────────────────────

const HIGH_RISK_PAGES = [
  "safeguarding",
  "incidents",
  "missing",
  "restraint",
  "risk-assessment",
  "notifications",
  "ofsted",
  "regulation",
  "complaints",
  "allegations",
];

// ── Main Classifier ───────────────────────────────────────────────────────

export function classifyRisk(input: {
  query: string;
  role: string;
  currentPage?: string;
  childId?: string;
  sourceContext?: string;
  voiceTranscript?: string;
}): RiskClassification {
  const { query, role, currentPage, sourceContext, voiceTranscript } = input;

  // Combine all text sources for scanning
  const fullText = [
    query,
    sourceContext ?? "",
    voiceTranscript ?? "",
  ].join(" ").toLowerCase();

  const factors: string[] = [];
  let maxLevel: RiskLevel = "low";

  // ── Check critical keywords ─────────────────────────────────────────────
  for (const keyword of CRITICAL_KEYWORDS) {
    if (fullText.includes(keyword.toLowerCase())) {
      factors.push(`Critical keyword detected: "${keyword}"`);
      maxLevel = "critical";
    }
  }

  // ── Check high keywords (only if not already critical) ──────────────────
  if (maxLevel !== "critical") {
    for (const keyword of HIGH_KEYWORDS) {
      if (fullText.includes(keyword.toLowerCase())) {
        factors.push(`High-risk keyword detected: "${keyword}"`);
        maxLevel = "high";
      }
    }
  }

  // ── Check medium keywords ───────────────────────────────────────────────
  if (maxLevel === "low") {
    for (const keyword of MEDIUM_KEYWORDS) {
      if (fullText.includes(keyword.toLowerCase())) {
        factors.push(`Therapeutic/regulatory keyword: "${keyword}"`);
        maxLevel = "medium";
        break; // One medium keyword is enough to escalate from low
      }
    }
  }

  // ── Role-based escalation ───────────────────────────────────────────────
  // Frontline staff asking about high-risk topics should be escalated
  if (FRONTLINE_ROLES.includes(role) && (maxLevel === "high" || maxLevel === "critical")) {
    factors.push(`Frontline staff (${role}) querying high-risk topic — escalation recommended`);
  }

  // ── Page context escalation ─────────────────────────────────────────────
  if (currentPage) {
    const pageNorm = currentPage.toLowerCase();
    for (const riskPage of HIGH_RISK_PAGES) {
      if (pageNorm.includes(riskPage)) {
        if (maxLevel === "low") {
          maxLevel = "medium";
        }
        factors.push(`Query originates from high-risk page context: ${riskPage}`);
        break;
      }
    }
  }

  // ── Multiple critical keywords compound the concern ─────────────────────
  const criticalCount = CRITICAL_KEYWORDS.filter(
    (k) => fullText.includes(k.toLowerCase())
  ).length;
  if (criticalCount >= 3) {
    factors.push(`Multiple critical indicators detected (${criticalCount}) — heightened concern`);
  }

  // ── Determine escalation requirements ───────────────────────────────────
  const safeguardingConcern = maxLevel === "critical" || factors.some(
    (f) => f.includes("allegation") || f.includes("exploitation") || f.includes("missing") ||
           f.includes("LADO") || f.includes("police") || f.includes("self-harm") ||
           f.includes("ligature") || f.includes("suicide")
  );

  const regulatoryConcern = factors.some(
    (f) => f.includes("Reg 4") || f.includes("regulation 4") || f.includes("Ofsted") ||
           f.includes("Annex A") || f.includes("SCCIF") || f.includes("Quality Standards") ||
           f.includes("notification")
  );

  const escalationRequired = maxLevel === "critical" || (
    maxLevel === "high" && FRONTLINE_ROLES.includes(role)
  );

  const managerReviewRequired = maxLevel === "critical" || maxLevel === "high" || (
    maxLevel === "medium" && !MANAGEMENT_ROLES.includes(role)
  );

  return {
    level: maxLevel,
    factors,
    escalationRequired,
    safeguardingConcern,
    regulatoryConcern,
    managerReviewRequired,
  };
}
