// ══════════════════════════════════════════════════════════════════════════════
// Cara — VOICE OF THE CHILD SUMMARISER
//
// Aggregates a child's voice across multiple records (daily logs, key work,
// 1:1 sessions, complaints, RHIs, family time, etc.) and produces a draft
// summary of what the child is saying, wanting, fearing, and needing.
//
// Output is "Cara suggested draft" — never final until a human approves.
//
// Pipeline:
//   1. Per-record voice extraction (quotes + paraphrased expressions)
//   2. Theme clustering (rule-based, audit-traceable keywords)
//   3. Voice-capture quality grade per record
//   4. Optional LLM enhancement (Anthropic) for the narrative draft
//   5. Returns the typed VoiceSummary the API persists to Supabase
//
// Regulatory basis:
//   - UNCRC Article 12 (the right to be heard)
//   - UNCRC Article 13 (freedom of expression)
//   - Children Act 1989 s.22(4) (LA must ascertain wishes and feelings)
//   - Children's Homes Regs 2015 — Reg 7 (children's wishes), Reg 11 (Standard 1)
//   - SCCIF: "Children's Experience" judgement area
// ══════════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import {
  CARA_PROFESSIONAL_IDENTITY_PROMPT,
  CARA_WRITING_STYLE_PROMPT,
  applyCaraPostprocessor,
} from "@/lib/cara/writingStyleRules";

// ─── Public types ─────────────────────────────────────────────────────────────

export type SourceRecordType =
  | "daily_log"
  | "key_work"
  | "one_to_one"
  | "complaint"
  | "missing_return_interview"
  | "family_time"
  | "incident_report"
  | "lac_review"
  | "advocate_meeting"
  | "child_correspondence"
  | "other";

export interface SourceRecord {
  recordId: string;
  recordType: SourceRecordType;
  recordDate: string;
  recordText: string;
  authorRole?: string;
}

export interface VoiceQuote {
  recordId: string;
  recordDate: string;
  recordType: SourceRecordType;
  kind: "direct" | "paraphrased";
  text: string;
  themeTags: VoiceTheme[];
}

export type VoiceTheme =
  | "safety"
  | "belonging"
  | "identity"
  | "family_relationships"
  | "friendships"
  | "education"
  | "health_wellbeing"
  | "loss_grief"
  | "rights_advocacy"
  | "future_aspirations"
  | "fears_concerns"
  | "things_they_love"
  | "things_they_resist"
  | "feedback_about_staff_or_home"
  | "uncategorised";

export type VoiceCaptureQuality = "strong" | "adequate" | "weak" | "absent";

export interface PerRecordVoiceContribution {
  recordId: string;
  recordType: SourceRecordType;
  recordDate: string;
  quoteCount: number;
  paraphrasedCount: number;
  voiceCaptureQuality: VoiceCaptureQuality;
  notes: string[];
}

export interface VoiceSummaryInput {
  childId: string;
  childPseudonym?: string;
  homeId?: string;
  periodStart?: string;
  periodEnd?: string;
  records: SourceRecord[];
  knownChildContext?: string;
  enableLlm?: boolean;
}

export interface VoiceSummary {
  childId: string;
  childPseudonym?: string;
  generatedAt: string;
  status: "draft";
  caraLabel: "Cara suggested draft";

  periodStart?: string;
  periodEnd?: string;
  recordsConsidered: number;

  narrativeDraft: string;
  ofstedSummary: string;

  themesPresent: VoiceTheme[];
  themesAbsent: VoiceTheme[];
  directQuotes: VoiceQuote[];
  paraphrasedExpressions: VoiceQuote[];

  whatChildAppearsToWant: string[];
  whatChildAppearsToNeed: string[];
  whatChildAppearsToFear: string[];
  rightsOrWishesUnmet: string[];

  perRecordContributions: PerRecordVoiceContribution[];
  overallVoiceCaptureQuality: VoiceCaptureQuality;

  suggestedActionsToStrengthenVoice: SuggestedAction[];
  regulatoryLinks: string[];

  caraConfidence: number;
  llmUsed: boolean;
  engineVersion: string;
}

export interface SuggestedAction {
  title: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low";
  dueDays: number;
  assignedRole: string;
}

const ENGINE_VERSION = "1.0.0";

// ─── Theme keyword index ──────────────────────────────────────────────────────

