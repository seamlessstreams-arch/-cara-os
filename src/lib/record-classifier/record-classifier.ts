// ══════════════════════════════════════════════════════════════════════════════
// RECORD CLASSIFIER
//
// Analyses free-text input about a child and determines:
//   1. What TYPE of record this is (daily log, incident, safeguarding, etc.)
//   2. What SEVERITY level applies
//   3. What TAGS should be attached
//   4. What FOLLOW-UP actions are needed
//   5. Where the data should FLOW to
//
// Pure deterministic — no LLM calls. Pattern matching and keyword scoring.
// "Staff just writes. Cara figures out the rest."
// ══════════════════════════════════════════════════════════════════════════════

export interface ClassificationResult {
  primary_type: string;
  confidence: "high" | "medium" | "low";
  severity: "low" | "medium" | "high" | "critical" | null;
  secondary_types: string[];
  tags: string[];
  flags: ClassificationFlag[];
  suggested_title: string;
  flows_to: string[];
  requires_immediate_action: boolean;
}

export interface ClassificationFlag {
  type: "safeguarding" | "risk" | "medication" | "missing" | "restraint" | "health" | "education" | "positive";
  message: string;
  urgency: "immediate" | "today" | "routine";
}

// ─── Pattern definitions ─────────────────────────────────────────────────────

interface TypePattern {
  type: string;
  label: string;
  weight: number;
  patterns: RegExp[];
  severity_boost?: "high" | "critical";
  flows: string[];
}

