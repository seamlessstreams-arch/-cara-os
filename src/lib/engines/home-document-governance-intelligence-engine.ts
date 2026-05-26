// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DOCUMENT GOVERNANCE INTELLIGENCE ENGINE
// Home-level: analyses document management, expiry tracking, read receipt
// compliance, version control, and categorisation to assess governance.
// CHR 2015 Reg 13 (Leadership & Management). SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface DocumentInput {
  id: string;
  category: string;
  requires_read_sign: boolean;
  expiry_date: string | null;        // null = no expiry
  version: number;
  has_linked_child: boolean;
  has_linked_incident: boolean;
  tags: string[];
  created_date: string;
  updated_date: string;
}

export interface ReadReceiptInput {
  document_id: string;
  staff_id: string;
  has_signed: boolean;
}

export interface HomeDocumentInput {
  today: string;
  documents: DocumentInput[];
  read_receipts: ReadReceiptInput[];
  total_staff: number;               // active staff count for sign-off compliance
}

// ── Output Types ────────────────────────────────────────────────────────────

export type DocumentRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DocumentInventoryProfile {
  total_documents: number;
  requiring_sign: number;
  with_expiry: number;
  expired_count: number;
  expiring_soon_count: number;       // within 30 days
  avg_version: number;
  category_count: number;
}

export interface ReadComplianceProfile {
  documents_requiring_sign: number;
  avg_read_rate: number;             // avg % of staff who read each doc
  avg_sign_rate: number;             // avg % of staff who signed each doc
  fully_read_count: number;          // docs where all staff read
  unread_count: number;              // docs with zero reads
}

export interface GovernanceProfile {
  child_linked_rate: number;         // % of docs linked to a child
  incident_linked_rate: number;      // % of docs linked to an incident
  mandatory_tag_count: number;       // docs tagged as mandatory
  mandatory_read_rate: number;       // avg read rate for mandatory docs
}

export interface VersionProfile {
  multi_version_count: number;       // docs with version > 1
  single_version_count: number;
  recently_updated_count: number;    // updated in last 30 days
  stale_count: number;               // not updated in > 180 days
}

