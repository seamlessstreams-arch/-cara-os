"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EMERGENCY PROTOCOL DRILLS
// Records emergency protocol drills beyond fire drills — testing responses to
// scenarios like missing child, medical emergency, power failure, intruder,
// flood/leak, restraint scenario, medication errors.
// Required under Quality Standard 25 (Protection of children) & Regulation 22.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  Search,
  XCircle,
  Users,
  Activity,
  Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ScenarioType =
  | "Missing Child"
  | "Medical Emergency"
  | "Power Failure"
  | "Intruder Alert"
  | "Flooding"
  | "Evacuation"
  | "Medication Error Response";

type Outcome = "Satisfactory" | "Needs Improvement" | "Failed";

interface ProtocolDrill {
  id: string;
  date: string;
  scenarioType: ScenarioType;
  scenarioDescription: string;
  leadBy: string;
  participants: string[];
  responseTimeMinutes: number;
  protocolFollowed: boolean;
  deviations: string;
  learningPoints: string[];
  actionsRequired: string[];
  outcome: Outcome;
  nextDrillDue: string;
  linkedProtocol: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const today = d(0);

const OUTCOME_STYLES: Record<Outcome, { bg: string; text: string }> = {
  Satisfactory: { bg: "bg-green-100", text: "text-green-700" },
  "Needs Improvement": { bg: "bg-amber-100", text: "text-amber-700" },
  Failed: { bg: "bg-red-100", text: "text-red-700" },
};

const SCENARIO_COLOURS: Record<ScenarioType, string> = {
  "Missing Child": "bg-red-100 text-red-700",
  "Medical Emergency": "bg-pink-100 text-pink-700",
  "Power Failure": "bg-slate-100 text-slate-700",
  "Intruder Alert": "bg-purple-100 text-purple-700",
  Flooding: "bg-blue-100 text-blue-700",
  Evacuation: "bg-orange-100 text-orange-700",
  "Medication Error Response": "bg-teal-100 text-teal-700",
};

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SEED: ProtocolDrill[] = [
  {
    id: "epd_001",
    date: d(-10),
    scenarioType: "Missing Child",
    scenarioDescription:
      "Simulated scenario: Young person not located at 10pm night check. Staff initiated missing child protocol including internal search, external perimeter check, and notification cascade.",
    leadBy: "staff_darren",
    participants: ["staff_darren", "staff_edward", "staff_anna"],
    responseTimeMinutes: 8,
    protocolFollowed: true,
    deviations: "None — protocol followed correctly within target time.",
    learningPoints: [
      "Internal search completed in under 3 minutes",
      "Notification cascade triggered at correct point",
      "Police referral point correctly identified at 15-minute threshold",
    ],
    actionsRequired: [],
    outcome: "Satisfactory",
    nextDrillDue: d(80),
    linkedProtocol: "Missing Child Protocol (MCP-01)",
  },
  {
    id: "epd_002",
    date: d(-25),
    scenarioType: "Medical Emergency",
    scenarioDescription:
      "Simulated scenario: Young person found unresponsive in bathroom. Staff response tested including first aid, calling 999, and contacting on-call manager.",
    leadBy: "staff_ryan",
    participants: ["staff_ryan", "staff_chervelle", "staff_lackson"],
    responseTimeMinutes: 4,
    protocolFollowed: true,
    deviations: "Minor delay locating emergency medications list — now pinned to noticeboard.",
    learningPoints: [
      "Recovery position applied within 90 seconds",
      "999 call made promptly with correct address given",
      "Emergency medications list should be more visible",
    ],
    actionsRequired: [
      "Laminate and pin emergency medications list in staff office and kitchen",
    ],
    outcome: "Satisfactory",
    nextDrillDue: d(65),
    linkedProtocol: "Medical Emergency Procedure (MEP-01)",
  },
  {
    id: "epd_003",
    date: d(-40),
    scenarioType: "Power Failure",
    scenarioDescription:
      "Simulated full power outage at 21:00. Tested torch access, generator knowledge, reassuring young people, and maintaining security during outage.",
    leadBy: "staff_edward",
    participants: ["staff_edward", "staff_mirela"],
    responseTimeMinutes: 6,
    protocolFollowed: false,
    deviations:
      "Torch batteries in one unit were flat. Generator start-up procedure not fully known by night staff on shift.",
    learningPoints: [
      "Monthly torch/battery checks needed",
      "All night staff must complete generator familiarisation",
      "Young people responded calmly when staff projected confidence",
    ],
    actionsRequired: [
      "Add torch battery check to weekly maintenance rota",
      "Schedule generator training for all night staff within 14 days",
    ],
    outcome: "Needs Improvement",
    nextDrillDue: d(-5),
    linkedProtocol: "Utilities Failure Protocol (UFP-01)",
  },
  {
    id: "epd_004",
    date: d(-55),
    scenarioType: "Intruder Alert",
    scenarioDescription:
      "Simulated scenario: Unknown person attempting entry via rear garden at 22:30. Tested lockdown procedure, CCTV check, police notification, and young people safeguarding.",
    leadBy: "staff_darren",
    participants: ["staff_darren", "staff_ryan", "staff_anna", "staff_lackson"],
    responseTimeMinutes: 5,
    protocolFollowed: true,
    deviations: "None — all doors secured within 2 minutes, CCTV reviewed, 999 called.",
    learningPoints: [
      "Lockdown completed effectively in under 2 minutes",
      "Young people remained in rooms as instructed",
      "CCTV footage review was prompt",
    ],
    actionsRequired: [],
    outcome: "Satisfactory",
    nextDrillDue: d(35),
    linkedProtocol: "Intruder & Lockdown Protocol (ILP-01)",
  },
  {
    id: "epd_005",
    date: d(-70),
    scenarioType: "Flooding",
    scenarioDescription:
      "Simulated burst pipe in upstairs bathroom causing water ingress to ground floor. Tested water isolation, protecting young people's belongings, contacting emergency plumber, and manager notification.",
    leadBy: "staff_anna",
    participants: ["staff_anna", "staff_chervelle", "staff_edward"],
    responseTimeMinutes: 12,
    protocolFollowed: false,
    deviations:
      "Staff were unsure of stopcock location. Took 7 minutes to locate — target is under 2 minutes. Belongings moved but some delay in identifying which items to prioritise.",
    learningPoints: [
      "Stopcock location must be clearly labelled and included in induction",
      "Prioritise electronics and personal documents when moving belongings",
      "Emergency plumber number should be in speed-dial on office phone",
    ],
    actionsRequired: [
      "Label stopcock location with high-visibility signage",
      "Add stopcock location to staff induction checklist",
      "Update emergency contacts with 24-hour plumber number",
    ],
    outcome: "Failed",
    nextDrillDue: d(-20),
    linkedProtocol: "Flood & Water Damage Response (FWD-01)",
  },
  {
    id: "epd_006",
    date: d(-15),
    scenarioType: "Evacuation",
    scenarioDescription:
      "Non-fire evacuation drill simulating gas leak requiring full building evacuation to secondary assembly point (neighbour's property) rather than standard fire assembly point.",
    leadBy: "staff_ryan",
    participants: ["staff_ryan", "staff_mirela", "staff_lackson"],
    responseTimeMinutes: 7,
    protocolFollowed: true,
    deviations: "One staff member initially headed to fire assembly point before being redirected to secondary point.",
    learningPoints: [
      "Differentiation between fire and non-fire evacuation points needs reinforcement",
      "Grab bag was collected correctly",
      "Young people evacuated calmly",
    ],
    actionsRequired: [
      "Add visual distinction between primary and secondary assembly points on evacuation signage",
    ],
    outcome: "Needs Improvement",
    nextDrillDue: d(75),
    linkedProtocol: "Non-Fire Evacuation Procedure (NFE-01)",
  },
  {
    id: "epd_007",
    date: d(-5),
    scenarioType: "Medication Error Response",
    scenarioDescription:
      "Simulated scenario: Staff discovers a medication administration error — wrong dosage recorded against young person. Tested escalation to manager, Ofsted notification decision tree, and duty of candour steps.",
    leadBy: "staff_darren",
    participants: ["staff_darren", "staff_chervelle", "staff_anna"],
    responseTimeMinutes: 10,
    protocolFollowed: true,
    deviations: "None — escalation route followed correctly, Ofsted threshold checklist applied.",
    learningPoints: [
      "Staff correctly identified this as a Regulation 40 notifiable event",
      "Duty of candour steps were applied appropriately",
      "Double-check procedure reinforced as preventative measure",
    ],
    actionsRequired: [],
    outcome: "Satisfactory",
    nextDrillDue: d(85),
    linkedProtocol: "Medication Error Response Protocol (MER-01)",
  },
  {
    id: "epd_008",
    date: d(-90),
    scenarioType: "Missing Child",
    scenarioDescription:
      "Simulated scenario: Young person absent from school and not returned at expected time. Tested communication with school, escalation to police at appropriate threshold, and risk assessment review.",
    leadBy: "staff_ryan",
    participants: ["staff_ryan", "staff_edward"],
    responseTimeMinutes: 15,
    protocolFollowed: false,
    deviations:
      "Risk assessment was not reviewed before escalation — should check individual missing risk assessment to determine threshold. Delay in contacting school to confirm departure time.",
    learningPoints: [
      "Always consult individual missing risk assessment before escalating",
      "School contact number must be immediately accessible during school hours",
      "Consider adding school departure confirmation to daily routine",
    ],
    actionsRequired: [
      "Ensure individual missing risk assessments are accessible in grab bag",
      "Add school departure check-in call to daily routine plan",
    ],
    outcome: "Needs Improvement",
    nextDrillDue: d(-10),
    linkedProtocol: "Missing Child Protocol (MCP-01)",
  },
];

// ── Page Component ────────────────────────────────────────────────────────────

export default function EmergencyProtocolDrillsPage() {
  const [search, setSearch] = useState("");
  const [scenarioFilter, setScenarioFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const yearStart = new Date().getFullYear() + "-01-01";
    const thisYear = SEED.filter((r) => r.date >= yearStart);
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
    const monthStart = now.toISOString().slice(0, 8) + "01";
    const dueThisMonth = SEED.filter(
      (r) => r.nextDrillDue >= monthStart && r.nextDrillDue <= monthEnd
    );
    const passRate =
      thisYear.length > 0
        ? Math.round(
            (thisYear.filter((r) => r.outcome === "Satisfactory").length /
              thisYear.length) *
              100
          )
        : 0;
    const scenarios = new Set(SEED.map((r) => r.scenarioType));
    return {
      totalThisYear: thisYear.length,
      dueThisMonth: dueThisMonth.length,
      passRate,
      scenariosCovered: scenarios.size,
    };
  }, []);

