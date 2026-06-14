// ══════════════════════════════════════════════════════════════════════════════
// STAFF RECORD CLASSIFIER
//
// The Employees-domain counterpart to record-classifier.ts.
// Analyses free-text input about a staff member and determines what type of
// record it is, then routes it everywhere it needs to go.
//
// Pure deterministic — no LLM calls. "Just write about your team. We route it."
// ══════════════════════════════════════════════════════════════════════════════

export interface StaffClassificationResult {
  primary_type: string;
  confidence: "high" | "medium" | "low";
  secondary_types: string[];
  tags: string[];
  flags: StaffClassificationFlag[];
  suggested_title: string;
  flows_to: string[];
  requires_immediate_action: boolean;
}

export interface StaffClassificationFlag {
  type: "wellbeing" | "performance" | "training" | "conduct" | "positive";
  message: string;
  urgency: "immediate" | "today" | "routine";
}

interface StaffTypePattern {
  type: string;
  label: string;
  weight: number;
  patterns: RegExp[];
  flows: string[];
}

const STAFF_TYPE_PATTERNS: StaffTypePattern[] = [
  // Conduct / performance concerns — check first (highest priority)
  {
    type: "performance_support",
    label: "Performance Support",
    weight: 90,
    patterns: [
      /performance\s+(?:concern|issue|support|plan|improvement)/i,
      /capability/i,
      /(?:disciplinary|misconduct|gross\s+misconduct)/i,
      /(?:pip|performance\s+improvement\s+plan)/i,
      /(?:underperform|under[\s-]performing|not\s+meeting\s+(?:standards|expectations))/i,
      /(?:formal|informal)\s+warning/i,
      /probation\s+(?:concern|review|extension|fail)/i,
      /competenc(?:y|ies)\s+(?:concern|gap)/i,
    ],
    flows: ["staff_record", "timeline", "tasks", "hr", "cara"],
  },
  // Wellbeing
  {
    type: "wellbeing_check",
    label: "Wellbeing Check-In",
    weight: 80,
    patterns: [
      /wellbeing|well[\s-]being/i,
      /(?:stress(?:ed)?|burn[\s-]?out|overwhelmed|exhausted|struggling)/i,
      /(?:mental\s+health|anxiety|low\s+mood|emotional)/i,
      /(?:sickness|absence|time\s+off)\s+(?:concern|pattern|due\s+to)/i,
      /(?:work[\s-]life\s+balance|workload\s+concern)/i,
      /(?:supervision\s+)?support\s+(?:offered|needed|requested)/i,
      /(?:EAP|employee\s+assistance|counselling)/i,
    ],
    flows: ["staff_record", "timeline", "tasks", "cara"],
  },
  // Training
  {
    type: "training_record",
    label: "Training Record",
    weight: 70,
    patterns: [
      /training|course|certification|qualification|cpd/i,
      /(?:completed|attended|booked|enrolled)\s+(?:a\s+)?(?:course|training|workshop)/i,
      /(?:safeguarding|first\s+aid|de[\s-]?escalation|medication|fire\s+safety|manual\s+handling)\s+training/i,
      /(?:level\s+[345]|diploma|nvq)/i,
      /(?:refresher|renewal|expir(?:ed|ing)|due\s+for\s+renewal)/i,
      /(?:e[\s-]?learning|online\s+module)/i,
    ],
    flows: ["staff_record", "timeline", "training_matrix", "dashboard", "cara"],
  },
  // Observation
  {
    type: "observation",
    label: "Practice Observation",
    weight: 65,
    patterns: [
      /observ(?:ation|ed|ing)/i,
      /(?:practice|shift|direct\s+work)\s+observation/i,
      /(?:watched|saw|noted)\s+(?:them|him|her|the\s+staff)\s+(?:interact|work|handle|manage)/i,
      /(?:role[\s-]?model(?:led|ling)?|demonstrated\s+(?:good|excellent|poor))/i,
      /(?:handover|key\s+work)\s+(?:quality|observation)/i,
    ],
    flows: ["staff_record", "timeline", "dashboard", "cara"],
  },
  // Supervision — default for general staff notes
  {
    type: "supervision",
    label: "Supervision",
    weight: 40,
    patterns: [
      /supervis(?:ion|ory|e[ds]?)/i,
      /(?:1[\s-]?to[\s-]?1|one[\s-]?to[\s-]?one)\s+(?:with|meeting|session)/i,
      /(?:caseload|reflective\s+practice|case\s+discussion)/i,
      /(?:agreed\s+actions?|action\s+points?|next\s+steps?)/i,
      /(?:discussed|reviewed|reflected\s+on)\s+(?:their|his|her)\s+(?:work|caseload|practice|development)/i,
      /(?:appraisal|development\s+(?:plan|review|goal))/i,
      /(?:catch[\s-]?up|check[\s-]?in)\s+(?:with|meeting)/i,
    ],
    flows: ["staff_record", "timeline", "dashboard", "cara"],
  },
];

