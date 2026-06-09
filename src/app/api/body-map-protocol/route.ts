// ==============================================================================
// API: /api/body-map-protocol
//
// Body Map Protocol Intelligence
//
// GET  — Returns body map protocol assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateBodyMapProtocolIntelligence,
  getMarkTypeLabel,
  getMarkOriginLabel,
  getDocumentationQualityLabel,
  getBodyRegionLabel,
  getActionTakenLabel,
  getRatingLabel,
} from "@/lib/body-map-protocol";
import type {
  BodyMapRecord,
  BodyMapAudit,
  BodyMapTraining,
  SafeguardingEscalation,
} from "@/lib/body-map-protocol";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_RECORDS: BodyMapRecord[] = [
  // Alex — bruise on knee from football, accidental explained
  {
    id: "bm-1",
    childId: "child-alex",
    childName: "Alex",
    dateRecorded: "2026-02-15",
    recordedBy: "Sarah Johnson",
    markType: "bruise",
    markOrigin: "accidental_explained",
    bodyRegion: "lower_limbs",
    documentationQuality: "thorough",
    childExplanationSought: true,
    childExplanationRecorded: true,
    witnessPresent: true,
    photographTaken: true,
    dateDiscovered: "2026-02-15",
    timelyRecording: true,
    actionsTaken: ["monitoring_only"],
    managerInformed: true,
    followUpRequired: false,
    followUpCompleted: null,
  },
  // Jordan — self-inflicted scratch on forearm
  {
    id: "bm-2",
    childId: "child-jordan",
    childName: "Jordan",
    dateRecorded: "2026-03-10",
    recordedBy: "Tom Richards",
    markType: "scratch",
    markOrigin: "self_inflicted",
    bodyRegion: "upper_limbs",
    documentationQuality: "thorough",
    childExplanationSought: true,
    childExplanationRecorded: true,
    witnessPresent: false,
    photographTaken: true,
    dateDiscovered: "2026-03-10",
    timelyRecording: true,
    actionsTaken: ["social_worker_notified", "monitoring_only"],
    managerInformed: true,
    followUpRequired: true,
    followUpCompleted: true,
  },
  // Jordan — unexplained bruise on upper arm
  {
    id: "bm-3",
    childId: "child-jordan",
    childName: "Jordan",
    dateRecorded: "2026-04-05",
    recordedBy: "Lisa Williams",
    markType: "bruise",
    markOrigin: "accidental_unexplained",
    bodyRegion: "upper_limbs",
    documentationQuality: "thorough",
    childExplanationSought: true,
    childExplanationRecorded: true,
    witnessPresent: false,
    photographTaken: true,
    dateDiscovered: "2026-04-05",
    timelyRecording: true,
    actionsTaken: ["social_worker_notified", "photograph_taken"],
    managerInformed: true,
    followUpRequired: true,
    followUpCompleted: true,
  },
  // Morgan — minor cut from cooking activity
  {
    id: "bm-4",
    childId: "child-morgan",
    childName: "Morgan",
    dateRecorded: "2026-03-22",
    recordedBy: "Sarah Johnson",
    markType: "cut",
    markOrigin: "accidental_explained",
    bodyRegion: "hands_feet",
    documentationQuality: "thorough",
    childExplanationSought: true,
    childExplanationRecorded: true,
    witnessPresent: true,
    photographTaken: false,
    dateDiscovered: "2026-03-22",
    timelyRecording: true,
    actionsTaken: ["monitoring_only"],
    managerInformed: true,
    followUpRequired: false,
    followUpCompleted: null,
  },
  // Alex — swelling on hand from sports
  {
    id: "bm-5",
    childId: "child-alex",
    childName: "Alex",
    dateRecorded: "2026-04-18",
    recordedBy: "Tom Richards",
    markType: "swelling",
    markOrigin: "accidental_explained",
    bodyRegion: "hands_feet",
    documentationQuality: "thorough",
    childExplanationSought: true,
    childExplanationRecorded: true,
    witnessPresent: true,
    photographTaken: true,
    dateDiscovered: "2026-04-18",
    timelyRecording: true,
    actionsTaken: ["gp_referral", "monitoring_only"],
    managerInformed: true,
    followUpRequired: true,
    followUpCompleted: true,
  },
];

