"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SUPERVISION RECORD DETAIL
// Full view of a single supervision record: discussion, actions, signatures,
// wellbeing, ARIA analysis. Print-ready for Ofsted inspection.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaUsageBadge } from "@/components/aria/aria-usage-badge";
import { AriaContextLinker } from "@/components/aria/aria-context-linker";
import { AriaOversightQuality } from "@/components/aria/aria-oversight-quality";
import {
  useSupervision, useUpdateSupervision,
} from "@/hooks/use-supervision";
import { useCreateTrainingNeed } from "@/hooks/use-ri-learning";
import { useAuthContext } from "@/contexts/auth-context";
import { getStaffName } from "@/lib/seed-data";
import { SUPERVISION_TYPE_LABELS } from "@/lib/constants";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import type { Supervision, SupervisionAction } from "@/types";
import { PrintButton } from "@/components/common/print-button";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { useDocumentIntelligence } from "@/hooks/use-doc-intelligence";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { DOCUMENT_CATEGORY_LABELS } from "@/types/documents";
import {
  ArrowLeft, Clock, CheckCircle2, Circle, AlertTriangle,
  Heart, PenLine, User, Users, Calendar, Loader2,
  ClipboardList, Shield, Sparkles, FileText, Library,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_COLOURS: Record<string, string> = {
  formal:              "bg-blue-100 text-blue-700 border-blue-200",
  informal:            "bg-slate-100 text-[var(--cs-text-secondary)] border-[var(--cs-border)]",
  group:               "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] border-[var(--cs-aria-gold-soft)]",
  reflective_practice: "bg-teal-100 text-teal-700 border-teal-200",
  probation_review:    "bg-amber-100 text-amber-700 border-amber-200",
};

const STATUS_COLOURS: Record<string, string> = {
  completed:   "bg-emerald-100 text-emerald-700",
  scheduled:   "bg-blue-100 text-blue-700",
  cancelled:   "bg-red-100 text-red-700",
  rescheduled: "bg-amber-100 text-amber-700",
};

function WellbeingGauge({ score }: { score: number }) {
  const colour =
    score >= 8 ? "text-emerald-600" : score >= 6 ? "text-amber-600" : "text-red-600";
  const label =
    score >= 8 ? "Good" : score >= 6 ? "Moderate" : "Low";
  const barPct = (score / 10) * 100;
  const barColour =
    score >= 8 ? "bg-emerald-500" : score >= 6 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--cs-text-muted)]">Wellbeing</span>
        <span className={cn("text-lg font-bold tabular-nums", colour)}>
          {score}/10
          <span className="text-xs font-normal ml-1">— {label}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn("h-2 rounded-full transition-all", barColour)} style={{ width: `${barPct}%` }} />
      </div>
    </div>
  );
}