const THEME_KEYWORDS: Record<Exclude<VoiceTheme, "uncategorised">, RegExp[]> = {
  safety: [/\b(safe|unsafe|scared|frightened|afraid|protect|hurt)\b/i],
  belonging: [/\b(belong|home|family|fit\s*in|left\s*out|lonely|alone)\b/i],
  identity: [/\b(who\s*I\s*am|me|my\s*identity|culture|faith|gender|trans|non-?binary|gay|lesbian|bisexual|queer)\b/i],
  family_relationships: [/\b(mum|mam|mother|dad|father|brother|sister|nan|grandma|grandad|granddad|sibling|aunty|uncle)\b/i],
  friendships: [/\b(friend(s|ship)?|mate|peer|best\s*friend)\b/i],
  education: [/\b(school|college|teacher|class|gcse|exam|homework|education)\b/i],
  health_wellbeing: [/\b(tired|sleep|nightmare|appetite|sad|anxious|worried|happy|low|panic|therapy|camhs)\b/i],
  loss_grief: [/\b(miss(ed|ing)?|died|death|gone|grief|funeral|anniversary)\b/i],
  rights_advocacy: [/\b(complain|advocate|right(s)?|listen(ed)?\s*to|not\s*heard|unfair)\b/i],
  future_aspirations: [/\b(want\s*to\s*be|dream|plan|future|when\s*I'?m\s*older|aspire|hope\s*to)\b/i],
  fears_concerns: [/\b(worry|worried|scared|afraid|stress|anxious|terrified|panic)\b/i],
  things_they_love: [/\b(love|like|enjoy|favourite|happy|brilliant|amazing|best\s*part)\b/i],
  things_they_resist: [/\b(hate|don'?t\s*like|won'?t|refuse|stop\s*making\s*me|don'?t\s*want)\b/i],
  feedback_about_staff_or_home: [
    /\b(staff|the\s*home|key\s*?worker|manager|the\s*house|here|this\s*place)\b/i,
  ],
};

// ─── Voice extraction ─────────────────────────────────────────────────────────

const QUOTE_PATTERNS = [
  /["“]([^"”]{4,})["”]/g, // double curly / straight quotes
  /['‘]([^'’]{6,})['’]/g, // long single-quoted phrases (avoid catching "don't")
];

const PARAPHRASE_LEAD_INS = [
  /\b(?:the\s+(?:young\s+person|child)|they|she|he|[A-Z][a-z]+)\s+(?:said|told\s+me|told\s+us|expressed|stated|shared|asked|wanted|disclosed|reflected|reported)\s+(?:that\s+)?([^.?!]{8,160}[.?!])/gi,
];

function classifyThemes(text: string): VoiceTheme[] {
  const themes = new Set<VoiceTheme>();
  for (const [theme, patterns] of Object.entries(THEME_KEYWORDS)) {
    if (patterns.some((re) => re.test(text))) {
      themes.add(theme as VoiceTheme);
    }
  }
  return themes.size > 0 ? Array.from(themes) : ["uncategorised"];
}

function extractFromRecord(record: SourceRecord): { direct: VoiceQuote[]; paraphrased: VoiceQuote[] } {
  const direct: VoiceQuote[] = [];
  const paraphrased: VoiceQuote[] = [];

  // Direct quotes
  for (const re of QUOTE_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(record.recordText)) !== null) {
      const inner = m[1].trim();
      if (inner.length < 4) continue;
      direct.push({
        recordId: record.recordId,
        recordDate: record.recordDate,
        recordType: record.recordType,
        kind: "direct",
        text: inner,
        themeTags: classifyThemes(inner),
      });
    }
  }

  // Paraphrased expressions (e.g. "Casey said that she...")
  for (const re of PARAPHRASE_LEAD_INS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(record.recordText)) !== null) {
      const phrase = m[1].trim();
      if (phrase.length < 8) continue;
      paraphrased.push({
        recordId: record.recordId,
        recordDate: record.recordDate,
        recordType: record.recordType,
        kind: "paraphrased",
        text: phrase,
        themeTags: classifyThemes(phrase),
      });
    }
  }

  return { direct, paraphrased };
}

