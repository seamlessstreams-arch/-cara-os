"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FIRE RISK ASSESSMENT
// Documents the home's fire risk assessment: hazards identified, controls in
// place, residual risk levels, people at risk, and additional control measures
// required. Distinct from fire drills — this is the underpinning assessment
// that drives evacuation procedures, equipment provision, and staff training.
// Required by the Regulatory Reform (Fire Safety) Order 2005 and Quality
// Standard 25 (Health & Wellbeing) of the Children's Homes Regulations 2015.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Flame, AlertTriangle, ShieldCheck, ShieldAlert, ShieldX,
  ChevronUp, ChevronDown, ArrowUpDown, Calendar, User,
  CheckCircle2, Clock, ListChecks, MapPin, Users, BookOpen,
  CircleDot,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type RiskCategory =
  | "Fire spread"
  | "Means of escape"
  | "Detection"
  | "Suppression"
  | "Human factors"
  | "Storage";

type RiskLevel = "Low" | "Medium" | "High";
type RiskStatus = "Implemented" | "In Progress" | "Outstanding";

interface FireRiskItem {
  id: string;
  area: string;
  riskCategory: RiskCategory;
  hazardIdentified: string;
  currentControls: string[];
  residualRiskLevel: RiskLevel;
  peopleAtRisk: string[];
  additionalControlsRequired: string[];
  responsibleOwner: string;
  targetCompletionDate: string;
  status: RiskStatus;
  lastReviewDate: string;
  nextReviewDate: string;
  assessedBy: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const RISK_LEVEL_CONFIG: Record<RiskLevel, { colour: string; ring: string; icon: React.ElementType }> = {
  Low:    { colour: "bg-green-100 text-green-700 border-green-200",   ring: "border-green-200",  icon: ShieldCheck },
  Medium: { colour: "bg-amber-100 text-amber-700 border-amber-200",   ring: "border-amber-200",  icon: ShieldAlert },
  High:   { colour: "bg-red-100 text-red-700 border-red-200",         ring: "border-red-300",    icon: ShieldX },
};

const STATUS_CONFIG: Record<RiskStatus, { colour: string; icon: React.ElementType }> = {
  "Implemented":  { colour: "bg-green-100 text-green-700 border-green-200",   icon: CheckCircle2 },
  "In Progress":  { colour: "bg-blue-100 text-blue-700 border-blue-200",      icon: Clock },
  "Outstanding":  { colour: "bg-red-100 text-red-700 border-red-200",         icon: AlertTriangle },
};

const CATEGORY_CONFIG: Record<RiskCategory, string> = {
  "Fire spread":      "bg-red-50 text-red-700",
  "Means of escape":  "bg-orange-50 text-orange-700",
  "Detection":        "bg-blue-50 text-blue-700",
  "Suppression":      "bg-cyan-50 text-cyan-700",
  "Human factors":    "bg-purple-50 text-purple-700",
  "Storage":          "bg-slate-50 text-slate-700",
};

// ── Local date helpers ────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10);
};

const formatLocalDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SEED: FireRiskItem[] = [
  {
    id: "fra_001",
    area: "Kitchen",
    riskCategory: "Fire spread",
    hazardIdentified: "Cooking on gas hob — risk of unattended pans, oil ignition, and accumulated grease in extractor filter.",
    currentControls: [
      "Fire blanket mounted within 1m of hob",
      "CO2 extinguisher inside kitchen",
      "Heat detector linked to main panel",
      "Staff present whenever children are cooking",
      "Extractor filter cleaned weekly (logged)",
    ],
    residualRiskLevel: "Medium",
    peopleAtRisk: ["Children", "Staff"],
    additionalControlsRequired: [
      "Replace ageing extractor unit (work order raised)",
      "Add 'no unattended cooking' signage at child eye-level",
    ],
    responsibleOwner: "staff_darren",
    targetCompletionDate: d(28),
    status: "In Progress",
    lastReviewDate: d(-30),
    nextReviewDate: d(150),
    assessedBy: "staff_darren",
  },
  {
    id: "fra_002",
    area: "Bedrooms",
    riskCategory: "Detection",
    hazardIdentified: "Sleeping risk — children may not wake to standard smoke alarms; some young people use phone chargers/hair styling tools in bedrooms.",
    currentControls: [
      "Mains-wired interlinked smoke alarms in every bedroom",
      "10-year sealed lithium back-up battery",
      "Charger safety briefings during induction",
      "Nightly walk-round by sleep-in staff at 23:00",
    ],
    residualRiskLevel: "Low",
    peopleAtRisk: ["Children", "Staff"],
    additionalControlsRequired: [
      "Trial vibration pillow alarm for Casey (hearing-sensitive at night)",
    ],
    responsibleOwner: "staff_darren",
    targetCompletionDate: d(45),
    status: "In Progress",
    lastReviewDate: d(-30),
    nextReviewDate: d(150),
    assessedBy: "staff_darren",
  },
  {
    id: "fra_003",
    area: "Communal areas",
    riskCategory: "Fire spread",
    hazardIdentified: "Soft furnishings, cushions and rugs in lounge — potential fuel load if ignited; Christmas decorations seasonal risk.",
    currentControls: [
      "All upholstery to BS 7177 (medium hazard) — labels checked",
      "No candles or naked flames policy",
      "Decorations PAT-tested before use",
      "Smoke alarms in lounge and dining room",
    ],
    residualRiskLevel: "Low",
    peopleAtRisk: ["Children", "Staff", "Visitors"],
    additionalControlsRequired: [],
    responsibleOwner: "staff_ryan",
    targetCompletionDate: d(-10),
    status: "Implemented",
    lastReviewDate: d(-30),
    nextReviewDate: d(150),
    assessedBy: "staff_darren",
  },
  {
    id: "fra_004",
    area: "Stairs/escape routes",
    riskCategory: "Means of escape",
    hazardIdentified: "Single staircase serving first-floor bedrooms; possessions and laundry sometimes left on landing obstructing escape.",
    currentControls: [
      "Emergency lighting tested monthly",
      "Photoluminescent escape signage",
      "Daily walk-round to clear obstructions",
      "Self-closing fire doors (FD30) on all bedrooms",
    ],
    residualRiskLevel: "High",
    peopleAtRisk: ["Children", "Staff", "Visitors"],
    additionalControlsRequired: [
      "Install secondary egress window restrictor releases (first floor rear)",
      "Quarterly fire-door inspection by competent person",
      "Refresh staff training on keeping escape routes clear",
    ],
    responsibleOwner: "staff_darren",
    targetCompletionDate: d(14),
    status: "Outstanding",
    lastReviewDate: d(-30),
    nextReviewDate: d(60),
    assessedBy: "staff_darren",
  },
  {
    id: "fra_005",
    area: "Office",
    riskCategory: "Human factors",
    hazardIdentified: "Multi-socket extension leads under desk powering monitors, printer and shredder — overload risk; paper records nearby.",
    currentControls: [
      "Annual PAT testing",
      "Surge-protected extension blocks only",
      "No daisy-chained adaptors",
    ],
    residualRiskLevel: "Medium",
    peopleAtRisk: ["Staff"],
    additionalControlsRequired: [
      "Install additional wall sockets to remove extension lead reliance",
      "Move paper archive to fire-resistant cabinet",
    ],
    responsibleOwner: "staff_ryan",
    targetCompletionDate: d(35),
    status: "In Progress",
    lastReviewDate: d(-30),
    nextReviewDate: d(150),
    assessedBy: "staff_ryan",
  },
  {
    id: "fra_006",
    area: "Boiler room",
    riskCategory: "Suppression",
    hazardIdentified: "Gas-fired combi boiler in cupboard adjoining utility — risk of ignition; cupboard occasionally used to store cleaning chemicals.",
    currentControls: [
      "Annual gas safety check (Gas Safe registered)",
      "Heat detector linked to main panel",
      "Cupboard kept locked",
    ],
    residualRiskLevel: "Medium",
    peopleAtRisk: ["Children", "Staff"],
    additionalControlsRequired: [
      "Remove all flammable cleaning products from boiler cupboard to dedicated COSHH store",
      "Add 'no storage' signage inside cupboard",
    ],
    responsibleOwner: "staff_darren",
    targetCompletionDate: d(7),
    status: "Outstanding",
    lastReviewDate: d(-30),
    nextReviewDate: d(150),
    assessedBy: "staff_darren",
  },
  {
    id: "fra_007",
    area: "Garden/external",
    riskCategory: "Storage",
    hazardIdentified: "Wheelie bins stored against rear elevation — arson/external ignition could spread to building via window above.",
    currentControls: [
      "Lockable bin store",
      "External lighting with motion sensor",
      "Bins emptied weekly to reduce fuel load",
    ],
    residualRiskLevel: "Medium",
    peopleAtRisk: ["Children", "Staff", "Visitors"],
    additionalControlsRequired: [
      "Reposition bin store ≥ 6m from building or install fire-rated screen",
    ],
    responsibleOwner: "staff_ryan",
    targetCompletionDate: d(60),
    status: "In Progress",
    lastReviewDate: d(-30),
    nextReviewDate: d(150),
    assessedBy: "staff_darren",
  },
  {
    id: "fra_008",
    area: "Communal areas",
    riskCategory: "Suppression",
    hazardIdentified: "Portable fire extinguishers may be tampered with, mis-used, or pass service date.",
    currentControls: [
      "Annual service by BAFE-approved contractor",
      "Monthly visual inspection logged",
      "Tamper seals checked",
      "Children briefed not to interfere with safety equipment",
    ],
    residualRiskLevel: "Low",
    peopleAtRisk: ["Children", "Staff"],
    additionalControlsRequired: [],
    responsibleOwner: "staff_darren",
    targetCompletionDate: d(-20),
    status: "Implemented",
    lastReviewDate: d(-30),
    nextReviewDate: d(150),
    assessedBy: "staff_darren",
  },
  {
    id: "fra_009",
    area: "Bedrooms",
    riskCategory: "Human factors",
    hazardIdentified: "Young person Alex has history of fire-setting behaviour — increased risk in private spaces.",
    currentControls: [
      "Risk assessment in Alex's care plan reviewed monthly",
      "No lighters/matches accessible — kitchen only",
      "Bedroom checked discreetly during sleep-in walk-rounds",
      "Therapeutic work with VIRT around fire-setting triggers",
    ],
    residualRiskLevel: "High",
    peopleAtRisk: ["Children", "Staff"],
    additionalControlsRequired: [
      "Liaison with placing authority re: behavioural trajectory at next LAC review",
      "Bedroom heat detector upgrade (currently smoke only)",
    ],
    responsibleOwner: "staff_darren",
    targetCompletionDate: d(21),
    status: "Outstanding",
    lastReviewDate: d(-15),
    nextReviewDate: d(45),
    assessedBy: "staff_darren",
  },
  {
    id: "fra_010",
    area: "Stairs/escape routes",
    riskCategory: "Means of escape",
    hazardIdentified: "Final exit door (front) requires key from inside — risk of delayed evacuation if key misplaced.",
    currentControls: [
      "Thumb-turn deadlock fitted (no key required from inside)",
      "Spare key in break-glass box adjacent to door",
      "Door opening tested as part of monthly equipment check",
    ],
    residualRiskLevel: "Low",
    peopleAtRisk: ["Children", "Staff", "Visitors"],
    additionalControlsRequired: [],
    responsibleOwner: "staff_ryan",
    targetCompletionDate: d(-45),
    status: "Implemented",
    lastReviewDate: d(-30),
    nextReviewDate: d(150),
    assessedBy: "staff_darren",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function FireRiskAssessmentPage() {
  const [items] = useState<FireRiskItem[]>(SEED);
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("risk_high");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const areas = useMemo(() => Array.from(new Set(items.map(i => i.area))).sort(), [items]);

  const filtered = useMemo(() => {
    let list = [...items];
    if (areaFilter !== "all") list = list.filter(i => i.area === areaFilter);
    if (riskFilter !== "all") list = list.filter(i => i.residualRiskLevel === riskFilter);
    if (statusFilter !== "all") list = list.filter(i => i.status === statusFilter);

    const riskOrder: Record<RiskLevel, number> = { High: 0, Medium: 1, Low: 2 };
    list.sort((a, b) => {
      switch (sortBy) {
        case "risk_high":   return riskOrder[a.residualRiskLevel] - riskOrder[b.residualRiskLevel];
        case "risk_low":    return riskOrder[b.residualRiskLevel] - riskOrder[a.residualRiskLevel];
        case "due_soonest": return a.targetCompletionDate.localeCompare(b.targetCompletionDate);
        case "area":        return a.area.localeCompare(b.area);
        case "status":      return a.status.localeCompare(b.status);
        default:            return 0;
      }
    });
    return list;
  }, [items, areaFilter, riskFilter, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const total = items.length;
    const outstanding = items.filter(i => i.status === "Outstanding").length;
    const high = items.filter(i => i.residualRiskLevel === "High").length;
    const nextReview = items.reduce((min, i) => i.nextReviewDate < min ? i.nextReviewDate : min, "9999-12-31");
    return { total, outstanding, high, nextReview };
  }, [items]);

  const exportCols: ExportColumn<FireRiskItem>[] = [
    { header: "ID",                    accessor: (r: FireRiskItem) => r.id },
    { header: "Area",                  accessor: (r: FireRiskItem) => r.area },
    { header: "Risk Category",         accessor: (r: FireRiskItem) => r.riskCategory },
    { header: "Hazard",                accessor: (r: FireRiskItem) => r.hazardIdentified },
    { header: "Current Controls",      accessor: (r: FireRiskItem) => r.currentControls.join("; ") },
    { header: "Residual Risk",         accessor: (r: FireRiskItem) => r.residualRiskLevel },
    { header: "People At Risk",        accessor: (r: FireRiskItem) => r.peopleAtRisk.join(", ") },
    { header: "Additional Controls",   accessor: (r: FireRiskItem) => r.additionalControlsRequired.join("; ") },
    { header: "Responsible Owner",     accessor: (r: FireRiskItem) => getStaffName(r.responsibleOwner) },
    { header: "Target Completion",     accessor: (r: FireRiskItem) => r.targetCompletionDate },
    { header: "Status",                accessor: (r: FireRiskItem) => r.status },
    { header: "Last Review",           accessor: (r: FireRiskItem) => r.lastReviewDate },
    { header: "Next Review",           accessor: (r: FireRiskItem) => r.nextReviewDate },
    { header: "Assessed By",           accessor: (r: FireRiskItem) => getStaffName(r.assessedBy) },
  ];

  return (
    <PageShell
      title="Fire Risk Assessment"
      subtitle="Hazards, controls, and remedial actions under the Regulatory Reform (Fire Safety) Order 2005"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Fire Risk Assessment" />
          <ExportButton data={filtered} columns={exportCols} filename="fire-risk-assessment" />
        </div>
      }
    >
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Hazards",     value: stats.total,                          icon: Flame,           c: "text-red-600" },
          { label: "Outstanding",       value: stats.outstanding,                    icon: AlertTriangle,   c: stats.outstanding > 0 ? "text-red-600" : "text-muted-foreground" },
          { label: "High-Risk Items",   value: stats.high,                           icon: ShieldX,         c: stats.high > 0 ? "text-red-600" : "text-muted-foreground" },
          { label: "Next Review",       value: formatLocalDate(stats.nextReview),    icon: Calendar,        c: "text-indigo-600" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border bg-card p-3 flex items-center gap-3">
            <s.icon className={cn("h-5 w-5", s.c)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {(stats.outstanding > 0 || stats.high > 0) && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800 dark:text-red-300">
            <p className="font-semibold">Action required</p>
            <p>
              {stats.outstanding} outstanding control{stats.outstanding === 1 ? "" : "s"} and {stats.high} high-risk
              hazard{stats.high === 1 ? "" : "s"} require attention. Outstanding items must be progressed without
              delay and recorded in the action plan below.
            </p>
          </div>
        </div>
      )}

      {/* Filters / sort */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Area" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Risk Level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Implemented">Implemented</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Outstanding">Outstanding</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="risk_high">Highest Risk First</SelectItem>
              <SelectItem value="risk_low">Lowest Risk First</SelectItem>
              <SelectItem value="due_soonest">Target Date (Soonest)</SelectItem>
              <SelectItem value="area">Area (A-Z)</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} hazard{filtered.length !== 1 ? "s" : ""} shown
      </p>

      {/* List */}
      <div className="space-y-3" id="fire-risk-assessment-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Flame className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No hazards match the selected filters</p>
          </div>
        )}

        {filtered.map(item => {
          const isOpen = expandedId === item.id;
          const rl = RISK_LEVEL_CONFIG[item.residualRiskLevel];
          const sc = STATUS_CONFIG[item.status];
          const RiskIcon = rl.icon;
          const StatusIcon = sc.icon;
          const isUrgent = item.status === "Outstanding";

          return (
            <div
              key={item.id}
              className={cn(
                "rounded-lg border bg-card overflow-hidden transition-shadow",
                isUrgent && "border-red-200 shadow-sm",
                item.residualRiskLevel === "High" && !isUrgent && "border-red-100",
              )}
            >
              <button
                onClick={() => setExpandedId(isOpen ? null : item.id)}
                className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className={cn("rounded-full p-1.5 shrink-0 border", rl.colour)}>
                  <RiskIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="inline-flex items-center gap-1 text-sm font-medium">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {item.area}
                    </span>
                    <span className={cn("text-[11px] px-1.5 py-0.5 rounded border", CATEGORY_CONFIG[item.riskCategory], "border-transparent")}>
                      {item.riskCategory}
                    </span>
                    <span className={cn("text-[11px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1", rl.colour)}>
                      <CircleDot className="h-3 w-3" /> {item.residualRiskLevel} risk
                    </span>
                    <span className={cn("text-[11px] px-1.5 py-0.5 rounded border inline-flex items-center gap-1", sc.colour)}>
                      <StatusIcon className="h-3 w-3" /> {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 line-clamp-2">{item.hazardIdentified}</p>
                  <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-3 flex-wrap">
                    <span><User className="inline h-3.5 w-3.5 mr-0.5" />{getStaffName(item.responsibleOwner)}</span>
                    <span><Calendar className="inline h-3.5 w-3.5 mr-0.5" />Target: {formatLocalDate(item.targetCompletionDate)}</span>
                    <span><BookOpen className="inline h-3.5 w-3.5 mr-0.5" />Assessed: {getStaffName(item.assessedBy)}</span>
                  </p>
                </div>
                {isOpen
                  ? <ChevronUp className="h-4 w-4 shrink-0 mt-1" />
                  : <ChevronDown className="h-4 w-4 shrink-0 mt-1" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-4 bg-muted/30">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Hazard Identified
                    </p>
                    <p className="text-sm">{item.hazardIdentified}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 inline-flex items-center gap-1">
                      <ListChecks className="h-3.5 w-3.5" /> Current Controls In Place
                    </p>
                    {item.currentControls.length === 0 ? (
                      <p className="text-sm italic text-muted-foreground">No controls recorded</p>
                    ) : (
                      <ul className="text-sm list-disc pl-5 space-y-0.5">
                        {item.currentControls.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 inline-flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Additional Controls Required
                    </p>
                    {item.additionalControlsRequired.length === 0 ? (
                      <p className="text-sm italic text-muted-foreground">
                        No further controls identified — risk reduced to acceptable level.
                      </p>
                    ) : (
                      <ul className="text-sm list-disc pl-5 space-y-0.5">
                        {item.additionalControlsRequired.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="rounded border bg-card p-2">
                      <p className="font-semibold text-muted-foreground uppercase mb-1">
                        <Users className="inline h-3.5 w-3.5 mr-1" />People At Risk
                      </p>
                      <p>{item.peopleAtRisk.join(", ") || "—"}</p>
                    </div>
                    <div className="rounded border bg-card p-2">
                      <p className="font-semibold text-muted-foreground uppercase mb-1">
                        <User className="inline h-3.5 w-3.5 mr-1" />Responsible Owner
                      </p>
                      <p>{getStaffName(item.responsibleOwner)}</p>
                    </div>
                    <div className="rounded border bg-card p-2">
                      <p className="font-semibold text-muted-foreground uppercase mb-1">
                        <Calendar className="inline h-3.5 w-3.5 mr-1" />Target Completion
                      </p>
                      <p>{formatLocalDate(item.targetCompletionDate)}</p>
                    </div>
                    <div className="rounded border bg-card p-2">
                      <p className="font-semibold text-muted-foreground uppercase mb-1">
                        <Calendar className="inline h-3.5 w-3.5 mr-1" />Review Cycle
                      </p>
                      <p>
                        Last: {formatLocalDate(item.lastReviewDate)} · Next: {formatLocalDate(item.nextReviewDate)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Regulatory note */}
      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Regulatory Context</p>
            <p>
              The <strong>Regulatory Reform (Fire Safety) Order 2005</strong> requires the responsible person
              (the Registered Manager) to carry out and regularly review a suitable and sufficient fire risk
              assessment, identifying hazards, the people at risk, and the control measures in place.
              <strong> Quality Standard 25 (Health & Wellbeing)</strong> and <strong>Regulation 23 (Fitness of
              premises)</strong> of the Children's Homes (England) Regulations 2015 require the home to be
              physically safe, with effective fire precautions appropriate to the needs of the children
              accommodated. This assessment underpins fire drills, equipment provision, staff training, and
              individual risk assessments where a child's needs or behaviour create elevated fire risk.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
