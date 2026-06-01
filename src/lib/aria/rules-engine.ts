// ══════════════════════════════════════════════════════════════════════════════
// ARIA RULES ENGINE — Deterministic Intelligence Without API Calls
//
// Replaces LLM calls for ~60% of ARIA commands with:
//   1. Pattern matchers — extract structured data from text
//   2. Template generators — produce formatted output from data
//   3. Quality checkers — evaluate text against rubrics
//   4. Suggestion generators — recommend actions from context
//
// Design principle: Rules first, LLM only for genuine synthesis.
// Every rule produces output identical in format to LLM output so the
// downstream approval/audit/display pipeline works unchanged.
//
// Cost: £0/call. Latency: <5ms. Reliability: 100%.
// ══════════════════════════════════════════════════════════════════════════════

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RuleResult {
  output: string;
  confidence: "high" | "medium" | "low";
  method: "rules" | "template" | "pattern" | "hybrid";
  suggestions?: string[];
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

export type RuleHandler = (input: string, context?: RuleContext) => RuleResult | null;

export interface RuleContext {
  childId?: string;
  childName?: string;
  staffId?: string;
  staffName?: string;
  module?: string;
  recordType?: string;
  severity?: string;
  date?: string;
}

// ─── Pattern Library ─────────────────────────────────────────────────────────

const ACTION_PATTERNS = [
  /(?:need(?:s|ed)?\s+to|must|should|require[sd]?|ensure|arrange|book|schedule|contact|refer|update|review|complete|follow[\s-]?up|chase|escalate|notify|inform|assess|monitor|check)\s+(.{10,120}?)(?:\.|$|;|\n)/gi,
  /(?:action(?:s)?|task(?:s)?|to[\s-]?do|next\s+step(?:s)?)[:\s]+(.{10,120}?)(?:\.|$|;|\n)/gi,
  /(?:please|kindly)\s+([\w\s]{10,80}?)(?:\.|$|;|\n)/gi,
];

const RISK_PATTERNS = [
  { pattern: /self[\s-]?harm|suicid|overdose|ligature/gi, level: "critical", category: "self-harm" },
  { pattern: /safeguard|child\s*protection|disclosure|abuse|neglect|exploitation/gi, level: "critical", category: "safeguarding" },
  { pattern: /missing|abscond|absent\s+without/gi, level: "high", category: "missing" },
  { pattern: /restrain|physical\s+intervention|hold/gi, level: "high", category: "restraint" },
  { pattern: /aggressive|violen|assault|threaten|weapon/gi, level: "high", category: "aggression" },
  { pattern: /medication\s+error|wrong\s+dose|missed\s+med/gi, level: "high", category: "medication" },
  { pattern: /bully|intimidat|target/gi, level: "medium", category: "bullying" },
  { pattern: /upset|distress|anxious|worry|concern/gi, level: "medium", category: "emotional" },
  { pattern: /damage|broke|smash|destroy/gi, level: "medium", category: "property" },
  { pattern: /late|overdue|missed\s+appointment|did\s+not\s+attend/gi, level: "low", category: "compliance" },
];

const MISSING_INFO_PATTERNS = [
  { field: "time", pattern: /\d{1,2}[:.]\d{2}/, missing: "No specific time recorded" },
  { field: "location", pattern: /(?:in\s+the|at\s+the|bedroom|kitchen|living|garden|school|bathroom|office|lounge|dining|corridor|hallway|car|vehicle)/i, missing: "No location specified" },
  { field: "witnesses", pattern: /witness|present|saw|observed|staff\s+\w+\s+(?:was|were)\s+(?:also|there|present)/i, missing: "No witnesses identified" },
  { field: "child_voice", pattern: /(?:child|young\s+person|they|he|she)\s+(?:said|stated|expressed|felt|reported|told|asked|wanted|wished)/i, missing: "Child's voice/views not recorded" },
  { field: "immediate_action", pattern: /(?:staff|we|I)\s+(?:did|took|called|contacted|moved|removed|supported|offered|provided|reassured)/i, missing: "No immediate action described" },
  { field: "de_escalation", pattern: /de[\s-]?escalat|calm|redirect|distract|sensory|quiet|space|break|cool[\s-]?down/i, missing: "No de-escalation techniques described" },
  { field: "follow_up", pattern: /follow[\s-]?up|next\s+step|plan|review|monitor|check\s+(?:on|in\s+with)/i, missing: "No follow-up actions identified" },
  { field: "notification", pattern: /notif|inform|told|contact(?:ed)?\s+(?:manager|parent|social\s+worker|police|ofsted)/i, missing: "No notifications recorded" },
];

const TONE_ISSUES = [
  { pattern: /\b(naughty|bad|terrible|awful|stupid|lazy|attention[\s-]?seeking|manipulat|defiant|difficult child)\b/gi, issue: "Judgemental language", fix: "Use behaviour-descriptive language instead of labels" },
  { pattern: /\b(kicked off|went mental|lost it|flipped out|had a meltdown|threw a wobbler)\b/gi, issue: "Informal/colloquial language", fix: "Use professional, descriptive language" },
  { pattern: /\b(refused|wouldn't|won't comply|non[\s-]?complian)/gi, issue: "Compliance-framing", fix: "Consider 'was unable to' or 'found it difficult to' — trauma-informed framing" },
  { pattern: /\b(always|never|every\s+time|constantly)\b/gi, issue: "Absolute language", fix: "Use specific frequency — 'on three occasions this week' rather than absolutes" },
  { pattern: /\b(aggressive child|violent child|dangerous)\b/gi, issue: "Labelling the child", fix: "Describe the behaviour, not the child — 'displayed aggressive behaviour' not 'aggressive child'" },
  { pattern: /\b(punishment|punish|consequence for bad|sanction)\b/gi, issue: "Punitive language", fix: "Use 'natural consequence' or 'restorative approach' — CHR 2015 prohibits punishment" },
];

const QUALITY_RUBRIC = {
  min_length: 50,
  has_time: /\d{1,2}[:.]\d{2}/,
  has_date: /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|\b(?:today|yesterday|this\s+morning|this\s+afternoon|this\s+evening|tonight)\b/i,
  has_child_reference: /(?:child|young\s+person|[A-Z][a-z]+)\s+(?:was|is|had|said|felt|appeared|seemed|looked|became)/i,
  has_staff_action: /(?:staff|we|I|carer|worker)\s+(?:did|spoke|offered|provided|supported|contacted|recorded|completed|observed|noticed|responded)/i,
  first_person_appropriate: /\b(?:I|we|staff)\b/i,
  avoids_jargon: true,
};

// ─── Rule Handlers ───────────────────────────────────────────────────────────

/** Extract action items from any text */
function extractActions(input: string): RuleResult {
  const actions: string[] = [];
  for (const pattern of ACTION_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(input)) !== null) {
      const action = match[1].trim().replace(/[,;]$/, "").trim();
      if (action.length >= 10 && action.length <= 150 && !actions.some((a) => a.toLowerCase() === action.toLowerCase())) {
        actions.push(action.charAt(0).toUpperCase() + action.slice(1));
      }
    }
  }

  if (actions.length === 0) {
    return {
      output: "No specific action items identified in this text. Consider adding clear next steps such as 'Follow up with [person] by [date]' or 'Review [document] before [deadline]'.",
      confidence: "medium",
      method: "pattern",
      suggestions: ["Add explicit action items with owners and deadlines"],
    };
  }

  const numbered = actions.map((a, i) => `${i + 1}. ${a}`).join("\n");
  return {
    output: `**Action Items Identified (${actions.length}):**\n\n${numbered}\n\n*Aria suggested actions — extracted from the record text. Assign owners and due dates before actioning.*`,
    confidence: actions.length >= 3 ? "high" : "medium",
    method: "pattern",
    metadata: { action_count: actions.length },
  };
}

/** Check for missing information in a record */
function checkMissingInfo(input: string, context?: RuleContext): RuleResult {
  const missing: { field: string; message: string }[] = [];
  const present: string[] = [];

  for (const check of MISSING_INFO_PATTERNS) {
    if (check.pattern.test(input)) {
      present.push(check.field);
    } else {
      missing.push({ field: check.field, message: check.missing });
    }
  }

  // Additional context-aware checks
  if (context?.severity === "high" || context?.severity === "critical") {
    if (!/(?:manager|senior|rm|registered)\s+(?:notif|inform|contact|told)/i.test(input)) {
      missing.push({ field: "manager_notification", message: "High/critical severity but no manager notification recorded" });
    }
    if (!/body\s*map|physical\s*check|injury|mark|bruise/i.test(input)) {
      missing.push({ field: "body_check", message: "High/critical incident but no physical check/body map mentioned" });
    }
  }

  if (context?.recordType === "incident" || context?.module === "incidents") {
    if (!/antecedent|trigger|before|prior|lead(?:ing)?\s+up|what\s+happened\s+before/i.test(input)) {
      missing.push({ field: "antecedent", message: "No antecedent/trigger described (what happened before the incident)" });
    }
  }

  const completeness = Math.round((present.length / (present.length + missing.length)) * 100);

  let output = `**Record Completeness: ${completeness}%**\n\n`;

  if (missing.length > 0) {
    output += `**Missing Information (${missing.length} items):**\n`;
    output += missing.map((m) => `- ⚠️ ${m.message}`).join("\n");
    output += "\n\n";
  }

  if (present.length > 0) {
    output += `**Present (${present.length} items):** ${present.join(", ")}\n\n`;
  }

  output += `*Aria completeness check — review missing items and add detail where possible. ${context?.severity === "high" || context?.severity === "critical" ? "High/critical severity records require comprehensive documentation." : ""}*`;

  return {
    output,
    confidence: "high",
    method: "rules",
    metadata: { completeness, missing_count: missing.length, present_count: present.length },
    warnings: missing.filter((m) => m.field === "manager_notification" || m.field === "body_check").map((m) => m.message),
  };
}

