"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FAMILY CONTACT & CONTACT LOG REGISTER
// Children's Homes Regulations 2015, Reg 13 (Contact)
// Quality Standards — Standard 2 (Care Planning) & Standard 5 (Relationships)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import {
  useContactArrangements,
  useContactLogs,
  useUpdateContactArrangement,
  useUpdateContactLog,
  useCreateContactLog,
} from "@/hooks/use-contact";
import Link from "next/link";
import { getYPName } from "@/lib/seed-data";
import type {
  ContactArrangement, ContactLog, ContactPerson,
  ContactOutcome, ContactStatus, ContactType, ContactSupervisionLevel,
  ContactArrangementStatus,
} from "@/types/extended";
import {
  PhoneCall, Users, AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronUp,
  XCircle, PauseCircle, RefreshCw, MessageSquare, Heart, Eye, Ban,
  CalendarDays, MapPin, UserCheck, ShieldAlert, Info, Search, ArrowUpDown, ArrowUpRight,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── Helpers ───────────────────────────────────────────────────────────────────

const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  face_to_face:          "Face-to-face",
  telephone:             "Telephone",
  video_call:            "Video call",
  letter:                "Letter",
  indirect:              "Indirect",
  supervised_community:  "Supervised community",
  overnight_stay:        "Overnight stay",
};

const OUTCOME_LABELS: Record<ContactOutcome, string> = {
  positive:              "Positive",
  mixed:                 "Mixed",
  difficult:             "Difficult",
  did_not_happen:        "Did not happen",
  cancelled_by_family:   "Cancelled – family",
  cancelled_by_yp:       "Cancelled – YP",
  cancelled_by_placing_la: "Cancelled – placing LA",
  refused_by_yp:         "Refused by YP",
};

const SUPERVISION_LABELS: Record<ContactSupervisionLevel, string> = {
  unsupervised:              "Unsupervised",
  supported:                 "Supported",
  supervised:                "Supervised",
  professionally_supervised: "Professionally supervised",
};

const ARRANGEMENT_STATUS_LABELS: Record<ContactArrangementStatus, string> = {
  active:        "Active",
  under_review:  "Under review",
  suspended:     "Suspended",
  ceased:        "Ceased",
};

function outcomeBadgeClass(outcome: ContactOutcome) {
  if (outcome === "positive") return "bg-emerald-100 text-emerald-800";
  if (outcome === "mixed")    return "bg-amber-100  text-amber-800";
  if (["difficult", "refused_by_yp"].includes(outcome))
    return "bg-red-100 text-red-800";
  return "bg-slate-100 text-slate-600";
}

function arrangementStatusClass(s: ContactArrangementStatus) {
  if (s === "active")        return "bg-emerald-100 text-emerald-800";
  if (s === "under_review")  return "bg-amber-100  text-amber-800";
  if (s === "suspended")     return "bg-red-100    text-red-800";
  return "bg-slate-100 text-slate-600";
}

function moodEmoji(mood: string | null) {
  if (!mood) return null;
  const map: Record<string, string> = {
    positive:  "😊",
    settled:   "😌",
    neutral:   "😐",
    anxious:   "😟",
    reluctant: "😬",
    unsettled: "😕",
    distressed:"😢",
  };
  return map[mood] ?? "😐";
}

type EnrichedLog         = ContactLog & { contact_person: ContactPerson | null };
type EnrichedArrangement = ContactArrangement & { contact_person: ContactPerson | null };

