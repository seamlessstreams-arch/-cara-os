// ══════════════════════════════════════════════════════════════════════════════
// CARA — DOCUMENT COMPLIANCE INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses documents, read receipts, and signing compliance to surface policy
// adherence, version control, expiry management, and staff engagement patterns.
//
// Regulatory: Reg 35 (policies and procedures), Reg 37 (notification),
// Schedule 1 (statement of purpose), SCCIF: "Does the home have clear policies
// that staff understand and follow?"
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export type DocumentCategory =
  | "policy"
  | "procedure"
  | "risk_assessment"
  | "care_plan"
  | "placement_plan"
  | "missing_protocol"
  | "behaviour_support"
  | "health_plan"
  | "education_plan"
  | "reg44_report"
  | "reg45_report"
  | "ofsted_correspondence"
  | "supervision_record"
  | "training_certificate"
  | "dbs_certificate"
  | "contract"
  | "template"
  | "other";

export interface DocumentInput {
  id: string;
  title: string;
  category: DocumentCategory;
  version: number;
  requires_read_sign: boolean;
  expiry_date: string | null;
  tags: string[];
  linked_child_id: string | null;
  linked_staff_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReadReceiptInput {
  id: string;
  document_id: string;
  staff_id: string;
  read_at: string;
  signed_at: string | null;
}

export interface StaffRef {
  id: string;
  name: string;
  is_active: boolean;
}

export interface DocumentComplianceIntelligenceInput {
  documents: DocumentInput[];
  read_receipts: ReadReceiptInput[];
  active_staff: StaffRef[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface DocumentOverview {
  total_documents: number;
  documents_requiring_sign: number;
  documents_expiring_soon: number;     // within 90 days
  documents_expired: number;
  avg_sign_off_rate: number;           // pct across all docs requiring sign
  fully_signed_documents: number;      // all active staff have signed
  unsigned_documents: number;          // docs requiring sign with 0 receipts
  total_read_receipts: number;
  categories_count: number;
  mandatory_document_count: number;    // tagged "mandatory"
  mandatory_sign_off_rate: number;     // pct for mandatory docs only
}

export interface DocumentProfile {
  document_id: string;
  title: string;
  category: DocumentCategory;
  version: number;
  requires_read_sign: boolean;
  expiry_date: string | null;
  days_until_expiry: number | null;
  is_expired: boolean;
  is_mandatory: boolean;
  read_count: number;
  signed_count: number;
  sign_off_rate: number;               // pct of active staff who signed
  outstanding_staff: string[];         // names of active staff who haven't signed
  risk_flags: string[];
}

export interface CategoryAnalysis {
  category: DocumentCategory;
  total: number;
  requiring_sign: number;
  avg_sign_off_rate: number;
  expired_count: number;
  expiring_soon_count: number;
}

export interface DocumentAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraDocumentInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface DocumentComplianceIntelligenceResult {
  overview: DocumentOverview;
  document_profiles: DocumentProfile[];
  category_analysis: CategoryAnalysis[];
  alerts: DocumentAlert[];
  insights: CaraDocumentInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function daysUntil(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000,
  );
}

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// Key policy categories — these are regulatory-critical
const REGULATORY_CATEGORIES = new Set<DocumentCategory>([
  "policy",
  "procedure",
  "missing_protocol",
  "behaviour_support",
  "risk_assessment",
  "care_plan",
  "health_plan",
  "placement_plan",
]);

// ── Main Computation ────────────────────────────────────────────────────────

export function computeDocumentComplianceIntelligence(
  input: DocumentComplianceIntelligenceInput,
): DocumentComplianceIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { documents, read_receipts, active_staff } = input;

  const activeStaffIds = new Set(active_staff.map((s) => s.id));
  const staffNameMap = new Map(active_staff.map((s) => [s.id, s.name]));
  const activeStaffCount = active_staff.length;

  // ── Index maps ─────────────────────────────────────────────────────────
  const receiptsByDoc = new Map<string, ReadReceiptInput[]>();
  for (const r of read_receipts) {
    const arr = receiptsByDoc.get(r.document_id) ?? [];
    arr.push(r);
    receiptsByDoc.set(r.document_id, arr);
  }

  // ── Document profiles ─────────────────────────────────────────────────
  const document_profiles: DocumentProfile[] = documents.map((d) => {
    const receipts = receiptsByDoc.get(d.id) ?? [];
    // Only count active staff receipts
    const activeReceipts = receipts.filter((r) => activeStaffIds.has(r.staff_id));
    const readCount = activeReceipts.length;
    const signedCount = activeReceipts.filter((r) => r.signed_at !== null).length;

    const expiryDays = d.expiry_date ? daysUntil(today, d.expiry_date) : null;
    const isExpired = expiryDays !== null && expiryDays < 0;
    const isMandatory = d.tags.includes("mandatory");

    const signOffRate =
      d.requires_read_sign && activeStaffCount > 0
        ? Math.round((signedCount / activeStaffCount) * 100)
        : d.requires_read_sign
          ? 100
          : 0; // not applicable

    // Outstanding staff (who haven't signed but should)
    const signedStaffIds = new Set(
      activeReceipts.filter((r) => r.signed_at !== null).map((r) => r.staff_id),
    );
    const outstandingStaff: string[] = [];
    if (d.requires_read_sign) {
      for (const s of active_staff) {
        if (!signedStaffIds.has(s.id)) {
          outstandingStaff.push(s.name);
        }
      }
    }

    // Risk flags
    const riskFlags: string[] = [];
    if (isExpired) riskFlags.push("Document expired");
    if (expiryDays !== null && expiryDays >= 0 && expiryDays <= 30) {
      riskFlags.push("Expiring within 30 days");
    }
    if (d.requires_read_sign && signedCount === 0 && activeStaffCount > 0) {
      riskFlags.push("No staff have signed");
    }
    if (d.requires_read_sign && signOffRate < 50 && signedCount > 0 && activeStaffCount > 0) {
      riskFlags.push("Less than 50% sign-off");
    }
    if (isExpired && REGULATORY_CATEGORIES.has(d.category)) {
      riskFlags.push("Expired regulatory document");
    }
    if (isMandatory && d.requires_read_sign && outstandingStaff.length > 0) {
      riskFlags.push("Mandatory — not all staff signed");
    }

    return {
      document_id: d.id,
      title: d.title,
      category: d.category,
      version: d.version,
      requires_read_sign: d.requires_read_sign,
      expiry_date: d.expiry_date,
      days_until_expiry: expiryDays,
      is_expired: isExpired,
      is_mandatory: isMandatory,
      read_count: readCount,
      signed_count: signedCount,
      sign_off_rate: signOffRate,
      outstanding_staff: outstandingStaff,
      risk_flags: riskFlags,
    };
  });

  // ── Overview calculations ──────────────────────────────────────────────
  const docsRequiringSign = documents.filter((d) => d.requires_read_sign);
  const signRates = document_profiles
    .filter((dp) => dp.requires_read_sign)
    .map((dp) => dp.sign_off_rate);
  const avgSignOffRate = Math.round(average(signRates));

  const fullySigned = document_profiles.filter(
    (dp) => dp.requires_read_sign && dp.sign_off_rate === 100,
  ).length;
  const unsignedDocs = document_profiles.filter(
    (dp) => dp.requires_read_sign && dp.signed_count === 0 && activeStaffCount > 0,
  ).length;

  const expiringSoon = document_profiles.filter(
    (dp) => dp.days_until_expiry !== null && dp.days_until_expiry >= 0 && dp.days_until_expiry <= 90,
  ).length;
  const expired = document_profiles.filter((dp) => dp.is_expired).length;

  const mandatoryDocs = document_profiles.filter((dp) => dp.is_mandatory && dp.requires_read_sign);
  const mandatorySignRates = mandatoryDocs.map((dp) => dp.sign_off_rate);
  const mandatorySignOffRate = Math.round(average(mandatorySignRates));

  const categories = new Set(documents.map((d) => d.category));

  const overview: DocumentOverview = {
    total_documents: documents.length,
    documents_requiring_sign: docsRequiringSign.length,
    documents_expiring_soon: expiringSoon,
    documents_expired: expired,
    avg_sign_off_rate: avgSignOffRate,
    fully_signed_documents: fullySigned,
    unsigned_documents: unsignedDocs,
    total_read_receipts: read_receipts.length,
    categories_count: categories.size,
    mandatory_document_count: mandatoryDocs.length,
    mandatory_sign_off_rate: mandatorySignOffRate,
  };

  // ── Category analysis ──────────────────────────────────────────────────
  const catMap = new Map<DocumentCategory, DocumentProfile[]>();
  for (const dp of document_profiles) {
    const arr = catMap.get(dp.category) ?? [];
    arr.push(dp);
    catMap.set(dp.category, arr);
  }

  const category_analysis: CategoryAnalysis[] = [...catMap.entries()]
    .map(([category, profiles]) => {
      const requiring = profiles.filter((p) => p.requires_read_sign);
      const rates = requiring.map((p) => p.sign_off_rate);
      return {
        category,
        total: profiles.length,
        requiring_sign: requiring.length,
        avg_sign_off_rate: Math.round(average(rates)),
        expired_count: profiles.filter((p) => p.is_expired).length,
        expiring_soon_count: profiles.filter(
          (p) => p.days_until_expiry !== null && p.days_until_expiry >= 0 && p.days_until_expiry <= 90,
        ).length,
      };
    })
    .sort((a, b) => a.avg_sign_off_rate - b.avg_sign_off_rate); // worst compliance first

  // ── Alerts ────────────────────────────────────────────────────────────
  const alerts: DocumentAlert[] = [];

  // Critical: expired regulatory documents
  const expiredRegulatory = document_profiles.filter(
    (dp) => dp.is_expired && REGULATORY_CATEGORIES.has(dp.category),
  );
  if (expiredRegulatory.length > 0) {
    const titles = expiredRegulatory.map((dp) => dp.title).join(", ");
    alerts.push({
      severity: "critical",
      message: `${expiredRegulatory.length} regulatory document(s) expired: ${titles}. Expired policies and procedures are a direct breach of Reg 35. Ofsted inspectors will check that all policies are current and accessible.`,
    });
  }

  // Critical: mandatory docs with no sign-off
  const mandatoryUnsigned = document_profiles.filter(
    (dp) => dp.is_mandatory && dp.requires_read_sign && dp.signed_count === 0 && activeStaffCount > 0,
  );
  if (mandatoryUnsigned.length > 0) {
    const titles = mandatoryUnsigned.map((dp) => dp.title).join(", ");
    alerts.push({
      severity: "critical",
      message: `${mandatoryUnsigned.length} mandatory document(s) with zero staff sign-off: ${titles}. Staff must read and acknowledge mandatory documents. This is a significant evidence gap.`,
    });
  }

  // High: any expired document (non-regulatory)
  const expiredOther = document_profiles.filter(
    (dp) => dp.is_expired && !REGULATORY_CATEGORIES.has(dp.category),
  );
  if (expiredOther.length > 0) {
    alerts.push({
      severity: "high",
      message: `${expiredOther.length} document(s) have expired. Review and update or archive expired documents to maintain a clean document register.`,
    });
  }

  // High: docs requiring sign with <50% sign-off
  const lowSignOff = document_profiles.filter(
    (dp) => dp.requires_read_sign && dp.sign_off_rate < 50 && dp.sign_off_rate > 0,
  );
  if (lowSignOff.length > 0) {
    const titles = lowSignOff.map((dp) => `${dp.title} (${dp.sign_off_rate}%)`).join(", ");
    alerts.push({
      severity: "high",
      message: `${lowSignOff.length} document(s) with less than 50% staff sign-off: ${titles}. Chase outstanding staff and log completion.`,
    });
  }

  // Medium: documents expiring within 30 days
  const expiringSoon30 = document_profiles.filter(
    (dp) => dp.days_until_expiry !== null && dp.days_until_expiry >= 0 && dp.days_until_expiry <= 30,
  );
  if (expiringSoon30.length > 0) {
    const titles = expiringSoon30.map((dp) => `${dp.title} (${dp.days_until_expiry}d)`).join(", ");
    alerts.push({
      severity: "medium",
      message: `${expiringSoon30.length} document(s) expiring within 30 days: ${titles}. Begin review and update process now to avoid lapses.`,
    });
  }

  // Medium: documents expiring within 31-90 days
  const expiring31to90 = document_profiles.filter(
    (dp) => dp.days_until_expiry !== null && dp.days_until_expiry > 30 && dp.days_until_expiry <= 90,
  );
  if (expiring31to90.length > 0) {
    alerts.push({
      severity: "low",
      message: `${expiring31to90.length} document(s) expiring within 31–90 days. Schedule review dates in advance.`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraDocumentInsight[] = [];

  // Critical: expired regulatory docs
  if (expiredRegulatory.length > 0) {
    insights.push({
      severity: "critical",
      text: `${expiredRegulatory.length} regulatory document(s) have expired. Under SCCIF, inspectors assess "Are the home's policies up to date and effectively implemented?" — expired documents directly undermine this judgement.`,
    });
  }

  // Warning: low overall sign-off rate
  if (avgSignOffRate < 80 && docsRequiringSign.length > 0) {
    insights.push({
      severity: "warning",
      text: `Average document sign-off rate is ${avgSignOffRate}%. Staff must read and sign all required documents. A strong home evidences that every member of staff has read and understood the policies that govern their practice.`,
    });
  }

  // Warning: mandatory docs not fully signed
  if (mandatoryDocs.length > 0 && mandatorySignOffRate < 100) {
    insights.push({
      severity: "warning",
      text: `Mandatory document sign-off rate is ${mandatorySignOffRate}%. Mandatory documents are the foundation of safe practice — every staff member must sign. Chase outstanding sign-offs as a priority.`,
    });
  }

  // Warning: expiring soon
  if (expiringSoon > 0) {
    insights.push({
      severity: "warning",
      text: `${expiringSoon} document(s) expiring within 90 days. Proactive review scheduling prevents policy lapses. Ofsted will check that policies are current and reviewed regularly.`,
    });
  }

  // Positive: all docs fully signed
  if (fullySigned === docsRequiringSign.length && docsRequiringSign.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${docsRequiringSign.length} documents requiring sign-off have been signed by every active staff member. This demonstrates excellent policy awareness and engagement — a key strength under SCCIF.`,
    });
  }

  // Positive: no expired documents
  if (expired === 0 && documents.length > 0) {
    insights.push({
      severity: "positive",
      text: `No expired documents. The document register is fully current — this evidences proactive governance and compliance management under Reg 35.`,
    });
  }

  // Positive: high mandatory compliance
  if (mandatorySignOffRate === 100 && mandatoryDocs.length > 0) {
    insights.push({
      severity: "positive",
      text: `100% sign-off rate on all ${mandatoryDocs.length} mandatory document(s). Every staff member has read and acknowledged all mandatory policies — an inspector would note this positively.`,
    });
  }

  // Positive: document versioning in use
  const versionedDocs = documents.filter((d) => d.version > 1);
  if (versionedDocs.length >= 2) {
    insights.push({
      severity: "positive",
      text: `${versionedDocs.length} documents have been through version updates. Active document management shows the home keeps policies current and responsive to learning — a sign of reflective practice.`,
    });
  }

  return {
    overview,
    document_profiles,
    category_analysis,
    alerts,
    insights,
  };
}