/** Check tone and language quality */
function checkTone(input: string): RuleResult {
  const issues: { text: string; issue: string; fix: string; position: number }[] = [];

  for (const check of TONE_ISSUES) {
    check.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = check.pattern.exec(input)) !== null) {
      issues.push({
        text: match[0],
        issue: check.issue,
        fix: check.fix,
        position: match.index,
      });
    }
  }

  if (issues.length === 0) {
    return {
      output: "**Tone Check: ✅ Good**\n\nNo significant language or tone issues detected. The record uses appropriate professional language.\n\n*Aria tone check — always review in context. What reads well on screen may feel different to the child reading their file.*",
      confidence: "high",
      method: "rules",
      metadata: { issues_found: 0 },
    };
  }

  let output = `**Tone Check: ${issues.length} issue${issues.length === 1 ? "" : "s"} found**\n\n`;
  const seen = new Set<string>();
  for (const issue of issues) {
    const key = `${issue.issue}:${issue.text.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output += `- **"${issue.text}"** — ${issue.issue}\n  → ${issue.fix}\n\n`;
  }

  output += `*Aria tone check — remember "writing to the child." Every record may one day be read by the young person. Use language that is respectful, factual, and strengths-aware.*`;

  return {
    output,
    confidence: "high",
    method: "rules",
    metadata: { issues_found: issues.length },
    warnings: issues.filter((i) => i.issue === "Judgemental language" || i.issue === "Labelling the child").map((i) => `"${i.text}" — ${i.issue}`),
  };
}

/** Identify risks in text */
function identifyRisks(input: string): RuleResult {
  const risks: { level: string; category: string; matches: string[] }[] = [];

  for (const check of RISK_PATTERNS) {
    check.pattern.lastIndex = 0;
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = check.pattern.exec(input)) !== null) {
      if (!matches.includes(match[0].toLowerCase())) {
        matches.push(match[0]);
      }
    }
    if (matches.length > 0) {
      risks.push({ level: check.level, category: check.category, matches });
    }
  }

  if (risks.length === 0) {
    return {
      output: "**Risk Scan: No specific risk indicators detected**\n\nThis does not mean there are no risks — only that no common risk keywords were found. Always apply professional judgement.\n\n*Aria risk scan — pattern-based detection. Does not replace professional risk assessment.*",
      confidence: "medium",
      method: "pattern",
      metadata: { risks_found: 0 },
    };
  }

  // Sort by severity
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  risks.sort((a, b) => (order[a.level as keyof typeof order] ?? 4) - (order[b.level as keyof typeof order] ?? 4));

  let output = `**Risk Indicators Found (${risks.length} categories):**\n\n`;
  for (const risk of risks) {
    const icon = risk.level === "critical" ? "🔴" : risk.level === "high" ? "🟠" : risk.level === "medium" ? "🟡" : "🟢";
    output += `${icon} **${risk.category.replace(/_/g, " ")}** (${risk.level}) — "${risk.matches.join('", "')}"\n`;
  }

  const hasCritical = risks.some((r) => r.level === "critical");
  const hasHigh = risks.some((r) => r.level === "high");

  if (hasCritical) {
    output += "\n⚠️ **CRITICAL risk indicators detected.** Ensure safeguarding lead is informed and appropriate referrals are made.\n";
  } else if (hasHigh) {
    output += "\n⚠️ **High risk indicators detected.** Ensure manager is informed and risk assessment is reviewed.\n";
  }

  output += "\n*Aria risk scan — keyword-based detection. Always apply professional judgement and follow your home's safeguarding procedures.*";

  return {
    output,
    confidence: hasCritical || hasHigh ? "high" : "medium",
    method: "pattern",
    metadata: { risks_found: risks.length, highest_level: risks[0]?.level },
    warnings: risks.filter((r) => r.level === "critical").map((r) => `Critical: ${r.category}`),
  };
}

/** Suggest a due date based on context */
function suggestDueDate(input: string, context?: RuleContext): RuleResult {
  const now = new Date();
  let suggestedDays = 7; // Default: 1 week
  let reason = "Standard follow-up timeframe";

  const lower = input.toLowerCase();

  if (/urgent|immediate|asap|today|critical|safeguard/i.test(lower)) {
    suggestedDays = 0;
    reason = "Urgent/critical — same day action required";
  } else if (/tomorrow|next\s+day|24\s*h/i.test(lower)) {
    suggestedDays = 1;
    reason = "Next-day action indicated";
  } else if (/this\s+week|within\s+(?:a\s+)?week|7\s*day/i.test(lower)) {
    suggestedDays = 7;
    reason = "Within-week timeframe indicated";
  } else if (/next\s+week|two\s+week|14\s*day|fortnight/i.test(lower)) {
    suggestedDays = 14;
    reason = "Two-week timeframe indicated";
  } else if (/month|30\s*day|4\s*week/i.test(lower)) {
    suggestedDays = 30;
    reason = "Monthly timeframe indicated";
  } else if (/review|quarterly|3\s*month/i.test(lower)) {
    suggestedDays = 90;
    reason = "Quarterly review cycle";
  }

  // Context overrides
  if (context?.severity === "critical") {
    suggestedDays = Math.min(suggestedDays, 1);
    reason = "Critical severity — maximum 24 hours";
  } else if (context?.severity === "high") {
    suggestedDays = Math.min(suggestedDays, 3);
    reason = "High severity — maximum 3 days";
  }

  const dueDate = new Date(now.getTime() + suggestedDays * 86400000);
  const formatted = dueDate.toISOString().slice(0, 10);
  const dayName = dueDate.toLocaleDateString("en-GB", { weekday: "long" });

  return {
    output: `**Suggested Due Date: ${formatted} (${dayName})**\n\nReason: ${reason}\n\n*Aria suggestion — adjust based on professional judgement and operational capacity.*`,
    confidence: suggestedDays <= 1 ? "high" : "medium",
    method: "rules",
    metadata: { due_date: formatted, days_from_now: suggestedDays },
  };
}

/** Suggest task owner based on context */
function suggestTaskOwner(input: string, context?: RuleContext): RuleResult {
  const lower = input.toLowerCase();
  let role = "Key Worker";
  let reason = "Default assignment to the child's key worker";

  if (/safeguard|child\s+protection|disclosure|allegation|exploitation/i.test(lower)) {
    role = "Registered Manager / Safeguarding Lead";
    reason = "Safeguarding matters require manager-level oversight";
  } else if (/medication|prescri|pharmacy|gp|doctor|health/i.test(lower)) {
    role = "Senior Support Worker / Health Lead";
    reason = "Health-related task requiring senior oversight";
  } else if (/supervision|training|apprais|development|hr/i.test(lower)) {
    role = "Deputy Manager / HR Lead";
    reason = "Staff management task requiring deputy/HR involvement";
  } else if (/reg\s*4[04-5]|ofsted|inspection|compliance|audit/i.test(lower)) {
    role = "Registered Manager";
    reason = "Regulatory compliance task requiring RM ownership";
  } else if (/maintenance|repair|building|vehicle|equipment/i.test(lower)) {
    role = "Senior Support Worker / Facilities Lead";
    reason = "Premises/facilities task";
  } else if (/social\s+worker|placing\s+authority|local\s+authority/i.test(lower)) {
    role = "Registered Manager";
    reason = "External agency liaison requiring RM coordination";
  } else if (/parent|family|carer|contact/i.test(lower)) {
    role = "Key Worker";
    reason = "Family contact managed by the child's key worker";
  } else if (/review|lac|iro|meeting/i.test(lower)) {
    role = "Key Worker with Manager oversight";
    reason = "Review preparation requires key worker with manager approval";
  }

  if (context?.severity === "critical" || context?.severity === "high") {
    if (role === "Key Worker" || role === "Senior Support Worker / Health Lead") {
      role = "Registered Manager (with delegation to " + role + ")";
      reason += " — escalated due to severity";
    }
  }

  return {
    output: `**Suggested Owner: ${role}**\n\nReason: ${reason}\n\n*Aria suggestion — assign to a specific named individual with capacity. Check shift patterns and existing workload.*`,
    confidence: "medium",
    method: "rules",
    metadata: { suggested_role: role },
  };
}

/** Generate a task list from text */
function createTaskList(input: string, context?: RuleContext): RuleResult {
  // Extract actions first
  const actionResult = extractActions(input);
  const riskResult = identifyRisks(input);
  const missingResult = checkMissingInfo(input, context);

  const tasks: string[] = [];

  // From extracted actions
  const actionMeta = actionResult.metadata as Record<string, unknown> | undefined;
  if (actionMeta && (actionMeta.action_count as number) > 0) {
    const lines = actionResult.output.split("\n").filter((l) => /^\d+\./.test(l));
    for (const line of lines) {
      tasks.push(line.replace(/^\d+\.\s*/, ""));
    }
  }

  // From risks
  const riskMeta = riskResult.metadata as Record<string, unknown> | undefined;
  if (riskMeta && riskMeta.highest_level === "critical") {
    tasks.push("Inform safeguarding lead immediately");
    tasks.push("Complete and submit Reg 40 notification if applicable");
  } else if (riskMeta && riskMeta.highest_level === "high") {
    tasks.push("Inform registered manager");
    tasks.push("Review and update risk assessment");
  }

  // From missing info
  const missingMeta = missingResult.metadata as Record<string, unknown> | undefined;
  if (missingMeta && (missingMeta.missing_count as number) > 2) {
    tasks.push("Complete missing record information before end of shift");
  }

  if (tasks.length === 0) {
    tasks.push("Review record and confirm no further actions needed");
  }

  const numbered = tasks.map((t, i) => `${i + 1}. [ ] ${t}`).join("\n");
  const output = `**Task List (${tasks.length} items):**\n\n${numbered}\n\n*Aria suggested tasks — review, assign owners, set due dates, and tick off as completed.*`;

  return {
    output,
    confidence: tasks.length >= 3 ? "high" : "medium",
    method: "rules",
    metadata: { task_count: tasks.length },
  };
}

/** Check factual consistency (structural checks, not content verification) */
function checkFactuality(input: string): RuleResult {
  const issues: string[] = [];

  // Check for date inconsistencies
  const dates = input.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/g) || [];
  if (dates.length > 1) {
    issues.push("Multiple dates found — ensure chronological consistency");
  }

  // Check for pronoun inconsistency
  const heCount = (input.match(/\bhe\b/gi) || []).length;
  const sheCount = (input.match(/\bshe\b/gi) || []).length;
  if (heCount > 0 && sheCount > 0) {
    issues.push("Mixed pronouns (he/she) — check these refer to different individuals, not a recording error");
  }

  // Check for contradictions
  if (/no\s+concerns?/i.test(input) && /concern|worry|risk|safeguard/i.test(input.replace(/no\s+concerns?/gi, ""))) {
    issues.push("States 'no concerns' but concern-related language appears elsewhere in the text");
  }

  // Check for copy-paste indicators
  if (/\[insert|TBC|TBD|TODO|XXXX|NAME|DATE\]/i.test(input)) {
    issues.push("Template placeholders found — replace with actual information before submitting");
  }

  // Check for incomplete sentences
  const sentences = input.split(/[.!?]\s+/);
  const incomplete = sentences.filter((s) => s.trim().length > 5 && s.trim().length < 15 && !s.trim().endsWith("."));
  if (incomplete.length > 2) {
    issues.push("Several very short or incomplete sentences — consider adding more detail");
  }

  if (issues.length === 0) {
    return {
      output: "**Factual Check: ✅ No structural issues detected**\n\nThe record appears internally consistent. Always verify facts against other records and direct observation.\n\n*Aria structural check — verifies consistency, not accuracy. Facts must be verified by the author.*",
      confidence: "medium",
      method: "rules",
    };
  }

  let output = `**Factual Check: ${issues.length} issue${issues.length === 1 ? "" : "s"} found**\n\n`;
  output += issues.map((i) => `- ⚠️ ${i}`).join("\n");
  output += "\n\n*Aria structural check — review each item and correct before submitting.*";

  return {
    output,
    confidence: "high",
    method: "rules",
    metadata: { issues_found: issues.length },
    warnings: issues,
  };
}

// ─── Command → Rule Mapping ──────────────────────────────────────────────────
// Maps ARIA command IDs to deterministic rule handlers.
// Commands NOT in this map fall through to LLM.

const RULE_HANDLERS: Record<string, RuleHandler> = {
  // Extraction commands
  extract_actions: (input, ctx) => extractActions(input),
  create_task_list: (input, ctx) => createTaskList(input, ctx),
  create_task_from_text: (input, ctx) => createTaskList(input, ctx),

  // Analysis commands
  check_missing_information: (input, ctx) => checkMissingInfo(input, ctx),
  identify_missing_incident_information: (input, ctx) => checkMissingInfo(input, { ...ctx, module: "incidents" }),
  identify_missing_evidence: (input, ctx) => checkMissingInfo(input, ctx),
  check_missing_recruitment_evidence: (input, ctx) => checkMissingInfo(input, { ...ctx, module: "recruitment" }),

  // Tone and quality
  check_tone: (input) => checkTone(input),
  check_hr_fairness_and_tone: (input) => checkTone(input),
  check_union_sensitive_wording: (input) => checkTone(input),
  check_factuality: (input) => checkFactuality(input),

  // Risk identification
  identify_document_risks: (input, ctx) => identifyRisks(input),
  incident_risk_analysis: (input, ctx) => identifyRisks(input),

  // Suggestions
  suggest_due_date: (input, ctx) => suggestDueDate(input, ctx),
  suggest_task_owner: (input, ctx) => suggestTaskOwner(input, ctx),

  // Document analysis
  extract_key_points: (input) => {
    const sentences = input.split(/[.!?]\s+/).filter((s) => s.trim().length > 20);
    if (sentences.length === 0) {
      return { output: "No key points could be extracted — the text is too short.", confidence: "low", method: "pattern" };
    }
    // Score sentences by keyword density
    const keywords = /important|significant|concern|risk|action|require|must|essential|critical|key|note|highlight|attention/gi;
    const scored = sentences.map((s) => ({
      text: s.trim(),
      score: (s.match(keywords) || []).length + (s.length > 80 ? 1 : 0),
    })).sort((a, b) => b.score - a.score);

    const top = scored.slice(0, Math.min(5, scored.length));
    const output = `**Key Points (${top.length}):**\n\n${top.map((p, i) => `${i + 1}. ${p.text}`).join("\n")}\n\n*Aria extraction — review for accuracy and completeness.*`;
    return { output, confidence: "medium", method: "pattern", metadata: { points: top.length } };
  },

  // Follow-up suggestions
  suggest_incident_follow_up_tasks: (input, ctx) => {
    const tasks: string[] = [];
    const lower = input.toLowerCase();

    // Standard follow-ups
    tasks.push("Add management oversight note within 24 hours");
    tasks.push("Record child's views about the incident");

    if (/restrain|physical\s+intervention|hold/i.test(lower)) {
      tasks.push("Complete post-incident debrief with child within 24 hours");
      tasks.push("Complete post-incident debrief with staff within 24 hours");
      tasks.push("Check for any injuries — complete body map if needed");
      tasks.push("Review behaviour support plan");
    }
    if (/self[\s-]?harm|suicid/i.test(lower)) {
      tasks.push("Increase observation level as per risk assessment");
      tasks.push("Contact CAMHS or crisis team if not already done");
      tasks.push("Review and update safety plan");
    }
    if (/missing|abscond/i.test(lower)) {
      tasks.push("Complete return home interview within 72 hours");
      tasks.push("Review missing from care risk assessment");
      tasks.push("Notify placing authority if not already done");
    }
    if (/damage|property/i.test(lower)) {
      tasks.push("Photograph and document damage");
      tasks.push("Arrange repair/replacement");
      tasks.push("Discuss with child using restorative approach");
    }
    if (/medication/i.test(lower)) {
      tasks.push("Complete medication error form");
      tasks.push("Notify prescriber");
      tasks.push("Review medication administration procedures");
    }

    // Always
    tasks.push("Update daily log with incident reference");
    tasks.push("Check if Reg 40 notification to Ofsted is required");

    const output = `**Suggested Follow-Up Tasks (${tasks.length}):**\n\n${tasks.map((t, i) => `${i + 1}. [ ] ${t}`).join("\n")}\n\n*Aria suggested follow-ups based on incident content. Assign to specific staff with due dates.*`;
    return { output, confidence: "high", method: "rules", metadata: { task_count: tasks.length } };
  },

  // ─── Template-based Drafting ────────────────────────────────────────────

  draft_handover: (input, ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    const childRef = ctx?.childName ? `**Child:** ${ctx.childName}` : "";
    const output = `**Shift Handover — ${today}**

**Staff Handing Over:** [Current shift staff]
**Staff Receiving:** [Incoming shift staff]
**Time:** [Shift change time]
${childRef ? `\n${childRef}\n` : ""}
---

**Children Present:**
[List each child with brief status]

**Key Events This Shift:**
${input ? `Based on notes provided:\n${input}` : "[Record key events]"}

**Incidents/Concerns:**
[Any incidents or concerns from this shift]

**Outstanding Tasks:**
[Tasks that need completing on the next shift]

**Medications:**
[Any medication-related notes]

**Handover Notes:**
[Anything the incoming team needs to know]

---
*Aria template — complete all sections before handing over.*`;
    return { output, confidence: "high", method: "template" };
  },

  draft_shift_summary: (input, ctx) => {
    const today = ctx?.date || new Date().toISOString().slice(0, 10);
    const staffRef = ctx?.staffName ? `**Shift Lead:** ${ctx.staffName}` : "**Shift Lead:** [Name]";
    const output = `**Shift Summary — ${today}**

${staffRef}
**Shift:** [e.g. Early / Late / Waking Night]
**Staff on Shift:** [List all staff]

---

**Children Present:**
[List children present during the shift]

**Key Events:**
${input ? input : "[Summarise main events from the shift]"}

**Concerns Raised:**
[Any concerns flagged during the shift]

**Actions Taken:**
[What was done in response to any issues]

**Handover Items:**
[Items for the next shift to be aware of]

**Medication Administration:**
[Confirm all medications administered correctly or note any issues]

---
*Aria template — review and complete all sections before signing off.*`;
    return { output, confidence: "high", method: "template" };
  },

  create_meeting_minutes: (input, ctx) => {
    const today = ctx?.date || new Date().toISOString().slice(0, 10);
    const output = `**Meeting Minutes — ${today}**

**Meeting Type:** [e.g. Team Meeting / Professionals Meeting / LAC Review]
**Date:** ${today}
**Time:** [Start time] — [End time]
**Location:** [Venue or virtual link]
**Chair:** [Name]
**Minutes Taken By:** [Name]

---

**Attendees:**
[List all attendees with roles]

**Apologies:**
[List anyone who sent apologies]

---

**Agenda Items & Discussion:**

${input ? `Based on notes provided:\n${input}` : `**1. [Agenda Item]**
Discussion: [Key points discussed]
Decision: [What was decided]
Action: [Who / what / by when]

**2. [Agenda Item]**
Discussion: [Key points discussed]
Decision: [What was decided]
Action: [Who / what / by when]`}

---

**Actions Summary:**
| # | Action | Owner | Due Date |
|---|--------|-------|----------|
| 1 | [Action] | [Name] | [Date] |
| 2 | [Action] | [Name] | [Date] |

**Next Meeting:** [Date and time]

---
*Aria template — complete all sections. Circulate to attendees within 48 hours.*`;
    return { output, confidence: "high", method: "template" };
  },

  create_agenda: (input, ctx) => {
    const today = ctx?.date || new Date().toISOString().slice(0, 10);
    // Infer meeting type from input if possible
    let standingItems: string[];
    const lower = (input || "").toLowerCase();
    if (/team\s+meeting|staff\s+meeting/i.test(lower)) {
      standingItems = [
        "Apologies",
        "Minutes of last meeting — accuracy and matters arising",
        "Children's updates (each child)",
        "Staffing and rota",
        "Health and safety",
        "Training updates",
        "Policy and procedure reminders",
        "Safeguarding updates",
        "Any other business",
        "Date of next meeting",
      ];
    } else if (/lac|review|looked\s+after/i.test(lower)) {
      standingItems = [
        "Introductions and apologies",
        "Minutes of last review",
        "Child's views and wishes",
        "Placement update",
        "Education update",
        "Health update",
        "Contact arrangements",
        "Care plan review",
        "Risk assessment review",
        "Any other business",
        "Date of next review",
      ];
    } else if (/professional|multi[\s-]?agency|strategy/i.test(lower)) {
      standingItems = [
        "Apologies and introductions",
        "Purpose of meeting",
        "Background and referral information",
        "Information sharing — each agency",
        "Risk analysis",
        "Agreed actions and owners",
        "Contingency planning",
        "Date of next meeting",
      ];
    } else {
      standingItems = [
        "Apologies",
        "Minutes of previous meeting",
        "Matters arising",
        "Main agenda items",
        "Any other business",
        "Date and time of next meeting",
      ];
    }

    const output = `**Meeting Agenda**

**Meeting Type:** ${input || "[Specify meeting type]"}
**Date:** ${today}
**Time:** [Start time]
**Location:** [Venue]
**Chair:** [Name]

---

**Agenda:**

${standingItems.map((item, i) => `${i + 1}. ${item}`).join("\n")}

---
*Aria template — add specific discussion items and circulate at least 48 hours before the meeting.*`;
    return { output, confidence: "high", method: "template" };
  },

  create_onboarding_tasks: (input, ctx) => {
    const staffRef = ctx?.staffName || input || "[New starter name]";
    const today = new Date().toISOString().slice(0, 10);
    const output = `**Onboarding Checklist — ${staffRef}**
**Start Date:** [Date]
**Created:** ${today}

---

**Pre-Employment:**
1. [ ] Enhanced DBS check applied for and cleared
2. [ ] DBS on Update Service — check completed
3. [ ] Two satisfactory references received (including most recent employer)
4. [ ] Right to work documentation verified
5. [ ] Health declaration / occupational health clearance
6. [ ] Qualification certificates verified
7. [ ] Full employment history reviewed — all gaps explored
8. [ ] Proof of identity verified (photo ID)
9. [ ] Barred list check completed

**First Day:**
10. [ ] Welcome and introductions to team
11. [ ] Tour of the home — safety exits, medication storage, fire panel
12. [ ] Issue keys, alarm codes, staff handbook
13. [ ] IT access set up — email, Cornerstone login, WiFi
14. [ ] Emergency contact details collected
15. [ ] Photograph taken for personnel file

**First Week:**
16. [ ] Safeguarding and child protection (Level 3 within 3 months)
17. [ ] Lone working policy
18. [ ] Health and safety / fire safety
19. [ ] Medication administration awareness
20. [ ] Behaviour management approach and de-escalation
21. [ ] Children's individual care plans, risk assessments, and behaviour support plans
22. [ ] GDPR and confidentiality
23. [ ] Whistleblowing policy
24. [ ] Complaints and representations
25. [ ] Buddy / mentor allocated: [Name]

**First Month:**
26. [ ] Complete all mandatory e-learning modules
27. [ ] Shadow experienced staff across all shift types
28. [ ] Read and sign all key policies
29. [ ] First supervision session with manager
30. [ ] TCI / restraint training booked or completed
31. [ ] First aid training booked or completed

**Probation Period:**
32. [ ] 1-month probation review
33. [ ] 3-month probation review
34. [ ] 6-month probation review / confirmation in post
35. [ ] Level 3 Diploma in Residential Childcare — registration

---
*Aria template — tick items as completed. Retain in personnel file as safer recruitment evidence.*`;
    return { output, confidence: "high", method: "template", metadata: { task_count: 35 } };
  },

  create_calendar_follow_up_tasks: (input) => {
    // Extract dates from text
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,
      /(\d{4}-\d{2}-\d{2})/g,
      /(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{2,4})/gi,
    ];

    const foundDates: { date: string; context: string }[] = [];
    for (const pattern of datePatterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(input)) !== null) {
        const start = Math.max(0, match.index - 40);
        const end = Math.min(input.length, match.index + match[0].length + 40);
        const context = input.slice(start, end).replace(/\n/g, " ").trim();
        foundDates.push({ date: match[1], context });
      }
    }

    // Extract action-related phrases near dates
    const tasks: string[] = [];
    if (foundDates.length > 0) {
      for (const fd of foundDates) {
        tasks.push(`Follow up on "${fd.context}" — date reference: ${fd.date}`);
      }
    }

    // Also look for keyword-based follow-ups
    const followUpKeywords = /(?:review|renew|expir|due|deadline|meeting|appointment|hearing|visit|conference|inspection)\w*/gi;
    let kwMatch: RegExpExecArray | null;
    followUpKeywords.lastIndex = 0;
    while ((kwMatch = followUpKeywords.exec(input)) !== null) {
      const start = Math.max(0, kwMatch.index - 20);
      const end = Math.min(input.length, kwMatch.index + kwMatch[0].length + 30);
      const snippet = input.slice(start, end).replace(/\n/g, " ").trim();
      if (!tasks.some((t) => t.includes(snippet))) {
        tasks.push(`Calendar item: "${snippet}"`);
      }
    }

    if (tasks.length === 0) {
      return {
        output: "**Calendar Follow-Up Tasks:** No date references or follow-up triggers found in the text. Add specific dates for Aria to extract.\n\n*Aria extraction — add explicit dates (e.g. 01/07/2025) for best results.*",
        confidence: "low",
        method: "pattern",
        metadata: { task_count: 0 },
      };
    }

    const output = `**Calendar Follow-Up Tasks (${tasks.length}):**\n\n${tasks.map((t, i) => `${i + 1}. [ ] ${t}`).join("\n")}\n\n*Aria extraction — add these to your calendar system and assign owners.*`;
    return { output, confidence: "medium", method: "pattern", metadata: { task_count: tasks.length, dates_found: foundDates.length } };
  },

  identify_upcoming_compliance_dates: (input) => {
    // Scan for dates and compliance-related keywords
    const dateRegexes = [
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,
      /(\d{4}-\d{2}-\d{2})/g,
      /(\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{2,4})/gi,
    ];

    const complianceKeywords = /(?:dbs|disclosure|barring|training|certificat|registrat|inspection|ofsted|renew|expir|review\s+due|annual|regulation\s+\d+|reg\s+\d+|fire\s+safety|first\s+aid|safeguard|supervision|apprais|policy\s+review|insurance|licence|license)/gi;

    const dates: string[] = [];
    for (const regex of dateRegexes) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(input)) !== null) {
        dates.push(match[1]);
      }
    }

    const complianceHits: string[] = [];
    complianceKeywords.lastIndex = 0;
    let cMatch: RegExpExecArray | null;
    while ((cMatch = complianceKeywords.exec(input)) !== null) {
      const start = Math.max(0, cMatch.index - 30);
      const end = Math.min(input.length, cMatch.index + cMatch[0].length + 40);
      const snippet = input.slice(start, end).replace(/\n/g, " ").trim();
      if (!complianceHits.some((h) => h === snippet)) {
        complianceHits.push(snippet);
      }
    }

    if (complianceHits.length === 0 && dates.length === 0) {
      return {
        output: "**Compliance Dates:** No compliance-related dates or deadlines found in this text.\n\n*Aria scan — ensure compliance deadlines are recorded with explicit dates.*",
        confidence: "low",
        method: "pattern",
        metadata: { items_found: 0 },
      };
    }

    let output = `**Upcoming Compliance Dates/Deadlines:**\n\n`;
    if (complianceHits.length > 0) {
      output += `**Compliance Items Found (${complianceHits.length}):**\n`;
      output += complianceHits.map((h, i) => `${i + 1}. ${h}`).join("\n");
      output += "\n\n";
    }
    if (dates.length > 0) {
      output += `**Date References Found:** ${dates.join(", ")}\n\n`;
    }
    output += `*Aria compliance scan — cross-reference with your compliance tracker. Set calendar reminders for each deadline.*`;

    return { output, confidence: "medium", method: "pattern", metadata: { items_found: complianceHits.length, dates_found: dates.length } };
  },

  create_task_from_incident: (input, ctx) => {
    const tasks: string[] = [];
    const lower = input.toLowerCase();

    // Always required after any incident
    tasks.push("Manager to add oversight note within 24 hours");
    tasks.push("Record child's views and wishes about the incident");

    // Severity-based tasks
    if (/critical|serious|significant/i.test(lower) || ctx?.severity === "critical") {
      tasks.push("Notify Ofsted under Regulation 40 (serious event)");
      tasks.push("Notify placing authority social worker immediately");
      tasks.push("Convene strategy discussion if safeguarding concern");
      tasks.push("Notify parent/carer as appropriate");
    }

    if (/restrain|physical\s+intervention/i.test(lower)) {
      tasks.push("Complete restraint debrief with child within 24 hours");
      tasks.push("Complete restraint debrief with staff within 24 hours");
      tasks.push("Review child's behaviour support plan");
      tasks.push("Complete body map and check for injuries");
      tasks.push("Log in physical intervention register");
    }

    if (/safeguard|disclosure|abuse|neglect/i.test(lower)) {
      tasks.push("Follow local safeguarding procedures — MASH referral if required");
      tasks.push("Secure and preserve any evidence");
      tasks.push("Do not interview the child — record exact words only");
    }

    if (/missing|abscond/i.test(lower)) {
      tasks.push("Complete return home interview within 72 hours");
      tasks.push("Update missing from care risk assessment");
    }

    if (/medication|drug|dose/i.test(lower)) {
      tasks.push("Complete medication incident form");
      tasks.push("Notify prescribing GP/consultant");
    }

    // Standard follow-ups
    tasks.push("Update child's risk assessment if indicated");
    tasks.push("Update daily log referencing this incident");
    tasks.push("Check whether Reg 40 notification to Ofsted is needed");

    const output = `**Tasks Generated from Incident (${tasks.length}):**\n\n${tasks.map((t, i) => `${i + 1}. [ ] ${t}`).join("\n")}\n\n*Aria task generation — assign owners and due dates. Critical tasks should be actioned immediately.*`;
    return { output, confidence: "high", method: "rules", metadata: { task_count: tasks.length } };
  },

  create_task_from_audit: (input, ctx) => {
    const tasks: string[] = [];
    const lower = input.toLowerCase();

    // Parse audit findings for severity indicators
    if (/non[\s-]?complian|breach|fail|not\s+met|inadequate/i.test(lower)) {
      tasks.push("Produce corrective action plan within 5 working days");
      tasks.push("Assign responsible person for each non-compliance");
    }
    if (/recommend|suggest|improve|consider|could/i.test(lower)) {
      tasks.push("Review recommendations and prioritise by risk");
      tasks.push("Add improvement actions to service improvement plan");
    }
    if (/document|record|evidence|missing|absent|not\s+found/i.test(lower)) {
      tasks.push("Locate or recreate missing documentation");
      tasks.push("Review filing and record-keeping procedures");
    }
    if (/training|competenc|skill|qualification/i.test(lower)) {
      tasks.push("Update training matrix with identified gaps");
      tasks.push("Book required training within agreed timeframe");
    }
    if (/policy|procedure|protocol/i.test(lower)) {
      tasks.push("Review and update relevant policies");
      tasks.push("Circulate updated procedures to all staff");
    }
    if (/risk|hazard|danger|safety/i.test(lower)) {
      tasks.push("Update risk assessments to address identified hazards");
      tasks.push("Implement immediate control measures if safety risk");
    }

    // Standard audit follow-up
    tasks.push("Schedule follow-up audit to verify corrective actions");
    tasks.push("Report audit outcomes to Responsible Individual");

    if (tasks.length <= 2) {
      tasks.unshift("Review audit findings and categorise by priority");
      tasks.unshift("Identify root causes for each finding");
    }

    const output = `**Tasks Generated from Audit (${tasks.length}):**\n\n${tasks.map((t, i) => `${i + 1}. [ ] ${t}`).join("\n")}\n\n*Aria task generation — assign owners and set realistic deadlines for each corrective action.*`;
    return { output, confidence: "high", method: "rules", metadata: { task_count: tasks.length } };
  },

  create_task_from_oversight: (input, ctx) => {
    const tasks: string[] = [];
    const lower = input.toLowerCase();

    // Parse oversight content for action triggers
    if (/concern|worry|issue|problem|difficulty/i.test(lower)) {
      tasks.push("Address identified concerns within agreed timescale");
    }
    if (/action|follow[\s-]?up|require|must|should|need/i.test(lower)) {
      // Also use the action extractor
      const actionResult = extractActions(input);
      const actionMeta = actionResult.metadata as Record<string, unknown> | undefined;
      if (actionMeta && (actionMeta.action_count as number) > 0) {
        const lines = actionResult.output.split("\n").filter((l) => /^\d+\./.test(l));
        for (const line of lines) {
          tasks.push(line.replace(/^\d+\.\s*/, ""));
        }
      }
    }
    if (/risk|safeguard/i.test(lower)) {
      tasks.push("Review and update relevant risk assessments");
    }
    if (/training|development|supervision/i.test(lower)) {
      tasks.push("Schedule additional training or supervision as identified");
    }
    if (/review|update|amend/i.test(lower)) {
      tasks.push("Review and update relevant plans or documents as recommended");
    }
    if (/quality|standard|improvement/i.test(lower)) {
      tasks.push("Add identified improvements to service improvement plan");
    }

    if (tasks.length === 0) {
      tasks.push("Review oversight notes and confirm any further actions needed");
      tasks.push("File oversight record and link to relevant child/staff records");
    }

    tasks.push("Manager to confirm completion of oversight actions");

    const output = `**Tasks Generated from Oversight (${tasks.length}):**\n\n${tasks.map((t, i) => `${i + 1}. [ ] ${t}`).join("\n")}\n\n*Aria task generation — assign to specific staff and set due dates.*`;
    return { output, confidence: "medium", method: "rules", metadata: { task_count: tasks.length } };
  },

  // ─── Analysis / Checking (rule-based) ───────────────────────────────────

  check_incident_chronology: (input) => {
    const issues: string[] = [];

    // Extract all time references
    const timePattern = /(\d{1,2})[:.:](\d{2})\s*(?:am|pm|hrs?|hours?)?/gi;
    const times: { raw: string; minutes: number; position: number }[] = [];
    let tMatch: RegExpExecArray | null;
    timePattern.lastIndex = 0;
    while ((tMatch = timePattern.exec(input)) !== null) {
      let hours = parseInt(tMatch[1], 10);
      const mins = parseInt(tMatch[2], 10);
      const suffix = tMatch[0].toLowerCase();
      if (suffix.includes("pm") && hours < 12) hours += 12;
      if (suffix.includes("am") && hours === 12) hours = 0;
      times.push({ raw: tMatch[0].trim(), minutes: hours * 60 + mins, position: tMatch.index });
    }

    // Check chronological order
    for (let i = 1; i < times.length; i++) {
      if (times[i].minutes < times[i - 1].minutes) {
        issues.push(`Time "${times[i].raw}" appears after "${times[i - 1].raw}" but is earlier — check chronological order`);
      }
    }

    // Check for unreasonable gaps
    for (let i = 1; i < times.length; i++) {
      const gap = times[i].minutes - times[i - 1].minutes;
      if (gap > 360) {
        issues.push(`Gap of ${Math.round(gap / 60)} hours between "${times[i - 1].raw}" and "${times[i].raw}" — account for this time period`);
      }
    }

    // Check time plausibility
    for (const t of times) {
      if (t.minutes < 0 || t.minutes > 1439) {
        issues.push(`Invalid time reference: "${t.raw}"`);
      }
    }

    if (times.length === 0) {
      return {
        output: "**Chronology Check:** No specific times found in the incident record. Good practice requires recording the time of each key event.\n\n*Aria chronology check — add timestamps throughout the incident record (e.g. 14:30, 14:45).*",
        confidence: "medium",
        method: "rules",
        suggestions: ["Add specific times for each event in the incident"],
        metadata: { times_found: 0 },
      };
    }

    if (times.length === 1) {
      return {
        output: `**Chronology Check:** Only one time reference found (${times[0].raw}). An incident record should have multiple timestamps showing the sequence of events.\n\n*Aria chronology check — record when each key event occurred.*`,
        confidence: "medium",
        method: "rules",
        suggestions: ["Add timestamps for the start, key events, and resolution of the incident"],
        metadata: { times_found: 1 },
      };
    }

    if (issues.length === 0) {
      return {
        output: `**Chronology Check: Consistent**\n\n${times.length} time references found in chronological order: ${times.map((t) => t.raw).join(" → ")}\n\n*Aria chronology check — timeline appears consistent. Always verify against other records.*`,
        confidence: "high",
        method: "rules",
        metadata: { times_found: times.length, issues_found: 0 },
      };
    }

    let output = `**Chronology Check: ${issues.length} issue${issues.length === 1 ? "" : "s"} found**\n\n`;
    output += `Times found: ${times.map((t) => t.raw).join(", ")}\n\n`;
    output += issues.map((i) => `- Warning: ${i}`).join("\n");
    output += `\n\n*Aria chronology check — correct any sequencing errors before submitting.*`;

    return { output, confidence: "high", method: "rules", metadata: { times_found: times.length, issues_found: issues.length }, warnings: issues };
  },

  check_oversight_reflection: (input) => {
    const reflectiveIndicators = [
      { pattern: /\bI\s+(?:reflect|considered|thought\s+about|wonder|believe|feel|note|recognise|acknowledge)\b/gi, label: "First-person reflection" },
      { pattern: /\b(?:on\s+reflection|reflecting\s+on|having\s+considered|thinking\s+about\s+this|looking\s+back)\b/gi, label: "Reflective phrasing" },
      { pattern: /\b(?:what\s+went\s+well|what\s+could\s+be\s+improved|lessons?\s+learned|learning\s+from)\b/gi, label: "Evaluative reflection" },
      { pattern: /\b(?:strength|positive|progress|improvement|well\s+done|commend|good\s+practice)\b/gi, label: "Strengths-based observation" },
      { pattern: /\b(?:impact|effect|outcome|result|consequence|difference)\b/gi, label: "Impact awareness" },
      { pattern: /\b(?:next\s+time|going\s+forward|in\s+future|moving\s+forward|develop|grow)\b/gi, label: "Forward-looking" },
    ];

    const found: string[] = [];
    const missing: string[] = [];

    for (const indicator of reflectiveIndicators) {
      indicator.pattern.lastIndex = 0;
      if (indicator.pattern.test(input)) {
        found.push(indicator.label);
      } else {
        missing.push(indicator.label);
      }
    }

    const score = Math.round((found.length / reflectiveIndicators.length) * 100);
    let output = `**Oversight Reflection Quality: ${score}%**\n\n`;

    if (found.length > 0) {
      output += `**Reflective Indicators Present (${found.length}):**\n${found.map((f) => `- ${f}`).join("\n")}\n\n`;
    }
    if (missing.length > 0) {
      output += `**Could Be Strengthened (${missing.length}):**\n${missing.map((m) => `- ${m}`).join("\n")}\n\n`;
    }

    output += `*Aria reflection check — good oversight includes reflective practice, strengths-based observations, and forward-looking actions.*`;

    return {
      output,
      confidence: "high",
      method: "rules",
      metadata: { reflection_score: score, indicators_found: found.length, indicators_missing: missing.length },
    };
  },

  check_oversight_challenge: (input) => {
    const challengeIndicators = [
      { pattern: /\b(?:challeng|question|query|probe|push(?:ed)?\s+back|asked\s+(?:about|why|whether|how))\b/gi, label: "Direct challenge" },
      { pattern: /\b(?:why|how\s+do\s+we\s+know|what\s+evidence|can\s+you\s+explain|justify|rationale)\b/gi, label: "Questioning / evidence-seeking" },
      { pattern: /\b(?:not\s+satisfied|not\s+(?:yet\s+)?assured|insufficient|inadequate|gap|shortfall|weakness)\b/gi, label: "Identifying shortfalls" },
      { pattern: /\b(?:expect|standard|requirement|should\s+have|must\s+be|need(?:s|ed)?\s+to\s+be)\b/gi, label: "Setting expectations" },
      { pattern: /\b(?:hold(?:ing)?\s+to\s+account|accountab|responsible|ownership|explain)\b/gi, label: "Accountability" },
      { pattern: /\b(?:timescale|deadline|by\s+when|when\s+will|how\s+long)\b/gi, label: "Timescale challenge" },
    ];

    const found: string[] = [];
    const missing: string[] = [];

    for (const indicator of challengeIndicators) {
      indicator.pattern.lastIndex = 0;
      if (indicator.pattern.test(input)) {
        found.push(indicator.label);
      } else {
        missing.push(indicator.label);
      }
    }

    const score = Math.round((found.length / challengeIndicators.length) * 100);
    let output = `**Professional Challenge Quality: ${score}%**\n\n`;

    if (found.length > 0) {
      output += `**Challenge Indicators Present (${found.length}):**\n${found.map((f) => `- ${f}`).join("\n")}\n\n`;
    }
    if (missing.length > 0) {
      output += `**Could Be Strengthened (${missing.length}):**\n${missing.map((m) => `- ${m}`).join("\n")}\n\n`;
    }

    output += `*Aria challenge check — effective oversight includes professional curiosity, evidence-seeking, and holding staff to account.*`;

    return {
      output,
      confidence: "high",
      method: "rules",
      metadata: { challenge_score: score, indicators_found: found.length },
    };
  },

  check_oversight_child_focus: (input) => {
    const childFocusIndicators = [
      { pattern: /\b(?:child|young\s+person|children|young\s+people)\b/gi, label: "Child referenced" },
      { pattern: /\b(?:child(?:'s|s')?\s+(?:view|voice|wish|feeling|experience|perspective|opinion))\b/gi, label: "Child's voice" },
      { pattern: /\b(?:best\s+interest|welfare|wellbeing|well[\s-]?being|outcome(?:s)?\s+for)\b/gi, label: "Welfare/outcomes focus" },
      { pattern: /\b(?:individu|person[\s-]?centred|tailored|specific\s+to|bespoke|unique)\b/gi, label: "Individualised approach" },
      { pattern: /\b(?:safe(?:r|ty|guard)|protect|nurtur|care|support|thrive|flourish)\b/gi, label: "Safety and nurture" },
      { pattern: /\b(?:identity|cultur|divers|heritage|faith|belief|background)\b/gi, label: "Identity and diversity" },
      { pattern: /\b(?:education|learning|school|achieve|progress|aspiration|ambition)\b/gi, label: "Educational achievement" },
      { pattern: /\b(?:health|emotional|mental|physical|therap|development)\b/gi, label: "Health and development" },
    ];

    const found: string[] = [];
    const missing: string[] = [];

    for (const indicator of childFocusIndicators) {
      indicator.pattern.lastIndex = 0;
      if (indicator.pattern.test(input)) {
        found.push(indicator.label);
      } else {
        missing.push(indicator.label);
      }
    }

    const score = Math.round((found.length / childFocusIndicators.length) * 100);
    let output = `**Child-Centred Focus: ${score}%**\n\n`;

    if (found.length > 0) {
      output += `**Child-Focused Indicators Present (${found.length}):**\n${found.map((f) => `- ${f}`).join("\n")}\n\n`;
    }
    if (missing.length > 0) {
      output += `**Could Be Strengthened (${missing.length}):**\n${missing.map((m) => `- ${m}`).join("\n")}\n\n`;
    }

    output += `*Aria child-focus check — effective oversight always returns to the question: "What difference is this making for the child?"*`;

    return {
      output,
      confidence: "high",
      method: "rules",
      metadata: { child_focus_score: score, indicators_found: found.length },
    };
  },

  check_employment_gaps: (input) => {
    // Parse dates from employment history
    const dateRangePattern = /(\d{1,2}\/\d{2,4}|\w+\s+\d{4}|\d{4})\s*(?:[-–—to]+)\s*(\d{1,2}\/\d{2,4}|\w+\s+\d{4}|\d{4}|present|current|now)/gi;
    const ranges: { start: string; end: string; position: number }[] = [];
    let drMatch: RegExpExecArray | null;
    dateRangePattern.lastIndex = 0;
    while ((drMatch = dateRangePattern.exec(input)) !== null) {
      ranges.push({ start: drMatch[1], end: drMatch[2], position: drMatch.index });
    }

    // Also look for individual year references
    const yearPattern = /\b(19|20)\d{2}\b/g;
    const years: number[] = [];
    let yMatch: RegExpExecArray | null;
    yearPattern.lastIndex = 0;
    while ((yMatch = yearPattern.exec(input)) !== null) {
      years.push(parseInt(yMatch[0], 10));
    }

    // Look for gap indicators
    const gapIndicators: string[] = [];
    if (/(?:gap|break|unemploy|not\s+work|out\s+of\s+work|career\s+break|travel|caring)/gi.test(input)) {
      gapIndicators.push("Gap/break keywords found in text — verify explanation provided");
    }

    // Check for unexplained periods
    if (/(?:reason\s+for\s+leaving|left\s+because|resigned|dismissed|redundan|ended)/gi.test(input)) {
      gapIndicators.push("Reasons for leaving referenced — check each is documented");
    }

    let output = "**Employment Gap Analysis:**\n\n";

    if (ranges.length > 0) {
      output += `**Date Ranges Found (${ranges.length}):**\n`;
      output += ranges.map((r, i) => `${i + 1}. ${r.start} — ${r.end}`).join("\n");
      output += "\n\n";
    }

    if (years.length > 1) {
      const sortedYears = [...new Set(years)].sort();
      for (let i = 1; i < sortedYears.length; i++) {
        if (sortedYears[i] - sortedYears[i - 1] > 1) {
          gapIndicators.push(`Potential gap: no employment referenced between ${sortedYears[i - 1]} and ${sortedYears[i]}`);
        }
      }
    }

    if (gapIndicators.length > 0) {
      output += `**Potential Gaps/Issues (${gapIndicators.length}):**\n`;
      output += gapIndicators.map((g) => `- Warning: ${g}`).join("\n");
      output += "\n\n";
    } else if (ranges.length > 0 || years.length > 0) {
      output += "**No obvious gaps detected** — verify manually by checking month-to-month continuity.\n\n";
    } else {
      output += "**No date ranges found** — ensure full employment history is provided with start and end dates for each role.\n\n";
    }

    output += `**Safer Recruitment Reminder:**
- All gaps must be explored and documented at interview
- Self-employment periods require verification
- Volunteer work and education should be accounted for
- A full history from leaving secondary education is required

*Aria gap check — pattern-based scan. Always verify manually against application form and at interview.*`;

    return {
      output,
      confidence: ranges.length > 2 ? "medium" : "low",
      method: "pattern",
      metadata: { ranges_found: ranges.length, gaps_flagged: gapIndicators.length },
      warnings: gapIndicators,
    };
  },

  check_overdue_audit_actions: (input) => {
    const today = new Date();
    const issues: string[] = [];
    const overdueItems: string[] = [];

    // Look for dates that have passed
    const datePattern = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g;
    let dMatch: RegExpExecArray | null;
    datePattern.lastIndex = 0;
    while ((dMatch = datePattern.exec(input)) !== null) {
      const day = parseInt(dMatch[1], 10);
      const month = parseInt(dMatch[2], 10) - 1;
      let year = parseInt(dMatch[3], 10);
      if (year < 100) year += 2000;
      const itemDate = new Date(year, month, day);
      if (itemDate < today) {
        const start = Math.max(0, dMatch.index - 40);
        const end = Math.min(input.length, dMatch.index + dMatch[0].length + 40);
        const context = input.slice(start, end).replace(/\n/g, " ").trim();
        overdueItems.push(`"${context}" — date ${dMatch[0]} has passed`);
      }
    }

    // Look for overdue indicators in text
    if (/overdue|outstanding|not\s+completed|still\s+pending|awaiting|delayed|late/gi.test(input)) {
      issues.push("Text contains overdue/outstanding language — confirm which items are overdue");
    }
    if (/not\s+(?:yet\s+)?(?:done|completed|actioned|addressed|resolved)/gi.test(input)) {
      issues.push("Incomplete actions referenced in text");
    }

    let output = "**Overdue Audit Actions Review:**\n\n";

    if (overdueItems.length > 0) {
      output += `**Potentially Overdue (${overdueItems.length} past dates found):**\n`;
      output += overdueItems.map((o, i) => `${i + 1}. ${o}`).join("\n");
      output += "\n\n";
    }

    if (issues.length > 0) {
      output += `**Status Indicators:**\n`;
      output += issues.map((i) => `- ${i}`).join("\n");
      output += "\n\n";
    }

    if (overdueItems.length === 0 && issues.length === 0) {
      output += "No overdue items detected from the text provided. Verify against your audit action tracker.\n\n";
    }

    output += `*Aria overdue check — compare against your audit action log for definitive status.*`;

    return {
      output,
      confidence: overdueItems.length > 0 ? "medium" : "low",
      method: "pattern",
      metadata: { overdue_count: overdueItems.length, issues_count: issues.length },
      warnings: overdueItems,
    };
  },

  // ─── Document Analysis (pattern-based) ──────────────────────────────────

  suggest_where_document_should_link: (input) => {
    const suggestions: string[] = [];

    // Check for child references
    const childRefs = input.match(/(?:child|young\s+person|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:was|is|had|has|said|felt|appeared)/gi) || [];
    if (childRefs.length > 0) {
      suggestions.push("Link to relevant child record(s) — child references detected");
    }

    // Check for staff references
    if (/staff\s+\w+|(?:worker|carer|manager|senior)\s+\w+/i.test(input)) {
      suggestions.push("Link to relevant staff record(s) — staff member(s) referenced");
    }

    // Check for incident references
    if (/incident|restrain|physical\s+intervention|missing|abscond|safeguard|disclosure/i.test(input)) {
      suggestions.push("Link to incident record — incident-related content detected");
    }

    // Check for care plan references
    if (/care\s+plan|placement\s+plan|risk\s+assessment|behaviour\s+support/i.test(input)) {
      suggestions.push("Link to care plan / placement plan — plan references detected");
    }

    // Check for meeting references
    if (/meeting|review|conference|lac|supervision|discussion/i.test(input)) {
      suggestions.push("Link to meeting record — meeting referenced");
    }

    // Check for external agency references
    if (/social\s+worker|camhs|police|school|gp|doctor|ofsted|local\s+authority/i.test(input)) {
      suggestions.push("Link to external contact / agency record — external party referenced");
    }

    // Check for medication
    if (/medication|prescri|dosage|pharmacy/i.test(input)) {
      suggestions.push("Link to medication record — medication references detected");
    }

    // Check for policy references
    if (/policy|procedure|protocol|regulation|standard|guidance/i.test(input)) {
      suggestions.push("Link to relevant policy/procedure document");
    }

    if (suggestions.length === 0) {
      return {
        output: "**Document Linking:** No specific linkable references detected. Ensure the document is linked to the relevant child and/or staff record.\n\n*Aria linking suggestion — all records should be linked to at least one child or staff record.*",
        confidence: "low",
        method: "pattern",
        metadata: { suggestions_count: 0 },
      };
    }

    const output = `**Suggested Document Links (${suggestions.length}):**\n\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n*Aria linking suggestions — link documents to ensure a complete audit trail and easy retrieval.*`;
    return { output, confidence: "medium", method: "pattern", metadata: { suggestions_count: suggestions.length } };
  },

  identify_document_links: (input) => {
    const links: string[] = [];

    // Named individuals (capitalised names)
    const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
    const names: string[] = [];
    let nMatch: RegExpExecArray | null;
    namePattern.lastIndex = 0;
    while ((nMatch = namePattern.exec(input)) !== null) {
      const name = nMatch[1];
      // Filter out common false positives
      if (!/^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|The|This|That|These|Those|Staff|Young|Senior|Deputy|Registered)/.test(name)) {
        if (!names.includes(name)) names.push(name);
      }
    }
    if (names.length > 0) {
      links.push(`**People Referenced:** ${names.join(", ")}`);
    }

    // Record type references
    const recordTypes: string[] = [];
    if (/incident\s+(?:report|record|log|#\d+)/i.test(input)) recordTypes.push("Incident record");
    if (/care\s+plan/i.test(input)) recordTypes.push("Care plan");
    if (/risk\s+assessment/i.test(input)) recordTypes.push("Risk assessment");
    if (/placement\s+plan/i.test(input)) recordTypes.push("Placement plan");
    if (/behaviour\s+support\s+plan/i.test(input)) recordTypes.push("Behaviour support plan");
    if (/supervision/i.test(input)) recordTypes.push("Supervision record");
    if (/meeting\s+minutes/i.test(input)) recordTypes.push("Meeting minutes");
    if (/daily\s+log/i.test(input)) recordTypes.push("Daily log");
    if (/body\s+map/i.test(input)) recordTypes.push("Body map");
    if (/medication/i.test(input)) recordTypes.push("Medication record");

    if (recordTypes.length > 0) {
      links.push(`**Record Types Referenced:** ${recordTypes.join(", ")}`);
    }

    // External agencies
    const agencies: string[] = [];
    if (/social\s+worker|local\s+authority|placing\s+authority/i.test(input)) agencies.push("Local Authority / Social Worker");
    if (/police|officer/i.test(input)) agencies.push("Police");
    if (/camhs/i.test(input)) agencies.push("CAMHS");
    if (/school|teacher|senco/i.test(input)) agencies.push("School/Education");
    if (/gp|doctor|hospital|nhs/i.test(input)) agencies.push("Health/GP");
    if (/ofsted/i.test(input)) agencies.push("Ofsted");

    if (agencies.length > 0) {
      links.push(`**External Agencies:** ${agencies.join(", ")}`);
    }

    if (links.length === 0) {
      return {
        output: "**Document Links:** No specific references to other records, people, or agencies detected.\n\n*Aria link detection — ensure records contain cross-references for a complete audit trail.*",
        confidence: "low",
        method: "pattern",
        metadata: { links_found: 0 },
      };
    }

    const output = `**Document References Identified:**\n\n${links.join("\n\n")}\n\n*Aria link detection — create formal links to these records in the system.*`;
    return { output, confidence: "medium", method: "pattern", metadata: { links_found: links.length, names_found: names.length } };
  },

  create_document_summary_for_record: (input) => {
    // Extract key sentences using keyword scoring (same approach as extract_key_points but formatted for linking)
    const sentences = input.split(/[.!?]\s+/).filter((s) => s.trim().length > 20);
    if (sentences.length === 0) {
      return { output: "**Document Summary:** Text is too short to summarise.\n\n*Aria summary — provide more content for a meaningful summary.*", confidence: "low", method: "pattern" };
    }

    const keywords = /important|significant|concern|risk|action|require|must|essential|critical|key|note|decision|agreed|outcome|result|recommendation|safeguard|review|update/gi;
    const scored = sentences.map((s) => ({
      text: s.trim(),
      score: (s.match(keywords) || []).length + (s.length > 80 ? 1 : 0),
    })).sort((a, b) => b.score - a.score);

    const top = scored.slice(0, Math.min(4, scored.length));
    const wordCount = input.split(/\s+/).length;

    let output = `**Document Summary (for linking to record):**\n\n`;
    output += top.map((p) => `- ${p.text}`).join("\n");
    output += `\n\n**Document Stats:** ${wordCount} words, ${sentences.length} sentences\n`;
    output += `\n*Aria summary — attach this summary when linking the document to a child or staff record.*`;

    return { output, confidence: "medium", method: "pattern", metadata: { key_points: top.length, word_count: wordCount } };
  },

  // ─── Compliance / Regulatory ────────────────────────────────────────────

  safer_recruitment_checklist_review: (input) => {
    const checklist = [
      { item: "Enhanced DBS check", pattern: /(?:enhanced\s+)?dbs|disclosure\s+and\s+barring/i },
      { item: "Barred list check", pattern: /barred\s+list|children'?s?\s+barred/i },
      { item: "Right to work verification", pattern: /right\s+to\s+work|work\s+permit|visa|passport/i },
      { item: "Identity verification (photo ID)", pattern: /photo\s+id|identity|passport|driving\s+licen/i },
      { item: "Two references (including most recent employer)", pattern: /reference|referee/i },
      { item: "Full employment history with gaps explored", pattern: /employment\s+history|full\s+history|gap/i },
      { item: "Qualification verification", pattern: /qualificat|certificat|diploma|degree|nvq|level\s+\d/i },
      { item: "Health declaration / fitness to work", pattern: /health\s+declar|occupational\s+health|fitness|medical/i },
      { item: "Interview conducted with safeguarding questions", pattern: /interview|safeguard.*question/i },
      { item: "Online / social media check", pattern: /online|social\s+media|internet|google/i },
      { item: "Overseas police check (if applicable)", pattern: /overseas|international|foreign|abroad.*check/i },
      { item: "Self-declaration of criminal convictions", pattern: /self[\s-]?declar|criminal|conviction|caution/i },
      { item: "Prohibition from teaching check (if applicable)", pattern: /prohibit.*teach|teacher.*regul|TRA/i },
      { item: "Section 128 direction check (if applicable)", pattern: /section\s*128|s\.?\s*128|management\s+bar/i },
      { item: "Single central record updated", pattern: /single\s+central|scr|central\s+record/i },
    ];

    const met: string[] = [];
    const notMet: string[] = [];

    for (const check of checklist) {
      if (check.pattern.test(input)) {
        met.push(check.item);
      } else {
        notMet.push(check.item);
      }
    }

    const completeness = Math.round((met.length / checklist.length) * 100);

    let output = `**Safer Recruitment Checklist Review: ${completeness}%**\n\n`;

    if (met.length > 0) {
      output += `**Evidence Found (${met.length}/${checklist.length}):**\n`;
      output += met.map((m) => `- [x] ${m}`).join("\n");
      output += "\n\n";
    }

    if (notMet.length > 0) {
      output += `**Not Yet Evidenced (${notMet.length}/${checklist.length}):**\n`;
      output += notMet.map((m) => `- [ ] ${m}`).join("\n");
      output += "\n\n";
    }

    output += `**Reminder:** KCSIE 2024 and Regulation 32 of the CH(E) Regulations 2015 require all checks to be completed before an offer of employment is confirmed. Never allow unsupervised access to children before all checks are cleared.\n\n`;
    output += `*Aria safer recruitment check — verify each item against physical/digital evidence. This scan checks for keyword references, not verified documents.*`;

    return {
      output,
      confidence: "high",
      method: "rules",
      metadata: { completeness, met_count: met.length, not_met_count: notMet.length },
      warnings: notMet.length > 5 ? ["Significant gaps in safer recruitment evidence"] : undefined,
    };
  },

  prepare_meeting_agenda: (input, ctx) => {
    // Delegate to create_agenda with the same logic
    const today = ctx?.date || new Date().toISOString().slice(0, 10);
    const lower = (input || "").toLowerCase();
    let meetingType = "General Meeting";
    let items: string[];

    if (/team|staff/i.test(lower)) {
      meetingType = "Team Meeting";
      items = [
        "Apologies and attendance",
        "Minutes of last meeting — accuracy check",
        "Matters arising / action tracker review",
        "Children's updates — each child in turn",
        "Safeguarding updates",
        "Staffing, rota, and leave",
        "Health and safety updates",
        "Training and development",
        "Policy updates and reminders",
        "Quality and compliance",
        "Praise and recognition",
        "Any other business",
        "Date of next meeting",
      ];
    } else if (/supervision/i.test(lower)) {
      meetingType = "Supervision";
      items = [
        "Wellbeing check-in",
        "Review of previous supervision actions",
        "Caseload / key children discussion",
        "Practice reflection — what went well / challenges",
        "Safeguarding awareness",
        "Training and development needs",
        "Professional development and goals",
        "Any concerns or support needed",
        "Agreed actions and timescales",
        "Date of next supervision",
      ];
    } else if (/professional|strategy|multi[\s-]?agency/i.test(lower)) {
      meetingType = "Professionals Meeting";
      items = [
        "Introductions, roles, and apologies",
        "Confidentiality and information sharing reminder",
        "Purpose of meeting",
        "Background and referral information",
        "Updates from each agency",
        "Risk analysis and current concerns",
        "Child's views and wishes",
        "Agreed multi-agency plan",
        "Actions, owners, and deadlines",
        "Contingency arrangements",
        "Date of review meeting",
      ];
    } else if (/lac|review|looked\s+after/i.test(lower)) {
      meetingType = "LAC Review";
      items = [
        "Introductions and apologies",
        "Minutes and actions from last review",
        "Child's views, wishes, and feelings",
        "Placement stability and progress",
        "Education — attendance, progress, support",
        "Health — physical, emotional, dental",
        "Identity, diversity, and cultural needs",
        "Contact arrangements",
        "Care plan review and update",
        "Transition / pathway planning (if applicable)",
        "Risk assessment review",
        "IRO summary and recommendations",
        "Actions and timescales",
        "Date of next review",
      ];
    } else {
      items = [
        "Apologies",
        "Minutes of previous meeting",
        "Matters arising",
        input ? `Main item: ${input}` : "[Main discussion items]",
        "Any other business",
        "Date and time of next meeting",
      ];
    }

    const output = `**${meetingType} Agenda**

**Date:** ${today}
**Time:** [Start time]
**Location:** [Venue]
**Chair:** [Name]

---

${items.map((item, i) => `${i + 1}. ${item}`).join("\n")}

---
*Aria template — circulate to all attendees at least 48 hours before the meeting.*`;

    return { output, confidence: "high", method: "template", metadata: { meeting_type: meetingType, items_count: items.length } };
  },

  escalate_overdue_task: (input, ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    const staffRef = ctx?.staffName || "[Assigned staff member]";
    const output = `**Task Escalation Notice**

**Date:** ${today}
**Escalated By:** [Manager name]
**Original Owner:** ${staffRef}

---

**Overdue Task Details:**
${input || "[Describe the overdue task]"}

**Original Due Date:** [Date]
**Days Overdue:** [Number]

---

**Escalation Message:**

This task has exceeded its due date and requires immediate attention. Please:

1. Confirm current status of this task
2. Provide reason for the delay
3. State a revised completion date
4. Identify any support or resources needed

If this task relates to a child's safety, welfare, or a regulatory requirement, it must be treated as a priority.

**Escalation Level:**
- [ ] Level 1 — Reminder to task owner
- [ ] Level 2 — Escalated to line manager
- [ ] Level 3 — Escalated to Registered Manager
- [ ] Level 4 — Escalated to Responsible Individual

**Manager Notes:**
[Add context about why this escalation is necessary]

---
*Aria template — complete and send to the relevant parties. Record the escalation in the task log.*`;

    return { output, confidence: "high", method: "template" };
  },

  trigger_related_document_update: (input) => {
    const updates: string[] = [];
    const lower = input.toLowerCase();

    // Incident triggers
    if (/incident|restrain|missing|abscond|safeguard/i.test(lower)) {
      updates.push("Risk assessment — review and update in light of this incident");
      updates.push("Behaviour support plan — check if strategies need updating");
      updates.push("Care plan — ensure incident is reflected in care planning");
      updates.push("Daily log — add incident reference");
    }

    // Placement changes
    if (/placement|admission|discharge|transfer|move/i.test(lower)) {
      updates.push("Placement plan — update or close as appropriate");
      updates.push("Care plan — full review required");
      updates.push("Risk assessments — review for new environment");
      updates.push("Contact arrangements — review and update");
      updates.push("Education — notify school of change");
      updates.push("Health — register with new GP if applicable");
    }

    // Health changes
    if (/health|medication|diagnos|hospital|treatment/i.test(lower)) {
      updates.push("Health plan — update with new information");
      updates.push("Medication record — update if prescription changed");
      updates.push("Care plan — reflect health changes");
      updates.push("Risk assessment — review if health condition affects risk");
    }

    // Staffing changes
    if (/staff|resign|new\s+starter|leave|absence|dismiss/i.test(lower)) {
      updates.push("Rota — update staffing schedule");
      updates.push("Key worker allocation — reassign if needed");
      updates.push("Single central record — update");
      updates.push("Children's records — update key worker reference");
    }

    // Policy/regulation changes
    if (/policy|regulation|guidance|legislation|ofsted|requirement/i.test(lower)) {
      updates.push("Affected policies — review and update");
      updates.push("Staff handbook — update if procedures change");
      updates.push("Training matrix — identify new training needs");
      updates.push("Statement of purpose — review if fundamental change");
    }

    if (updates.length === 0) {
      updates.push("Review which documents may be affected by this change");
      updates.push("Check care plan, risk assessment, and placement plan for relevance");
    }

    const output = `**Related Documents Requiring Update (${updates.length}):**\n\n${updates.map((u, i) => `${i + 1}. [ ] ${u}`).join("\n")}\n\n*Aria cascade check — when one document changes, others may need updating to maintain consistency.*`;
    return { output, confidence: "medium", method: "rules", metadata: { updates_count: updates.length } };
  },

  // ─── Additional extraction/analysis commands ────────────────────────────

  extract_document_actions: (input, ctx) => extractActions(input),

  identify_management_actions: (input, ctx) => {
    // Reuse extractActions but with management-specific framing
    const base = extractActions(input);
    const output = base.output
      .replace("Action Items Identified", "Management Actions Identified")
      .replace("Aria suggested actions — extracted from the record text. Assign owners and due dates before actioning.",
        "Aria management actions — extracted from oversight/management text. Each action should have a named owner and clear deadline.");
    return { ...base, output };
  },

  create_management_action_plan: (input, ctx) => {
    const actionResult = extractActions(input);
    const riskResult = identifyRisks(input);

    const actions: string[] = [];
    const actionMeta = actionResult.metadata as Record<string, unknown> | undefined;
    if (actionMeta && (actionMeta.action_count as number) > 0) {
      const lines = actionResult.output.split("\n").filter((l) => /^\d+\./.test(l));
      for (const line of lines) {
        actions.push(line.replace(/^\d+\.\s*/, ""));
      }
    }

    const riskMeta = riskResult.metadata as Record<string, unknown> | undefined;
    if (riskMeta && (riskMeta.highest_level as string) === "critical") {
      actions.unshift("PRIORITY: Address critical safeguarding concerns immediately");
    }

    if (actions.length === 0) {
      actions.push("Review current situation and identify required actions");
      actions.push("Set improvement targets with measurable outcomes");
      actions.push("Schedule follow-up review date");
    }

    const today = new Date().toISOString().slice(0, 10);
    let output = `**Management Action Plan — ${today}**\n\n`;
    output += `| # | Action | Owner | Due Date | Status |\n`;
    output += `|---|--------|-------|----------|--------|\n`;
    for (let i = 0; i < actions.length; i++) {
      output += `| ${i + 1} | ${actions[i]} | [Assign] | [Date] | Not started |\n`;
    }
    output += `\n**Review Date:** [Set review date]\n`;
    output += `**Responsible Manager:** [Name]\n\n`;
    output += `*Aria action plan — assign owners, set realistic deadlines, and review progress at the agreed date.*`;

    return { output, confidence: "medium", method: "rules", metadata: { action_count: actions.length } };
  },

  // ─── Aliases and additional template-based commands ──────────────────────

  draft_meeting_minutes: (input, ctx) => {
    // Alias for create_meeting_minutes — same template, different command ID
    const handler = RULE_HANDLERS["create_meeting_minutes"];
    return handler ? handler(input, ctx) : null;
  },

  create_delegated_audit_tasks: (input, ctx) => {
    const tasks: string[] = [];
    const lower = input.toLowerCase();

    // Parse audit content for delegation categories
    if (/document|record|evidence|filing|paperwork/i.test(lower)) {
      tasks.push("Delegate: Collect and file missing documentation — assign to admin/senior support worker");
    }
    if (/training|induction|competenc/i.test(lower)) {
      tasks.push("Delegate: Book identified training sessions — assign to training coordinator");
    }
    if (/maintenance|repair|premises|health\s+and\s+safety|fire/i.test(lower)) {
      tasks.push("Delegate: Address premises/H&S issues — assign to facilities lead");
    }
    if (/policy|procedure|update/i.test(lower)) {
      tasks.push("Delegate: Review and update relevant policies — assign to deputy manager");
    }
    if (/supervisi|apprais|staff\s+development/i.test(lower)) {
      tasks.push("Delegate: Schedule outstanding supervisions/appraisals — assign to line managers");
    }
    if (/child|care\s+plan|risk|placement/i.test(lower)) {
      tasks.push("Delegate: Update child records/plans — assign to key workers");
    }
    if (/medication|health|gp|dental/i.test(lower)) {
      tasks.push("Delegate: Address health/medication actions — assign to health lead");
    }

    if (tasks.length === 0) {
      tasks.push("Review audit findings and identify tasks suitable for delegation");
      tasks.push("Assign each task to the most appropriate staff member by competence and capacity");
    }

    tasks.push("Manager: Set review checkpoint to confirm delegated tasks are progressing");
    tasks.push("Manager: Retain overall accountability — delegation is not abdication");

    const output = `**Delegated Audit Tasks (${tasks.length}):**\n\n${tasks.map((t, i) => `${i + 1}. [ ] ${t}`).join("\n")}\n\n*Aria delegation — the Registered Manager retains accountability. Confirm each delegate understands the task, deadline, and expected standard.*`;
    return { output, confidence: "medium", method: "rules", metadata: { task_count: tasks.length } };
  },

  prioritise_audit_risks: (input) => {
    const risks = identifyRisks(input);
    // Re-frame the risk output for audit context
    const output = risks.output
      .replace("Risk Indicators Found", "Audit Risk Priorities")
      .replace("No specific risk indicators detected", "No specific risk indicators detected in the audit text")
      .replace("Aria risk scan — keyword-based detection. Always apply professional judgement and follow your home's safeguarding procedures.",
        "Aria audit risk prioritisation — address critical and high items first. Create corrective action plans for each category.");
    return { ...risks, output };
  },
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Attempt to handle an ARIA command using deterministic rules.
 * Returns null if this command requires LLM — caller should fall through.
 */
