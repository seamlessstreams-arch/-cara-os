"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CARE EVENT DETAIL
// Full view of a single care event: details, routing, linked records, audit
// ══════════════════════════════════════════════════════════════════════════════

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Shield,
  BookOpen,
  FileText,
  FolderOpen,
  Loader2,
  Lock,
  RotateCcw,
  Zap,
  User,
  Calendar,
  ClipboardList,
  AlertTriangle,
  ExternalLink,
  PlayCircle,
  RefreshCw,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import {
  useCareEvent,
  useRetryCareEventRouting,
  useVerifyCareEvent,
  useReturnCareEvent,
  useLockCareEvent,
  useAmendCareEvent,
  useCareEventJobs,
  useRunCareEventJobs,
} from "@/hooks/use-care-events";
import { useCareEventAuditLog } from "@/hooks/use-daily-summaries";
import { toast } from "sonner";
import type { CareEventRoute, CareEventAuditLog, RouteStatus, CareEventJob, JobStatus } from "@/types/care-events";

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_CLR: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  routing: "bg-indigo-100 text-indigo-700 border-indigo-200",
  routed: "bg-cyan-100 text-cyan-700 border-cyan-200",
  manager_review_required: "bg-amber-100 text-amber-700 border-amber-200",
  returned: "bg-red-100 text-red-700 border-red-200",
  verified: "bg-emerald-100 text-emerald-700 border-emerald-200",
  locked: "bg-slate-200 text-slate-700 border-slate-300",
  routing_failed: "bg-red-100 text-red-800 border-red-300",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  routing: "Routing…",
  routed: "Routed",
  manager_review_required: "Manager review required",
  returned: "Returned",
  verified: "Verified",
  locked: "Locked",
  routing_failed: "Routing failed",
};

const ROUTE_STATUS_CLR: Record<RouteStatus, string> = {
  pending: "bg-slate-100 text-slate-500",
  processing: "bg-indigo-100 text-indigo-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
  skipped: "bg-slate-100 text-slate-400",
  retry_required: "bg-amber-100 text-amber-700",
};

const ROUTE_LABELS: Record<string, string> = {
  daily_log: "Daily running log",
  child_daily_summary: "Child daily summary",
  incident: "Incident record",
  missing_episode: "Missing episode record",
  physical_intervention: "Physical intervention record",
  health_record: "Health record",
  medication_record: "Medication record",
  education_record: "Education record",
  family_contact_record: "Family contact record",
  professional_contact_record: "Professional contact record",
  complaint_record: "Complaint record",
  safeguarding_record: "Safeguarding record",
  risk_assessment_task: "Risk assessment review task",
  behaviour_plan_task: "Behaviour plan review task",
  followup_task: "Follow-up task",
  management_oversight: "Management oversight queue",
  reg40_triage: "Regulation 40 triage queue",
  reg44_evidence: "Regulation 44 evidence",
  reg45_evidence: "Regulation 45 evidence bank",
  annex_a_evidence: "Annex A evidence bank",
  filing_cabinet: "Filing cabinet",
  saved_time: "Saved-time tracker",
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  care_event_created: "Event created",
  care_event_submitted: "Event submitted",
  care_event_routed: "Routing completed",
  care_event_route_failed: "Route failed",
  care_event_route_retried: "Route retried",
  care_event_verified: "Event verified",
  care_event_returned: "Event returned",
  care_event_amended: "Event amended",
  care_event_locked: "Event locked",
  evidence_prompt_completed: "Evidence prompt completed",
  manager_review_completed: "Manager review completed",
  reg45_evidence_suggested: "Reg 45 evidence suggested",
  reg45_evidence_accepted: "Reg 45 evidence accepted",
  reg45_evidence_rejected: "Reg 45 evidence rejected",
  annex_a_evidence_suggested: "Annex A evidence suggested",
  annex_a_snapshot_generated: "Annex A snapshot generated",
  export_generated: "Export generated",
  permission_denied: "Permission denied",
  validation_failed: "Validation failed",
};

// ── Linked record navigation ───────────────────────────────────────────────────

const RECORD_TABLE_TO_PATH: Record<string, string> = {
  incidents:                "/incidents",
  missingEpisodes:          "/missing-from-care",
  restraints:               "/restraint-log",
  tasks:                    "/tasks",
  educationRecords:         "/education",
  healthRecordEntries:      "/health-records",
  filing_cabinet:           "/filing-cabinet",
  managementOversightItems: "/management-oversight",
  reg40Queue:               "/regulation-40",
  reg45EvidenceItems:       "/regulation-45",
  annexAEvidence:           "/annex-a",
  dailyLogEntries:          "/daily-log",
  chronology:               "/daily-log",
  childDailySummaries:      "/child-daily-summaries",
};

