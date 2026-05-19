// ==============================================================================
// Pocket Money & Financial Literacy Intelligence -- API Route
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  generatePocketMoneyFinancialLiteracyIntelligence,
  getPaymentFrequencyLabel,
  getSpendingCategoryLabel,
  getEducationTopicLabel,
  getSessionEngagementLabel,
  getRatingLabel,
} from "@/lib/pocket-money-financial-literacy";
import type {
  PocketMoneyRecord,
  SavingsAccount,
  FinancialEducationSession,
  StaffFinancialTraining,
  PaymentFrequency,
  SpendingCategory,
  EducationTopic,
  SessionEngagement,
  Rating,
} from "@/lib/pocket-money-financial-literacy";

// -- Demo Data ----------------------------------------------------------------

const PERIOD_START = "2026-01-01T00:00:00Z";
const PERIOD_END = "2026-03-31T23:59:59Z";

const DEMO_RECORDS: PocketMoneyRecord[] = [
  // Alex (14): £10/week, saves £3
  {
    id: "rec-001",
    childId: "child-alex",
    childName: "Alex",
    weekStarting: "2026-05-04",
    amountGiven: 10,
    amountSaved: 3,
    spendingCategories: ["personal_items", "food_treats"],
    receiptRecorded: true,
    childSignedOff: true,
  },
  {
    id: "rec-002",
    childId: "child-alex",
    childName: "Alex",
    weekStarting: "2026-05-11",
    amountGiven: 10,
    amountSaved: 3,
    spendingCategories: ["savings", "activities"],
    receiptRecorded: true,
    childSignedOff: true,
  },
  {
    id: "rec-003",
    childId: "child-alex",
    childName: "Alex",
    weekStarting: "2026-05-18",
    amountGiven: 10,
    amountSaved: 3,
    spendingCategories: ["personal_items", "technology"],
    receiptRecorded: true,
    childSignedOff: true,
  },

  // Jordan (13): £8/week, saves £2
  {
    id: "rec-004",
    childId: "child-jordan",
    childName: "Jordan",
    weekStarting: "2026-05-04",
    amountGiven: 8,
    amountSaved: 2,
    spendingCategories: ["food_treats", "activities"],
    receiptRecorded: true,
    childSignedOff: true,
  },
  {
    id: "rec-005",
    childId: "child-jordan",
    childName: "Jordan",
    weekStarting: "2026-05-11",
    amountGiven: 8,
    amountSaved: 2,
    spendingCategories: ["personal_items", "gifts"],
    receiptRecorded: true,
    childSignedOff: true,
  },
  {
    id: "rec-006",
    childId: "child-jordan",
    childName: "Jordan",
    weekStarting: "2026-05-18",
    amountGiven: 8,
    amountSaved: 2,
    spendingCategories: ["clothing", "food_treats"],
    receiptRecorded: true,
    childSignedOff: true,
  },

  // Morgan (15): £12/week, saves £4
  {
    id: "rec-007",
    childId: "child-morgan",
    childName: "Morgan",
    weekStarting: "2026-05-04",
    amountGiven: 12,
    amountSaved: 4,
    spendingCategories: ["technology", "personal_items"],
    receiptRecorded: true,
    childSignedOff: true,
  },
  {
    id: "rec-008",
    childId: "child-morgan",
    childName: "Morgan",
    weekStarting: "2026-05-11",
    amountGiven: 12,
    amountSaved: 4,
    spendingCategories: ["savings", "activities"],
    receiptRecorded: true,
    childSignedOff: true,
  },
  {
    id: "rec-009",
    childId: "child-morgan",
    childName: "Morgan",
    weekStarting: "2026-05-18",
    amountGiven: 12,
    amountSaved: 4,
    spendingCategories: ["clothing", "food_treats"],
    receiptRecorded: true,
    childSignedOff: true,
  },
];

const DEMO_ACCOUNTS: SavingsAccount[] = [
  {
    id: "sa-001",
    childId: "child-alex",
    childName: "Alex",
    accountType: "junior_isa",
    balance: 150,
    monthlyDeposits: 4,
    savingsGoalSet: true,
    savingsGoalDescription: "New bicycle",
  },
  {
    id: "sa-002",
    childId: "child-jordan",
    childName: "Jordan",
    accountType: "savings",
    balance: 85,
    monthlyDeposits: 3,
    savingsGoalSet: true,
    savingsGoalDescription: "Gaming headset",
  },
  {
    id: "sa-003",
    childId: "child-morgan",
    childName: "Morgan",
    accountType: "junior_isa",
    balance: 210,
    monthlyDeposits: 5,
    savingsGoalSet: true,
    savingsGoalDescription: "Laptop for college",
  },
];

