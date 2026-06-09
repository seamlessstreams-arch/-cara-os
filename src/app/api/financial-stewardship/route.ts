// ==============================================================================
// Cornerstone -- Financial Stewardship Intelligence API Route
//
// GET  -> returns Chamberlain House demo financial stewardship intelligence
// POST -> accepts custom data for any home
// ==============================================================================

import { NextResponse } from "next/server";
import { generateFinancialStewardshipIntelligence } from "@/lib/financial-stewardship/financial-stewardship-engine";
import type {
  ChildFinancialProfile,
  FinancialTransaction,
  FinancialAudit,
  AllowancePolicy,
} from "@/lib/financial-stewardship/financial-stewardship-engine";

// -- Chamberlain House Demo Data ------------------------------------------------------

function getDemoData() {
  const profiles: ChildFinancialProfile[] = [
    {
      id: "fp-alex",
      childId: "child-alex",
      childName: "Alex",
      weeklyPocketMoney: 10,
      savingsAccountInPlace: true,
      accountType: "savings",
      currentBalance: 145.50,
      financialLiteracyLevel: "developing",
      financialLiteracyAssessedDate: "2025-03-10",
      ageAppropriateAmount: true,
      budgetPlanInPlace: true,
    },
    {
      id: "fp-jordan",
      childId: "child-jordan",
      childName: "Jordan",
      weeklyPocketMoney: 8,
      savingsAccountInPlace: true,
      accountType: "junior_isa",
      currentBalance: 220.00,
      financialLiteracyLevel: "competent",
      financialLiteracyAssessedDate: "2025-02-15",
      ageAppropriateAmount: true,
      budgetPlanInPlace: true,
    },
    {
      id: "fp-morgan",
      childId: "child-morgan",
      childName: "Morgan",
      weeklyPocketMoney: 12,
      savingsAccountInPlace: true,
      accountType: "savings",
      currentBalance: 89.75,
      financialLiteracyLevel: "competent",
      financialLiteracyAssessedDate: "2025-04-01",
      ageAppropriateAmount: true,
      budgetPlanInPlace: true,
    },
  ];

  const transactions: FinancialTransaction[] = [
    // Alex transactions
    {
      id: "tx-a1", childId: "child-alex", date: "2025-02-03", amount: 10,
      type: "issued", allowanceType: "pocket_money", description: "Weekly pocket money",
      receiptObtained: false, authorisedBy: "Sarah Johnson", childConsented: true,
    },
    {
      id: "tx-a2", childId: "child-alex", date: "2025-02-05", amount: 5,
      type: "saved", allowanceType: "savings", description: "Saved from pocket money",
      receiptObtained: false, authorisedBy: "Sarah Johnson", childConsented: true,
    },
    {
      id: "tx-a3", childId: "child-alex", date: "2025-02-07", amount: 3.50,
      type: "spent", allowanceType: "activities", description: "Cinema snack",
      receiptObtained: true, authorisedBy: "Tom Richards", childConsented: true,
    },
    {
      id: "tx-a4", childId: "child-alex", date: "2025-03-01", amount: 10,
      type: "issued", allowanceType: "pocket_money", description: "Weekly pocket money",
      receiptObtained: false, authorisedBy: "Sarah Johnson", childConsented: true,
    },
    {
      id: "tx-a5", childId: "child-alex", date: "2025-03-15", amount: 25,
      type: "issued", allowanceType: "birthday", description: "Birthday money from grandparent",
      receiptObtained: false, authorisedBy: "Lisa Williams", childConsented: true,
    },
    {
      id: "tx-a6", childId: "child-alex", date: "2025-03-16", amount: 15,
      type: "saved", allowanceType: "savings", description: "Saved birthday money",
      receiptObtained: false, authorisedBy: "Lisa Williams", childConsented: true,
    },
    // Jordan transactions
    {
      id: "tx-j1", childId: "child-jordan", date: "2025-02-03", amount: 8,
      type: "issued", allowanceType: "pocket_money", description: "Weekly pocket money",
      receiptObtained: false, authorisedBy: "Sarah Johnson", childConsented: true,
    },
    {
      id: "tx-j2", childId: "child-jordan", date: "2025-02-06", amount: 4,
      type: "saved", allowanceType: "savings", description: "Saved half of pocket money",
      receiptObtained: false, authorisedBy: "Sarah Johnson", childConsented: true,
    },
    {
      id: "tx-j3", childId: "child-jordan", date: "2025-02-10", amount: 6.99,
      type: "spent", allowanceType: "personal_care", description: "Toiletries",
      receiptObtained: true, authorisedBy: "Tom Richards", childConsented: true,
    },
    {
      id: "tx-j4", childId: "child-jordan", date: "2025-03-03", amount: 8,
      type: "issued", allowanceType: "pocket_money", description: "Weekly pocket money",
      receiptObtained: false, authorisedBy: "Sarah Johnson", childConsented: true,
    },
    {
      id: "tx-j5", childId: "child-jordan", date: "2025-04-01", amount: 45,
      type: "issued", allowanceType: "clothing", description: "Seasonal clothing allowance",
      receiptObtained: true, authorisedBy: "Darren Laville", childConsented: true,
    },
    {
      id: "tx-j6", childId: "child-jordan", date: "2025-04-02", amount: 38.50,
      type: "spent", allowanceType: "clothing", description: "Trainers and t-shirts",
      receiptObtained: true, authorisedBy: "Darren Laville", childConsented: true,
    },
    // Morgan transactions
    {
      id: "tx-m1", childId: "child-morgan", date: "2025-02-03", amount: 12,
      type: "issued", allowanceType: "pocket_money", description: "Weekly pocket money",
      receiptObtained: false, authorisedBy: "Sarah Johnson", childConsented: true,
    },
    {
      id: "tx-m2", childId: "child-morgan", date: "2025-02-04", amount: 6,
      type: "saved", allowanceType: "savings", description: "Half saved to account",
      receiptObtained: false, authorisedBy: "Sarah Johnson", childConsented: true,
    },
    {
      id: "tx-m3", childId: "child-morgan", date: "2025-02-08", amount: 4.20,
      type: "spent", allowanceType: "transport", description: "Bus fare to town",
      receiptObtained: true, authorisedBy: "Lisa Williams", childConsented: true,
    },
    {
      id: "tx-m4", childId: "child-morgan", date: "2025-03-01", amount: 12,
      type: "issued", allowanceType: "pocket_money", description: "Weekly pocket money",
      receiptObtained: false, authorisedBy: "Sarah Johnson", childConsented: true,
    },
    {
      id: "tx-m5", childId: "child-morgan", date: "2025-03-10", amount: 8.50,
      type: "spent", allowanceType: "education", description: "Revision guides",
      receiptObtained: true, authorisedBy: "Tom Richards", childConsented: true,
    },
  ];

  const audits: FinancialAudit[] = [
    {
      id: "audit-1",
      auditDate: "2025-04-15",
      auditor: "Darren Laville",
      status: "compliant",
      discrepanciesFound: 1,
      discrepanciesResolved: 1,
      recommendationsCount: 2,
      recommendationsActioned: 2,
      policyCompliant: true,
      recordsAccurate: true,
      receiptsComplete: true,
    },
  ];

  const policy: AllowancePolicy = {
    id: "policy-1",
    policyReviewedDate: "2025-01-10",
    ageAppropriateRates: true,
    regularPaymentSchedule: true,
    savingsEncouraged: true,
    financialLiteracyProgramme: true,
    birthdayHolidayGuidance: true,
    clothingAllowanceAdequate: true,
  };

  return { profiles, transactions, audits, policy };
}

// -- GET Handler --------------------------------------------------------------

export async function GET() {
  try {
    const { profiles, transactions, audits, policy } = getDemoData();
    const result = generateFinancialStewardshipIntelligence(
      profiles,
      transactions,
      audits,
      policy,
      "oak-house",
      "2025-01-01",
      "2025-06-30",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate financial stewardship intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// -- POST Handler -------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profiles, transactions, audits, policy, homeId, periodStart, periodEnd } = body;

    if (!homeId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: homeId, periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (!Array.isArray(profiles) || !Array.isArray(transactions) || !Array.isArray(audits)) {
      return NextResponse.json(
        { error: "profiles, transactions, and audits must be arrays" },
        { status: 400 },
      );
    }

    const result = generateFinancialStewardshipIntelligence(
      profiles,
      transactions,
      audits,
      policy || null,
      homeId,
      periodStart,
      periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process financial stewardship data", details: String(error) },
      { status: 500 },
    );
  }
}
