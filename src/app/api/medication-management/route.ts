// ══════════════════════════════════════════════════════════════════════════════
// API: /api/medication-management
//
// Medication Management Intelligence
//
// GET  — Returns medication management assessment with Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { generateMedicationManagementIntelligence } from "@/lib/medication-management";
import type {
  MedicationRecord,
  MedicationError,
  StockCheck,
  SelfAdminAssessment,
  ControlledDrugRecord,
} from "@/lib/medication-management";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

const DEMO_RECORDS: MedicationRecord[] = [
  // Alex — Methylphenidate (regular ADHD) morning doses
  { id: "rec-001", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-01", administeredTime: "08:00", administeredBy: "Sarah Johnson", status: "given" },
  { id: "rec-002", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-02", administeredTime: "08:15", administeredBy: "Tom Richards", status: "given" },
  { id: "rec-003", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-03", administeredTime: "08:00", administeredBy: "Lisa Williams", status: "given" },
  { id: "rec-004", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-04", administeredTime: "09:30", administeredBy: "Tom Richards", status: "late", notes: "Slept in — given 90 mins late" },
  { id: "rec-005", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-05", administeredTime: "08:00", administeredBy: "Sarah Johnson", status: "refused", notes: "Alex refused — upset after phone call" },
  { id: "rec-006", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-06", administeredTime: "08:00", administeredBy: "Lisa Williams", status: "given" },
  { id: "rec-007", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-07", administeredTime: "08:10", administeredBy: "Tom Richards", status: "given" },
  { id: "rec-008", childId: "child-alex", childName: "Alex", medicationName: "Methylphenidate 10mg", medicationType: "regular", prescribedDose: "10mg", administeredDate: "2026-05-08", administeredTime: "08:00", administeredBy: "Sarah Johnson", status: "given" },

  // Alex — Lorazepam (PRN anxiety)
  { id: "rec-009", childId: "child-alex", childName: "Alex", medicationName: "Lorazepam 0.5mg", medicationType: "prn", prescribedDose: "0.5mg", administeredDate: "2026-05-05", administeredTime: "14:30", administeredBy: "Sarah Johnson", witnessedBy: "Tom Richards", status: "given", notes: "Acute anxiety episode after phone call from mum" },
  { id: "rec-010", childId: "child-alex", childName: "Alex", medicationName: "Lorazepam 0.5mg", medicationType: "prn", prescribedDose: "0.5mg", administeredDate: "2026-05-12", administeredTime: "20:00", administeredBy: "Lisa Williams", witnessedBy: "Tom Richards", status: "given", notes: "Anxiety before bedtime" },

  // Jordan — Sertraline (regular antidepressant)
  { id: "rec-011", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-01", administeredTime: "08:30", administeredBy: "Sarah Johnson", status: "given" },
  { id: "rec-012", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-02", administeredTime: "08:30", administeredBy: "Tom Richards", status: "given" },
  { id: "rec-013", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-03", administeredTime: "08:45", administeredBy: "Lisa Williams", status: "given" },
  { id: "rec-014", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-04", administeredTime: "08:30", administeredBy: "Tom Richards", status: "given" },
  { id: "rec-015", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-05", administeredTime: "08:30", administeredBy: "Sarah Johnson", status: "given" },
  { id: "rec-016", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-06", administeredTime: "08:30", administeredBy: "Lisa Williams", status: "omitted", notes: "Run out of stock — pharmacy delayed" },
  { id: "rec-017", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-07", administeredTime: "08:30", administeredBy: "Tom Richards", status: "given" },
  { id: "rec-018", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-08", administeredTime: "08:30", administeredBy: "Sarah Johnson", status: "given" },

  // Morgan — Melatonin (controlled) evening doses
  { id: "rec-019", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-01", administeredTime: "21:00", administeredBy: "Tom Richards", witnessedBy: "Lisa Williams", status: "given" },
  { id: "rec-020", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-02", administeredTime: "21:00", administeredBy: "Sarah Johnson", witnessedBy: "Tom Richards", status: "given" },
  { id: "rec-021", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-03", administeredTime: "21:15", administeredBy: "Lisa Williams", witnessedBy: "Tom Richards", status: "given" },
  { id: "rec-022", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-04", administeredTime: "21:00", administeredBy: "Tom Richards", witnessedBy: "Sarah Johnson", status: "self_administered" },
  { id: "rec-023", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-05", administeredTime: "21:00", administeredBy: "Sarah Johnson", witnessedBy: "Lisa Williams", status: "given" },
  { id: "rec-024", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-06", administeredTime: "21:00", administeredBy: "Lisa Williams", witnessedBy: "Tom Richards", status: "self_administered" },
  { id: "rec-025", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-07", administeredTime: "21:00", administeredBy: "Tom Richards", witnessedBy: "Sarah Johnson", status: "given" },
  { id: "rec-026", childId: "child-morgan", childName: "Morgan", medicationName: "Melatonin 3mg", medicationType: "controlled", prescribedDose: "3mg", administeredDate: "2026-05-08", administeredTime: "21:00", administeredBy: "Sarah Johnson", witnessedBy: "Tom Richards", status: "given" },

  // Error record — wrong time for Jordan
  { id: "rec-027", childId: "child-jordan", childName: "Jordan", medicationName: "Sertraline 50mg", medicationType: "regular", prescribedDose: "50mg", administeredDate: "2026-05-10", administeredTime: "14:00", administeredBy: "Tom Richards", status: "error", notes: "Given at wrong time" },
];

const DEMO_ERRORS: MedicationError[] = [
  {
    id: "err-001", childId: "child-jordan", childName: "Jordan",
    errorDate: "2026-05-10", errorType: "wrong_time", severity: "minor",
    description: "Sertraline given at 14:00 instead of 08:30 — staff forgot during busy morning",
    reportedBy: "Tom Richards", actionTaken: "Incident form completed, GP notified, staff reminded",
    notifiedParties: ["GP", "Darren Laville"],
    rootCauseIdentified: "Staff distracted by incident with another child",
  },
  {
    id: "err-002", childId: "child-alex", childName: "Alex",
    errorDate: "2026-05-07", errorType: "documentation_error", severity: "moderate",
    description: "MAR chart not signed for Methylphenidate administration — dose was given but not recorded until end of shift",
    reportedBy: "Lisa Williams", actionTaken: "MAR chart retrospectively completed, staff supervision arranged",
    notifiedParties: ["Darren Laville"],
    rootCauseIdentified: "Staff new to home, unfamiliar with MAR chart process",
  },
  {
    id: "err-003", childId: "child-jordan", childName: "Jordan",
    errorDate: "2026-05-06", errorType: "missed", severity: "significant",
    description: "Sertraline omitted due to stock running out — pharmacy delivery was not chased",
    reportedBy: "Sarah Johnson", actionTaken: "Emergency supply obtained from pharmacy, stock management reviewed",
    notifiedParties: ["GP", "Social Worker", "Darren Laville"],
  },
];

const DEMO_STOCK_CHECKS: StockCheck[] = [
  { id: "sc-001", medicationName: "Methylphenidate 10mg", childId: "child-alex", childName: "Alex", checkDate: "2026-05-01", checkedBy: "Sarah Johnson", expectedCount: 30, actualCount: 30, discrepancy: false },
  { id: "sc-002", medicationName: "Sertraline 50mg", childId: "child-jordan", childName: "Jordan", checkDate: "2026-05-01", checkedBy: "Sarah Johnson", expectedCount: 28, actualCount: 28, discrepancy: false },
  { id: "sc-003", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", checkDate: "2026-05-01", checkedBy: "Lisa Williams", expectedCount: 30, actualCount: 30, discrepancy: false },
  { id: "sc-004", medicationName: "Methylphenidate 10mg", childId: "child-alex", childName: "Alex", checkDate: "2026-05-08", checkedBy: "Tom Richards", expectedCount: 23, actualCount: 23, discrepancy: false },
  { id: "sc-005", medicationName: "Sertraline 50mg", childId: "child-jordan", childName: "Jordan", checkDate: "2026-05-08", checkedBy: "Tom Richards", expectedCount: 21, actualCount: 20, discrepancy: true, actionTaken: "Recounted and confirmed one tablet unaccounted for — incident form completed" },
  { id: "sc-006", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", checkDate: "2026-05-08", checkedBy: "Lisa Williams", expectedCount: 23, actualCount: 23, discrepancy: false },
  { id: "sc-007", medicationName: "Methylphenidate 10mg", childId: "child-alex", childName: "Alex", checkDate: "2026-05-15", checkedBy: "Sarah Johnson", expectedCount: 16, actualCount: 16, discrepancy: false },
  { id: "sc-008", medicationName: "Sertraline 50mg", childId: "child-jordan", childName: "Jordan", checkDate: "2026-05-15", checkedBy: "Sarah Johnson", expectedCount: 13, actualCount: 13, discrepancy: false },
  { id: "sc-009", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", checkDate: "2026-05-15", checkedBy: "Lisa Williams", expectedCount: 16, actualCount: 16, discrepancy: false },
  { id: "sc-010", medicationName: "Lorazepam 0.5mg", childId: "child-alex", childName: "Alex", checkDate: "2026-05-08", checkedBy: "Sarah Johnson", expectedCount: 8, actualCount: 8, discrepancy: false },
];

const DEMO_SELF_ADMIN: SelfAdminAssessment[] = [
  {
    id: "sa-001", childId: "child-morgan", childName: "Morgan",
    assessmentDate: "2026-04-01",
    currentLevel: "level_1_full_staff", targetLevel: "level_3_independent_checked",
    assessedBy: "Darren Laville",
    competencies: ["Understands medication purpose", "Can identify own medication"],
    areasForDevelopment: ["Remembering timing without prompts", "Recognising side effects"],
    reviewDate: "2026-05-01",
  },
  {
    id: "sa-002", childId: "child-morgan", childName: "Morgan",
    assessmentDate: "2026-05-01",
    currentLevel: "level_2_supervised", targetLevel: "level_3_independent_checked",
    assessedBy: "Darren Laville",
    competencies: ["Understands medication purpose", "Can identify own medication", "Knows correct dose", "Can open packaging safely"],
    areasForDevelopment: ["Remembering timing without prompts"],
    reviewDate: "2026-06-01",
  },
  {
    id: "sa-003", childId: "child-morgan", childName: "Morgan",
    assessmentDate: "2026-05-15",
    currentLevel: "level_3_independent_checked", targetLevel: "level_3_independent_checked",
    assessedBy: "Darren Laville",
    competencies: ["Understands medication purpose", "Can identify own medication", "Knows correct dose", "Can open packaging safely", "Remembers timing independently"],
    areasForDevelopment: [],
    reviewDate: "2026-06-15",
  },
];

const DEMO_CD_RECORDS: ControlledDrugRecord[] = [
  { id: "cd-001", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-01", administeredBy: "Tom Richards", witnessedBy: "Lisa Williams", balanceBefore: 30, balanceAfter: 29, balanceCorrect: true },
  { id: "cd-002", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-02", administeredBy: "Sarah Johnson", witnessedBy: "Tom Richards", balanceBefore: 29, balanceAfter: 28, balanceCorrect: true },
  { id: "cd-003", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-03", administeredBy: "Lisa Williams", witnessedBy: "Tom Richards", balanceBefore: 28, balanceAfter: 27, balanceCorrect: true },
  { id: "cd-004", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-04", administeredBy: "Tom Richards", witnessedBy: "Sarah Johnson", balanceBefore: 27, balanceAfter: 26, balanceCorrect: true },
  { id: "cd-005", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-05", administeredBy: "Sarah Johnson", witnessedBy: "Lisa Williams", balanceBefore: 26, balanceAfter: 25, balanceCorrect: true },
  { id: "cd-006", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-06", administeredBy: "Lisa Williams", witnessedBy: "Tom Richards", balanceBefore: 25, balanceAfter: 24, balanceCorrect: true },
  { id: "cd-007", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-07", administeredBy: "Tom Richards", witnessedBy: "Sarah Johnson", balanceBefore: 24, balanceAfter: 23, balanceCorrect: true },
  { id: "cd-008", medicationName: "Melatonin 3mg", childId: "child-morgan", childName: "Morgan", date: "2026-05-08", administeredBy: "Sarah Johnson", witnessedBy: "Tom Richards", balanceBefore: 23, balanceAfter: 22, balanceCorrect: true },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateMedicationManagementIntelligence(
    DEMO_RECORDS,
    DEMO_ERRORS,
    DEMO_STOCK_CHECKS,
    DEMO_SELF_ADMIN,
    DEMO_CD_RECORDS,
    "oak-house",
    "2026-05-01",
    "2026-05-18",
    "2026-05-18",
  );

  return NextResponse.json({ data: result });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    records,
    errors,
    stockChecks,
    selfAdminAssessments,
    cdRecords,
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
  } = body as {
    records?: MedicationRecord[];
    errors?: MedicationError[];
    stockChecks?: StockCheck[];
    selfAdminAssessments?: SelfAdminAssessment[];
    cdRecords?: ControlledDrugRecord[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    referenceDate?: string;
  };

  if (!records || !Array.isArray(records)) {
    return NextResponse.json({ error: "records array is required" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateMedicationManagementIntelligence(
    records,
    errors ?? [],
    stockChecks ?? [],
    selfAdminAssessments ?? [],
    cdRecords ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    referenceDate ?? new Date().toISOString().split("T")[0],
  );

  return NextResponse.json({ data: result });
}
