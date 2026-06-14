"use client";

import React, { useState } from "react";
import type { HrCaseType, HrCaseStatus, HrRiskLevel, HrLetterStatus } from "@/lib/hr/types";
import type { HrRole, HrAction } from "@/lib/hr/permissions";
import { HR_PERMISSIONS } from "@/lib/hr/permissions";

// ══════════════════════════════════════════════════════════════════════════════
// HR Intelligence Dashboard Widget
//
// Aggregate overview of HR case activity, safer recruitment compliance,
// workforce HR health, and the RBAC permission matrix. Shows NO sensitive
// case details, names, or content — only counts, types, statuses, and risk
// levels. Designed for the Registered Manager / RI dashboard.
//
// Uses embedded demo data so it renders without an API or database connection.
// ══════════════════════════════════════════════════════════════════════════════

// ── Demo Data ───────────────────────────────────────────────────────────────

interface DemoCaseSummary {
  ref: string;
  caseType: HrCaseType;
  status: HrCaseStatus;
  riskLevel: HrRiskLevel;
  openedAt: string;
}

interface DemoSaferRecruitmentRecord {
  ref: string;
  checksCompleted: number;
  checksTotal: number;
  gateOutcome: "approved" | "in_progress" | "blocked";
  dbsRenewalDue?: string;
}

interface DemoHrTask {
  id: string;
  taskType: string;
  title: string;
  dueDate: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "open" | "in_progress";
}

interface DemoLetterPipeline {
  status: HrLetterStatus;
  count: number;
}

const DEMO_CASES: DemoCaseSummary[] = [
  { ref: "HR-001", caseType: "disciplinary", status: "open", riskLevel: "red", openedAt: "2026-05-02" },
  { ref: "HR-002", caseType: "grievance", status: "open", riskLevel: "green", openedAt: "2026-05-08" },
  { ref: "HR-003", caseType: "sickness_absence", status: "investigation", riskLevel: "amber", openedAt: "2026-04-20" },
  { ref: "HR-004", caseType: "probation", status: "closed", riskLevel: "green", openedAt: "2026-03-10" },
  { ref: "HR-005", caseType: "informal_concern", status: "meeting_scheduled", riskLevel: "green", openedAt: "2026-05-14" },
];

const DEMO_SAFER_RECRUITMENT: DemoSaferRecruitmentRecord[] = [
  { ref: "SR-001", checksCompleted: 14, checksTotal: 14, gateOutcome: "approved" },
  { ref: "SR-002", checksCompleted: 14, checksTotal: 14, gateOutcome: "approved" },
  { ref: "SR-003", checksCompleted: 14, checksTotal: 14, gateOutcome: "approved" },
  { ref: "SR-004", checksCompleted: 12, checksTotal: 14, gateOutcome: "in_progress", dbsRenewalDue: "2026-06-30" },
];

const DEMO_TASKS: DemoHrTask[] = [
  { id: "T-001", taskType: "supervision", title: "Monthly supervision due", dueDate: "2026-05-22", priority: "medium", status: "open" },
  { id: "T-002", taskType: "supervision", title: "Monthly supervision due", dueDate: "2026-05-24", priority: "medium", status: "open" },
  { id: "T-003", taskType: "dbs_renewal", title: "Enhanced DBS renewal", dueDate: "2026-06-30", priority: "high", status: "open" },
  { id: "T-004", taskType: "probation_review", title: "6-month probation review", dueDate: "2026-05-28", priority: "high", status: "in_progress" },
  { id: "T-005", taskType: "training_renewal", title: "Mandatory training renewal", dueDate: "2026-06-15", priority: "medium", status: "open" },
  { id: "T-006", taskType: "investigation_deadline", title: "Investigation target date", dueDate: "2026-05-30", priority: "urgent", status: "in_progress" },
];

const DEMO_LETTER_PIPELINE: DemoLetterPipeline[] = [
  { status: "cara_draft", count: 1 },
  { status: "manager_review", count: 1 },
  { status: "approved", count: 1 },
];

const ACTIVE_SUSPENSIONS = 0;

// ── Derived metrics ─────────────────────────────────────────────────────────

const activeCases = DEMO_CASES.filter((c) => c.status !== "closed" && c.status !== "withdrawn").length;
const redCases = DEMO_CASES.filter((c) => c.riskLevel === "red").length;
const amberCases = DEMO_CASES.filter((c) => c.riskLevel === "amber").length;