function ActionRow({
  action,
  onToggle,
  toggling,
}: {
  action: SupervisionAction;
  onToggle: (action: SupervisionAction) => void;
  toggling: boolean;
}) {
  const isComplete = action.status === "completed";
  const isOverdue =
    !isComplete && action.due_date && new Date(action.due_date) < new Date();

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 transition-colors",
        isComplete
          ? "border-emerald-100 bg-emerald-50/50"
          : isOverdue
          ? "border-red-100 bg-red-50/50"
          : "border-[var(--cs-border-subtle)] bg-white"
      )}
    >
      <button
        className="mt-0.5 shrink-0"
        onClick={() => onToggle(action)}
        disabled={toggling}
        title={isComplete ? "Mark pending" : "Mark complete"}
      >
        {toggling ? (
          <Loader2 className="h-4 w-4 animate-spin text-[var(--cs-text-muted)]" />
        ) : isComplete ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <Circle className={cn("h-4 w-4", isOverdue ? "text-red-500" : "text-[var(--cs-text-muted)]")} />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", isComplete && "line-through text-[var(--cs-text-muted)]")}>
          {action.description}
        </p>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--cs-text-muted)]">
          <span>{getStaffName(action.owner)}</span>
          {action.due_date && (
            <span className={cn("font-medium", isOverdue && !isComplete ? "text-red-600" : "text-[var(--cs-text-muted)]")}>
              {isOverdue && !isComplete ? "OVERDUE — " : ""}
              {formatDate(action.due_date)}
            </span>
          )}
          {isComplete && action.completed_at && (
            <span className="text-emerald-600">Completed {formatRelative(action.completed_at)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SupervisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const { data: sup, isLoading, isError } = useSupervision(id);
  const updateMutation = useUpdateSupervision();
  const createNeed = useCreateTrainingNeed();
  const docsQuery = useDocumentIntelligence();

  const [showAria, setShowAria] = useState(false);
  const [togglingAction, setTogglingAction] = useState<string | null>(null);
  const [needCreated, setNeedCreated] = useState(false);
  const [completing, setCompleting] = useState(false);

  async function toggleAction(action: SupervisionAction) {
    if (!sup) return;
    setTogglingAction(action.id);
    const newStatus = action.status === "completed" ? "pending" : "completed";
    const updated = sup.actions_agreed.map((a) =>
      a.id === action.id
        ? { ...a, status: newStatus as "pending" | "completed", completed_at: newStatus === "completed" ? new Date().toISOString() : null }
        : a
    );
    try {
      await updateMutation.mutateAsync({ id: sup.id, actions_agreed: updated });
    } finally {
      setTogglingAction(null);
    }
  }

  async function handleComplete() {
    if (!sup) return;
    setCompleting(true);
    try {
      await updateMutation.mutateAsync({ id: sup.id, action: "complete" });
    } finally {
      setCompleting(false);
    }
  }

  async function handleCreateTrainingNeed() {
    if (!sup) return;
    await createNeed.mutateAsync({
      home_id: homeId,
      affected_staff: [sup.staff_id],
      identified_by: "supervision",
      need_type: "practice",
      title: `Training need from supervision — ${getStaffName(sup.staff_id)}`,
      description: `Identified during supervision on ${formatDate(sup.actual_date ?? sup.scheduled_date)}: ${sup.discussion_points.slice(0, 200)}`,
      priority: "medium",
      status: "identified",
      aria_evidence: `Source supervision record: ${sup.id}`,
      created_by: currentUser?.id ?? "staff_darren",
    });
    setNeedCreated(true);
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <PageShell title="Supervision Record" subtitle="Loading…">
        <div className="space-y-5">
          <Skeleton className="h-32" />
          <Skeleton className="h-20" />
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      </PageShell>
    );
  }

  if (isError || !sup) {
    return (
      <PageShell title="Supervision Record" subtitle="Not found">
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 inline mr-2" />
          Supervision record not found or could not be loaded.
        </div>
      </PageShell>
    );
  }

  const staffName = getStaffName(sup.staff_id);
  const supervisorName = getStaffName(sup.supervisor_id);
  const linkedDocs = (docsQuery.data?.data ?? []).filter(
    (d) => d.linked_staff_id === sup.staff_id,
  );
  const typeLabel = SUPERVISION_TYPE_LABELS[sup.type] ?? sup.type;
  const date = sup.actual_date ?? sup.scheduled_date;
  const pendingActions = sup.actions_agreed.filter((a) => a.status === "pending");
  const completedActions = sup.actions_agreed.filter((a) => a.status === "completed");
  const overdueActions = pendingActions.filter(
    (a) => a.due_date && new Date(a.due_date) < new Date()
  );

  const ariaSourceContent = [
    `Supervision type: ${typeLabel}`,
    `Staff: ${staffName}`,
    `Supervisor: ${supervisorName}`,
    `Date: ${formatDate(date)}`,
    `Duration: ${sup.duration_minutes ?? "—"} minutes`,
    `Status: ${sup.status}`,
    sup.wellbeing_score != null ? `Wellbeing score: ${sup.wellbeing_score}/10` : "",
    "",
    "Discussion points:",
    sup.discussion_points || "No discussion points recorded.",
    "",
    "Actions agreed:",
    ...sup.actions_agreed.map(
      (a) => `- ${a.description} (${a.owner} by ${formatDate(a.due_date)}) — ${a.status}`
    ),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <PageShell
      title="Supervision Record"
      subtitle={`${staffName} · ${typeLabel} · ${formatDate(date)}`}
      ariaContext={{ pageTitle: "Recent Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Supervision Record" subtitle="Oak House — Supervision Session" targetId="supervision-detail-content" />
          <SmartUploadButton variant="icon" linkedStaffId={sup.staff_id} uploadContext={`Supervision — ${staffName} supporting evidence or certificate upload`} />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[var(--cs-text-secondary)]"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[var(--cs-aria-gold)] border-[var(--cs-aria-gold-soft)] hover:bg-[var(--cs-aria-gold-bg)]"
            onClick={() => setShowAria((p) => !p)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            ARIA
          </Button>
        </div>
      }
    >
      <div id="supervision-detail-content" className="space-y-5 animate-fade-in">

        {/* Two-column layout */}
        <div className="grid gap-5 lg:grid-cols-3">

          {/* ── Main column (2/3) ────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Header card */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar name={staffName} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xl font-bold text-[var(--cs-navy)]">{staffName}</span>
                      <Badge className={cn("rounded-full text-[10px] border", TYPE_COLOURS[sup.type])}>
                        {typeLabel}
                      </Badge>
                      <Badge className={cn("rounded-full text-[10px]", STATUS_COLOURS[sup.status] ?? "bg-slate-100 text-[var(--cs-text-secondary)]")}>
                        {sup.status.charAt(0).toUpperCase() + sup.status.slice(1)}
                      </Badge>
                      {sup.aria_assist_used && (
                        <AriaUsageBadge
                          ariaAssisted
                          sourceTable="supervisions"
                          recordId={sup.id}
                          size="sm"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)] flex-wrap">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span>Supervised by {supervisorName}</span>
                      <span className="text-[var(--cs-text-gentle)]">·</span>
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatDate(date)}</span>
                      {sup.duration_minutes && (
                        <>
                          <span className="text-[var(--cs-text-gentle)]">·</span>
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>{sup.duration_minutes} min</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Wellbeing */}
                {sup.wellbeing_score != null && (
                  <div className="mt-4 pt-4 border-t border-[var(--cs-border-subtle)]">
                    <WellbeingGauge score={sup.wellbeing_score} />
                  </div>
                )}

                {/* Signatures */}
                <div className="mt-4 pt-4 border-t border-[var(--cs-border-subtle)] grid grid-cols-2 gap-3">
                  <div className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
                    sup.staff_signature ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[var(--cs-border)] bg-slate-50 text-[var(--cs-text-muted)]"
                  )}>
                    <PenLine className="h-3.5 w-3.5 shrink-0" />
                    Staff signature: {sup.staff_signature ? "Signed" : "Pending"}
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
                    sup.supervisor_signature ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[var(--cs-border)] bg-slate-50 text-[var(--cs-text-muted)]"
                  )}>
                    <Shield className="h-3.5 w-3.5 shrink-0" />
                    Supervisor: {sup.supervisor_signature ? "Signed" : "Pending"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Discussion points */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Discussion Points
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {sup.discussion_points ? (
                  <div className="rounded-xl bg-slate-50 border border-[var(--cs-border-subtle)] p-4 text-sm text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-wrap">
                    {sup.discussion_points}
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 border border-[var(--cs-border-subtle)] p-4 text-sm text-[var(--cs-text-muted)] italic">
                    No discussion points recorded for this supervision.
                  </div>
                )}

                {/* ARIA Oversight Quality Check */}
                {sup.discussion_points && (
                  <AriaOversightQuality
                    oversightText={sup.discussion_points}
                    recordType="general"
                    recordReference={`Supervision — ${formatDate(sup.actual_date ?? sup.scheduled_date)}`}
                    className="mt-3"
                  />
                )}
              </CardContent>
            </Card>

            {/* Actions agreed */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-[var(--cs-aria-gold)]" />
                  Actions Agreed
                  {sup.actions_agreed.length > 0 && (
                    <span className="ml-auto text-xs font-normal text-[var(--cs-text-muted)]">
                      {completedActions.length}/{sup.actions_agreed.length} complete
                      {overdueActions.length > 0 && (
                        <span className="ml-2 text-red-600 font-semibold">
                          · {overdueActions.length} overdue
                        </span>
                      )}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {sup.actions_agreed.length === 0 ? (
                  <p className="text-sm text-[var(--cs-text-muted)] italic py-2">No actions were agreed at this supervision.</p>
                ) : (
                  sup.actions_agreed.map((action) => (
                    <ActionRow
                      key={action.id}
                      action={action}
                      onToggle={toggleAction}
                      toggling={togglingAction === action.id}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* ARIA panel */}
            {showAria && (
              <div className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={() => setShowAria(false)}
                    className="rounded-full p-1 bg-white shadow border border-[var(--cs-border)] text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <AriaContextLinker sourceTable="supervisions" recordId={sup.id} className="mb-3" />
                <AriaPanel
                  mode="oversee"
                  pageContext="Supervision Record — reflective supervision session notes, practice standards, caseload review, staff wellbeing, development areas, actions and accountability"
                  recordType="supervision"
                  sourceContent={ariaSourceContent}
                  userRole="manager"
                  defaultStyle="management_oversight"
                  linkedRecords={`Staff: ${staffName} | Supervisor: ${supervisorName}`}
                />
              </div>
            )}
          </div>

          {/* ── Right panel (1/3) ────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Total Actions",
                  value: sup.actions_agreed.length,
                  colour: "text-[var(--cs-navy)]",
                  bg: "bg-slate-50",
                },
                {
                  label: "Completed",
                  value: completedActions.length,
                  colour: "text-emerald-700",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Pending",
                  value: pendingActions.length,
                  colour: pendingActions.length > 0 ? "text-amber-700" : "text-[var(--cs-text-muted)]",
                  bg: pendingActions.length > 0 ? "bg-amber-50" : "bg-slate-50",
                },
                {
                  label: "Overdue",
                  value: overdueActions.length,
                  colour: overdueActions.length > 0 ? "text-red-700" : "text-[var(--cs-text-muted)]",
                  bg: overdueActions.length > 0 ? "bg-red-50" : "bg-slate-50",
                },
              ].map((stat) => (
                <div key={stat.label} className={cn("rounded-xl p-3 text-center", stat.bg)}>
                  <div className={cn("text-2xl font-bold tabular-nums", stat.colour)}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-[var(--cs-text-muted)] leading-tight mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Record metadata */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Record Info</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2.5 text-xs text-[var(--cs-text-secondary)]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--cs-text-muted)]" />
                  <span>Scheduled: {formatDate(sup.scheduled_date)}</span>
                </div>
                {sup.actual_date && sup.actual_date !== sup.scheduled_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--cs-text-muted)]" />
                    <span>Held: {formatDate(sup.actual_date)}</span>
                  </div>
                )}
                {sup.next_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                    <span className="text-blue-700 font-medium">Next: {formatDate(sup.next_date)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 shrink-0 text-[var(--cs-text-muted)]" />
                  <span>Created by {getStaffName(sup.created_by)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--cs-text-muted)]" />
                  <span>Updated {formatRelative(sup.updated_at)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Wellbeing context card */}
            {sup.wellbeing_score != null && (
              <Card className={cn(
                "border",
                sup.wellbeing_score >= 8
                  ? "border-emerald-100 bg-emerald-50/50"
                  : sup.wellbeing_score >= 6
                  ? "border-amber-100 bg-amber-50/50"
                  : "border-red-100 bg-red-50/50"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className={cn(
                      "h-4 w-4",
                      sup.wellbeing_score >= 8
                        ? "text-emerald-600"
                        : sup.wellbeing_score >= 6
                        ? "text-amber-600"
                        : "text-red-600"
                    )} />
                    <span className="text-xs font-semibold text-[var(--cs-text-secondary)]">Wellbeing at {formatDate(date)}</span>
                  </div>
                  <div className="text-3xl font-bold tabular-nums text-[var(--cs-navy)]">{sup.wellbeing_score}/10</div>
                  <p className="text-[11px] text-[var(--cs-text-muted)] mt-1.5 leading-relaxed">
                    {sup.wellbeing_score >= 8
                      ? "Staff wellbeing reported as good. Continue supportive supervision."
                      : sup.wellbeing_score >= 6
                      ? "Moderate wellbeing — monitor and revisit at next supervision."
                      : "Wellbeing concern raised — consider early check-in before next scheduled supervision."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick actions */}
            <div className="space-y-2">
              {sup.status === "scheduled" && (
                <Button
                  className="w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="sm"
                  onClick={handleComplete}
                  disabled={completing || updateMutation.isPending}
                >
                  {completing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Mark as Completed
                </Button>
              )}

              {sup.status === "completed" && sup.discussion_points && (
                needCreated ? (
                  <div className="flex items-center gap-2 rounded-lg bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] px-3 py-2 text-xs text-[var(--cs-aria-gold)]">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Training need created
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-[var(--cs-aria-gold)] border-[var(--cs-aria-gold-soft)] hover:bg-[var(--cs-aria-gold-bg)]"
                    onClick={handleCreateTrainingNeed}
                    disabled={createNeed.isPending}
                  >
                    {createNeed.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Create Training Need
                  </Button>
                )
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5"
                onClick={() => router.push("/supervision")}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All Supervisions
              </Button>
            </div>

            {/* Linked Documents */}
            {linkedDocs.length > 0 && (
              <div className="rounded-2xl border border-[var(--cs-aria-gold-soft)] bg-[var(--cs-aria-gold-bg)]/40 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Library className="h-4 w-4 text-[var(--cs-aria-gold)]" />
                  <span className="text-sm font-semibold text-[var(--cs-navy)]">Staff Evidence Documents</span>
                  <span className="ml-auto text-xs text-[var(--cs-aria-gold)]">{linkedDocs.length} file{linkedDocs.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-1.5">
                  {linkedDocs.map((doc) => (
                    <div key={doc.id} className={cn(
                      "flex items-start gap-2.5 rounded-xl border px-3 py-2",
                      doc.ai_risk_level === "high" || doc.ai_risk_level === "critical"
                        ? "border-red-200 bg-red-50/40"
                        : "border-[var(--cs-border-subtle)] bg-white",
                    )}>
                      <FileText className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--cs-navy)] truncate">{doc.original_file_name}</p>
                        <p className="text-[10px] text-[var(--cs-text-muted)]">
                          {doc.document_category ? DOCUMENT_CATEGORY_LABELS[doc.document_category] : "Uncategorised"}
                          {doc.document_status ? ` · ${doc.document_status.replace(/_/g, " ")}` : ""}
                        </p>
                        {doc.ai_summary && <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5 line-clamp-2">{doc.ai_summary}</p>}
                      </div>
                      {doc.ai_risk_level && doc.ai_risk_level !== "low" && (
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0",
                          doc.ai_risk_level === "critical" ? "bg-red-100 text-red-700"
                          : doc.ai_risk_level === "high" ? "bg-orange-100 text-orange-700"
                          : "bg-amber-100 text-amber-700",
                        )}>
                          {doc.ai_risk_level}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance note */}
            <div className="rounded-xl bg-slate-50 border border-[var(--cs-border-subtle)] px-4 py-3">
              <div className="flex items-start gap-2">
                <Shield className="h-3.5 w-3.5 text-[var(--cs-text-muted)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide mb-1">
                    Regulation 22 — Supervision
                  </p>
                  <p className="text-[10px] text-[var(--cs-text-muted)] leading-relaxed">
                    All staff in regulated children's homes must receive formal
                    supervision at least every four to six weeks. This record
                    is a legal document and may be inspected by Ofsted (ILACS).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Recent Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
