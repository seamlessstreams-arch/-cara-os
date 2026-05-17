// ══════════════════════════════════════════════════════════════════════════════
// Pocket Money & Savings — API Route
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateChildFinancialCompliance,
  calculateHomeFinancialMetrics,
} from "@/lib/pocket-money";
import type {
  ChildFinancialProfile,
  FinancialTransaction,
  LiteracySession,
} from "@/lib/pocket-money";

// ── Demo Data ──────────────────────────────────────────────────────────────

function weeklyPocketMoney(childId: string, rate: number, startWeeksAgo: number): FinancialTransaction[] {
  const now = Date.now();
  const txns: FinancialTransaction[] = [];
  for (let w = 0; w < startWeeksAgo; w++) {
    const date = new Date(now - w * 7 * 24 * 60 * 60 * 1000);
    txns.push({
      id: `pm-${childId}-${w}`,
      date: date.toISOString(),
      type: "pocket_money",
      amount: rate,
      description: "Weekly pocket money",
      method: "cash",
      receiptRecorded: true,
      authorisedBy: "staff-rm-01",
      childSignature: true,
    });
  }
  return txns;
}

function monthlySavings(childId: string, amount: number, months: number): FinancialTransaction[] {
  const now = Date.now();
  const txns: FinancialTransaction[] = [];
  for (let m = 0; m < months; m++) {
    const date = new Date(now - m * 30 * 24 * 60 * 60 * 1000);
    txns.push({
      id: `sv-${childId}-${m}`,
      date: date.toISOString(),
      type: "savings_deposit",
      amount,
      description: "Monthly savings",
      method: "bank_transfer",
      receiptRecorded: true,
      authorisedBy: "staff-rm-01",
    });
  }
  return txns;
}

