"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEDICATION ERRORS & NEAR-MISSES REGISTER
// Tracks medication administration errors, near-misses, and adverse drug
// reactions. Regulatory requirement under Regulation 23 (health) following
// NICE guidelines for medication error reporting in care settings.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

// ── Types ─────────────────────────────────────────────────────────────────────

type ErrorType =
  | "wrong_dose"
  | "wrong_medication"
  | "wrong_time"
  | "wrong_person"
  | "omission"
  | "wrong_route"
  | "expired_medication"
  | "documentation_error"
  | "near_miss"
  | "adverse_reaction";

type Severity = "no_harm" | "low" | "moderate" | "severe" | "death";

type ErrorStatus = "reported" | "under_investigation" | "action_required" | "closed" | "escalated";

type RemedialStatus = "pending" | "in_progress" | "completed";

interface RemedialAction {
  action: string;
  owner: string;
  dueDate: string;
  status: RemedialStatus;
}

interface MedicationError {
  id: string;
  youngPersonId: string;
  dateOccurred: string;
  timeOccurred: string;
  reportedBy: string;
  reportedDate: string;
  errorType: ErrorType;
  severity: Severity;
  medication: string;
  prescribedDose: string;
  actualDose: string;
  whatHappened: string;
  immediateAction: string;
  personInformed: string[];
  dutyOfCandour: boolean;
  dutyOfCandourCompleted: string | null;
  rootCause: string;
  contributingFactors: string[];
  remedialActions: RemedialAction[];
  lessonsLearned: string;
  status: ErrorStatus;
  reviewDate: string | null;
  outcome: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const ERROR_TYPE_CONFIG: Record<ErrorType, { label: string; color: string; bg: string; border: string }> = {
  wrong_dose:          { label: "Wrong Dose",          color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200"  },
  wrong_medication:    { label: "Wrong Medication",    color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200"     },
  wrong_time:          { label: "Wrong Time",          color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  wrong_person:        { label: "Wrong Person",        color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200"    },
  omission:            { label: "Omission",            color: "text-yellow-700",  bg: "bg-yellow-50",  border: "border-yellow-200"  },
  wrong_route:         { label: "Wrong Route",         color: "text-pink-700",    bg: "bg-pink-50",    border: "border-pink-200"    },
  expired_medication:  { label: "Expired Medication",  color: "text-stone-700",   bg: "bg-stone-50",   border: "border-stone-200"   },
  documentation_error: { label: "Documentation Error", color: "text-slate-700",   bg: "bg-slate-100",  border: "border-slate-200"   },
  near_miss:           { label: "Near Miss",           color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"    },
  adverse_reaction:    { label: "Adverse Reaction",    color: "text-purple-700",  bg: "bg-purple-50",  border: "border-purple-200"  },
};

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string; border: string }> = {
  no_harm:   { label: "No Harm",   color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  low:       { label: "Low",       color: "text-yellow-700",  bg: "bg-yellow-50",  border: "border-yellow-200"  },
  moderate:  { label: "Moderate",  color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  severe:    { label: "Severe",    color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200"     },
  death:     { label: "Death",     color: "text-white",       bg: "bg-slate-900",  border: "border-slate-700"   },
};

const STATUS_CONFIG: Record<ErrorStatus, { label: string; color: string; bg: string; border: string }> = {
  reported:              { label: "Reported",             color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"    },
  under_investigation:   { label: "Under Investigation", color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  action_required:       { label: "Action Required",     color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200"  },
  closed:                { label: "Closed",              color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  escalated:             { label: "Escalated",           color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200"    },
};

const REMEDIAL_STATUS_CONFIG: Record<RemedialStatus, { label: string; color: string; bg: string }> = {
  pending:     { label: "Pending",     color: "text-amber-700",   bg: "bg-amber-50"   },
  in_progress: { label: "In Progress", color: "text-blue-700",    bg: "bg-blue-50"    },
  completed:   { label: "Completed",   color: "text-emerald-700", bg: "bg-emerald-50" },
};

const PERSONS_OPTIONS = ["Manager", "GP", "Parent", "Social Worker", "Pharmacist", "LADO", "Ofsted", "IRO"];

// ── Seed Data ────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const SEED_ERRORS: MedicationError[] = [
  {
    id: "me_001",
    youngPersonId: "yp_alex",
    dateOccurred: d(-21),
    timeOccurred: "21:00",
    reportedBy: "staff_anna",
    reportedDate: d(-21),
    errorType: "wrong_dose",
    severity: "low",
    medication: "Melatonin",
    prescribedDose: "3mg",
    actualDose: "5mg",
    whatHappened: "5mg tablet of Melatonin administered instead of the prescribed 3mg dose. The wrong strength blister pack was selected from the medication cabinet. Alex was drowsier than usual the following morning but no other adverse effects noted.",
    immediateAction: "GP contacted immediately and advised to monitor. Extra sleep monitoring checks carried out overnight at 30-minute intervals. Alex's vital signs recorded.",
    personInformed: ["Manager", "GP", "Parent"],
    dutyOfCandour: true,
    dutyOfCandourCompleted: d(-20),
    rootCause: "Unclear labelling on blister packs — both 3mg and 5mg Melatonin stored adjacently with similar packaging.",
    contributingFactors: ["Similar packaging for different strengths", "Medication cabinet layout not optimised", "End of long shift — fatigue factor"],
    remedialActions: [
      { action: "Separate storage locations for different strength medications", owner: "staff_anna", dueDate: d(-18), status: "completed" },
      { action: "Additional colour-coded labels applied to all Melatonin stock", owner: "staff_ryan", dueDate: d(-17), status: "completed" },
    ],
    lessonsLearned: "All medication with multiple strength variants must be stored in separate clearly labelled sections. Two-person verification should be considered for bedtime medications where fatigue is a factor.",
    status: "closed",
    reviewDate: d(-14),
    outcome: "No lasting harm. Alex monitored for 48 hours post-incident. Medication storage reorganised and additional labelling system implemented across all medications.",
  },
  {
    id: "me_002",
    youngPersonId: "yp_jordan",
    dateOccurred: d(-14),
    timeOccurred: "08:15",
    reportedBy: "staff_darren",
    reportedDate: d(-14),
    errorType: "omission",
    severity: "no_harm",
    medication: "Methylphenidate (Concerta XL)",
    prescribedDose: "36mg",
    actualDose: "Not administered",
    whatHappened: "Morning dose of Concerta XL 36mg was not administered. Night staff did not hand over the morning medication requirement to the day team. Error discovered at 10:30am when Jordan's teacher called to report concentration difficulties.",
    immediateAction: "GP contacted for advice — advised not to administer late as it would affect sleep. Jordan collected from school early. Extra support provided for remainder of day.",
    personInformed: ["Manager", "GP", "Social Worker"],
    dutyOfCandour: false,
    dutyOfCandourCompleted: null,
    rootCause: "Staff handover gap — medication requirement not included in verbal or written handover from night to day shift.",
    contributingFactors: ["Handover gap between night and day shift", "No medication prompt on morning checklist", "Jordan did not self-prompt (not expected to at this stage)"],
    remedialActions: [
      { action: "Medication check added to mandatory handover checklist", owner: "staff_darren", dueDate: d(-12), status: "completed" },
      { action: "Morning medication alert added to digital shift planner", owner: "staff_ryan", dueDate: d(-10), status: "completed" },
    ],
    lessonsLearned: "Medication requirements must be a standing item on every handover — verbal confirmation and written record. Digital alerts provide an additional safety net but do not replace human handover.",
    status: "closed",
    reviewDate: d(-7),
    outcome: "No harm sustained. Jordan had one difficult day at school. Handover procedures strengthened. No recurrence since implementation of new checklist.",
  },
  {
    id: "me_003",
    youngPersonId: "yp_casey",
    dateOccurred: d(-7),
    timeOccurred: "19:45",
    reportedBy: "staff_edward",
    reportedDate: d(-7),
    errorType: "near_miss",
    severity: "no_harm",
    medication: "Fluoxetine 20mg",
    prescribedDose: "20mg",
    actualDose: "Not administered (intercepted)",
    whatHappened: "Staff member picked up Alex's evening medication (Melatonin 3mg) and Casey's Fluoxetine 20mg at the same time. Was about to administer Fluoxetine to Alex when a second staff member noticed the error and intervened before the medication was given.",
    immediateAction: "Medication administration stopped immediately. Both young people's MAR sheets reviewed. Second staff member confirmed correct medication to correct young person. Error logged and manager informed.",
    personInformed: ["Manager"],
    dutyOfCandour: false,
    dutyOfCandourCompleted: null,
    rootCause: "Preparing multiple young people's medications simultaneously rather than one at a time as per policy.",
    contributingFactors: ["Multiple medications prepared at same time", "Evening period with competing demands", "Single staff member managing medication round"],
    remedialActions: [
      { action: "Refresher training on one-child-at-a-time medication administration policy", owner: "staff_ryan", dueDate: d(3), status: "pending" },
      { action: "Two-person verification implemented for evening medication round", owner: "staff_darren", dueDate: d(5), status: "pending" },
    ],
    lessonsLearned: "Medications must only be prepared and administered for one young person at a time. The policy exists for this exact reason. Evening medication rounds should have two staff members present where staffing allows.",
    status: "action_required",
    reviewDate: d(7),
    outcome: "Near miss — no medication was incorrectly administered. Remedial actions pending implementation.",
  },
  {
    id: "me_004",
    youngPersonId: "yp_alex",
    dateOccurred: d(-3),
    timeOccurred: "14:30",
    reportedBy: "staff_ryan",
    reportedDate: d(-3),
    errorType: "adverse_reaction",
    severity: "moderate",
    medication: "Amoxicillin 500mg",
    prescribedDose: "500mg three times daily",
    actualDose: "500mg (as prescribed)",
    whatHappened: "Alex developed a widespread rash and mild facial swelling approximately 2 hours after the second dose of a new course of Amoxicillin prescribed for a chest infection. No breathing difficulties but visible discomfort and itching.",
    immediateAction: "Amoxicillin discontinued immediately. Antihistamine (Piriton) administered as per PRN protocol. GP contacted — advised to attend surgery for review. Alex taken to GP within the hour. Prescribed alternative antibiotic (Clarithromycin) and advised on allergy management.",
    personInformed: ["Manager", "GP", "Parent", "Pharmacist"],
    dutyOfCandour: true,
    dutyOfCandourCompleted: null,
    rootCause: "Previously unidentified penicillin allergy. No prior allergy documented in Alex's health records from placing authority.",
    contributingFactors: ["No allergy information in referral documentation", "First exposure to penicillin-class antibiotic at this placement", "Allergy history section of health assessment was marked 'NKDA' based on placing authority records"],
    remedialActions: [
      { action: "Allergy recorded on MAR sheet, care plan, and health passport", owner: "staff_ryan", dueDate: d(-2), status: "completed" },
      { action: "Placing authority notified to update central health records", owner: "staff_darren", dueDate: d(-1), status: "in_progress" },
      { action: "Review all young people's allergy records against placing authority data", owner: "staff_anna", dueDate: d(7), status: "pending" },
    ],
    lessonsLearned: "Allergy information from placing authorities should be verified and not assumed complete. Any new medication — particularly antibiotics — should be administered with heightened monitoring for the first 48 hours. Staff should be aware of the signs of allergic reaction and the location of emergency medication.",
    status: "under_investigation",
    reviewDate: d(10),
    outcome: "Alex recovered fully within 48 hours. Allergy now documented across all records. Investigation ongoing to review allergy verification processes at admission.",
  },
  {
    id: "me_005",
    youngPersonId: "yp_jordan",
    dateOccurred: d(-5),
    timeOccurred: "09:00",
    reportedBy: "staff_chervelle",
    reportedDate: d(-5),
    errorType: "documentation_error",
    severity: "no_harm",
    medication: "Methylphenidate (Concerta XL)",
    prescribedDose: "36mg",
    actualDose: "36mg (correctly administered)",
    whatHappened: "Morning medication was correctly administered but the MAR sheet was not signed by the administering staff member. Discovered during afternoon medication audit. Staff member confirmed administration had taken place and Jordan confirmed she had taken her medication.",
    immediateAction: "MAR sheet signed retrospectively with a note explaining the late signature. Staff member spoken to about the importance of real-time documentation.",
    personInformed: ["Manager"],
    dutyOfCandour: false,
    dutyOfCandourCompleted: null,
    rootCause: "Staff member was called away to manage a situation with another young person immediately after administering the medication and forgot to return to sign the MAR sheet.",
    contributingFactors: ["Competing demands during medication round", "No prompt to return to complete documentation"],
    remedialActions: [
      { action: "Supervision discussion with staff member about documentation discipline", owner: "staff_darren", dueDate: d(-3), status: "completed" },
    ],
    lessonsLearned: "MAR sheets must be signed at the point of administration, not after. If interrupted, staff should return to complete documentation as soon as the immediate situation is resolved. Consider a 'medication in progress' flag system.",
    status: "closed",
    reviewDate: d(-2),
    outcome: "No harm — medication was correctly administered. Documentation retrospectively completed. Staff member understands the importance of contemporaneous record-keeping.",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const dt = new Date(dateStr + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function MedicationErrorsPage() {
  const [errors, setErrors] = useState<MedicationError[]>(SEED_ERRORS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ErrorType | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ErrorStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "severity">("newest");

  const today = todayStr();

  // ── Filtered + sorted list ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...errors];

    if (typeFilter !== "all") {
      list = list.filter((e) => e.errorType === typeFilter);
    }
    if (severityFilter !== "all") {
      list = list.filter((e) => e.severity === severityFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((e) => e.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.medication.toLowerCase().includes(q) ||
          getYPName(e.youngPersonId).toLowerCase().includes(q) ||
          e.whatHappened.toLowerCase().includes(q) ||
          getStaffName(e.reportedBy).toLowerCase().includes(q) ||
          ERROR_TYPE_CONFIG[e.errorType].label.toLowerCase().includes(q)
      );
    }

    const SEV_ORDER: Record<Severity, number> = { death: 0, severe: 1, moderate: 2, low: 3, no_harm: 4 };
    switch (sortBy) {
      case "newest":
        list.sort((a, b) => b.dateOccurred.localeCompare(a.dateOccurred));
        break;
      case "oldest":
        list.sort((a, b) => a.dateOccurred.localeCompare(b.dateOccurred));
        break;
      case "severity":
        list.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);
        break;
    }

    return list;
  }, [errors, typeFilter, severityFilter, statusFilter, search, sortBy]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = errors.length;
    const open = errors.filter((e) => e.status !== "closed").length;
    const nearMisses = errors.filter((e) => e.errorType === "near_miss").length;

    const closedErrors = errors.filter((e) => e.status === "closed" && e.reviewDate && e.dateOccurred);
    const avgDays =
      closedErrors.length > 0
        ? Math.round(
            closedErrors.reduce((sum, e) => {
              const start = new Date(e.dateOccurred).getTime();
              const end = new Date(e.reviewDate!).getTime();
              return sum + (end - start) / (1000 * 60 * 60 * 24);
            }, 0) / closedErrors.length
          )
        : 0;

    return { total, open, nearMisses, avgDays };
  }, [errors]);

  // ── Per-child summary ─────────────────────────────────────────────────────
  const childSummaries = useMemo(() => {
    const map = new Map<string, { types: Record<string, number>; severities: Record<string, number>; lastDate: string; count: number }>();
    for (const e of errors) {
      if (!map.has(e.youngPersonId)) {
        map.set(e.youngPersonId, { types: {}, severities: {}, lastDate: e.dateOccurred, count: 0 });
      }
      const s = map.get(e.youngPersonId)!;
      s.count++;
      s.types[e.errorType] = (s.types[e.errorType] || 0) + 1;
      s.severities[e.severity] = (s.severities[e.severity] || 0) + 1;
      if (e.dateOccurred > s.lastDate) s.lastDate = e.dateOccurred;
    }
    return Array.from(map.entries()).map(([id, data]) => ({ id, name: getYPName(id), ...data }));
  }, [errors]);

  // ── Export columns ────────────────────────────────────────────────────────
  const exportColumns = useMemo<ExportColumn<MedicationError>[]>(() => [
    { header: "Date",               accessor: (r: MedicationError) => r.dateOccurred },
    { header: "Time",               accessor: (r: MedicationError) => r.timeOccurred },
    { header: "Young Person",       accessor: (r: MedicationError) => getYPName(r.youngPersonId) },
    { header: "Medication",         accessor: (r: MedicationError) => r.medication },
    { header: "Error Type",         accessor: (r: MedicationError) => ERROR_TYPE_CONFIG[r.errorType].label },
    { header: "Severity",           accessor: (r: MedicationError) => SEVERITY_CONFIG[r.severity].label },
    { header: "Prescribed Dose",    accessor: (r: MedicationError) => r.prescribedDose },
    { header: "Actual Dose",        accessor: (r: MedicationError) => r.actualDose },
    { header: "Reported By",        accessor: (r: MedicationError) => getStaffName(r.reportedBy) },
    { header: "Status",             accessor: (r: MedicationError) => STATUS_CONFIG[r.status].label },
    { header: "Root Cause",         accessor: (r: MedicationError) => r.rootCause },
    { header: "Persons Informed",   accessor: (r: MedicationError) => r.personInformed.join(", ") },
  ], []);

  // ── Alert banner check ────────────────────────────────────────────────────
  const openCases = errors.filter(
    (e) => e.status === "under_investigation" || e.status === "action_required"
  );

  const hasFilters = search || typeFilter !== "all" || severityFilter !== "all" || statusFilter !== "all";

  // ── Create handler ────────────────────────────────────────────────────────
  const handleCreate = (error: MedicationError) => {
    setErrors((prev) => [error, ...prev]);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageShell
      title="Medication Errors & Near-Misses"
      subtitle="Regulation 23 — Medication error reporting and learning"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Medication Errors Register" />
          <ExportButton<MedicationError>
            data={filtered}
            columns={exportColumns}
            filename="medication-errors"
          />
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowNewDialog(true)}>
            <Plus className="h-3.5 w-3.5" />
            Report Error
          </Button>
        </div>
      }
    >
      {/* ── Summary Strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Total Errors</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Open Cases</div>
            <div className={cn("text-2xl font-bold mt-0.5", stats.open > 0 ? "text-amber-600" : "text-emerald-600")}>{stats.open}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Near Misses</div>
            <div className="text-2xl font-bold text-blue-600 mt-0.5">{stats.nearMisses}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3">
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Avg Resolution</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{stats.avgDays} <span className="text-sm font-normal text-slate-400">days</span></div>
          </CardContent>
        </Card>
      </div>

      {/* ── Alert Banner ──────────────────────────────────────────────────── */}
      {openCases.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800">
              {openCases.length} case{openCases.length !== 1 ? "s" : ""} requiring attention
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {openCases.map((c) => `${getYPName(c.youngPersonId)} — ${ERROR_TYPE_CONFIG[c.errorType].label}`).join(" | ")}
            </p>
          </div>
        </div>
      )}

      {/* ── Per-Child Summary Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {childSummaries.map((child) => (
          <Card key={child.id} className="border-slate-200">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm font-semibold text-slate-900">{child.name}</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Total incidents</span>
                <span className="font-semibold text-slate-700">{child.count}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(child.types).map(([type, count]) => {
                  const cfg = ERROR_TYPE_CONFIG[type as ErrorType];
                  return (
                    <Badge key={type} className={cn("text-[9px] px-1.5 py-0 border", cfg.bg, cfg.color, cfg.border)}>
                      {cfg.label} ({count})
                    </Badge>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(child.severities).map(([sev, count]) => {
                  const cfg = SEVERITY_CONFIG[sev as Severity];
                  return (
                    <Badge key={sev} className={cn("text-[9px] px-1.5 py-0 border", cfg.bg, cfg.color, cfg.border)}>
                      {cfg.label} ({count})
                    </Badge>
                  );
                })}
              </div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                Last incident: {formatDate(child.lastDate)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filter Bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search errors..."
            className="h-8 pl-8 text-xs"
          />
        </div>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ErrorType | "all")}>
          <SelectTrigger className="h-8 text-xs w-[160px]">
            <Filter className="h-3 w-3 mr-1 text-slate-400" />
            <SelectValue placeholder="Error type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.keys(ERROR_TYPE_CONFIG) as ErrorType[]).map((t) => (
              <SelectItem key={t} value={t}>{ERROR_TYPE_CONFIG[t].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as Severity | "all")}>
          <SelectTrigger className="h-8 text-xs w-[130px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            {(Object.keys(SEVERITY_CONFIG) as Severity[]).map((s) => (
              <SelectItem key={s} value={s}>{SEVERITY_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ErrorStatus | "all")}>
          <SelectTrigger className="h-8 text-xs w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {(Object.keys(STATUS_CONFIG) as ErrorStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="h-8 text-xs w-[130px]">
            <ArrowUpDown className="h-3 w-3 mr-1 text-slate-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="severity">By severity</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-slate-400 hover:text-slate-600"
            onClick={() => { setSearch(""); setTypeFilter("all"); setSeverityFilter("all"); setStatusFilter("all"); }}
          >
            <XCircle className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* ── Results count ─────────────────────────────────────────────────── */}
      <p className="text-[11px] text-slate-400 mb-3">
        Showing {filtered.length} of {errors.length} record{errors.length !== 1 ? "s" : ""}
      </p>

      {/* ── Error Cards ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-slate-400">
            No medication errors match the current filters.
          </div>
        )}

        {filtered.map((error) => {
          const isExpanded = expandedId === error.id;
          const etCfg = ERROR_TYPE_CONFIG[error.errorType];
          const sevCfg = SEVERITY_CONFIG[error.severity];
          const stCfg = STATUS_CONFIG[error.status];

          const hasOverdueActions = error.remedialActions.some(
            (a) => a.status !== "completed" && a.dueDate < today
          );

          return (
            <div
              key={error.id}
              className={cn(
                "rounded-lg border bg-white transition-all",
                error.status === "escalated" && "ring-2 ring-rose-300 border-rose-200",
                error.status === "under_investigation" && "border-amber-300",
                hasOverdueActions && "border-orange-300",
              )}
            >
              {/* Card Header */}
              <div
                className="flex items-start gap-3 p-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : error.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-medium text-slate-500">{formatDate(error.dateOccurred)}</span>
                    <span className="text-[10px] text-slate-400">{error.timeOccurred}</span>
                    <span className="text-xs font-semibold text-slate-900">— {error.medication}</span>
                    <span className="text-[11px] text-slate-500">({getYPName(error.youngPersonId)})</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge className={cn("text-[10px] px-2 py-0 border", etCfg.bg, etCfg.color, etCfg.border)}>
                      {etCfg.label}
                    </Badge>
                    <Badge className={cn("text-[10px] px-2 py-0 border", sevCfg.bg, sevCfg.color, sevCfg.border)}>
                      {sevCfg.label}
                    </Badge>
                    <Badge className={cn("text-[10px] px-2 py-0 border", stCfg.bg, stCfg.color, stCfg.border)}>
                      {stCfg.label}
                    </Badge>
                    {hasOverdueActions && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-orange-100 text-orange-700 border border-orange-200">
                        Overdue actions
                      </Badge>
                    )}
                    {error.dutyOfCandour && (
                      <Badge className="text-[9px] px-1.5 py-0 bg-violet-100 text-violet-700 border border-violet-200">
                        Duty of Candour
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-slate-400">
                    Reported by {getStaffName(error.reportedBy)}
                  </span>
                  {isExpanded
                    ? <ChevronUp className="h-4 w-4 text-slate-400" />
                    : <ChevronDown className="h-4 w-4 text-slate-400" />
                  }
                </div>
              </div>

              {/* Expanded Body */}
              {isExpanded && (
                <div className="border-t px-4 pb-4 pt-3 space-y-4">
                  {/* What happened — red panel */}
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <h4 className="text-[11px] font-semibold text-red-700 uppercase tracking-wide mb-1">What Happened</h4>
                    <p className="text-xs text-red-900 leading-relaxed">{error.whatHappened}</p>
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-red-600">
                      <span>Prescribed: <strong>{error.prescribedDose}</strong></span>
                      <span>Actual: <strong>{error.actualDose}</strong></span>
                    </div>
                  </div>

                  {/* Immediate action — blue panel */}
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mb-1">Immediate Action Taken</h4>
                    <p className="text-xs text-blue-900 leading-relaxed">{error.immediateAction}</p>
                  </div>

                  {/* Persons informed */}
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Persons Informed</h4>
                    <div className="flex flex-wrap gap-1">
                      {error.personInformed.map((p) => (
                        <Badge key={p} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Root cause — amber panel */}
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide mb-1">Root Cause Analysis</h4>
                    <p className="text-xs text-amber-900 leading-relaxed">{error.rootCause}</p>
                  </div>

                  {/* Contributing factors */}
                  {error.contributingFactors.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Contributing Factors</h4>
                      <div className="flex flex-wrap gap-1">
                        {error.contributingFactors.map((f, i) => (
                          <Badge key={i} className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Remedial actions table */}
                  {error.remedialActions.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-2">
                        Remedial Actions ({error.remedialActions.length})
                      </h4>
                      <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase">Action</th>
                              <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase">Owner</th>
                              <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase">Due</th>
                              <th className="text-left px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {error.remedialActions.map((a, i) => {
                              const isOverdue = a.status !== "completed" && a.dueDate < today;
                              const rsCfg = REMEDIAL_STATUS_CONFIG[a.status];
                              return (
                                <tr
                                  key={i}
                                  className={cn(
                                    "border-b border-slate-100 last:border-0",
                                    isOverdue && "bg-orange-50",
                                  )}
                                >
                                  <td className="px-3 py-2 text-slate-700">{a.action}</td>
                                  <td className="px-3 py-2 text-slate-600">{getStaffName(a.owner)}</td>
                                  <td className={cn("px-3 py-2", isOverdue ? "text-orange-700 font-semibold" : "text-slate-600")}>
                                    {formatDate(a.dueDate)}
                                    {isOverdue && <span className="ml-1 text-[9px] text-orange-600">(overdue)</span>}
                                  </td>
                                  <td className="px-3 py-2">
                                    <Badge className={cn("text-[9px] px-1.5 py-0 border", rsCfg.bg, rsCfg.color)}>
                                      {rsCfg.label}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Lessons learned — purple panel */}
                  <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                    <h4 className="text-[11px] font-semibold text-purple-700 uppercase tracking-wide mb-1">Lessons Learned</h4>
                    <p className="text-xs text-purple-900 leading-relaxed">{error.lessonsLearned}</p>
                  </div>

                  {/* Duty of candour */}
                  {error.dutyOfCandour && (
                    <div className="rounded-lg bg-violet-50 border border-violet-200 p-3">
                      <h4 className="text-[11px] font-semibold text-violet-700 uppercase tracking-wide mb-1">Duty of Candour</h4>
                      <div className="flex items-center gap-2 text-xs">
                        {error.dutyOfCandourCompleted ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-violet-800">Completed on {formatDate(error.dutyOfCandourCompleted)}</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                            <span className="text-violet-800">Duty of candour notification pending</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Outcome */}
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">Outcome</h4>
                    <p className="text-xs text-slate-700 leading-relaxed">{error.outcome}</p>
                  </div>

                  {/* Footer meta */}
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>Reported: {formatDate(error.reportedDate)} by {getStaffName(error.reportedBy)}</span>
                    {error.reviewDate && <span>Review date: {formatDate(error.reviewDate)}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Note ───────────────────────────────────────────────── */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          <strong>Regulatory context:</strong> This register supports compliance with{" "}
          <strong>Regulation 23 (Health)</strong> of the Children's Homes (England) Regulations 2015 and follows{" "}
          <strong>NICE guidelines</strong> on medication safety in care settings. All medication errors, near-misses, and
          adverse drug reactions must be recorded, investigated, and used to improve practice. Duty of candour applies to
          incidents of moderate severity or above. Records are subject to Ofsted inspection and should be maintained in
          accordance with data protection requirements.
        </p>
      </div>

      {/* ── New Error Dialog ──────────────────────────────────────────────── */}
      <NewErrorDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onSubmit={handleCreate}
      />
    </PageShell>
  );
}

// ── New Error Report Dialog ─────────────────────────────────────────────────

function NewErrorDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (error: MedicationError) => void;
}) {
  const [youngPersonId, setYoungPersonId] = useState("yp_alex");
  const [dateOccurred, setDateOccurred] = useState("");
  const [timeOccurred, setTimeOccurred] = useState("");
  const [errorType, setErrorType] = useState<ErrorType>("wrong_dose");
  const [severity, setSeverity] = useState<Severity>("no_harm");
  const [medication, setMedication] = useState("");
  const [prescribedDose, setPrescribedDose] = useState("");
  const [actualDose, setActualDose] = useState("");
  const [whatHappened, setWhatHappened] = useState("");
  const [immediateAction, setImmediateAction] = useState("");
  const [personsInformed, setPersonsInformed] = useState<string[]>([]);
  const [dutyOfCandour, setDutyOfCandour] = useState(false);
  const [rootCause, setRootCause] = useState("");
  const [contributingFactors, setContributingFactors] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");

  function togglePerson(person: string) {
    setPersonsInformed((prev) =>
      prev.includes(person) ? prev.filter((p) => p !== person) : [...prev, person]
    );
  }

  function handleSubmit() {
    if (!medication.trim() || !whatHappened.trim() || !dateOccurred) return;

    const error: MedicationError = {
      id: `me_local_${Date.now()}`,
      youngPersonId,
      dateOccurred,
      timeOccurred: timeOccurred || "00:00",
      reportedBy: "staff_darren",
      reportedDate: new Date().toISOString().slice(0, 10),
      errorType,
      severity,
      medication: medication.trim(),
      prescribedDose: prescribedDose.trim(),
      actualDose: actualDose.trim(),
      whatHappened: whatHappened.trim(),
      immediateAction: immediateAction.trim(),
      personInformed: personsInformed,
      dutyOfCandour,
      dutyOfCandourCompleted: null,
      rootCause: rootCause.trim(),
      contributingFactors: contributingFactors.split("\n").filter(Boolean),
      remedialActions: [],
      lessonsLearned: lessonsLearned.trim(),
      status: "reported",
      reviewDate: null,
      outcome: "",
    };

    onSubmit(error);
    onClose();
    resetForm();
  }

  function resetForm() {
    setYoungPersonId("yp_alex");
    setDateOccurred("");
    setTimeOccurred("");
    setErrorType("wrong_dose");
    setSeverity("no_harm");
    setMedication("");
    setPrescribedDose("");
    setActualDose("");
    setWhatHappened("");
    setImmediateAction("");
    setPersonsInformed([]);
    setDutyOfCandour(false);
    setRootCause("");
    setContributingFactors("");
    setLessonsLearned("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            Report Medication Error
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Young person + date/time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Young Person *</label>
              <Select value={youngPersonId} onValueChange={setYoungPersonId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
                  <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
                  <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Date Occurred *</label>
              <Input type="date" value={dateOccurred} onChange={(e) => setDateOccurred(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Time Occurred</label>
              <Input type="time" value={timeOccurred} onChange={(e) => setTimeOccurred(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>

          {/* Error type + severity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Error Type *</label>
              <Select value={errorType} onValueChange={(v) => setErrorType(v as ErrorType)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ERROR_TYPE_CONFIG) as ErrorType[]).map((t) => (
                    <SelectItem key={t} value={t}>{ERROR_TYPE_CONFIG[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Severity</label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(SEVERITY_CONFIG) as Severity[]).map((s) => (
                    <SelectItem key={s} value={s}>{SEVERITY_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Medication + doses */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Medication *</label>
            <Input value={medication} onChange={(e) => setMedication(e.target.value)} placeholder="e.g. Melatonin 3mg" className="h-8 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Prescribed Dose</label>
              <Input value={prescribedDose} onChange={(e) => setPrescribedDose(e.target.value)} placeholder="e.g. 3mg" className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Actual Dose</label>
              <Input value={actualDose} onChange={(e) => setActualDose(e.target.value)} placeholder="e.g. 5mg or Not given" className="h-8 text-xs" />
            </div>
          </div>

          {/* What happened */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">What Happened *</label>
            <Textarea
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              placeholder="Describe what happened in detail..."
              className="text-xs min-h-[80px]"
            />
          </div>

          {/* Immediate action */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Immediate Action Taken</label>
            <Textarea
              value={immediateAction}
              onChange={(e) => setImmediateAction(e.target.value)}
              placeholder="What was done immediately in response?"
              className="text-xs min-h-[60px]"
            />
          </div>

          {/* Persons informed */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1.5 block">Persons Informed</label>
            <div className="flex flex-wrap gap-1.5">
              {PERSONS_OPTIONS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-6 text-[10px] px-2",
                    personsInformed.includes(p)
                      ? "bg-blue-100 text-blue-700 border-blue-300"
                      : "bg-white text-slate-500 border-slate-200"
                  )}
                  onClick={() => togglePerson(p)}
                >
                  {personsInformed.includes(p) && <CheckCircle2 className="h-2.5 w-2.5 mr-1" />}
                  {p}
                </Button>
              ))}
            </div>
          </div>

          {/* Duty of candour */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="doc-checkbox"
              checked={dutyOfCandour}
              onChange={(e) => setDutyOfCandour(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
            />
            <label htmlFor="doc-checkbox" className="text-xs text-slate-600">Duty of Candour applies</label>
          </div>

          {/* Root cause */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Root Cause</label>
            <Textarea
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="What was the root cause of this error?"
              className="text-xs min-h-[60px]"
            />
          </div>

          {/* Contributing factors */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Contributing Factors (one per line)</label>
            <Textarea
              value={contributingFactors}
              onChange={(e) => setContributingFactors(e.target.value)}
              placeholder="Enter each factor on a new line..."
              className="text-xs min-h-[50px]"
            />
          </div>

          {/* Lessons learned */}
          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Lessons Learned</label>
            <Textarea
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder="What can be learned from this incident?"
              className="text-xs min-h-[50px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            className="text-xs"
            onClick={handleSubmit}
            disabled={!medication.trim() || !whatHappened.trim() || !dateOccurred}
          >
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
