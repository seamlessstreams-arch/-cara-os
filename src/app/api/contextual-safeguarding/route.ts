// ══════════════════════════════════════════════════════════════════════════════
// API: /api/contextual-safeguarding
//
// Contextual Safeguarding Intelligence
//
// GET  — Returns contextual assessment with demo environmental/peer/online data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateContextualAssessment,
  getHarmDomainLabel,
  getRiskLevelLabel,
} from "@/lib/contextual-safeguarding";
import type {
  EnvironmentalRisk,
  PeerAssociation,
  OnlineRisk,
  ProtectiveFactor,
  Intervention,
  MappingEvent,
} from "@/lib/contextual-safeguarding";

// ── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_CHILDREN = [
  { id: "child-alex", name: "Alex" },
  { id: "child-jordan", name: "Jordan" },
  { id: "child-morgan", name: "Morgan" },
];

const DEMO_ENV_RISKS: EnvironmentalRisk[] = [
  {
    id: "env-001",
    type: "location",
    name: "Riverside Retail Park (rear car park)",
    description: "Known county lines exchange point. Three CYP from the area identified as exploited here.",
    harmDomains: ["county_lines", "criminal_exploitation", "substance_supply"],
    riskLevel: "serious",
    lastAssessed: "2026-05-12",
    associatedChildren: ["child-alex"],
    knownPerpetrators: ["Adult male 'D' (NFA pending)", "Unknown vehicle reg"],
    isActive: true,
    mitigationsInPlace: ["Police community mapping shared", "Curfew adjusted for Alex", "Diversionary activities planned"],
  },
  {
    id: "env-002",
    type: "peer_group",
    name: "Park Lane Estate Group",
    description: "Group of 5-7 young people aged 14-17, linked to antisocial behaviour and suspected drug running",
    harmDomains: ["criminal_exploitation", "gang_affiliation"],
    riskLevel: "significant",
    lastAssessed: "2026-05-10",
    associatedChildren: ["child-alex", "child-jordan"],
    isActive: true,
    mitigationsInPlace: ["Multi-agency intel shared", "Key work sessions on exploitation awareness"],
  },
  {
    id: "env-003",
    type: "online_space",
    name: "Private Telegram Group",
    description: "Closed messaging group sharing inappropriate content and arranging meetups",
    harmDomains: ["online_exploitation", "sexual_exploitation"],
    riskLevel: "significant",
    lastAssessed: "2026-05-08",
    associatedChildren: ["child-morgan"],
    isActive: true,
    mitigationsInPlace: ["Device monitoring enhanced", "E-safety discussion completed"],
  },
];

const DEMO_PEERS: PeerAssociation[] = [
  { id: "peer-001", childId: "child-alex", peerName: "Kai (pseudonym)", peerType: "high_risk", harmDomains: ["county_lines", "criminal_exploitation"], context: "Town centre and retail park", frequency: "weekly", isMonitored: true, lastContact: "2026-05-14" },
  { id: "peer-002", childId: "child-alex", peerName: "Remi (pseudonym)", peerType: "concerning", harmDomains: ["criminal_exploitation"], context: "School and online", frequency: "daily", isMonitored: true, lastContact: "2026-05-16" },
  { id: "peer-003", childId: "child-alex", peerName: "Tyler", peerType: "positive", harmDomains: [], context: "Football club", frequency: "weekly", isMonitored: false },
  { id: "peer-004", childId: "child-jordan", peerName: "Jayden (pseudonym)", peerType: "concerning", harmDomains: ["gang_affiliation"], context: "Park Lane Estate", frequency: "occasional", isMonitored: true, lastContact: "2026-05-11" },
  { id: "peer-005", childId: "child-morgan", peerName: "Online contact 'L'", peerType: "high_risk", harmDomains: ["online_exploitation"], context: "Telegram / Snapchat", frequency: "online_only", isMonitored: true, lastContact: "2026-05-13" },
];

const DEMO_ONLINE: OnlineRisk[] = [
  { id: "online-001", childId: "child-morgan", platform: "Telegram", riskType: "online_exploitation", riskLevel: "significant", description: "Added to private group by unknown adult", identifiedDate: "2026-05-05", isActive: true, actionTaken: "Device monitoring, MASH referral made" },
  { id: "online-002", childId: "child-alex", platform: "Snapchat", riskType: "criminal_exploitation", riskLevel: "moderate", description: "Receiving disappearing messages from contacts linked to county lines network", identifiedDate: "2026-05-10", isActive: true, actionTaken: "Phone checked with consent, intel shared with police" },
];

