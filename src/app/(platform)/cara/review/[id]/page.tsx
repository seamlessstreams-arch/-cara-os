"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara SUGGESTION DETAIL + APPROVAL WORKFLOW
//
// Full view of a single Cara suggestion with:
// - Suggestion detail (title, summary, reason, risk, confidence)
// - Draft text (editable before approval)
// - Linked record suggestions
// - Approval actions (approve, reject, no action, commit)
// - Audit timeline
//
// Every action is audit-logged. Rejection requires a reason.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCaraSuggestion, useUpdateCaraSuggestion } from "@/hooks/use-intelligence-layer";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Shield,
  FileText,
  Users,
  Heart,
  Brain,
  Bell,
  ClipboardCheck,
  ArrowUpDown,
  Pencil,
  Save,
  X,
  History,
  Link as LinkIcon,
  ChevronRight,
} from "lucide-react";
import { demoSeedOne } from "@/lib/demo/demo-seed";

// ─── Types ──────────────────────────────────────────────────────────────────

interface LinkedRecord {
  id: string;
  linked_record_type: string;
  reason: string;
  suggested_action: string;
  risk_level: string;
}

interface AuditEntry {
  id: string;
  action: string;
  actor_role: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface SuggestionDetail {
  id: string;
  title: string;
  summary: string;
  reason: string;
  suggestion_type: string;
  related_record_type: string;
  related_record_id: string;
  child_name?: string;
  risk_level: string;
  confidence_level: string;
  status: string;
  draft_text: string;
  final_text?: string;
  rejection_reason?: string;
  reviewer_role?: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  committed_at?: string;
  mock_mode: boolean;
  linked_records: LinkedRecord[];
  audit_timeline: AuditEntry[];
}

const DEMO_SUGGESTION_FALLBACK: SuggestionDetail = {
  id: "as_001",
  title: "Management oversight required — physical intervention incident",
  summary: "A physical intervention was recorded. The Registered Manager should review the response, consider whether the intervention was proportionate, check that the child's voice has been captured, and record oversight.",
  reason: "Physical intervention incidents require immediate management oversight under Regulation 35 and the Quality Standards. The manager should evidence that the response was proportionate, that less restrictive measures were considered first, that the child was supported afterwards, and that staff are clear on the learning.",
  suggestion_type: "management_oversight",
  related_record_type: "incident",
  related_record_id: "inc_042",
  child_name: "Alex W",
  risk_level: "urgent",
  confidence_level: "high",
  status: "awaiting_review",
  draft_text: `Cara suggested draft — requires manager review before saving.

I have reviewed this incident involving a physical intervention with Alex on 5 May 2026.

What was reviewed:
The incident record, the immediate action taken, the staff accounts, and the child's response following the incident.

What happened:
Alex became increasingly distressed during the evening routine. Staff report that verbal de-escalation, distraction, and offers of alternative activity were attempted before any physical intervention was considered. When Alex moved towards the kitchen area where other children were present and began throwing items, staff made the decision to use a brief physical intervention to guide Alex to a quieter space.

Impact on the child:
Alex was visibly distressed during and immediately after the intervention. Staff remained with Alex and offered comfort. Alex was able to talk about what happened approximately 30 minutes later. Alex's voice should be formally captured through key work.

Staff response:
Staff attempted proportionate de-escalation strategies before physical intervention. The intervention described appears brief and proportionate to the immediate risk. Staff remained with Alex afterwards and offered support.

Were existing plans followed:
The behaviour support plan includes guidance on de-escalation. The records suggest staff followed the plan. However, the plan may need reviewing if the triggers described are not currently captured in the plan.

Safeguarding considerations:
Any physical intervention involving a child requires consideration of whether the LADO threshold is met. On the basis of what is recorded, the intervention appears proportionate, but the manager should satisfy themselves of this and record their reasoning.

Has risk changed:
Three incidents involving similar behaviour within 14 days suggest the risk assessment may not fully reflect Alex's current presentation. A review of the risk assessment is recommended.

Management decision:
[To be completed by the Registered Manager]

Next actions:
- Key work session with Alex to capture wishes and feelings
- Risk assessment review
- Staff debrief
- Consider whether behaviour support plan update is needed
- Consider whether social worker and placing authority should be updated

Review timeframe:
Next review within 48 hours to confirm actions have been progressed.`,
  created_at: "2026-05-05T08:15:00Z",
  mock_mode: false,
  linked_records: [
    {
      id: "asl_001",
      linked_record_type: "risk_assessment",
      reason: "Three incidents in 14 days suggest the risk assessment may need updating to reflect Alex's current presentation.",
      suggested_action: "Review risk assessment — consider whether current risk level and strategies remain appropriate.",
      risk_level: "high",
    },
    {
      id: "asl_002",
      linked_record_type: "behaviour_support_plan",
      reason: "The triggers described in this incident may not be fully captured in the current behaviour support plan.",
      suggested_action: "Review behaviour support plan — check whether de-escalation strategies and triggers are current.",
      risk_level: "medium",
    },
    {
      id: "asl_003",
      linked_record_type: "key_work",
      reason: "The child's voice is not yet visible in the post-incident records.",
      suggested_action: "Arrange key work session to capture Alex's wishes, feelings, and experience of the incident.",
      risk_level: "medium",
    },
    {
      id: "asl_004",
      linked_record_type: "staff_debrief",
      reason: "Staff involved in physical interventions benefit from structured debrief.",
      suggested_action: "Arrange staff debrief to reflect on practice, explore what went well, and consider learning.",
      risk_level: "medium",
    },
  ],
  audit_timeline: [
    { id: "aud_001", action: "suggestion_created", actor_role: "system", created_at: "2026-05-05T08:15:00Z" },
    { id: "aud_002", action: "draft_generated", actor_role: "system", created_at: "2026-05-05T08:15:01Z", metadata: { ai_provider: "anthropic", mock_mode: false } },
    { id: "aud_003", action: "linked_records_suggested", actor_role: "system", created_at: "2026-05-05T08:15:02Z", metadata: { count: 4 } },
    { id: "aud_004", action: "suggestion_viewed", actor_role: "registered_manager", created_at: "2026-05-05T09:30:00Z" },
  ],
};

// ─── Config ─────────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<string, { label: string; bg: string }> = {
  urgent: { label: "Urgent", bg: "bg-red-100 text-red-800" },
  high:   { label: "High",   bg: "bg-orange-100 text-orange-800" },
  medium: { label: "Medium", bg: "bg-amber-100 text-amber-800" },
  low:    { label: "Low",    bg: "bg-slate-100 text-slate-700" },
};