function gradeRecordVoiceCapture(
  record: SourceRecord,
  direct: VoiceQuote[],
  paraphrased: VoiceQuote[],
): PerRecordVoiceContribution {
  const notes: string[] = [];
  let quality: VoiceCaptureQuality;

  if (direct.length >= 2) {
    quality = "strong";
    notes.push("Multiple direct quotes captured.");
  } else if (direct.length === 1 && paraphrased.length >= 1) {
    quality = "strong";
    notes.push("Direct quote and paraphrased expression both captured.");
  } else if (direct.length === 1 || paraphrased.length >= 2) {
    quality = "adequate";
  } else if (paraphrased.length === 1) {
    quality = "weak";
    notes.push("Only one paraphrased expression — consider adding a direct quote.");
  } else {
    quality = "absent";
    notes.push("No child voice detected — record is staff-perspective only.");
  }

  if (record.recordText.length < 200 && quality !== "absent") {
    notes.push("Record narrative is short — voice may be under-captured.");
  }

  return {
    recordId: record.recordId,
    recordType: record.recordType,
    recordDate: record.recordDate,
    quoteCount: direct.length,
    paraphrasedCount: paraphrased.length,
    voiceCaptureQuality: quality,
    notes,
  };
}

function aggregateOverallQuality(
  contributions: PerRecordVoiceContribution[],
): VoiceCaptureQuality {
  if (contributions.length === 0) return "absent";
  const counts = contributions.reduce<Record<VoiceCaptureQuality, number>>(
    (acc, c) => {
      acc[c.voiceCaptureQuality] = (acc[c.voiceCaptureQuality] ?? 0) + 1;
      return acc;
    },
    { strong: 0, adequate: 0, weak: 0, absent: 0 },
  );
  const total = contributions.length;
  const strongRatio = counts.strong / total;
  const adequateOrBetter = (counts.strong + counts.adequate) / total;
  const absentRatio = counts.absent / total;

  if (strongRatio >= 0.5) return "strong";
  if (adequateOrBetter >= 0.6) return "adequate";
  if (absentRatio >= 0.5) return "absent";
  return "weak";
}

// ─── Wishes / needs / fears / unmet rights inference ──────────────────────────

const WANT_INDICATORS = [
  /\bI\s+want\s+([^.?!]{3,80})/gi,
  /\bcan\s+I\s+([^.?!]{3,80})/gi,
  /\bplease\s+(?:can\s+you\s+)?([^.?!]{3,80})/gi,
];

const NEED_INDICATORS = [
  /\bI\s+need\s+([^.?!]{3,80})/gi,
  /\b(?:she|he|they)\s+need(?:s|ed)?\s+([^.?!]{3,80})/gi,
];