const DEMO_PROFILES: ChildFinancialProfile[] = [
  {
    childId: "child-alex",
    childName: "Alex Turner",
    homeId: "home-oak",
    dateOfBirth: "2012-01-15T00:00:00Z",
    weeklyPocketMoneyRate: 15,
    monthlyClothingAllowance: 50,
    birthdayAllowance: 50,
    festivalAllowance: 30,
    savingsAccountExists: true,
    savingsAccountBalance: 340,
    savingsTargetMonthly: 20,
    prepaidCardIssued: true,
    transactions: [
      ...weeklyPocketMoney("alex", 15, 8),
      ...monthlySavings("alex", 20, 4),
      { id: "cl-alex-1", date: new Date(Date.now() - 20 * 86400000).toISOString(), type: "clothing_allowance", amount: 45, description: "New trainers", method: "prepaid_card", receiptRecorded: true, authorisedBy: "staff-sw-01", childSignature: true },
      { id: "cl-alex-2", date: new Date(Date.now() - 50 * 86400000).toISOString(), type: "clothing_allowance", amount: 30, description: "School shirt", method: "prepaid_card", receiptRecorded: true, authorisedBy: "staff-sw-01" },
      { id: "bd-alex", date: "2026-01-15T10:00:00Z", type: "birthday_money", amount: 50, description: "Birthday money", method: "cash", receiptRecorded: true, authorisedBy: "staff-rm-01", childSignature: true },
    ],
    literacySessions: [
      { id: "ls-a1", date: new Date(Date.now() - 7 * 86400000).toISOString(), topic: "budgeting", duration: 30, facilitatedBy: "staff-sw-01" },
      { id: "ls-a2", date: new Date(Date.now() - 28 * 86400000).toISOString(), topic: "saving", duration: 30, facilitatedBy: "staff-sw-01" },
      { id: "ls-a3", date: new Date(Date.now() - 60 * 86400000).toISOString(), topic: "banking", duration: 25, facilitatedBy: "staff-rm-01" },
      { id: "ls-a4", date: new Date(Date.now() - 80 * 86400000).toISOString(), topic: "comparison_shopping", duration: 20, facilitatedBy: "staff-sw-01" },
      { id: "ls-a5", date: new Date(Date.now() - 120 * 86400000).toISOString(), topic: "online_safety", duration: 20, facilitatedBy: "staff-rm-01" },
    ],
    financialPlanInPlace: true,
    childInvolvedInBudget: true,
  },
  {
    childId: "child-jordan",
    childName: "Jordan Mitchell",
    homeId: "home-oak",
    dateOfBirth: "2010-08-22T00:00:00Z",
    weeklyPocketMoneyRate: 18,
    monthlyClothingAllowance: 60,
    birthdayAllowance: 50,
    festivalAllowance: 30,
    savingsAccountExists: true,
    savingsAccountBalance: 520,
    savingsTargetMonthly: 25,
    prepaidCardIssued: true,
    transactions: [
      ...weeklyPocketMoney("jordan", 18, 6),
      ...monthlySavings("jordan", 25, 3),
      { id: "cl-j1", date: new Date(Date.now() - 15 * 86400000).toISOString(), type: "clothing_allowance", amount: 55, description: "Jacket", method: "prepaid_card", receiptRecorded: true, authorisedBy: "staff-sw-02", childSignature: true },
      { id: "act-j1", date: new Date(Date.now() - 10 * 86400000).toISOString(), type: "activity_money", amount: 12, description: "Cinema trip", method: "cash", receiptRecorded: true, authorisedBy: "staff-sw-01" },
      { id: "bd-j", date: "2025-08-22T10:00:00Z", type: "birthday_money", amount: 50, description: "Birthday money", method: "cash", receiptRecorded: true, authorisedBy: "staff-rm-01", childSignature: true },
    ],
    literacySessions: [
      { id: "ls-j1", date: new Date(Date.now() - 14 * 86400000).toISOString(), topic: "bills_and_utilities", duration: 30, facilitatedBy: "staff-sw-01" },
      { id: "ls-j2", date: new Date(Date.now() - 45 * 86400000).toISOString(), topic: "debt_awareness", duration: 25, facilitatedBy: "staff-rm-01" },
      { id: "ls-j3", date: new Date(Date.now() - 75 * 86400000).toISOString(), topic: "employment_income", duration: 30, facilitatedBy: "staff-sw-01" },
      { id: "ls-j4", date: new Date(Date.now() - 100 * 86400000).toISOString(), topic: "budgeting", duration: 30, facilitatedBy: "staff-rm-01" },
    ],
    financialPlanInPlace: true,
    childInvolvedInBudget: true,
  },
  {
    childId: "child-sam",
    childName: "Sam Okafor",
    homeId: "home-oak",
    dateOfBirth: "2015-03-10T00:00:00Z",
    weeklyPocketMoneyRate: 10,
    monthlyClothingAllowance: 40,
    birthdayAllowance: 40,
    festivalAllowance: 25,
    savingsAccountExists: true,
    savingsAccountBalance: 180,
    savingsTargetMonthly: 15,
    prepaidCardIssued: false,
    transactions: [
      ...weeklyPocketMoney("sam", 10, 8),
      ...monthlySavings("sam", 15, 4),
      { id: "cl-s1", date: new Date(Date.now() - 25 * 86400000).toISOString(), type: "clothing_allowance", amount: 35, description: "School shoes", method: "cash", receiptRecorded: true, authorisedBy: "staff-sw-01" },
      { id: "bd-s", date: "2026-03-10T10:00:00Z", type: "birthday_money", amount: 40, description: "Birthday money", method: "cash", receiptRecorded: true, authorisedBy: "staff-rm-01", childSignature: true },
    ],
    literacySessions: [
      { id: "ls-s1", date: new Date(Date.now() - 10 * 86400000).toISOString(), topic: "saving", duration: 20, facilitatedBy: "staff-sw-01" },
      { id: "ls-s2", date: new Date(Date.now() - 40 * 86400000).toISOString(), topic: "budgeting", duration: 20, facilitatedBy: "staff-sw-01" },
      { id: "ls-s3", date: new Date(Date.now() - 70 * 86400000).toISOString(), topic: "comparison_shopping", duration: 20, facilitatedBy: "staff-rm-01" },
    ],
    financialPlanInPlace: false,
    childInvolvedInBudget: true,
  },
  {
    childId: "child-casey",
    childName: "Casey Brown",
    homeId: "home-oak",
    dateOfBirth: "2011-11-05T00:00:00Z",
    weeklyPocketMoneyRate: 15,
    monthlyClothingAllowance: 50,
    birthdayAllowance: 50,
    festivalAllowance: 30,
    savingsAccountExists: false,
    savingsTargetMonthly: 0,
    prepaidCardIssued: false,
    transactions: [
      ...weeklyPocketMoney("casey", 15, 3), // only 3 weeks — shortfall
    ],
    literacySessions: [
      { id: "ls-c1", date: new Date(Date.now() - 30 * 86400000).toISOString(), topic: "budgeting", duration: 25, facilitatedBy: "staff-sw-01" },
    ],
    financialPlanInPlace: false,
    childInvolvedInBudget: false,
  },
];

