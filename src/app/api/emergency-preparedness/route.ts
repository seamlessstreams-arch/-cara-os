// ══════════════════════════════════════════════════════════════════════════════
// API: /api/emergency-preparedness
//
// Emergency Preparedness & Business Continuity Intelligence
//
// GET  — Returns preparedness metrics with Oak House demo data
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateEmergencyPreparednessIntelligence,
} from "@/lib/emergency-preparedness";
import type {
  EmergencyPlan,
  EmergencyDrill,
  BusinessContinuityPlan,
  LoneWorkingAssessment,
  EmergencyIncident,
} from "@/lib/emergency-preparedness";

// ── Demo Data ──────────────────────────────────────────────────────────────

function generateDemoData() {
  const plans: EmergencyPlan[] = [
    {
      id: "plan-fire",
      homeId: "oak-house",
      emergencyType: "fire",
      planName: "Fire Emergency Plan",
      version: "3.0",
      createdDate: "2024-06-01",
      lastReviewDate: "2026-03-15",
      nextReviewDate: "2026-09-15",
      status: "current",
      approvedBy: "Darren Laville",
      keyActions: [
        "Activate fire alarm immediately",
        "Evacuate all children and staff to front car park assembly point",
        "Call 999 — request fire service",
        "Account for all children using daily register",
        "Notify Ofsted within 24 hours (Reg 40)",
      ],
      contactList: [
        { role: "Registered Manager", name: "Darren Laville", phone: "07700900001", available24hr: true },
        { role: "Senior RSW on duty", name: "Lisa Williams", phone: "07700900003", available24hr: true },
        { role: "Fire Service", name: "Local Fire Station", phone: "999", available24hr: true },
      ],
      staffTrained: true,
      childrenBriefed: true,
    },
    {
      id: "plan-flood",
      homeId: "oak-house",
      emergencyType: "flood",
      planName: "Flood Emergency Plan",
      version: "1.2",
      createdDate: "2025-01-10",
      lastReviewDate: "2026-01-10",
      nextReviewDate: "2026-07-10",
      status: "current",
      approvedBy: "Darren Laville",
      keyActions: [
        "Monitor Environment Agency flood warnings",
        "Move essential items to upper floor",
        "Relocate children if ground floor compromised",
        "Contact alternative accommodation provider",
      ],
      contactList: [
        { role: "Registered Manager", name: "Darren Laville", phone: "07700900001", available24hr: true },
        { role: "Environment Agency", name: "Floodline", phone: "0345 988 1188", available24hr: true },
      ],
      staffTrained: true,
      childrenBriefed: true,
    },
    {
      id: "plan-power",
      homeId: "oak-house",
      emergencyType: "power_failure",
      planName: "Power Failure Plan",
      version: "1.0",
      createdDate: "2025-03-01",
      lastReviewDate: "2025-09-01",
      nextReviewDate: "2026-02-01",
      status: "expired",
      approvedBy: "Sarah Johnson",
      keyActions: [
        "Check fuse box and trip switches",
        "Contact electricity provider",
        "Distribute torches to each child",
        "Ensure medication requiring refrigeration is protected",
      ],
      contactList: [
        { role: "Registered Manager", name: "Darren Laville", phone: "07700900001", available24hr: true },
      ],
      staffTrained: true,
      childrenBriefed: false,
    },
    {
      id: "plan-pandemic",
      homeId: "oak-house",
      emergencyType: "pandemic",
      planName: "Pandemic Response Plan",
      version: "2.0",
      createdDate: "2024-01-15",
      lastReviewDate: "2026-02-01",
      nextReviewDate: "2026-08-01",
      status: "current",
      approvedBy: "Darren Laville",
      keyActions: [
        "Implement infection control measures",
        "Isolate symptomatic individuals",
        "Contact Public Health England",
        "Review staffing contingency with agency",
        "Brief placing authorities on any impact to care",
      ],
      contactList: [
        { role: "Registered Manager", name: "Darren Laville", phone: "07700900001", available24hr: true },
        { role: "NHS 111", name: "NHS", phone: "111", available24hr: true },
      ],
      staffTrained: true,
      childrenBriefed: true,
    },
    {
      id: "plan-staffing",
      homeId: "oak-house",
      emergencyType: "staffing_crisis",
      planName: "Staffing Crisis Plan",
      version: "1.1",
      createdDate: "2025-06-01",
      lastReviewDate: "2026-04-01",
      nextReviewDate: "2026-10-01",
      status: "under_review",
      approvedBy: "Sarah Johnson",
      keyActions: [
        "Contact agency staff from approved list",
        "Registered Manager to provide direct cover if needed",
        "Review minimum staffing ratios",
        "Notify Ofsted if minimum staffing cannot be maintained",
      ],
      contactList: [
        { role: "Registered Manager", name: "Darren Laville", phone: "07700900001", available24hr: true },
        { role: "Agency", name: "CareStaff Agency", phone: "01onal example", available24hr: false },
      ],
      staffTrained: false,
      childrenBriefed: false,
    },
    {
      id: "plan-security",
      homeId: "oak-house",
      emergencyType: "security_breach",
      planName: "Security Breach Plan",
      version: "1.0",
      createdDate: "2025-09-01",
      lastReviewDate: "2026-03-01",
      nextReviewDate: "2026-09-01",
      status: "current",
      approvedBy: "Darren Laville",
      keyActions: [
        "Secure all children in safe area",
        "Call 999 if intruder present",
        "Lock external doors",
        "Account for all persons in building",
      ],
      contactList: [
        { role: "Registered Manager", name: "Darren Laville", phone: "07700900001", available24hr: true },
        { role: "Police", name: "Local Police", phone: "999", available24hr: true },
      ],
      staffTrained: true,
      childrenBriefed: true,
    },
    {
      id: "plan-missing",
      homeId: "oak-house",
      emergencyType: "missing_child",
      planName: "Missing Child Protocol",
      version: "2.5",
      createdDate: "2024-03-01",
      lastReviewDate: "2026-04-15",
      nextReviewDate: "2026-10-15",
      status: "current",
      approvedBy: "Darren Laville",
      keyActions: [
        "Search home and grounds immediately",
        "Contact child's mobile if applicable",
        "Call police after 30 minutes if child not found",
        "Notify placing authority",
        "Complete Reg 40 notification to Ofsted",
        "Conduct return home interview within 72 hours",
      ],
      contactList: [
        { role: "Registered Manager", name: "Darren Laville", phone: "07700900001", available24hr: true },
        { role: "Police", name: "Local Police", phone: "999", available24hr: true },
        { role: "Social Worker (Alex)", name: "SW Team", phone: "01onal example", available24hr: false },
      ],
      staffTrained: true,
      childrenBriefed: true,
    },
    {
      id: "plan-medical",
      homeId: "oak-house",
      emergencyType: "medical_emergency",
      planName: "Medical Emergency Plan",
      version: "0.1",
      createdDate: "2026-05-01",
      lastReviewDate: "2026-05-01",
      nextReviewDate: "2026-11-01",
      status: "draft",
      approvedBy: "",
      keyActions: [
        "Assess situation — call 999 if life threatening",
        "Administer first aid within training scope",
        "Access child's health plan for specific guidance",
      ],
      contactList: [],
      staffTrained: false,
      childrenBriefed: false,
    },
  ];

  const drills: EmergencyDrill[] = [
    {
      id: "drill-001",
      homeId: "oak-house",
      drillType: "fire_evacuation",
      date: "2026-01-20",
      timeOfDay: "day",
      conductedBy: "Sarah Johnson",
      participantsCount: 7,
      childrenPresent: 4,
      staffPresent: 3,
      evacuationTimeMinutes: 3.5,
      outcome: "successful",
      issuesIdentified: [],
      lessonsLearned: ["All children evacuated calmly within target time"],
      actionsRequired: [],
      actionsCompleted: true,
    },
    {
      id: "drill-002",
      homeId: "oak-house",
      drillType: "fire_evacuation",
      date: "2026-03-15",
      timeOfDay: "evening",
      conductedBy: "Tom Richards",
      participantsCount: 6,
      childrenPresent: 3,
      staffPresent: 3,
      evacuationTimeMinutes: 4.2,
      outcome: "successful",
      issuesIdentified: ["One torch in hallway not working"],
      lessonsLearned: ["Evening lighting levels adequate but torches need regular checking"],
      actionsRequired: ["Replace torch batteries throughout home"],
      actionsCompleted: true,
    },
    {
      id: "drill-003",
      homeId: "oak-house",
      drillType: "lockdown",
      date: "2026-02-10",
      timeOfDay: "day",
      conductedBy: "Darren Laville",
      participantsCount: 7,
      childrenPresent: 4,
      staffPresent: 3,
      outcome: "successful",
      issuesIdentified: [],
      lessonsLearned: ["All rooms secured within 2 minutes", "Jordan required reassurance but complied"],
      actionsRequired: [],
      actionsCompleted: true,
    },
    {
      id: "drill-004",
      homeId: "oak-house",
      drillType: "missing_child",
      date: "2026-04-05",
      timeOfDay: "weekend",
      conductedBy: "Lisa Williams",
      participantsCount: 5,
      childrenPresent: 3,
      staffPresent: 2,
      outcome: "partial_success",
      issuesIdentified: ["Communication delays between staff", "Search zones not clearly defined"],
      lessonsLearned: ["Need clearer search zone allocation", "Radio communication preferable to phone"],
      actionsRequired: ["Review search protocol and zone map", "Update emergency call tree"],
      actionsCompleted: false,
    },
    {
      id: "drill-005",
      homeId: "oak-house",
      drillType: "medical_emergency",
      date: "2026-04-20",
      timeOfDay: "night",
      conductedBy: "Tom Richards",
      participantsCount: 3,
      childrenPresent: 0,
      staffPresent: 3,
      outcome: "successful",
      issuesIdentified: [],
      lessonsLearned: ["First aid kit fully stocked and accessible", "Night staff confident in procedures"],
      actionsRequired: [],
      actionsCompleted: true,
    },
    {
      id: "drill-006",
      homeId: "oak-house",
      drillType: "power_failure",
      date: "2026-05-01",
      timeOfDay: "evening",
      conductedBy: "Sarah Johnson",
      participantsCount: 6,
      childrenPresent: 3,
      staffPresent: 3,
      outcome: "failed",
      issuesIdentified: ["No backup generator available", "Torch locations unknown to newer staff", "Emergency lighting in corridor failed"],
      lessonsLearned: ["Emergency lighting maintenance must be scheduled", "Torch inventory needed"],
      actionsRequired: ["Source and install backup generator", "Test all emergency lighting", "Create torch location map"],
      actionsCompleted: false,
    },
  ];

  const bcPlans: BusinessContinuityPlan[] = [
    {
      id: "bc-001",
      homeId: "oak-house",
      scenarioType: "Staffing crisis",
      lastReviewDate: "2026-02-15",
      nextReviewDate: "2026-08-15",
      status: "current",
      minimumStaffingLevel: 2,
      alternativeAccommodation: false,
      itBackupPlan: true,
      communicationPlan: true,
      supplierAlternatives: true,
      keyDecisionMaker: "Darren Laville",
    },
    {
      id: "bc-002",
      homeId: "oak-house",
      scenarioType: "Premises unavailable",
      lastReviewDate: "2026-01-10",
      nextReviewDate: "2026-07-10",
      status: "under_review",
      minimumStaffingLevel: 3,
      alternativeAccommodation: true,
      itBackupPlan: false,
      communicationPlan: true,
      supplierAlternatives: false,
      keyDecisionMaker: "Darren Laville",
    },
  ];

  const loneWorking: LoneWorkingAssessment[] = [
    {
      id: "lw-001",
      homeId: "oak-house",
      assessmentDate: "2026-02-01",
      assessedBy: "Darren Laville",
      loneWorkingOccurs: true,
      riskLevel: "medium",
      mitigations: [
        "Buddy system with neighbouring home",
        "Hourly check-in calls during lone shifts",
        "Panic alarm issued to lone worker",
        "Mobile phone must be charged and carried at all times",
      ],
      checkInProtocol: true,
      emergencyProcedure: true,
      reviewDate: "2026-08-01",
    },
    {
      id: "lw-002",
      homeId: "oak-house",
      assessmentDate: "2026-01-15",
      assessedBy: "Sarah Johnson",
      loneWorkingOccurs: true,
      riskLevel: "low",
      mitigations: [
        "CCTV monitoring of communal areas",
        "On-call manager available by phone",
      ],
      checkInProtocol: true,
      emergencyProcedure: false,
      reviewDate: "2026-04-01",
    },
  ];

  const incidents: EmergencyIncident[] = [
    {
      id: "inc-001",
      homeId: "oak-house",
      date: "2026-04-10",
      emergencyType: "fire",
      description: "Small kitchen fire when cooking oil overheated. Contained quickly using fire blanket by Lisa Williams.",
      responseTimeMinutes: 3,
      planFollowed: true,
      notificationsCompleted: ["Fire service (informed, not dispatched)", "Ofsted (within 24 hours)", "Placing authorities for all children"],
      childrenSafe: true,
      debriefCompleted: true,
      lessonsLearned: [
        "Fire blanket effective — staff training is working",
        "All children evacuated calmly as per drill practice",
        "Kitchen supervision protocol to be reinforced",
      ],
      actionsTaken: [
        "Fire extinguished with fire blanket",
        "Kitchen ventilated",
        "Children evacuated to assembly point",
        "All children accounted for within 2 minutes",
        "Fire service informed — attended for inspection",
        "Reg 40 notification completed same day",
      ],
    },
    {
      id: "inc-002",
      homeId: "oak-house",
      date: "2026-05-03",
      emergencyType: "power_failure",
      description: "Complete power outage lasting 6 hours due to local grid failure. Expired plan meant staff relied on improvisation.",
      responseTimeMinutes: 15,
      planFollowed: false,
      deviations: "Power failure plan was expired and not up to date — staff had to improvise torch distribution and food preparation",
      notificationsCompleted: [],
      childrenSafe: true,
      debriefCompleted: false,
      lessonsLearned: [],
      actionsTaken: [
        "Torches distributed from kitchen drawer",
        "Children reassured by staff",
        "Cold food served as oven/microwave unavailable",
        "Power restored after 6 hours by grid operator",
      ],
    },
  ];

  return { plans, drills, bcPlans, loneWorking, incidents };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { plans, drills, bcPlans, loneWorking, incidents } = generateDemoData();

  const result = generateEmergencyPreparednessIntelligence(
    plans,
    drills,
    bcPlans,
    loneWorking,
    incidents,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
    "2026-05-18",
  );

  return NextResponse.json({ data: result });
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
    plans,
    drills,
    bcPlans,
    loneWorking,
    incidents,
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
  } = body as {
    plans?: EmergencyPlan[];
    drills?: EmergencyDrill[];
    bcPlans?: BusinessContinuityPlan[];
    loneWorking?: LoneWorkingAssessment[];
    incidents?: EmergencyIncident[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
    referenceDate?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateEmergencyPreparednessIntelligence(
    plans ?? [],
    drills ?? [],
    bcPlans ?? [],
    loneWorking ?? [],
    incidents ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
    referenceDate ?? new Date().toISOString(),
  );

  return NextResponse.json({ data: result });
}
