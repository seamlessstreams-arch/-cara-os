// ══════════════════════════════════════════════════════════════════════════════
// CARA — POLICY GUIDANCE ENGINE (prompt 1 §12)
//
// Answers "what does our policy say about X?" ONLY from the home's APPROVED
// internal policies — never the web, never an LLM, never general memory.
// Deterministic token-overlap retrieval → a short answer + steps + the source
// document + statutory basis + last-reviewed + a confidence status. If no
// approved policy covers it, CARA says so and routes to a manager/policy owner
// rather than guessing.
// ══════════════════════════════════════════════════════════════════════════════

export const POLICY_GUIDANCE_VERSION = "1.0.0";

export interface PolicyDoc {
  id: string;
  title: string;
  category: string;
  description?: string;
  keyPoints?: string[];
  statutoryBasis?: string;
  linkedStandard?: string;
  status?: string; // "current" | "due_review" | ...
  lastReviewed?: string;
  nextReviewDate?: string;
}

export type PolicyConfidence = "found" | "partial" | "none";

export interface PolicyGuidanceResult {
  status: PolicyConfidence;
  answer: string;
  steps: string[];
  source?: {
    id: string;
    title: string;
    category: string;
    statutoryBasis?: string;
    linkedStandard?: string;
    lastReviewed?: string;
    reviewDue: boolean;
  };
  version: string;
}

const STOPWORDS = new Set([
  "the", "and", "for", "our", "what", "does", "say", "about", "how", "can", "when", "should", "need", "with", "that", "this", "there", "have", "has", "are", "was", "who", "why", "which", "into", "from", "your", "you", "policy", "policies", "procedure", "guidance", "cara", "home", "staff", "child", "children",
]);

function tokens(text: string): Set<string> {
  return new Set(
    (text || "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 4 && !STOPWORDS.has(t))
  );
}

function policyText(p: PolicyDoc): string {
  return [p.title, p.category.replace(/_/g, " "), p.description ?? "", ...(p.keyPoints ?? []), p.linkedStandard ?? ""].join(" ");
}

/** Deterministic retrieval: answer a policy question from approved policies only. */
export function answerPolicyQuestion(question: string, policies: PolicyDoc[]): PolicyGuidanceResult {
  const qTokens = tokens(question);
  // Only APPROVED policies are eligible (draft/retired excluded); due_review is
  // still approved but flagged.
  const approved = policies.filter((p) => (p.status ?? "current") === "current" || (p.status ?? "") === "due_review");

  let best: { p: PolicyDoc; score: number } | null = null;
  for (const p of approved) {
    const pTokens = policyText(p);
    const pSet = tokens(pTokens);
    let score = 0;
    for (const t of qTokens) if (pSet.has(t)) score++;
    if (!best || score > best.score) best = { p, score };
  }

  if (!best || best.score === 0) {
    return {
      status: "none",
      answer:
        "I can't find an approved CARA policy answer for this, so I won't guess. Please check with a manager or the policy owner, or search the policy library directly.",
      steps: [],
      version: POLICY_GUIDANCE_VERSION,
    };
  }

  const p = best.p;
  const reviewDue = (p.status ?? "") === "due_review" || (!!p.nextReviewDate && p.nextReviewDate < (p.lastReviewed ?? ""));
  const confidence: PolicyConfidence = best.score >= 2 ? "found" : "partial";
  const lead =
    confidence === "found"
      ? `Your "${p.title}" policy applies here.`
      : `The closest approved policy is "${p.title}" — check it covers your exact question.`;
  const reviewNote = reviewDue ? " ⚠ This policy is flagged for review, so confirm it reflects current practice." : "";

  return {
    status: confidence,
    answer: `${lead}${reviewNote}`,
    steps: (p.keyPoints ?? []).slice(0, 6),
    source: {
      id: p.id,
      title: p.title,
      category: p.category,
      statutoryBasis: p.statutoryBasis,
      linkedStandard: p.linkedStandard,
      lastReviewed: p.lastReviewed,
      reviewDue,
    },
    version: POLICY_GUIDANCE_VERSION,
  };
}
