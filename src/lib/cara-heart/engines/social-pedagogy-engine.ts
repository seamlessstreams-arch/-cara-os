// ══════════════════════════════════════════════════════════════════════════════
// CARA HEART — SocialPedagogyReflectionEngine (pure / deterministic)
//
// Structures reflection through the social pedagogy framework: Head, Heart
// and Hands. This is distinct from PACE — social pedagogy addresses the whole
// person of the worker and child across all three dimensions, whereas PACE
// (Playfulness, Acceptance, Curiosity, Empathy) focuses on relational stance.
//
// Head = knowledge, theory, plan, patterns, what we know
// Heart = feelings, relationships, empathy, what it is like
// Hands = actions, practical steps, skills, what we do
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CaraPracticeRecord,
  SocialPedagogyReflection,
  IntelligenceAuditEntry,
} from "../types";

const ENGINE = "SocialPedagogyEngine";

// Whole-word, negation-aware mention check: stops "again" firing inside "against"
// (a fabricated "repeating pattern") and stops "did not refuse"/"no refusal"
// triggering the refusal-interpretation prompt.
const SP_NEGATION_RE = /\b(no|not|never|without|denied|denies|cannot|nobody|none)\b|n['’]t\b/;
function spNegated(lower: string, idx: number): boolean {
  let p = lower.slice(Math.max(0, idx - 25), idx);
  const s = Math.max(
    p.lastIndexOf("."), p.lastIndexOf("!"), p.lastIndexOf("?"),
    p.lastIndexOf(";"), p.lastIndexOf(","),
  );
  if (s >= 0) p = p.slice(s + 1);
  return SP_NEGATION_RE.test(p);
}
function mentions(lower: string, regexes: RegExp[]): boolean {
  for (const re of regexes) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(lower)) !== null) {
      if (!spNegated(lower, m.index)) return true;
    }
  }
  return false;
}

// ── Head: knowledge and theory ────────────────────────────────────────────────

function buildHead(record: CaraPracticeRecord): SocialPedagogyReflection["head"] {
  const lower = [record.description, record.staffResponse ?? ""].join(" ").toLowerCase();
  const whatDoWeKnow: string[] = [];
  const theoryOrPlanLinks: string[] = [];
  const patterns: string[] = [];

  // Triggers and known history
  if (record.knownTriggers && record.knownTriggers.length > 0) {
    whatDoWeKnow.push(`Known triggers relevant to this record: ${record.knownTriggers.join(", ")}.`);
  } else {
    whatDoWeKnow.push(
      "Are there known triggers for this child that may be relevant to this record? Check the care and placement plan.",
    );
  }

  // Record type knowledge
  if (record.type === "missing_episode") {
    whatDoWeKnow.push(
      "Missing from care episodes often reflect unmet need, a relationship rupture, fear, or external pull factors. What do we know about why this child goes missing?",
    );
    theoryOrPlanLinks.push("Review the missing from care plan and the child's risk assessment.");
  }

  if (record.type === "physical_intervention") {
    whatDoWeKnow.push(
      "Physical intervention should only occur when other de-escalation strategies have not been effective. What do we know about de-escalation approaches that work for this child?",
    );
    theoryOrPlanLinks.push(
      "Review the behaviour support plan and any positive behaviour support strategies recorded.",
    );
  }

  if (record.type === "family_contact") {
    whatDoWeKnow.push(
      "Family contact can evoke complex emotional responses — grief, loyalty, excitement, and anxiety. What do we know about the impact of family contact on this child?",
    );
  }

  // General plan link
  theoryOrPlanLinks.push(
    "How does the placement plan frame this child's needs, risks, and the home's therapeutic response?",
  );
  theoryOrPlanLinks.push(
    "What does trauma-informed or attachment-based theory tell us about this type of behaviour or situation?",
  );

  // Patterns
  patterns.push(
    "Is this an isolated incident, or part of a pattern? Consider time of day, day of week, seasonal triggers, staffing patterns, and proximity to family contact or transitions.",
  );

  if (mentions(lower, [/\bagain\b/g, /\brepeated/g, /\bsame as\b/g])) {
    patterns.push(
      "This record may indicate a repeating pattern. Consider whether the care plan or placement plan needs to be updated to address this.",
    );
  }

  return { whatDoWeKnow, theoryOrPlanLinks, patterns };
}

