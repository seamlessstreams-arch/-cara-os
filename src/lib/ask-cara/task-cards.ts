// ══════════════════════════════════════════════════════════════════════════════
// CARA — ASK CARA TASK CARDS (§2)
//
// Ask CARA is mode-led, not an open chatbot: the user chooses a governed task
// card. Every card either (a) sends a prompt the deterministic engine already
// answers, or (b) routes to a real existing CARA feature. No dead cards — each
// action works today. Cards are role-gated with the same tiers as the engine.
// ══════════════════════════════════════════════════════════════════════════════

import type { AccessTier } from "./types";

export const ASK_CARA_TASK_CARDS_VERSION = "1.0.0";

export const ASK_CARA_BANNER =
  "Ask CARA is the approved support route. Do not copy child, staff, family, safeguarding, health, placement, allegation or operational information into external AI tools.";

export type TaskCardCategory =
  | "Recording & Writing"
  | "Child-Centred Practice"
  | "Workflow Support"
  | "Management & Oversight"
  | "Evidence, Audit & Inspection"
  | "Professional Communication"
  | "Reflection & Supervision"
  | "Shadow-AI Governance";

/** ask = send this prompt to the deterministic engine · route = open a feature. */
export type TaskCardAction = { type: "ask"; prompt: string } | { type: "route"; href: string };

export interface AskCaraTaskCard {
  id: string;
  category: TaskCardCategory;
  label: string;
  description: string;
  tier: AccessTier;
  action: TaskCardAction;
}

export const ASK_CARA_TASK_CARDS: AskCaraTaskCard[] = [
  // A. Recording & Writing
  { id: "improve_record", category: "Recording & Writing", label: "Improve this record", description: "Tidy tone and structure without changing the facts.", tier: "care_team", action: { type: "route", href: "/cara/recording-assistant" } },
  { id: "spelling_grammar", category: "Recording & Writing", label: "Check spelling & grammar", description: "Local spelling and grammar check — nothing leaves CARA.", tier: "care_team", action: { type: "ask", prompt: "check the spelling and grammar of my record" } },
  { id: "simplify", category: "Recording & Writing", label: "Simplify this language", description: "Plain, clear wording that keeps the meaning.", tier: "care_team", action: { type: "ask", prompt: "simplify this language" } },
  { id: "dictation", category: "Recording & Writing", label: "Clean up a voice note", description: "Structure a dictated note and prompt for anything missing.", tier: "care_team", action: { type: "ask", prompt: "turn this voice note into a daily log" } },

  // B. Child-Centred Practice
  { id: "write_to_child", category: "Child-Centred Practice", label: "Write to the child", description: "Warm, honest, non-blaming wording that keeps the child's own words.", tier: "care_team", action: { type: "ask", prompt: "help me write this to the child" } },
  { id: "capture_voice", category: "Child-Centred Practice", label: "Reflect on a child", description: "Reflective prompts grounded in the child's record.", tier: "everyone", action: { type: "ask", prompt: "help me reflect on a child" } },

  // C. Workflow Support
  { id: "next_steps", category: "Workflow Support", label: "What do I need to do next?", description: "What the records say needs you, most critical first.", tier: "care_team", action: { type: "ask", prompt: "what needs my attention today?" } },
  { id: "shift_brief", category: "Workflow Support", label: "Brief me for my shift", description: "Who's on, what to watch, what's outstanding.", tier: "care_team", action: { type: "ask", prompt: "brief me for my shift" } },
  { id: "whats_due", category: "Workflow Support", label: "What's due this week?", description: "Overdue and upcoming actions and reviews.", tier: "care_team", action: { type: "ask", prompt: "what's due this week?" } },

  // D. Management & Oversight
  { id: "oversight_prep", category: "Management & Oversight", label: "Prepare management oversight", description: "CARA assembles the evidence; the manager writes and signs.", tier: "management", action: { type: "route", href: "/cara/manager-oversight" } },
  { id: "home_overview", category: "Management & Oversight", label: "How is the home doing?", description: "Occupancy, incidents, restraints, oversight gaps.", tier: "management", action: { type: "ask", prompt: "how is the home doing?" } },
  { id: "overdue_supervision", category: "Management & Oversight", label: "Who's overdue supervision?", description: "Staff due or overdue a supervision session.", tier: "management", action: { type: "ask", prompt: "who's overdue supervision?" } },
  { id: "overdue_training", category: "Management & Oversight", label: "Who's overdue training?", description: "Expired, expiring and not-started mandatory training.", tier: "management", action: { type: "ask", prompt: "who's overdue training?" } },

  // E. Evidence, Audit & Inspection
  { id: "reg44", category: "Evidence, Audit & Inspection", label: "Prepare Reg 44 evidence", description: "Source-linked evidence against the Quality Standards.", tier: "management", action: { type: "ask", prompt: "prepare reg 44 evidence" } },
  { id: "reg45", category: "Evidence, Audit & Inspection", label: "Prepare Reg 45 evidence", description: "Rolling quality-of-care review evidence.", tier: "management", action: { type: "ask", prompt: "prepare reg 45 evidence" } },
  { id: "inspection", category: "Evidence, Audit & Inspection", label: "Inspection readiness", description: "Evidence and gaps across Ofsted's three SCCIF areas.", tier: "management", action: { type: "route", href: "/intelligence/cara/inspection-intelligence" } },
  { id: "chronology", category: "Evidence, Audit & Inspection", label: "Build a chronology", description: "Timeline from authorised CARA records, gaps flagged.", tier: "care_team", action: { type: "ask", prompt: "build a chronology from these records" } },

  // F. Professional Communication
  { id: "sw_update", category: "Professional Communication", label: "Prepare a professional update", description: "Draft an update with information-sharing prompts.", tier: "care_team", action: { type: "ask", prompt: "prepare a social worker update" } },
  { id: "contacts", category: "Professional Communication", label: "Who do I contact?", description: "A child's social worker, IRO, GP and professional network.", tier: "care_team", action: { type: "ask", prompt: "who do I contact about a child?" } },
  { id: "redact", category: "Professional Communication", label: "Redact before sharing", description: "Stable Child A / Staff 1 codes before anything leaves the home.", tier: "care_team", action: { type: "route", href: "/redaction-tool" } },

  // H. Reflection & Supervision
  { id: "reflect_incident", category: "Reflection & Supervision", label: "Reflect after an incident", description: "Structured, non-judgemental reflective prompts.", tier: "everyone", action: { type: "ask", prompt: "help me reflect after an incident" } },
  { id: "supervision_prep", category: "Reflection & Supervision", label: "Prepare for supervision", description: "Prompts to bring your practice to supervision.", tier: "everyone", action: { type: "ask", prompt: "help me reflect and prepare for supervision" } },

  // I. Shadow-AI Governance
  { id: "declare_ai", category: "Shadow-AI Governance", label: "Declare external AI use", description: "Used ChatGPT or similar? Declare it safely and get the CARA route.", tier: "everyone", action: { type: "route", href: "/ask-cara/declare" } },
];

