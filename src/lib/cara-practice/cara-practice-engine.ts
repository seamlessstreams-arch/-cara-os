// ══════════════════════════════════════════════════════════════════════════════
// Cara PRACTICE INTELLIGENCE — DETERMINISTIC RULE ENGINE
//
// Pure, deterministic, no DB calls, no LLM. Works fully before any AI provider is
// connected. It DRAFTS prompts, ADVISES with reflective/threshold questions, and
// RECOGNISES weak recording, developmental gaps, overstated protective factors,
// safeguarding threshold + LADO concerns, relationship depth, and staff wellbeing.
//
// SAFETY: Cara advises; managers decide. The engine never makes a final statutory
// decision, never blames a child, never treats wellbeing as disciplinary evidence,
// and always advises emergency action where immediate danger is described.
// ══════════════════════════════════════════════════════════════════════════════

import {
  CaraFlag,
  CaraPracticeInput,
  CaraPracticeOutput,
  CaraPracticeScores,
  CaraQuestion,
  CaraRecommendation,
  CaraSeverity,
  DevelopmentalGapResult,
  DEVELOPMENTAL_DOMAINS,
  ProtectiveFactorResult,
  RelationshipDepthResult,
  ThresholdConsultationResult,
  CaraGuidanceRule,
} from "./types";
import { BEHAVIOUR_DRIVERS } from "@/lib/cara/practice-frameworks";
import { efhSignSpotting } from "@/lib/cara/contextual-safeguarding";
import { suggestSafetyPlanComponents } from "@/lib/cara/safety-planning";
import { assessNRMIndicators } from "@/lib/cara/nrm-modern-slavery";

// ── Lexicons ──────────────────────────────────────────────────────────────────

// Activity language that describes adult action but not necessarily child impact.
const WEAK_ACTIVITY = [
  "meeting held", "review completed", "referral made", "service offered",
  "plan reviewed", "key work completed", "completed key work", "key-work completed",
  "engaged well", "engaged with", "attended appointment", "attended",
  "no concerns", "settled", "compliant", "discussion took place", "completed work",
  "completed", "review took place", "session completed", "appointment attended",
];

// Language evidencing real child impact / lived experience / voice.
const CHILD_IMPACT = [
  "safer", "less frightened", "more secure", "emotionally secure", "more connected",
  "more hopeful", "hopeful", "child said", "child told", "child showed", "child felt",
  "disclosed", "what changed", "became different", "different for the child",
  "calmer because", "feels safe", "felt safe", "felt understood", "felt heard",
  "trusted", "able to tell", "asked for", "chose to", "for the first time",
];

// Weak protective-factor claims that need strengthening before they count.
const WEAK_PROTECTIVE = [
  "engages well", "attends meetings", "attends meeting", "engages with professionals",
  "has school", "professionals are involved", "professionals involved", "family support",
  "completed course", "completed a course", "open to support", "mum engages",
  "dad attends", "mum attends", "dad engages", "co-operating with services",
  "working with professionals",
];

// Deprivation cues that, paired with a developmental domain, indicate a gap.
const DEPRIVATION_CUES = [
  "lack", "lacks", "lacking", "without", "missing", "needs", "no sense of",
  "absence of", "absent", "deprived", "unmet", "has no", "does not have", "denied",
];

// Harm / disclosure cues (safeguarding threshold).
const SAFEGUARDING_RISK = [
  "disclosed", "hit by", "punched", "slapped", "kicked", "hurt by", "abused", "abuse",
  "assaulted", "scared to return", "afraid to go home", "scared to go home",
  "frightened of", "threatened", "beaten", "harmed by", "hit me", "hurt me",
  "neglect", "not safe at home", "burned", "choked",
];

// Immediate-danger cues → emergency action + critical.
const IMMEDIATE_DANGER = [
  "scared to return home", "scared to go home", "afraid to go home", "unsafe now",
  "immediate danger", "nowhere safe", "refuses to return", "in danger now",
  "tonight", "right now", "suicidal", "kill myself", "end my life", "overdose",
  "going to hurt", "about to", "actively self-harming",
];

// Adult-conduct / LADO cues (concern about an adult who works with or cares for children).
const LADO_CUES = [
  "staff member", "member of staff", "allegation against staff", "allegation against a staff",
  "inappropriate contact", "professional boundary", "boundary concern", "unsuitable conduct",
  "volunteer", "carer allegation", "worker allegation", "grooming",
  "inappropriate relationship", "concern about a staff", "concern raised about staff",
  "allegation about a worker", "staff conduct", "harmed by a worker", "harmed by staff",
];

// Adult / professional / process references. When these dominate and the
// child's lived experience is absent, it signals "adult-centred drift" — the
// child-centred supervision warning sign: "most of the discussion is about adults."
const ADULT_FOCUS = [
  "mother", "father", "the mum", "the dad", "parent", "parents", "grandmother",
  "grandfather", "social worker", "professional", "professionals", "agency",
  "agencies", "multi-agency", "staff team", "the team", "manager", "carer",
  "foster carer", "meeting", "review meeting", "placement meeting", "panel",
  "the adults", "case conference", "strategy meeting",
];

