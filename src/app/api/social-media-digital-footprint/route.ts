// ══════════════════════════════════════════════════════════════════════════════
// API: /api/social-media-digital-footprint
//
// Social Media & Digital Footprint Intelligence
//
// GET  — Returns digital footprint metrics with demo data (Chamberlain House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateSocialMediaDigitalFootprintIntelligence,
  getConsentTypeLabel,
  getConsentStatusLabel,
  getRiskCategoryLabel,
  getSeverityLabel,
  getRatingLabel,
} from "@/lib/social-media-digital-footprint";
import type {
  ImageConsentRecord,
  DigitalSafetyIncident,
  DigitalSafetyPolicy,
  StaffDigitalTraining,
} from "@/lib/social-media-digital-footprint";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  consents: ImageConsentRecord[];
  incidents: DigitalSafetyIncident[];
  policies: DigitalSafetyPolicy[];
  training: StaffDigitalTraining[];
} {
  const consents: ImageConsentRecord[] = [
    // Alex (14) — consents
    {
      id: "consent-001",
      childId: "child-alex",
      childName: "Alex",
      consentType: "photo",
      consentStatus: "granted",
      reviewDate: "2026-04-15",
      parentCarerConsulted: true,
      childConsulted: true,
      expiryDate: "2027-04-15",
    },
    {
      id: "consent-002",
      childId: "child-alex",
      childName: "Alex",
      consentType: "social_media",
      consentStatus: "refused",
      reviewDate: "2026-04-15",
      parentCarerConsulted: true,
      childConsulted: true,
      expiryDate: "2027-04-15",
    },
    {
      id: "consent-003",
      childId: "child-alex",
      childName: "Alex",
      consentType: "website",
      consentStatus: "granted",
      reviewDate: "2026-04-15",
      parentCarerConsulted: true,
      childConsulted: true,
      expiryDate: "2027-04-15",
    },
    // Jordan (13) — consents
    {
      id: "consent-004",
      childId: "child-jordan",
      childName: "Jordan",
      consentType: "photo",
      consentStatus: "granted",
      reviewDate: "2026-03-20",
      parentCarerConsulted: true,
      childConsulted: true,
      expiryDate: "2027-03-20",
    },
    {
      id: "consent-005",
      childId: "child-jordan",
      childName: "Jordan",
      consentType: "video",
      consentStatus: "granted",
      reviewDate: "2026-03-20",
      parentCarerConsulted: true,
      childConsulted: true,
      expiryDate: "2027-03-20",
    },
    {
      id: "consent-006",
      childId: "child-jordan",
      childName: "Jordan",
      consentType: "newsletter",
      consentStatus: "pending",
      reviewDate: "2026-03-20",
      parentCarerConsulted: false,
      childConsulted: true,
      expiryDate: "2027-03-20",
    },
    // Morgan (15) — consents
    {
      id: "consent-007",
      childId: "child-morgan",
      childName: "Morgan",
      consentType: "photo",
      consentStatus: "refused",
      reviewDate: "2026-05-01",
      parentCarerConsulted: true,
      childConsulted: true,
      expiryDate: "2027-05-01",
    },
    {
      id: "consent-008",
      childId: "child-morgan",
      childName: "Morgan",
      consentType: "social_media",
      consentStatus: "refused",
      reviewDate: "2026-05-01",
      parentCarerConsulted: true,
      childConsulted: true,
      expiryDate: "2027-05-01",
    },
    {
      id: "consent-009",
      childId: "child-morgan",
      childName: "Morgan",
      consentType: "press",
      consentStatus: "refused",
      reviewDate: "2026-05-01",
      parentCarerConsulted: true,
      childConsulted: true,
      expiryDate: "2027-05-01",
    },
  ];

  const incidents: DigitalSafetyIncident[] = [
    {
      id: "inc-001",
      childId: "child-morgan",
      childName: "Morgan",
      incidentDate: "2026-02-10",
      riskCategory: "cyberbullying",
      severity: "medium",
      reportedTimely: true,
      actionTaken: true,
      lessonLearned: true,
      preventionMeasures: true,
    },
    {
      id: "inc-002",
      childId: "child-alex",
      childName: "Alex",
      incidentDate: "2026-04-05",
      riskCategory: "inappropriate_content",
      severity: "low",
      reportedTimely: true,
      actionTaken: true,
      lessonLearned: true,
      preventionMeasures: true,
    },
  ];

  const policies: DigitalSafetyPolicy[] = [
    {
      id: "policy-001",
      policyReviewDate: "2026-03-15",
      policyCurrent: true,
      imageConsentProcess: true,
      socialMediaGuidance: true,
      digitalFootprintProtection: true,
      cyberbullyingProtocol: true,
      dataProtectionCompliant: true,
      staffSocialMediaPolicy: true,
    },
  ];

  const training: StaffDigitalTraining[] = [
    {
      id: "dt-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      digitalSafeguarding: true,
      imageConsentProcess: true,
      socialMediaRisks: true,
      cyberbullyingResponse: true,
      dataProtection: true,
      onlineGroomingAwareness: true,
    },
    {
      id: "dt-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      digitalSafeguarding: true,
      imageConsentProcess: true,
      socialMediaRisks: true,
      cyberbullyingResponse: true,
      dataProtection: true,
      onlineGroomingAwareness: true,
    },
    {
      id: "dt-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      digitalSafeguarding: true,
      imageConsentProcess: true,
      socialMediaRisks: true,
      cyberbullyingResponse: false,
      dataProtection: true,
      onlineGroomingAwareness: true,
    },
    {
      id: "dt-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      digitalSafeguarding: true,
      imageConsentProcess: true,
      socialMediaRisks: true,
      cyberbullyingResponse: true,
      dataProtection: true,
      onlineGroomingAwareness: true,
    },
  ];

  return { consents, incidents, policies, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { consents, incidents, policies, training } = generateDemoData();

  const result = generateSocialMediaDigitalFootprintIntelligence(
    consents,
    incidents,
    policies,
    training,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        consentSummary: consents.map((c) => ({
          id: c.id,
          childName: c.childName,
          type: getConsentTypeLabel(c.consentType),
          status: getConsentStatusLabel(c.consentStatus),
          reviewDate: c.reviewDate,
        })),
        incidentSummary: incidents.map((i) => ({
          id: i.id,
          childName: i.childName,
          date: i.incidentDate,
          category: getRiskCategoryLabel(i.riskCategory),
          severity: getSeverityLabel(i.severity),
        })),
        ratingLabel: getRatingLabel(result.rating),
      },
    },
  });
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
    consents,
    incidents,
    policies,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    consents?: ImageConsentRecord[];
    incidents?: DigitalSafetyIncident[];
    policies?: DigitalSafetyPolicy[];
    training?: StaffDigitalTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateSocialMediaDigitalFootprintIntelligence(
    consents ?? [],
    incidents ?? [],
    policies ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
