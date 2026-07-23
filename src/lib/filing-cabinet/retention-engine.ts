// ══════════════════════════════════════════════════════════════════════════════
// Cara Filing Cabinet — Retention & Retrieval Engine
//
// Deterministic engine for document retention, destruction scheduling,
// compliance tracking, and filing against CHR 2015 and DPA 2018.
//
// Every record in a children's home must be:
//   - Filed in the correct category with appropriate sensitivity
//   - Retained for the legally mandated period
//   - Accessible only to authorised roles
//   - Scheduled for secure destruction after retention expires
//   - Tracked in audit log for Reg 44/45 reporting
//
// Retention periods follow Children's Homes (England) Regulations 2015,
// Schedule 3 (records), and DPA 2018 / UK-GDPR requirements.
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import type { Role } from "../permissions/types";
import { isAtLeast } from "../permissions/role-rules";
import { rate } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type FilingCategory =
  | "child_record"              // individual child case file
  | "care_plan"                 // placement plans, care plans, pathway plans
  | "safeguarding"             // safeguarding referrals, CP records
  | "health"                   // medical, LAC health, dental, CAMHS
  | "education"                // PEPs, school reports, attendance
  | "daily_record"             // daily logs, shift handovers
  | "medication"               // MARs, medication errors
  | "incident"                 // incidents, restraints, significant events
  | "risk_assessment"          // individual risk assessments
  | "missing_episode"          // missing from care records, return interviews
  | "staff_personnel"          // personnel files, supervision, training
  | "recruitment"              // applications, DBS, references, interview notes
  | "regulatory"               // Ofsted, Reg 44/45, statutory notifications
  | "policy"                   // policies and procedures
  | "financial"                // petty cash, pocket money, savings
  | "complaint"                // complaints, representations
  | "quality_assurance"        // QA samples, audit reports
  | "correspondence"           // letters, emails of significance
  | "photo_consent"            // photo permissions, consent forms
  | "legal";                   // court orders, care orders, legal correspondence

export type RetentionBasis =
  | "chr_2015_schedule_3"       // Children's Homes Regs 2015, Schedule 3
  | "dpa_2018"                 // Data Protection Act 2018
  | "limitation_act"           // Limitation Act 1980 (personal injury)
  | "working_together"         // Working Together to Safeguard Children
  | "employment_law"           // Employment Rights Act 1996
  | "tax_hmrc"                 // HMRC requirements
  | "safeguarding_indefinite"  // indefinite retention for safeguarding
  | "organisational";          // org policy beyond legal minimum

export type DocumentStatus =
  | "active"                   // in active use
  | "archived"                 // retained but not in active use
  | "pending_destruction"      // past retention, awaiting destruction
  | "destruction_approved"     // destruction has been authorised
  | "destroyed"                // securely destroyed, only metadata remains
  | "hold"                     // legal/regulatory hold — do not destroy
  | "transferred";             // transferred to another provider / LA

export type Sensitivity = "standard" | "sensitive" | "highly_sensitive" | "restricted";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface FiledDocument {
  id: string;
  title: string;
  category: FilingCategory;
  sensitivity: Sensitivity;
  homeId: string;
  childId?: string;             // if child-related
  staffId?: string;             // if staff-related
  filedBy: string;
  filedAt: string;
  status: DocumentStatus;
  retentionExpiresAt: string;   // when retention period ends
  retentionBasis: RetentionBasis;
  retentionYears: number;
  tags: string[];
  version: number;
  previousVersionId?: string;
  destructionApprovedBy?: string;
  destructionApprovedAt?: string;
  destroyedAt?: string;
  destroyedBy?: string;
  holdReason?: string;
  holdPlacedBy?: string;
  holdPlacedAt?: string;
  transferredTo?: string;
  transferredAt?: string;
  lastAccessedBy?: string;
  lastAccessedAt?: string;
  accessCount: number;
}

export interface RetentionPolicy {
  category: FilingCategory;
  defaultRetentionYears: number;
  basis: RetentionBasis;
  minimumRole: Role;             // minimum role to access
  sensitivity: Sensitivity;
  destructionRequiresRole: Role; // who can approve destruction
  description: string;
}

export interface RetentionCheckResult {
  documentId: string;
  title: string;
  category: FilingCategory;
  status: "within_retention" | "approaching_expiry" | "expired" | "on_hold";
  retentionExpiresAt: string;
  daysRemaining: number;
  action: string;
  canDestroy: boolean;
  destructionRequiresRole: Role;
}