// ── Heart: feelings and relationships ────────────────────────────────────────

function buildHeart(record: CaraPracticeRecord): SocialPedagogyReflection["heart"] {
  const lower = [record.description, record.staffResponse ?? ""].join(" ").toLowerCase();
  const whatMightTheChildFeel: string[] = [];
  const whatMightTheAdultFeel: string[] = [];
  const relationshipImpact: string[] = [];

  // Child feelings
  whatMightTheChildFeel.push(
    "What might the child have been feeling before, during, and after this situation? Consider fear, shame, anger, grief, loneliness, excitement, or anxiety.",
  );

  if (record.type === "missing_episode") {
    whatMightTheChildFeel.push(
      "A child who goes missing may feel unsafe in the home, pulled towards someone outside, overwhelmed by something in their daily life, or in need of freedom and control.",
    );
  }

  if (record.type === "physical_intervention") {
    whatMightTheChildFeel.push(
      "Physical restraint can feel frightening, humiliating, or re-traumatising, even when it is used safely and proportionately. What did the child communicate about their experience?",
    );
  }

  if (mentions(lower, [/\brefus/g])) {
    whatMightTheChildFeel.push(
      "Refusal may communicate anxiety, shame, a need for control, or testing whether adults will impose or stay regulated.",
    );
  }

  // Adult feelings
  whatMightTheAdultFeel.push(
    "How might the staff involved be feeling about this situation? Frustration, anxiety, helplessness, sadness, and concern are all normal and valid responses to complex care work.",
  );

  if ((record.severity ?? 1) >= 4 || record.type === "physical_intervention") {
    whatMightTheAdultFeel.push(
      "High-intensity situations can leave staff feeling emotionally drained. This is a sign of investment and care — staff deserve support and recognition.",
    );
  }

  // Relationship
  relationshipImpact.push(
    "What impact might this situation have had on the relationship between the child and the worker involved? Was the relationship tested? Was it maintained?",
  );

  if (record.repairRecorded) {
    relationshipImpact.push(
      "A repair conversation has been recorded. This is evidence of relational resilience — the relationship has survived a difficult moment.",
    );
  } else if (
    record.type === "incident" ||
    record.type === "physical_intervention" ||
    record.type === "behaviour_record"
  ) {
    relationshipImpact.push(
      "Was there an opportunity for repair after this situation? Even a brief, warm interaction can help preserve the relational connection.",
    );
  }

  return { whatMightTheChildFeel, whatMightTheAdultFeel, relationshipImpact };
}

// ── Hands: practical action ───────────────────────────────────────────────────

