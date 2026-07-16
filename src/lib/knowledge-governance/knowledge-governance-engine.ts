// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Governance Engine (Practice Intelligence OS §6)
//
// Cara's practice knowledge base (KB_ALL_ENTRIES) is authoritative content, but
// content alone is not governance. §6 requires every knowledge item to carry
// provenance: what KIND of evidence it is, who reviewed it, what it may be used
// for, its limitations, and when it is next due for review.
//
// The rule this engine exists to enforce, verbatim from the brief:
//   "Social media graphics, informal infographics and practitioner summaries
//    must never be treated as statutory, clinical or scientific authority
//    without review."
//
// So the engine joins each static KB entry with a mutable governance overlay
// and flags where an INFORMAL source is being relied on (KB-approved, and thus
// fed to practice engines) without a recorded review and stated limitations.
//
// Pure and deterministic: caller supplies entries, overlay records and `now`.
// No store, no AI.
// ─────────────────────────────────────────────────────────────────────────────

import type { KBEntry, KBEntryType, KBStatus } from "@/lib/cara/knowledge-base";

export type EvidenceStatus =
  | "statutory"             // primary legislation / statutory guidance
  | "regulatory"            // Ofsted / regulator guidance
  | "clinical_peer_reviewed"
  | "professional_body"     // an established framework / professional body
  | "organisational"        // this organisation's own reviewed policy
  | "practitioner_summary"  // a practitioner's blog, video, summary
  | "informal_graphic"      // social-media graphic / infographic
  | "unassessed";           // provenance not yet recorded

/** Statuses Cara may lean on as authority. */
export const AUTHORITATIVE: EvidenceStatus[] = [
  "statutory",
  "regulatory",
  "clinical_peer_reviewed",
  "professional_body",
  "organisational",
];

/** Statuses that must NEVER be treated as authority without review. */
export const INFORMAL: EvidenceStatus[] = ["practitioner_summary", "informal_graphic"];

export const EVIDENCE_LABEL: Record<EvidenceStatus, string> = {
  statutory: "Statutory",
  regulatory: "Regulatory",
  clinical_peer_reviewed: "Clinical / peer-reviewed",
  professional_body: "Professional body / framework",
  organisational: "Organisational policy",
  practitioner_summary: "Practitioner summary",
  informal_graphic: "Informal graphic / social media",
  unassessed: "Not yet assessed",
};

/** The mutable governance overlay, keyed to a static KB entry. */
export interface KnowledgeGovernanceRecord {
  entry_id: string;
  evidence_status: EvidenceStatus;
  permitted_use: string;
  limitations: string;
  reviewer: string;
  reviewed_at: string | null;
  next_review: string | null;
  version: number;
  updated_at: string;
  updated_by: string;
}

export interface GovernedEntry {
  id: string;
  title: string;
  type: KBEntryType;
  origin: string;
  kbStatus: KBStatus;
  evidenceStatus: EvidenceStatus;
  isAuthoritative: boolean;
  isInformal: boolean;
  permittedUse: string;
  limitations: string;
  reviewer: string;
  reviewedAt: string | null;
  nextReview: string | null;
  version: number;
  reviewOverdue: boolean;
  daysToReview: number | null;
}

export type KnowledgeDetectionKey =
  | "informal_source_as_authority"
  | "approved_but_unassessed"
  | "review_overdue"
  | "pending_source_unreviewed"
  | "governed_well";

export interface KnowledgeDetection {
  key: KnowledgeDetectionKey;
  tone: "prompt" | "positive";
  entryId: string;
  headline: string;
  whyShown: string;
  suggestedQuestions: string[];
}

export interface KnowledgeGovernanceSummary {
  entries: GovernedEntry[];
  detections: KnowledgeDetection[];
  counts: {
    total: number;
    authoritative: number;
    informal: number;
    unassessed: number;
    reviewOverdue: number;
  };
  byEvidence: { status: EvidenceStatus; count: number }[];
}

const DAY = 86_400_000;
function daysUntil(now: Date, iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - now.getTime()) / DAY);
}

const UNGOVERNED: Omit<KnowledgeGovernanceRecord, "entry_id"> = {
  evidence_status: "unassessed",
  permitted_use: "",
  limitations: "",
  reviewer: "",
  reviewed_at: null,
  next_review: null,
  version: 0,
  updated_at: "",
  updated_by: "",
};