const DEMO_SESSIONS: FinancialEducationSession[] = [
  {
    id: "sess-001",
    date: "2026-04-10T14:00:00Z",
    facilitatedBy: "Sarah Collins",
    topic: "budgeting",
    childrenAttended: ["child-alex", "child-jordan", "child-morgan"],
    engagement: "high",
    resourcesProvided: true,
  },
  {
    id: "sess-002",
    date: "2026-04-24T14:00:00Z",
    facilitatedBy: "Mark Taylor",
    topic: "saving",
    childrenAttended: ["child-alex", "child-jordan", "child-morgan"],
    engagement: "high",
    resourcesProvided: true,
  },
  {
    id: "sess-003",
    date: "2026-05-08T14:00:00Z",
    facilitatedBy: "Sarah Collins",
    topic: "banking",
    childrenAttended: ["child-alex", "child-jordan", "child-morgan"],
    engagement: "high",
    resourcesProvided: true,
  },
  {
    id: "sess-004",
    date: "2026-05-15T14:00:00Z",
    facilitatedBy: "Mark Taylor",
    topic: "comparison_shopping",
    childrenAttended: ["child-alex", "child-jordan", "child-morgan"],
    engagement: "high",
    resourcesProvided: true,
  },
];

const DEMO_TRAINING: StaffFinancialTraining[] = [
  {
    id: "tr-001",
    staffId: "staff-001",
    staffName: "Sarah Collins",
    pocketMoneyPolicyTrained: true,
    financialEducationTrained: true,
    budgetingSupportTrained: true,
    safeguardingFinancialAbuse: true,
    recordKeepingTrained: true,
  },
  {
    id: "tr-002",
    staffId: "staff-002",
    staffName: "Mark Taylor",
    pocketMoneyPolicyTrained: true,
    financialEducationTrained: true,
    budgetingSupportTrained: true,
    safeguardingFinancialAbuse: true,
    recordKeepingTrained: true,
  },
  {
    id: "tr-003",
    staffId: "staff-003",
    staffName: "Lisa Brown",
    pocketMoneyPolicyTrained: true,
    financialEducationTrained: true,
    budgetingSupportTrained: true,
    safeguardingFinancialAbuse: true,
    recordKeepingTrained: true,
  },
  {
    id: "tr-004",
    staffId: "staff-004",
    staffName: "Tom Green",
    pocketMoneyPolicyTrained: true,
    financialEducationTrained: true,
    budgetingSupportTrained: true,
    safeguardingFinancialAbuse: true,
    recordKeepingTrained: true,
  },
];

// -- Label Maps for Meta ------------------------------------------------------

const paymentFrequencyLabels: Record<PaymentFrequency, string> = {
  weekly: getPaymentFrequencyLabel("weekly"),
  fortnightly: getPaymentFrequencyLabel("fortnightly"),
  monthly: getPaymentFrequencyLabel("monthly"),
};

const spendingCategoryLabels: Record<SpendingCategory, string> = {
  savings: getSpendingCategoryLabel("savings"),
  personal_items: getSpendingCategoryLabel("personal_items"),
  activities: getSpendingCategoryLabel("activities"),
  food_treats: getSpendingCategoryLabel("food_treats"),
  gifts: getSpendingCategoryLabel("gifts"),
  clothing: getSpendingCategoryLabel("clothing"),
  technology: getSpendingCategoryLabel("technology"),
  other: getSpendingCategoryLabel("other"),
};

const educationTopicLabels: Record<EducationTopic, string> = {
  budgeting: getEducationTopicLabel("budgeting"),
  saving: getEducationTopicLabel("saving"),
  banking: getEducationTopicLabel("banking"),
  value_of_money: getEducationTopicLabel("value_of_money"),
  comparison_shopping: getEducationTopicLabel("comparison_shopping"),
  online_safety: getEducationTopicLabel("online_safety"),
  debt_awareness: getEducationTopicLabel("debt_awareness"),
};

const sessionEngagementLabels: Record<SessionEngagement, string> = {
  high: getSessionEngagementLabel("high"),
  medium: getSessionEngagementLabel("medium"),
  low: getSessionEngagementLabel("low"),
};

const ratingLabels: Record<Rating, string> = {
  outstanding: getRatingLabel("outstanding"),
  good: getRatingLabel("good"),
  requires_improvement: getRatingLabel("requires_improvement"),
  inadequate: getRatingLabel("inadequate"),
};

// -- GET Handler --------------------------------------------------------------

export async function GET() {
  const intelligence = generatePocketMoneyFinancialLiteracyIntelligence(
    DEMO_RECORDS,
    DEMO_ACCOUNTS,
    DEMO_SESSIONS,
    DEMO_TRAINING,
    "home-oak",
    PERIOD_START,
    PERIOD_END,
  );

  return NextResponse.json({
    data: {
      ...intelligence,
      meta: {
        paymentFrequencyLabels,
        spendingCategoryLabels,
        educationTopicLabels,
        sessionEngagementLabels,
        ratingLabels,
      },
    },
  });
}

// -- POST Handler -------------------------------------------------------------

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    records = [] as PocketMoneyRecord[],
    accounts = [] as SavingsAccount[],
    sessions = [] as FinancialEducationSession[],
    training = [] as StaffFinancialTraining[],
    homeId = "home-oak",
    periodStart = PERIOD_START,
    periodEnd = PERIOD_END,
  } = body;

  const intelligence = generatePocketMoneyFinancialLiteracyIntelligence(
    records,
    accounts,
    sessions,
    training,
    homeId,
    periodStart,
    periodEnd,
  );

  return NextResponse.json({
    data: {
      ...intelligence,
      meta: {
        paymentFrequencyLabels,
        spendingCategoryLabels,
        educationTopicLabels,
        sessionEngagementLabels,
        ratingLabels,
      },
    },
  });
}