// Staff wellbeing / burnout signals (support-focused, never punitive).
const WELLBEING_CUES = [
  "exhausted", "overwhelmed", "emotionally drained", "drained", "anxious about work",
  "dreading work", "dread", "irritable", "detached", "brain fog",
  "struggling to concentrate", "not sleeping", "unable to sleep", "can't sleep",
  "cannot sleep", "cynical", "cannot cope", "can't cope", "procrastinat",
  "loss of confidence", "feeling unsupported", "unsupported", "burnout", "burnt out",
  "burned out", "can't switch off",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function norm(text: string): string {
  return (text ?? "").toLowerCase();
}

/** Returns the subset of `terms` present in `text` (case-insensitive). */
function matches(text: string, terms: string[]): string[] {
  const t = norm(text);
  return terms.filter((term) => t.includes(term));
}

function has(text: string, terms: string[]): boolean {
  return matches(text, terms).length > 0;
}

const SEVERITY_ORDER: CaraSeverity[] = ["low", "medium", "high", "critical"];
function maxSeverity(a: CaraSeverity, b: CaraSeverity): CaraSeverity {
  return SEVERITY_ORDER.indexOf(a) >= SEVERITY_ORDER.indexOf(b) ? a : b;
}
function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

// ── Detection: developmental gaps ─────────────────────────────────────────────

const DOMAIN_EXPECTATION: Record<string, string> = {
  safety: "A child should feel and be safe — free from fear and harm — every day.",
  love: "A child should experience warmth, affection and being genuinely cared about.",
  belonging: "A child should feel they belong somewhere and to someone.",
  stability: "A child should have a stable, predictable home and relationships that last.",
  "emotional security": "A child should feel emotionally held, soothed and secure.",
  learning: "A child should be learning and progressing at their own pace.",
  play: "A child should have time, space and permission to play and be a child.",
  opportunity: "A child should have access to opportunities that widen their world.",
  identity: "A child should be helped to know and value who they are.",
  hope: "A child should be able to imagine and hope for a positive future.",
  "trusted adult": "A child should have at least one reliable, trusted adult.",
  routine: "A child should have predictable routines that create security.",
  protection: "A child should be actively protected from harm by the adults around them.",
  "relational connection": "A child should have warm, consistent relational connection.",
};

function detectDevelopmentalGaps(text: string): DevelopmentalGapResult[] {
  const t = norm(text);
  if (!has(text, DEPRIVATION_CUES)) return [];
  const out: DevelopmentalGapResult[] = [];
  for (const domain of DEVELOPMENTAL_DOMAINS) {
    if (t.includes(domain)) {
      out.push({
        domain,
        expectedChildhoodCondition: DOMAIN_EXPECTATION[domain] ?? `Reasonable ${domain} should be present in the child's life.`,
        currentLivedReality: `The record indicates ${domain} is currently missing or insufficient for this child.`,
        gapDescription: `There is a gap between the ${domain} this child reasonably requires and what is present in their lived reality.`,
        severity: domain === "safety" || domain === "protection" ? "high" : "medium",
        impactOnChild: `Without ${domain}, the child's development, security and recovery are likely to be held back.`,
        requiredChange: `Plan specific, owned actions that visibly increase ${domain} in the child's day-to-day life, and define what will be different for the child if they succeed.`,
      });
    }
  }
  return out;
}

// ── Detection: protective factors ─────────────────────────────────────────────

function detectProtectiveFactors(text: string): ProtectiveFactorResult[] {
  const hits = matches(text, WEAK_PROTECTIVE);
  if (hits.length === 0) return [];
  return [
    {
      factorDescription: hits.join("; "),
      isReal: false,
      challenge:
        "This may be a positive factor, but it is not yet evidenced as a real protective factor. A protective factor must reduce harm, be reliable, be close to the child's lived experience, and hold under stress.",
      questions: [
        "What exactly does this protect the child from?",
        "How does it reduce harm or improve the child's daily life?",
        "Is it active now, or is it historical?",
        "Is it reliable under stress, without professional pressure?",
        "What would happen to the child if it disappeared tomorrow?",
        "Is it strong enough for the current level of risk?",
      ],
      riskOfOverstatement: "high",
    },
  ];
}

// ── Detection: relationship depth ─────────────────────────────────────────────

const STAGE_LABELS: Record<number, string> = {
  1: "Interaction — “I speak with you.”",
  2: "Cooperation — “I work with you.”",
  3: "Relational Trust — “I believe you understand me.”",
  4: "Psychological Safety — “I feel safe enough to tell the truth.”",
  5: "Transformational Alliance — “We are changing together.”",
};

function classifyRelationshipDepth(text: string, sourceType: string): RelationshipDepthResult | null {
  const t = norm(text);
  const relational = ["key worker", "key-worker", "keyworker", "relationship", "activity with", "session with", "spent time", "spoke with", "attended"];
  const isRelational = sourceType === "key_work" || sourceType === "child_voice" || has(text, relational);
  if (!isRelational) return null;

  let stage: 1 | 2 | 3 | 4 | 5 = 1;
  if (/(changing together|transformational|we are changing)/.test(t)) stage = 5;
  else if (/(feels safe to tell|told the truth|safe enough|shared difficult|opened up|able to tell me the truth)/.test(t)) stage = 4;
  else if (/(trusts|confided|believes i understand|understands me|sought (me|them) out|asked for help)/.test(t)) stage = 3;
  else if (/(worked with|cooperat|took part|participat|worked alongside|engaged in the work)/.test(t)) stage = 2;
  else stage = 1; // contact only

  const nextStep: Record<number, string> = {
    1: "Move from contact toward cooperation: find one shared activity the child chooses, and notice what they allow you to see.",
    2: "Build relational trust: be consistent and predictable so the child begins to believe you understand them.",
    3: "Grow psychological safety: show that difficult truths can be shared with you safely and without consequence.",
    4: "Sustain psychological safety and look for evidence the child's lived experience is consistently improving.",
    5: "Protect and evidence the transformational alliance; ensure it remains the child's, not procedural.",
  };

  return {
    stage,
    stageLabel: STAGE_LABELS[stage],
    evidence: "Classification is based on the relational language present in the record; contact is not assumed to be trust.",
    mainRisk: stage <= 2 ? "Confusing participation or contact with trust. The child may not yet feel safe enough to share difficult truths." : "Assuming the relationship will hold under stress without ongoing evidence.",
    nextRelationalStep: nextStep[stage],
  };
}

// ── Question generators ───────────────────────────────────────────────────────

function soWhatQuestions(): CaraQuestion[] {
  return [
    { domain: "so_what", question: "So what has actually changed for the child?" },
    { domain: "so_what", question: "What evidence shows the child is safer, less frightened, more emotionally secure, more connected, or more hopeful?" },
    { domain: "so_what", question: "Are we describing adult engagement or child impact?" },
    { domain: "so_what", question: "If every action is completed but the developmental gap is unchanged, can we honestly call this successful?" },
  ];
}

function liversQuestions(): CaraQuestion[] {
  return [
    { domain: "livers", question: "L — Lived Experience: What is it like to be this child every single day?" },
    { domain: "livers", question: "I — Immediate & Cumulative Risk: What harm is occurring now, and how is it building over time?" },
    { domain: "livers", question: "V — Viability of Change: Is change possible within the child's timeframe?" },
    { domain: "livers", question: "E — Environment & System Forces: What forces are helping or sabotaging change?" },
    { domain: "livers", question: "R — Relational & Psychological Drivers: What unmet need, trauma, attachment pattern or function may be sustaining the behaviour?" },
    // R Domain detail — behaviour is the clue, not the answer; test each driver.
    ...BEHAVIOUR_DRIVERS.map((d) => ({ domain: "livers", question: `R — ${d.name}: ${d.reflectiveQuestions[0]}` })),
    { domain: "livers", question: "S — Sustainability of Safety: Can safety continue without professional pressure, monitoring or presence?" },
    { domain: "livers", question: "Final test: Does the analysis explain the child's present, predict their future, and justify the intervention? If not, it is description, not analysis." },
  ];
}

// ── Threshold consultation ────────────────────────────────────────────────────

function buildThreshold(
  text: string,
  immediate: boolean,
  ladoRelevant: boolean,
): ThresholdConsultationResult {
  return {
    concernSummary: "Possible safeguarding threshold concern detected in the record.",
    childLivedExperience: "Describe what the child is experiencing in their own lived reality, in their words and behaviour.",
    evidenceAndHarm: "Set out the evidence of harm, what is known, and — separately — what challenges or complicates the picture.",
    immediateSafetyQuestion: "Is the child safe right now? If immediate danger is present, take emergency action first and consult afterwards.",
    strategyDiscussionRecommended: true,
    ladoConsultationRecommended: ladoRelevant,
    emergencyActionRecommended: immediate,
    managerSummary: [
      "The concerns relate to: <summarise the concern>",
      "The child is currently experiencing: <lived experience>",
      "Evidence supporting this includes: <evidence>",
      "Evidence that challenges or complicates this includes: <counter-evidence / what is unknown>",
      "The trajectory appears: <escalating / static / improving>",
      "Current intervention is / is not sufficient because: <rationale>",
      "The immediate risk if we do not escalate is: <risk>",
      "The most proportionate next step is: <next step>",
      "I believe the threshold for a strategy discussion is / is not met because: <manager judgement — Cara does not decide this>",
    ].join("\n"),
  };
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function score(
  text: string,
  flags: CaraFlag[],
  gaps: DevelopmentalGapResult[],
  protective: ProtectiveFactorResult[],
  relationship: RelationshipDepthResult | null,
  hasSafeguarding: boolean,
  immediate: boolean,
  hasWellbeing: boolean,
): CaraPracticeScores {
  const weakActivity = has(text, WEAK_ACTIVITY);
  const childImpact = has(text, CHILD_IMPACT);

  const livedExperience = childImpact ? (weakActivity ? 70 : 90) : weakActivity ? 35 : 60;
  const developmentalGap = gaps.length === 0 ? 100 : clamp(100 - gaps.length * 22, 20);
  const protectiveFactors = protective.length === 0 ? 100 : 45;
  const relationshipDepth = relationship ? clamp(relationship.stage * 18 + 10) : 60;
  const safeguardingThreshold = !hasSafeguarding ? 100 : immediate ? 20 : 45;
  const staffWellbeing = hasWellbeing ? 45 : 100;

  let overall = clamp(
    (livedExperience + developmentalGap + protectiveFactors + relationshipDepth + safeguardingThreshold + staffWellbeing) / 6,
  );
  if (flags.some((f) => f.severity === "critical")) overall = Math.min(overall, 40);
  else if (flags.some((f) => f.severity === "high")) overall = Math.min(overall, 55);

  return {
    developmentalGap,
    livedExperience,
    protectiveFactors,
    relationshipDepth,
    safeguardingThreshold,
    staffWellbeing,
    overall,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ENGINE
// ══════════════════════════════════════════════════════════════════════════════

export function analyzePractice(input: CaraPracticeInput): CaraPracticeOutput {
  const text = input.text ?? "";
  const flags: CaraFlag[] = [];
  const questions: CaraQuestion[] = [];
  const recommendations: CaraRecommendation[] = [];
  const nextBestActions: string[] = [];
  const modes = new Set<CaraPracticeOutput["mode"][number]>();
  modes.add("advises");

  const weakActivityHits = matches(text, WEAK_ACTIVITY);
  const childImpact = has(text, CHILD_IMPACT);
  const gaps = detectDevelopmentalGaps(text);
  const protective = detectProtectiveFactors(text);
  const relationship = classifyRelationshipDepth(text, input.sourceType);

  const safeguardingHits = matches(text, SAFEGUARDING_RISK);
  const immediate = has(text, IMMEDIATE_DANGER);
  const ladoHits = matches(text, LADO_CUES);
  const wellbeingHits = matches(text, WELLBEING_CUES);
  const hasSafeguarding = safeguardingHits.length > 0;

  // 1. Activity-over-impact / vague recording
  if (weakActivityHits.length > 0 && !childImpact) {
    modes.add("recognises");
    flags.push({
      flagType: "activity_over_impact",
      severity: "medium",
      title: "Activity recorded, but child impact not yet evidenced",
      description:
        "The record shows that activity took place, but it does not yet evidence what changed in the child's lived experience.",
      evidence: weakActivityHits,
      recommendedAction: "Add what the child said, showed, felt or experienced, and what is now different for the child.",
      requiresManagerReview: false,
      requiresRiReview: false,
    });
    flags.push({
      flagType: "vague_recording",
      severity: "medium",
      title: "Vague recording — limited child-centred detail",
      description:
        "Reassurance language (e.g. “engaged well”, “no concerns”, “settled”) is used without evidence of impact or the child's voice.",
      evidence: weakActivityHits,
      recommendedAction: "Replace reassurance with specifics: what happened, what the child experienced, and what changed.",
      requiresManagerReview: false,
      requiresRiReview: false,
    });
    questions.push(...soWhatQuestions());
    recommendations.push({
      title: "Strengthen child impact",
      detail: "Rewrite to evidence what became different for the child, not only what staff did.",
      urgency: "soon",
    });
    nextBestActions.push("Add a sentence answering: “What is now different for the child?”");
  } else if (weakActivityHits.length > 0) {
    questions.push(...soWhatQuestions().slice(0, 2));
  }

  // 2. Developmental gaps
  if (gaps.length > 0) {
    modes.add("recognises");
    flags.push({
      flagType: "developmental_gap",
      severity: gaps.some((g) => g.severity === "high") ? "high" : "medium",
      title: `Developmental gap detected (${gaps.map((g) => g.domain).join(", ")})`,
      description:
        "The record describes domains of childhood that are missing or insufficient. Need is the distance between the childhood the child is living and the one they reasonably require.",
      evidence: gaps.map((g) => g.domain),
      recommendedAction: "Add owned plan actions that close each gap, and define what will be different for the child if they succeed.",
      requiresManagerReview: gaps.some((g) => g.severity === "high"),
      requiresRiReview: false,
    });
    questions.push(
      { domain: "developmental_gap", question: "What should reasonably be present in this child's life that is currently absent?" },
      { domain: "developmental_gap", question: "What is the impact of that gap, and what action would close it?" },
      { domain: "developmental_gap", question: "If this plan succeeds, what will become different for the child?" },
    );
    recommendations.push({
      title: "Plan to close the developmental gap",
      detail: `Create plan actions targeting: ${gaps.map((g) => g.domain).join(", ")}.`,
      urgency: "soon",
    });
    nextBestActions.push(`Add a plan action for each missing domain: ${gaps.map((g) => g.domain).join(", ")}.`);
  }

  // 3. Overstated protective factors
  if (protective.length > 0) {
    modes.add("recognises");
    flags.push({
      flagType: "overstated_protective_factor",
      severity: "medium",
      title: "Possible overstated protective factor",
      description:
        "This may be a protective factor, but it needs strengthening. The record should explain what harm it reduces, how reliable it is, and whether it works without professional pressure.",
      evidence: protective[0].factorDescription.split("; "),
      recommendedAction: "Rewrite the factor to evidence what it protects from, its reliability under stress, and its strength for the current risk.",
      requiresManagerReview: false,
      requiresRiReview: false,
    });
    questions.push(...protective[0].questions.map((q) => ({ domain: "protective_factor", question: q })));
    recommendations.push({
      title: "Rewrite the protective factor",
      detail: "Use Cara's protective-factor rewrite to test reliability, proximity, strength and durability.",
      urgency: "planned",
    });
  }

  // 4. Safeguarding threshold
  let threshold: ThresholdConsultationResult | null = null;
  if (hasSafeguarding) {
    modes.add("recognises");
    const sev: CaraSeverity = immediate ? "critical" : "high";
    threshold = buildThreshold(text, immediate, ladoHits.length > 0);
    flags.push({
      flagType: "safeguarding_threshold",
      severity: sev,
      title: immediate ? "Possible immediate safeguarding risk" : "Possible safeguarding threshold concern",
      description:
        "The record contains disclosure or harm language that may meet a safeguarding threshold. Cara advises a manager review and a structured threshold consultation. Cara does not make the statutory decision.",
      evidence: safeguardingHits,
      recommendedAction: immediate
        ? "Ensure the child is safe NOW — take emergency action first, then consult. Manager to lead a threshold consultation and consider a strategy discussion."
        : "Manager to complete a threshold consultation and consider whether a strategy discussion is required.",
      requiresManagerReview: true,
      requiresRiReview: immediate,
    });
    if (immediate) {
      flags.push({
        flagType: "immediate_safety",
        severity: "critical",
        title: "Immediate safety — act first",
        description: "Immediate-danger language is present. Do not delay protective action pending consultation.",
        evidence: matches(text, IMMEDIATE_DANGER),
        recommendedAction: "Take immediate action to make the child safe, then escalate to the manager/RI and external agencies as required.",
        requiresManagerReview: true,
        requiresRiReview: true,
      });
      nextBestActions.unshift("Confirm the child is safe right now before anything else.");
    }
    questions.push(
      { domain: "threshold", question: threshold.immediateSafetyQuestion },
      { domain: "threshold", question: "What is the evidence of harm, and what challenges or complicates it?" },
      { domain: "threshold", question: "Is the threshold for a strategy discussion met? (Manager decision — Cara advises only.)" },
    );
    recommendations.push({
      title: "Manager threshold consultation",
      detail: "Use Cara's threshold tool to structure the consultation; consider a strategy discussion.",
      urgency: immediate ? "immediate" : "soon",
    });
  }

  // 4b. Extra-familial harm / contextual safeguarding
  // Spot markers that the harm may sit in a context beyond the home (peer group,
  // school, neighbourhood, transport, online). Advises the contextual lens — it
  // never criminalises the child or blames the parents for an extra-familial risk.
  const efhSigns = efhSignSpotting(text);
  if (efhSigns.length > 0) {
    modes.add("recognises");
    flags.push({
      flagType: "extra_familial_harm",
      severity: "high",
      title: "Possible extra-familial harm — apply the contextual-safeguarding lens",
      description:
        "The record mentions risks that may sit in a context beyond the home (" +
        efhSigns.map((s) => s.context.toLowerCase()).join(", ") +
        "). Contextual safeguarding asks us to assess and disrupt the context — not to reduce the harm to the child's choice or the parents' care. Survival strategies inside an unsafe context are constrained choices to understand, never grounds to criminalise. Cara advises; the manager decides on screening or referral.",
      evidence: efhSigns.map((s) => `${s.context}: "${s.cue}"`),
      recommendedAction:
        "Record where the harm is happening (locations, peers, online), consider exploitation screening, and whether the manager should make a contextual or multi-agency referral. Keep child-level data out of any context-sharing with non-traditional partners.",
      requiresManagerReview: true,
      requiresRiReview: false,
    });
    questions.push(...efhSigns.map((s) => ({ domain: "contextual_safeguarding", question: `${s.context}: ${s.reflection}` })));
    recommendations.push({
      title: "Apply the contextual-safeguarding lens",
      detail: "Map the context(s) of harm, consider exploitation screening, and treat survival strategies as safeguarding concerns, not offences.",
      urgency: "soon",
    });
    // Safety planning — co-create (never impose) a plan covering the relevant
    // components for these context(s). Advice only; the young person decides.
    const planComponents = suggestSafetyPlanComponents(efhSigns.map((s) => s.key));
    if (planComponents.length > 0) {
      recommendations.push({
        title: "Co-create an extra-familial safety plan with the young person",
        detail:
          "With the young person (not done to them), build a safety plan across the relevant typologies of safety. Relevant components include: " +
          planComponents.slice(0, 6).map((c) => c.text.replace(/\.$/, "")).join("; ") +
          ". Plan for the trauma response in the moment, review regularly, and keep it the young person's — never a way of surveilling them.",
        urgency: "soon",
      });
    }
  }

  // 4c. Modern slavery / NRM consideration (advice only — never a decision)
  // A child who is exploited is a victim, not an offender; for a child no consent
  // is needed to refer and the 'means' need not be proven. Cara ADVISES the
  // manager / DSL to CONSIDER an NRM referral — it never states one is required.
  const nrm = assessNRMIndicators(text);
  if (nrm.adviseConsiderReferral) {
    modes.add("recognises");
    flags.push({
      flagType: "nrm_consideration",
      severity: "high",
      title: "Consider a National Referral Mechanism (NRM) referral",
      description: `${nrm.rationale} ${nrm.advice}`,
      evidence: nrm.indicators.map((i) => `${i.label}: "${i.cue}"`),
      recommendedAction:
        "Manager / DSL to consider an NRM referral for suspected modern slavery or trafficking, alongside the usual safeguarding referrals — Cara advises, the manager decides. Recognise the child as a victim (Section 45 defence may apply) and guard against adultification bias.",
      requiresManagerReview: true,
      requiresRiReview: false,
    });
    recommendations.push({
      title: "Consider an NRM referral (manager / DSL decision)",
      detail: nrm.advice,
      urgency: "soon",
    });
  }

  // 5. LADO consideration (adult conduct toward children)
  if (ladoHits.length > 0) {
    modes.add("recognises");
    flags.push({
      flagType: "lado_consideration",
      severity: "high",
      title: "Possible LADO consultation required",
      description:
        "The record may describe a concern about an adult who works with or cares for children. Cara advises a manager/RI review and consideration of a LADO consultation. Cara never decides the outcome.",
      evidence: ladoHits,
      recommendedAction:
        "Put the child's welfare first. Consider a LADO consultation, avoid a premature internal investigation, record the rationale, and notify the appropriate manager/RI.",
      requiresManagerReview: true,
      requiresRiReview: true,
    });
    questions.push(
      { domain: "lado", question: "Does this concern relate to an adult's conduct toward a child? If so, consider a LADO consultation before any internal investigation." },
      { domain: "lado", question: "What immediate steps protect the child's welfare now?" },
    );
    recommendations.push({
      title: "Consider LADO consultation",
      detail: "Notify the registered manager / responsible individual and consider contacting the LADO. Child welfare first.",
      urgency: "immediate",
    });
  }

  // 6. Staff wellbeing (support-focused, never punitive)
  if (wellbeingHits.length > 0) {
    modes.add("recognises");
    flags.push({
      flagType: "staff_wellbeing",
      severity: "medium",
      title: "Staff wellbeing signal — offer support",
      description:
        "Wellbeing signals are present. These are support indicators, not disciplinary evidence. They must be interpreted non-punitively and reviewed by a manager with care.",
      evidence: wellbeingHits,
      recommendedAction: "Offer reflective supervision and a wellbeing check-in; review workload and rota; agree supportive next steps.",
      requiresManagerReview: true,
      requiresRiReview: false,
    });
    questions.push(
      { domain: "reflective", question: "What has felt professionally difficult or emotionally heavy recently?" },
      { domain: "reflective", question: "What support would help, and how might wellbeing be affecting practice?" },
    );
    recommendations.push({
      title: "Reflective supervision & wellbeing support",
      detail: "Arrange reflective supervision and a non-punitive wellbeing check-in; review workload.",
      urgency: "soon",
    });
    nextBestActions.push("Offer a supportive, non-punitive wellbeing conversation and reflective supervision.");
  }

  // 7. Relationship depth (do not confuse contact with trust)
  if (relationship) {
    modes.add("recognises");
    if (relationship.stage <= 2) {
      flags.push({
        flagType: "relationship_depth",
        severity: "low",
        title: `Relationship at ${relationship.stageLabel.split(" —")[0]} stage`,
        description:
          "The record describes contact or cooperation. Cara does not assume this is trust. Evidence of emotional safety is not yet clear.",
        evidence: [relationship.stageLabel],
        recommendedAction: relationship.nextRelationalStep,
        requiresManagerReview: false,
        requiresRiReview: false,
      });
    }
    questions.push(
      { domain: "relationship", question: "Is this relationship emotionally meaningful or mainly procedural?" },
      { domain: "relationship", question: "What does the child currently allow this adult to see, and can difficult truths be shared safely?" },
      { domain: "relationship", question: "What evidence shows the child feels emotionally safe with this adult?" },
    );
  }

  // 7b. Adult-centred drift — the child-centred supervision warning sign
  // ("most of the discussion is about adults"). Advisory and reflective: it
  // invites the child's lived experience back to the centre, never asserts a
  // failing. Length-gated so terse notes aren't mistaken for adult-centred analysis.
  const adultFocusHits = matches(text, ADULT_FOCUS);
  if (adultFocusHits.length >= 3 && !childImpact && text.length > 120) {
    modes.add("recognises");
    flags.push({
      flagType: "adult_centred_drift",
      severity: "medium",
      title: "Possible adult-centred drift — the child's lived experience is hard to see",
      description:
        "This record refers mainly to adults, professionals and process; the child's own experience, voice and impact are not yet visible. Child-centred practice asks what life is currently like for this child.",
      evidence: adultFocusHits,
      recommendedAction:
        "Bring the child to the centre: what they said, showed or felt, and how the intervention changed their day-to-day reality.",
      requiresManagerReview: false,
      requiresRiReview: false,
    });
    questions.push(
      { domain: "child_centred", question: "Would the child recognise themselves within this record — or is most of it about adults?" },
      { domain: "child_centred", question: "What is life currently like for this child, in their own words and behaviour?" },
      { domain: "child_centred", question: "Are we describing what adults are doing more than what the child is experiencing?" },
    );
    recommendations.push({
      title: "Return the child to the centre",
      detail: "Re-anchor the record in the child's lived experience, voice, and the impact of intervention on their daily reality.",
      urgency: "soon",
    });
    nextBestActions.push("Add a line evidencing the child's lived experience and voice, not only adult activity.");
  }

  // 8. L.I.V.E.R.S. — for analysis mode or complex inputs
  const complex =
    input.assessmentType === "livers_analysis" ||
    text.length > 280 ||
    [hasSafeguarding, gaps.length > 0, protective.length > 0, ladoHits.length > 0].filter(Boolean).length >= 2;
  if (complex) {
    questions.push(...liversQuestions());
    recommendations.push({
      title: "Complete a L.I.V.E.R.S. analysis",
      detail:
        "Move from description to analysis: explain the child's present, predict their future, and justify the intervention.",
      urgency: "soon",
    });
    nextBestActions.push("Draft a L.I.V.E.R.S. analysis and a final formulation for this case.");
  }

  // If nothing recognised, Cara still advises a reflective improvement prompt.
  if (flags.length === 0) {
    questions.push({
      domain: "reflective",
      question: "What has become different for the child as a result of this work?",
    });
  }

  const scores = score(text, flags, gaps, protective, relationship, hasSafeguarding, immediate, wellbeingHits.length > 0);

  let highest: CaraSeverity = "low";
  for (const f of flags) highest = maxSeverity(highest, f.severity);

  const requiresManagerReview = flags.some((f) => f.requiresManagerReview);
  const requiresRiReview = flags.some((f) => f.requiresRiReview);

  const summary = buildSummary(flags, scores, immediate);

  return {
    mode: Array.from(modes),
    summary,
    scores,
    flags,
    questions,
    recommendations,
    nextBestActions,
    developmentalGaps: gaps,
    protectiveFactors: protective,
    relationshipDepth: relationship,
    threshold,
    requiresManagerReview,
    requiresRiReview,
    highestSeverity: highest,
  };
}

function buildSummary(flags: CaraFlag[], scores: CaraPracticeScores, immediate: boolean): string {
  if (immediate) {
    return "Cara has detected possible immediate danger. Make the child safe now, then consult. Cara advises; the manager decides.";
  }
  if (flags.length === 0) {
    return `No practice concerns detected. Overall practice-quality score ${scores.overall}. Cara still asks: what has become different for the child?`;
  }
  const parts = flags.map((f) => f.title.toLowerCase());
  return `Cara recognised ${flags.length} practice signal(s): ${parts.join("; ")}. Overall practice-quality score ${scores.overall}. Cara advises — the manager decides, and the child's lived experience remains the measure of quality.`;
}

// ══════════════════════════════════════════════════════════════════════════════
// SEED GUIDANCE RULES
// ══════════════════════════════════════════════════════════════════════════════

export const CARA_GUIDANCE_RULES: Omit<CaraGuidanceRule, "id" | "created_at">[] = [
  {
    rule_key: "dev_gap_missing_child_impact",
    title: "Developmental gap / missing child impact",
    domain: "developmental_gap",
    trigger_conditions: { anyOf: ["lacks", "without", "missing", "no concerns", "completed"], note: "Activity recorded but the developmental gap or child impact is not evidenced." },
    advice: "Need is the distance between the childhood the child is living and the one they reasonably require. Evidence what is missing and what would close it.",
    challenge_questions: ["What should reasonably be present that is currently absent?", "If this succeeds, what will be different for the child?"],
    recommended_actions: ["Add owned plan actions per missing domain", "Define the difference for the child"],
    severity: "medium",
    active: true,
  },
  {
    rule_key: "protective_factor_overstated",
    title: "Overstated protective factor",
    domain: "protective_factor",
    trigger_conditions: { anyOf: ["attends meetings", "engages with professionals", "family support", "completed course"] },
    advice: "A factor is only protective if it reduces harm, is reliable, is close to the child, and holds under stress.",
    challenge_questions: ["What does this protect the child from?", "Would it hold if it disappeared tomorrow?"],
    recommended_actions: ["Rewrite using the protective-factor model"],
    severity: "medium",
    active: true,
  },
  {
    rule_key: "so_what_professional_drift",
    title: "So What — professional drift / compliance over impact",
    domain: "impact",
    trigger_conditions: { anyOf: ["meeting held", "review completed", "engaged well", "no concerns", "compliant", "settled"] },
    advice: "Describe child impact, not only adult engagement.",
    challenge_questions: ["So what has changed for the child?", "Are we describing adult engagement or child impact?"],
    recommended_actions: ["Add evidence of impact and child voice"],
    severity: "medium",
    active: true,
  },
  {
    rule_key: "lado_consultation_prompt",
    title: "LADO consultation prompt",
    domain: "lado",
    trigger_conditions: { anyOf: ["staff member", "inappropriate contact", "allegation against staff", "professional boundary", "carer allegation"] },
    advice: "Where an adult's conduct toward a child may meet threshold, consider a LADO consultation. Cara never decides the outcome.",
    challenge_questions: ["Does this relate to an adult's conduct toward a child?", "What protects the child's welfare now?"],
    recommended_actions: ["Consider LADO consultation", "Notify manager/RI", "Record rationale"],
    severity: "high",
    active: true,
  },
  {
    rule_key: "safeguarding_threshold_prompt",
    title: "Safeguarding threshold prompt",
    domain: "safeguarding",
    trigger_conditions: { anyOf: ["disclosed", "hit by", "scared to return", "abuse", "harmed by"] },
    advice: "Support a structured threshold consultation. Cara advises a manager review and does not make the statutory decision.",
    challenge_questions: ["Is the child safe now?", "Is the threshold for a strategy discussion met?"],
    recommended_actions: ["Manager threshold consultation", "Consider strategy discussion"],
    severity: "high",
    active: true,
  },
  {
    rule_key: "staff_wellbeing_signal",
    title: "Staff burnout / wellbeing signal",
    domain: "wellbeing",
    trigger_conditions: { anyOf: ["exhausted", "overwhelmed", "drained", "unable to sleep", "cannot cope", "burnout"] },
    advice: "Treat wellbeing signals as support indicators, never as disciplinary evidence. Interpret non-punitively.",
    challenge_questions: ["What support would help?", "How might wellbeing be affecting practice?"],
    recommended_actions: ["Reflective supervision", "Wellbeing check-in", "Workload/rota review"],
    severity: "medium",
    active: true,
  },
  {
    rule_key: "relationship_depth_not_evidenced",
    title: "Relationship depth not evidenced",
    domain: "relationship",
    trigger_conditions: { anyOf: ["attended", "activity with", "spoke with", "session with"] },
    advice: "Do not confuse contact with trust. Classify relationship depth and evidence emotional safety.",
    challenge_questions: ["Is this procedural or emotionally meaningful?", "Can difficult truths be shared safely?"],
    recommended_actions: ["Record what the child allows the adult to see", "Plan the next relational step"],
    severity: "low",
    active: true,
  },
  {
    rule_key: "livers_analysis_required",
    title: "L.I.V.E.R.S. analysis required",
    domain: "analysis",
    trigger_conditions: { note: "Complex case or multiple risk signals — move from description to analysis." },
    advice: "Explain the child's present, predict their future, and justify the intervention.",
    challenge_questions: ["What is it like to be this child every day?", "Can safety continue without professional presence?"],
    recommended_actions: ["Complete a L.I.V.E.R.S. analysis and final formulation"],
    severity: "medium",
    active: true,
  },
  {
    rule_key: "child_centred_assessment_weak",
    title: "Child-centred assessment weak",
    domain: "assessment_quality",
    trigger_conditions: { anyOf: ["child is manipulative", "child refused", "non-compliant child", "child failed"] },
    advice: "Never blame the child for adult harm. Place responsibility for adult behaviour with adults and systems.",
    challenge_questions: ["Would the child feel safer, understood and seen if they read this?", "Is the child's voice evidenced?"],
    recommended_actions: ["Rewrite to be non-blaming and child-centred"],
    severity: "medium",
    active: true,
  },
  {
    rule_key: "normalised_risk_culture_drift",
    title: "Normalised risk / culture drift",
    domain: "culture",
    trigger_conditions: { anyOf: ["as usual", "nothing new", "same as before", "no concerns", "routine incident"] },
    advice: "Watch for risk becoming normalised and recording replacing relationships.",
    challenge_questions: ["Is risk being normalised?", "Are children becoming less visible as paperwork becomes more visible?"],
    recommended_actions: ["Re-examine repeated high-risk incidents", "Refocus on the child's lived experience"],
    severity: "medium",
    active: true,
  },
];