// ── Route status icon ──────────────────────────────────────────────────────────

function RouteStatusIcon({ status }: { status: RouteStatus }) {
  if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  if (status === "failed" || status === "retry_required") return <XCircle className="w-4 h-4 text-red-500" />;
  if (status === "processing") return <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />;
  if (status === "skipped") return <span className="w-4 h-4 text-slate-300 text-lg leading-none">–</span>;
  return <Clock className="w-4 h-4 text-slate-400" />;
}

// ── Compliance flag chips ──────────────────────────────────────────────────────

function ComplianceFlags({
  event,
}: {
  event: {
    requires_manager_review: boolean;
    requires_reg40_triage: boolean;
    contributes_to_reg45: boolean;
    contributes_to_annex_a: boolean;
    is_safeguarding: boolean;
    is_significant: boolean;
  };
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {event.requires_manager_review && (
        <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded px-2 py-1">
          <AlertCircle className="w-3 h-3" /> Manager review
        </span>
      )}
      {event.requires_reg40_triage && (
        <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded px-2 py-1">
          <Shield className="w-3 h-3" /> Reg 40 triage
        </span>
      )}
      {event.contributes_to_reg45 && (
        <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-2 py-1">
          <BookOpen className="w-3 h-3" /> Reg 45 evidence
        </span>
      )}
      {event.contributes_to_annex_a && (
        <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded px-2 py-1">
          <FileText className="w-3 h-3" /> Annex A
        </span>
      )}
      {event.is_safeguarding && (
        <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-800 border border-red-300 rounded px-2 py-1">
          <Shield className="w-3 h-3" /> Safeguarding
        </span>
      )}
      {event.is_significant && (
        <span className="inline-flex items-center gap-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded px-2 py-1">
          <AlertTriangle className="w-3 h-3" /> Significant
        </span>
      )}
    </div>
  );
}

// ── Routing tab ────────────────────────────────────────────────────────────────