// ── Handler ───────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId") || "home-oak";
  const mode = searchParams.get("mode") || "dashboard";
  const childId = searchParams.get("childId");
  const now = new Date().toISOString();

  if (mode === "child" && childId) {
    const profile = DEMO_PROFILES.find(p => p.childId === childId && p.homeId === homeId);
    if (!profile) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }
    const result = evaluateChildFinancialCompliance(profile, now);
    return NextResponse.json(result);
  }

  if (mode === "metrics") {
    const metrics = calculateHomeFinancialMetrics(DEMO_PROFILES, homeId, now);
    return NextResponse.json(metrics);
  }

  // Dashboard mode
  const homeProfiles = DEMO_PROFILES.filter(p => p.homeId === homeId);
  const metrics = calculateHomeFinancialMetrics(homeProfiles, homeId, now);
  const childResults = homeProfiles.map(p => evaluateChildFinancialCompliance(p, now));

  // Recent transactions across all children (last 14 days)
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recentTransactions = homeProfiles
    .flatMap(p => p.transactions.map(t => ({ ...t, childName: p.childName })))
    .filter(t => new Date(t.date).getTime() > fourteenDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)
    .map(t => ({
      id: t.id,
      childName: t.childName,
      type: t.type,
      amount: t.amount,
      date: t.date,
      receiptRecorded: t.receiptRecorded,
    }));

  return NextResponse.json({
    metrics: {
      overallFinancialScore: metrics.overallFinancialScore,
      pocketMoneyComplianceRate: metrics.pocketMoneyComplianceRate,
      savingsAccountRate: metrics.savingsAccountRate,
      averageSavingsBalance: metrics.averageSavingsBalance,
      receiptComplianceRate: metrics.receiptComplianceRate,
      clothingAllowanceUtilisation: metrics.clothingAllowanceUtilisation,
      literacySessionRate: metrics.literacySessionRate,
      totalSpend30Days: metrics.totalSpend30Days,
    },
    children: childResults.map(r => ({
      childId: r.childId,
      childName: r.childName,
      age: r.age,
      financialWellbeingScore: r.financialWellbeingScore,
      isCompliant: r.isCompliant,
      pocketMoneyOnTime: r.pocketMoneyOnTime,
      savingsBalance: r.savingsBalance,
      issues: r.issues,
    })),
    recentTransactions,
    complianceIssues: metrics.complianceIssues,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, homeId, profile, profiles, now } = body;

  if (action === "evaluate" && profile) {
    const result = evaluateChildFinancialCompliance(profile, now);
    return NextResponse.json(result);
  }

  if (action === "metrics" && profiles) {
    const result = calculateHomeFinancialMetrics(profiles, homeId || "home-oak", now);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