export function buildKnowledgeGovernance(
  entries: KBEntry[],
  overlay: KnowledgeGovernanceRecord[],
  now: Date,
): KnowledgeGovernanceSummary {
  const byId = new Map(overlay.map((r) => [r.entry_id, r]));

  const governed: GovernedEntry[] = entries.map((e) => {
    const g = byId.get(e.id) ?? { entry_id: e.id, ...UNGOVERNED };
    const daysToReview = daysUntil(now, g.next_review);
    return {
      id: e.id,
      title: e.title,
      type: e.type,
      origin: e.origin,
      kbStatus: e.status,
      evidenceStatus: g.evidence_status,
      isAuthoritative: AUTHORITATIVE.includes(g.evidence_status),
      isInformal: INFORMAL.includes(g.evidence_status),
      permittedUse: g.permitted_use,
      limitations: g.limitations,
      reviewer: g.reviewer,
      reviewedAt: g.reviewed_at,
      nextReview: g.next_review,
      version: g.version,
      reviewOverdue: daysToReview !== null && daysToReview < 0,
      daysToReview,
    };
  });

  const detections: KnowledgeDetection[] = [];
  for (const g of governed) {
    // §6 core rule. An informal source that is KB-approved (and so is fed to the
    // practice engines) without a recorded review AND stated limitations is
    // being treated as authority it does not carry.
    if (g.kbStatus === "approved" && g.isInformal && (!g.reviewer || !g.limitations.trim())) {
      detections.push({
        key: "informal_source_as_authority",
        tone: "prompt",
        entryId: g.id,
        headline: `Informal source relied on without review: "${g.title}"`,
        whyShown:
          `This is a ${EVIDENCE_LABEL[g.evidenceStatus].toLowerCase()} (${g.origin}), it is approved for the ` +
          `practice engines to use, and it has ${!g.reviewer ? "no recorded reviewer" : "no stated limitations"}. ` +
          "Informal sources must never be treated as statutory, clinical or scientific authority without review.",
        suggestedQuestions: [
          "Who has reviewed this, and what did they conclude?",
          "What is this source good for — and what should it NOT be cited to support?",
        ],
      });
    }

    if (g.reviewOverdue) {
      detections.push({
        key: "review_overdue",
        tone: "prompt",
        entryId: g.id,
        headline: `Review overdue by ${Math.abs(g.daysToReview ?? 0)} days: "${g.title}"`,
        whyShown:
          `Its next review was ${g.nextReview}. Knowledge ages — guidance is superseded, evidence moves on. ` +
          "An out-of-date entry still feeding the engines is a governance gap.",
        suggestedQuestions: ["Is this still current, or has it been superseded?"],
      });
    }

    if (g.kbStatus === "pending_review" && g.type === "source" && g.evidenceStatus === "unassessed") {
      detections.push({
        key: "pending_source_unreviewed",
        tone: "prompt",
        entryId: g.id,
        headline: `Source awaiting review: "${g.title}"`,
        whyShown:
          "A source has been ingested but not yet reviewed or classified. It is correctly held out of the " +
          "practice engines until someone assesses its provenance.",
        suggestedQuestions: ["Is this source worth keeping, and at what evidence weight?"],
      });
    }

    if (
      g.kbStatus === "approved" &&
      g.evidenceStatus !== "unassessed" &&
      g.reviewer &&
      !g.reviewOverdue &&
      (g.isAuthoritative || g.limitations.trim())
    ) {
      detections.push({
        key: "governed_well",
        tone: "positive",
        entryId: g.id,
        headline: `Governed: "${g.title}"`,
        whyShown:
          `Classified as ${EVIDENCE_LABEL[g.evidenceStatus].toLowerCase()}, reviewed by ${g.reviewer}` +
          `${g.nextReview ? `, next review ${g.nextReview}` : ""}.`,
        suggestedQuestions: [],
      });
    }
  }

  // One aggregate prompt for unclassified content, not one card per entry —
  // on a first governance run most of the KB is unassessed, and 30 identical
  // cards is noise. The count is the signal.
  const unassessedApproved = governed.filter((g) => g.kbStatus === "approved" && g.evidenceStatus === "unassessed");
  if (unassessedApproved.length > 0) {
    detections.push({
      key: "approved_but_unassessed",
      tone: "prompt",
      entryId: unassessedApproved[0].id,
      headline: `${unassessedApproved.length} approved entr${unassessedApproved.length === 1 ? "y is" : "ies are"} not yet classified`,
      whyShown:
        "These are approved for the practice engines to use, but nobody has recorded what KIND of evidence they " +
        "are — so Cara cannot weigh them. Statutory guidance and a practitioner's blog are not cited with the same authority.",
      suggestedQuestions: ["Which entries most need their provenance recorded first — the ones the engines lean on most?"],
    });
  }

  const count = (pred: (g: GovernedEntry) => boolean) => governed.filter(pred).length;
  const evidenceOrder: EvidenceStatus[] = [
    "statutory", "regulatory", "clinical_peer_reviewed", "professional_body",
    "organisational", "practitioner_summary", "informal_graphic", "unassessed",
  ];

  return {
    entries: governed,
    detections,
    counts: {
      total: governed.length,
      authoritative: count((g) => g.isAuthoritative),
      informal: count((g) => g.isInformal),
      unassessed: count((g) => g.evidenceStatus === "unassessed"),
      reviewOverdue: count((g) => g.reviewOverdue),
    },
    byEvidence: evidenceOrder
      .map((status) => ({ status, count: count((g) => g.evidenceStatus === status) }))
      .filter((x) => x.count > 0),
  };
}

/** Governance write guard: an informal source may not be recorded as reviewed
 *  without stating its limitations — the §6 discipline. Returns the reason a
 *  save is invalid, or null to proceed. */
export function validateGovernance(record: {
  evidence_status: EvidenceStatus;
  reviewer: string;
  limitations: string;
}): string | null {
  if (INFORMAL.includes(record.evidence_status) && record.reviewer.trim() && !record.limitations.trim()) {
    return "An informal source can be kept, but record what it must NOT be cited to support — its limitations.";
  }
  return null;
}
