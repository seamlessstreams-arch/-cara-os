import { NextResponse } from "next/server";
import {
  generateAllegationsIntelligence,
} from "@/lib/allegations";
import type { AllegationRecord, AllegationPolicy, StaffAllegationTraining } from "@/lib/allegations";

// ── Demo Data ──────────────────────────────────────────────────────────────

const demoRecords: AllegationRecord[] = [
  // Alex — allegations handled well
  { id: "alg-1", childId: "child-alex", childName: "Alex", reportDate: "2026-02-05", category: "physical_abuse", ladoReferralMade: true, ofstedNotified: true, childSupportOffered: true, staffSupportProvided: true, documentationComplete: true, timelyInvestigation: true },
  { id: "alg-2", childId: "child-alex", childName: "Alex", reportDate: "2026-03-12", category: "emotional_abuse", ladoReferralMade: true, ofstedNotified: true, childSupportOffered: true, staffSupportProvided: true, documentationComplete: true, timelyInvestigation: true },
  { id: "alg-3", childId: "child-alex", childName: "Alex", reportDate: "2026-04-08", category: "inappropriate_restraint", ladoReferralMade: true, ofstedNotified: true, childSupportOffered: true, staffSupportProvided: true, documentationComplete: true, timelyInvestigation: false },
  { id: "alg-4", childId: "child-alex", childName: "Alex", reportDate: "2026-05-01", category: "professional_boundary", ladoReferralMade: true, ofstedNotified: true, childSupportOffered: true, staffSupportProvided: false, documentationComplete: true, timelyInvestigation: true },

  // Jordan — some gaps in process
  { id: "alg-5", childId: "child-jordan", childName: "Jordan", reportDate: "2026-02-20", category: "failure_to_safeguard", ladoReferralMade: true, ofstedNotified: true, childSupportOffered: true, staffSupportProvided: true, documentationComplete: true, timelyInvestigation: true },
  { id: "alg-6", childId: "child-jordan", childName: "Jordan", reportDate: "2026-03-18", category: "neglect", ladoReferralMade: true, ofstedNotified: false, childSupportOffered: true, staffSupportProvided: true, documentationComplete: false, timelyInvestigation: true },
  { id: "alg-7", childId: "child-jordan", childName: "Jordan", reportDate: "2026-04-22", category: "whistleblowing_concern", ladoReferralMade: false, ofstedNotified: true, childSupportOffered: true, staffSupportProvided: true, documentationComplete: true, timelyInvestigation: true },
  { id: "alg-8", childId: "child-jordan", childName: "Jordan", reportDate: "2026-05-10", category: "sexual_abuse", ladoReferralMade: true, ofstedNotified: true, childSupportOffered: true, staffSupportProvided: true, documentationComplete: true, timelyInvestigation: true },

  // Morgan — newer, fewer records
  { id: "alg-9", childId: "child-morgan", childName: "Morgan", reportDate: "2026-03-25", category: "physical_abuse", ladoReferralMade: true, ofstedNotified: true, childSupportOffered: true, staffSupportProvided: true, documentationComplete: true, timelyInvestigation: true },
  { id: "alg-10", childId: "child-morgan", childName: "Morgan", reportDate: "2026-04-15", category: "emotional_abuse", ladoReferralMade: true, ofstedNotified: true, childSupportOffered: false, staffSupportProvided: true, documentationComplete: true, timelyInvestigation: false },
  { id: "alg-11", childId: "child-morgan", childName: "Morgan", reportDate: "2026-05-02", category: "neglect", ladoReferralMade: true, ofstedNotified: false, childSupportOffered: true, staffSupportProvided: true, documentationComplete: true, timelyInvestigation: true },
  { id: "alg-12", childId: "child-morgan", childName: "Morgan", reportDate: "2026-05-15", category: "inappropriate_restraint", ladoReferralMade: true, ofstedNotified: true, childSupportOffered: true, staffSupportProvided: true, documentationComplete: false, timelyInvestigation: true },
];

const demoPolicy: AllegationPolicy = {
  id: "pol-alg-1",
  allegationsPolicy: true,
  ladoReferralProtocol: true,
  ofstedNotificationProcedure: true,
  dbsReferralGuidance: true,
  childProtectionFramework: true,
  whistleblowingPolicy: true,
  reviewSchedule: true,
};

const demoStaff: StaffAllegationTraining[] = [
  { id: "t-1", staffId: "staff-sarah", staffName: "Sarah Johnson", safeguardingKnowledge: true, allegationProcedures: true, ladoProcess: true, investigationSkills: true, childProtection: true, recordKeeping: true },
  { id: "t-2", staffId: "staff-tom", staffName: "Tom Richards", safeguardingKnowledge: true, allegationProcedures: true, ladoProcess: true, investigationSkills: false, childProtection: false, recordKeeping: true },
  { id: "t-3", staffId: "staff-lisa", staffName: "Lisa Williams", safeguardingKnowledge: true, allegationProcedures: true, ladoProcess: false, investigationSkills: true, childProtection: true, recordKeeping: false },
  { id: "t-4", staffId: "staff-darren", staffName: "Darren Laville", safeguardingKnowledge: true, allegationProcedures: true, ladoProcess: true, investigationSkills: true, childProtection: true, recordKeeping: true },
];

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateAllegationsIntelligence(
    demoRecords,
    demoPolicy,
    demoStaff,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: { generatedAt: new Date().toISOString(), engine: "allegations", version: "2.0.0" },
    },
  });
}