export function tryRulesFirst(commandId: string, inputText: string, context?: RuleContext): RuleResult | null {
  const handler = RULE_HANDLERS[commandId];
  if (!handler) return null; // No rule for this command — use LLM

  try {
    const result = handler(inputText, context);
    if (!result) return null;

    // Tag all rule outputs so the UI can differentiate
    result.output = result.output + "\n\n---\n*Processed by Aria Rules Engine (no AI API call used)*";
    return result;
  } catch (err) {
    console.warn(`[aria-rules-engine] Rule handler for ${commandId} failed:`, err);
    return null; // Fall through to LLM on error
  }
}

/**
 * Check if a command has a deterministic rule handler.
 */
export function hasRuleHandler(commandId: string): boolean {
  return commandId in RULE_HANDLERS;
}

/**
 * Get all command IDs that have rule handlers.
 */
export function getRuleHandledCommands(): string[] {
  return Object.keys(RULE_HANDLERS);
}

/**
 * Get stats about rule coverage.
 */
export function getRuleStats(): { total_handlers: number; command_ids: string[]; categories: Record<string, number> } {
  const ids = Object.keys(RULE_HANDLERS);
  const categories: Record<string, number> = {};
  for (const id of ids) {
    const cat = id.split("_").slice(0, 2).join("_");
    categories[cat] = (categories[cat] || 0) + 1;
  }
  return { total_handlers: ids.length, command_ids: ids, categories };
}
