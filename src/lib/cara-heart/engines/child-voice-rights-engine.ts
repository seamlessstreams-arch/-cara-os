// ══════════════════════════════════════════════════════════════════════════════
// CARA HEART — ChildVoiceRightsEngine (pure / deterministic)
//
// Checks whether the child's voice, rights, dignity, communication needs and
// participation are visible in the record. Prompts staff to make the child's
// perspective central, not incidental.
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CaraPracticeRecord,
  ChildVoiceRightsReview,
  IntelligenceAuditEntry,
} from "../types";

const ENGINE = "ChildVoiceRightsEngine";

// A "right considered" marker must be a real, AFFIRMED mention — not negated.
// Otherwise a record describing a rights BREACH ("no choice", "deprived of
// privacy", "nobody explained") was read as the right being honoured, hiding the
// concern. Word-boundary (prefix) matching also stops "informal" reading as
// "informed" and "uninformed"/"deprived of privacy" reading as the right present.
const RIGHTS_NEGATION_RE =
  /\b(no|not|never|without|denied|denies|deprived|lacked|refused|cannot|nobody|none)\b|\bno one\b|n['’]t\b/;

function rightNegated(lower: string, idx: number): boolean {
  let p = lower.slice(Math.max(0, idx - 25), idx);
  const s = Math.max(
    p.lastIndexOf("."), p.lastIndexOf("!"), p.lastIndexOf("?"),
    p.lastIndexOf(";"), p.lastIndexOf(","),
  );
  if (s >= 0) p = p.slice(s + 1);
  return RIGHTS_NEGATION_RE.test(p);
}

/** True if any token appears as a whole word (prefix) that is NOT negated in its clause. */
function affirmed(lower: string, tokens: string[]): boolean {
  for (const tok of tokens) {
    const re = new RegExp(`\\b${tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(lower)) !== null) {
      if (!rightNegated(lower, m.index)) return true;
    }
  }
  return false;
}

function hasSubstantiveChildVoice(record: CaraPracticeRecord): boolean {
  if (!record.childVoice) return false;
  const voice = record.childVoice.trim();
  if (voice.length < 5) return false;
  // Check it's not just a placeholder
  const lower = voice.toLowerCase();
  return !(lower === "n/a" || lower === "na" || lower === "none" || lower === "not applicable");
}

function deriveSuggestedFollowUp(record: CaraPracticeRecord, voicePresent: boolean): string[] {
  const followUp: string[] = [];

  if (!voicePresent) {
    followUp.push(
      "When the child is regulated and it is safe to do so, offer them an opportunity to share their view of what happened.",
    );
    followUp.push(
      "Record what the child said, how they presented, whether they declined to speak, and when this will be revisited.",
    );
  } else {
    followUp.push(
      "Show the child how their voice has been heard and how it will be used to support them. This builds trust in the recording process.",
    );
  }

  if (record.restraintUsed) {
    followUp.push(
      "Ensure the physical intervention review includes the child's account of their experience of the restraint.",
    );
  }

  if (record.type === "missing_episode") {
    followUp.push(
      "Complete a return home interview and record the child's account of the missing episode and their current needs.",
    );
  }

  if (record.type === "key_work") {
    followUp.push(
      "Key work records should always reflect the child's voice — use direct quotes where possible.",
    );
  }

  if (record.type === "incident" || record.type === "behaviour_record") {
    followUp.push(
      "After the child is regulated, revisit what happened. Their perspective on the trigger, their feelings, and what would help is essential information.",
    );
  }

  return followUp;
}

export interface ChildVoiceRightsResult {
  review: ChildVoiceRightsReview;
  audit: IntelligenceAuditEntry[];
}

export function runChildVoiceRightsEngine(
  record: CaraPracticeRecord,
  now: string = new Date().toISOString(),
): ChildVoiceRightsResult {
  const audit: IntelligenceAuditEntry[] = [];
  const voicePresent = hasSubstantiveChildVoice(record);

  audit.push({
    ruleId: "CVR_CHILD_VOICE",
    engine: ENGINE,
    triggered: !voicePresent,
    reason: voicePresent
      ? "Child voice is present in the record."
      : "Child voice is not present or insufficient in this record.",
    severity: !voicePresent ? "warning" : "info",
    timestamp: now,
  });

  // Rights check
  const combinedLower = [record.description, record.staffResponse ?? "", record.childVoice ?? ""]
    .join(" ")
    .toLowerCase();

  const rightsConsidered: string[] = [];
  if (voicePresent) rightsConsidered.push("Right to be heard and participate in decisions about their life");
  if (affirmed(combinedLower, ["choice", "chose", "decided"])) rightsConsidered.push("Right to choice and agency");
  if (affirmed(combinedLower, ["privacy", "private", "dignity"])) rightsConsidered.push("Right to privacy and dignity");
  if (affirmed(combinedLower, ["advocat"])) rightsConsidered.push("Right to advocacy");
  if (affirmed(combinedLower, ["informed", "information", "explain"])) rightsConsidered.push("Right to be informed about decisions");
  if (rightsConsidered.length === 0) rightsConsidered.push("Rights considerations are not yet visible in this record");

  audit.push({
    ruleId: "CVR_RIGHTS",
    engine: ENGINE,
    triggered: rightsConsidered[0] === "Rights considerations are not yet visible in this record",
    reason: `Rights visibility: ${rightsConsidered.join("; ")}`,
    severity: "info",
    timestamp: now,
  });

  // Dignity concern
  const lower = [record.description, record.staffResponse ?? ""].join(" ").toLowerCase();
  const dignityConcern =
    record.restraintUsed === true ||
    record.policeCalled === true ||
    lower.includes("embarrass") ||
    lower.includes("humiliat");

  audit.push({
    ruleId: "CVR_DIGNITY",
    engine: ENGINE,
    triggered: dignityConcern,
    reason: dignityConcern
      ? "Dignity concern flagged based on record content (restraint, police, or humiliation language)."
      : "No dignity concerns identified in this record.",
    severity: dignityConcern ? "prompt" : "info",
    timestamp: now,
  });

  // Advocacy
  const advocacyNeeded =
    record.policeCalled === true ||
    record.type === "physical_intervention" ||
    (record.severity ?? 1) >= 4;

  audit.push({
    ruleId: "CVR_ADVOCACY",
    engine: ENGINE,
    triggered: advocacyNeeded,
    reason: advocacyNeeded
      ? "This record may indicate a situation where the child could benefit from an advocate."
      : "Advocacy not indicated for this record.",
    severity: advocacyNeeded ? "prompt" : "info",
    timestamp: now,
  });

  return {
    review: {
      childVoicePresent: voicePresent,
      childVoiceSummary: voicePresent ? record.childVoice : undefined,
      reasonVoiceNotCaptured: !voicePresent
        ? "The child's voice is not yet recorded. Add what the child said, how they presented, whether they declined to speak, or when this will be revisited."
        : undefined,
      communicationNeedsConsidered: affirmed(combinedLower, ["communication", "communicate", "aac", "makaton"]),
      rightsConsidered,
      advocacyNeeded,
      dignityConcern,
      suggestedFollowUp: deriveSuggestedFollowUp(record, voicePresent),
    },
    audit,
  };
}
