// ══════════════════════════════════════════════════════════════════════════════
// CARA — PROHIBITED REQUEST CLASSIFIER (§5)
//
// Ask CARA is a support engine, not a decision-maker. Some requests must be
// refused or escalated: deciding safeguarding, diagnosing, minimising concerns,
// protecting reputation, fabricating evidence, manipulating a child's account,
// definitive legal advice. This pure classifier detects those asks and returns a
// safe response — what CARA cannot do, what it CAN help with, and the route to a
// workflow + manager oversight.
//
// Patterns are phrase-specific (word-boundary via mentionsAny) so that ordinary
// information questions ("any safeguarding concerns?", "tell me about the
// restraints") are NEVER caught — only asks that want CARA to decide/hide/invent.
// ══════════════════════════════════════════════════════════════════════════════

import { mentionsAny } from "@/lib/text/keyword-match";

export const PROHIBITED_CLASSIFIER_VERSION = "1.0.0";

export type ProhibitedCategory =
  | "decide_safeguarding"
  | "diagnose"
  | "predict_certainty"
  | "minimise_safeguarding"
  | "protect_reputation"
  | "fabricate_evidence"
  | "manipulate_child"
  | "definitive_legal_advice"
  | "decide_notification";

interface ProhibitedRule {
  category: ProhibitedCategory;
  patterns: string[];
  cannot: string;
  can: string;
  route: string;
}

// Order matters — first match wins; most safety-critical first.
const RULES: ProhibitedRule[] = [
  {
    category: "decide_safeguarding",
    patterns: ["did abuse happen", "did abuse occur", "was there abuse", "is the allegation true", "is this allegation true", "the allegation is true", "allegation is true", "decide whether abuse", "decide whether the allegation", "decide if the allegation", "whether the allegation is true", "prove the allegation", "safe to return home", "should the placement end", "should we end the placement", "is the child lying", "is he lying", "is she lying"],
    cannot: "decide whether abuse or an allegation is true, or whether a placement should end",
    can: "help you record exactly what was seen, heard, said, disclosed and done, and check the record is complete",
    route: "Please follow the safeguarding workflow and seek management oversight — the decision rests with the safeguarding lead and relevant professionals.",
  },
  {
    category: "diagnose",
    patterns: ["diagnose", "does the child have autism", "does he have autism", "does she have autism", "is he autistic", "is she autistic", "has attachment disorder", "diagnose trauma", "give a diagnosis", "what condition does", "does the child have adhd", "mental health diagnosis"],
    cannot: "diagnose autism, ADHD, attachment, trauma, mental illness or any condition",
    can: "help you record what you observed and the child's presentation in factual, non-labelling language, and point to any existing assessment on record",
    route: "A diagnosis can only come from a qualified clinician. Consider a referral through the health/CAMHS route with manager oversight.",
  },
  {
    category: "predict_certainty",
    patterns: ["will definitely abscond", "will definitely offend", "guaranteed to abscond", "certain to self-harm", "will reoffend for certain", "will definitely go missing", "definitely going to"],
    cannot: "predict as a certainty that a child will abscond, offend, self-harm or come to harm",
    can: "summarise the patterns actually on record (frequency, triggers, timing) so you can assess risk professionally",
    route: "Risk is a professional judgement informed by the risk assessment and the child's plan — CARA surfaces the evidence, it does not predict.",
  },
  {
    category: "minimise_safeguarding",
    patterns: ["less serious", "downplay", "play it down", "play this down", "soften the concern", "soften this", "minimise the concern", "make the safeguarding less", "water it down", "not sound so bad", "make it sound better than"],
    cannot: "make a concern sound less serious than the evidence shows",
    can: "help you record the concern clearly, factually and proportionately — neither exaggerated nor minimised",
    route: "If you're unsure how serious something is, that's exactly what management oversight and the safeguarding workflow are for.",
  },
  {
    category: "protect_reputation",
    patterns: ["make staff look", "make the staff look", "make us look better", "make me look better", "protect the home's reputation", "protect our reputation", "hide poor practice", "cover up", "make the home look good", "hide the mistake"],
    cannot: "shape a record to protect staff, the home's reputation, or hide poor practice",
    can: "help you write an honest, factual, child-centred account — which is what actually protects children and stands up to scrutiny",
    route: "Honest recording, followed by management oversight and learning, is the safe route. Speak with your manager if you have a concern about practice.",
  },
  {
    category: "fabricate_evidence",
    patterns: ["make up", "fabricate", "invent oversight", "invent management oversight", "write false", "false evidence", "backdate", "pretend it happened", "create a fake", "fill in the gaps for me", "invent a chronology"],
    cannot: "invent facts, oversight, chronology or evidence, or backdate a record",
    can: "build a chronology or summary from the records that actually exist, and clearly flag where evidence is missing",
    route: "If a record is missing, the honest step is to record it now with the correct date and note the delay — CARA will never fabricate.",
  },
  {
    category: "manipulate_child",
    patterns: ["manipulate the child", "change what the child said", "rewrite the child's account", "change the child's account", "change the child's words", "make the child say", "get the child to say"],
    cannot: "change, manipulate or rewrite a child's own account or words",
    can: "help you capture the child's voice accurately in their own words, and phrase your own account around it",
    route: "The child's account must be preserved as given. Record it faithfully and seek advice through the safeguarding route if needed.",
  },
  {
    category: "definitive_legal_advice",
    patterns: ["is this legal", "is it lawful", "give me legal advice", "legal advice", "am i legally allowed", "what does the law say i must"],
    cannot: "give definitive legal advice",
    can: "point you to the relevant policy and regulation on record, and help you frame the question for a manager or legal advisor",
    route: "For a legal question, check the approved policy and escalate to your manager or the organisation's legal/advice route.",
  },
  {
    category: "decide_notification",
    patterns: ["should i notify ofsted", "should we notify ofsted", "do i have to notify ofsted", "should i call the police", "should we tell the police", "should i tell the la", "do we need to notify"],
    cannot: "decide on your behalf whether to notify Ofsted, the police or the placing authority",
    can: "show you what the notification workflow and policy say, and help you record the facts a manager needs to make that decision",
    route: "Whether to notify is a decision for the manager/registered manager through the notification workflow — CARA prepares the evidence for it.",
  },
];

export interface ProhibitedResult {
  prohibited: boolean;
  category?: ProhibitedCategory;
  safeResponse?: string;
  version: string;
}

function safeResponse(rule: ProhibitedRule): string {
  return `CARA can't ${rule.cannot}. What CARA can do: ${rule.can}.\n\n${rule.route}`;
}

/** Detect an unsafe/prohibited ask. Returns prohibited:false for ordinary
 *  information questions. */
export function classifyProhibited(text: string): ProhibitedResult {
  const q = (text ?? "").toLowerCase();
  for (const rule of RULES) {
    if (mentionsAny(q, rule.patterns)) {
      return { prohibited: true, category: rule.category, safeResponse: safeResponse(rule), version: PROHIBITED_CLASSIFIER_VERSION };
    }
  }
  return { prohibited: false, version: PROHIBITED_CLASSIFIER_VERSION };
}
