// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA RECORDING ASSISTANT ENGINE (pure / deterministic)
//
// The spec's analyseRecordingQuality(rawText): detects judgemental language and
// missing elements (context, child's voice, staff response, de-escalation,
// manager notification, learning, next steps), and derives guidance + follow-up
// actions — all deterministic and explainable. The LLM (route-side) only DRAFTS
// a rewrite for staff to accept, edit or reject; this analysis stands on its own
// without any AI key.
// ══════════════════════════════════════════════════════════════════════════════

import { scoreProfessionalLanguage } from "@/lib/recording-quality/recording-quality-engine";

export const RECORDING_DISCLAIMER =
  "ARIA improves clarity — it never invents facts. The original note is always preserved alongside the AI suggestion and your final version, and records needing oversight go to the manager.";

export const RECORD_TYPES: { key: string; label: string }[] = [
  { key: "daily_log", label: "Daily log" },
  { key: "incident_report", label: "Incident report" },
  { key: "missing_from_home", label: "Missing from home" },
  { key: "physical_intervention", label: "Physical intervention" },
  { key: "key_work", label: "Key work" },
  { key: "restorative_conversation", label: "Restorative conversation" },
  { key: "child_debrief", label: "Child debrief" },
  { key: "staff_debrief", label: "Staff debrief" },
  { key: "manager_review", label: "Manager review" },
  { key: "safeguarding_update", label: "Safeguarding update" },
  { key: "risk_assessment_update", label: "Risk assessment update" },
  { key: "handover", label: "Handover" },
  { key: "other", label: "Other" },
];

// the spec's poor-recording vocabulary (phrase → why it's challenged)
const JUDGEMENTAL: { re: RegExp; phrase: string }[] = [
  { re: /\bkicked off\b/i, phrase: "kicked off" },
  { re: /\battention[\s-]?seeking\b/i, phrase: "attention seeking" },
  { re: /\bmanipulat\w*/i, phrase: "manipulative" },
  { re: /\bnaughty\b/i, phrase: "naughty" },
  { re: /\brefused to listen\b/i, phrase: "refused to listen" },
  { re: /\bbad behaviou?r\b/i, phrase: "bad behaviour" },
  { re: /\bchose to behave badly\b/i, phrase: "chose to behave badly" },
  { re: /\blying\b|\bliar\b/i, phrase: "lying" },
  { re: /\bdramatic\b/i, phrase: "dramatic" },
  { re: /\brude\b/i, phrase: "rude" },
  { re: /\bdefiant\b/i, phrase: "defiant" },
  { re: /\bdifficult\b/i, phrase: "difficult" },
  { re: /\bchallenging behaviou?r\b/i, phrase: "challenging behaviour (without context)" },
  { re: /\baggressive\b(?![^.]*\b(described|observed|specifically|towards)\b)/i, phrase: "aggressive (without description)" },
];

const HAS = {
  context: /\b(after|before|following|during|when|because|earlier|that (morning|afternoon|evening)|trigger)\b/i,
  child_voice: /\b(said|stated|told|asked|expressed|shared|child'?s voice|described feeling)\b/i,
  staff_response: /\b(staff|I|we)\s+(offered|supported|gave|reduced|responded|reassur\w*|remained|stayed|listened|checked)\b/i,
  deescalation: /\b(space|reassur\w*|calm\w*|reduced demands?|de-?escalat\w*|distract\w*|choices?|breathing|quiet)\b/i,
  manager: /\b(manager|on-?call|duty manager|notified|informed senior)\b/i,
  learning: /\b(learn\w*|next time|review\w*|pattern|reflect\w*|consider\w*)\b/i,
  next_steps: /\b(will|follow[- ]?up|planned?|next step|arrange\w*|book\w*)\b/i,
};

export interface RecordingQualityAnalysis {
  judgemental_language_detected: string[];
  missing_context: boolean;
  missing_child_voice: boolean;
  missing_staff_response: boolean;
  missing_deescalation: boolean;
  missing_manager_notification: boolean;
  missing_learning: boolean;
  missing_next_steps: boolean;
  professional_language_score: number;     // 0–100, shared scorer
  flags: string[];                          // human labels of everything raised
  guidance: string[];                       // what to add / how to reframe
  recommended_follow_up_actions: string[];
}

export function analyseRecordingQuality(rawText: string): RecordingQualityAnalysis {
  const text = String(rawText ?? "");
  const judgemental = JUDGEMENTAL.filter((j) => j.re.test(text)).map((j) => j.phrase);

  const missing_context = !HAS.context.test(text);
  const missing_child_voice = !HAS.child_voice.test(text);
  const missing_staff_response = !HAS.staff_response.test(text);
  const missing_deescalation = !HAS.deescalation.test(text);
  const missing_manager_notification = !HAS.manager.test(text);
  const missing_learning = !HAS.learning.test(text);
  const missing_next_steps = !HAS.next_steps.test(text);

  const flags: string[] = [];
  const guidance: string[] = [];
  const follow: string[] = [];

  if (judgemental.length) {
    flags.push(`Judgemental language: ${judgemental.join(", ")}`);
    guidance.push("Replace labels with a factual description — what was seen and heard, what the child may have been feeling or needing, and how staff responded.");
    follow.push("Rewrite using factual, non-blaming language before saving.");
  }
  if (missing_context) { flags.push("Context / trigger not described"); guidance.push("Add what was happening before — the context or possible trigger."); }
  if (missing_child_voice) { flags.push("Child's voice missing"); guidance.push("Add what the child said or how they described their feelings — or record that they declined and how this was respected."); follow.push("Capture the child's voice when they are settled."); }
  if (missing_staff_response) { flags.push("Staff response missing"); guidance.push("Describe what staff offered, did and how they supported."); }
  if (missing_deescalation) { flags.push("De-escalation not evidenced"); guidance.push("Record the calm, supportive steps taken (space, reassurance, reduced demands)."); }
  if (missing_manager_notification) { flags.push("Manager notification not mentioned"); guidance.push("Record whether the manager was informed — or why notification was not needed."); follow.push("Consider whether the manager should be notified."); }
  if (missing_learning) { flags.push("Reflection / learning missing"); guidance.push("Add what this might be communicating and any pattern worth noticing."); }
  if (missing_next_steps) { flags.push("Next steps missing"); guidance.push("Add the follow-up: restorative conversation, key-work session, or plan update."); follow.push("Identify the follow-up action and owner."); }

  return {
    judgemental_language_detected: judgemental,
    missing_context, missing_child_voice, missing_staff_response, missing_deescalation,
    missing_manager_notification, missing_learning, missing_next_steps,
    professional_language_score: scoreProfessionalLanguage(text),
    flags,
    guidance,
    recommended_follow_up_actions: [...new Set(follow)],
  };
}
