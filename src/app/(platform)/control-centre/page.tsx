"use client";

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import {
  Shield,
  LayoutDashboard,
  FileCheck,
  AlertTriangle,
  Users,
  Settings,
  BarChart3,
  Bell,
  Clock,
  Lock,
  FolderArchive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApprovalQueueCard } from "@/components/dashboard/approval-queue-card";
import { LifecycleComplianceCard } from "@/components/dashboard/lifecycle-compliance-card";

// ── Types ──────────────────────────────────────────────────────────────────

type Tab = "overview" | "approvals" | "overdue" | "compliance" | "scheduling" | "filing";

// ── Component ──────────────────────────────────────────────────────────────

export default function ControlCentrePage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <PageShell
      title="Control Centre"
      description="Quality Ecology management hub — approvals, compliance, escalations, and filing."
      icon={<Shield className="h-6 w-6 text-emerald-600" />}
    >
      {/* Tab Navigation */}
      <div className="border-b bg-white rounded-t-xl -mt-2 mb-6">
        <nav className="flex gap-1 px-4 overflow-x-auto" aria-label="Control Centre tabs">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Overview"
          />
          <TabButton
            active={activeTab === "approvals"}
            onClick={() => setActiveTab("approvals")}
            icon={<FileCheck className="h-4 w-4" />}
            label="Approval Queue"
            badge={3}
          />
          <TabButton
            active={activeTab === "overdue"}
            onClick={() => setActiveTab("overdue")}
            icon={<AlertTriangle className="h-4 w-4" />}
            label="Overdue & Escalations"
            badge={2}
            badgeColor="red"
          />
          <TabButton
            active={activeTab === "compliance"}
            onClick={() => setActiveTab("compliance")}
            icon={<BarChart3 className="h-4 w-4" />}
            label="Compliance"
          />
          <TabButton
            active={activeTab === "scheduling"}
            onClick={() => setActiveTab("scheduling")}
            icon={<Clock className="h-4 w-4" />}
            label="Scheduling"
          />
          <TabButton
            active={activeTab === "filing"}
            onClick={() => setActiveTab("filing")}
            icon={<FolderArchive className="h-4 w-4" />}
            label="Filing Cabinet"
          />
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "approvals" && <ApprovalsTab />}
      {activeTab === "overdue" && <OverdueTab />}
      {activeTab === "compliance" && <ComplianceTab />}
      {activeTab === "scheduling" && <SchedulingTab />}
      {activeTab === "filing" && <FilingTab />}
    </PageShell>
  );
}

// ── Tab Components ─────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ApprovalQueueCard />
      <LifecycleComplianceCard />

      {/* Quick Stats */}
      <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat
          icon={<FileCheck className="h-5 w-5 text-blue-500" />}
          label="Pending Approvals"
          value="3"
          sublabel="2 Level 1, 1 Level 2"
        />
        <QuickStat
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label="Escalated Items"
          value="2"
          sublabel="1 amber, 1 red"
        />
        <QuickStat
          icon={<Users className="h-5 w-5 text-purple-500" />}
          label="Staff On Shift"
          value="4"
          sublabel="2 RSW, 1 Senior, 1 TL"
        />
        <QuickStat
          icon={<Lock className="h-5 w-5 text-green-500" />}
          label="Filed Today"
          value="8"
          sublabel="All within SLA"
        />
      </div>

      {/* Lifecycle Pipeline */}
      <div className="lg:col-span-2 rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Today&apos;s Lifecycle Pipeline</h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          <PipelineStage label="Scheduled" count={4} color="bg-gray-200 text-gray-700" />
          <PipelineArrow />
          <PipelineStage label="Assigned" count={2} color="bg-slate-200 text-slate-700" />
          <PipelineArrow />
          <PipelineStage label="In Progress" count={3} color="bg-amber-100 text-amber-700" />
          <PipelineArrow />
          <PipelineStage label="Submitted" count={2} color="bg-blue-100 text-blue-700" />
          <PipelineArrow />
          <PipelineStage label="Checked" count={1} color="bg-indigo-100 text-indigo-700" />
          <PipelineArrow />
          <PipelineStage label="Approved" count={3} color="bg-green-100 text-green-700" />
          <PipelineArrow />
          <PipelineStage label="Filed" count={8} color="bg-emerald-100 text-emerald-700" />
        </div>
      </div>
    </div>
  );
}

function ApprovalsTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileCheck className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Approval Queue</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Items waiting for your check or approval. Items are listed by urgency — oldest first.
        </p>

        <div className="space-y-3">
          <ApprovalItem
            title="Keyworker 1:1 Session Record"
            submittedBy="Sarah (RSW)"
            submittedAt="10:30"
            level={1}
            status="needs_check"
            child="Jordan"
          />
          <ApprovalItem
            title="Monthly Risk Assessment Review"
            submittedBy="Jane (RSW)"
            submittedAt="11:00"
            level={2}
            status="needs_approval"
            child="Jordan"
          />
          <ApprovalItem
            title="Placement Plan Review (Resubmitted)"
            submittedBy="Sarah (RSW)"
            submittedAt="13:45"
            level={2}
            status="resubmitted"
            child="Jordan"
            resubmissionCount={1}
          />
        </div>
      </div>
    </div>
  );
}

function OverdueTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm border-l-4 border-l-red-500">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-gray-900">Overdue & Escalated Items</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Items that have passed their grace period and require immediate attention.
        </p>

        <div className="space-y-3">
          <EscalationItem
            title="Night Welfare Check"
            dueTime="02:00"
            minutesOverdue={615}
            level={2}
            severity="red"
            escalatedTo="Deputy Manager"
          />
          <EscalationItem
            title="End of Day Log"
            dueTime="22:00 (yesterday)"
            minutesOverdue={840}
            level={1}
            severity="amber"
            escalatedTo="Team Leader"
          />
          <EscalationItem
            title="Bedroom Safety Check"
            dueTime="07:00"
            minutesOverdue={300}
            level={1}
            severity="amber"
            escalatedTo="Team Leader"
            missed
          />
        </div>
      </div>
    </div>
  );
}

function ComplianceTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <LifecycleComplianceCard />

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Regulatory Alignment</h3>
        <div className="space-y-3">
          <RegulationRow reg="Reg 5" label="Engagement with Parents" rate={94} />
          <RegulationRow reg="Reg 6" label="Quality of Care" rate={88} />
          <RegulationRow reg="Reg 7" label="Children's Wishes" rate={92} />
          <RegulationRow reg="Reg 8" label="Education" rate={96} />
          <RegulationRow reg="Reg 12" label="Protection of Children" rate={100} />
          <RegulationRow reg="Reg 14" label="Care Planning" rate={85} />
          <RegulationRow reg="Reg 34" label="Staff Recruitment" rate={100} />
          <RegulationRow reg="Reg 35" label="Fitness of Staff" rate={91} />
          <RegulationRow reg="Reg 40" label="Notifiable Events" rate={100} />
          <RegulationRow reg="Reg 44" label="Independent Visits" rate={97} />
        </div>
      </div>
    </div>
  );
}

function SchedulingTab() {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-indigo-500" />
        <h3 className="font-semibold text-gray-900">Scheduled Forms & Tasks</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Manage recurring schedules, frequencies, and assignment rules.
      </p>

      <div className="space-y-3">
        <ScheduleRow template="Daily Fire Check" frequency="Daily" time="09:00" assignedRole="RSW" level={0} />
        <ScheduleRow template="Morning Medication Round" frequency="Daily" time="08:00" assignedRole="Senior RSW" level={1} />
        <ScheduleRow template="Night Welfare Check" frequency="Every Shift" time="02:00" assignedRole="Waking Night" level={0} />
        <ScheduleRow template="Keyworker 1:1 Session" frequency="Weekly" time="Flexible" assignedRole="RSW" level={1} />
        <ScheduleRow template="Monthly Risk Assessment" frequency="Monthly" time="By 15th" assignedRole="Team Leader" level={2} />
        <ScheduleRow template="Reg 44 Visit" frequency="Monthly" time="Flexible" assignedRole="Reg44 Visitor" level={2} />
        <ScheduleRow template="Placement Plan Review" frequency="Quarterly" time="By month end" assignedRole="RSW" level={2} />
        <ScheduleRow template="Statement of Purpose Review" frequency="Annually" time="April" assignedRole="RM" level={3} />
      </div>
    </div>
  );
}

function FilingTab() {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FolderArchive className="h-5 w-5 text-teal-500" />
        <h3 className="font-semibold text-gray-900">Filing Cabinet</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Approved and locked records are automatically filed here by category.
        Records are immutable once locked — amendments create linked addendums.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FilingFolder name="Health & Safety" count={156} lastFiled="Today" />
        <FilingFolder name="Medication" count={312} lastFiled="Today" />
        <FilingFolder name="Education" count={48} lastFiled="Yesterday" />
        <FilingFolder name="Safeguarding" count={23} lastFiled="3 days ago" />
        <FilingFolder name="Care Planning" count={67} lastFiled="Today" />
        <FilingFolder name="Staff Records" count={89} lastFiled="Yesterday" />
        <FilingFolder name="Reg 44 Reports" count={12} lastFiled="Last week" />
        <FilingFolder name="Incidents" count={34} lastFiled="2 days ago" />
      </div>
    </div>
  );
}

