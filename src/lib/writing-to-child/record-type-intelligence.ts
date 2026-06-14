// ═══════════════════════════════════════════════════════════════════════════
// CARA — WRITING TO THE CHILD  ·  record-type intelligence
//
// Per record type, the elements a good child-conscious record should contain.
// Each check carries detection cues; when none are present the engine surfaces
// the element as missing information + a reflective prompt — Cara names the gap,
// it never invents the content.
// ═══════════════════════════════════════════════════════════════════════════

import type { WritingRecordType } from "./types";

export interface RecordElementCheck {
  /** What should be present. */
  element: string;
  /** Lowercased cues that indicate the element is present. */
  cues: string[];
  /** Prompt shown when the element appears to be missing. */
  prompt: string;
}

export interface RecordTypeIntelligence {
  type: WritingRecordType;
  label: string;
  focus: string;
  checks: RecordElementCheck[];
  /** Phrases/assumptions to avoid for this record type. */
  avoid: string[];
}

const COMMON_CHILD_VOICE: RecordElementCheck = {
  element: "the child's voice",
  cues: ["said", "told", "stated", "shared", "asked", "wanted", "felt", "showed", "their words", "quote"],
  prompt: "What did the child say or show? Include their voice — or record carefully how they communicated without words.",
};

const COMMON_STAFF_RESPONSE: RecordElementCheck = {
  element: "the adult response",
  cues: ["staff offered", "staff supported", "staff gave", "staff stayed", "reassured", "we offered", "we gave", "supported", "listened", "checked"],
  prompt: "What did staff do to help? Record the adult response, not only the child's behaviour.",
};

const COMMON_NEXT_STEPS: RecordElementCheck = {
  element: "next steps",
  cues: ["next", "will", "plan to", "agreed to", "follow up", "going to", "tomorrow", "review"],
  prompt: "What happens next? Record the agreed next step.",
};

