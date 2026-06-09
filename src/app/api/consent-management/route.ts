import { NextResponse } from "next/server";
import {
  generateConsentManagementIntelligence,
} from "@/lib/consent-management/consent-management-engine";
import type {
  ConsentRecord,
  ConsentPolicy,
  StaffConsentTraining,
} from "@/lib/consent-management/consent-management-engine";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

function getDemoRecords(): ConsentRecord[] {
  return [
    // Alex — comprehensive consent coverage
    { id: "cr-a1", childId: "child-alex", childName: "Alex", recordDate: "2026-01-15", category: "medical_treatment", status: "obtained", childViewsSought: true, consentDocumented: true, expiryTracked: true, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: true },
    { id: "cr-a2", childId: "child-alex", childName: "Alex", recordDate: "2026-01-15", category: "dental_treatment", status: "obtained", childViewsSought: true, consentDocumented: true, expiryTracked: true, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: true },
    { id: "cr-a3", childId: "child-alex", childName: "Alex", recordDate: "2026-01-20", category: "photography", status: "obtained", childViewsSought: true, consentDocumented: true, expiryTracked: true, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: true },
    { id: "cr-a4", childId: "child-alex", childName: "Alex", recordDate: "2026-01-20", category: "social_media", status: "obtained", childViewsSought: true, consentDocumented: true, expiryTracked: true, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: false },
    { id: "cr-a5", childId: "child-alex", childName: "Alex", recordDate: "2026-02-01", category: "educational_trips", status: "obtained", childViewsSought: true, consentDocumented: true, expiryTracked: true, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: true },
    { id: "cr-a6", childId: "child-alex", childName: "Alex", recordDate: "2026-02-01", category: "overnight_stays", status: "obtained", childViewsSought: true, consentDocumented: true, expiryTracked: true, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: true },
    { id: "cr-a7", childId: "child-alex", childName: "Alex", recordDate: "2026-02-10", category: "data_sharing", status: "obtained", childViewsSought: true, consentDocumented: true, expiryTracked: true, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: true },
    { id: "cr-a8", childId: "child-alex", childName: "Alex", recordDate: "2026-02-10", category: "therapeutic_intervention", status: "obtained", childViewsSought: true, consentDocumented: true, expiryTracked: true, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: true },

    // Jordan — good but with some gaps
    { id: "cr-j1", childId: "child-jordan", childName: "Jordan", recordDate: "2026-01-10", category: "medical_treatment", status: "obtained", childViewsSought: true, consentDocumented: true, expiryTracked: true, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: true },
    { id: "cr-j2", childId: "child-jordan", childName: "Jordan", recordDate: "2026-01-10", category: "dental_treatment", status: "obtained", childViewsSought: true, consentDocumented: true, expiryTracked: true, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: true },
    { id: "cr-j3", childId: "child-jordan", childName: "Jordan", recordDate: "2026-01-18", category: "photography", status: "refused", childViewsSought: true, consentDocumented: true, expiryTracked: false, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: false },
    { id: "cr-j4", childId: "child-jordan", childName: "Jordan", recordDate: "2026-02-05", category: "educational_trips", status: "obtained", childViewsSought: true, consentDocumented: true, expiryTracked: true, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: true },
    { id: "cr-j5", childId: "child-jordan", childName: "Jordan", recordDate: "2026-02-15", category: "overnight_stays", status: "pending", childViewsSought: false, consentDocumented: false, expiryTracked: false, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: false },
    { id: "cr-j6", childId: "child-jordan", childName: "Jordan", recordDate: "2026-03-01", category: "data_sharing", status: "obtained", childViewsSought: true, consentDocumented: true, expiryTracked: true, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: true },

    // Morgan — weakest profile
    { id: "cr-m1", childId: "child-morgan", childName: "Morgan", recordDate: "2026-01-25", category: "medical_treatment", status: "obtained", childViewsSought: false, consentDocumented: true, expiryTracked: true, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: false },
    { id: "cr-m2", childId: "child-morgan", childName: "Morgan", recordDate: "2026-01-25", category: "dental_treatment", status: "expired", childViewsSought: false, consentDocumented: true, expiryTracked: false, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: false },
    { id: "cr-m3", childId: "child-morgan", childName: "Morgan", recordDate: "2026-02-10", category: "photography", status: "pending", childViewsSought: false, consentDocumented: false, expiryTracked: false, parentCarerConsulted: false, staffRecorded: false, reviewScheduled: false },
    { id: "cr-m4", childId: "child-morgan", childName: "Morgan", recordDate: "2026-03-05", category: "data_sharing", status: "obtained", childViewsSought: true, consentDocumented: true, expiryTracked: true, parentCarerConsulted: true, staffRecorded: true, reviewScheduled: true },
  ];
}

function getDemoPolicy(): ConsentPolicy {
  return {
    id: "pol-oak",
    consentFramework: true,
    informedConsentGuidance: true,
    capacityAssessmentProtocol: true,
    gillikCompetenceProcess: true,
    consentRefusalProcess: true,
    dataConsentProtocol: true,
    regularReview: false,
  };
}

function getDemoTraining(): StaffConsentTraining[] {
  return [
    { id: "st-1", staffId: "staff-sarah", staffName: "Sarah Johnson", consentLawUnderstanding: true, capacityAssessment: true, gillikCompetence: true, documentationSkills: true, childParticipation: true, escalationProcess: true },
    { id: "st-2", staffId: "staff-tom", staffName: "Tom Richards", consentLawUnderstanding: true, capacityAssessment: true, gillikCompetence: true, documentationSkills: true, childParticipation: true, escalationProcess: false },
    { id: "st-3", staffId: "staff-lisa", staffName: "Lisa Williams", consentLawUnderstanding: true, capacityAssessment: true, gillikCompetence: false, documentationSkills: true, childParticipation: true, escalationProcess: true },
    { id: "st-4", staffId: "staff-darren", staffName: "Darren Laville", consentLawUnderstanding: true, capacityAssessment: true, gillikCompetence: true, documentationSkills: true, childParticipation: true, escalationProcess: true },
  ];
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const records = getDemoRecords();
    const policy = getDemoPolicy();
    const training = getDemoTraining();

    const result = generateConsentManagementIntelligence(
      records,
      policy,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-20",
    );

    return NextResponse.json({
      data: {
        ...result,
        meta: {
          generatedAt: new Date().toISOString(),
          engine: "consent-management",
          version: "1.0.0",
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate consent management intelligence", details: String(error) },
      { status: 500 },
    );
  }
}
