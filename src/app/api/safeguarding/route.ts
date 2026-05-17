// ══════════════════════════════════════════════════════════════════════════════
// API: /api/safeguarding — Safeguarding intelligence endpoints
//
// GET  — returns metrics, active concerns, overdue items
// POST — evaluates escalation for a new concern
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  determineEscalation,
  evaluateConcernCompliance,
  calculateSafeguardingMetrics,
  buildSafeguardingTimeline,
  getOverdueConcerns,
} from "@/lib/safeguarding";
import type { SafeguardingConcern, ConcernCategory, ConcernSeverity } from "@/lib/safeguarding";

// ── Demo Data ─────────────────────────────────────────────────────────────

const DEMO_CONCERNS: SafeguardingConcern[] = [
  {
    id: "sg-001",
    childId: "child-001",
    childName: "Child A",
    homeId: "home-001",
    organisationId: "org-001",
    category: "physical_abuse",
    severity: "high",
    status: "referral_made",
    escalationLevel: 3,
    description: "Unexplained bruising on upper arm observed during morning routine. Child became distressed when asked about it.",
    raisedBy: "staff-sw-01",
    raisedAt: "2026-05-15T07:30:00Z",
    dateOfConcern: "2026-05-15T07:15:00Z",
    evidenceOfHarm: ["Bruising approx 4cm on upper left arm", "Child became distressed when questioned"],
    witnesses: ["staff-sw-02"],
    immediateActions: ["Child checked for other injuries", "Photographed with consent", "DSL contacted"],
    dslConsulted: true,
    dslName: "Sarah Johnson",
    dslConsultedAt: "2026-05-15T07:45:00Z",
    referrals: [{
      id: "ref-001",
      concernId: "sg-001",
      destination: "local_authority_mash",
      referralDate: "2026-05-15T08:30:00Z",
      referredBy: "Sarah Johnson",
      referralMethod: "phone",
      referenceNumber: "MASH-2026-4521",
      acknowledged: true,
      acknowledgedAt: "2026-05-15T09:00:00Z",
      responseReceived: true,
      responseDate: "2026-05-15T14:00:00Z",
      outcome: "Strategy discussion convened",
    }],
    assignedTo: "staff-rm-01",
    reviewDate: "2026-05-18T09:00:00Z",
    linkedConcerns: [],
    linkedIncidents: ["inc-012"],
    lastUpdatedBy: "staff-rm-01",
    lastUpdatedAt: "2026-05-15T14:30:00Z",
    createdAt: "2026-05-15T07:30:00Z",
  },
  {
    id: "sg-002",
    childId: "child-002",
    childName: "Child B",
    homeId: "home-001",
    organisationId: "org-001",
    category: "child_sexual_exploitation",
    severity: "high",
    status: "ongoing_monitoring",
    escalationLevel: 4,
    description: "Concerning pattern of new expensive items. Child refusing to say where they came from. Multiple late returns from town.",
    raisedBy: "staff-sw-03",
    raisedAt: "2026-05-12T16:00:00Z",
    dateOfConcern: "2026-05-12T15:00:00Z",
    evidenceOfHarm: ["New expensive trainers and phone", "3 late returns this week", "Secretive about new contacts"],
    witnesses: [],
    immediateActions: ["Exploitation screening tool completed", "Missing episodes reviewed", "Online activity monitored"],
    dslConsulted: true,
    dslName: "Sarah Johnson",
    dslConsultedAt: "2026-05-12T16:15:00Z",
    referrals: [{
      id: "ref-002",
      concernId: "sg-002",
      destination: "exploitation_hub",
      referralDate: "2026-05-12T17:00:00Z",
      referredBy: "Sarah Johnson",
      referralMethod: "form",
      referenceNumber: "EXP-2026-0089",
      acknowledged: true,
      acknowledgedAt: "2026-05-13T09:00:00Z",
      responseReceived: false,
    }, {
      id: "ref-003",
      concernId: "sg-002",
      destination: "police",
      referralDate: "2026-05-12T17:30:00Z",
      referredBy: "Sarah Johnson",
      referralMethod: "phone",
      acknowledged: true,
      acknowledgedAt: "2026-05-12T18:00:00Z",
      responseReceived: true,
      responseDate: "2026-05-14T10:00:00Z",
      outcome: "Intelligence shared with exploitation team",
    }],
    assignedTo: "staff-rm-01",
    reviewDate: "2026-05-19T09:00:00Z",
    linkedConcerns: [],
    linkedIncidents: [],
    lastUpdatedBy: "staff-rm-01",
    lastUpdatedAt: "2026-05-14T10:30:00Z",
    createdAt: "2026-05-12T16:00:00Z",
  },
  {
    id: "sg-003",
    childId: "child-001",
    childName: "Child A",
    homeId: "home-001",
    organisationId: "org-001",
    category: "self_harm",
    severity: "medium",
    status: "ongoing_monitoring",
    escalationLevel: 2,
    description: "Superficial scratches on forearm noticed during activity. Child stated they did it because they were 'feeling bad'.",
    raisedBy: "staff-sw-01",
    raisedAt: "2026-05-16T14:00:00Z",
    dateOfConcern: "2026-05-16T13:30:00Z",
    childWords: "I did it because I was feeling bad about everything.",
    evidenceOfHarm: ["Superficial scratches on left forearm", "Child's own admission"],
    witnesses: [],
    immediateActions: ["First aid applied", "Safety plan reviewed", "CAMHS appointment brought forward"],
    dslConsulted: true,
    dslName: "Sarah Johnson",
    dslConsultedAt: "2026-05-16T14:15:00Z",
    referrals: [],
    assignedTo: "staff-tl-01",
    reviewDate: "2026-05-19T09:00:00Z",
    linkedConcerns: ["sg-001"],
    linkedIncidents: [],
    lastUpdatedBy: "staff-tl-01",
    lastUpdatedAt: "2026-05-16T14:30:00Z",
    createdAt: "2026-05-16T14:00:00Z",
  },
  {
    id: "sg-004",
    childId: "child-003",
    childName: "Child C",
    homeId: "home-001",
    organisationId: "org-001",
    category: "neglect",
    severity: "low",
    status: "closed",
    escalationLevel: 1,
    description: "Child arrived from contact visit with parent in unwashed clothing. Previously noted pattern.",
    raisedBy: "staff-sw-02",
    raisedAt: "2026-04-20T17:00:00Z",
    dateOfConcern: "2026-04-20T16:30:00Z",
    evidenceOfHarm: ["Unwashed clothing", "Body odour", "Child reported not eating at parent's"],
    witnesses: ["staff-sw-04"],
    immediateActions: ["Clean clothing provided", "Warm bath offered", "Meal prepared"],
    dslConsulted: true,
    dslName: "Sarah Johnson",
    dslConsultedAt: "2026-04-20T17:30:00Z",
    referrals: [],
    assignedTo: "staff-rm-01",
    linkedConcerns: [],
    linkedIncidents: [],
    outcome: "Pattern discussed with social worker. Contact plan under review.",
    closedAt: "2026-04-25T10:00:00Z",
    closedBy: "staff-rm-01",
    closureReason: "Social worker aware. Contact plan reviewed. Monitoring.",
    lastUpdatedBy: "staff-rm-01",
    lastUpdatedAt: "2026-04-25T10:00:00Z",
    createdAt: "2026-04-20T17:00:00Z",
  },
];