export const RECORD_TYPE_INTELLIGENCE: RecordTypeIntelligence[] = [
  {
    type: "missing_episode",
    label: "Missing episode",
    focus: "What happened, how the child was when they returned, and what was offered — never a bare 'returned safe and well'.",
    checks: [
      { element: "time returned and who returned the child", cues: ["returned at", "came back", "brought back", "returned to the home", "police returned", "o'clock", "am", "pm"], prompt: "Record when the child returned and who they returned with." },
      { element: "the child's presentation", cues: ["appeared", "seemed", "looked", "presented", "tired", "quiet", "distressed", "withdrawn", "intoxicated"], prompt: "How did the child seem on return? Describe their presentation." },
      { element: "a welfare/health check", cues: ["welfare check", "no visible injuries", "injuries", "health", "checked", "first aid", "medical"], prompt: "Record the welfare check — any visible injuries or health concerns." },
      { ...COMMON_CHILD_VOICE },
      { element: "what the child did not want to say", cues: ["did not want to", "not ready to talk", "declined", "chose not", "would not say"], prompt: "If the child did not want to talk, record that carefully and without assumption." },
      { element: "immediate care offered", cues: ["offered food", "offered", "reassurance", "space", "warm", "drink", "bed"], prompt: "What immediate care was offered — food, reassurance, space?" },
      { element: "safeguarding concerns and notifications", cues: ["safeguarding", "notified", "social worker", "police", "notification", "exploitation"], prompt: "Record any safeguarding concerns and whether the required notifications were made." },
      { element: "return home interview and safety planning", cues: ["return home interview", "rhi", "safety plan", "next safety"], prompt: "Note the return home interview (or when it will happen) and the next safety-planning steps." },
    ],
    avoid: ["returned safe and well (without detail)", "absconded"],
  },
  {
    type: "incident",
    label: "Incident",
    focus: "Trigger → escalation → the child's words → the adult response → de-escalation → welfare → repair → learning.",
    checks: [
      { element: "the trigger / what happened before", cues: ["before", "after", "when", "because", "trigger", "leading up", "earlier"], prompt: "What happened before the behaviour? Record the trigger and context." },
      { element: "the escalation, described specifically", cues: ["raised their voice", "moved", "threw", "shouted", "hit", "kicked", "ran"], prompt: "Describe what actually happened, specifically — not just a label like 'aggressive'." },
      { ...COMMON_CHILD_VOICE },
      { ...COMMON_STAFF_RESPONSE },
      { element: "de-escalation", cues: ["calm", "space", "lower", "reduced demands", "quiet", "time", "breathing"], prompt: "How did staff support the child to regulate / de-escalate?" },
      { element: "any restraint and a welfare check", cues: ["restraint", "physical intervention", "hold", "team teach", "welfare check", "injuries", "no injuries"], prompt: "If any restraint was used, record it and the welfare check that followed." },
      { element: "repair and manager oversight", cues: ["repair", "reflect", "manager", "debrief", "checked in", "conversation later"], prompt: "Has a repair conversation been offered, and has a manager reviewed the incident?" },
      { element: "learning for staff", cues: ["learning", "next time", "differently", "what helped", "reflection"], prompt: "What is the learning for staff — what would help next time?" },
    ],
    avoid: ["challenging behaviour", "aggressive (undescribed)", "kicked off", "non-compliant"],
  },
  {
    type: "room_search",
    label: "Room / bedroom search",
    focus: "Reason, proportionality, the child's awareness and dignity, what was found, the child's view, and the follow-up.",
    checks: [
      { element: "the reason for the search", cues: ["because", "reason", "concern", "intelligence", "worried", "safety"], prompt: "Record the specific safety reason that justified the search." },
      { element: "proportionality and authorisation", cues: ["proportionate", "agreed", "authorised", "manager", "least intrusive"], prompt: "Was the search proportionate and authorised? Record how the decision was made." },
      { element: "the child's awareness / involvement", cues: ["aware", "present", "told", "explained to", "involved", "with them"], prompt: "Was the child told about and, where possible, present for the search? Record their dignity and privacy." },
      { element: "what was found (factually)", cues: ["found", "located", "nothing found", "items", "discovered"], prompt: "Record factually what was or was not found." },
      { element: "the child's view", cues: ["said", "felt", "view", "told", "reaction"], prompt: "Record the child's view about the search." },
      { element: "the follow-up conversation", cues: ["spoke with", "conversation", "afterwards", "explained", "support"], prompt: "Record the follow-up conversation and any support offered." },
    ],
    avoid: ["room search completed (without reason, dignity or follow-up)"],
  },
  {
    type: "family_time",
    label: "Family time",
    focus: "The child's preferred words, who they saw, how they were before/during/after, meaningful moments, worries and support.",
    checks: [
      { element: "who the child saw, in the child's words", cues: ["mum", "dad", "brother", "sister", "family", "grandma", "saw"], prompt: "Record who the child saw — use the child's own words (Mum, my brother), not 'contact'." },
      { element: "emotional presentation before, during and after", cues: ["before", "during", "after", "excited", "nervous", "happy", "upset", "calm"], prompt: "How was the child before, during and after? Family time can be joyful and hard at once." },
      { element: "meaningful moments", cues: ["laughed", "played", "shared", "hugged", "talked about", "enjoyed", "moment"], prompt: "Capture a meaningful human moment — this record is part of the child's life story." },
      { element: "any worries", cues: ["worried", "concern", "did not", "missed", "upset", "difficult"], prompt: "Record any worries honestly, with care." },
      { ...COMMON_STAFF_RESPONSE },
      { ...COMMON_CHILD_VOICE },
    ],
    avoid: ["contact (use the child's preferred words)"],
  },
  {
    type: "education",
    label: "Education",
    focus: "What the child said about school, the barriers, their presentation, SEND/learning needs, staff encouragement and the plan.",
    checks: [
      { ...COMMON_CHILD_VOICE, prompt: "What did the child say about school?" },
      { element: "the barriers", cues: ["barrier", "anxious", "bullying", "struggled", "could not", "did not feel able", "overwhelmed"], prompt: "What got in the way? Record the barriers, not just 'refused'." },
      { element: "SEND / learning needs", cues: ["send", "ehcp", "learning need", "support plan", "adjustments", "additional needs"], prompt: "Are SEND or learning needs relevant here? Record them." },
      { element: "staff encouragement and school liaison", cues: ["encouraged", "supported", "school", "teacher", "liaison", "spoke with"], prompt: "What did staff do to support and liaise with school?" },
      { ...COMMON_NEXT_STEPS },
    ],
    avoid: ["refused to engage", "non-attender"],
  },
  {
    type: "exploitation",
    label: "Exploitation concern",
    focus: "Power imbalance and coercion recorded clearly; never imply consent; separate known facts, suspicions and protective action.",
    checks: [
      { element: "the power imbalance / coercion (not consent)", cues: ["power imbalance", "older", "coerced", "controlled", "groomed", "pressured", "exploited"], prompt: "Record the power imbalance and any coercion clearly — a child cannot consent to their own exploitation." },
      { element: "what is known vs suspected", cues: ["known", "suspected", "unknown", "evidence", "reported", "believe"], prompt: "Separate what is known, what is suspected, and what is unknown." },
      { element: "the child's understanding and view", cues: ["said", "understands", "view", "feels", "does not see", "told"], prompt: "Record the child's understanding and view, even where adults disagree." },
      { element: "protective action", cues: ["protective", "referral", "nrm", "police", "social worker", "safety plan", "disrupt"], prompt: "Record the protective action taken or needed (screening, referral, safety planning)." },
      { element: "a child-friendly explanation", cues: ["explained", "told them", "not your fault", "safe", "not in trouble"], prompt: "Has the concern been explained to the child in a way they can understand — and that it is not their fault?" },
    ],
    avoid: ["sexually active", "older boyfriend / relationship (in an exploitation context)", "putting themselves at risk"],
  },
  {
    type: "health",
    label: "Health",
    focus: "What happened, the child's voice and consent, what was explained, and the follow-up.",
    checks: [
      { ...COMMON_CHILD_VOICE, prompt: "What did the child say or show about the appointment / health concern?" },
      { element: "consent and what was explained", cues: ["explained", "consent", "agreed", "understood", "choice", "told them why"], prompt: "Was the child told what was happening and why, in a way they could understand?" },
      { element: "the outcome / what was done", cues: ["seen by", "prescribed", "treatment", "advised", "outcome", "appointment"], prompt: "Record the outcome of the appointment / health concern." },
      { ...COMMON_NEXT_STEPS },
    ],
    avoid: ["appointment attended (without the child's experience)"],
  },
  {
    type: "medication",
    label: "Medication",
    focus: "What happened factually, the child's voice and reasons, what staff did, any risk, and the follow-up — never just 'refused'.",
    checks: [
      { element: "what happened factually (offered / taken / declined)", cues: ["offered", "took", "declined", "did not take", "administered", "prn"], prompt: "Record factually what happened with the medication." },
      { ...COMMON_CHILD_VOICE, prompt: "Did the child say why? Record their reason in their words where possible." },
      { ...COMMON_STAFF_RESPONSE },
      { element: "any health risk and who was informed", cues: ["risk", "informed", "nurse", "gp", "pharmacist", "doctor", "safe"], prompt: "Record any health risk from not taking the medication, and who was informed." },
      { ...COMMON_NEXT_STEPS },
    ],
    avoid: ["refused medication (without the child's reason or the health follow-up)"],
  },
  {
    type: "manager_oversight",
    label: "Manager oversight",
    focus: "What the manager reviewed, the analysis of fact vs interpretation, the decision rationale, and the support/learning for staff and child.",
    checks: [
      { element: "what was reviewed", cues: ["reviewed", "read", "considered", "oversight", "checked"], prompt: "Record what the manager reviewed." },
      { element: "fact vs interpretation separated", cues: ["fact", "interpretation", "known", "appears", "may", "evidence"], prompt: "Separate observed fact from interpretation and risk analysis." },
      { element: "the decision and rationale", cues: ["decision", "rationale", "because", "agreed", "next step"], prompt: "Record the decision and the reasoning behind it." },
      { element: "support / learning for staff and child", cues: ["support", "learning", "supervision", "reflect", "child", "repair"], prompt: "Record the support and learning for staff, and the relational next step for the child." },
    ],
    avoid: ["oversight completed (without analysis or rationale)"],
  },
  {
    type: "daily_log",
    label: "Daily log",
    focus: "The child's day in human detail and their voice — not just tasks completed.",
    checks: [
      { ...COMMON_CHILD_VOICE },
      { element: "human detail / how the day was for the child", cues: ["enjoyed", "laughed", "tired", "mood", "felt", "seemed", "played", "talked"], prompt: "Include human detail — how was the day for the child, not only what was done?" },
      { ...COMMON_STAFF_RESPONSE },
    ],
    avoid: ["nothing to report", "uneventful day"],
  },
  {
    type: "key_work",
    label: "Key work",
    focus: "The child's voice and wishes, what was explored together, and the relational next step.",
    checks: [
      { ...COMMON_CHILD_VOICE },
      { element: "the child's wishes and feelings", cues: ["wishes", "feelings", "wants", "hopes", "view", "would like"], prompt: "Record the child's wishes and feelings." },
      { ...COMMON_NEXT_STEPS },
    ],
    avoid: ["session completed (without the child's voice)"],
  },
  {
    type: "risk_assessment",
    label: "Risk assessment",
    focus: "Name risk plainly without blaming the child; balance it with strengths and protective factors; record the child's voice and what protective adults will do.",
    checks: [
      { element: "risk stated plainly but not blamingly", cues: ["risk", "harm", "concern", "exposed to", "at risk from"], prompt: "State the risk clearly — but locate it in the context/others where relevant, not as the child's fault ('exposed to', not 'puts themselves at')." },
      { element: "strengths and protective factors", cues: ["strength", "protective", "what helps", "trusted", "safe", "going well", "resilience"], prompt: "Balance the risks with the child's strengths and protective factors — a risk assessment is not only a list of deficits." },
      { ...COMMON_CHILD_VOICE, prompt: "What does the child say about the risk and what keeps them safe? Record their voice and wishes." },
      { element: "what protective adults will do", cues: ["staff will", "we will", "plan", "support", "reduce", "safety plan", "protective"], prompt: "Record what adults will do to reduce the risk — not only what the child must do differently." },
      { element: "how it will be shared with the child", cues: ["explained", "shared with", "the child understands", "in a way they"], prompt: "How will this assessment be explained to the child in a way they can understand and contribute to?" },
    ],
    avoid: ["puts themselves at risk", "risky lifestyle", "challenging behaviour", "non-compliant"],
  },
  {
    type: "professional_meeting",
    label: "Professional meeting",
    focus: "Whether the child's voice was represented, the decisions made, and how they will be explained to the child.",
    checks: [
      { element: "the child's voice represented", cues: ["child's view", "wishes", "the child said", "advocated", "on behalf"], prompt: "Was the child's voice represented in the meeting? Record it." },
      { element: "decisions made", cues: ["decided", "agreed", "decision", "action", "plan"], prompt: "Record the decisions made about the child." },
      { element: "how decisions will be explained to the child", cues: ["explain to", "tell the child", "share with", "in a way they understand"], prompt: "How will the decisions be explained to the child in a way they can understand?" },
    ],
    avoid: ["meeting held (without the child's voice or how it will be shared with them)"],
  },
];

export function recordTypeIntelligence(type: WritingRecordType): RecordTypeIntelligence {
  return RECORD_TYPE_INTELLIGENCE.find((r) => r.type === type) ?? RECORD_TYPE_INTELLIGENCE.find((r) => r.type === "daily_log")!;
}