const TYPE_PATTERNS: TypePattern[] = [
  // CRITICAL — check first
  {
    type: "safeguarding_concern",
    label: "Safeguarding Concern",
    weight: 100,
    patterns: [
      /disclos(?:ed|ure|ing)/i,
      /(?:sexual|physical|emotional)\s+abuse/i,
      /neglect(?:ed|ing)?/i,
      /exploit(?:ed|ation|ing)/i,
      /groom(?:ed|ing)/i,
      /(?:inappropriate|indecent)\s+(?:touch|image|contact)/i,
      /safeguard(?:ing)?\s+(?:concern|referral|issue)/i,
      /child\s+protection/i,
      /allegation\s+(?:against|of|about)/i,
      /forced\s+(?:marriage|labour)/i,
      /radicalisation/i,
      /trafficking/i,
    ],
    severity_boost: "critical",
    flows: ["safeguarding_register", "timeline", "tasks", "notifications", "reg_40", "cara", "evidence_pack"],
  },
  {
    type: "missing_from_care",
    label: "Missing from Care",
    weight: 95,
    patterns: [
      /missing\s+from\s+(?:care|home|placement)/i,
      /abscond(?:ed|ing)?/i,
      /absent\s+without\s+(?:permission|authority|leave)/i,
      /run\s+away|ran\s+away/i,
      /(?:hasn't|has\s+not|didn't|did\s+not)\s+(?:return|come\s+(?:back|home))/i,
      /whereabouts\s+unknown/i,
      /not\s+(?:returned|come\s+back|home)\s+(?:by|at|since)/i,
    ],
    severity_boost: "high",
    flows: ["missing_register", "timeline", "tasks", "notifications", "police", "reg_40", "cara"],
  },
  {
    type: "restraint",
    label: "Physical Intervention / Restraint",
    weight: 90,
    patterns: [
      /restrain(?:ed|t|ing)/i,
      /physical\s+intervention/i,
      /held\s+(?:them|him|her|the\s+child)/i,
      /two[\s-]person\s+(?:team|hold|intervention)/i,
      /guided\s+(?:to\s+the\s+floor|away|to\s+safety)/i,
      /restrictive\s+(?:practice|physical\s+intervention)/i,
    ],
    severity_boost: "high",
    flows: ["restraint_log", "timeline", "tasks", "debrief", "body_map", "reg_40", "cara", "evidence_pack"],
  },
  // HIGH
  {
    type: "incident",
    label: "Incident",
    weight: 80,
    patterns: [
      /incident/i,
      /(?:became|got|was)\s+(?:aggressive|violent|physical)/i,
      /(?:hit|kicked|punched|bit|scratched|threw|smashed|broke)\s/i,
      /self[\s-]?harm(?:ed|ing)?/i,
      /(?:cut|cutting)\s+(?:themselves|himself|herself|arms|wrists)/i,
      /overdos(?:ed?|ing)/i,
      /ligature/i,
      /damage(?:d)?\s+(?:to\s+)?property/i,
      /(?:police|ambulance)\s+(?:called|attended|involved)/i,
      /hospital\s+(?:attend|visit|admit)/i,
      /threaten(?:ed|ing)?/i,
      /weapon/i,
      /bull(?:y|ied|ying|ies)/i,
      /online\s+(?:safety|abuse|exploitation)/i,
    ],
    flows: ["timeline", "tasks", "oversight_queue", "notifications", "dashboard", "cara", "evidence_pack"],
  },
  // MEDIUM
  {
    type: "health_update",
    label: "Health Update",
    weight: 60,
    patterns: [
      /(?:gp|doctor|dentist|optician|nurse|camhs|hospital)\s+(?:appointment|visit|referral)/i,
      /medication\s+(?:review|change|started|stopped|error|missed|refused)/i,
      /(?:unwell|ill|sick|fever|temperature|vomiting|diarrhoea|rash|injury|pain)/i,
      /(?:asthma|diabetes|epilepsy|allergy|allergic)\s+(?:attack|episode|reaction)/i,
      /mental\s+health/i,
      /anxiety|depression|suicidal\s+thought/i,
      /weight\s+(?:gain|loss|concern)/i,
      /immunisation|vaccination/i,
    ],
    flows: ["timeline", "health_record", "dashboard", "cara"],
  },
  {
    type: "education_update",
    label: "Education Update",
    weight: 55,
    patterns: [
      /school|college|education/i,
      /(?:pep|personal\s+education\s+plan)/i,
      /(?:attend(?:ance|ed)?|absent|excluded|suspended|expelled)/i,
      /homework|coursework|exam|test|assessment/i,
      /teacher|tutor|senco|head\s*teacher/i,
      /(?:gcse|a[\s-]?level|btec|sats)/i,
      /(?:progress|achievement|grade|result)/i,
      /(?:behaviour|detention|sanction)\s+(?:at|in)\s+school/i,
    ],
    flows: ["timeline", "education_record", "dashboard", "cara"],
  },
  {
    type: "family_contact",
    label: "Family Contact",
    weight: 50,
    patterns: [
      /(?:mum|dad|mother|father|parent|sibling|brother|sister|grandparent|nan|grandad|aunt|uncle|carer|foster)/i,
      /(?:family|contact|visit)\s+(?:time|session|call|video)/i,
      /(?:phone|video)\s+call\s+(?:with|from|to)\s+(?:family|mum|dad)/i,
      /(?:supervised|unsupervised)\s+contact/i,
      /(?:birth|biological)\s+(?:family|parent)/i,
      /(?:letterbox|letter)\s+(?:contact|from|to)/i,
    ],
    flows: ["timeline", "contact_log", "dashboard", "cara"],
  },
  {
    type: "key_work_session",
    label: "Key Work Session",
    weight: 45,
    patterns: [
      /key[\s-]?work(?:ing|er)?\s+(?:session|meeting|discussion)/i,
      /(?:1[\s-]?to[\s-]?1|one[\s-]?to[\s-]?one)\s+(?:session|time|work)/i,
      /direct\s+work/i,
      /life[\s-]?story\s+work/i,
      /(?:therapeutic|therapy)\s+(?:session|work|intervention)/i,
      /wishes\s+(?:and|&)\s+feelings/i,
      /(?:discussed|explored|talked\s+about)\s+(?:feelings|worries|goals|future)/i,
    ],
    flows: ["timeline", "direct_work_record", "dashboard", "child_impact", "cara"],
  },
  {
    type: "welfare_check",
    label: "Welfare Check",
    weight: 40,
    patterns: [
      /welfare\s+check/i,
      /night\s+(?:check|observation|round)/i,
      /(?:checked|checking)\s+(?:on|in\s+on)\s+(?:them|him|her|the\s+child)/i,
      /(?:asleep|sleeping|settled|awake|restless|unsettled)\s+(?:at|during)/i,
      /(?:bed|bedtime|night)\s+(?:routine|time|check)/i,
    ],
    flows: ["timeline", "welfare_log", "dashboard"],
  },
  // DEFAULT — daily log (catches everything else)
  {
    type: "daily_log",
    label: "Daily Log",
    weight: 10,
    patterns: [
      /(?:morning|afternoon|evening|today|tonight|this\s+shift)/i,
      /(?:mood|engagement|settled|unsettled|happy|sad|quiet|chatty)/i,
      /(?:breakfast|lunch|dinner|tea|supper|snack|meal)/i,
      /(?:school|homework|activities|football|tv|gaming|reading)/i,
      /(?:went\s+to\s+bed|woke\s+up|got\s+up|bath|shower)/i,
      /(?:good\s+day|okay\s+day|difficult\s+day|rough\s+day)/i,
    ],
    flows: ["timeline", "dashboard", "reports", "cara"],
  },
];