const srApproved = DEMO_SAFER_RECRUITMENT.filter((r) => r.gateOutcome === "approved").length;
const srTotal = DEMO_SAFER_RECRUITMENT.length;
const srCompliancePct = srTotal > 0 ? Math.round((srApproved / srTotal) * 100) : 0;
const srIncomplete = DEMO_SAFER_RECRUITMENT.filter((r) => r.gateOutcome !== "approved");
const srNearDbsExpiry = DEMO_SAFER_RECRUITMENT.filter((r) => r.dbsRenewalDue !== undefined);

const openTasks = DEMO_TASKS.length;
const overdueTasks = DEMO_TASKS.filter((t) => new Date(t.dueDate) < new Date("2026-05-18")).length;
const urgentTasks = DEMO_TASKS.filter((t) => t.priority === "urgent").length;

const lettersInPipeline = DEMO_LETTER_PIPELINE.reduce((sum, l) => sum + l.count, 0);

// ── RBAC permission groups (for the matrix section) ─────────────────────────

interface ActionGroup {
  label: string;
  actions: HrAction[];
}

const ACTION_GROUPS: ActionGroup[] = [
  { label: "Case Management", actions: ["case.create", "case.read", "case.update", "case.close", "case.delete", "case.export"] },
  { label: "Safeguarding Cases", actions: ["case.read_safeguarding"] },
  { label: "Guardian", actions: ["guardian.run", "guardian.approve", "guardian.reject", "guardian.read"] },
  { label: "Letters", actions: ["letter.draft", "letter.approve", "letter.send"] },
  { label: "Safer Recruitment", actions: ["safer_recruitment.read", "safer_recruitment.update", "safer_recruitment.sign_off", "safer_recruitment.senior_risk_acceptance"] },
  { label: "Probation", actions: ["probation.read", "probation.update", "probation.decide_outcome"] },
  { label: "Sickness", actions: ["sickness.read", "sickness.update"] },
  { label: "Agency / Exit", actions: ["agency.read", "agency.update", "agency.block", "exit_interview.read", "exit_interview.update"] },
  { label: "Audit", actions: ["audit.read", "audit.export"] },
  { label: "RI Oversight", actions: ["ri_oversight.write"] },
  { label: "Tasks", actions: ["tasks.read", "tasks.write"] },
];

const DISPLAY_ROLES: { role: HrRole; label: string }[] = [
  { role: "ri", label: "RI" },
  { role: "rm", label: "RM" },
  { role: "deputy", label: "Deputy" },
  { role: "hr_admin", label: "HR Admin" },
  { role: "hr_caseworker", label: "Caseworker" },
  { role: "safeguarding", label: "DSL" },
  { role: "auditor", label: "Auditor" },
  { role: "staff_self", label: "Staff" },
  { role: "none", label: "None" },
];

function roleHasGroupAccess(role: HrRole, group: ActionGroup): "full" | "partial" | "none" {
  const perms = HR_PERMISSIONS[role];
  const matched = group.actions.filter((a) => perms.has(a)).length;
  if (matched === 0) return "none";
  if (matched === group.actions.length) return "full";
  return "partial";
}

// ── Regulatory links ────────────────────────────────────────────────────────

const REGULATORY_LINKS = [
  "Children's Homes (England) Regulations 2015 Reg 32 (employment of staff)",
  "Children's Homes (England) Regulations 2015 Reg 33 (fitness of workers)",
  "Working Together to Safeguard Children 2023",
  "ACAS Code of Practice on Disciplinary and Grievance Procedures",
];

// ── Safer Recruitment checks list (14 checks) ──────────────────────────────

const SR_CHECK_LABELS = [
  "Application form complete",
  "Full employment history",
  "Gaps explored and explained",
  "Identity check",
  "Right to work confirmed",
  "Enhanced DBS clear",
  "Barred list check",
  "2+ references verified",
  "Interview notes on file",
  "Values-based interview",
  "Qualifications verified",
  "Health declaration",
  "Induction plan in place",
  "Manager sign-off",
];

// ── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({ label, value, suffix, color }: { label: string; value: number | string; suffix?: string; color?: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <span className={`text-2xl font-bold ${color ?? "text-gray-900"}`}>
        {value}{suffix}
      </span>
      <span className="mt-1 text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