export interface DestructionRequest {
  documentId: string;
  requestedBy: string;
  requestedByRole: Role;
  reason: string;
}

export interface DestructionResult {
  success: boolean;
  document?: FiledDocument;
  error?: string;
}

export interface FilingStats {
  totalDocuments: number;
  byCategory: Record<FilingCategory, number>;
  byStatus: Record<DocumentStatus, number>;
  bySensitivity: Record<Sensitivity, number>;
  pendingDestruction: number;
  approachingExpiry: number;   // within 90 days
  onHold: number;
  complianceRate: number | null;  // % with correct retention applied; null with no documents
}

// ── Retention Policy Configuration ────────────────────────────────────────

export const RETENTION_POLICIES: RetentionPolicy[] = [
  // Child records: 75 years from DOB (or 15 years after leaving care, whichever is longer)
  {
    category: "child_record",
    defaultRetentionYears: 75,
    basis: "chr_2015_schedule_3",
    minimumRole: "rsw",
    sensitivity: "highly_sensitive",
    destructionRequiresRole: "responsible_individual",
    description: "Individual child case file retained for 75 years from DOB per Schedule 3.",
  },
  {
    category: "care_plan",
    defaultRetentionYears: 75,
    basis: "chr_2015_schedule_3",
    minimumRole: "rsw",
    sensitivity: "highly_sensitive",
    destructionRequiresRole: "responsible_individual",
    description: "Placement plans, care plans, pathway plans — retained with child record.",
  },
  {
    category: "safeguarding",
    defaultRetentionYears: 99,
    basis: "safeguarding_indefinite",
    minimumRole: "team_leader",
    sensitivity: "restricted",
    destructionRequiresRole: "responsible_individual",
    description: "Safeguarding records retained indefinitely (99 years). Never routine-destroy.",
  },
  {
    category: "health",
    defaultRetentionYears: 75,
    basis: "chr_2015_schedule_3",
    minimumRole: "rsw",
    sensitivity: "highly_sensitive",
    destructionRequiresRole: "responsible_individual",
    description: "Health records including LAC health, dental, CAMHS — retained with child record.",
  },
  {
    category: "education",
    defaultRetentionYears: 25,
    basis: "chr_2015_schedule_3",
    minimumRole: "rsw",
    sensitivity: "sensitive",
    destructionRequiresRole: "registered_manager",
    description: "PEPs, school reports, educational records.",
  },
  {
    category: "daily_record",
    defaultRetentionYears: 15,
    basis: "chr_2015_schedule_3",
    minimumRole: "rsw",
    sensitivity: "standard",
    destructionRequiresRole: "registered_manager",
    description: "Daily logs, shift handovers, routine records.",
  },
  {
    category: "medication",
    defaultRetentionYears: 25,
    basis: "chr_2015_schedule_3",
    minimumRole: "rsw",
    sensitivity: "sensitive",
    destructionRequiresRole: "registered_manager",
    description: "MARs, medication errors — retained as part of health record.",
  },
  {
    category: "incident",
    defaultRetentionYears: 25,
    basis: "limitation_act",
    minimumRole: "rsw",
    sensitivity: "sensitive",
    destructionRequiresRole: "registered_manager",
    description: "Incidents, restraints, significant events. Personal injury limitation is 3 years from 18th birthday.",
  },
  {
    category: "risk_assessment",
    defaultRetentionYears: 25,
    basis: "chr_2015_schedule_3",
    minimumRole: "rsw",
    sensitivity: "sensitive",
    destructionRequiresRole: "registered_manager",
    description: "Individual risk assessments.",
  },
  {
    category: "missing_episode",
    defaultRetentionYears: 75,
    basis: "safeguarding_indefinite",
    minimumRole: "team_leader",
    sensitivity: "highly_sensitive",
    destructionRequiresRole: "responsible_individual",
    description: "Missing from care records and return interviews — safeguarding significance.",
  },
  {
    category: "staff_personnel",
    defaultRetentionYears: 7,
    basis: "employment_law",
    minimumRole: "deputy_manager",
    sensitivity: "sensitive",
    destructionRequiresRole: "registered_manager",
    description: "Staff personnel files retained 6 years after leaving + 1 year.",
  },
  {
    category: "recruitment",
    defaultRetentionYears: 15,
    basis: "chr_2015_schedule_3",
    minimumRole: "deputy_manager",
    sensitivity: "sensitive",
    destructionRequiresRole: "registered_manager",
    description: "Recruitment records retained 15 years per Schedule 2.",
  },
  {
    category: "regulatory",
    defaultRetentionYears: 15,
    basis: "chr_2015_schedule_3",
    minimumRole: "registered_manager",
    sensitivity: "standard",
    destructionRequiresRole: "responsible_individual",
    description: "Ofsted reports, Reg 44/45 reports, statutory notifications.",
  },
  {
    category: "policy",
    defaultRetentionYears: 7,
    basis: "organisational",
    minimumRole: "rsw",
    sensitivity: "standard",
    destructionRequiresRole: "registered_manager",
    description: "Policies superseded — retain previous version for 7 years.",
  },
  {
    category: "financial",
    defaultRetentionYears: 7,
    basis: "tax_hmrc",
    minimumRole: "deputy_manager",
    sensitivity: "standard",
    destructionRequiresRole: "registered_manager",
    description: "Financial records retained per HMRC requirements.",
  },
  {
    category: "complaint",
    defaultRetentionYears: 10,
    basis: "chr_2015_schedule_3",
    minimumRole: "team_leader",
    sensitivity: "sensitive",
    destructionRequiresRole: "registered_manager",
    description: "Complaints and representations.",
  },
  {
    category: "quality_assurance",
    defaultRetentionYears: 7,
    basis: "organisational",
    minimumRole: "deputy_manager",
    sensitivity: "standard",
    destructionRequiresRole: "registered_manager",
    description: "QA samples, internal audit reports.",
  },
  {
    category: "correspondence",
    defaultRetentionYears: 7,
    basis: "organisational",
    minimumRole: "rsw",
    sensitivity: "standard",
    destructionRequiresRole: "deputy_manager",
    description: "Significant correspondence, professional communications.",
  },
  {
    category: "photo_consent",
    defaultRetentionYears: 75,
    basis: "dpa_2018",
    minimumRole: "rsw",
    sensitivity: "sensitive",
    destructionRequiresRole: "registered_manager",
    description: "Photo consent forms — retained until child is 75 (DPA/GDPR basis).",
  },
  {
    category: "legal",
    defaultRetentionYears: 75,
    basis: "chr_2015_schedule_3",
    minimumRole: "registered_manager",
    sensitivity: "restricted",
    destructionRequiresRole: "responsible_individual",
    description: "Court orders, care orders, legal correspondence — retained with child record.",
  },
];

