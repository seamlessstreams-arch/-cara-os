"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PROFILE PAGE
// Full development profile: training, supervision, tasks, Cara learning summary
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaUsageBadge } from "@/components/aria/aria-usage-badge";
import { StudioQuickActions } from "@/components/aria-studio/studio-quick-actions";
import { useStaffMember } from "@/hooks/use-staff";
import { StaffComplianceCard } from "@/components/staff/staff-compliance-card";
import { useTrainingNeeds } from "@/hooks/use-ri-learning";
import { useAuthContext } from "@/contexts/auth-context";
import { PrintButton } from "@/components/common/print-button";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { useDocumentIntelligence } from "@/hooks/use-doc-intelligence";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import type { TrainingRecord, Supervision, Task } from "@/types";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import {
  ArrowLeft, BookOpen, ClipboardList, CheckSquare, Loader2,
  AlertTriangle, CheckCircle2, Clock, ShieldCheck, Calendar,
  Sparkles, Brain, Phone, Mail, TrendingUp, GraduationCap,
  User, Award, AlertCircle, ChevronRight, FileText, Map,
  FlaskConical, Flame, ShieldAlert, HeartPulse, Scale, Utensils,
  Users, BookMarked, XCircle,
} from "lucide-react";

// ── Status helpers ────────────────────────────────────────────────────────────

const TRAINING_STATUS_CFG: Record<string, { label: string; colour: string }> = {
  compliant:     { label: "Compliant",      colour: "bg-emerald-100 text-emerald-700" },
  expiring_soon: { label: "Expiring Soon",  colour: "bg-amber-100 text-amber-700" },
  expired:       { label: "Expired",        colour: "bg-red-100 text-red-700" },
  not_completed: { label: "Not Completed",  colour: "bg-slate-100 text-[var(--cs-text-secondary)]" },
};

const SUPERVISION_STATUS_CFG: Record<string, { label: string; colour: string }> = {
  completed:    { label: "Completed",   colour: "bg-emerald-100 text-emerald-700" },
  scheduled:    { label: "Scheduled",   colour: "bg-blue-100 text-blue-700" },
  cancelled:    { label: "Cancelled",   colour: "bg-red-100 text-red-700" },
  rescheduled:  { label: "Rescheduled", colour: "bg-amber-100 text-amber-700" },
};

// ── Tab type ──────────────────────────────────────────────────────────────────