const DEMO_PROTECTIVE: ProtectiveFactor[] = [
  { id: "pf-001", childId: "child-alex", type: "trusted_adult", description: "Strong relationship with KW Sarah — Alex seeks her out during distress", strength: "strong", lastEvidenced: "2026-05-16" },
  { id: "pf-002", childId: "child-alex", type: "structured_activity", description: "Football training 2x weekly — positive peer group and routine", strength: "moderate", lastEvidenced: "2026-05-15" },
  { id: "pf-003", childId: "child-alex", type: "safety_plan", description: "Exploitation safety plan with Alex — reviewed monthly", strength: "moderate", lastEvidenced: "2026-05-01" },
  { id: "pf-004", childId: "child-jordan", type: "trusted_adult", description: "Good rapport with Tom (KW) — uses check-ins after school", strength: "moderate", lastEvidenced: "2026-05-14" },
  { id: "pf-005", childId: "child-jordan", type: "education_engagement", description: "Attending school consistently, engaged in art coursework", strength: "strong", lastEvidenced: "2026-05-16" },
  { id: "pf-006", childId: "child-morgan", type: "therapeutic_support", description: "Weekly CAMHS sessions — processing trauma history", strength: "moderate", lastEvidenced: "2026-05-13" },
  { id: "pf-007", childId: "child-morgan", type: "trusted_adult", description: "Trusts Lisa (KW) — disclosed online contact to her", strength: "strong", lastEvidenced: "2026-05-08" },
];

const DEMO_INTERVENTIONS: Intervention[] = [
  { id: "int-001", childId: "child-alex", harmDomain: "criminal_exploitation", description: "Contextual safeguarding mentoring programme via local Youth Justice Service", status: "in_progress", startDate: "2026-04-15", reviewDate: "2026-06-15", assignedTo: "Sarah Johnson (KW)", multiAgencyInvolved: true, partners: ["Youth Justice Service", "Police CMET team"] },
  { id: "int-002", childId: "child-alex", harmDomain: "county_lines", description: "NRM referral submitted for county lines exploitation", status: "in_progress", startDate: "2026-05-10", assignedTo: "Darren Laville (RM)", multiAgencyInvolved: true, partners: ["Modern Slavery Unit", "Placing Authority"] },
  { id: "int-003", childId: "child-morgan", harmDomain: "online_exploitation", description: "Enhanced device monitoring and digital literacy programme", status: "effective", startDate: "2026-04-01", assignedTo: "Lisa Williams (KW)", multiAgencyInvolved: false, impactEvidence: "Morgan proactively disclosed new contact and handed phone for checking" },
];

const DEMO_EVENTS: MappingEvent[] = [
  { id: "evt-001", childId: "child-alex", date: "2026-05-12", harmDomain: "criminal_exploitation", description: "Alex observed near retail park with Kai during curfew hours", environmentId: "env-001", peerAssociationId: "peer-001", severity: 4, wasEscalated: true, responseAdequate: true },
  { id: "evt-002", childId: "child-alex", date: "2026-05-14", harmDomain: "county_lines", description: "Alex returned to home with new phone and unexplained cash (£40)", severity: 4, wasEscalated: true, responseAdequate: true },
  { id: "evt-003", childId: "child-morgan", date: "2026-05-08", harmDomain: "online_exploitation", description: "Morgan disclosed being asked for photos by online contact 'L'", peerAssociationId: "peer-005", severity: 3, wasEscalated: true, responseAdequate: true },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateContextualAssessment(
    DEMO_CHILDREN,
    DEMO_ENV_RISKS,
    DEMO_PEERS,
    DEMO_ONLINE,
    DEMO_PROTECTIVE,
    DEMO_INTERVENTIONS,
    DEMO_EVENTS,
    "oak-house",
    "2026-05-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        harmDomainLabels: result.harmDomainBreakdown.map((h) => ({
          ...h,
          label: getHarmDomainLabel(h.domain),
          riskLabel: getRiskLevelLabel(h.riskLevel),
        })),
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
    children, environmentalRisks, peerAssociations, onlineRisks,
    protectiveFactors, interventions, events, homeId, periodStart, periodEnd,
  } = body as {
    children?: { id: string; name: string }[];
    environmentalRisks?: EnvironmentalRisk[];
    peerAssociations?: PeerAssociation[];
    onlineRisks?: OnlineRisk[];
    protectiveFactors?: ProtectiveFactor[];
    interventions?: Intervention[];
    events?: MappingEvent[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!children || !Array.isArray(children) || children.length === 0) {
    return NextResponse.json({ error: "children array is required" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateContextualAssessment(
    children,
    environmentalRisks ?? [],
    peerAssociations ?? [],
    onlineRisks ?? [],
    protectiveFactors ?? [],
    interventions ?? [],
    events ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