// ── Core: Get Retention Policy ────────────────────────────────────────────

export function getRetentionPolicy(category: FilingCategory): RetentionPolicy {
  const policy = RETENTION_POLICIES.find(p => p.category === category);
  if (!policy) {
    throw new Error(`No retention policy for category: ${category}`);
  }
  return policy;
}

// ── Core: Calculate Retention Expiry ──────────────────────────────────────

export function calculateRetentionExpiry(
  filedAt: string,
  category: FilingCategory,
  childDob?: string,
): string {
  const policy = getRetentionPolicy(category);

  // For child records with known DOB, retention is from DOB
  if (childDob && policy.defaultRetentionYears >= 75) {
    const dobDate = new Date(childDob);
    dobDate.setUTCFullYear(dobDate.getUTCFullYear() + policy.defaultRetentionYears);
    return dobDate.toISOString();
  }

  // Standard: retention years from filing date
  const filedDate = new Date(filedAt);
  filedDate.setUTCFullYear(filedDate.getUTCFullYear() + policy.defaultRetentionYears);
  return filedDate.toISOString();
}

// ── Core: Check Retention Status ──────────────────────────────────────────

export function checkRetentionStatus(
  documents: FiledDocument[],
  now?: string,
): RetentionCheckResult[] {
  const currentDate = now ? new Date(now) : new Date();

  return documents.map(doc => {
    const policy = getRetentionPolicy(doc.category);
    const expiryDate = new Date(doc.retentionExpiresAt);
    const daysRemaining = Math.floor(
      (expiryDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000),
    );

    // On hold — never destroy regardless of expiry
    if (doc.status === "hold") {
      return {
        documentId: doc.id,
        title: doc.title,
        category: doc.category,
        status: "on_hold" as const,
        retentionExpiresAt: doc.retentionExpiresAt,
        daysRemaining,
        action: `Document on hold: ${doc.holdReason ?? "Reason not specified"}. Do not destroy.`,
        canDestroy: false,
        destructionRequiresRole: policy.destructionRequiresRole,
      };
    }

    // Already destroyed or transferred
    if (doc.status === "destroyed" || doc.status === "transferred") {
      return {
        documentId: doc.id,
        title: doc.title,
        category: doc.category,
        status: "within_retention" as const,
        retentionExpiresAt: doc.retentionExpiresAt,
        daysRemaining,
        action: `Document already ${doc.status}. No action required.`,
        canDestroy: false,
        destructionRequiresRole: policy.destructionRequiresRole,
      };
    }

    // Expired
    if (daysRemaining <= 0) {
      return {
        documentId: doc.id,
        title: doc.title,
        category: doc.category,
        status: "expired" as const,
        retentionExpiresAt: doc.retentionExpiresAt,
        daysRemaining,
        action: `Retention expired ${Math.abs(daysRemaining)} days ago. Review for secure destruction.`,
        canDestroy: true,
        destructionRequiresRole: policy.destructionRequiresRole,
      };
    }

    // Approaching expiry (within 90 days)
    if (daysRemaining <= 90) {
      return {
        documentId: doc.id,
        title: doc.title,
        category: doc.category,
        status: "approaching_expiry" as const,
        retentionExpiresAt: doc.retentionExpiresAt,
        daysRemaining,
        action: `Retention expires in ${daysRemaining} days. Prepare for review.`,
        canDestroy: false,
        destructionRequiresRole: policy.destructionRequiresRole,
      };
    }

    // Within retention
    return {
      documentId: doc.id,
      title: doc.title,
      category: doc.category,
      status: "within_retention" as const,
      retentionExpiresAt: doc.retentionExpiresAt,
      daysRemaining,
      action: "No action required. Retain per policy.",
      canDestroy: false,
      destructionRequiresRole: policy.destructionRequiresRole,
    };
  });
}