function RiskBadge({ level }: { level: HrRiskLevel }) {
  const map: Record<HrRiskLevel, string> = {
    green: "bg-green-100 text-green-700 border-green-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    red: "bg-red-100 text-red-700 border-red-200",
    black: "bg-gray-900 text-white border-gray-700",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${map[level]}`}>
      {level}
    </span>
  );
}

function StatusBadge({ status }: { status: HrCaseStatus }) {
  const map: Record<string, string> = {
    open: "bg-blue-100 text-blue-700 border-blue-200",
    investigation: "bg-purple-100 text-purple-700 border-purple-200",
    suspended: "bg-gray-100 text-gray-700 border-gray-300",
    meeting_scheduled: "bg-indigo-100 text-indigo-700 border-indigo-200",
    outcome_pending: "bg-amber-100 text-amber-700 border-amber-200",
    awaiting_appeal: "bg-orange-100 text-orange-700 border-orange-200",
    closed: "bg-green-100 text-green-700 border-green-200",
    withdrawn: "bg-gray-100 text-gray-500 border-gray-200",
  };
  const labels: Record<string, string> = {
    open: "Open",
    investigation: "Investigation",
    suspended: "Suspended",
    meeting_scheduled: "Meeting Scheduled",
    outcome_pending: "Outcome Pending",
    awaiting_appeal: "Awaiting Appeal",
    closed: "Closed",
    withdrawn: "Withdrawn",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${map[status] ?? "bg-gray-100 text-gray-700"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function GateBadge({ outcome }: { outcome: "approved" | "in_progress" | "blocked" }) {
  const map: Record<string, string> = {
    approved: "bg-green-100 text-green-700 border-green-200",
    in_progress: "bg-amber-100 text-amber-700 border-amber-200",
    blocked: "bg-red-100 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    approved: "Approved",
    in_progress: "In Progress",
    blocked: "Blocked",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${map[outcome]}`}>
      {labels[outcome]}
    </span>
  );
}