// ─── Severity detection ──────────────────────────────────────────────────────

function detectSeverity(text: string, primaryType: string): "low" | "medium" | "high" | "critical" | null {
  const lower = text.toLowerCase();

  // Critical indicators
  if (/disclos|sexual\s+abuse|trafficking|exploit|grooming|radicalisation|overdos|ligature|suicid/i.test(lower)) return "critical";

  // High indicators
  if (/self[\s-]?harm|restrain|missing|abscond|hospital|police|weapon|allegation/i.test(lower)) return "high";

  // Medium indicators
  if (/aggressive|violen|damage|bully|threaten|medication\s+error|unwell|anxious|distress/i.test(lower)) return "medium";

  // Type-based boost
  const pattern = TYPE_PATTERNS.find((p) => p.type === primaryType);
  if (pattern?.severity_boost) return pattern.severity_boost;

  // Low or null
  if (primaryType === "incident") return "low";
  return null;
}

// ─── Tag extraction ──────────────────────────────────────────────────────────

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();

  if (/safeguard/i.test(lower)) tags.push("safeguarding");
  if (/self[\s-]?harm|suicid|overdos/i.test(lower)) tags.push("self-harm");
  if (/missing|abscond/i.test(lower)) tags.push("missing");
  if (/restrain|physical\s+intervention/i.test(lower)) tags.push("restraint");
  if (/medication|medicine|inhaler|tablet/i.test(lower)) tags.push("medication");
  if (/school|education|homework/i.test(lower)) tags.push("education");
  if (/family|mum|dad|parent|sibling/i.test(lower)) tags.push("family");
  if (/health|gp|doctor|hospital|dentist/i.test(lower)) tags.push("health");
  if (/positive|achievement|proud|well\s+done|progress/i.test(lower)) tags.push("positive");
  if (/anxious|anxiety|worried|upset|distress/i.test(lower)) tags.push("emotional-wellbeing");
  if (/bully|bullied|bullying/i.test(lower)) tags.push("bullying");
  if (/police/i.test(lower)) tags.push("police-involvement");
  if (/exploit|grooming|online\s+safety/i.test(lower)) tags.push("exploitation");

  return [...new Set(tags)];
}

// ─── Flag generation ─────────────────────────────────────────────────────────

