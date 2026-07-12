// ══════════════════════════════════════════════════════════════════════════════
// CARA — DETERMINISTIC GENERATION FALLBACK
//
// "Generate with Cara" must work WITHOUT an API. The command pipeline in
// cara-service is already deterministic-first: 82 of 102 commands are answered by
// the rules engine with no model call. The remaining ~20 fall through to the LLM
// tier — and when the provider is unavailable (no key, or the key has no credits,
// or a provider error), generateText() returns an apology ("top up your credits")
// which was being surfaced as the generated draft. That is what "doesn't work
// without an API" looks like to a user.
//
// This module produces a genuine, structured, editable DRAFT for those commands
// instead of the apology — from the user's own source notes + the command's
// intent. It never invents facts: it organises what the user typed and lays out
// the sections/questions the document needs, clearly labelled as a draft to
// complete and verify. It is PURE and deterministic (no Date/random, no I/O), so
// identical input yields identical output.
// ══════════════════════════════════════════════════════════════════════════════

/** Commands whose deliverable is an extractive summary of the source. */
const SUMMARY_COMMANDS = new Set<string>([
  "summarise_text",
  "summarise_uploaded_document",
]);

/** Commands whose deliverable is a ready-to-use list of questions. */
const QUESTION_COMMANDS: Record<string, { title: string; intro: string; questions: string[] }> = {
  draft_investigation_questions: {
    title: "Investigation questions (fact-finding)",
    intro: "Neutral, open questions for a fact-finding conversation. Adapt to the specific concern; keep them non-leading.",
    questions: [
      "In your own words, please tell me what happened.",
      "When and where did this take place?",
      "Who else was present or nearby?",
      "What did you see, hear, and do?",
      "Was anything said? By whom, and what exactly?",
      "Is there anything that led up to this, or that might have contributed?",
      "What happened immediately afterwards?",
      "Are there any records, messages, or documents that would help me understand this?",
      "Is there anything else you think it is important for me to know?",
    ],
  },
  draft_interview_questions: {
    title: "Values-based interview questions",
    intro: "Values-based questions for a residential childcare interview. Probe for trauma-informed, child-centred practice with follow-ups.",
    questions: [
      "Why do you want to work with children and young people living in residential care?",
      "Tell me about a time you built trust with a young person who found adults hard to trust. What did you do?",
      "How do you stay calm and boundaried when a young person is dysregulated or in crisis?",
      "Describe a time you had a safeguarding concern. What did you do, and who did you tell?",
      "How do you repair a relationship with a young person after conflict?",
      "What does a child-centred, trauma-informed approach mean to you in day-to-day practice?",
      "Give an example of working openly within a staff team when you disagreed with a decision.",
      "How do you look after your own wellbeing so you can be consistent for the children?",
    ],
  },
};

/** Commands whose deliverable is a structured document/plan — the ordered
 *  headings the finished document needs. The source notes are placed first, then
 *  each heading is laid out as a section to complete. */