// ── Core: Approve Destruction ─────────────────────────────────────────────

export function approveDestruction(
  document: FiledDocument,
  request: DestructionRequest,
  now?: string,
): DestructionResult {
  const timestamp = now ?? new Date().toISOString();
  const policy = getRetentionPolicy(document.category);

  // Cannot destroy if on hold
  if (document.status === "hold") {
    return {
      success: false,
      error: "Document is on legal/regulatory hold. Remove hold before destruction.",
    };
  }

  // Cannot destroy already destroyed
  if (document.status === "destroyed") {
    return {
      success: false,
      error: "Document has already been destroyed.",
    };
  }

  // Role check
  if (!isAtLeast(request.requestedByRole, policy.destructionRequiresRole)) {
    return {
      success: false,
      error: `Destruction requires ${policy.destructionRequiresRole} or above. Your role: ${request.requestedByRole}.`,
    };
  }

  // Check retention period
  const expiryDate = new Date(document.retentionExpiresAt);
  const currentDate = new Date(timestamp);
  if (currentDate < expiryDate) {
    return {
      success: false,
      error: `Retention period has not expired. Expires: ${document.retentionExpiresAt}. Early destruction requires responsible_individual approval.`,
    };
  }

  // Reason required
  if (!request.reason || request.reason.trim().length < 10) {
    return {
      success: false,
      error: "Destruction reason must be at least 10 characters.",
    };
  }

  // Safeguarding records cannot be routinely destroyed
  if (document.category === "safeguarding") {
    return {
      success: false,
      error: "Safeguarding records cannot be routinely destroyed. Requires responsible_individual review and documented justification.",
    };
  }

  return {
    success: true,
    document: {
      ...document,
      status: "destruction_approved",
      destructionApprovedBy: request.requestedBy,
      destructionApprovedAt: timestamp,
    },
  };
}

// ── Core: Execute Destruction ─────────────────────────────────────────────

export function executeDestruction(
  document: FiledDocument,
  destroyedBy: string,
  destroyedByRole: Role,
  now?: string,
): DestructionResult {
  const timestamp = now ?? new Date().toISOString();

  if (document.status !== "destruction_approved") {
    return {
      success: false,
      error: "Document must be in 'destruction_approved' status. Current: " + document.status,
    };
  }

  if (!isAtLeast(destroyedByRole, "deputy_manager")) {
    return {
      success: false,
      error: "Only deputy_manager or above can execute document destruction.",
    };
  }

  return {
    success: true,
    document: {
      ...document,
      status: "destroyed",
      destroyedAt: timestamp,
      destroyedBy,
    },
  };
}