function RoutingTab({
  routes,
  careEventId,
  status,
}: {
  routes: CareEventRoute[];
  careEventId: string;
  status: string;
}) {
  const retryMutation = useRetryCareEventRouting();

  const failedRoutes = routes.filter(
    (r) => r.status === "failed" || r.status === "retry_required"
  );

  const handleRetry = () => {
    retryMutation.mutate(
      careEventId,
      {
        onSuccess: () => toast.success("Routing retry initiated"),
        onError: () => toast.error("Failed to initiate retry"),
      }
    );
  };

  return (
    <div className="space-y-4">
      {failedRoutes.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                {failedRoutes.length} route{failedRoutes.length !== 1 ? "s" : ""} failed
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                The original event is preserved. Retry to attempt failed routes again.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100 shrink-0"
            onClick={handleRetry}
            disabled={retryMutation.isPending}
          >
            {retryMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
            )}
            Retry
          </Button>
        </div>
      )}

      {routes.length === 0 ? (
        <div className="text-sm text-slate-500 text-center py-8">
          No routing records yet — submit the event to trigger routing.
        </div>
      ) : (
        <div className="space-y-2">
          {routes.map((route) => (
            <div
              key={route.id}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg border",
                route.status === "completed" && "border-emerald-100 bg-emerald-50/30",
                route.status === "failed" && "border-red-100 bg-red-50/30",
                route.status === "retry_required" && "border-amber-100 bg-amber-50/30",
                route.status === "skipped" && "border-slate-100 bg-slate-50/30 opacity-60",
                route.status === "pending" && "border-slate-200 bg-white",
                route.status === "processing" && "border-indigo-100 bg-indigo-50/30"
              )}
            >
              <div className="flex items-center gap-2">
                <RouteStatusIcon status={route.status} />
                <span className="text-sm text-slate-700">
                  {ROUTE_LABELS[route.route_type] ?? route.route_type}
                </span>
                {route.time_saved_minutes > 0 && (
                  <span className="text-xs text-slate-400 ml-1">
                    +{route.time_saved_minutes} min saved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {route.linked_record_id && route.linked_record_table && RECORD_TABLE_TO_PATH[route.linked_record_table] ? (
                  <Link
                    href={RECORD_TABLE_TO_PATH[route.linked_record_table]}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View record
                  </Link>
                ) : route.linked_record_id ? (
                  <span className="text-xs text-slate-400 font-mono">
                    {route.linked_record_id.slice(0, 8)}…
                  </span>
                ) : null}
                <Badge className={cn("text-xs border-0", ROUTE_STATUS_CLR[route.status])}>
                  {route.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {routes.length > 0 && (
        <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
          {routes.filter((r) => r.status === "completed").length} of {routes.length} routes completed
          {routes.some((r) => r.time_saved_minutes > 0) && (
            <> · {routes.reduce((s, r) => s + r.time_saved_minutes, 0)} minutes saved total</>
          )}
        </div>
      )}
    </div>
  );
}

// ── Audit tab ──────────────────────────────────────────────────────────────────

function AuditTab({ entries }: { entries: CareEventAuditLog[] }) {
  if (entries.length === 0) {
    return (
      <div className="text-sm text-slate-500 text-center py-8">
        No audit entries yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-slate-100 bg-slate-50/40">
          <div className="w-2 h-2 rounded-full bg-slate-400 mt-2 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-800">
                {AUDIT_ACTION_LABELS[entry.action] ?? entry.action.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-slate-400 shrink-0">
                {formatDate(entry.created_at)}
              </span>
            </div>
            {entry.actor_staff_id && (
              <p className="text-xs text-slate-500 mt-0.5">
                by {(entry as never as { actor_staff_name?: string }).actor_staff_name ?? entry.actor_staff_id}
                {entry.actor_role && <> ({entry.actor_role})</>}
              </p>
            )}
            {entry.detail && Object.keys(entry.detail).length > 0 && (() => {
              const d = entry.detail as Record<string, unknown>;
              // Show human-readable details instead of raw JSON
              const parts: string[] = [];
              if (d.return_reason)        parts.push(`Reason: "${d.return_reason}"`);
              if (d.amendment_reason)     parts.push(`Reason: "${d.amendment_reason}"`);
              if (d.manager_notes)        parts.push(`Notes: "${d.manager_notes}"`);
              if (d.evidence_approved !== undefined) parts.push(`Evidence approved: ${d.evidence_approved}`);
              if (d.routes_completed !== undefined)  parts.push(`Routes: ${d.routes_completed} completed`);
              if (d.routes_failed !== undefined && Number(d.routes_failed) > 0) parts.push(`${d.routes_failed} failed`);
              if (parts.length === 0) {
                parts.push(JSON.stringify(d).slice(0, 100));
              }
              return (
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {parts.join(" · ")}
                </p>
              );
            })()}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ARIA suggestions panel ─────────────────────────────────────────────────────

// ── Background jobs tab ────────────────────────────────────────────────────────

const JOB_STATUS_CLR: Record<JobStatus, string> = {
  pending:       "bg-slate-100 text-slate-500",
  processing:    "bg-indigo-100 text-indigo-700",
  completed:     "bg-emerald-100 text-emerald-700",
  failed:        "bg-red-100 text-red-700",
  retry_required:"bg-amber-100 text-amber-700",
};

const JOB_TYPE_LABELS: Record<string, string> = {
  reg45_summary_update:         "Regulation 45 summary update",
  annex_a_snapshot_update:      "Annex A snapshot update",
  inspection_readiness_update:  "Inspection readiness update",
  pattern_analysis:             "Pattern analysis",
  pdf_generation:               "PDF generation",
  evidence_pack_export:         "Evidence pack export",
  filing_cabinet_index_rebuild: "Filing cabinet index rebuild",
  saved_time_metrics:           "Saved-time metrics",
};

function JobsTab({ careEventId }: { careEventId: string }) {
  const { data, isLoading } = useCareEventJobs(careEventId);
  const runMutation = useRunCareEventJobs();

  const jobs = data?.data ?? [];
  const meta = data?.meta;

  const hasActive = jobs.some(
    (j) => j.status === "pending" || j.status === "processing" || j.status === "retry_required"
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading background jobs…
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No background jobs for this event.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs text-slate-500">
          {meta && (
            <>
              {meta.pending > 0 && <span className="text-amber-600 font-medium">{meta.pending} pending</span>}
              {meta.processing > 0 && <span className="text-indigo-600 font-medium">{meta.processing} processing</span>}
              {meta.completed > 0 && <span className="text-emerald-600">{meta.completed} completed</span>}
              {meta.failed > 0 && <span className="text-red-600 font-medium">{meta.failed} failed</span>}
            </>
          )}
        </div>
        {hasActive && (
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5"
            onClick={() => runMutation.mutate({ care_event_id: careEventId })}
            disabled={runMutation.isPending}
          >
            {runMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PlayCircle className="w-3.5 h-3.5" />
            )}
            Run pending jobs
          </Button>
        )}
      </div>

      {/* Job list */}
      <div className="space-y-2">
        {jobs.map((job: CareEventJob) => (
          <div key={job.id} className="flex items-start justify-between gap-3 border border-slate-100 rounded-lg px-3 py-2.5">
            <div className="flex items-start gap-2 min-w-0">
              {job.status === "processing" && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin mt-0.5 shrink-0" />}
              {job.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />}
              {job.status === "failed" && <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />}
              {job.status === "retry_required" && <RefreshCw className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />}
              {job.status === "pending" && <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700">
                  {JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
                </p>
                {job.error_message && (
                  <p className="text-xs text-red-600 mt-0.5 truncate">{job.error_message}</p>
                )}
                {job.retry_count > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Attempt {job.retry_count + 1} of {job.max_retries}
                  </p>
                )}
              </div>
            </div>
            <span className={cn("text-xs px-2 py-0.5 rounded-full shrink-0", JOB_STATUS_CLR[job.status])}>
              {job.status.replace(/_/g, " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ARIASuggestionsPanel({
  event,
}: {
  event: {
    aria_suggested_summary: string | null;
    aria_suggested_category: string | null;
    aria_suggested_routing: string[] | null;
    aria_suggested_reg45: string | null;
    aria_suggested_annex_a: string | null;
    aria_suggestions_reviewed: boolean;
  };
}) {
  const hasSuggestions =
    event.aria_suggested_summary ||
    event.aria_suggested_category ||
    event.aria_suggested_reg45 ||
    event.aria_suggested_annex_a;

  if (!hasSuggestions) return null;

  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
          ARIA suggestions
        </p>
        <span className="text-xs text-indigo-500">
          {event.aria_suggestions_reviewed ? "Reviewed" : "Awaiting review"}
        </span>
      </div>
      <p className="text-xs text-indigo-600 bg-indigo-100 rounded px-2 py-1">
        These are AI-generated suggestions only. They are stored separately from the human record and must not be treated as verified information.
      </p>
      {event.aria_suggested_summary && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Suggested summary</p>
          <p className="text-sm text-slate-700">{event.aria_suggested_summary}</p>
        </div>
      )}
      {event.aria_suggested_category && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Suggested category</p>
          <p className="text-sm text-slate-700 capitalize">
            {event.aria_suggested_category.replace(/_/g, " ")}
          </p>
        </div>
      )}
      {event.aria_suggested_reg45 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Suggested Reg 45 text</p>
          <p className="text-sm text-slate-700">{event.aria_suggested_reg45}</p>
        </div>
      )}
      {event.aria_suggested_annex_a && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Suggested Annex A text</p>
          <p className="text-sm text-slate-700">{event.aria_suggested_annex_a}</p>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CareEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading, isError } = useCareEvent(id);
  const { data: auditData } = useCareEventAuditLog({ care_event_id: id, limit: 50 });

  const event = data?.data;
  const routes: CareEventRoute[] = (data?.data as { routes?: CareEventRoute[] })?.routes ?? [];
  const auditEntries: CareEventAuditLog[] = auditData?.entries ?? [];

  if (isLoading) {
    return (
      <PageShell title="Care Event" subtitle="Loading…">
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading care event…
        </div>
      </PageShell>
    );
  }

  if (isError || !event) {
    return (
      <PageShell title="Care Event" subtitle="Not found">
        <Card className="border-red-100">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-300 mx-auto mb-3" />
            <p className="font-medium text-slate-600">Care event not found</p>
            <Button variant="outline" className="mt-4" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Go back
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const completedRoutes = routes.filter((r) => r.status === "completed").length;
  const failedRoutes = routes.filter(
    (r) => r.status === "failed" || r.status === "retry_required"
  ).length;

  const verifyMutation = useVerifyCareEvent();
  const returnMutation = useReturnCareEvent();
  const lockMutation = useLockCareEvent();
  const amendMutation = useAmendCareEvent();
  const retryMutation = useRetryCareEventRouting();

  const [returnDialog, setReturnDialog] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [amendDialog, setAmendDialog] = useState(false);
  const [amendReason, setAmendReason] = useState("");

  const canVerify = ["routed", "manager_review_required", "routing_failed"].includes(event.status);
  const canReturn = ["submitted", "routing", "routed", "manager_review_required"].includes(event.status);
  const canLock = event.status === "verified";
  const canAmend = ["verified", "locked", "returned", "routed"].includes(event.status);
  const canRetry = routes.some((r) => r.status === "failed" || r.status === "retry_required");

  return (
    <PageShell
      title={event.title}
      subtitle={`${event.category.replace(/_/g, " ")} · ${formatDate(event.event_date)}`}
      ariaContext={{
        pageTitle: event.title,
        sourceType: "incident",
        sourceId: event.id,
        childId: event.child_id ?? undefined,
        extraContext: `Category: ${event.category}. Status: ${event.status}.`,
      }}
    >
      {/* Back + status row */}
      <div className="flex items-center justify-between mb-5">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-slate-600"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Care Events
        </Button>
        <div className="flex items-center gap-2">
          {/* Export evidence pack */}
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1"
            asChild
          >
            <a href={`/api/v1/care-events/${event.id}/export?format=html`} download>
              <FolderOpen className="w-3.5 h-3.5" />
              Export
            </a>
          </Button>
          {event.status === "locked" && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5" /> Locked
            </span>
          )}
          <Badge
            className={cn(
              "text-xs border",
              STATUS_CLR[event.status] ?? "bg-slate-100 text-slate-600 border-slate-200"
            )}
          >
            {STATUS_LABEL[event.status] ?? event.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column: event details */}
        <div className="lg:col-span-2 space-y-4">

          {/* Main event card */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Date &amp; time</p>
                  <p className="font-medium text-slate-800">
                    {formatDate(event.event_date)}
                    {event.event_time && <span className="text-slate-500"> · {event.event_time}</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Category</p>
                  <p className="font-medium text-slate-800 capitalize">
                    {event.category.replace(/_/g, " ")}
                  </p>
                </div>
                {event.mood_score != null && (
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Mood</p>
                    <p className="font-medium text-slate-800">{event.mood_score}/10</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1">Full account</p>
                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {event.content}
                </p>
              </div>

              <ComplianceFlags event={event} />
            </CardContent>
          </Card>

          {/* Manager / return info */}
          {event.return_reason && (
            <Card className="border-red-100 bg-red-50/30">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1.5">
                  Returned by manager
                </p>
                <p className="text-sm text-slate-700">{event.return_reason}</p>
                {event.returned_at && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    {formatDate(event.returned_at)}
                    {event.returned_by && <> by {event.returned_by}</>}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {event.manager_notes && (
            <Card className="border-amber-100 bg-amber-50/20">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">
                  Manager notes
                </p>
                <p className="text-sm text-slate-700">{event.manager_notes}</p>
                {event.manager_review_at && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Reviewed {formatDate(event.manager_review_at)}
                    {event.manager_id && <> by {event.manager_id}</>}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Amendment info */}
          {event.amendment_reason && (
            <Card className="border-blue-100 bg-blue-50/20">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1.5">
                  Amendment · Version {event.version}
                </p>
                <p className="text-sm text-slate-700">{event.amendment_reason}</p>
                {event.amended_at && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Amended {formatDate(event.amended_at)}
                    {event.amended_by && <> by {event.amended_by}</>}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Version history */}
          {(() => {
            const vh = (event as never as { version_history?: Array<{ id: string; version: number; amended_at: string | null; amendment_reason: string | null; amended_by_name: string | null }> }).version_history;
            if (!vh || vh.length === 0) return null;
            return (
              <Card className="border-slate-200">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Version history</p>
                  <ol className="space-y-2">
                    {vh.map((v) => (
                      <li key={v.id} className="flex items-start gap-3 text-sm">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 shrink-0 mt-0.5">
                          {v.version}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500">
                            {v.amended_at ? formatDate(v.amended_at) : "—"}
                            {v.amended_by_name && <> · {v.amended_by_name}</>}
                          </p>
                          {v.amendment_reason && (
                            <p className="text-xs text-slate-600 mt-0.5 italic">"{v.amendment_reason}"</p>
                          )}
                        </div>
                        <Link href={`/care-events/${v.id}`} className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium shrink-0 mt-0.5">
                          View
                        </Link>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            );
          })()}

          {/* ARIA suggestions */}
          <ARIASuggestionsPanel event={event} />

          {/* Tabbed detail: Routing + Audit */}
          <Tabs defaultValue="routing">
            <TabsList>
              <TabsTrigger value="routing" className="gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Routing
                {routes.length > 0 && (
                  <span className="ml-1 text-xs bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">
                    {completedRoutes}/{routes.length}
                  </span>
                )}
                {failedRoutes > 0 && (
                  <span className="ml-0.5 text-xs bg-red-100 text-red-700 rounded-full px-1.5 py-0.5">
                    {failedRoutes} failed
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                Audit trail
                {auditEntries.length > 0 && (
                  <span className="ml-1 text-xs bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">
                    {auditEntries.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-1.5">
                <PlayCircle className="w-3.5 h-3.5" />
                Background jobs
              </TabsTrigger>
            </TabsList>
            <TabsContent value="routing" className="mt-3">
              <RoutingTab
                routes={routes}
                careEventId={event.id}
                status={event.status}
              />
            </TabsContent>
            <TabsContent value="audit" className="mt-3">
              <AuditTab entries={auditEntries} />
            </TabsContent>
            <TabsContent value="jobs" className="mt-3">
              <JobsTab careEventId={event.id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column: metadata */}
        <div className="space-y-4">
          {/* Routing summary */}
          {event.routing_summary && (
            <Card className="border-emerald-100">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Routing summary
                </p>
                {[
                  { label: "Records updated", value: event.routing_summary.records_updated },
                  { label: "Tasks created", value: event.routing_summary.tasks_created },
                  { label: "Reg 45 evidence", value: event.routing_summary.reg45_count },
                  { label: "Annex A updates", value: event.routing_summary.annex_a_count },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{row.label}</span>
                    <span className={`font-semibold ${row.value > 0 ? "text-emerald-700" : "text-slate-400"}`}>{row.value}</span>
                  </div>
                ))}
                {event.routing_summary.areas_updated.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1">
                    {event.routing_summary.areas_updated.map((area) => {
                      // Map display area name to a path if possible
                      const areaPathMap: Record<string, string> = {
                        "Incidents": "/incidents",
                        "Missing from care": "/missing-from-care",
                        "Restraint log": "/restraint-log",
                        "Tasks": "/tasks",
                        "Education records": "/education",
                        "Health records": "/health-records",
                        "Filing cabinet": "/filing-cabinet",
                        "Management oversight": "/management-oversight",
                        "Regulation 40": "/regulation-40",
                        "Regulation 45": "/regulation-45",
                        "Annex A": "/annex-a",
                        "Daily log": "/daily-log",
                        "Child daily summaries": "/child-daily-summaries",
                        "Safeguarding": "/safeguarding",
                        "Family contact": "/family-contact",
                        "Complaints": "/complaints",
                        "Behaviour log": "/behaviour-log",
                        "Medication": "/medication",
                      };
                      const href = areaPathMap[area];
                      return href ? (
                        <Link
                          key={area}
                          href={href}
                          className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded px-1.5 py-0.5 transition-colors"
                        >
                          {area}
                        </Link>
                      ) : (
                        <span
                          key={area}
                          className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5"
                        >
                          {area}
                        </span>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Staff + signatures */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                People
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500">Staff</span>
                  <span className="ml-auto font-medium text-slate-700">
                    {(event as never as { staff_name?: string }).staff_name ?? event.staff_id}
                  </span>
                </div>
                {event.child_id && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-500">Young person</span>
                    <span className="ml-auto font-medium text-slate-700">
                      {(event as never as { child_name?: string }).child_name ?? event.child_id}
                    </span>
                  </div>
                )}
                {event.verified_by && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-slate-500">Verified by</span>
                    <span className="ml-auto font-medium text-slate-700">
                      {(event as never as { verified_by_name?: string }).verified_by_name ?? event.verified_by}
                    </span>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                {event.staff_signature && (
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Staff signed
                    {event.staff_signed_at && <> · {formatDate(event.staff_signed_at)}</>}
                  </p>
                )}
                {event.manager_signature && (
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Manager signed
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Timeline
              </p>
              {[
                { label: "Created", date: event.created_at },
                { label: "Submitted", date: event.submitted_at },
                { label: "Verified", date: event.verified_at },
                { label: "Locked", date: event.locked_at },
              ]
                .filter((t) => t.date)
                .map((t) => (
                  <div key={t.label} className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">{t.label}</span>
                    <span className="ml-auto text-slate-700">{formatDate(t.date!)}</span>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Manager actions */}
          {(canVerify || canReturn || canLock || canAmend || canRetry) && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">
                  Manager actions
                </p>
                {canVerify && (
                  <Button
                    size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={verifyMutation.isPending}
                    onClick={() => verifyMutation.mutate({ id: event.id, manager_signature: true })}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    {verifyMutation.isPending ? "Verifying…" : "Verify record"}
                  </Button>
                )}
                {canReturn && (
                  <Button
                    size="sm" variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => setReturnDialog(true)}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    Return to staff
                  </Button>
                )}
                {canLock && (
                  <Button
                    size="sm" variant="outline" className="w-full"
                    disabled={lockMutation.isPending}
                    onClick={() => lockMutation.mutate(event.id)}
                  >
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    {lockMutation.isPending ? "Locking…" : "Lock record"}
                  </Button>
                )}
                {canAmend && (
                  <Button
                    size="sm" variant="ghost" className="w-full text-slate-600"
                    onClick={() => setAmendDialog(true)}
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    Create amendment
                  </Button>
                )}
                {canRetry && (
                  <Button
                    size="sm" variant="ghost" className="w-full text-slate-600"
                    disabled={retryMutation.isPending}
                    onClick={() => retryMutation.mutate(event.id)}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                    {retryMutation.isPending ? "Retrying…" : "Retry failed routes"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick links */}
          <Card>
            <CardContent className="p-4 space-y-1.5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Related areas
              </p>
              {[
                event.contributes_to_reg45 && { label: "Reg 45 Evidence", href: "/regulation-45" },
                event.contributes_to_annex_a && { label: "Annex A Readiness", href: "/annex-a" },
                event.requires_manager_review && { label: "Management Oversight", href: "/management-oversight" },
                event.requires_reg40_triage && { label: "Regulation 40", href: "/regulation-40" },
                { label: "Filing Cabinet", href: "/filing-cabinet" },
                { label: "Audit Trail", href: "/audit-trail" },
              ]
                .filter(Boolean)
                .map((link) => (
                  <a
                    key={(link as { href: string }).href}
                    href={(link as { href: string }).href}
                    className="flex items-center justify-between text-sm text-indigo-600 hover:text-indigo-800 py-1 border-b border-slate-50 last:border-0"
                  >
                    {(link as { label: string }).label}
                    <ArrowLeft className="w-3 h-3 rotate-180" />
                  </a>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Return dialog */}
      <Dialog open={returnDialog} onOpenChange={setReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return record to staff</DialogTitle>
            <DialogDescription>
              Provide a reason so the staff member knows what to correct.
              The record will be marked as returned and removed from the evidence queue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="return-reason">Return reason <span className="text-red-500">*</span></Label>
            <Textarea
              id="return-reason"
              placeholder="Explain what needs to be corrected or added\u2026"
              rows={4}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialog(false)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!returnReason.trim() || returnMutation.isPending}
              onClick={() => {
                returnMutation.mutate(
                  { id: event.id, return_reason: returnReason },
                  { onSuccess: () => { setReturnDialog(false); setReturnReason(""); } }
                );
              }}
            >
              {returnMutation.isPending ? "Returning\u2026" : "Return record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Amendment dialog */}
      <Dialog open={amendDialog} onOpenChange={setAmendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create amendment</DialogTitle>
            <DialogDescription>
              A new version will be created preserving the original.
              The amendment requires manager review before it is verified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="amend-reason">Amendment reason <span className="text-red-500">*</span></Label>
            <Textarea
              id="amend-reason"
              placeholder="Why is this record being amended? What has changed?"
              rows={4}
              value={amendReason}
              onChange={(e) => setAmendReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAmendDialog(false)}>Cancel</Button>
            <Button
              disabled={!amendReason.trim() || amendMutation.isPending}
              onClick={() => {
                amendMutation.mutate(
                  { id: event.id, amendment_reason: amendReason },
                  {
                    onSuccess: (res) => {
                      setAmendDialog(false);
                      setAmendReason("");
                      router.push(`/care-events/${res.data.id}`);
                    },
                  }
                );
              }}
            >
              {amendMutation.isPending ? "Creating\u2026" : "Create amendment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