function extractStaffTags(text: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();
  if (/stress|burn[\s-]?out|overwhelmed|exhausted/i.test(lower)) tags.push("wellbeing-concern");
  if (/training|course|cpd|qualification/i.test(lower)) tags.push("training");
  if (/safeguarding/i.test(lower)) tags.push("safeguarding");
  if (/performance|capability|disciplinary|misconduct/i.test(lower)) tags.push("performance");
  if (/sickness|absence|time\s+off/i.test(lower)) tags.push("absence");
  if (/(?:excellent|outstanding|proud|well\s+done|great\s+work|positive)/i.test(lower)) tags.push("positive");
  if (/probation/i.test(lower)) tags.push("probation");
  if (/reflective\s+practice|reflection/i.test(lower)) tags.push("reflective-practice");
  return [...new Set(tags)];
}

function generateStaffFlags(text: string, primaryType: string): StaffClassificationFlag[] {
  const flags: StaffClassificationFlag[] = [];
  const lower = text.toLowerCase();

  if (/gross\s+misconduct|safeguarding\s+(?:concern|allegation)\s+(?:against|about)\s+(?:staff|them|him|her)/i.test(lower)) {
    flags.push({ type: "conduct", message: "Possible serious conduct/safeguarding matter — escalate to Registered Manager / RI immediately", urgency: "immediate" });
  }
  if (primaryType === "performance_support" || /disciplinary|misconduct|capability|formal\s+warning/i.test(lower)) {
    flags.push({ type: "performance", message: "Performance/conduct matter — follow HR process and ensure fair procedure", urgency: "today" });
  }
  if (primaryType === "wellbeing_check" || /stress|burn[\s-]?out|struggling|mental\s+health|overwhelmed/i.test(lower)) {
    flags.push({ type: "wellbeing", message: "Wellbeing concern — consider EAP referral, workload review, and follow-up check-in", urgency: "today" });
  }
  if (/expir(?:ed|ing)|due\s+for\s+renewal|overdue/i.test(lower)) {
    flags.push({ type: "training", message: "Training currency issue — book renewal before expiry to maintain compliance", urgency: "today" });
  }
  if (/excellent|outstanding|proud|well\s+done|great\s+work/i.test(lower)) {
    flags.push({ type: "positive", message: "Positive practice — consider recognition and sharing as good practice", urgency: "routine" });
  }
  return flags;
}

function suggestStaffTitle(text: string, primaryType: string, staffName: string): string {
  const label = STAFF_TYPE_PATTERNS.find((p) => p.type === primaryType)?.label ?? "Staff Record";
  if (primaryType === "supervision") return `${staffName} — supervision`;
  if (primaryType === "training_record") return `${staffName} — training record`;
  if (primaryType === "observation") return `${staffName} — practice observation`;
  if (primaryType === "wellbeing_check") return `${staffName} — wellbeing check-in`;
  if (primaryType === "performance_support") return `${staffName} — performance support`;
  return `${staffName} — ${label.toLowerCase()}`;
}

export function classifyStaffRecord(text: string, staffName: string = "Staff member"): StaffClassificationResult {
  const scores: { type: string; score: number; pattern: StaffTypePattern }[] = [];

  for (const pattern of STAFF_TYPE_PATTERNS) {
    let score = 0;
    for (const regex of pattern.patterns) {
      regex.lastIndex = 0;
      if (regex.test(text)) score += pattern.weight;
    }
    if (score > 0) scores.push({ type: pattern.type, score, pattern });
  }

  scores.sort((a, b) => b.score - a.score);

  const primary = scores[0] ?? {
    type: "supervision",
    score: 40,
    pattern: STAFF_TYPE_PATTERNS[STAFF_TYPE_PATTERNS.length - 1],
  };
  const secondary = scores.slice(1, 4).map((s) => s.type);

  let confidence: "high" | "medium" | "low" = "low";
  if (primary.score >= 140) confidence = "high";
  else if (primary.score >= 70) confidence = "high";
  else if (primary.score >= 40) confidence = "medium";
  if (scores.length === 0 || primary.score < 40) confidence = "low";

  const tags = extractStaffTags(text);
  const flags = generateStaffFlags(text, primary.type);

  return {
    primary_type: primary.type,
    confidence,
    secondary_types: secondary,
    tags,
    flags,
    suggested_title: suggestStaffTitle(text, primary.type, staffName),
    flows_to: primary.pattern.flows,
    requires_immediate_action: flags.some((f) => f.urgency === "immediate"),
  };
}