const SECTION_COMMANDS: Record<string, { title: string; intro: string; sections: string[] }> = {
  draft_child_voice_summary: {
    title: "Child's voice — summary",
    intro: "The child's own views, wishes and feelings drawn from the source. Keep their words; do not reinterpret them.",
    sections: [
      "What the child said (in their words)",
      "What the child seems to be feeling",
      "What the child wants to happen",
      "How we have responded / will respond",
      "Anything the child has NOT been asked yet",
    ],
  },
  draft_placement_plan_update: {
    title: "Placement plan — update",
    intro: "An update to the placement plan based on the source notes.",
    sections: [
      "What has changed since the last plan",
      "Current arrangements",
      "Progress towards the child's goals",
      "Risks and how we manage them",
      "Actions and who is responsible",
      "Date of next review",
    ],
  },
  draft_risk_assessment_update: {
    title: "Risk assessment — update",
    intro: "A risk-assessment update based on the source notes.",
    sections: [
      "Risk(s) identified",
      "Triggers and context",
      "Who could be harmed",
      "Control measures in place",
      "Residual risk (Low / Medium / High)",
      "Actions and review date",
    ],
  },
  draft_behaviour_support_update: {
    title: "Behaviour support plan — update",
    intro: "An update to the behaviour support plan, framed around what the behaviour communicates.",
    sections: [
      "What we are seeing (describe the behaviour)",
      "What the behaviour communicates (function / unmet need)",
      "What helps (proactive strategies)",
      "How we respond (de-escalation)",
      "Repair and reflection afterwards",
      "Review date",
    ],
  },
  draft_social_worker_update: {
    title: "Update to the social worker / IRO",
    intro: "A professional update for the child's social worker or IRO.",
    sections: [
      "Period covered",
      "Progress and achievements",
      "Concerns and risks",
      "Health, education and contact",
      "Actions needed from the network",
      "Next steps",
    ],
  },
  draft_parent_carer_update: {
    title: "Update for parents / carers",
    intro: "A warm, plain-English update for parents or carers. Avoid jargon; be honest and kind.",
    sections: [
      "How your child has been",
      "Things that are going well",
      "Things we are working on together",
      "What happens next",
      "How to reach us",
    ],
  },
  draft_strategy_discussion_notes: {
    title: "Strategy discussion — notes",
    intro: "Structured notes for a strategy discussion.",
    sections: [
      "Reason for the strategy discussion",
      "Who was present",
      "Information shared",
      "Immediate risks",
      "Decisions",
      "Actions — who will do what, by when",
    ],
  },
  draft_safeguarding_referral_support: {
    title: "Safeguarding referral — supporting wording",
    intro: "Supporting wording for a safeguarding referral. The manager confirms before submission.",
    sections: [
      "Child and basic details",
      "The concern",
      "Evidence and chronology",
      "Immediate safety actions taken",
      "What we are asking for",
      "Consent / information-sharing basis",
    ],
  },
  draft_management_oversight: {
    title: "Registered Manager — oversight comment",
    intro: "A Registered Manager oversight comment on the source record.",
    sections: [
      "What I have reviewed",
      "What is working well",
      "What needs to improve",
      "Actions I am setting",
      "When I will check again",
    ],
  },
  draft_manager_audit_response: {
    title: "Manager's response to an audit",
    intro: "The manager's response to audit findings.",
    sections: [
      "Audit and date",
      "Findings acknowledged",
      "Our response / what we have done",
      "Actions still outstanding",
      "Owner and timescale",
    ],
  },
  draft_outcome_letter: {
    title: "HR outcome letter",
    intro: "A draft HR outcome letter. Run it through the HR Process Guardian before sending.",
    sections: [
      "Purpose of this letter",
      "Background",
      "Findings",
      "Decision / outcome",
      "What happens next",
      "Right of reply / appeal",
    ],
  },
  draft_care_plan_update: {
    title: "Care plan — update",
    intro: "A professional update to the child's care plan based on recent records and observations.",
    sections: [
      "What has changed",
      "The child's needs and wishes",
      "How we will meet them",
      "Who is responsible",
      "How we will know it is working",
      "Review date",
    ],
  },
  draft_performance_support_plan: {
    title: "Performance support / improvement plan",
    intro: "A supportive performance improvement plan.",
    sections: [
      "Area(s) of concern",
      "The expected standard",
      "Support and training offered",
      "Actions for the staff member",
      "How progress will be measured",
      "Review dates",
    ],
  },
  draft_investigation_plan: {
    title: "HR investigation plan",
    intro: "A plan for a fair, timely HR investigation.",
    sections: [
      "Allegation / concern",
      "Terms of reference",
      "Who will investigate",
      "People to interview",
      "Documents and records to gather",
      "Timescale",
      "Support for those involved",
    ],
  },
  create_audit_action_plan: {
    title: "Audit action plan",
    intro: "An action plan built from the audit findings. Add one row per finding.",
    sections: [
      "Finding",
      "Action required",
      "Owner",
      "Priority (High / Medium / Low)",
      "Target date",
      "Evidence of completion",
    ],
  },
  create_service_improvement_plan: {
    title: "Service improvement plan",
    intro: "A service improvement plan built from the source findings.",
    sections: [
      "Area for improvement",
      "What we will do",
      "Owner",
      "Timescale",
      "How we will measure success",
      "Review date",
    ],
  },
};