type Tab = "overview" | "training" | "supervision" | "tasks" | "development" | "pathway" | "documents";

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  colour,
  alert,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  colour: string;
  alert?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border bg-white p-4", alert ? "border-red-200 bg-red-50" : "border-[var(--cs-border-subtle)]")}>
      <div className="flex items-center gap-3">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", colour)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className={cn("text-xl font-bold tabular-nums", alert ? "text-red-700" : "text-[var(--cs-navy)]")}>{value}</div>
          <div className="text-xs text-[var(--cs-text-muted)]">{label}</div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [showAria, setShowAria] = useState(false);
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";

  const query = useStaffMember(id);
  const trainingNeedsQuery = useTrainingNeeds({ homeId });
  const docsQuery = useDocumentIntelligence();

  const staff = query.data?.data;
  const related = query.data?.related;

  // Training needs for this staff member
  const staffTrainingNeeds = (trainingNeedsQuery.data?.data ?? []).filter(
    (n) => n.affected_staff?.includes(id) || n.affected_roles?.includes(staff?.role ?? "")
  );
  const urgentNeeds = staffTrainingNeeds.filter((n) => n.priority === "urgent" && n.status !== "completed" && n.status !== "no_action");

  if (query.isLoading) {
    return (
      <PageShell title="Staff Profile" showQuickCreate={false}>
        <div className="flex items-center justify-center py-24 gap-2 text-[var(--cs-text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading profile…</span>
        </div>
      </PageShell>
    );
  }

  if (!staff || query.isError) {
    return (
      <PageShell title="Staff Profile" showQuickCreate={false}>
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-[var(--cs-text-muted)]">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm font-medium">Staff member not found</p>
          <Button size="sm" variant="outline" onClick={() => router.push("/staff")}>
            <ArrowLeft className="h-4 w-4 mr-1" />Back to Staff
          </Button>
        </div>
      </PageShell>
    );
  }

  const training = related?.training ?? [];
  const supervisions = related?.supervisions ?? [];
  const tasks = related?.tasks ?? [];

  const completedTraining = training.filter((t) => t.status === "compliant").length;
  const expiredTraining   = training.filter((t) => t.status === "expired").length;
  const expiringSoon      = training.filter((t) => t.status === "expiring_soon").length;
  const completedSupervisions = supervisions.filter((s) => s.status === "completed");
  const lastSupervision = completedSupervisions[0] ?? null;

  const linkedDocs = (docsQuery.data?.data ?? []).filter((d) => d.linked_staff_id === id);

  const TABS: Array<{ id: Tab; label: string; count?: number; alert?: boolean }> = [
    { id: "overview",    label: "Overview" },
    { id: "training",    label: "Training",    count: training.length, alert: expiredTraining > 0 },
    { id: "supervision", label: "Supervision", count: supervisions.length, alert: staff.supervision_overdue },
    { id: "tasks",       label: "Tasks",       count: tasks.length, alert: staff.overdue_tasks > 0 },
    { id: "development", label: "Development", count: staffTrainingNeeds.length, alert: urgentNeeds.length > 0 },
    { id: "pathway",     label: "Pathway" },
    { id: "documents",   label: "Documents",   count: linkedDocs.length || undefined },
  ];

  // Cara context for development summary
  const ariaContext = [
    `Staff: ${staff.full_name}, ${staff.job_title}`,
    `Start date: ${formatDate(staff.start_date)}`,
    `Training: ${completedTraining} compliant, ${expiredTraining} expired, ${expiringSoon} expiring`,
    `Supervisions: ${completedSupervisions.length} completed. Last: ${lastSupervision ? formatDate(lastSupervision.scheduled_date) : "none"}`,
    `Identified training needs: ${staffTrainingNeeds.map((n) => n.title).join("; ")}`,
    staff.supervision_overdue ? `ALERT: Supervision overdue (due ${staff.next_supervision_due})` : "",
  ].filter(Boolean).join(". ");

  return (
    <PageShell
      title={staff.full_name}
      subtitle={`${staff.job_title} · ${staff.employment_type}`}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title={staff.full_name} subtitle="Chamberlain House — Staff Record" targetId="staff-detail-content" />
          <SmartUploadButton
            variant="icon"
            linkedStaffId={id}
            uploadContext={`Staff profile — ${staff.full_name}`}
          />
          <Button size="sm" variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
            onClick={() => router.push(`/record-staff/${id}`)}
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--cs-aria-gold)]" />
            Record anything
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setShowAria((p) => !p)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {showAria ? "Close Cara" : "Cara Summary"}
          </Button>
        </div>
      }
    >
      <div id="staff-detail-content" className="space-y-5 animate-fade-in">

        {/* Cara Development Summary Panel */}
        {showAria && (
          <>
            <AriaPanel
              mode="staff_development_summary"
              pageContext="Staff development profile"
              recordType="staff_development"
              sourceContent={ariaContext}
              userRole="registered_manager"
              defaultStyle="concise_manager"
            />
            <StudioQuickActions sourceType="staff" />
          </>
        )}

        {/* Profile header */}
        <div className="rounded-2xl border border-[var(--cs-border-subtle)] bg-white p-5">
          <div className="flex items-start gap-4">
            <Avatar name={staff.full_name} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h2 className="text-lg font-bold text-[var(--cs-navy)]">{staff.full_name}</h2>
                  <p className="text-sm text-[var(--cs-text-muted)]">{staff.job_title}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge
                    variant={staff.employment_status === "active" ? "success" : "secondary"}
                    className="text-[10px] rounded-full capitalize"
                  >
                    {staff.employment_status}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] rounded-full capitalize">
                    {staff.employment_type}
                  </Badge>
                  <AriaUsageBadge ariaAssisted={(staff as any).aria_assist_used} sourceTable="staff" recordId={staff.id} />
                  {staff.supervision_overdue && (
                    <Badge variant="destructive" className="text-[10px] rounded-full">
                      Supervision Overdue
                    </Badge>
                  )}
                  {urgentNeeds.length > 0 && (
                    <Badge variant="warning" className="text-[10px] rounded-full">
                      {urgentNeeds.length} Urgent Training Need{urgentNeeds.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--cs-text-muted)]">
                {staff.email && (
                  <a href={`mailto:${staff.email}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    <Mail className="h-3.5 w-3.5" />{staff.email}
                  </a>
                )}
                {staff.phone && (
                  <a href={`tel:${staff.phone}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    <Phone className="h-3.5 w-3.5" />{staff.phone}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />Started {formatDate(staff.start_date)}
                </span>
                {staff.next_supervision_due && (
                  <span className={cn("flex items-center gap-1", staff.supervision_overdue ? "text-red-600 font-medium" : "")}>
                    <ClipboardList className="h-3.5 w-3.5" />
                    Supervision {staff.supervision_overdue ? "overdue" : "due"} {formatRelative(staff.next_supervision_due)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={GraduationCap} label="Training Records" value={training.length} colour="bg-blue-100 text-blue-600" />
          <StatCard icon={CheckCircle2} label="Compliant" value={completedTraining} colour="bg-emerald-100 text-emerald-600" />
          <StatCard icon={AlertTriangle} label="Expired / Expiring" value={expiredTraining + expiringSoon} colour={expiredTraining > 0 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"} alert={expiredTraining > 0} />
          <StatCard icon={Brain} label="Training Needs" value={staffTrainingNeeds.length} colour="bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]" alert={urgentNeeds.length > 0} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(({ id: tabId, label, count, alert }) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                tab === tabId
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-[var(--cs-text-secondary)] hover:bg-slate-200"
              )}
            >
              {alert && <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />}
              {label}
              {count !== undefined && count > 0 && (
                <span className={cn("rounded-full px-1.5 text-[9px] font-bold", tab === tabId ? "bg-white/20 text-white" : "bg-slate-200 text-[var(--cs-text-secondary)]")}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Overview tab ────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Employment details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />Employment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-[var(--cs-text-muted)]">Job Title</span><span className="font-medium text-[var(--cs-navy)]">{staff.job_title}</span></div>
                <div className="flex justify-between"><span className="text-[var(--cs-text-muted)]">Role</span><span className="font-medium text-[var(--cs-navy)] capitalize">{staff.role.replace(/_/g, " ")}</span></div>
                <div className="flex justify-between"><span className="text-[var(--cs-text-muted)]">Contract</span><span className="font-medium text-[var(--cs-navy)] capitalize">{staff.employment_type}</span></div>
                <div className="flex justify-between"><span className="text-[var(--cs-text-muted)]">Hours</span><span className="font-medium text-[var(--cs-navy)]">{staff.contracted_hours}h / week</span></div>
                <div className="flex justify-between"><span className="text-[var(--cs-text-muted)]">Start Date</span><span className="font-medium text-[var(--cs-navy)]">{formatDate(staff.start_date)}</span></div>
                {staff.probation_end_date && (
                  <div className="flex justify-between"><span className="text-[var(--cs-text-muted)]">Probation Ends</span><span className="font-medium text-[var(--cs-navy)]">{formatDate(staff.probation_end_date)}</span></div>
                )}
                {staff.payroll_id && (
                  <div className="flex justify-between"><span className="text-[var(--cs-text-muted)]">Payroll ID</span><span className="font-medium text-[var(--cs-navy)]">{staff.payroll_id}</span></div>
                )}
              </CardContent>
            </Card>

            {/* Compliance snapshot */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />Compliance Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Training compliance bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--cs-text-muted)]">Training Compliance</span>
                    <span className="font-medium text-[var(--cs-navy)]">{training.length > 0 ? Math.round((completedTraining / training.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={cn("h-2 rounded-full transition-all", expiredTraining > 0 ? "bg-red-500" : expiringSoon > 0 ? "bg-amber-400" : "bg-emerald-500")}
                      style={{ width: `${training.length > 0 ? Math.round((completedTraining / training.length) * 100) : 0}%` }}
                    />
                  </div>
                </div>

                {/* DBS */}
                <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-3 py-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--cs-text-muted)]">DBS Number</span>
                    <span className="font-medium">{staff.dbs_number ?? <span className="italic text-[var(--cs-text-muted)]">Not recorded</span>}</span>
                  </div>
                  {staff.dbs_issue_date && (
                    <div className="flex justify-between">
                      <span className="text-[var(--cs-text-muted)]">DBS Issued</span>
                      <span className="font-medium">{formatDate(staff.dbs_issue_date)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[var(--cs-text-muted)]">Update Service</span>
                    <span className={cn("font-medium", staff.dbs_update_service ? "text-emerald-600" : "text-[var(--cs-text-muted)]")}>
                      {staff.dbs_update_service ? "Enrolled" : "Not enrolled"}
                    </span>
                  </div>
                </div>

                {/* Supervision */}
                <div className="rounded-xl border border-[var(--cs-border-subtle)] bg-slate-50 px-3 py-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--cs-text-muted)]">Last Supervision</span>
                    <span className="font-medium">{lastSupervision ? formatDate(lastSupervision.scheduled_date) : <span className="italic text-[var(--cs-text-muted)]">None recorded</span>}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--cs-text-muted)]">Next Due</span>
                    <span className={cn("font-medium", staff.supervision_overdue ? "text-red-600" : "text-[var(--cs-navy)]")}>
                      {staff.next_supervision_due ? formatRelative(staff.next_supervision_due) : <span className="italic text-[var(--cs-text-muted)]">Not set</span>}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consolidated compliance & absence verdict */}
            <div className="sm:col-span-2">
              <StaffComplianceCard staffId={id} />
            </div>

            {/* Recent training */}
            {training.length > 0 && (
              <Card className="sm:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" />Recent Training
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {training.slice(0, 5).map((t) => {
                      const cfg = TRAINING_STATUS_CFG[t.status] ?? TRAINING_STATUS_CFG.not_completed;
                      return (
                        <div key={t.id} className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[var(--cs-navy)] truncate">{t.course_name}</p>
                            <p className="text-[10px] text-[var(--cs-text-muted)] capitalize">{t.category.replace(/_/g, " ")}{t.provider ? ` · ${t.provider}` : ""}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {t.expiry_date && <span className="text-[10px] text-[var(--cs-text-muted)]">Expires {formatDate(t.expiry_date)}</span>}
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.colour)}>{cfg.label}</span>
                          </div>
                        </div>
                      );
                    })}
                    {training.length > 5 && (
                      <button onClick={() => setTab("training")} className="text-xs text-blue-600 hover:underline">
                        View all {training.length} records →
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Training tab ────────────────────────────────────────────────── */}
        {tab === "training" && (
          <div className="space-y-3">
            {training.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-[var(--cs-border)] p-10 text-center">
                <GraduationCap className="h-8 w-8 text-[var(--cs-text-gentle)] mx-auto mb-2" />
                <p className="text-sm text-[var(--cs-text-muted)]">No training records</p>
              </div>
            ) : (
              <div className="rounded-2xl border bg-white overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-[var(--cs-border-subtle)]">
                    <tr>
                      {["Course", "Category", "Provider", "Completed", "Expiry", "Status"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {training.map((t) => {
                      const cfg = TRAINING_STATUS_CFG[t.status] ?? TRAINING_STATUS_CFG.not_completed;
                      return (
                        <tr key={t.id} className="hover:bg-[var(--cs-surface)]/50">
                          <td className="px-4 py-3">
                            <p className="text-xs font-medium text-[var(--cs-navy)]">{t.course_name}</p>
                            {t.is_mandatory && <span className="text-[9px] text-red-600 font-medium">Mandatory</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--cs-text-secondary)] capitalize">{t.category.replace(/_/g, " ")}</td>
                          <td className="px-4 py-3 text-xs text-[var(--cs-text-secondary)]">{t.provider ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-[var(--cs-text-secondary)]">{t.completed_date ? formatDate(t.completed_date) : "—"}</td>
                          <td className="px-4 py-3 text-xs text-[var(--cs-text-secondary)]">{t.expiry_date ? formatDate(t.expiry_date) : "—"}</td>
                          <td className="px-4 py-3">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.colour)}>{cfg.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Supervision tab ─────────────────────────────────────────────── */}
        {tab === "supervision" && (
          <div className="space-y-3">
            {staff.supervision_overdue && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Supervision Overdue</p>
                  <p className="text-xs text-red-700 mt-0.5">
                    Next supervision was due {staff.next_supervision_due ? formatDate(staff.next_supervision_due) : ""}. Please schedule immediately.
                  </p>
                </div>
              </div>
            )}
            {supervisions.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-[var(--cs-border)] p-10 text-center">
                <ClipboardList className="h-8 w-8 text-[var(--cs-text-gentle)] mx-auto mb-2" />
                <p className="text-sm text-[var(--cs-text-muted)]">No supervision records</p>
              </div>
            ) : (
              <div className="space-y-3">
                {supervisions.map((s) => {
                  const cfg = SUPERVISION_STATUS_CFG[s.status] ?? SUPERVISION_STATUS_CFG.scheduled;
                  return (
                    <div key={s.id} className="rounded-2xl border bg-white p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--cs-navy)] capitalize">{s.type.replace(/_/g, " ")} Supervision</span>
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.colour)}>{cfg.label}</span>
                          </div>
                          <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">
                            {formatDate(s.scheduled_date)}
                            {s.duration_minutes && ` · ${s.duration_minutes} mins`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {s.wellbeing_score !== null && (
                            <div className="text-center">
                              <div className={cn("text-lg font-bold tabular-nums", s.wellbeing_score >= 7 ? "text-emerald-600" : s.wellbeing_score >= 4 ? "text-amber-600" : "text-red-600")}>
                                {s.wellbeing_score}/10
                              </div>
                              <div className="text-[10px] text-[var(--cs-text-muted)]">Wellbeing</div>
                            </div>
                          )}
                          <button
                            onClick={() => router.push(`/supervision/${s.id}`)}
                            className="rounded-lg border border-[var(--cs-border)] bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-[var(--cs-text-secondary)] hover:bg-[var(--cs-surface)] transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </div>
                      {s.discussion_points && (
                        <p className="text-xs text-[var(--cs-text-secondary)] mt-2 leading-relaxed line-clamp-2">{s.discussion_points}</p>
                      )}
                      {s.actions_agreed.length > 0 && (
                        <div className="mt-2 text-[10px] text-[var(--cs-text-muted)]">
                          {s.actions_agreed.length} action{s.actions_agreed.length !== 1 ? "s" : ""} agreed
                          {" · "}
                          {s.actions_agreed.filter((a) => a.status === "completed").length} completed
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tasks tab ───────────────────────────────────────────────────── */}
        {tab === "tasks" && (
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-[var(--cs-border)] p-10 text-center">
                <CheckSquare className="h-8 w-8 text-[var(--cs-text-gentle)] mx-auto mb-2" />
                <p className="text-sm text-[var(--cs-text-muted)]">No active tasks assigned</p>
              </div>
            ) : (
              tasks.map((t: Task) => {
                const isOverdue = t.due_date && t.due_date < new Date().toISOString().slice(0, 10);
                return (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/tasks/${t.id}`)}
                    onKeyDown={(e) => e.key === "Enter" && router.push(`/tasks/${t.id}`)}
                    className="rounded-2xl border bg-white p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[var(--cs-navy)]">{t.title}</p>
                        {t.due_date && (
                          <p className={cn("text-xs mt-0.5", isOverdue ? "text-red-600 font-medium" : "text-[var(--cs-text-muted)]")}>
                            {isOverdue ? "Overdue · " : "Due "}{formatRelative(t.due_date)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={t.priority === "urgent" ? "destructive" : t.priority === "high" ? "warning" : "secondary"}
                          className="text-[9px] rounded-full capitalize"
                        >
                          {t.priority}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-[var(--cs-text-gentle)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Development tab ─────────────────────────────────────────────── */}
        {tab === "development" && (
          <div className="space-y-4">
            {staffTrainingNeeds.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-[var(--cs-border)] p-10 text-center">
                <Brain className="h-8 w-8 text-[var(--cs-text-gentle)] mx-auto mb-2" />
                <p className="text-sm text-[var(--cs-text-muted)]">No training needs identified for this staff member</p>
                <p className="text-xs text-[var(--cs-text-muted)] mt-1">
                  Training needs are identified from incidents, supervision, audits and RI challenges
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentNeeds.length > 0 && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">{urgentNeeds.length} urgent training need{urgentNeeds.length !== 1 ? "s" : ""} require action</p>
                      <p className="text-xs text-red-700 mt-0.5">These have been identified from governance and operational data.</p>
                    </div>
                  </div>
                )}
                {staffTrainingNeeds.map((n) => (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push("/learning/training-needs")}
                    onKeyDown={(e) => e.key === "Enter" && router.push("/learning/training-needs")}
                    className={cn(
                      "rounded-2xl border bg-white p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group",
                      n.priority === "urgent" ? "border-red-200" : n.priority === "high" ? "border-orange-200" : "border-[var(--cs-border-subtle)]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--cs-navy)]">{n.title}</p>
                        <p className="text-xs text-[var(--cs-text-muted)] mt-0.5 capitalize">{n.need_type.replace(/_/g, " ")} · Identified from {n.identified_by.replace(/_/g, " ")}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant={n.priority === "urgent" ? "destructive" : n.priority === "high" ? "warning" : "secondary"}
                          className="text-[9px] rounded-full capitalize"
                        >
                          {n.priority}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-[var(--cs-text-gentle)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    {n.description && (
                      <p className="text-xs text-[var(--cs-text-secondary)] mt-2 leading-relaxed line-clamp-2">{n.description}</p>
                    )}
                    {n.deadline && (
                      <p className="text-[10px] text-[var(--cs-text-muted)] mt-1.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />Deadline: {formatDate(n.deadline)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Cara development narrative */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />Cara Development Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[var(--cs-text-muted)] mb-3">
                  Cara can analyse this staff member&apos;s training record, supervision history and identified needs to generate a personalised development plan narrative.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 w-full"
                  onClick={() => { setShowAria(true); setTab("overview"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                >
                  <Sparkles className="h-3.5 w-3.5 text-[var(--cs-aria-gold)]" />
                  Generate Cara Development Summary
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Pathway tab ───────────────────────────────────────────────────── */}
        {tab === "pathway" && (() => {
          const DOMAIN_CONFIG: Array<{
            key: string;
            label: string;
            icon: React.ElementType;
            colour: string;
            bg: string;
            categories: string[];
          }> = [
            { key: "safeguarding", label: "Safeguarding", icon: ShieldAlert, colour: "text-red-600", bg: "bg-red-50", categories: ["safeguarding", "mandatory"] },
            { key: "health_safety", label: "Health & Safety", icon: HeartPulse, colour: "text-amber-600", bg: "bg-amber-50", categories: ["health_and_safety", "first_aid", "fire_safety", "food_hygiene"] },
            { key: "medication", label: "Medication", icon: FlaskConical, colour: "text-blue-600", bg: "bg-blue-50", categories: ["medication"] },
            { key: "behaviour", label: "Behaviour Support", icon: ShieldCheck, colour: "text-orange-600", bg: "bg-orange-50", categories: ["restraint", "mental_health", "trauma_informed"] },
            { key: "equality", label: "Equality & Rights", icon: Scale, colour: "text-[var(--cs-aria-gold)]", bg: "bg-[var(--cs-aria-gold-bg)]", categories: ["equality_diversity", "data_protection"] },
            { key: "professional", label: "Professional Development", icon: BookMarked, colour: "text-emerald-600", bg: "bg-emerald-50", categories: ["professional_development"] },
          ];

          const onProbation = staff.probation_end_date && new Date(staff.probation_end_date) > new Date();
          const probationComplete = staff.probation_end_date && new Date(staff.probation_end_date) <= new Date();
          const probationPct = onProbation && staff.probation_end_date
            ? Math.min(100, Math.round(
                (new Date().getTime() - new Date(staff.start_date).getTime()) /
                (new Date(staff.probation_end_date).getTime() - new Date(staff.start_date).getTime()) * 100
              ))
            : probationComplete ? 100 : null;

          const completedSupervisionsList = supervisions.filter((s) => s.status === "completed");
          const supervisionFrequency = completedSupervisionsList.length >= 2
            ? Math.round(
                (new Date(completedSupervisionsList[0].scheduled_date).getTime() -
                  new Date(completedSupervisionsList[completedSupervisionsList.length - 1].scheduled_date).getTime()) /
                (completedSupervisionsList.length - 1) / (1000 * 60 * 60 * 24 * 7)
              )
            : null;

          return (
            <div className="space-y-6">

              {/* Competency Domain Rings */}
              <div>
                <h3 className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Map className="h-3.5 w-3.5" />Competency Framework
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {DOMAIN_CONFIG.map((domain) => {
                    const domainRecords = training.filter((t) => domain.categories.includes(t.category));
                    const total = domainRecords.length;
                    const compliant = domainRecords.filter((t) => t.status === "compliant").length;
                    const expired = domainRecords.filter((t) => t.status === "expired").length;
                    const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;
                    const radius = 28;
                    const circ = 2 * Math.PI * radius;
                    const dash = (pct / 100) * circ;
                    const ringColour = pct === 100 ? "stroke-emerald-500" : pct >= 60 ? "stroke-amber-400" : expired > 0 ? "stroke-red-500" : "stroke-slate-300";

                    return (
                      <div
                        key={domain.key}
                        className={`rounded-2xl border border-[var(--cs-border-subtle)] p-4 flex flex-col items-center gap-2 ${domain.bg}`}
                      >
                        <div className="relative w-16 h-16">
                          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
                            <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-white/60" />
                            <circle
                              cx="36" cy="36" r={radius} fill="none" strokeWidth="6" strokeLinecap="round"
                              strokeDasharray={`${dash} ${circ}`}
                              className={ringColour}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <domain.icon className={`h-5 w-5 ${domain.colour}`} />
                          </div>
                        </div>
                        <div className="text-center">
                          <div className={`text-lg font-bold tabular-nums ${domain.colour}`}>{pct}%</div>
                          <div className="text-[10px] font-medium text-[var(--cs-text-secondary)] leading-tight">{domain.label}</div>
                          {total > 0 ? (
                            <div className="text-[9px] text-[var(--cs-text-muted)] mt-0.5">{compliant}/{total} compliant</div>
                          ) : (
                            <div className="text-[9px] text-[var(--cs-text-muted)] mt-0.5">No records</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mandatory Training Checklist */}
              <div>
                <h3 className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />Mandatory Training Checklist
                </h3>
                {training.filter((t) => t.is_mandatory).length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-[var(--cs-border)] p-8 text-center">
                    <GraduationCap className="h-7 w-7 text-[var(--cs-text-gentle)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--cs-text-muted)]">No mandatory training records</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border bg-white overflow-hidden divide-y divide-slate-50">
                    {training.filter((t) => t.is_mandatory).map((t) => {
                      const isExpired  = t.status === "expired";
                      const isExpiring = t.status === "expiring_soon";
                      const isOk       = t.status === "compliant";
                      return (
                        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 ${isExpired ? "bg-red-50/50" : isExpiring ? "bg-amber-50/50" : ""}`}>
                          <div className="shrink-0">
                            {isOk
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              : isExpiring
                                ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                                : <XCircle className="h-4 w-4 text-red-500" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-[var(--cs-navy)] truncate">{t.course_name}</p>
                            <p className="text-[10px] text-[var(--cs-text-muted)] capitalize">{t.category.replace(/_/g, " ")}{t.provider ? ` · ${t.provider}` : ""}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            {t.expiry_date && (
                              <p className={`text-[10px] font-medium ${isExpired ? "text-red-600" : isExpiring ? "text-amber-600" : "text-[var(--cs-text-muted)]"}`}>
                                {isExpired ? "Expired" : isExpiring ? "Expiring" : "Expires"} {formatDate(t.expiry_date)}
                              </p>
                            )}
                            {t.completed_date && !t.expiry_date && (
                              <p className="text-[10px] text-[var(--cs-text-muted)]">Completed {formatDate(t.completed_date)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Two-col: Probation + Supervision cadence */}
              <div className="grid gap-4 sm:grid-cols-2">

                {/* Probation timeline */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />Probation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {staff.probation_end_date === null ? (
                      <div className="flex items-center gap-2 text-xs text-[var(--cs-text-muted)]">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        No probation period recorded
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--cs-text-muted)]">Started</span>
                          <span className="font-medium text-[var(--cs-navy)]">{formatDate(staff.start_date)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--cs-text-muted)]">Ends</span>
                          <span className={`font-medium ${onProbation ? "text-amber-700" : "text-emerald-700"}`}>
                            {formatDate(staff.probation_end_date)}
                          </span>
                        </div>
                        {probationPct !== null && (
                          <div className="space-y-1.5">
                            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${probationComplete ? "bg-emerald-500" : "bg-amber-400"}`}
                                style={{ width: `${probationPct}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[var(--cs-text-muted)]">
                              <span>{probationPct}% complete</span>
                              {onProbation && (
                                <span className="text-amber-600 font-medium">In probation</span>
                              )}
                              {probationComplete && (
                                <span className="text-emerald-600 font-medium flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />Passed
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Supervision cadence */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5" />Supervision Cadence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--cs-text-muted)]">Total supervisions</span>
                      <span className="font-medium text-[var(--cs-navy)]">{completedSupervisionsList.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--cs-text-muted)]">Last supervision</span>
                      <span className={`font-medium ${staff.supervision_overdue ? "text-red-600" : "text-[var(--cs-navy)]"}`}>
                        {completedSupervisionsList[0] ? formatRelative(completedSupervisionsList[0].scheduled_date) : "None"}
                      </span>
                    </div>
                    {supervisionFrequency !== null && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--cs-text-muted)]">Avg interval</span>
                        <span className={`font-medium ${supervisionFrequency > 8 ? "text-red-600" : supervisionFrequency > 6 ? "text-amber-600" : "text-emerald-700"}`}>
                          Every {supervisionFrequency} weeks
                        </span>
                      </div>
                    )}
                    {/* Frequency meter */}
                    <div className="rounded-xl bg-slate-50 border border-[var(--cs-border-subtle)] p-3 space-y-1.5">
                      <div className="flex justify-between text-[10px] text-[var(--cs-text-muted)]">
                        <span>Target: every 6 weeks</span>
                        <span className={`font-medium ${staff.supervision_overdue ? "text-red-500" : "text-emerald-600"}`}>
                          {staff.supervision_overdue ? "Overdue" : "On track"}
                        </span>
                      </div>
                      {completedSupervisionsList.slice(0, 6).map((s, i) => (
                        <div key={s.id} className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full shrink-0 ${s.status === "completed" ? "bg-emerald-500" : "bg-slate-300"}`} />
                          <div className="text-[10px] text-[var(--cs-text-muted)] flex-1">{formatDate(s.scheduled_date)}</div>
                          {s.wellbeing_score !== null && (
                            <div className={`text-[10px] font-semibold tabular-nums ${s.wellbeing_score >= 7 ? "text-emerald-600" : s.wellbeing_score >= 4 ? "text-amber-600" : "text-red-500"}`}>
                              {s.wellbeing_score}/10
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          );
        })()}

        {/* ── Documents tab ─────────────────────────────────────────────────── */}
        {tab === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--cs-navy)]">Staff Documents</h3>
                <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">DBS certificates, contracts, references, training records and more</p>
              </div>
              <SmartUploadButton
                variant="inline"
                label="Upload Document"
                linkedStaffId={id}
                uploadContext={`${staff.full_name} — staff document upload`}
              />
            </div>

            {linkedDocs.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-[var(--cs-border)] p-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--cs-aria-gold-bg)] mx-auto mb-3">
                  <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" />
                </div>
                <p className="text-sm font-semibold text-[var(--cs-text-secondary)] mb-1">No documents linked</p>
                <p className="text-xs text-[var(--cs-text-muted)] max-w-xs mx-auto mb-4">
                  Upload DBS certificates, contracts, qualifications, right-to-work documents — Cara will classify and extract intelligence.
                </p>
                <SmartUploadButton
                  variant="button"
                  label="Upload First Document"
                  linkedStaffId={id}
                  uploadContext={`${staff.full_name} — first document`}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {linkedDocs.map((doc) => {
                  const riskBorder: Record<string, string> = {
                    low: "border-l-emerald-400", medium: "border-l-amber-400",
                    high: "border-l-orange-500", critical: "border-l-red-600",
                  };
                  const statusBadge: Record<string, string> = {
                    review: "bg-amber-100 text-amber-700", approved: "bg-blue-100 text-blue-700",
                    actioned: "bg-emerald-100 text-emerald-700", rejected: "bg-red-100 text-red-700",
                    analysing: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]", pending: "bg-slate-100 text-[var(--cs-text-secondary)]",
                    archived: "bg-slate-100 text-[var(--cs-text-muted)]",
                  };
                  return (
                    <div key={doc.id} className={`rounded-2xl border bg-white p-4 border-l-4 ${riskBorder[doc.ai_risk_level ?? "low"] ?? "border-l-slate-200"}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-aria-gold-bg)]">
                          <FileText className="h-4 w-4 text-[var(--cs-aria-gold)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-[var(--cs-navy)] truncate">{doc.original_file_name}</span>
                            {doc.document_status && (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusBadge[doc.document_status] ?? statusBadge.pending}`}>
                                {doc.document_status.replace(/_/g, " ")}
                              </span>
                            )}
                            {doc.ai_result?.document_category_label && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-[var(--cs-text-secondary)]">
                                {doc.ai_result.document_category_label}
                              </span>
                            )}
                          </div>
                          {doc.ai_result?.ai_summary && (
                            <p className="text-xs text-[var(--cs-text-secondary)] leading-relaxed line-clamp-2">{doc.ai_result.ai_summary}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--cs-text-muted)]">
                            <span>{formatDate(doc.uploaded_at)}</span>
                            {doc.tasks_created.length > 0 && (
                              <span className="text-[var(--cs-aria-gold)] font-medium">{doc.tasks_created.length} task{doc.tasks_created.length !== 1 ? "s" : ""} created</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      <CareEventsPanel
        title="Care Events Logged by This Staff Member"
        days={30}
        defaultCollapsed
        className="mt-6"
      />
      </div>
    </PageShell>
  );
}