const CONTACT_EXPORT_COLS: ExportColumn<EnrichedArrangement>[] = [
  { header: "Young Person", accessor: (a) => getYPName(a.child_id) },
  { header: "Contact Person", accessor: (a) => a.contact_person?.name ?? "" },
  { header: "Relationship", accessor: (a) => a.contact_person?.relationship ?? "" },
  { header: "Contact Type", accessor: (a) => a.contact_type },
  { header: "Frequency", accessor: (a) => a.frequency },
  { header: "Supervision", accessor: (a) => a.supervision_level },
  { header: "Status", accessor: (a) => a.status },
  { header: "Court Ordered", accessor: (a) => a.court_ordered ? "Yes" : "No" },
  { header: "LA Approved", accessor: (a) => a.contact_person?.la_approved ? "Yes" : "No" },
  { header: "Location", accessor: (a) => a.location ?? "" },
  { header: "Review Date", accessor: (a) => a.review_date ?? "" },
];

// ── Log entry card ────────────────────────────────────────────────────────────

function ContactLogCard({
  log,
  onUpdate,
  currentUserId,
}: {
  log: EnrichedLog;
  onUpdate: (id: string, data: Partial<ContactLog>) => void;
  currentUserId: string;
}) {
  const [open, setOpen]           = useState(false);
  const [ariaBusy, setAriaBusy]   = useState(false);
  const [swNote, setSwNote]       = useState("");
  const [showSwForm, setShowSwForm] = useState(false);

  const isCancelled = log.status === "cancelled";

  async function requestAria() {
    setAriaBusy(true);
    try {
      const res = await fetch("/api/v1/aria/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: `Family contact log for ${getYPName(log.child_id)} on ${formatDate(log.date)}.
Contact type: ${CONTACT_TYPE_LABELS[log.contact_type]}.
Outcome: ${OUTCOME_LABELS[log.outcome]}.
YP mood before: ${log.yp_mood_before ?? "not recorded"}. YP mood after: ${log.yp_mood_after ?? "not recorded"}.
Narrative: ${log.narrative}
YP voice: ${log.yp_voice ?? "not recorded"}
Concerns identified: ${log.concerns_identified ? log.concerns_detail : "none"}.
Safeguarding concern: ${log.safeguarding_concern ? log.safeguarding_detail : "none"}.`,
          prompt: "Analyse this contact log entry. What does it tell us about how this contact is affecting the young person? Are there patterns emerging? What should the home or keyworker do next? Keep analysis to 3–5 sentences.",
        }),
      });
      const data = await res.json();
      onUpdate(log.id, { aria_analysis: data.response ?? data.content ?? "Analysis unavailable." });
    } finally {
      setAriaBusy(false);
    }
  }

  function markSwNotified() {
    onUpdate(log.id, {
      social_worker_notified:    true,
      social_worker_notified_at: new Date().toISOString(),
    });
    setShowSwForm(false);
    setSwNote("");
  }

  return (
    <div className={cn(
      "border rounded-xl bg-white shadow-sm overflow-hidden",
      log.safeguarding_concern && "border-red-300",
      log.concerns_identified && !log.safeguarding_concern && "border-amber-200",
    )}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <PhoneCall className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-slate-900">
                {getYPName(log.child_id)}
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-sm text-slate-600">
                {log.contact_person?.name ?? "Unknown"} ({log.contact_person?.relationship ?? "??"})
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-xs text-slate-500">{CONTACT_TYPE_LABELS[log.contact_type]}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-500">{formatDate(log.date)}</span>
              {log.duration_minutes && (
                <span className="text-xs text-slate-400">{log.duration_minutes}min</span>
              )}
              {log.yp_mood_before && log.yp_mood_after && (
                <span className="text-xs text-slate-500">
                  {moodEmoji(log.yp_mood_before)} → {moodEmoji(log.yp_mood_after)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {log.safeguarding_concern && (
            <Badge className="bg-red-100 text-red-700 text-xs gap-1">
              <ShieldAlert className="w-3 h-3" /> Safeguarding
            </Badge>
          )}
          {log.concerns_identified && !log.safeguarding_concern && (
            <Badge className="bg-amber-100 text-amber-700 text-xs gap-1">
              <AlertTriangle className="w-3 h-3" /> Concern
            </Badge>
          )}
          {!isCancelled && (
            <Badge className={cn("text-xs", outcomeBadgeClass(log.outcome))}>
              {OUTCOME_LABELS[log.outcome]}
            </Badge>
          )}
          {isCancelled && (
            <Badge className="bg-slate-100 text-slate-600 text-xs gap-1">
              <XCircle className="w-3 h-3" /> Cancelled
            </Badge>
          )}
          {(log as never as { care_event_id?: string }).care_event_id && (
            <Link
              href={`/care-events/${(log as never as { care_event_id: string }).care_event_id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <ArrowUpRight className="w-3 h-3" />
              From Care Event
            </Link>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded body */}
      {open && (
        <div className="border-t px-4 py-4 space-y-4">
          {/* Narrative */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Contact narrative</p>
            <p className="text-sm text-slate-700 leading-relaxed">{log.narrative}</p>
          </div>

          {/* YP Voice */}
          {log.yp_voice && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> Voice of the child
              </p>
              <p className="text-sm text-blue-900 italic">&ldquo;{log.yp_voice}&rdquo;</p>
            </div>
          )}

          {/* Cancelled reason */}
          {isCancelled && log.cancelled_reason && (
            <div className="bg-slate-50 border rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">Cancellation reason</p>
              <p className="text-sm text-slate-700">{log.cancelled_reason}</p>
            </div>
          )}

          {/* Concerns */}
          {log.concerns_identified && log.concerns_detail && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Concerns identified
              </p>
              <p className="text-sm text-amber-900">{log.concerns_detail}</p>
            </div>
          )}

          {/* Safeguarding */}
          {log.safeguarding_concern && log.safeguarding_detail && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Safeguarding concern
              </p>
              <p className="text-sm text-red-900">{log.safeguarding_detail}</p>
            </div>
          )}

          {/* Follow-up */}
          {log.follow_up_required && log.follow_up_detail && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Follow-up required
              </p>
              <p className="text-sm text-purple-900">{log.follow_up_detail}</p>
            </div>
          )}

          {/* Gifts */}
          {log.gifts_received && log.gifts_detail && (
            <div className="bg-slate-50 border rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">Gifts received</p>
              <p className="text-sm text-slate-700">{log.gifts_detail}</p>
            </div>
          )}

          {/* ARIA analysis */}
          {log.aria_analysis && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-indigo-600 mb-1 flex items-center gap-1">
                ✦ ARIA analysis
              </p>
              <p className="text-sm text-indigo-900 leading-relaxed">{log.aria_analysis}</p>
            </div>
          )}

          {/* Supervision / social worker */}
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <span className="text-xs text-slate-500">
              Supervision: <span className="font-medium text-slate-700">{SUPERVISION_LABELS[log.supervision_level]}</span>
            </span>
            {log.location && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {log.location}
              </span>
            )}
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <SmartUploadButton
              variant="inline"
              uploadContext={`Family contact log — ${getYPName(log.child_id)} with ${log.contact_person?.name ?? "family"} on ${formatDate(log.date)}`}
            />

            {!log.aria_analysis && !isCancelled && (
              <Button
                size="sm"
                variant="outline"
                onClick={requestAria}
                disabled={ariaBusy}
                className="h-8 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                {ariaBusy ? "Analysing…" : "✦ ARIA analysis"}
              </Button>
            )}

            {log.follow_up_required && !log.social_worker_notified && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSwForm((v) => !v)}
                className="h-8 text-xs"
              >
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                Record SW notified
              </Button>
            )}

            {log.social_worker_notified && (
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                SW notified {log.social_worker_notified_at ? formatDate(log.social_worker_notified_at.split("T")[0]) : ""}
              </span>
            )}
          </div>

          {showSwForm && (
            <div className="bg-slate-50 border rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-slate-600">Note for social worker notification (optional)</p>
              <Textarea
                className="h-20 text-sm resize-none"
                placeholder="Add a brief note about what was shared with the social worker…"
                value={swNote}
                onChange={(e) => setSwNote(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" className="h-8 text-xs" onClick={markSwNotified}>
                  Confirm notified
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowSwForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Recorded by staff · {formatDate(log.created_at.split("T")[0])}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Arrangement card ──────────────────────────────────────────────────────────

function ArrangementCard({
  arrangement,
  logs,
  onUpdateArrangement,
  onUpdateLog,
  onCreateLog,
  currentUserId,
}: {
  arrangement: EnrichedArrangement;
  logs: EnrichedLog[];
  onUpdateArrangement: (id: string, data: Partial<ContactArrangement>) => void;
  onUpdateLog: (id: string, data: Partial<ContactLog>) => void;
  onCreateLog: (data: Partial<ContactLog>) => void;
  currentUserId: string;
}) {
  const [open, setOpen]       = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);

  // New log form state
  const [logOutcome, setLogOutcome]     = useState<ContactOutcome>("positive");
  const [logMoodBefore, setLogMoodBefore] = useState("");
  const [logMoodAfter, setLogMoodAfter]   = useState("");
  const [logNarrative, setLogNarrative]   = useState("");
  const [logYpVoice, setLogYpVoice]       = useState("");
  const [logConcerns, setLogConcerns]     = useState(false);
  const [logConcernsDetail, setLogConcernsDetail] = useState("");
  const [logSafeguarding, setLogSafeguarding] = useState(false);
  const [logSafeguardingDetail, setLogSafeguardingDetail] = useState("");
  const [logDate, setLogDate]             = useState(new Date().toISOString().split("T")[0]);

  function submitLog() {
    if (!logNarrative.trim()) return;
    onCreateLog({
      home_id:             arrangement.home_id,
      child_id:            arrangement.child_id,
      arrangement_id:      arrangement.id,
      contact_person_id:   arrangement.contact_person_id,
      contact_type:        arrangement.contact_type,
      date:                logDate,
      start_time:          null,
      end_time:            null,
      duration_minutes:    null,
      location:            arrangement.location,
      supervision_level:   arrangement.supervision_level,
      supervised_by:       currentUserId,
      outcome:             logOutcome,
      status:              "completed" as ContactStatus,
      yp_mood_before:      (logMoodBefore as ContactLog["yp_mood_before"]) || null,
      yp_mood_after:       (logMoodAfter as ContactLog["yp_mood_after"]) || null,
      narrative:           logNarrative.trim(),
      yp_voice:            logYpVoice.trim() || null,
      concerns_identified: logConcerns,
      concerns_detail:     logConcerns ? logConcernsDetail.trim() : null,
      safeguarding_concern:       logSafeguarding,
      safeguarding_detail:        logSafeguarding ? logSafeguardingDetail.trim() : null,
      follow_up_required:  logConcerns || logSafeguarding,
      follow_up_detail:    null,
      cancelled_reason:    null,
      social_worker_notified:    false,
      social_worker_notified_at: null,
      photos_shared:  false,
      gifts_received: false,
      gifts_detail:   null,
      aria_analysis:  null,
      created_by:     currentUserId,
    });
    setShowLogForm(false);
    setLogNarrative("");
    setLogYpVoice("");
    setLogConcerns(false);
    setLogConcernsDetail("");
    setLogSafeguarding(false);
    setLogSafeguardingDetail("");
    setLogMoodBefore("");
    setLogMoodAfter("");
  }

  const lastLog        = logs[0] ?? null;
  const concernCount   = logs.filter((l) => l.concerns_identified).length;
  const distressCount  = logs.filter((l) => l.yp_mood_after === "distressed").length;

  return (
    <div className={cn(
      "border rounded-xl bg-white shadow-sm overflow-hidden",
      arrangement.status === "under_review" && "border-amber-300",
      arrangement.status === "suspended"    && "border-red-300",
      arrangement.status === "ceased"       && "border-slate-300 opacity-60",
    )}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-violet-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-slate-900">
                {getYPName(arrangement.child_id)}
              </span>
              <span className="text-slate-400 text-xs">↔</span>
              <span className="text-sm text-slate-700">
                {arrangement.contact_person?.name ?? "Unknown"} ({arrangement.contact_person?.relationship ?? "??"})
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-500">
                {CONTACT_TYPE_LABELS[arrangement.contact_type]} · {arrangement.frequency}
              </span>
              {arrangement.frequency_detail && (
                <span className="text-xs text-slate-400">{arrangement.frequency_detail}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {distressCount >= 2 && (
            <Badge className="bg-red-100 text-red-700 text-xs gap-1">
              <AlertTriangle className="w-3 h-3" /> Pattern
            </Badge>
          )}
          <Badge className={cn("text-xs", arrangementStatusClass(arrangement.status))}>
            {ARRANGEMENT_STATUS_LABELS[arrangement.status]}
          </Badge>
          <Badge className="bg-slate-100 text-slate-600 text-xs">
            {logs.length} log{logs.length !== 1 ? "s" : ""}
          </Badge>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div className="border-t px-4 py-4 space-y-4">
          {/* Arrangement details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Supervision</p>
              <p className="font-medium text-slate-800">{SUPERVISION_LABELS[arrangement.supervision_level]}</p>
            </div>
            {arrangement.location && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Location</p>
                <p className="font-medium text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {arrangement.location}
                </p>
              </div>
            )}
            {arrangement.court_ordered && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Court ordered</p>
                <p className="font-medium text-slate-800">Yes {arrangement.court_order_reference ? `(${arrangement.court_order_reference})` : ""}</p>
              </div>
            )}
            {arrangement.review_date && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Next review</p>
                <p className="font-medium text-slate-800">{formatDate(arrangement.review_date)}</p>
              </div>
            )}
          </div>

          {/* LA approval */}
          {arrangement.contact_person && (
            <div className={cn(
              "rounded-lg p-3 text-sm",
              arrangement.contact_person.la_approved
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-red-50 border border-red-200",
            )}>
              <div className="flex items-center gap-1.5 mb-1">
                {arrangement.contact_person.la_approved
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  : <Ban className="w-3.5 h-3.5 text-red-600" />
                }
                <span className={cn(
                  "text-xs font-semibold",
                  arrangement.contact_person.la_approved ? "text-emerald-700" : "text-red-700",
                )}>
                  LA approval: {arrangement.contact_person.la_approved ? `Approved${arrangement.contact_person.approval_date ? ` (${formatDate(arrangement.contact_person.approval_date)})` : ""}` : "NOT APPROVED"}
                </span>
              </div>
              {arrangement.contact_person.notes && (
                <p className={cn(
                  "text-xs",
                  arrangement.contact_person.la_approved ? "text-emerald-800" : "text-red-800",
                )}>{arrangement.contact_person.notes}</p>
              )}
            </div>
          )}

          {/* Suspension reason */}
          {(arrangement.status === "under_review" || arrangement.status === "suspended") && arrangement.suspension_reason && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                <PauseCircle className="w-3.5 h-3.5" />
                {arrangement.status === "suspended" ? "Suspension reason" : "Review reason"}
              </p>
              <p className="text-sm text-amber-900">{arrangement.suspension_reason}</p>
            </div>
          )}

          {/* Arrangement notes */}
          {arrangement.notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Arrangement notes
              </p>
              <p className="text-sm text-blue-900">{arrangement.notes}</p>
            </div>
          )}

          {/* Stats from logs */}
          {logs.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-slate-800">{logs.length}</p>
                <p className="text-xs text-slate-500">Total sessions</p>
              </div>
              <div className={cn(
                "rounded-lg p-3 text-center",
                concernCount > 0 ? "bg-amber-50" : "bg-slate-50",
              )}>
                <p className={cn("text-xl font-bold", concernCount > 0 ? "text-amber-700" : "text-slate-800")}>{concernCount}</p>
                <p className="text-xs text-slate-500">With concerns</p>
              </div>
              <div className={cn(
                "rounded-lg p-3 text-center",
                distressCount >= 2 ? "bg-red-50" : "bg-slate-50",
              )}>
                <p className={cn("text-xl font-bold", distressCount >= 2 ? "text-red-700" : "text-slate-800")}>{distressCount}</p>
                <p className="text-xs text-slate-500">Post-contact distress</p>
              </div>
            </div>
          )}

          {/* Log entry form */}
          {!showLogForm ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLogForm(true)}
              className="h-8 text-xs w-full"
            >
              + Log a contact session
            </Button>
          ) : (
            <div className="border rounded-xl p-4 bg-slate-50 space-y-3">
              <p className="text-sm font-semibold text-slate-700">Log contact session</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Date</label>
                  <input
                    type="date"
                    className="w-full border rounded-md px-2 py-1.5 text-sm"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Outcome</label>
                  <Select value={logOutcome} onValueChange={(v) => setLogOutcome(v as ContactOutcome)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(OUTCOME_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">YP mood before</label>
                  <Select value={logMoodBefore} onValueChange={setLogMoodBefore}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {["positive","neutral","anxious","reluctant","distressed"].map((m) => (
                        <SelectItem key={m} value={m}>{moodEmoji(m)} {m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">YP mood after</label>
                  <Select value={logMoodAfter} onValueChange={setLogMoodAfter}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {["positive","settled","neutral","unsettled","distressed"].map((m) => (
                        <SelectItem key={m} value={m}>{moodEmoji(m)} {m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Contact narrative *</label>
                <Textarea
                  className="h-28 text-sm resize-none"
                  placeholder="What happened during the contact session? How did it go? Be specific about the young person's experience…"
                  value={logNarrative}
                  onChange={(e) => setLogNarrative(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Voice of the child (what did they say about the contact?)</label>
                <Textarea
                  className="h-16 text-sm resize-none"
                  placeholder="Direct quote or paraphrase of what the young person said about contact…"
                  value={logYpVoice}
                  onChange={(e) => setLogYpVoice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={logConcerns}
                    onChange={(e) => setLogConcerns(e.target.checked)}
                  />
                  <span className="text-sm text-slate-700">Concerns identified during or after contact</span>
                </label>
                {logConcerns && (
                  <Textarea
                    className="h-16 text-sm resize-none"
                    placeholder="Describe the concern…"
                    value={logConcernsDetail}
                    onChange={(e) => setLogConcernsDetail(e.target.value)}
                  />
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={logSafeguarding}
                    onChange={(e) => setLogSafeguarding(e.target.checked)}
                  />
                  <span className="text-sm text-red-700 font-medium">Safeguarding concern identified</span>
                </label>
                {logSafeguarding && (
                  <Textarea
                    className="h-16 text-sm resize-none border-red-300"
                    placeholder="Describe the safeguarding concern…"
                    value={logSafeguardingDetail}
                    onChange={(e) => setLogSafeguardingDetail(e.target.value)}
                  />
                )}
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="h-8 text-xs" onClick={submitLog} disabled={!logNarrative.trim()}>
                  Save contact log
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShowLogForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Contact log history */}
          {logs.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact history</p>
              {logs.map((log) => (
                <ContactLogCard
                  key={log.id}
                  log={log}
                  onUpdate={onUpdateLog}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Unapproved contact person banner ─────────────────────────────────────────

function UnapprovedPersonsBanner({ arrangements }: { arrangements: EnrichedArrangement[] }) {
  const unapproved = arrangements.filter(
    (a) => a.contact_person && !a.contact_person.la_approved,
  );
  if (unapproved.length === 0) return null;

  return (
    <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
      <Ban className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-red-800 text-sm">Unapproved contact person on record</p>
        <p className="text-xs text-red-700 mt-0.5">
          {unapproved.map((a) => `${a.contact_person!.name} (${a.contact_person!.relationship} — ${getYPName(a.child_id)})`).join(", ")} —
          {" "}no LA approval on file. No contact should take place until approval is confirmed.
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FamilyContactPage() {
  const { currentUser } = useAuthContext();
  const homeId = "home_oak";

  const arrangementsQuery = useContactArrangements({ homeId });
  const logsQuery         = useContactLogs({ homeId });
  const updateArrangement = useUpdateContactArrangement();
  const updateLog         = useUpdateContactLog();
  const createLog         = useCreateContactLog();

  const [filterYp, setFilterYp] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"yp" | "status" | "type" | "newest">("yp");

  const arrangements = (arrangementsQuery.data?.data ?? []) as EnrichedArrangement[];
  const logs         = (logsQuery.data?.data ?? []) as EnrichedLog[];

  // Unique YPs
  const yps = useMemo(() =>
    Array.from(new Set(arrangements.map((a) => a.child_id))),
    [arrangements]
  );

  // Filtered arrangements
  const filtered = useMemo(() => {
    let list = arrangements;
    if (filterYp !== "all") list = list.filter((a) => a.child_id !== filterYp ? false : true);
    if (filterStatus !== "all") list = list.filter((a) => a.status === filterStatus);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        getYPName(a.child_id).toLowerCase().includes(q) ||
        (a.contact_person?.name ?? "").toLowerCase().includes(q) ||
        (a.contact_person?.relationship ?? "").toLowerCase().includes(q) ||
        (a.frequency ?? "").toLowerCase().includes(q) ||
        (a.location ?? "").toLowerCase().includes(q)
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "status": {
          const order: Record<string, number> = { active: 0, under_review: 1, suspended: 2, ceased: 3 };
          return (order[a.status] ?? 9) - (order[b.status] ?? 9);
        }
        case "type": return a.contact_type.localeCompare(b.contact_type);
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "yp":
        default: return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
      }
    });

    return list;
  }, [arrangements, filterYp, filterStatus, search, sortKey]);

  // Stats
  const stats = useMemo(() => {
    const activeArrangements  = arrangements.filter((a) => a.status === "active").length;
    const suspended           = arrangements.filter((a) => a.status === "suspended").length;
    const underReview         = arrangements.filter((a) => a.status === "under_review").length;
    const courtOrdered        = arrangements.filter((a) => a.court_ordered).length;
    const concernsThisMonth   = logs.filter((l) => l.concerns_identified).length;
    const safeguardingConcerns = logs.filter((l) => l.safeguarding_concern).length;
    const totalSessions       = logs.length;
    const distressPattern     = (() => {
      const byYp: Record<string, number> = {};
      logs.forEach((l) => {
        if (l.yp_mood_after === "distressed") byYp[l.child_id] = (byYp[l.child_id] ?? 0) + 1;
      });
      return Object.values(byYp).filter((n) => n >= 2).length;
    })();
    return { activeArrangements, suspended, underReview, courtOrdered, concernsThisMonth, safeguardingConcerns, totalSessions, distressPattern };
  }, [arrangements, logs]);

  const loading = arrangementsQuery.isLoading || logsQuery.isLoading;

  return (
    <PageShell
      title="Family Contact"
      subtitle="Contact arrangements, session logs, and YP voice — Reg 13"
      ariaContext={{ pageTitle: "Family Contact", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={CONTACT_EXPORT_COLS} filename="family-contact" />
          <PrintButton title="Family Contact" subtitle="Oak House — Family Contact Log" targetId="family-contact-content" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="family-contact-content" className="space-y-6">
        <AriaPanel mode="assist" pageContext="Family Contact — Regulation 13, contact arrangements, session logs, child voice, supervised contact, letter-box contact" recordType="family_contact" userRole="registered_manager" className="mb-2" />
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { icon: PhoneCall, label: "Active", value: stats.activeArrangements, colour: "text-blue-700", bg: "bg-blue-50" },
            { icon: PauseCircle, label: "Suspended", value: stats.suspended, colour: stats.suspended > 0 ? "text-red-700" : "text-slate-500", bg: stats.suspended > 0 ? "bg-red-50" : "bg-slate-50" },
            { icon: Clock, label: "Under Review", value: stats.underReview, colour: stats.underReview > 0 ? "text-amber-700" : "text-slate-500", bg: stats.underReview > 0 ? "bg-amber-50" : "bg-slate-50" },
            { icon: CalendarDays, label: "Court Ordered", value: stats.courtOrdered, colour: "text-indigo-700", bg: "bg-indigo-50" },
            { icon: MessageSquare, label: "Total Sessions", value: stats.totalSessions, colour: "text-slate-700", bg: "bg-slate-50" },
            { icon: AlertTriangle, label: "Concerns", value: stats.concernsThisMonth, colour: stats.concernsThisMonth > 0 ? "text-orange-700" : "text-emerald-700", bg: stats.concernsThisMonth > 0 ? "bg-orange-50" : "bg-emerald-50" },
            { icon: ShieldAlert, label: "Safeguarding", value: stats.safeguardingConcerns, colour: stats.safeguardingConcerns > 0 ? "text-red-700" : "text-emerald-700", bg: stats.safeguardingConcerns > 0 ? "bg-red-50" : "bg-emerald-50" },
            { icon: Heart, label: "Distress Pattern", value: stats.distressPattern, colour: stats.distressPattern > 0 ? "text-red-700" : "text-emerald-700", bg: stats.distressPattern > 0 ? "bg-red-50" : "bg-emerald-50" },
          ].map(({ label, value, colour, bg, icon: Icon }) => (
            <div key={label} className={cn("rounded-xl border border-slate-100 p-3", bg)}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn("h-3.5 w-3.5 shrink-0", colour)} />
                <span className="text-[10px] text-slate-500 font-medium">{label}</span>
              </div>
              <div className={cn("text-lg font-bold tabular-nums", colour)}>{value}</div>
            </div>
          ))}
        </div>

        {/* Unapproved persons banner */}
        <UnapprovedPersonsBanner arrangements={arrangements} />

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by young person, contact name, relationship…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={filterYp} onValueChange={setFilterYp}>
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue placeholder="All young people" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All young people</SelectItem>
                {yps.map((id) => (
                  <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="under_review">Under review</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="ceased">Ceased</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 focus:border-blue-300 focus:ring-1 focus:ring-blue-200 outline-none"
              >
                <option value="yp">By young person</option>
                <option value="status">By status</option>
                <option value="type">By contact type</option>
                <option value="newest">Newest first</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        {(search || filterYp !== "all" || filterStatus !== "all") && (
          <p className="text-xs text-slate-500">
            Showing {filtered.length} of {arrangements.length} arrangement{arrangements.length !== 1 ? "s" : ""}
            {search && <span className="text-slate-400"> matching &ldquo;{search}&rdquo;</span>}
          </p>
        )}

        {/* Arrangements */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <PhoneCall className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No contact arrangements found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((arrangement) => {
              const arrLogs = logs.filter((l) => l.arrangement_id === arrangement.id);
              return (
                <ArrangementCard
                  key={arrangement.id}
                  arrangement={arrangement}
                  logs={arrLogs}
                  onUpdateArrangement={(id, data) => updateArrangement.mutate({ id, data })}
                  onUpdateLog={(id, data) => updateLog.mutate({ id, data })}
                  onCreateLog={(data) => createLog.mutate(data)}
                  currentUserId={currentUser?.id ?? "staff_darren"}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Care Events pipeline — family contact events routed here */}
      <CareEventsPanel
        title="Care Events — Family Contact"
        category="family_contact"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