// ── Shared Sub-components ──────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
  badgeColor = "blue",
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeColor?: "blue" | "red";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
        active
          ? "border-emerald-500 text-emerald-700"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
      )}
    >
      {icon}
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={cn(
          "ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full",
          badgeColor === "red" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700",
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

function QuickStat({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>
    </div>
  );
}

function PipelineStage({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={cn("px-3 py-2 rounded-lg text-center min-w-[90px]", color)}>
      <div className="text-lg font-bold">{count}</div>
      <div className="text-xs">{label}</div>
    </div>
  );
}

function PipelineArrow() {
  return <div className="text-gray-300 text-lg px-0.5">&rarr;</div>;
}

function ApprovalItem({
  title,
  submittedBy,
  submittedAt,
  level,
  status,
  child,
  resubmissionCount,
}: {
  title: string;
  submittedBy: string;
  submittedAt: string;
  level: number;
  status: "needs_check" | "needs_approval" | "resubmitted";
  child?: string;
  resubmissionCount?: number;
}) {
  const statusConfig = {
    needs_check: { label: "Needs Check", color: "bg-blue-100 text-blue-700" },
    needs_approval: { label: "Needs Approval", color: "bg-purple-100 text-purple-700" },
    resubmitted: { label: "Resubmitted", color: "bg-orange-100 text-orange-700" },
  };
  const { label: statusLabel, color: statusColor } = statusConfig[status];

  return (
    <div className="p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            By {submittedBy} at {submittedAt}
            {child && <> &bull; {child}</>}
            {resubmissionCount && <> &bull; Resubmission #{resubmissionCount}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("px-2 py-0.5 rounded text-xs font-medium", statusColor)}>
            {statusLabel}
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
            L{level}
          </span>
        </div>
      </div>
    </div>
  );
}

function EscalationItem({
  title,
  dueTime,
  minutesOverdue,
  level,
  severity,
  escalatedTo,
  missed,
}: {
  title: string;
  dueTime: string;
  minutesOverdue: number;
  level: number;
  severity: "amber" | "red" | "critical";
  escalatedTo: string;
  missed?: boolean;
}) {
  const severityConfig = {
    amber: { label: "AMBER", color: "bg-amber-100 text-amber-700 border-amber-300" },
    red: { label: "RED", color: "bg-red-100 text-red-700 border-red-300" },
    critical: { label: "CRITICAL", color: "bg-red-200 text-red-800 border-red-400" },
  };
  const { label: sevLabel, color: sevColor } = severityConfig[severity];
  const hours = Math.floor(minutesOverdue / 60);
  const mins = minutesOverdue % 60;

  return (
    <div className={cn("p-4 rounded-lg border-l-4", sevColor)}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{title}</p>
            {missed && <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-red-600 text-white">MISSED</span>}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Due: {dueTime} &bull; Overdue {hours}h {mins}m &bull; Escalated to {escalatedTo}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("px-2 py-0.5 rounded text-xs font-bold", sevColor)}>
            {sevLabel}
          </span>
          <span className="text-xs text-gray-500">Level {level}</span>
        </div>
      </div>
    </div>
  );
}

function RegulationRow({ reg, label, rate }: { reg: string; label: string; rate: number }) {
  const color = rate >= 95 ? "text-green-600" : rate >= 85 ? "text-amber-600" : "text-red-600";
  const barColor = rate >= 95 ? "bg-green-500" : rate >= 85 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono font-bold text-gray-500 w-12">{reg}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">{label}</span>
          <span className={cn("text-xs font-bold", color)}>{rate}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className={cn("h-full rounded-full", barColor)} style={{ width: `${rate}%` }} />
        </div>
      </div>
    </div>
  );
}

function ScheduleRow({
  template,
  frequency,
  time,
  assignedRole,
  level,
}: {
  template: string;
  frequency: string;
  time: string;
  assignedRole: string;
  level: number;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
      <div>
        <p className="text-sm font-medium text-gray-900">{template}</p>
        <p className="text-xs text-gray-500">{frequency} at {time} &bull; {assignedRole}</p>
      </div>
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
        L{level}
      </span>
    </div>
  );
}

function FilingFolder({ name, count, lastFiled }: { name: string; count: number; lastFiled: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-teal-50 transition-colors cursor-pointer">
      <FolderArchive className="h-5 w-5 text-teal-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">{count} records &bull; Last filed: {lastFiled}</p>
      </div>
    </div>
  );
}