// ── GET Handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const homeId = url.searchParams.get("homeId") ?? "home-001";
  const childId = url.searchParams.get("childId");

  // If childId provided, return timeline for that child
  if (childId) {
    const timeline = buildSafeguardingTimeline(DEMO_CONCERNS, [], childId);
    return NextResponse.json({ timeline });
  }

  // Otherwise return home-level metrics
  const metrics = calculateSafeguardingMetrics(DEMO_CONCERNS, homeId, "org-001");
  const overdue = getOverdueConcerns(DEMO_CONCERNS);
  const activeConcerns = DEMO_CONCERNS.filter(c =>
    c.homeId === homeId && c.status !== "closed" && c.status !== "no_further_action"
  );

  return NextResponse.json({
    metrics,
    activeConcerns,
    overdue: overdue.map(o => ({
      concernId: o.concern.id,
      childName: o.concern.childName,
      category: o.concern.category,
      overdueBy: o.overdueBy,
      type: o.type,
    })),
  });
}

// ── POST Handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "escalate") {
    const { category, severity, childId, description } = body;

    if (!category || !severity) {
      return NextResponse.json({ error: "category and severity are required" }, { status: 400 });
    }

    const concern: SafeguardingConcern = {
      id: `sg-new-${Date.now()}`,
      childId: childId ?? "unknown",
      childName: body.childName ?? "Unknown Child",
      homeId: body.homeId ?? "home-001",
      organisationId: body.organisationId ?? "org-001",
      category: category as ConcernCategory,
      severity: severity as ConcernSeverity,
      status: "initial_concern",
      escalationLevel: 1,
      description: description ?? "",
      raisedBy: body.raisedBy ?? "current-user",
      raisedAt: new Date().toISOString(),
      dateOfConcern: body.dateOfConcern ?? new Date().toISOString(),
      evidenceOfHarm: body.evidenceOfHarm ?? [],
      witnesses: body.witnesses ?? [],
      immediateActions: [],
      dslConsulted: false,
      referrals: [],
      assignedTo: "",
      linkedConcerns: [],
      linkedIncidents: [],
      lastUpdatedBy: body.raisedBy ?? "current-user",
      lastUpdatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const existingForChild = DEMO_CONCERNS.filter(c => c.childId === childId);
    const escalation = determineEscalation(concern, existingForChild);

    return NextResponse.json({ escalation, concern });
  }

  if (action === "compliance") {
    const { concernId } = body;
    const concern = DEMO_CONCERNS.find(c => c.id === concernId);
    if (!concern) {
      return NextResponse.json({ error: "Concern not found" }, { status: 404 });
    }
    const compliance = evaluateConcernCompliance(concern);
    return NextResponse.json({ compliance });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