const FEAR_INDICATORS = [
  /\bI\s+(?:'m\s+)?(?:scared|afraid|frightened|worried|terrified)\s+(?:of\s+|about\s+|that\s+)?([^.?!]{3,80})/gi,
];

const UNMET_RIGHTS_INDICATORS = [
  /\bnot\s+(?:listened\s+to|heard|believed|asked)\b[^.?!]*[.?!]/gi,
  /\bno\s+one\s+(?:listens|listened|cares|cared)\b[^.?!]*[.?!]/gi,
  /\bI\s+don'?t\s+have\s+a\s+say\b[^.?!]*[.?!]/gi,
];

function harvest(re: RegExp[], text: string): string[] {
  const out: string[] = [];
  for (const r of re) {
    r.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = r.exec(text)) !== null) {
      const phrase = (m[1] ?? m[0]).trim().replace(/\s+/g, " ");
      if (phrase.length > 0) out.push(phrase);
    }
  }
  // Dedupe preserving order
  const seen = new Set<string>();
  return out.filter((p) => {
    const k = p.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ─── Suggested actions ────────────────────────────────────────────────────────

function suggestActionsToStrengthenVoice(
  overallQuality: VoiceCaptureQuality,
  contributions: PerRecordVoiceContribution[],
  unmetRights: string[],
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  if (overallQuality === "absent" || overallQuality === "weak") {
    actions.push({
      title: "Strengthen voice capture across daily recording",
      description:
        "Brief the staff team that records must routinely include the child's voice — direct quotes where possible, paraphrased expressions where not. Audit a sample at next supervision.",
      priority: "high",
      dueDays: 7,
      assignedRole: "Registered Manager / Deputy",
    });
  }

  const absentRecords = contributions.filter((c) => c.voiceCaptureQuality === "absent");
  if (absentRecords.length > 0) {
    actions.push({
      title: `Return to ${absentRecords.length} record(s) with no voice captured`,
      description: `The following records are missing the child's voice and should be revisited with the original author: ${absentRecords
        .map((r) => `${r.recordType}/${r.recordId} (${r.recordDate})`)
        .join("; ")}.`,
      priority: "medium",
      dueDays: 14,
      assignedRole: "Author / Key Worker",
    });
  }

  if (unmetRights.length > 0) {
    actions.push({
      title: "Triangulate unmet-rights signals with advocate / IRO",
      description:
        "The summary surfaces the child's expression that they do not feel heard. Confirm independent visitor and advocate are engaged, and consider raising at next LAC review.",
      priority: "high",
      dueDays: 7,
      assignedRole: "Registered Manager",
    });
  }

  actions.push({
    title: "Share Cara draft with the child in age-appropriate form",
    description:
      "Once approved, share the voice summary with the child (with adaptations for age and communication style) so they can confirm, correct or expand it. UNCRC Article 12 in practice.",
    priority: "medium",
    dueDays: 14,
    assignedRole: "Key Worker",
  });

  return actions;
}

const REGULATORY_LINKS = [
  "UNCRC Article 12 (right to be heard)",
  "UNCRC Article 13 (freedom of expression)",
  "Children Act 1989 s.22(4) (LA duty to ascertain wishes and feelings)",
  "Children's Homes (England) Regulations 2015 Reg 7 (children's wishes / keyworker duty)",
  "Children's Homes (England) Regulations 2015 Reg 11 (Quality Standard 1 — children's views, wishes and feelings)",
  "SCCIF: Children's Experience judgement area",
  "Working Together to Safeguard Children 2023",
];

// ─── Templated draft (deterministic fallback) ────────────────────────────────

function buildTemplatedDraft(
  input: VoiceSummaryInput,
  computed: {
    themesPresent: VoiceTheme[];
    themesAbsent: VoiceTheme[];
    directQuotes: VoiceQuote[];
    overallQuality: VoiceCaptureQuality;
    wants: string[];
    needs: string[];
    fears: string[];
    unmet: string[];
  },
): { narrativeDraft: string; ofstedSummary: string } {
  const child = input.childPseudonym ?? input.childId;
  const periodLine =
    input.periodStart && input.periodEnd
      ? ` covering the period from ${input.periodStart} to ${input.periodEnd}`
      : "";
  const themesPretty = (t: VoiceTheme[]) => t.map((x) => x.replace(/_/g, " ")).join(", ");

  const paragraphs: string[] = [];

  paragraphs.push(`Cara suggested draft. Voice of ${child}${periodLine}.`);

  paragraphs.push(
    `${input.records.length} records were considered. Taken together, the voice-capture quality across these records reads as ${computed.overallQuality}. The detail below is what Cara surfaced from the records, and what feels worth thinking through with the team.`,
  );

  if (computed.themesPresent.length > 0) {
    paragraphs.push(
      `Themes ${child} appears to be expressing: ${themesPretty(computed.themesPresent)}. These are the threads Cara found running through what was said and how it was said. The records suggest these matter to ${child} now.`,
    );
  } else {
    paragraphs.push(
      `Cara has not surfaced clear voice themes across the records. That is itself a finding worth sitting with, rather than a clean result. The team may need to consider whether ${child} has had room to speak, and whether the records are catching what they say when they do.`,
    );
  }

  if (computed.themesAbsent.length > 0) {
    paragraphs.push(
      `Themes that did not surface (worth checking whether ${child} has been asked): ${themesPretty(computed.themesAbsent)}. Absence here is not proof that nothing is going on. It is a prompt to be curious.`,
    );
  }

  if (computed.directQuotes.length > 0) {
    const sample = computed.directQuotes.slice(0, 3).map((q) => `"${q.text}"`).join(", ");
    paragraphs.push(`Sample of what ${child} has said in their own words: ${sample}.`);
  } else {
    paragraphs.push(
      `No direct quotes were captured across these records. The voice work has relied on staff paraphrase only. The author of each record should be encouraged to capture ${child}'s words where they can.`,
    );
  }

  const wantNeedFear: string[] = [];
  if (computed.wants.length > 0) {
    wantNeedFear.push(`What ${child} appears to want: ${computed.wants.slice(0, 5).join("; ")}.`);
  }
  if (computed.needs.length > 0) {
    wantNeedFear.push(`What ${child} appears to need: ${computed.needs.slice(0, 5).join("; ")}.`);
  }
  if (computed.fears.length > 0) {
    wantNeedFear.push(`What ${child} appears to fear: ${computed.fears.slice(0, 5).join("; ")}.`);
  }
  if (wantNeedFear.length > 0) {
    paragraphs.push(wantNeedFear.join(" "));
  }

  if (computed.unmet.length > 0) {
    paragraphs.push(
      `${child} has expressed feeling unheard or that their wishes are unmet. The records show: ${computed.unmet.join(" ")} This should be triangulated with the advocate and the IRO, and considered alongside the current placement plan.`,
    );
  }

  paragraphs.push(
    `This wording is an Cara suggested draft. It must be reviewed, edited as needed, and approved by the Registered Manager before it forms part of the regulatory record. Once approved, it should be shared back with ${child} in a format that suits their age and communication style, so they can confirm, correct, or expand on what Cara has surfaced.`,
  );

  const narrativeDraft = applyCaraPostprocessor(paragraphs.join("\n\n"));

  const summaryParts: string[] = [];
  summaryParts.push(`Voice capture across ${input.records.length} records reads as ${computed.overallQuality}.`);
  summaryParts.push(
    computed.themesPresent.length > 0
      ? `${computed.themesPresent.length} voice themes evidenced.`
      : `No voice themes evidenced. The records may need revisiting.`,
  );
  summaryParts.push(
    computed.directQuotes.length > 0
      ? `${computed.directQuotes.length} direct quotes captured.`
      : `No direct quotes captured. Author feedback set out in actions.`,
  );
  summaryParts.push(
    computed.unmet.length > 0
      ? `Unmet-rights signals present and flagged for triangulation with the advocate and IRO.`
      : `No unmet-rights signals detected on this run.`,
  );

  const ofstedSummary = applyCaraPostprocessor(summaryParts.join(" "));

  return { narrativeDraft, ofstedSummary };
}

// ─── Optional LLM enhancement ────────────────────────────────────────────────

async function enhanceWithLlm(
  input: VoiceSummaryInput,
  deterministic: VoiceSummary,
): Promise<{ narrativeDraft: string; ofstedSummary: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });

  const system = [
    `You are Cara, the intelligent professional assistant built into Cara, the operating system for UK residential children's homes. You are drafting a voice-of-the-child narrative summary for a Registered Manager to review and approve.`,
    ``,
    CARA_PROFESSIONAL_IDENTITY_PROMPT,
    ``,
    `Hard rules for this draft:`,
    `- Label the wording clearly as an Cara suggested draft.`,
    `- Use only what the records and deterministic analysis provide. Do not invent facts.`,
    `- No blame-based language about the child or staff.`,
    `- Where the child has expressed feeling unheard or where their wishes appear unmet, foreground it.`,
    `- Where voice is absent, name that as a finding rather than papering over it.`,
    ``,
    CARA_WRITING_STYLE_PROMPT,
  ].join("\n");

  const userMessage = [
    `CHILD REFERENCE: ${input.childPseudonym ?? input.childId}`,
    input.periodStart && input.periodEnd
      ? `PERIOD: ${input.periodStart} to ${input.periodEnd}`
      : "",
    ``,
    `RECORDS PROVIDED (${input.records.length}):`,
    ...input.records.slice(0, 30).map(
      (r) => `- [${r.recordDate}] ${r.recordType} (${r.recordId}): ${r.recordText.slice(0, 600)}`,
    ),
    ``,
    input.knownChildContext ? `CONTEXT FROM CHILD'S FILE:\n${input.knownChildContext}\n` : "",
    `DETERMINISTIC ANALYSIS (your starting point — do not contradict):`,
    `- Overall voice-capture quality: ${deterministic.overallVoiceCaptureQuality}`,
    `- Themes present: ${deterministic.themesPresent.join(", ") || "(none)"}`,
    `- Themes absent: ${deterministic.themesAbsent.join(", ") || "(none)"}`,
    `- Direct quotes (count): ${deterministic.directQuotes.length}`,
    `- Paraphrased expressions (count): ${deterministic.paraphrasedExpressions.length}`,
    `- What child appears to want: ${deterministic.whatChildAppearsToWant.join(" / ") || "(none extracted)"}`,
    `- What child appears to need: ${deterministic.whatChildAppearsToNeed.join(" / ") || "(none extracted)"}`,
    `- What child appears to fear: ${deterministic.whatChildAppearsToFear.join(" / ") || "(none extracted)"}`,
    `- Unmet-rights signals: ${deterministic.rightsOrWishesUnmet.join(" / ") || "(none)"}`,
    ``,
    `Return ONLY a JSON object — no prose, no code fences:`,
    `{`,
    `  "narrativeDraft": string  // 6-12 sentence reflective voice summary, labelled "Cara suggested draft" at the start`,
    `  "ofstedSummary": string   // single-paragraph Ofsted-ready summary suitable for SCCIF Children's Experience evidence`,
    `}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: userMessage }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;
    const cleaned = textBlock.text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as {
      narrativeDraft?: string;
      ofstedSummary?: string;
    };
    if (!parsed.narrativeDraft || !parsed.ofstedSummary) return null;
    return {
      narrativeDraft: applyCaraPostprocessor(parsed.narrativeDraft),
      ofstedSummary: applyCaraPostprocessor(parsed.ofstedSummary),
    };
  } catch (err) {
    console.warn("[voiceOfChildSummariser] LLM enhancement failed:", err);
    return null;
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function summariseVoice(input: VoiceSummaryInput): Promise<VoiceSummary> {
  if (!input.childId || input.childId.trim().length === 0) {
    throw new Error("childId is required");
  }
  if (!Array.isArray(input.records) || input.records.length === 0) {
    throw new Error("records must be a non-empty array");
  }

  // Per-record extraction
  const allDirect: VoiceQuote[] = [];
  const allParaphrased: VoiceQuote[] = [];
  const contributions: PerRecordVoiceContribution[] = [];

  for (const record of input.records) {
    const { direct, paraphrased } = extractFromRecord(record);
    allDirect.push(...direct);
    allParaphrased.push(...paraphrased);
    contributions.push(gradeRecordVoiceCapture(record, direct, paraphrased));
  }

  // Theme presence / absence
  const themeCounts = new Map<VoiceTheme, number>();
  [...allDirect, ...allParaphrased].forEach((q) =>
    q.themeTags.forEach((t) => themeCounts.set(t, (themeCounts.get(t) ?? 0) + 1)),
  );
  const themesPresent = Array.from(themeCounts.entries())
    .filter(([t, c]) => t !== "uncategorised" && c > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);
  const allThemes = Object.keys(THEME_KEYWORDS) as VoiceTheme[];
  const themesAbsent = allThemes.filter((t) => !themesPresent.includes(t));

  // Aggregations across the whole record set
  const fullText = input.records.map((r) => r.recordText).join("\n\n");
  const wants = harvest(WANT_INDICATORS, fullText);
  const needs = harvest(NEED_INDICATORS, fullText);
  const fears = harvest(FEAR_INDICATORS, fullText);
  const unmet = harvest(UNMET_RIGHTS_INDICATORS, fullText);

  const overallQuality = aggregateOverallQuality(contributions);
  const suggestedActions = suggestActionsToStrengthenVoice(overallQuality, contributions, unmet);

  // Templated draft (LLM may overwrite the narrative below)
  const templated = buildTemplatedDraft(input, {
    themesPresent,
    themesAbsent,
    directQuotes: allDirect,
    overallQuality,
    wants,
    needs,
    fears,
    unmet,
  });

  // Confidence — bounded by quality + record count
  const baseConfidence = Math.min(0.85, 0.3 + Math.min(input.records.length, 10) * 0.05);
  const qualityAdjustment =
    overallQuality === "strong" ? 0.1 : overallQuality === "absent" ? -0.2 : 0;
  const caraConfidence = Math.max(
    0.1,
    Math.min(0.95, Math.round((baseConfidence + qualityAdjustment) * 100) / 100),
  );

  const summary: VoiceSummary = {
    childId: input.childId,
    childPseudonym: input.childPseudonym,
    generatedAt: new Date().toISOString(),
    status: "draft",
    caraLabel: "Cara suggested draft",

    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    recordsConsidered: input.records.length,

    narrativeDraft: templated.narrativeDraft,
    ofstedSummary: templated.ofstedSummary,

    themesPresent,
    themesAbsent,
    directQuotes: allDirect,
    paraphrasedExpressions: allParaphrased,

    whatChildAppearsToWant: wants,
    whatChildAppearsToNeed: needs,
    whatChildAppearsToFear: fears,
    rightsOrWishesUnmet: unmet,

    perRecordContributions: contributions,
    overallVoiceCaptureQuality: overallQuality,

    suggestedActionsToStrengthenVoice: suggestedActions,
    regulatoryLinks: REGULATORY_LINKS,

    caraConfidence,
    llmUsed: false,
    engineVersion: ENGINE_VERSION,
  };

  if (input.enableLlm !== false) {
    const enhanced = await enhanceWithLlm(input, summary);
    if (enhanced) {
      summary.narrativeDraft = enhanced.narrativeDraft;
      summary.ofstedSummary = enhanced.ofstedSummary;
      summary.llmUsed = true;
    }
  }

  return summary;
}

export { ENGINE_VERSION };