function generateFlags(text: string, primaryType: string, severity: string | null): ClassificationFlag[] {
  const flags: ClassificationFlag[] = [];
  const lower = text.toLowerCase();

  if (primaryType === "safeguarding_concern" || /disclos|safeguard|child\s+protection|allegation|groom(?:ed|ing)|exploit|trafficking|radicalis/i.test(lower)) {
    flags.push({ type: "safeguarding", message: "Safeguarding language detected — ensure safeguarding lead is informed", urgency: "immediate" });
  }
  if (/self[\s-]?harm|suicid|overdos|ligature/i.test(lower)) {
    flags.push({ type: "risk", message: "Self-harm/suicide indicators — review safety plan and increase observations", urgency: "immediate" });
  }
  if (/medication\s+(?:error|missed|wrong|refused)/i.test(lower)) {
    flags.push({ type: "medication", message: "Medication issue detected — complete medication error form", urgency: "today" });
  }
  if (/missing|abscond/i.test(lower)) {
    flags.push({ type: "missing", message: "Missing from care — follow missing persons protocol", urgency: "immediate" });
  }
  if (/restrain|physical\s+intervention/i.test(lower)) {
    flags.push({ type: "restraint", message: "Physical intervention — arrange debrief within 24 hours", urgency: "today" });
  }
  if (/(?:unwell|ill|fever|vomit|injur)/i.test(lower) && !/hospital/i.test(lower)) {
    flags.push({ type: "health", message: "Health concern noted — consider GP/medical attention", urgency: "today" });
  }
  if (/achievement|proud|progress|well\s+done|positive|improved/i.test(lower)) {
    flags.push({ type: "positive", message: "Positive progress — consider recording as an achievement", urgency: "routine" });
  }

  return flags;
}

// ─── Title suggestion ────────────────────────────────────────────────────────

function suggestTitle(text: string, primaryType: string, childName: string): string {
  const first60 = text.trim().slice(0, 60).replace(/\s+\S*$/, "");
  const typeLabel = TYPE_PATTERNS.find((p) => p.type === primaryType)?.label ?? "Record";

  if (primaryType === "daily_log") return `${childName} — daily log`;
  if (primaryType === "safeguarding_concern") return `${childName} — safeguarding concern`;
  if (primaryType === "missing_from_care") return `${childName} — missing from care`;
  if (primaryType === "restraint") return `${childName} — physical intervention`;
  if (primaryType === "incident") return `${childName} — incident: ${first60}`;
  if (primaryType === "welfare_check") return `${childName} — welfare check`;

  return `${childName} — ${typeLabel.toLowerCase()}`;
}

// ─── Main classifier ─────────────────────────────────────────────────────────

export function classifyRecord(text: string, childName: string = "Child"): ClassificationResult {
  // Score each type
  const scores: { type: string; score: number; pattern: TypePattern }[] = [];

  for (const pattern of TYPE_PATTERNS) {
    let score = 0;
    for (const regex of pattern.patterns) {
      regex.lastIndex = 0;
      const matches = text.match(regex);
      if (matches) {
        score += pattern.weight;
      }
    }
    if (score > 0) {
      scores.push({ type: pattern.type, score, pattern });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Primary type — highest scoring, or daily_log as default
  const primary = scores[0] ?? { type: "daily_log", score: 10, pattern: TYPE_PATTERNS[TYPE_PATTERNS.length - 1] };
  const secondary = scores.slice(1, 4).map((s) => s.type);

  // Confidence based on score gap
  let confidence: "high" | "medium" | "low" = "low";
  if (primary.score >= 200) confidence = "high";
  else if (primary.score >= 80) confidence = "high";
  else if (primary.score >= 40) confidence = "medium";

  // If nothing matched strongly, default to daily log with low confidence
  if (scores.length === 0 || primary.score < 20) {
    confidence = "low";
  }

  const severity = detectSeverity(text, primary.type);
  const tags = extractTags(text);
  const flags = generateFlags(text, primary.type, severity);

  return {
    primary_type: primary.type,
    confidence,
    severity,
    secondary_types: secondary,
    tags,
    flags,
    suggested_title: suggestTitle(text, primary.type, childName),
    flows_to: primary.pattern.flows,
    requires_immediate_action: flags.some((f) => f.urgency === "immediate"),
  };
}
