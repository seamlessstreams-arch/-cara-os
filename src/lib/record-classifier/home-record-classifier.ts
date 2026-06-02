// ══════════════════════════════════════════════════════════════════════════════
// HOME RECORD CLASSIFIER
//
// The Home-domain counterpart to the child and staff classifiers. Analyses
// free-text input about the home/premises and routes it to the right record
// type. Completes the three-domain "enter once, use everywhere" model.
//
// Pure deterministic — no LLM calls.
// ══════════════════════════════════════════════════════════════════════════════

export interface HomeClassificationResult {
  primary_type: string;
  confidence: "high" | "medium" | "low";
  secondary_types: string[];
  tags: string[];
  flags: HomeClassificationFlag[];
  suggested_title: string;
  flows_to: string[];
  requires_immediate_action: boolean;
}

export interface HomeClassificationFlag {
  type: "safety" | "compliance" | "maintenance" | "fire" | "positive";
  message: string;
  urgency: "immediate" | "today" | "routine";
}

interface HomeTypePattern {
  type: string;
  label: string;
  weight: number;
  patterns: RegExp[];
  flows: string[];
}

const HOME_TYPE_PATTERNS: HomeTypePattern[] = [
  {
    type: "fire_drill",
    label: "Fire Drill / Fire Safety",
    weight: 90,
    patterns: [
      /fire\s+(?:drill|alarm|safety|risk\s+assessment|evacuation|extinguisher|blanket|door)/i,
      /(?:smoke|heat)\s+(?:alarm|detector)/i,
      /evacuation\s+(?:drill|practice|route)/i,
      /(?:PEEP|personal\s+emergency\s+evacuation)/i,
    ],
    flows: ["home_record", "timeline", "compliance", "dashboard", "aria"],
  },
  {
    type: "health_safety_check",
    label: "Health & Safety Check",
    weight: 80,
    patterns: [
      /health\s+(?:and|&)\s+safety|h&s|hse/i,
      /(?:risk\s+assessment|hazard|slip|trip|fall)/i,
      /(?:legionella|water\s+temperature|cold\s+water|hot\s+water)/i,
      /(?:coshh|hazardous\s+substance|chemical\s+storage)/i,
      /(?:\bppe\b|first\s+aid\s+kit|accident\s+book)/i,
      /(?:electrical|pat\s+test|gas\s+safety|boiler)\s+(?:check|test|safety)/i,
      /window\s+restrictor|blind\s+cord/i,
    ],
    flows: ["home_record", "timeline", "compliance", "dashboard", "aria"],
  },
  {
    type: "maintenance_request",
    label: "Maintenance / Repair",
    weight: 70,
    patterns: [
      /(?:maintenance|repair|broken|faulty|leak(?:ing)?|damaged?)/i,
      /(?:plumbing|heating|electrical|boiler|radiator)\s+(?:issue|problem|fault|broken)/i,
      /(?:needs?\s+(?:fixing|repairing|replacing))/i,
      /(?:contractor|handyman|plumber|electrician|engineer)\s+(?:called|booked|attended)/i,
      /(?:appliance|washing\s+machine|dryer|fridge|oven|dishwasher)\s+(?:broken|faulty|not\s+working)/i,
      /(?:damp|mould|condensation)/i,
    ],
    flows: ["home_record", "timeline", "tasks", "dashboard", "aria"],
  },
  {
    type: "vehicle_check",
    label: "Vehicle Check",
    weight: 70,
    patterns: [
      /vehicle\s+(?:check|inspection|maintenance|service|mot|tax|insurance)/i,
      /(?:car|van|minibus)\s+(?:check|service|mot|fuel|mileage|tyre)/i,
      /(?:mot|tax|insurance)\s+(?:due|expir|renewal)/i,
      /(?:tyre|brake|oil|fuel|mileage|dashboard\s+warning)/i,
    ],
    flows: ["home_record", "timeline", "compliance", "dashboard"],
  },
  {
    type: "home_audit",
    label: "Home Audit",
    weight: 60,
    patterns: [
      /(?:home|premises|environment)\s+audit/i,
      /(?:reg(?:ulation)?\s*44|reg(?:ulation)?\s*45)\s+(?:visit|inspection)/i,
      /(?:medication|finance|petty\s+cash|pocket\s+money)\s+audit/i,
      /(?:quality\s+assurance|qa)\s+(?:visit|check|audit)/i,
      /(?:cleanliness|hygiene|infection\s+control)\s+(?:audit|check)/i,
      /(?:manager(?:'s)?|monthly|weekly)\s+(?:walk[\s-]?round|inspection|audit)/i,
    ],
    flows: ["home_record", "timeline", "compliance", "evidence_pack", "dashboard", "aria"],
  },
  {
    type: "observation",
    label: "Home Meeting / Note",
    weight: 30,
    patterns: [
      /(?:team|staff|house|residents?|young\s+people'?s?)\s+meeting/i,
      /(?:meeting\s+(?:minutes|notes)|agenda)/i,
      /(?:house\s+rules|community\s+meeting)/i,
      /(?:general\s+note|home\s+log|premises\s+note)/i,
    ],
    flows: ["home_record", "timeline", "dashboard"],
  },
];

function extractHomeTags(text: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();
  if (/fire|smoke|evacuation/i.test(lower)) tags.push("fire-safety");
  if (/health\s+(?:and|&)\s+safety|hazard|risk\s+assessment/i.test(lower)) tags.push("health-safety");
  if (/maintenance|repair|broken|faulty|leak/i.test(lower)) tags.push("maintenance");
  if (/legionella|water\s+temperature/i.test(lower)) tags.push("legionella");
  if (/vehicle|car|van|minibus|mot/i.test(lower)) tags.push("vehicle");
  if (/audit|reg\s*4[45]|inspection/i.test(lower)) tags.push("compliance");
  if (/damp|mould/i.test(lower)) tags.push("damp-mould");
  if (/(?:passed|compliant|satisfactory|all\s+(?:clear|good|in\s+order))/i.test(lower)) tags.push("positive");
  return [...new Set(tags)];
}

function generateHomeFlags(text: string, primaryType: string): HomeClassificationFlag[] {
  const flags: HomeClassificationFlag[] = [];
  const lower = text.toLowerCase();

  if (/fire\s+(?:alarm|door)\s+(?:not\s+working|faulty|broken)|no\s+(?:smoke|fire)\s+(?:alarm|detector)|fire\s+exit\s+blocked/i.test(lower)) {
    flags.push({ type: "fire", message: "Fire safety hazard — rectify immediately and inform the Registered Manager", urgency: "immediate" });
  }
  if (/(?:gas\s+leak|electrical\s+fault|exposed\s+wire|legionella|carbon\s+monoxide|flood)/i.test(lower)) {
    flags.push({ type: "safety", message: "Serious safety hazard — make safe immediately and arrange urgent contractor", urgency: "immediate" });
  }
  if (primaryType === "maintenance_request" || /broken|faulty|not\s+working|needs?\s+(?:fixing|repairing)/i.test(lower)) {
    flags.push({ type: "maintenance", message: "Maintenance issue logged — raise a work order and track to completion", urgency: "today" });
  }
  if (/(?:overdue|expir(?:ed|ing)|due\s+for\s+renewal)/i.test(lower)) {
    flags.push({ type: "compliance", message: "Compliance currency issue — schedule before expiry to stay inspection-ready", urgency: "today" });
  }
  if (/(?:passed|compliant|satisfactory|all\s+(?:clear|good|in\s+order))/i.test(lower)) {
    flags.push({ type: "positive", message: "Compliant check — file as inspection evidence", urgency: "routine" });
  }
  return flags;
}

function suggestHomeTitle(text: string, primaryType: string, homeName: string): string {
  const label = HOME_TYPE_PATTERNS.find((p) => p.type === primaryType)?.label ?? "Home Record";
  if (primaryType === "fire_drill") return `${homeName} — fire safety`;
  if (primaryType === "health_safety_check") return `${homeName} — health & safety check`;
  if (primaryType === "maintenance_request") return `${homeName} — maintenance`;
  if (primaryType === "vehicle_check") return `${homeName} — vehicle check`;
  if (primaryType === "home_audit") return `${homeName} — home audit`;
  return `${homeName} — ${label.toLowerCase()}`;
}

export function classifyHomeRecord(text: string, homeName: string = "Home"): HomeClassificationResult {
  const scores: { type: string; score: number; pattern: HomeTypePattern }[] = [];

  for (const pattern of HOME_TYPE_PATTERNS) {
    let score = 0;
    for (const regex of pattern.patterns) {
      regex.lastIndex = 0;
      if (regex.test(text)) score += pattern.weight;
    }
    if (score > 0) scores.push({ type: pattern.type, score, pattern });
  }

  scores.sort((a, b) => b.score - a.score);

  const primary = scores[0] ?? {
    type: "observation",
    score: 30,
    pattern: HOME_TYPE_PATTERNS[HOME_TYPE_PATTERNS.length - 1],
  };
  const secondary = scores.slice(1, 4).map((s) => s.type);

  let confidence: "high" | "medium" | "low" = "low";
  if (primary.score >= 140) confidence = "high";
  else if (primary.score >= 70) confidence = "high";
  else if (primary.score >= 50) confidence = "medium";
  if (scores.length === 0 || primary.score < 30) confidence = "low";

  const tags = extractHomeTags(text);
  const flags = generateHomeFlags(text, primary.type);

  return {
    primary_type: primary.type,
    confidence,
    secondary_types: secondary,
    tags,
    flags,
    suggested_title: suggestHomeTitle(text, primary.type, homeName),
    flows_to: primary.pattern.flows,
    requires_immediate_action: flags.some((f) => f.urgency === "immediate"),
  };
}