const DEMO_AUDITS: BodyMapAudit[] = [
  {
    id: "aud-1",
    auditDate: "2026-02-01",
    auditor: "Darren Laville",
    protocolAccessible: true,
    staffTrained: true,
    templatesCurrent: true,
    storageSecure: true,
    retentionCompliant: true,
    crossReferencedWithIncidents: true,
    overallCompliant: true,
  },
  {
    id: "aud-2",
    auditDate: "2026-05-01",
    auditor: "Darren Laville",
    protocolAccessible: true,
    staffTrained: true,
    templatesCurrent: true,
    storageSecure: true,
    retentionCompliant: true,
    crossReferencedWithIncidents: true,
    overallCompliant: true,
  },
];

const DEMO_TRAINING: BodyMapTraining[] = [
  { id: "tr-1", staffId: "staff-sarah", staffName: "Sarah Johnson", trainingDate: "2026-01-10", bodyMapTrained: true, safeguardingAwareness: true, photographyProtocol: true, documentationStandards: true, escalationProcedure: true },
  { id: "tr-2", staffId: "staff-tom", staffName: "Tom Richards", trainingDate: "2026-01-10", bodyMapTrained: true, safeguardingAwareness: true, photographyProtocol: true, documentationStandards: true, escalationProcedure: true },
  { id: "tr-3", staffId: "staff-lisa", staffName: "Lisa Williams", trainingDate: "2026-01-10", bodyMapTrained: true, safeguardingAwareness: true, photographyProtocol: true, documentationStandards: true, escalationProcedure: true },
  { id: "tr-4", staffId: "staff-darren", staffName: "Darren Laville", trainingDate: "2026-01-10", bodyMapTrained: true, safeguardingAwareness: true, photographyProtocol: true, documentationStandards: true, escalationProcedure: true },
];

const DEMO_ESCALATIONS: SafeguardingEscalation[] = [
  {
    id: "esc-1",
    bodyMapId: "bm-3",
    childId: "child-jordan",
    childName: "Jordan",
    escalationDate: "2026-04-05",
    escalatedTo: "Social Worker — Mark Thompson",
    referralMade: true,
    outcomeRecorded: true,
    timelyEscalation: true,
    appropriateResponse: true,
  },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateBodyMapProtocolIntelligence(
    DEMO_RECORDS,
    DEMO_AUDITS,
    DEMO_TRAINING,
    DEMO_ESCALATIONS,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        markTypeLabels: Object.fromEntries(
          (["bruise", "scratch", "cut", "burn", "bite", "swelling", "rash", "other_mark"] as const).map(
            (t) => [t, getMarkTypeLabel(t)],
          ),
        ),
        markOriginLabels: Object.fromEntries(
          (["accidental_explained", "accidental_unexplained", "self_inflicted", "alleged_peer", "alleged_adult", "restraint_related", "unknown", "pre_existing"] as const).map(
            (o) => [o, getMarkOriginLabel(o)],
          ),
        ),
        documentationQualityLabels: Object.fromEntries(
          (["thorough", "adequate", "incomplete", "not_documented"] as const).map(
            (q) => [q, getDocumentationQualityLabel(q)],
          ),
        ),
        bodyRegionLabels: Object.fromEntries(
          (["head_face", "neck", "torso_front", "torso_back", "upper_limbs", "lower_limbs", "hands_feet", "intimate_areas"] as const).map(
            (r) => [r, getBodyRegionLabel(r)],
          ),
        ),
        actionTakenLabels: Object.fromEntries(
          (["gp_referral", "hospital_attendance", "photograph_taken", "safeguarding_referral", "police_notified", "parent_notified", "social_worker_notified", "monitoring_only", "no_action_required"] as const).map(
            (a) => [a, getActionTakenLabel(a)],
          ),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map(
            (r) => [r, getRatingLabel(r)],
          ),
        ),
      },
    },
  });
}

// -- POST -----------------------------------------------------------------------

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { records, audits, training, escalations, homeId, periodStart, periodEnd } = body as {
    records?: BodyMapRecord[];
    audits?: BodyMapAudit[];
    training?: BodyMapTraining[];
    escalations?: SafeguardingEscalation[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateBodyMapProtocolIntelligence(
    records ?? [],
    audits ?? [],
    training ?? [],
    escalations ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
