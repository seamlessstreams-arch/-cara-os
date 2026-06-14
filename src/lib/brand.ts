// ══════════════════════════════════════════════════════════════════════════════
// CARA OS — CANONICAL BRAND CONFIG
//
// Single source of truth for product naming. Import BRAND rather than
// hard-coding the product name in chrome, metadata or templates.
//
// History: the product and its AI layer were rebranded to Cara / Cara OS in
// June 2026. Internal identifiers from the original brand (CaraCommandId,
// cara_* tables, /api/cara/* endpoints, CARA_* env vars, the cs-/--cs- CSS
// prefix) keep their legacy names for stability — they are never user-facing.
// New env vars use CARA_* with the legacy CARA_* still honoured as a fallback.
// ══════════════════════════════════════════════════════════════════════════════

export const BRAND = {
  productName: process.env.NEXT_PUBLIC_APP_NAME || "Cara",
  shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME || "Cara",
  legalName: "Cara OS",
  category: "The Care Intelligence OS for children's homes",
  positioning: "Cara turns everyday residential care into live safeguarding intelligence.",
  intelligenceName: process.env.NEXT_PUBLIC_AI_NAME || "Cara Intelligence",
  insightsName: "Cara Insights",
  assistantName: process.env.NEXT_PUBLIC_ASSISTANT_NAME || "Cara Assistant",
  studioName: "Cara Studio",
  draftsName: "Cara Drafts",
  advisesName: "Cara Advises",
  recognisesName: "Cara Recognises",
  knowledgeBankName: "Cara Knowledge Bank",
  practiceIntelligenceName: "Cara Practice Intelligence",
  tagline:
    "The Care Intelligence OS for children's homes.",
  description:
    "Cara helps children's homes record in the moment, identify safeguarding patterns, support reflective practice, and evidence the impact of care — without losing professional judgement or the child's voice.",
  assistDisclaimer:
    "Cara supports professional judgement. Staff and managers remain responsible for decisions, recording, and safeguarding actions.",
} as const;

export type BrandKey = keyof typeof BRAND;