const CONFIDENCE_CONFIG: Record<string, { label: string; bg: string }> = {
  high:   { label: "High confidence",   bg: "bg-emerald-100 text-emerald-800" },
  medium: { label: "Medium confidence",  bg: "bg-amber-100 text-amber-800" },
  low:    { label: "Low confidence",     bg: "bg-slate-100 text-slate-700" },
};

const TYPE_LABELS: Record<string, string> = {
  management_oversight: "Management oversight",
  risk_review: "Risk assessment review",
  plan_review: "Placement plan review",
  behaviour_support_review: "Behaviour support review",
  key_work: "Key work session",
  safeguarding_review: "Safeguarding review",
  staff_debrief: "Staff debrief",
  notification: "Notification",
  task: "Task",
  linked_record_review: "Linked record review",
  handover_update: "Handover update",
  incident_analysis: "Incident analysis",
};

const LINKED_TYPE_LABELS: Record<string, string> = {
  child_profile: "Child profile",
  incident: "Incident",
  risk_assessment: "Risk assessment",
  placement_plan: "Placement plan",
  behaviour_support_plan: "Behaviour support plan",
  key_work: "Key work",
  safeguarding: "Safeguarding",
  staff_debrief: "Staff debrief",
  management_oversight: "Management oversight",
  notification: "Notification",
  task: "Task",
};