function buildHands(record: CaraPracticeRecord): SocialPedagogyReflection["hands"] {
  const practicalActionsTaken: string[] = [];
  const nextPracticalSteps: string[] = [];
  const repairActions: string[] = [];

  // What was done
  if (record.staffResponse && record.staffResponse.trim().length > 5) {
    practicalActionsTaken.push(
      `Staff response recorded: ${record.staffResponse}`,
    );
  } else {
    practicalActionsTaken.push(
      "The staff response is not yet clearly described. Add what staff did to support the child, de-escalate, and maintain safety.",
    );
  }

  if (record.managerConsulted) {
    practicalActionsTaken.push("The manager was consulted.");
  }
  if (record.socialWorkerNotified) {
    practicalActionsTaken.push("The social worker was notified.");
  }
  if (record.safeguardingActionTaken) {
    practicalActionsTaken.push("A safeguarding action was taken.");
  }

  // Next steps
  nextPracticalSteps.push(
    "Record what needs to happen next: who is responsible, by when, and how the outcome will be reviewed.",
  );

  if (!record.repairRecorded && ["incident", "physical_intervention", "behaviour_record", "police_contact"].includes(record.type)) {
    nextPracticalSteps.push(
      "Plan a restorative conversation with the child at an appropriate time, when both the child and the adult are regulated.",
    );
  }

  if (!record.staffDebriefRecorded && (record.severity ?? 1) >= 3) {
    nextPracticalSteps.push(
      "Offer a staff debrief or reflective space before the worker's next shift.",
    );
  }

  if (
    record.statutoryNotificationRequired &&
    !record.statutoryNotificationCompleted
  ) {
    nextPracticalSteps.push(
      "Complete the outstanding statutory notification without delay. Record who made the notification and when.",
    );
  }

  // Repair
  if (record.repairRecorded) {
    repairActions.push(
      "A repair conversation or restorative action has been recorded. Ensure the outcome of this is clearly documented.",
    );
  } else if (
    ["incident", "physical_intervention", "behaviour_record", "police_contact", "missing_episode"].includes(record.type)
  ) {
    repairActions.push(
      "Plan a repair conversation: a calm, child-led opportunity to understand what happened, what the child needed, and how the relationship can move forward.",
    );
    repairActions.push(
      "Repair should include the relationship, the child's dignity, any practical consequences (e.g. damaged property), and where relevant, the staff member's confidence.",
    );
  }

  return { practicalActionsTaken, nextPracticalSteps, repairActions };
}

// ── Rights and ethics ─────────────────────────────────────────────────────────

function buildRightsAndEthics(record: CaraPracticeRecord): SocialPedagogyReflection["rightsAndEthics"] {
  const childRightsConsidered: string[] = [];
  const dignityIssues: string[] = [];

  childRightsConsidered.push(
    "Did the child have the opportunity to express their view or be heard in this situation?",
  );
  childRightsConsidered.push(
    "Was the child informed of what was happening and why, in a way they could understand?",
  );
  childRightsConsidered.push(
    "Was the child's right to privacy and dignity respected throughout?",
  );

  if (record.restraintUsed) {
    childRightsConsidered.push(
      "A physical intervention was used. The child's right to bodily autonomy and dignity in restraint must be considered and recorded.",
    );
    dignityIssues.push(
      "Ensure the physical intervention record documents how the child's dignity was maintained throughout.",
    );
  }

  if (record.policeCalled) {
    childRightsConsidered.push(
      "Police involvement has implications for the child's rights. Was the child informed of their rights? Was advocacy considered?",
    );
  }

  const powerImbalanceConsidered = !!(record.restraintUsed || record.policeCalled || record.type === "incident");
  const fairnessConsidered = !!(record.childVoice || record.repairRecorded);

  return { childRightsConsidered, dignityIssues, powerImbalanceConsidered, fairnessConsidered };
}

// ── Main engine function ──────────────────────────────────────────────────────

export interface SocialPedagogyResult {
  reflection: SocialPedagogyReflection;
  audit: IntelligenceAuditEntry[];
}

export function runSocialPedagogyEngine(
  record: CaraPracticeRecord,
  now: string = new Date().toISOString(),
): SocialPedagogyResult {
  const audit: IntelligenceAuditEntry[] = [];

  const reflection: SocialPedagogyReflection = {
    head: buildHead(record),
    heart: buildHeart(record),
    hands: buildHands(record),
    rightsAndEthics: buildRightsAndEthics(record),
  };

  audit.push({
    ruleId: "SP_REFLECTION_GENERATED",
    engine: ENGINE,
    triggered: true,
    reason: "Social pedagogy Head/Heart/Hands reflection generated from record context.",
    severity: "info",
    timestamp: now,
  });

  const missingChildVoiceInHeads = !record.childVoice;
  audit.push({
    ruleId: "SP_CHILD_VOICE_IN_REFLECTION",
    engine: ENGINE,
    triggered: missingChildVoiceInHeads,
    reason: missingChildVoiceInHeads
      ? "Child voice is absent — social pedagogy reflection cannot fully represent the child's perspective."
      : "Child voice is present and supports the reflective analysis.",
    severity: missingChildVoiceInHeads ? "prompt" : "info",
    timestamp: now,
  });

  return { reflection, audit };
}