// ── Core: Place/Remove Hold ───────────────────────────────────────────────

export function placeHold(
  document: FiledDocument,
  reason: string,
  placedBy: string,
  placedByRole: Role,
  now?: string,
): DestructionResult {
  const timestamp = now ?? new Date().toISOString();

  if (document.status === "destroyed") {
    return {
      success: false,
      error: "Cannot place hold on destroyed document.",
    };
  }

  if (!isAtLeast(placedByRole, "deputy_manager")) {
    return {
      success: false,
      error: "Only deputy_manager or above can place document holds.",
    };
  }

  if (!reason || reason.trim().length < 5) {
    return {
      success: false,
      error: "Hold reason is required.",
    };
  }

  return {
    success: true,
    document: {
      ...document,
      status: "hold",
      holdReason: reason.trim(),
      holdPlacedBy: placedBy,
      holdPlacedAt: timestamp,
    },
  };
}

export function removeHold(
  document: FiledDocument,
  removedBy: string,
  removedByRole: Role,
): DestructionResult {
  if (document.status !== "hold") {
    return {
      success: false,
      error: "Document is not on hold.",
    };
  }

  if (!isAtLeast(removedByRole, "registered_manager")) {
    return {
      success: false,
      error: "Only registered_manager or above can remove document holds.",
    };
  }

  return {
    success: true,
    document: {
      ...document,
      status: "archived",
      holdReason: undefined,
      holdPlacedBy: undefined,
      holdPlacedAt: undefined,
    },
  };
}

// ── Core: Access Control Check ────────────────────────────────────────────

export function canAccessDocument(
  document: FiledDocument,
  userRole: Role,
): { allowed: boolean; reason: string } {
  const policy = getRetentionPolicy(document.category);

  if (document.status === "destroyed") {
    return {
      allowed: false,
      reason: "Document has been securely destroyed. Only metadata record remains.",
    };
  }

  if (!isAtLeast(userRole, policy.minimumRole)) {
    return {
      allowed: false,
      reason: `Access requires ${policy.minimumRole} or above. Your role: ${userRole}.`,
    };
  }

  // Restricted documents need registered_manager+
  if (document.sensitivity === "restricted" && !isAtLeast(userRole, "registered_manager")) {
    return {
      allowed: false,
      reason: "Restricted documents require registered_manager or above.",
    };
  }

  return { allowed: true, reason: "Access granted." };
}

// ── Core: Calculate Filing Statistics ─────────────────────────────────────

export function calculateFilingStats(
  documents: FiledDocument[],
  now?: string,
): FilingStats {
  const currentDate = now ? new Date(now) : new Date();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  const byCategory = {} as Record<FilingCategory, number>;
  const byStatus = {} as Record<DocumentStatus, number>;
  const bySensitivity = {} as Record<Sensitivity, number>;

  let pendingDestruction = 0;
  let approachingExpiry = 0;
  let onHold = 0;
  let correctRetention = 0;

  for (const doc of documents) {
    // Count by category
    byCategory[doc.category] = (byCategory[doc.category] ?? 0) + 1;
    byStatus[doc.status] = (byStatus[doc.status] ?? 0) + 1;
    bySensitivity[doc.sensitivity] = (bySensitivity[doc.sensitivity] ?? 0) + 1;

    if (doc.status === "pending_destruction" || doc.status === "destruction_approved") {
      pendingDestruction++;
    }

    if (doc.status === "hold") {
      onHold++;
    }

    // Check approaching expiry
    const expiryDate = new Date(doc.retentionExpiresAt);
    const daysUntil = expiryDate.getTime() - currentDate.getTime();
    if (daysUntil > 0 && daysUntil < ninetyDaysMs && doc.status !== "destroyed") {
      approachingExpiry++;
    }

    // Retention compliance: check policy matches
    const policy = getRetentionPolicy(doc.category);
    if (doc.retentionYears >= policy.defaultRetentionYears) {
      correctRetention++;
    }
  }

  const complianceRate = rate(correctRetention, documents.length);

  return {
    totalDocuments: documents.length,
    byCategory,
    byStatus,
    bySensitivity,
    pendingDestruction,
    approachingExpiry,
    onHold,
    complianceRate,
  };
}