export interface DocumentInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface DocumentRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeDocumentResult {
  document_rating: DocumentRating;
  document_score: number;
  headline: string;
  inventory_profile: DocumentInventoryProfile;
  read_compliance_profile: ReadComplianceProfile;
  governance_profile: GovernanceProfile;
  version_profile: VersionProfile;
  strengths: string[];
  concerns: string[];
  recommendations: DocumentRecommendation[];
  insights: DocumentInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): DocumentRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeDocumentGovernance(
  input: HomeDocumentInput,
): HomeDocumentResult {
  const { today, documents, read_receipts, total_staff } = input;

  // Insufficient data
  if (documents.length === 0) {
    return {
      document_rating: "insufficient_data",
      document_score: 0,
      headline: "No document records found — document management data not available.",
      inventory_profile: emptyInventoryProfile(),
      read_compliance_profile: emptyReadProfile(),
      governance_profile: emptyGovernanceProfile(),
      version_profile: emptyVersionProfile(),
      strengths: [],
      concerns: ["No document records — Ofsted expects a robust document management system to evidence policies, procedures, and governance."],
      recommendations: [{ rank: 1, recommendation: "Establish a document management system with version control, expiry tracking, and mandatory read receipts for all staff.", urgency: "immediate", regulatory_ref: "Reg 13" }],
      insights: [{ text: "No document records found. Without a document management system, the home cannot evidence that staff have read and understood critical policies, procedures, and care plans. Ofsted will assess document governance as part of leadership and management.", severity: "critical" }],
    };
  }

  // ── Date calculations ─────────────────────────────────────────────
  const soonCutoff = new Date(today);
  soonCutoff.setDate(soonCutoff.getDate() + 30);
  const soonCutoffStr = soonCutoff.toISOString().slice(0, 10);

  const staleCutoff = new Date(today);
  staleCutoff.setDate(staleCutoff.getDate() - 180);
  const staleCutoffStr = staleCutoff.toISOString().slice(0, 10);

  const recentCutoff = new Date(today);
  recentCutoff.setDate(recentCutoff.getDate() - 30);
  const recentCutoffStr = recentCutoff.toISOString().slice(0, 10);

  // ── Inventory Profile ─────────────────────────────────────────────
  const requireSign = documents.filter(d => d.requires_read_sign);
  const withExpiry = documents.filter(d => d.expiry_date !== null);
  const expired = withExpiry.filter(d => d.expiry_date! < today);
  const expiringSoon = withExpiry.filter(d =>
    d.expiry_date! >= today && d.expiry_date! <= soonCutoffStr
  );
  const totalVersion = documents.reduce((s, d) => s + d.version, 0);
  const avgVersion = documents.length > 0
    ? Math.round((totalVersion / documents.length) * 10) / 10
    : 0;

  const categories = new Set(documents.map(d => d.category));

  const inventoryProfile: DocumentInventoryProfile = {
    total_documents: documents.length,
    requiring_sign: requireSign.length,
    with_expiry: withExpiry.length,
    expired_count: expired.length,
    expiring_soon_count: expiringSoon.length,
    avg_version: avgVersion,
    category_count: categories.size,
  };

  // ── Read Compliance Profile ───────────────────────────────────────
  // For each doc that requires read sign, compute read/sign rates
  const readRates: number[] = [];
  const signRates: number[] = [];
  let fullyReadCount = 0;
  let unreadCount = 0;

  for (const doc of requireSign) {
    const receipts = read_receipts.filter(r => r.document_id === doc.id);
    const readCount = receipts.length;
    const signedCount = receipts.filter(r => r.has_signed).length;

    const readRate = total_staff > 0 ? pct(readCount, total_staff) : 0;
    const signRate = total_staff > 0 ? pct(signedCount, total_staff) : 0;

    readRates.push(readRate);
    signRates.push(signRate);

    if (total_staff > 0 && readCount >= total_staff) fullyReadCount++;
    if (readCount === 0) unreadCount++;
  }

  const avgReadRate = readRates.length > 0
    ? Math.round(readRates.reduce((a, b) => a + b, 0) / readRates.length)
    : 0;
  const avgSignRate = signRates.length > 0
    ? Math.round(signRates.reduce((a, b) => a + b, 0) / signRates.length)
    : 0;

  const readComplianceProfile: ReadComplianceProfile = {
    documents_requiring_sign: requireSign.length,
    avg_read_rate: avgReadRate,
    avg_sign_rate: avgSignRate,
    fully_read_count: fullyReadCount,
    unread_count: unreadCount,
  };

  // ── Governance Profile ────────────────────────────────────────────
  const childLinkedCount = documents.filter(d => d.has_linked_child).length;
  const incidentLinkedCount = documents.filter(d => d.has_linked_incident).length;
  const mandatoryDocs = documents.filter(d => d.tags.includes("mandatory"));

  // Mandatory read rate
  const mandatoryReadRates: number[] = [];
  for (const doc of mandatoryDocs) {
    if (doc.requires_read_sign && total_staff > 0) {
      const receipts = read_receipts.filter(r => r.document_id === doc.id);
      mandatoryReadRates.push(pct(receipts.length, total_staff));
    }
  }
  const mandatoryReadRate = mandatoryReadRates.length > 0
    ? Math.round(mandatoryReadRates.reduce((a, b) => a + b, 0) / mandatoryReadRates.length)
    : 0;

  const governanceProfile: GovernanceProfile = {
    child_linked_rate: pct(childLinkedCount, documents.length),
    incident_linked_rate: pct(incidentLinkedCount, documents.length),
    mandatory_tag_count: mandatoryDocs.length,
    mandatory_read_rate: mandatoryReadRate,
  };

  // ── Version Profile ───────────────────────────────────────────────
  const multiVersion = documents.filter(d => d.version > 1);
  const singleVersion = documents.filter(d => d.version === 1);
  const recentlyUpdated = documents.filter(d => d.updated_date >= recentCutoffStr);
  const stale = documents.filter(d => d.updated_date < staleCutoffStr);

  const versionProfile: VersionProfile = {
    multi_version_count: multiVersion.length,
    single_version_count: singleVersion.length,
    recently_updated_count: recentlyUpdated.length,
    stale_count: stale.length,
  };

  // ── Scoring ───────────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52+28 = 80
  let score = 52;

  // 1. Expired documents (±5)
  if (withExpiry.length > 0) {
    if (expired.length === 0) score += 5;
    else if (expired.length === 1) score += 1;
    else score -= 4;
  } else {
    // No expiry tracking at all — not necessarily bad, small bonus
    score += 1;
  }

  // 2. Read compliance — avg read rate (±4)
  if (requireSign.length > 0) {
    if (avgReadRate >= 80) score += 4;
    else if (avgReadRate >= 50) score += 1;
    else if (avgReadRate >= 30) score -= 1;
    else score -= 3;
  }

  // 3. Sign compliance — avg sign rate (±3)
  if (requireSign.length > 0) {
    if (avgSignRate >= 80) score += 3;
    else if (avgSignRate >= 50) score += 1;
    else score -= 2;
  }

  // 4. Mandatory read rate (±4)
  if (mandatoryReadRates.length > 0) {
    if (mandatoryReadRate >= 80) score += 4;
    else if (mandatoryReadRate >= 50) score += 1;
    else score -= 3;
  }

  // 5. Version control maturity (±3)
  const multiVersionRate = pct(multiVersion.length, documents.length);
  if (multiVersionRate >= 50) score += 3;
  else if (multiVersionRate >= 25) score += 1;
  else score -= 1;

  // 6. Staleness (±3)
  const staleRate = pct(stale.length, documents.length);
  if (staleRate === 0) score += 3;
  else if (staleRate <= 20) score += 1;
  else score -= 2;

  // 7. Category diversity (±3)
  if (categories.size >= 5) score += 3;
  else if (categories.size >= 3) score += 1;
  else score -= 1;

  // 8. Expiring soon awareness (±3)
  if (withExpiry.length > 0 && expired.length === 0 && expiringSoon.length > 0) {
    // Documents approaching expiry but none expired — proactive management
    score += 3;
  } else if (expired.length === 0 && expiringSoon.length === 0 && withExpiry.length > 0) {
    // All comfortably within date
    score += 3;
  } else if (expired.length > 0) {
    score -= 1; // Already penalised in #1, small additional
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (expired.length === 0 && withExpiry.length > 0) strengths.push("No expired documents — all documents within their validity period.");
  if (avgReadRate >= 80 && requireSign.length > 0) strengths.push(`${avgReadRate}% average read rate — staff are reading required documents.`);
  if (avgSignRate >= 80 && requireSign.length > 0) strengths.push(`${avgSignRate}% average sign-off rate — strong evidence of document acknowledgement.`);
  if (mandatoryReadRate >= 80 && mandatoryReadRates.length > 0) strengths.push(`${mandatoryReadRate}% mandatory document read rate — critical documents are being read by staff.`);
  if (multiVersionRate >= 50) strengths.push(`${multiVersionRate}% of documents have multiple versions — evidence of active review and update.`);
  if (stale.length === 0) strengths.push("No stale documents — all documents updated within the last 6 months.");
  if (categories.size >= 5) strengths.push(`${categories.size} document categories — comprehensive document library covering multiple governance areas.`);

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (expired.length > 0) concerns.push(`${expired.length} document${expired.length > 1 ? "s" : ""} expired — out-of-date documents may contain superseded guidance.`);
  if (avgReadRate < 50 && requireSign.length > 0) concerns.push(`Average read rate is only ${avgReadRate}% — most staff have not read required documents.`);
  if (unreadCount > 0) concerns.push(`${unreadCount} document${unreadCount > 1 ? "s" : ""} requiring sign-off ${unreadCount > 1 ? "have" : "has"} not been read by any staff member.`);
  if (mandatoryReadRate < 50 && mandatoryReadRates.length > 0) concerns.push(`Only ${mandatoryReadRate}% mandatory document read rate — staff may not be aware of critical policies.`);
  if (stale.length > 0) concerns.push(`${stale.length} document${stale.length > 1 ? "s" : ""} not updated in over 6 months — may need review.`);
  if (expiringSoon.length > 0) concerns.push(`${expiringSoon.length} document${expiringSoon.length > 1 ? "s" : ""} expiring within 30 days — renewal action needed.`);

  // ── Recommendations ───────────────────────────────────────────────
  const recs: DocumentRecommendation[] = [];
  let rank = 1;

  if (expired.length > 0) {
    recs.push({ rank: rank++, recommendation: `Renew ${expired.length} expired document${expired.length > 1 ? "s" : ""} immediately — expired documents must not be relied upon.`, urgency: "immediate", regulatory_ref: "Reg 13" });
  }
  if (avgReadRate < 50 && requireSign.length > 0) {
    recs.push({ rank: rank++, recommendation: "Implement a mandatory read programme — ensure all staff read and sign off on required documents within 7 days of publication.", urgency: "immediate", regulatory_ref: "Reg 13" });
  }
  if (mandatoryReadRate < 50 && mandatoryReadRates.length > 0) {
    recs.push({ rank: rank++, recommendation: "Prioritise mandatory document read compliance — these are the policies most likely to be checked at inspection.", urgency: "soon", regulatory_ref: "Reg 13" });
  }
  if (stale.length >= 3) {
    recs.push({ rank: rank++, recommendation: `Review ${stale.length} stale documents — establish a regular document review cycle to keep guidance current.`, urgency: "soon", regulatory_ref: "Reg 13" });
  }
  if (expiringSoon.length > 0) {
    recs.push({ rank: rank++, recommendation: `Plan renewal for ${expiringSoon.length} document${expiringSoon.length > 1 ? "s" : ""} expiring within 30 days.`, urgency: "planned", regulatory_ref: "Reg 13" });
  }

  // ── Insights ──────────────────────────────────────────────────────
  const insights: DocumentInsight[] = [];

  if (expired.length === 0 && avgReadRate >= 80 && mandatoryReadRate >= 80) {
    insights.push({ text: `Document governance is exemplary — no expired documents, ${avgReadRate}% read rate, and ${mandatoryReadRate}% mandatory compliance. Ofsted will see a home where staff are well-informed and critical policies are actively maintained and communicated.`, severity: "positive" });
  }
  if (expired.length > 0) {
    insights.push({ text: `${expired.length} document${expired.length > 1 ? "s have" : " has"} expired. Expired documents may contain outdated safeguarding or medication procedures. Ofsted will check that key policies are current — expired documents suggest a governance gap.`, severity: "critical" });
  }
  if (avgReadRate < 30 && requireSign.length > 0) {
    insights.push({ text: `Average read rate is only ${avgReadRate}%. When staff don't read required documents, there is no assurance they understand the home's policies and procedures. This is a fundamental governance failure that Ofsted will identify.`, severity: "critical" });
  }
  if (mandatoryReadRate >= 80 && mandatoryReadRates.length > 0 && avgReadRate < 80) {
    insights.push({ text: `Mandatory document compliance is strong at ${mandatoryReadRate}%, even though overall read rate is lower. This suggests the home is prioritising critical documents effectively — continue to extend this to all required documents.`, severity: "positive" });
  }
  if (stale.length > 0 && multiVersion.length > 0) {
    insights.push({ text: `${stale.length} documents not updated in 6+ months alongside ${multiVersion.length} actively versioned documents. This mixed picture suggests some areas of the document library are actively managed while others have been neglected.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding document governance — no expired documents, ${avgReadRate}% read compliance, and ${categories.size} categories managed.`;
  } else if (rating === "good") {
    headline = `Good document management — most documents current with minor gaps in read compliance.`;
  } else if (rating === "adequate") {
    headline = "Adequate document governance — expired documents or low read compliance need addressing.";
  } else {
    headline = "Document governance is inadequate — expired documents, poor read compliance, or limited document management.";
  }

  return {
    document_rating: rating,
    document_score: score,
    headline,
    inventory_profile: inventoryProfile,
    read_compliance_profile: readComplianceProfile,
    governance_profile: governanceProfile,
    version_profile: versionProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ──────────────────────────────────────────────────────────

function emptyInventoryProfile(): DocumentInventoryProfile {
  return {
    total_documents: 0, requiring_sign: 0, with_expiry: 0,
    expired_count: 0, expiring_soon_count: 0, avg_version: 0, category_count: 0,
  };
}

function emptyReadProfile(): ReadComplianceProfile {
  return {
    documents_requiring_sign: 0, avg_read_rate: 0, avg_sign_rate: 0,
    fully_read_count: 0, unread_count: 0,
  };
}

function emptyGovernanceProfile(): GovernanceProfile {
  return {
    child_linked_rate: 0, incident_linked_rate: 0,
    mandatory_tag_count: 0, mandatory_read_rate: 0,
  };
}

function emptyVersionProfile(): VersionProfile {
  return {
    multi_version_count: 0, single_version_count: 0,
    recently_updated_count: 0, stale_count: 0,
  };
}