const TIER_RANK: Record<AccessTier, number> = { everyone: 0, care_team: 1, management: 2 };
const MANAGEMENT_ROLES = new Set(["registered_manager", "deputy_manager", "responsible_individual", "org_director", "area_manager", "platform_admin"]);
const CARE_ROLES = new Set([...MANAGEMENT_ROLES, "residential_care_worker", "senior_residential_care_worker", "senior_residential_worker", "team_leader", "bank_worker", "support_worker", "waking_night_worker"]);

export function roleTierForCards(role?: string): AccessTier {
  const r = (role ?? "").toLowerCase();
  if (!r) return "care_team";
  if (MANAGEMENT_ROLES.has(r)) return "management";
  if (CARE_ROLES.has(r)) return "care_team";
  return "everyone";
}

/** Cards the role may see, grouped by category (category order preserved). */
export function taskCardsForRole(role?: string): { category: TaskCardCategory; cards: AskCaraTaskCard[] }[] {
  const tier = roleTierForCards(role);
  const allowed = ASK_CARA_TASK_CARDS.filter((c) => TIER_RANK[tier] >= TIER_RANK[c.tier]);
  const order: TaskCardCategory[] = ["Workflow Support", "Recording & Writing", "Child-Centred Practice", "Reflection & Supervision", "Professional Communication", "Management & Oversight", "Evidence, Audit & Inspection", "Shadow-AI Governance"];
  return order
    .map((category) => ({ category, cards: allowed.filter((c) => c.category === category) }))
    .filter((g) => g.cards.length > 0);
}
