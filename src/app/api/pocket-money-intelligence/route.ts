import { NextResponse } from "next/server";
import { generatePocketMoneyIntelligence } from "@/lib/pocket-money";
import type { PocketMoneyRecord, PocketMoneyPolicy, StaffPocketMoneyTraining } from "@/lib/pocket-money";

const DEMO_RECORDS: PocketMoneyRecord[] = [
  { id: "pm-001", homeId: "home-oak", date: "2026-01-15", childId: "child-alex", childName: "Alex", category: "weekly_allowance", outcome: "properly_recorded", receiptObtained: true, childConsentRecorded: true, balanceUpdated: true, supervisorApproved: true, documentationComplete: true, timelyRecording: true },
  { id: "pm-002", homeId: "home-oak", date: "2026-02-10", childId: "child-alex", childName: "Alex", category: "birthday_money", outcome: "properly_recorded", receiptObtained: true, childConsentRecorded: true, balanceUpdated: true, supervisorApproved: true, documentationComplete: true, timelyRecording: true },
  { id: "pm-003", homeId: "home-oak", date: "2026-03-05", childId: "child-alex", childName: "Alex", category: "savings_deposit", outcome: "properly_recorded", receiptObtained: true, childConsentRecorded: true, balanceUpdated: true, supervisorApproved: true, documentationComplete: true, timelyRecording: false },
  { id: "pm-004", homeId: "home-oak", date: "2026-04-01", childId: "child-alex", childName: "Alex", category: "educational_purchase", outcome: "properly_recorded", receiptObtained: true, childConsentRecorded: true, balanceUpdated: true, supervisorApproved: true, documentationComplete: true, timelyRecording: true },
  { id: "pm-005", homeId: "home-oak", date: "2026-01-20", childId: "child-jordan", childName: "Jordan", category: "clothing_allowance", outcome: "properly_recorded", receiptObtained: true, childConsentRecorded: true, balanceUpdated: true, supervisorApproved: true, documentationComplete: true, timelyRecording: true },
  { id: "pm-006", homeId: "home-oak", date: "2026-02-15", childId: "child-jordan", childName: "Jordan", category: "activity_funding", outcome: "partially_recorded", receiptObtained: true, childConsentRecorded: true, balanceUpdated: true, supervisorApproved: true, documentationComplete: true, timelyRecording: true },
  { id: "pm-007", homeId: "home-oak", date: "2026-03-10", childId: "child-jordan", childName: "Jordan", category: "personal_spending", outcome: "properly_recorded", receiptObtained: true, childConsentRecorded: true, balanceUpdated: true, supervisorApproved: true, documentationComplete: true, timelyRecording: false },
  { id: "pm-008", homeId: "home-oak", date: "2026-04-10", childId: "child-jordan", childName: "Jordan", category: "financial_literacy_session", outcome: "properly_recorded", receiptObtained: false, childConsentRecorded: true, balanceUpdated: true, supervisorApproved: true, documentationComplete: true, timelyRecording: true },
  { id: "pm-009", homeId: "home-oak", date: "2026-02-01", childId: "child-morgan", childName: "Morgan", category: "weekly_allowance", outcome: "properly_recorded", receiptObtained: true, childConsentRecorded: true, balanceUpdated: true, supervisorApproved: true, documentationComplete: true, timelyRecording: true },
  { id: "pm-010", homeId: "home-oak", date: "2026-03-15", childId: "child-morgan", childName: "Morgan", category: "savings_deposit", outcome: "properly_recorded", receiptObtained: true, childConsentRecorded: true, balanceUpdated: true, supervisorApproved: true, documentationComplete: true, timelyRecording: true },
  { id: "pm-011", homeId: "home-oak", date: "2026-04-10", childId: "child-morgan", childName: "Morgan", category: "educational_purchase", outcome: "late_recording", receiptObtained: true, childConsentRecorded: false, balanceUpdated: true, supervisorApproved: true, documentationComplete: true, timelyRecording: true },
  { id: "pm-012", homeId: "home-oak", date: "2026-05-01", childId: "child-morgan", childName: "Morgan", category: "clothing_allowance", outcome: "properly_recorded", receiptObtained: true, childConsentRecorded: true, balanceUpdated: false, supervisorApproved: true, documentationComplete: false, timelyRecording: true },
];

const DEMO_POLICY: PocketMoneyPolicy = {
  pocketMoneyPolicy: true, savingsAccountPolicy: true, spendingApprovalProcess: true,
  financialRecordKeepingPolicy: true, financialLiteracyProgramme: true, birthdayChristmasMoneyPolicy: true, independentSpendingGuidance: true,
};

const DEMO_STAFF: StaffPocketMoneyTraining[] = [
  { staffId: "staff-sarah", financialManagementKnowledge: true, recordKeepingSkills: true, childConsentPractice: true, savingsGuidanceSkills: true, financialLiteracyDelivery: true, budgetingSupport: true },
  { staffId: "staff-tom", financialManagementKnowledge: true, recordKeepingSkills: true, childConsentPractice: true, savingsGuidanceSkills: true, financialLiteracyDelivery: true, budgetingSupport: false },
  { staffId: "staff-lisa", financialManagementKnowledge: true, recordKeepingSkills: true, childConsentPractice: true, savingsGuidanceSkills: false, financialLiteracyDelivery: true, budgetingSupport: true },
  { staffId: "staff-darren", financialManagementKnowledge: true, recordKeepingSkills: true, childConsentPractice: true, savingsGuidanceSkills: true, financialLiteracyDelivery: true, budgetingSupport: true },
];

export async function GET() {
  const result = generatePocketMoneyIntelligence({
    homeId: "home-oak", periodStart: "2026-01-01", periodEnd: "2026-05-20",
    records: DEMO_RECORDS, policy: DEMO_POLICY, staff: DEMO_STAFF,
  });
  return NextResponse.json({ data: { ...result, meta: { generatedAt: new Date().toISOString(), engine: "pocket-money-intelligence", version: "2.0.0" } } });
}