const AUDIT_LABELS: Record<string, string> = {
  suggestion_created: "Suggestion created",
  suggestion_viewed: "Suggestion viewed",
  draft_generated: "Draft generated",
  draft_edited: "Draft edited",
  suggestion_approved: "Approved",
  suggestion_rejected: "Rejected",
  suggestion_no_action: "Marked no action required",
  suggestion_committed: "Committed to record",
  task_created: "Task created",
  linked_records_suggested: "Linked records suggested",
  ai_provider_called: "AI provider called",
  mock_mode_used: "Mock mode used",
  error: "Error",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function CaraSuggestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: apiData } = useCaraSuggestion(id);
  const updateMutation = useUpdateCaraSuggestion();
  // Live tenant: no demo fallback — a real home with no such suggestion sees a
  // not-found state (below), never a fabricated one. Demo: the fallback stands.
  const suggestion = ((apiData?.item as SuggestionDetail | null) ?? demoSeedOne(DEMO_SUGGESTION_FALLBACK));

  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(suggestion?.draft_text ?? "");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionTaken, setActionTaken] = useState<string | null>(null);

  useEffect(() => {
    if (apiData?.item) {
      setEditedText((apiData.item as SuggestionDetail).draft_text);
    }
  }, [apiData]);

  // Hooks are all above this line, so the early return is safe. On a live tenant
  // with no matching suggestion, `suggestion` is null (no demo fallback).
  if (!suggestion) {
    return (
      <PageShell title="Suggestion not found" subtitle="This suggestion isn't available.">
        <p className="text-sm text-[var(--cs-text-muted)]">
          No suggestion with this reference. It may have been actioned already, or the link is out of date.
        </p>
      </PageShell>
    );
  }

  const risk = RISK_CONFIG[suggestion.risk_level] ?? RISK_CONFIG.medium;
  const confidence = CONFIDENCE_CONFIG[suggestion.confidence_level] ?? CONFIDENCE_CONFIG.medium;

  function handleApprove() {
    const isAmended = editedText !== suggestion?.draft_text;
    const status = isAmended ? "amended_and_approved" : "approved";
    setActionTaken(status);
    updateMutation.mutate({ id, status, finalText: isAmended ? editedText : undefined });
  }

  function handleReject() {
    if (!rejectionReason.trim()) return;
    setActionTaken("rejected");
    setShowRejectForm(false);
    updateMutation.mutate({ id, status: "rejected", rejectionReason });
  }

  function handleNoAction() {
    setActionTaken("no_action_required");
    updateMutation.mutate({ id, status: "no_action_required" });
  }

  function handleCommit() {
    setActionTaken("committed");
    updateMutation.mutate({ id, status: "committed" });
  }

  const isReviewed = actionTaken !== null || suggestion.status !== "awaiting_review";

  return (
    <PageShell
      title="Cara Suggestion"
      subtitle="Review, edit and approve or reject this Cara suggestion."
    >
      {/* Back link */}
      <Link
        href="/cara/review"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Review Queue
      </Link>

      {/* Action taken banner */}
      {actionTaken && (
        <div className={cn(
          "rounded-xl border p-4 mb-6 flex items-center gap-3",
          actionTaken === "approved" || actionTaken === "amended_and_approved"
            ? "bg-emerald-50 border-emerald-200"
            : actionTaken === "rejected"
              ? "bg-red-50 border-red-200"
              : actionTaken === "committed"
                ? "bg-blue-50 border-blue-200"
                : "bg-slate-50 border-slate-200",
        )}>
          {actionTaken.includes("approved") && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          {actionTaken === "rejected" && <XCircle className="h-5 w-5 text-red-600" />}
          {actionTaken === "committed" && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
          {actionTaken === "no_action_required" && <Eye className="h-5 w-5 text-slate-500" />}
          <div>
            <p className="text-sm font-medium">
              {actionTaken === "approved" && "Suggestion approved"}
              {actionTaken === "amended_and_approved" && "Suggestion amended and approved"}
              {actionTaken === "rejected" && "Suggestion rejected"}
              {actionTaken === "committed" && "Committed to record"}
              {actionTaken === "no_action_required" && "Marked as no action required"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">This action has been audit-logged.</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={cn("text-xs", risk.bg)}>{risk.label}</Badge>
                    <Badge className={cn("text-xs", confidence.bg)}>{confidence.label}</Badge>
                    {suggestion.mock_mode && (
                      <Badge variant="outline" className="text-xs text-slate-400">Mock mode</Badge>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">{suggestion.title}</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-slate-500">Type:</span>{" "}
                  <span className="font-medium">{TYPE_LABELS[suggestion.suggestion_type] ?? suggestion.suggestion_type}</span>
                </div>
                <div>
                  <span className="text-slate-500">Related record:</span>{" "}
                  <span className="font-medium">{suggestion.related_record_type} {suggestion.related_record_id}</span>
                </div>
                {suggestion.child_name && (
                  <div>
                    <span className="text-slate-500">Child:</span>{" "}
                    <span className="font-medium">{suggestion.child_name}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Created:</span>{" "}
                  <span className="font-medium">{new Date(suggestion.created_at).toLocaleString("en-GB")}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-sm">
                <p className="font-medium text-slate-700 mb-1">Summary</p>
                <p className="text-slate-600">{suggestion.summary}</p>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg text-sm mt-3">
                <p className="font-medium text-amber-800 mb-1">Reason Cara raised this</p>
                <p className="text-amber-700">{suggestion.reason}</p>
              </div>
            </CardContent>
          </Card>

          {/* Draft text */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Cara draft
                </CardTitle>
                {!isReviewed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs gap-1.5"
                  >
                    {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                    {isEditing ? "Cancel edit" : "Edit draft"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-1 mb-3">
                <p className="text-[10px] text-blue-600 font-medium px-2 py-1">
                  Cara suggested draft — the Registered Manager reviews, edits and decides.
                </p>
              </div>
              {isEditing ? (
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  rows={20}
                  className="text-sm font-mono"
                />
              ) : (
                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
                  {actionTaken?.includes("approved") ? editedText : suggestion.draft_text}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval actions */}
          {!isReviewed && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Manager decision</h3>

                {showRejectForm ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">Please record your reason for rejecting this suggestion.</p>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Rejection reason (required)…"
                      rows={3}
                      className="text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleReject}
                        disabled={!rejectionReason.trim()}
                        className="gap-1.5"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Confirm rejection
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowRejectForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm" onClick={handleApprove} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {editedText !== suggestion.draft_text ? "Approve (amended)" : "Approve"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setShowRejectForm(true)} className="gap-1.5">
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleNoAction} className="gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      No action required
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Commit action (post-approval) */}
          {actionTaken?.includes("approved") && (
            <Card className="border-blue-200 bg-blue-50/30">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Commit to record</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Save the approved text as the management oversight for the linked incident.
                </p>
                <Button size="sm" onClick={handleCommit} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  Commit to incident record
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Linked record suggestions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <LinkIcon className="h-4 w-4 text-slate-400" />
                Linked record suggestions ({suggestion.linked_records.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestion.linked_records.map((lr) => (
                <div key={lr.id} className="p-3 border rounded-lg text-sm space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">
                      {LINKED_TYPE_LABELS[lr.linked_record_type] ?? lr.linked_record_type}
                    </span>
                    <Badge className={cn("text-[10px]", RISK_CONFIG[lr.risk_level]?.bg ?? "bg-slate-100 text-slate-700")}>
                      {RISK_CONFIG[lr.risk_level]?.label ?? lr.risk_level}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">{lr.reason}</p>
                  <p className="text-xs text-slate-600 font-medium">{lr.suggested_action}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Audit timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <History className="h-4 w-4 text-slate-400" />
                Audit timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestion.audit_timeline.map((entry, idx) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-slate-300 mt-1.5" />
                      {idx < suggestion.audit_timeline.length - 1 && (
                        <div className="w-px flex-1 bg-slate-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs font-medium text-slate-700">
                        {AUDIT_LABELS[entry.action] ?? entry.action}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(entry.created_at).toLocaleString("en-GB")} &middot; {entry.actor_role}
                      </p>
                    </div>
                  </div>
                ))}
                {actionTaken && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-700">
                        {actionTaken === "approved" ? "Approved" :
                         actionTaken === "amended_and_approved" ? "Amended and approved" :
                         actionTaken === "rejected" ? "Rejected" :
                         actionTaken === "committed" ? "Committed" :
                         "Marked no action required"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date().toLocaleString("en-GB")} &middot; registered_manager
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
