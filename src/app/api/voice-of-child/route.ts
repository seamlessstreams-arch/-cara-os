// ══════════════════════════════════════════════════════════════════════════════
// API: /api/voice-of-child
//
// Voice of the Child Intelligence
//
// GET  — Returns voice capture assessment with realistic Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateVoiceOfChildIntelligence,
  getVoiceDomainLabel,
  getVoiceMethodLabel,
  getInfluenceLabel,
} from "@/lib/voice-of-child";
import type {
  VoiceEntry,
  ChildVoiceProfile,
  AdvocacyRecord,
  ParticipationRecord,
} from "@/lib/voice-of-child";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

const DEMO_CHILDREN: ChildVoiceProfile[] = [
  { childId: "child-alex", childName: "Alex" },
  { childId: "child-jordan", childName: "Jordan" },
  { childId: "child-morgan", childName: "Morgan" },
];

const DEMO_VOICE_ENTRIES: VoiceEntry[] = [
  // ── Alex ────────────────────────────────────────────────────────────────
  { id: "ve-001", childId: "child-alex", date: "2026-05-02", domain: "daily_log", voiceRecorded: true, method: "direct_verbal", influence: "partially_influenced", summary: "Alex said he wants to stay up later on weekend nights — agreed 10:30pm Fri/Sat", recordedBy: "Sarah Johnson" },
  { id: "ve-002", childId: "child-alex", date: "2026-05-05", domain: "key_work_session", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", summary: "Alex expressed strong interest in boxing — arranged trial at local club", actionTaken: "Trial session booked 12th May, Sarah to transport", recordedBy: "Sarah Johnson" },
  { id: "ve-003", childId: "child-alex", date: "2026-05-08", domain: "contact_session", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", summary: "Alex asked if he can see Mum at the park instead of the contact centre — feels more natural", actionTaken: "Request submitted to placing authority for venue change", recordedBy: "Sarah Johnson" },
  { id: "ve-004", childId: "child-alex", date: "2026-05-10", domain: "house_meeting", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", summary: "Alex suggested a BBQ for bank holiday — all agreed enthusiastically", recordedBy: "Darren Laville" },
  { id: "ve-005", childId: "child-alex", date: "2026-05-12", domain: "daily_log", voiceRecorded: true, method: "direct_verbal", influence: "partially_influenced", summary: "Alex complained about being woken up too early on a school day — discussed alarm routine", recordedBy: "Tom Richards" },
  { id: "ve-006", childId: "child-alex", date: "2026-05-15", domain: "incident_report", voiceRecorded: true, method: "direct_verbal", influence: "acknowledged_not_acted", summary: "During debrief Alex said he felt the approach was 'too heavy'. Acknowledged and documented. De-escalation review planned.", recordedBy: "Darren Laville" },
  { id: "ve-007", childId: "child-alex", date: "2026-05-17", domain: "risk_assessment", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", summary: "Alex said he knows Kai is bad news but finds it hard to say no. Wants help building confidence.", actionTaken: "Exploitation awareness sessions increased to weekly", recordedBy: "Sarah Johnson" },

  // ── Jordan ──────────────────────────────────────────────────────────────
  { id: "ve-008", childId: "child-jordan", date: "2026-05-01", domain: "daily_log", voiceRecorded: true, method: "written_by_child", influence: "directly_influenced", summary: "Jordan wrote in her journal that she needs quiet time after school — 30 min in room before activities", recordedBy: "Lisa Williams" },
  { id: "ve-009", childId: "child-jordan", date: "2026-05-04", domain: "key_work_session", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", summary: "Jordan asked for watercolour paints and a new sketchbook for her room. Said art helps her feel calm.", actionTaken: "Art supplies purchased same day", recordedBy: "Tom Richards" },
  { id: "ve-010", childId: "child-jordan", date: "2026-05-07", domain: "house_meeting", voiceRecorded: true, method: "written_by_child", influence: "directly_influenced", summary: "Jordan put forward a suggestion box idea so children can raise ideas anonymously — adopted", recordedBy: "Darren Laville" },
  { id: "ve-011", childId: "child-jordan", date: "2026-05-09", domain: "contact_session", voiceRecorded: true, method: "direct_verbal", influence: "partially_influenced", summary: "Jordan said she loves seeing Nan but gets anxious beforehand. Asked if Lisa can always take her.", recordedBy: "Lisa Williams" },
  { id: "ve-012", childId: "child-jordan", date: "2026-05-12", domain: "health_appointment", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", summary: "Jordan told GP she wants to try a lower dose of medication — GP agreed to taper plan", recordedBy: "Lisa Williams" },
  { id: "ve-013", childId: "child-jordan", date: "2026-05-14", domain: "education_review", voiceRecorded: true, method: "written_by_child", influence: "directly_influenced", summary: "Jordan wrote a letter to PEP meeting saying she wants to take GCSE art — school agreed", recordedBy: "Tom Richards" },
  { id: "ve-014", childId: "child-jordan", date: "2026-05-16", domain: "behaviour_support", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", summary: "Jordan said she finds breathing techniques more helpful than talking when dysregulated — updated BSP", recordedBy: "Lisa Williams" },

  // ── Morgan ──────────────────────────────────────────────────────────────
  { id: "ve-015", childId: "child-morgan", date: "2026-05-02", domain: "daily_log", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", summary: "Morgan asked to be referred to as 'they/them' — all staff informed and pronouns updated", recordedBy: "Lisa Williams" },
  { id: "ve-016", childId: "child-morgan", date: "2026-05-06", domain: "key_work_session", voiceRecorded: true, method: "digital_tool", influence: "directly_influenced", summary: "Morgan used mood tracker app to show emotional patterns — identified family contact as trigger", recordedBy: "Lisa Williams" },
  { id: "ve-017", childId: "child-morgan", date: "2026-05-10", domain: "contact_session", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", summary: "Morgan asked for longer video calls with Kian (brother) — extended from 20 to 30 mins", actionTaken: "Placing authority agreed to extended duration", recordedBy: "Lisa Williams" },
  { id: "ve-018", childId: "child-morgan", date: "2026-05-10", domain: "daily_log", voiceRecorded: true, method: "staff_observed", influence: "partially_influenced", summary: "Morgan appeared distressed after receiving letter from Mum — offered space and support", recordedBy: "Lisa Williams" },
  { id: "ve-019", childId: "child-morgan", date: "2026-05-13", domain: "house_meeting", voiceRecorded: true, method: "direct_verbal", influence: "directly_influenced", summary: "Morgan asked if they could learn guitar — music lessons arranged", actionTaken: "Weekly guitar lesson with local tutor starting 20th May", recordedBy: "Darren Laville" },
  { id: "ve-020", childId: "child-morgan", date: "2026-05-16", domain: "daily_log", voiceRecorded: true, method: "staff_observed", influence: "partially_influenced", summary: "Morgan visibly happier after music session — said playing helps them 'switch off'", recordedBy: "Tom Richards" },
];

const DEMO_ADVOCACY: AdvocacyRecord[] = [
  {
    id: "adv-001", childId: "child-alex",
    hasAdvocate: true, advocateName: "Claire Barnes", advocateOrganisation: "Coram Voice", lastContact: "2026-05-10",
    hasIndependentVisitor: true, independentVisitorName: "Mark Thompson", lastIVVisit: "2026-05-08",
    childAwareOfRights: true, complaintsProcessExplained: true,
  },
  {
    id: "adv-002", childId: "child-jordan",
    hasAdvocate: true, advocateName: "Priya Patel", advocateOrganisation: "NYAS", lastContact: "2026-05-12",
    hasIndependentVisitor: true, independentVisitorName: "Karen Hughes", lastIVVisit: "2026-05-05",
    childAwareOfRights: true, complaintsProcessExplained: true,
  },
  {
    id: "adv-003", childId: "child-morgan",
    hasAdvocate: true, advocateName: "Daniel Harris", advocateOrganisation: "Coram Voice", lastContact: "2026-05-14",
    hasIndependentVisitor: false,
    childAwareOfRights: true, complaintsProcessExplained: true,
  },
];

const DEMO_PARTICIPATION: ParticipationRecord[] = [
  { id: "part-001", childId: "child-alex", date: "2026-05-06", eventType: "lac_review", participationLevel: "full", childViewsRecorded: true, childViewsInfluencedOutcome: true, advocatePresent: true },
  { id: "part-002", childId: "child-alex", date: "2026-05-10", eventType: "house_meeting", participationLevel: "full", childViewsRecorded: true, childViewsInfluencedOutcome: true, advocatePresent: false },
  { id: "part-003", childId: "child-jordan", date: "2026-05-07", eventType: "house_meeting", participationLevel: "full", childViewsRecorded: true, childViewsInfluencedOutcome: true, advocatePresent: false },
  { id: "part-004", childId: "child-jordan", date: "2026-05-13", eventType: "pep_review", participationLevel: "represented_by_advocate", childViewsRecorded: true, childViewsInfluencedOutcome: true, advocatePresent: true },
  { id: "part-005", childId: "child-jordan", date: "2026-05-14", eventType: "health_review", participationLevel: "full", childViewsRecorded: true, childViewsInfluencedOutcome: true, advocatePresent: false },
  { id: "part-006", childId: "child-morgan", date: "2026-05-07", eventType: "house_meeting", participationLevel: "full", childViewsRecorded: true, childViewsInfluencedOutcome: true, advocatePresent: false },
  { id: "part-007", childId: "child-morgan", date: "2026-05-15", eventType: "care_plan_review", participationLevel: "represented_by_advocate", childViewsRecorded: true, childViewsInfluencedOutcome: true, advocatePresent: true },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateVoiceOfChildIntelligence(
    DEMO_VOICE_ENTRIES,
    DEMO_CHILDREN,
    DEMO_ADVOCACY,
    DEMO_PARTICIPATION,
    "oak-house",
    "2026-05-01",
    "2026-05-18",
  );

  // Enrich with labels for UI
  const enrichedDomains = result.domainCapture.map((d) => ({
    ...d,
    domainLabel: getVoiceDomainLabel(d.domain),
  }));

  const enrichedMethods = result.methodBreakdown.map((m) => ({
    ...m,
    methodLabel: getVoiceMethodLabel(m.method),
  }));

  return NextResponse.json({
    data: {
      ...result,
      domainCapture: enrichedDomains,
      methodBreakdown: enrichedMethods,
      meta: {
        influenceLabels: Object.fromEntries(
          (["directly_influenced", "partially_influenced", "acknowledged_not_acted", "not_acknowledged", "not_applicable"] as const).map(
            (i) => [i, getInfluenceLabel(i)],
          ),
        ),
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

  const { entries, children, advocacy, participation, homeId, periodStart, periodEnd } = body as {
    entries?: VoiceEntry[];
    children?: ChildVoiceProfile[];
    advocacy?: AdvocacyRecord[];
    participation?: ParticipationRecord[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!entries || !Array.isArray(entries)) {
    return NextResponse.json({ error: "entries array is required" }, { status: 400 });
  }
  if (!children || !Array.isArray(children) || children.length === 0) {
    return NextResponse.json({ error: "children array is required" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateVoiceOfChildIntelligence(
    entries, children, advocacy ?? [], participation ?? [],
    homeId ?? "unknown", periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