const HEADER =
  "Deterministic draft — the AI assistant is unavailable, so Cara has organised your notes and laid out the sections this document needs. Review, complete each section, and verify before use. Cara has not added any facts.";

const STOPWORDS = new Set(
  "the a an and or but of to in on for with at by from as is are was were be been being this that these those it its their our we they you i he she them his her have has had do does did not no yes will would can could should may might must about into over under then than so if when while".split(
    " ",
  ),
);

/** Split text into trimmed sentences (deterministic). */
function toSentences(text: string): string[] {
  return (text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Rank sentences by keyword salience, return the top `max` in ORIGINAL order. */
function extractiveSummary(text: string, max = 5): string[] {
  const sents = toSentences(text);
  if (sents.length <= max) return sents;
  const freq: Record<string, number> = {};
  for (const w of text.toLowerCase().match(/[a-z']{3,}/g) ?? []) {
    if (!STOPWORDS.has(w)) freq[w] = (freq[w] ?? 0) + 1;
  }
  const scored = sents.map((s, i) => {
    const words = s.toLowerCase().match(/[a-z']{3,}/g) ?? [];
    const score = words.reduce((a, w) => a + (freq[w] ?? 0), 0) / Math.max(1, words.length);
    return { s, i, score };
  });
  return [...scored]
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, max)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s);
}

/** Source notes rendered as bullet points (one per sentence), for placement at
 *  the top of a structured draft. */
function sourceAsBullets(text: string): string[] {
  const sents = toSentences(text);
  return (sents.length > 0 ? sents : [text.trim()]).map((s) => `- ${s}`);
}

export interface DeterministicDraftMeta {
  label?: string;
  description?: string;
}

/**
 * Produce a deterministic, structured draft for a Cara command when the LLM is
 * unavailable. Never invents facts — organises the user's source text and lays
 * out the sections/questions the document needs.
 */
export function deterministicCommandDraft(
  commandId: string,
  inputText: string,
  meta: DeterministicDraftMeta = {},
): string {
  const source = (inputText ?? "").trim();

  // ── Summary family — extractive ─────────────────────────────────────────────
  if (SUMMARY_COMMANDS.has(commandId)) {
    const points = extractiveSummary(source, 6);
    return [
      `**${HEADER}**`,
      "",
      `## ${meta.label ?? "Summary"} (extractive)`,
      ...points.map((p) => `- ${p}`),
      "",
      "_This is an extractive summary of your source text — check that nothing significant is missing before use._",
    ].join("\n");
  }

  // ── Question family — a ready list of questions ─────────────────────────────
  const q = QUESTION_COMMANDS[commandId];
  if (q) {
    return [
      `**${HEADER}**`,
      "",
      `## ${q.title}`,
      `_${q.intro}_`,
      "",
      ...q.questions.map((question, i) => `${i + 1}. ${question}`),
      source ? "\n### Context from your notes" : "",
      ...(source ? sourceAsBullets(source) : []),
    ]
      .filter((l) => l !== "")
      .join("\n");
  }

  // ── Section family — a structured document to complete ──────────────────────
  const spec = SECTION_COMMANDS[commandId];
  if (spec) {
    return [
      `**${HEADER}**`,
      "",
      `# ${spec.title}`,
      `_${spec.intro}_`,
      "",
      "## Your source notes",
      ...sourceAsBullets(source),
      "",
      ...spec.sections.flatMap((section) => [`## ${section}`, "_[Complete this section from the notes above.]_", ""]),
    ].join("\n");
  }

  // ── Generic fallback — organise the notes + a completion prompt ──────────────
  return [
    `**${HEADER}**`,
    "",
    `# ${meta.label ?? "Draft"}`,
    meta.description ? `_${meta.description}_` : "",
    "",
    "## Your source notes",
    ...sourceAsBullets(source),
    "",
    "## Draft",
    "_[Complete this draft from the notes above, then have it reviewed.]_",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/** The command ids that get a bespoke (non-generic) deterministic draft. */
export function commandsWithDeterministicDraft(): string[] {
  return [
    ...SUMMARY_COMMANDS,
    ...Object.keys(QUESTION_COMMANDS),
    ...Object.keys(SECTION_COMMANDS),
  ];
}