// ── Core: File a Document ─────────────────────────────────────────────────

export interface FileDocumentRequest {
  title: string;
  category: FilingCategory;
  homeId: string;
  filedBy: string;
  filedByRole: Role;
  childId?: string;
  childDob?: string;
  staffId?: string;
  tags?: string[];
  sensitivityOverride?: Sensitivity;
}

export function fileDocument(
  request: FileDocumentRequest,
  now?: string,
): { success: boolean; document?: FiledDocument; error?: string } {
  const timestamp = now ?? new Date().toISOString();
  const policy = getRetentionPolicy(request.category);

  // Role check
  if (!isAtLeast(request.filedByRole, policy.minimumRole)) {
    return {
      success: false,
      error: `Filing ${request.category} requires ${policy.minimumRole} or above.`,
    };
  }

  // Title required
  if (!request.title || request.title.trim().length < 3) {
    return {
      success: false,
      error: "Document title must be at least 3 characters.",
    };
  }

  const retentionExpiresAt = calculateRetentionExpiry(
    timestamp,
    request.category,
    request.childDob,
  );

  const doc: FiledDocument = {
    id: `doc-${timestamp.replace(/[^0-9]/g, "")}-${Math.random().toString(36).slice(2, 6)}`,
    title: request.title.trim(),
    category: request.category,
    sensitivity: request.sensitivityOverride ?? policy.sensitivity,
    homeId: request.homeId,
    childId: request.childId,
    staffId: request.staffId,
    filedBy: request.filedBy,
    filedAt: timestamp,
    status: "active",
    retentionExpiresAt,
    retentionBasis: policy.basis,
    retentionYears: policy.defaultRetentionYears,
    tags: request.tags ?? [],
    version: 1,
    accessCount: 0,
  };

  return { success: true, document: doc };
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function getCategoryLabel(category: FilingCategory): string {
  const labels: Record<FilingCategory, string> = {
    child_record: "Child Record",
    care_plan: "Care Plan",
    safeguarding: "Safeguarding",
    health: "Health",
    education: "Education",
    daily_record: "Daily Record",
    medication: "Medication",
    incident: "Incident",
    risk_assessment: "Risk Assessment",
    missing_episode: "Missing Episode",
    staff_personnel: "Staff Personnel",
    recruitment: "Recruitment",
    regulatory: "Regulatory",
    policy: "Policy",
    financial: "Financial",
    complaint: "Complaint",
    quality_assurance: "Quality Assurance",
    correspondence: "Correspondence",
    photo_consent: "Photo Consent",
    legal: "Legal",
  };
  return labels[category];
}

export function getSensitivityLabel(sensitivity: Sensitivity): string {
  const labels: Record<Sensitivity, string> = {
    standard: "Standard",
    sensitive: "Sensitive",
    highly_sensitive: "Highly Sensitive",
    restricted: "Restricted",
  };
  return labels[sensitivity];
}

export function getRetentionBasisLabel(basis: RetentionBasis): string {
  const labels: Record<RetentionBasis, string> = {
    chr_2015_schedule_3: "CHR 2015, Schedule 3",
    dpa_2018: "DPA 2018 / UK-GDPR",
    limitation_act: "Limitation Act 1980",
    working_together: "Working Together 2023",
    employment_law: "Employment Rights Act 1996",
    tax_hmrc: "HMRC Requirements",
    safeguarding_indefinite: "Indefinite (Safeguarding)",
    organisational: "Organisational Policy",
  };
  return labels[basis];
}

export function getDocumentsApproachingExpiry(
  documents: FiledDocument[],
  daysThreshold: number = 90,
  now?: string,
): FiledDocument[] {
  const currentDate = now ? new Date(now) : new Date();
  const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

  return documents.filter(doc => {
    if (doc.status === "destroyed" || doc.status === "transferred") return false;
    const expiryDate = new Date(doc.retentionExpiresAt);
    const remaining = expiryDate.getTime() - currentDate.getTime();
    return remaining > 0 && remaining < thresholdMs;
  });
}

export function getExpiredDocuments(
  documents: FiledDocument[],
  now?: string,
): FiledDocument[] {
  const currentDate = now ? new Date(now) : new Date();

  return documents.filter(doc => {
    if (doc.status === "destroyed" || doc.status === "transferred" || doc.status === "hold") return false;
    return new Date(doc.retentionExpiresAt) < currentDate;
  });
}