  // ── Overdue check ───────────────────────────────────────────────────────────

  const overdueDrills = useMemo(() => {
    return SEED.filter((r) => r.nextDrillDue < today);
  }, []);

  // ── Filtering & Sorting ─────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...SEED];

    if (scenarioFilter !== "all") {
      list = list.filter((r) => r.scenarioType === scenarioFilter);
    }
    if (outcomeFilter !== "all") {
      list = list.filter((r) => r.outcome === outcomeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.scenarioType.toLowerCase().includes(q) ||
          r.scenarioDescription.toLowerCase().includes(q) ||
          r.deviations.toLowerCase().includes(q) ||
          r.linkedProtocol.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.date.localeCompare(a.date);
        case "oldest":
          return a.date.localeCompare(b.date);
        case "response_time":
          return a.responseTimeMinutes - b.responseTimeMinutes;
        case "outcome":
          const order: Record<Outcome, number> = {
            Failed: 0,
            "Needs Improvement": 1,
            Satisfactory: 2,
          };
          return order[a.outcome] - order[b.outcome];
        default:
          return 0;
      }
    });

    return list;
  }, [search, scenarioFilter, outcomeFilter, sortBy]);

  // ── Export columns ──────────────────────────────────────────────────────────

  const exportColumns: ExportColumn<ProtocolDrill>[] = [
    { header: "Date", accessor: (r: ProtocolDrill) => r.date },
    { header: "Scenario", accessor: (r: ProtocolDrill) => r.scenarioType },
    { header: "Description", accessor: (r: ProtocolDrill) => r.scenarioDescription },
    { header: "Lead By", accessor: (r: ProtocolDrill) => getStaffName(r.leadBy) },
    {
      header: "Participants",
      accessor: (r: ProtocolDrill) => r.participants.map(getStaffName).join(", "),
    },
    {
      header: "Response Time (min)",
      accessor: (r: ProtocolDrill) => r.responseTimeMinutes.toString(),
    },
    {
      header: "Protocol Followed",
      accessor: (r: ProtocolDrill) => (r.protocolFollowed ? "Yes" : "No"),
    },
    { header: "Deviations", accessor: (r: ProtocolDrill) => r.deviations },
    {
      header: "Learning Points",
      accessor: (r: ProtocolDrill) => r.learningPoints.join("; "),
    },
    {
      header: "Actions Required",
      accessor: (r: ProtocolDrill) => r.actionsRequired.join("; "),
    },
    { header: "Outcome", accessor: (r: ProtocolDrill) => r.outcome },
    { header: "Next Drill Due", accessor: (r: ProtocolDrill) => r.nextDrillDue },
    { header: "Linked Protocol", accessor: (r: ProtocolDrill) => r.linkedProtocol },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Emergency Protocol Drills"
      subtitle="Testing emergency responses beyond fire drills — QS25 & Regulation 22"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Emergency Protocol Drills" />
          <ExportButton<ProtocolDrill>
            data={filtered}
            columns={exportColumns}
            filename="emergency-protocol-drills"
          />
        </div>
      }
    >
      {/* ── Summary Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Drills This Year",
            value: stats.totalThisYear,
            icon: Shield,
            colour: "text-blue-600",
          },
          {
            label: "Due This Month",
            value: stats.dueThisMonth,
            icon: Clock,
            colour: "text-indigo-600",
          },
          {
            label: "Pass Rate",
            value: `${stats.passRate}%`,
            icon: CheckCircle2,
            colour: "text-green-600",
          },
          {
            label: "Scenarios Covered",
            value: `${stats.scenariosCovered}/7`,
            icon: Activity,
            colour: "text-purple-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border bg-card p-3 flex items-center gap-3"
          >
            <s.icon className={cn("h-5 w-5", s.colour)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Overdue Alert ──────────────────────────────────────────────────── */}
      {overdueDrills.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800">
              {overdueDrills.length} drill{overdueDrills.length > 1 ? "s" : ""} overdue
            </p>
            <ul className="mt-1 text-sm text-red-700 space-y-1">
              {overdueDrills.map((drill) => (
                <li key={drill.id}>
                  <span className="font-medium">{drill.scenarioType}</span> — due{" "}
                  {drill.nextDrillDue} (linked: {drill.linkedProtocol})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Filters & Sort ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search drills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
          />
        </div>

        <select
          value={scenarioFilter}
          onChange={(e) => setScenarioFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Scenarios</option>
          <option value="Missing Child">Missing Child</option>
          <option value="Medical Emergency">Medical Emergency</option>
          <option value="Power Failure">Power Failure</option>
          <option value="Intruder Alert">Intruder Alert</option>
          <option value="Flooding">Flooding</option>
          <option value="Evacuation">Evacuation</option>
          <option value="Medication Error Response">Medication Error Response</option>
        </select>

        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All Outcomes</option>
          <option value="Satisfactory">Satisfactory</option>
          <option value="Needs Improvement">Needs Improvement</option>
          <option value="Failed">Failed</option>
        </select>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="response_time">Response Time</option>
            <option value="outcome">Outcome (worst first)</option>
          </select>
        </div>
      </div>

      {/* ── Drill Cards ────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No drills match your filters.
          </p>
        )}

        {filtered.map((drill) => {
          const expanded = expandedId === drill.id;
          const outcomeStyle = OUTCOME_STYLES[drill.outcome];
          const scenarioColour = SCENARIO_COLOURS[drill.scenarioType];

          return (
            <div
              key={drill.id}
              className="rounded-lg border bg-card overflow-hidden"
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedId(expanded ? null : drill.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Zap className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          scenarioColour
                        )}
                      >
                        {drill.scenarioType}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          outcomeStyle.bg,
                          outcomeStyle.text
                        )}
                      >
                        {drill.outcome}
                      </span>
                      {!drill.protocolFollowed && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600">
                          <XCircle className="h-3 w-3 mr-1" />
                          Protocol Deviated
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {drill.date} — Led by {getStaffName(drill.leadBy)} — Response:{" "}
                      {drill.responseTimeMinutes} min
                    </p>
                  </div>
                </div>
                {expanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Expanded Content */}
              {expanded && (
                <div className="border-t px-4 py-4 space-y-4">
                  {/* Scenario Description */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      Scenario Description
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {drill.scenarioDescription}
                    </p>
                  </div>

                  {/* Participants */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                      <Users className="h-4 w-4" /> Participants
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {drill.participants.map(getStaffName).join(", ")}
                    </p>
                  </div>

                  {/* Deviations */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Deviations</h4>
                    <p className="text-sm text-muted-foreground">
                      {drill.deviations}
                    </p>
                  </div>

                  {/* Learning Points */}
                  {drill.learningPoints.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Learning Points
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {drill.learningPoints.map((lp, i) => (
                          <li key={i}>{lp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions Required */}
                  {drill.actionsRequired.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Actions Required
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {drill.actionsRequired.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>
                      <strong>Linked Protocol:</strong> {drill.linkedProtocol}
                    </span>
                    <span>
                      <strong>Next Drill Due:</strong> {drill.nextDrillDue}
                    </span>
                    <span>
                      <strong>Protocol Followed:</strong>{" "}
                      {drill.protocolFollowed ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Note ────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">Regulatory Context</p>
        <p>
          Emergency protocol drills are required under Quality Standard 25
          (Protection of children) and Regulation 22 of The Children&apos;s Homes
          (England) Regulations 2015. Homes must ensure staff can respond
          effectively to a range of emergency scenarios beyond fire, including
          missing children, medical emergencies, utility failures, and security
          threats. Evidence of regular testing, learning, and improvement must be
          maintained and available for inspection.
        </p>
      </div>
    </PageShell>
  );
}