function LetterStatusBadge({ status }: { status: HrLetterStatus }) {
  const map: Record<HrLetterStatus, string> = {
    cara_draft: "bg-purple-100 text-purple-700 border-purple-200",
    manager_review: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-green-100 text-green-700 border-green-200",
    sent: "bg-blue-100 text-blue-700 border-blue-200",
    withdrawn: "bg-gray-100 text-gray-500 border-gray-200",
  };
  const labels: Record<HrLetterStatus, string> = {
    cara_draft: "Cara Draft",
    manager_review: "Manager Review",
    approved: "Approved",
    sent: "Sent",
    withdrawn: "Withdrawn",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: "urgent" | "high" | "medium" | "low" }) {
  const map: Record<string, string> = {
    urgent: "bg-red-100 text-red-700 border-red-200",
    high: "bg-orange-100 text-orange-700 border-orange-200",
    medium: "bg-blue-100 text-blue-700 border-blue-200",
    low: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${map[priority]}`}>
      {priority}
    </span>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pctVal = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pctVal}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-10 text-right">{pctVal}%</span>
    </div>
  );
}

function formatCaseType(t: HrCaseType): string {
  return t
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatTaskType(t: string): string {
  return t
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Main Widget ─────────────────────────────────────────────────────────────

export function HrIntelligenceDashboardWidget() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggle = (section: string) =>
    setExpandedSection((prev) => (prev === section ? null : section));

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            HR Intelligence Overview
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Aggregate HR metrics — CHR 2015 Reg 32/33, ACAS Code of Practice
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          Demo Data
        </span>
      </div>

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <MetricCard
          label="Active Cases"
          value={activeCases}
          color={redCases > 0 ? "text-red-600" : activeCases > 3 ? "text-amber-600" : "text-gray-900"}
        />
        <MetricCard
          label="Safer Recruitment"
          value={srCompliancePct}
          suffix="%"
          color={srCompliancePct === 100 ? "text-green-600" : srCompliancePct >= 75 ? "text-amber-600" : "text-red-600"}
        />
        <MetricCard
          label="Open HR Tasks"
          value={openTasks}
          color={urgentTasks > 0 ? "text-red-600" : openTasks > 5 ? "text-amber-600" : "text-gray-900"}
        />
        <MetricCard
          label="Active Suspensions"
          value={ACTIVE_SUSPENSIONS}
          color={ACTIVE_SUSPENSIONS === 0 ? "text-green-600" : "text-red-600"}
        />
        <MetricCard
          label="Letters in Pipeline"
          value={lettersInPipeline}
          color={lettersInPipeline > 5 ? "text-amber-600" : "text-gray-900"}
        />
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {redCases > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            {redCases} RED CASE{redCases !== 1 ? "S" : ""}
          </span>
        )}
        {amberCases > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            {amberCases} AMBER CASE{amberCases !== 1 ? "S" : ""}
          </span>
        )}
        {overdueTasks > 0 && (
          <span className="rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium border border-red-200">
            {overdueTasks} OVERDUE TASK{overdueTasks !== 1 ? "S" : ""}
          </span>
        )}
        {urgentTasks > 0 && (
          <span className="rounded-full bg-orange-100 text-orange-700 px-3 py-1 text-xs font-medium border border-orange-200">
            {urgentTasks} URGENT TASK{urgentTasks !== 1 ? "S" : ""}
          </span>
        )}
        {srIncomplete.length > 0 && (
          <span className="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-medium border border-amber-200">
            {srIncomplete.length} INCOMPLETE RECRUITMENT RECORD{srIncomplete.length !== 1 ? "S" : ""}
          </span>
        )}
        {srNearDbsExpiry.length > 0 && (
          <span className="rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs font-medium border border-purple-200">
            {srNearDbsExpiry.length} NEAR DBS EXPIRY
          </span>
        )}
        {ACTIVE_SUSPENSIONS === 0 && (
          <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium border border-green-200">
            NO ACTIVE SUSPENSIONS
          </span>
        )}
      </div>

      {/* ── HR Cases Overview ──────────────────────────────────────────────── */}
      <div className="mb-4">
        <button
          onClick={() => toggle("cases")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "cases" ? "rotate-90" : ""}`}>&#9654;</span>
          HR Cases Overview ({DEMO_CASES.length})
        </button>
        {expandedSection === "cases" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-2 text-gray-600">Ref</th>
                    <th className="text-left py-2 pr-2 text-gray-600">Type</th>
                    <th className="text-left py-2 pr-2 text-gray-600">Status</th>
                    <th className="text-left py-2 pr-2 text-gray-600">Risk</th>
                    <th className="text-left py-2 text-gray-600">Opened</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_CASES.map((c) => (
                    <tr key={c.ref} className="border-b border-gray-100">
                      <td className="py-2 pr-2 font-medium text-gray-700">{c.ref}</td>
                      <td className="py-2 pr-2 text-gray-600">{formatCaseType(c.caseType)}</td>
                      <td className="py-2 pr-2"><StatusBadge status={c.status} /></td>
                      <td className="py-2 pr-2"><RiskBadge level={c.riskLevel} /></td>
                      <td className="py-2 text-gray-500">{c.openedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-400 italic">
              Anonymised case references only. No staff names or case content shown.
            </p>
          </div>
        )}
      </div>

      {/* ── Safer Recruitment Compliance ───────────────────────────────────── */}
      <div className="mb-4">
        <button
          onClick={() => toggle("safer")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "safer" ? "rotate-90" : ""}`}>&#9654;</span>
          Safer Recruitment Compliance ({srApproved}/{srTotal} approved)
        </button>
        {expandedSection === "safer" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4 space-y-4">
            {DEMO_SAFER_RECRUITMENT.map((r) => (
              <div key={r.ref} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{r.ref}</span>
                    <GateBadge outcome={r.gateOutcome} />
                  </div>
                  <span className="text-xs text-gray-500">
                    {r.checksCompleted}/{r.checksTotal} checks
                  </span>
                </div>
                <ProgressBar
                  value={r.checksCompleted}
                  max={r.checksTotal}
                  color={r.gateOutcome === "approved" ? "bg-green-500" : r.gateOutcome === "in_progress" ? "bg-amber-500" : "bg-red-500"}
                />
                {r.gateOutcome !== "approved" && (
                  <div className="mt-2">
                    <p className="text-xs text-amber-600 font-medium mb-1">
                      Missing checks ({r.checksTotal - r.checksCompleted}):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {SR_CHECK_LABELS.slice(r.checksCompleted).map((label) => (
                        <span key={label} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {r.dbsRenewalDue && (
                  <p className="mt-1 text-xs text-purple-600">
                    DBS renewal due: {r.dbsRenewalDue}
                  </p>
                )}
              </div>
            ))}
            <p className="text-xs text-gray-400 italic">
              14 mandatory checks per the Safer Recruitment Consortium guidance. Gate evaluation from saferRecruitmentGate engine.
            </p>
          </div>
        )}
      </div>

      {/* ── HR Tasks Due ──────────────────────────────────────────────────── */}
      <div className="mb-4">
        <button
          onClick={() => toggle("tasks")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "tasks" ? "rotate-90" : ""}`}>&#9654;</span>
          HR Tasks Due ({openTasks})
        </button>
        {expandedSection === "tasks" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <div className="space-y-2">
              {DEMO_TASKS.map((t) => {
                const isOverdue = new Date(t.dueDate) < new Date("2026-05-18");
                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-0 ${isOverdue ? "bg-red-50 -mx-2 px-2 rounded" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={t.priority} />
                      <div>
                        <span className="text-sm text-gray-700">{t.title}</span>
                        <span className="text-xs text-gray-400 ml-2">{formatTaskType(t.taskType)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOverdue && (
                        <span className="text-xs text-red-600 font-semibold">OVERDUE</span>
                      )}
                      <span className="text-xs text-gray-500">{t.dueDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Letter Pipeline ───────────────────────────────────────────────── */}
      <div className="mb-4">
        <button
          onClick={() => toggle("letters")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "letters" ? "rotate-90" : ""}`}>&#9654;</span>
          Letter Pipeline ({lettersInPipeline})
        </button>
        {expandedSection === "letters" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-4 mb-3">
              {(["cara_draft", "manager_review", "approved", "sent"] as const).map((stage, idx, arr) => {
                const entry = DEMO_LETTER_PIPELINE.find((l) => l.status === stage);
                const count = entry?.count ?? 0;
                return (
                  <React.Fragment key={stage}>
                    <div className="flex flex-col items-center">
                      <span className={`text-xl font-bold ${count > 0 ? "text-gray-900" : "text-gray-300"}`}>{count}</span>
                      <LetterStatusBadge status={stage} />
                    </div>
                    {idx < arr.length - 1 && (
                      <span className="text-gray-300 text-lg">&rarr;</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 italic">
              Letters are gated by the HR Process Guardian. No letter content is shown on this overview.
            </p>
          </div>
        )}
      </div>

      {/* ── Role Permission Matrix ────────────────────────────────────────── */}
      <div className="mb-4">
        <button
          onClick={() => toggle("rbac")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "rbac" ? "rotate-90" : ""}`}>&#9654;</span>
          Role Permission Matrix ({DISPLAY_ROLES.length} roles, {ACTION_GROUPS.length} groups)
        </button>
        {expandedSection === "rbac" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-2 text-gray-600 sticky left-0 bg-white">Action Group</th>
                    {DISPLAY_ROLES.map((r) => (
                      <th key={r.role} className="py-2 px-1 text-center text-gray-600 whitespace-nowrap">
                        {r.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ACTION_GROUPS.map((group) => (
                    <tr key={group.label} className="border-b border-gray-100">
                      <td className="py-2 pr-2 font-medium text-gray-700 sticky left-0 bg-white whitespace-nowrap">{group.label}</td>
                      {DISPLAY_ROLES.map((r) => {
                        const access = roleHasGroupAccess(r.role, group);
                        return (
                          <td key={r.role} className="py-2 px-1 text-center">
                            {access === "full" ? (
                              <span className="text-green-600" title="Full access">&#10003;</span>
                            ) : access === "partial" ? (
                              <span className="text-amber-500" title="Partial access">&#9679;</span>
                            ) : (
                              <span className="text-gray-300" title="No access">&mdash;</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-gray-500">
              <span><span className="text-green-600">&#10003;</span> Full access</span>
              <span><span className="text-amber-500">&#9679;</span> Partial access</span>
              <span><span className="text-gray-300">&mdash;</span> No access</span>
            </div>
            <p className="mt-2 text-xs text-gray-400 italic">
              33 actions across 9 roles. RBAC enforced at the engine and API layer.
            </p>
          </div>
        )}
      </div>

      {/* ── Regulatory Footer ─────────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => toggle("regulatory")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className={`transform transition-transform ${expandedSection === "regulatory" ? "rotate-90" : ""}`}>&#9654;</span>
          Regulatory Framework
        </button>
        {expandedSection === "regulatory" && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
            <ul className="space-y-1">
              {REGULATORY_LINKS.map((link, i) => (
                <li key={i} className="text-xs text-gray-600">{link}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
