"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MISSING FROM CARE
// Full episode management: report, track, log return, Cara return interview.
// Statutory compliance: s.20 / Full Care Order reporting obligations.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { WritingToChildPanel } from "@/components/writing-to-child/writing-to-child-panel";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  useMissingEpisodes, useCreateMissingEpisode, useUpdateMissingEpisode,
  type PatternAnalysis,
} from "@/hooks/use-missing-episodes";
import { useYoungPeople } from "@/hooks/use-young-people";
import type { MissingEpisode } from "@/types/extended";
import { useAuthContext } from "@/contexts/auth-context";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { api } from "@/hooks/use-api";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { PrintButton } from "@/components/common/print-button";
import { EmptyState } from "@/components/ui/empty-state";
import { CaraPanel } from "@/components/cara/cara-panel";
import {
  MapPin, AlertTriangle, CheckCircle2, Clock, Shield, ChevronDown,
  ChevronUp, Plus, Sparkles, Phone, User, Calendar,
  TrendingUp, Activity, FileText, X, RotateCcw, Search, ArrowUpDown,
} from "lucide-react";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { WritingAssistantInline } from "@/components/writing-assistant/writing-assistant-inline";
import { InlinePracticeReasoning } from "@/components/cara-reasoning/inline-practice-reasoning";
import { InlinePracticeModules } from "@/components/intelligence/practice-module-panels";
import { InlineCaraHeartPanel } from "@/components/cara-heart/inline-cara-heart-panel";
import type { CaraPracticeRecord } from "@/lib/cara-heart/types";

const MFC_EXPORT_COLS: ExportColumn<MissingEpisode>[] = [
  { header: "Reference", accessor: (e) => e.reference },
  { header: "Young Person", accessor: (e) => getYPName(e.child_id) },
  { header: "Date Missing", accessor: (e) => e.date_missing },
  { header: "Time Missing", accessor: (e) => e.time_missing },
  { header: "Date Returned", accessor: (e) => e.date_returned ?? "" },
  { header: "Time Returned", accessor: (e) => e.time_returned ?? "" },
  { header: "Duration (hrs)", accessor: (e) => e.duration_hours !== null ? String(e.duration_hours) : "" },
  { header: "Risk Level", accessor: (e) => e.risk_level },
  { header: "Status", accessor: (e) => e.status },
  { header: "Last Seen Location", accessor: (e) => e.location_last_seen },
  { header: "Police Reported", accessor: (e) => e.reported_to_police ? "Yes" : "No" },
  { header: "Police Ref", accessor: (e) => e.police_reference ?? "" },
  { header: "LA Notified", accessor: (e) => e.reported_to_la ? "Yes" : "No" },
  { header: "RHI Completed", accessor: (e) => e.return_interview_completed ? "Yes" : "No" },
  { header: "CS Risk", accessor: (e) => e.contextual_safeguarding_risk ? "Yes" : "No" },
  { header: "Recorded By", accessor: (e) => getStaffName(e.created_by) },
];

// ── Config ─────────────────────────────────────────────────────────────────────

const RISK_COLOURS: Record<string, string> = {
  low:      "bg-[--cs-success-bg] text-[--cs-success] border-[--cs-success-soft]",
  medium:   "bg-[--cs-warning-bg] text-[--cs-warning] border-[--cs-warning-soft]",
  high:     "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-[--cs-risk-bg] text-[--cs-risk] border-[--cs-risk-soft]",
};

const RISK_BORDER: Record<string, string> = {
  low:      "border-[--cs-success-soft]",
  medium:   "border-[--cs-warning-soft]",
  high:     "border-orange-200",
  critical: "border-[--cs-risk-soft]",
};

const STATUS_COLOURS: Record<string, string> = {
  active:   "bg-[--cs-risk-bg] text-[--cs-risk]",
  returned: "bg-[--cs-warning-bg] text-[--cs-warning]",
  closed:   "bg-slate-100 text-[var(--cs-text-secondary)]",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function durationLabel(hours: number | null) {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Return Home Interview Result ───────────────────────────────────────────────

interface RhiResult {
  interview_summary?: string;
  child_voice_themes?: string[];
  reasons_for_going_missing?: string;
  where_they_went?: string;
  who_they_were_with?: string;
  any_harm_experienced?: string;
  exploitation_risk_indicators?: string[];
  contextual_safeguarding_factors?: string;
  risk_level_assessment?: string;
  escalation_required?: boolean;
  escalation_actions?: string[];
  child_support_needs?: string;
  what_could_help_in_future?: string;
  recommended_follow_up?: string[];
  referral_recommendations?: string[];
  suggested_interview_questions?: string[];
  staff_guidance_notes?: string;
}

// ── Episode card ───────────────────────────────────────────────────────────────

function EpisodeCard({
  episode,
  onLogReturn,
  onCompleteRHI,
}: {
  episode: MissingEpisode;
  onLogReturn: (ep: MissingEpisode) => void;
  onCompleteRHI: (ep: MissingEpisode) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const ypName = getYPName(episode.child_id);

  const awaitingRHI =
    episode.status !== "active" &&
    !episode.return_interview_completed;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white transition-all",
        RISK_BORDER[episode.risk_level] ?? "border-[var(--cs-border)]",
        episode.status === "active" && "ring-1 ring-[var(--cs-risk-soft)]"
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          episode.risk_level === "critical" || episode.risk_level === "high"
            ? "bg-[--cs-risk-bg]"
            : episode.risk_level === "medium" ? "bg-[--cs-warning-bg]" : "bg-[--cs-success-bg]"
        )}>
          <MapPin className={cn(
            "h-4.5 w-4.5",
            episode.risk_level === "critical" || episode.risk_level === "high"
              ? "text-[--cs-risk]"
              : episode.risk_level === "medium" ? "text-[--cs-warning]" : "text-[--cs-success]"
          )} style={{ width: "1.125rem", height: "1.125rem" }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[var(--cs-navy)]">{ypName}</span>
            <span className="text-[10px] font-mono text-[var(--cs-text-muted)]">{episode.reference}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge className={cn("text-[10px] h-4 px-1.5 border", RISK_COLOURS[episode.risk_level])}>
              {episode.risk_level.toUpperCase()} RISK
            </Badge>
            <Badge className={cn("text-[10px] h-4 px-1.5", STATUS_COLOURS[episode.status] ?? "")}>
              {episode.status === "active" ? "ACTIVE — MISSING" : episode.status === "returned" ? "Returned" : "Closed"}
            </Badge>
            {episode.contextual_safeguarding_risk && (
              <Badge className="text-[10px] h-4 px-1.5 bg-[--cs-risk-bg] text-[--cs-risk] border border-[--cs-risk-soft]">
                CS Risk
              </Badge>
            )}
            {awaitingRHI && (
              <Badge className="text-[10px] h-4 px-1.5 bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)]">
                RHI Outstanding
              </Badge>
            )}
            {(episode as never as { care_event_id?: string }).care_event_id && (
              <Link
                href={`/care-events/${(episode as never as { care_event_id: string }).care_event_id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-1.5 py-px text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <FileText className="h-2.5 w-2.5" />
                Care Event
              </Link>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--cs-text-muted)]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Missing: {formatDate(episode.date_missing)} {episode.time_missing && `at ${episode.time_missing}`}
            </span>
            {episode.date_returned && (
              <span className="flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                Returned: {formatDate(episode.date_returned)} {episode.time_returned && `at ${episode.time_returned}`}
              </span>
            )}
            {episode.duration_hours !== null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {durationLabel(episode.duration_hours)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {episode.status === "active" && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1 bg-amber-600 hover:bg-amber-700"
              onClick={() => onLogReturn(episode)}
            >
              <RotateCcw className="h-3 w-3" />
              Log Return
            </Button>
          )}
          {awaitingRHI && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 text-[var(--cs-cara-gold)] border-[var(--cs-cara-gold-soft)]"
              onClick={() => onCompleteRHI(episode)}
            >
              <Sparkles className="h-3 w-3" />
              Return Interview
            </Button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[var(--cs-border-subtle)] px-4 py-4 space-y-3 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
            <div>
              <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Last seen location</div>
              <p className="text-[var(--cs-text-secondary)]">{episode.location_last_seen || "—"}</p>
            </div>
            {episode.return_location && (
              <div>
                <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Return location</div>
                <p className="text-[var(--cs-text-secondary)]">{episode.return_location}</p>
              </div>
            )}
            <div>
              <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Police reported</div>
              <p className={cn("font-medium", episode.reported_to_police ? "text-orange-700" : "text-[var(--cs-text-muted)]")}>
                {episode.reported_to_police
                  ? `Yes — ${episode.police_reference ?? "ref pending"}`
                  : "No"}
              </p>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">LA notified</div>
              <p className={cn("font-medium", episode.reported_to_la ? "text-blue-700" : "text-[var(--cs-text-muted)]")}>
                {episode.reported_to_la
                  ? `Yes — ${episode.la_notified_at ? formatDate(episode.la_notified_at) : "date unknown"}`
                  : "No"}
              </p>
            </div>
          </div>

          {episode.return_interview_completed && episode.return_interview_notes && (
            <div>
              <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">
                Return interview notes ({episode.return_interview_by ? getStaffName(episode.return_interview_by) : "Unknown"} · {episode.return_interview_date ? formatDate(episode.return_interview_date) : ""})
              </div>
              <p className="text-[12px] text-[var(--cs-text-secondary)] leading-relaxed bg-white rounded-lg p-3 border border-[var(--cs-border-subtle)]">
                {episode.return_interview_notes}
              </p>
            </div>
          )}

          {episode.pattern_notes && (
            <div>
              <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Pattern notes</div>
              <p className="text-[12px] text-[var(--cs-text-secondary)] leading-relaxed">{episode.pattern_notes}</p>
            </div>
          )}

          <div className="text-[10px] text-[var(--cs-text-muted)]">
            Recorded by {getStaffName(episode.created_by)} · {formatDate(episode.created_at)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pattern row ────────────────────────────────────────────────────────────────

function PatternRow({ p }: { p: PatternAnalysis }) {
  const riskColour =
    p.highest_risk === "critical" ? "text-[--cs-risk]"
    : p.highest_risk === "high" ? "text-orange-700"
    : p.highest_risk === "medium" ? "text-[--cs-warning]"
    : "text-[--cs-success]";

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl border border-[var(--cs-border-subtle)] bg-white hover:bg-[var(--cs-surface)] transition-colors">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--cs-cara-gold-bg)]">
        <User className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-[var(--cs-navy)]">{p.child_name}</span>
          {p.contextual_risk && (
            <Badge className="text-[10px] h-4 px-1.5 bg-[--cs-risk-bg] text-[--cs-risk] border border-[--cs-risk-soft]">CS Risk</Badge>
          )}
          {p.return_interview_outstanding && (
            <Badge className="text-[10px] h-4 px-1.5 bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)]">RHI Outstanding</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-3 mt-1 text-[11px] text-[var(--cs-text-muted)]">
          <span>{p.total_episodes} episode{p.total_episodes !== 1 ? "s" : ""}</span>
          {p.avg_duration_hours > 0 && <span>avg {durationLabel(p.avg_duration_hours)}</span>}
          {p.last_episode_date && <span>last: {formatDate(p.last_episode_date)}</span>}
        </div>
      </div>
      <span className={cn("text-xs font-bold uppercase", riskColour)}>{p.highest_risk}</span>
    </div>
  );
}

// ── Report Missing Dialog ──────────────────────────────────────────────────────

function ReportMissingDialog({
  open, onClose,
}: { open: boolean; onClose: () => void }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const ypQuery = useYoungPeople("current");
  const youngPeople = ypQuery.data?.data ?? [];
  const createMutation = useCreateMissingEpisode();

  const [childId, setChildId] = useState("");
  const [dateMissing, setDateMissing] = useState(todayStr());
  const [timeMissing, setTimeMissing] = useState("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [locationLastSeen, setLocationLastSeen] = useState("");
  const [reportedToPolice, setReportedToPolice] = useState(false);
  const [policeRef, setPoliceRef] = useState("");
  const [reportedToLA, setReportedToLA] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSubmit = !!childId && !!dateMissing && !!riskLevel;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await createMutation.mutateAsync({
        child_id: childId,
        date_missing: dateMissing,
        time_missing: timeMissing || "00:00",
        risk_level: riskLevel,
        location_last_seen: locationLastSeen,
        reported_to_police: reportedToPolice,
        police_reference: policeRef || null,
        reported_to_la: reportedToLA,
        la_notified_at: reportedToLA ? new Date().toISOString() : null,
        home_id: homeId,
        created_by: currentUser?.id ?? "staff_darren",
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-[--cs-risk]" />
            Report Missing from Care
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Young Person *</label>
            <Select value={childId} onValueChange={setChildId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select young person…" /></SelectTrigger>
              <SelectContent>
                {youngPeople.map((yp) => (
                  <SelectItem key={yp.id} value={yp.id}>
                    {yp.preferred_name ?? yp.first_name} {yp.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {childId && <InlinePracticeReasoning childId={childId} childName={youngPeople.find((y) => y.id === childId)?.preferred_name ?? childId} />}
          {childId && <InlinePracticeModules childId={childId} modules={["safe", "relationships"]} />}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Date Missing *</label>
              <Input type="date" className="mt-1" value={dateMissing} onChange={(e) => setDateMissing(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Time</label>
              <Input type="time" className="mt-1" value={timeMissing} onChange={(e) => setTimeMissing(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Risk Level *</label>
            <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as typeof riskLevel)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Last seen location</label>
            <Input className="mt-1" placeholder="e.g. Outside Chamberlain House — said going to shop" value={locationLastSeen} onChange={(e) => setLocationLastSeen(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={reportedToPolice} onChange={(e) => setReportedToPolice(e.target.checked)} className="rounded" />
              <span className="text-sm text-[var(--cs-text-secondary)]">Reported to police</span>
            </label>
            {reportedToPolice && (
              <Input placeholder="Police reference number" value={policeRef} onChange={(e) => setPoliceRef(e.target.value)} />
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={reportedToLA} onChange={(e) => setReportedToLA(e.target.checked)} className="rounded" />
              <span className="text-sm text-[var(--cs-text-secondary)]">Local Authority notified</span>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!canSubmit || saving}
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700"
          >
            {saving ? "Saving…" : "Report Missing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Log Return Dialog ──────────────────────────────────────────────────────────

function LogReturnDialog({
  episode, onClose,
}: { episode: MissingEpisode | null; onClose: () => void }) {
  const updateMutation = useUpdateMissingEpisode();
  const [dateReturned, setDateReturned] = useState(todayStr());
  const [timeReturned, setTimeReturned] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  const [csRisk, setCsRisk] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!episode) return null;

  const ypName = getYPName(episode.child_id);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: episode.id,
        date_returned: dateReturned,
        time_returned: timeReturned || null,
        return_location: returnLocation || null,
        contextual_safeguarding_risk: csRisk,
        status: "returned",
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <RotateCcw className="h-4 w-4 text-[--cs-warning]" />
            Log Return — {ypName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg bg-[--cs-warning-bg] border border-[--cs-warning-soft] p-3 text-xs text-[--cs-warning]">
            Missing since {formatDate(episode.date_missing)} {episode.time_missing && `at ${episode.time_missing}`} · {episode.reference}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Date returned</label>
              <Input type="date" className="mt-1" value={dateReturned} onChange={(e) => setDateReturned(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Time returned</label>
              <Input type="time" className="mt-1" value={timeReturned} onChange={(e) => setTimeReturned(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Return location</label>
            <Input className="mt-1" placeholder="e.g. Home voluntarily / Town centre collected by staff" value={returnLocation} onChange={(e) => setReturnLocation(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={csRisk} onChange={(e) => setCsRisk(e.target.checked)} className="rounded" />
            <span className="text-sm text-[var(--cs-text-secondary)]">Contextual safeguarding risk identified</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Log Return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Return Home Interview Dialog ───────────────────────────────────────────────

function RhiDialog({
  episode, onClose,
}: { episode: MissingEpisode | null; onClose: () => void }) {
  const { currentUser } = useAuthContext();
  const updateMutation = useUpdateMissingEpisode();

  const [generating, setGenerating] = useState(false);
  const [rhiResult, setRhiResult] = useState<RhiResult | null>(null);
  const [interviewNotes, setInterviewNotes] = useState("");
  const [context, setContext] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const rhiHeartRecord = useMemo<CaraPracticeRecord | null>(() => {
    if (!episode || interviewNotes.length < 30) return null;
    return {
      id: "draft",
      childId: episode.child_id,
      type: "missing_episode",
      dateTime: new Date().toISOString(),
      severity: ({ low: 2, medium: 3, high: 4, critical: 5 } as Record<string, number>)[episode.risk_level] as 1|2|3|4|5 ?? 3,
      description: interviewNotes,
      missingFromCare: true,
      policeCalled: episode.reported_to_police,
    };
  }, [interviewNotes, episode]);

  if (!episode) return null;
  const ypName = getYPName(episode.child_id);

  const generateRHI = async () => {
    setGenerating(true);
    setRhiResult(null);
    try {
      const sourceContent = [
        `Young person: ${ypName}`,
        `Episode reference: ${episode.reference}`,
        `Date missing: ${episode.date_missing} ${episode.time_missing ?? ""}`,
        `Date returned: ${episode.date_returned ?? "today"} ${episode.time_returned ?? ""}`,
        `Duration: ${durationLabel(episode.duration_hours)}`,
        `Risk level: ${episode.risk_level}`,
        `Last seen location: ${episode.location_last_seen ?? "Unknown"}`,
        `Return location: ${episode.return_location ?? "Unknown"}`,
        `Contextual safeguarding risk: ${episode.contextual_safeguarding_risk ? "Yes — flagged" : "Not flagged"}`,
        `Police reported: ${episode.reported_to_police ? `Yes — ${episode.police_reference ?? "ref pending"}` : "No"}`,
        `LA notified: ${episode.reported_to_la ? "Yes" : "No"}`,
        `Pattern notes: ${episode.pattern_notes ?? "None"}`,
        context ? `\nAdditional context from staff:\n${context}` : "",
      ].filter(Boolean).join("\n");

      const res = await api.post<{ data: { parsed?: RhiResult } }>("/cara", {
        mode: "return_home_interview",
        style: "safeguarding_focused",
        source_content: sourceContent,
        page_context: "Missing from Care — Return Home Interview",
        record_type: "missing_episode",
        user_role: "manager",
      });
      setRhiResult(res.data?.parsed ?? null);
    } catch {
      setRhiResult({ interview_summary: "Failed to generate. Please try again." });
    } finally {
      setGenerating(false);
    }
  };

  const saveInterview = async () => {
    if (!interviewNotes.trim()) return;
    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: episode.id,
        return_interview_completed: true,
        return_interview_by: currentUser?.id ?? "staff_darren",
        return_interview_date: todayStr(),
        return_interview_notes: interviewNotes,
        contextual_safeguarding_risk:
          episode.contextual_safeguarding_risk ||
          (rhiResult?.escalation_required ?? false) ||
          (rhiResult?.risk_level_assessment === "critical" || rhiResult?.risk_level_assessment === "high"),
        status: "closed",
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            Return Home Interview — {ypName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Episode summary */}
          <div className="rounded-lg bg-slate-50 border border-[var(--cs-border-subtle)] p-3 text-xs text-[var(--cs-text-secondary)] grid grid-cols-2 gap-2">
            <span><strong>Reference:</strong> {episode.reference}</span>
            <span><strong>Risk:</strong> <span className="font-semibold uppercase">{episode.risk_level}</span></span>
            <span><strong>Duration:</strong> {durationLabel(episode.duration_hours)}</span>
            <span><strong>CS Risk:</strong> {episode.contextual_safeguarding_risk ? "Yes — flagged" : "Not flagged"}</span>
          </div>

          {/* Context input */}
          {!rhiResult && (
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">
                Additional context for Cara (optional)
              </label>
              <Textarea
                className="mt-1 text-sm"
                rows={3}
                placeholder="Any observations, what the young person said on return, known contacts, concerns…"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
              <Button
                className="mt-2 gap-1.5"
                onClick={generateRHI}
                disabled={generating}
              >
                <Sparkles className="h-4 w-4" />
                {generating ? "Cara is preparing the interview…" : "Generate Return Home Interview with Cara"}
              </Button>
            </div>
          )}

          {/* Cara Result */}
          {rhiResult && (
            <div className="space-y-4">
              {rhiResult.escalation_required && (
                <div className="flex items-start gap-2 rounded-xl bg-[--cs-risk-bg] border border-[--cs-risk-soft] p-3">
                  <AlertTriangle className="h-4 w-4 text-[--cs-risk] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-[--cs-risk]">Escalation Required</p>
                    {(rhiResult.escalation_actions ?? []).map((a, i) => (
                      <p key={i} className="text-xs text-[--cs-risk] mt-0.5">{a}</p>
                    ))}
                  </div>
                </div>
              )}

              {rhiResult.suggested_interview_questions && rhiResult.suggested_interview_questions.length > 0 && (
                <div className="rounded-xl border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] p-4">
                  <div className="text-[11px] font-semibold text-[var(--cs-cara-gold)] uppercase tracking-wide mb-2">
                    Suggested Interview Questions
                  </div>
                  <ol className="space-y-1.5">
                    {rhiResult.suggested_interview_questions.map((q, i) => (
                      <li key={i} className="flex gap-2 text-sm text-[var(--cs-navy)]">
                        <span className="text-[var(--cs-text-muted)] shrink-0 font-semibold">{i + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {rhiResult.interview_summary && (
                <div>
                  <div className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Cara Summary</div>
                  <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed">{rhiResult.interview_summary}</p>
                </div>
              )}

              {rhiResult.exploitation_risk_indicators && rhiResult.exploitation_risk_indicators.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-orange-600 uppercase tracking-wide mb-1">Exploitation Risk Indicators</div>
                  <ul className="space-y-1">
                    {rhiResult.exploitation_risk_indicators.map((r, i) => (
                      <li key={i} className="text-sm text-orange-700 flex gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {rhiResult.child_support_needs && (
                <div>
                  <div className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Child Support Needs</div>
                  <p className="text-sm text-[var(--cs-text-secondary)]">{rhiResult.child_support_needs}</p>
                </div>
              )}

              {rhiResult.recommended_follow_up && rhiResult.recommended_follow_up.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Recommended Follow-Up</div>
                  <ul className="space-y-1">
                    {rhiResult.recommended_follow_up.map((a, i) => (
                      <li key={i} className="text-sm text-[var(--cs-text-secondary)] flex gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[--cs-success] mt-0.5 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {rhiResult.staff_guidance_notes && (
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                  <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1">Staff Guidance</div>
                  <p className="text-xs text-blue-800">{rhiResult.staff_guidance_notes}</p>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1"
                onClick={() => { setRhiResult(null); setContext(""); }}
              >
                <RotateCcw className="h-3 w-3" />
                Re-generate
              </Button>
            </div>
          )}

          {/* Interview notes */}
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">
              Interview Notes *
            </label>
            <Textarea
              className="mt-1 text-sm"
              rows={4}
              placeholder="Record what the young person said, their demeanour, disclosures, and your observations…"
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
            />
            <WritingAssistantInline
              value={interviewNotes}
              onApplyText={setInterviewNotes}
              recordType="return_interview"
              fieldName="interview_notes"
              childId={episode.child_id}
              mode="safeguarding"
            />
          </div>

          {/* Cara Heart — missing episode practice reflection */}
          <InlineCaraHeartPanel record={rhiHeartRecord} />

          {saved && (
            <div className="flex items-center gap-2 rounded-lg bg-[--cs-success-bg] border border-[--cs-success-soft] p-3">
              <CheckCircle2 className="h-4 w-4 text-[--cs-success]" />
              <span className="text-sm text-[--cs-success] font-medium">Return interview completed and saved.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {saved ? "Close" : "Cancel"}
          </Button>
          {!saved && (
            <Button
              disabled={!interviewNotes.trim() || saving}
              onClick={saveInterview}
            >
              {saving ? "Saving…" : "Save Interview & Close Episode"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Stat chip ──────────────────────────────────────────────────────────────────

function StatChip({
  label, value, colour, bg,
}: { label: string; value: number | string; colour: string; bg: string }) {
  return (
    <div className={cn("rounded-xl border border-[var(--cs-border-subtle)] p-4 text-center", bg)}>
      <div className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</div>
      <div className="text-[10px] text-[var(--cs-text-muted)] mt-0.5 leading-tight">{label}</div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MissingFromCarePage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "risk" | "yp" | "duration">("date");
  const [showReport, setShowReport] = useState(false);
  const [logReturnEp, setLogReturnEp] = useState<MissingEpisode | null>(null);
  const [rhiEp, setRhiEp] = useState<MissingEpisode | null>(null);

  const { data, isLoading } = useMissingEpisodes({ homeId, status: statusFilter });
  const episodes: MissingEpisode[] = data?.data ?? [];
  const meta = data?.meta;
  const patterns: PatternAnalysis[] = data?.pattern_analysis ?? [];

  // Search + sort filtered episodes
  const filteredEpisodes = useMemo(() => {
    let result = episodes;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter((e) => {
        const ypName = getYPName(e.child_id);
        const createdBy = e.created_by ? getStaffName(e.created_by) : "";
        const location = e.location_last_seen ?? "";
        const riskLevel = e.risk_level ?? "";
        const notes = e.pattern_notes ?? "";
        const ref = e.reference ?? "";
        const haystack = `${ypName} ${createdBy} ${location} ${riskLevel} ${notes} ${ref}`.toLowerCase();
        return haystack.includes(q);
      });
    }
    const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "risk": return (riskOrder[a.risk_level] ?? 4) - (riskOrder[b.risk_level] ?? 4);
        case "yp": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "duration": return (b.duration_hours ?? 0) - (a.duration_hours ?? 0);
        default: return b.date_missing.localeCompare(a.date_missing);
      }
    });
  }, [episodes, search, sortBy]);

  // Derived (from filtered)
  const activeEpisodes = filteredEpisodes.filter((e) => e.status === "active");
  const awaitingRHI = filteredEpisodes.filter((e) => e.status !== "active" && !e.return_interview_completed);
  const closedEpisodes = filteredEpisodes.filter((e) => e.status === "closed" && e.return_interview_completed);
  const isSearchActive = search.trim() !== "";

  const highRiskPatterns = patterns.filter(
    (p) => p.total_episodes >= 3 || p.contextual_risk
  );

  return (
    <PageShell
      title="Missing from Care"
      subtitle="Track missing episodes, return home interviews, and contextual safeguarding risks"
      caraContext={{ pageTitle: "Missing from Care", sourceType: "incident" }}
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Missing from Care Log" subtitle="Chamberlain House — Missing Episodes & Return Interviews" targetId="mfc-content" />
          <SmartUploadButton variant="inline" label="Upload Document" uploadContext="Missing From Care — return interview or episode upload" />
          <CaraStudioQuickActionButton context={{ record_type: "missing_from_care", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="mfc-content" className="space-y-6 animate-fade-in max-w-5xl">

        <CaraPanel
          mode="assist"
          pageContext="Missing from Care — episode tracking, return home interviews, contextual safeguarding"
          recordType="missing_episode"
          userRole="registered_manager"
          className="mb-2"
        />

        {/* Active alert banner */}
        {activeEpisodes.length > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-4">
            <MapPin className="h-5 w-5 text-[--cs-risk] shrink-0 animate-pulse" />
            <div>
              <p className="text-sm font-bold text-[--cs-risk]">
                {activeEpisodes.length} young person{activeEpisodes.length !== 1 ? "s are" : " is"} currently missing
              </p>
              <p className="text-xs text-[--cs-risk] mt-0.5">
                {activeEpisodes.map((e) => getYPName(e.child_id)).join(", ")}
              </p>
            </div>
            <Button
              size="sm"
              className="ml-auto bg-red-600 hover:bg-red-700 h-8 text-xs gap-1 shrink-0"
              onClick={() => setStatusFilter("active")}
            >
              View Active
            </Button>
          </div>
        )}

        {/* RHI outstanding banner */}
        {awaitingRHI.length > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] p-4">
            <FileText className="h-5 w-5 text-[var(--cs-cara-gold)] shrink-0" />
            <p className="text-sm font-semibold text-[var(--cs-cara-gold)]">
              {awaitingRHI.length} return home interview{awaitingRHI.length !== 1 ? "s" : ""} outstanding
            </p>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto text-[var(--cs-cara-gold)] border-[var(--cs-cara-gold-soft)] h-8 text-xs shrink-0"
              onClick={() => setStatusFilter("all")}
            >
              Review
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatChip label="Total episodes" value={meta?.total ?? 0} colour="text-[var(--cs-text-secondary)]" bg="bg-slate-50" />
          <StatChip label="Active / missing" value={meta?.active ?? 0} colour={meta?.active ? "text-[--cs-risk]" : "text-[var(--cs-text-muted)]"} bg={meta?.active ? "bg-[--cs-risk-bg]" : "bg-slate-50"} />
          <StatChip label="CS risk episodes" value={meta?.contextual_risk ?? 0} colour={meta?.contextual_risk ? "text-orange-700" : "text-[var(--cs-text-muted)]"} bg={meta?.contextual_risk ? "bg-orange-50" : "bg-slate-50"} />
          <StatChip label="RHI outstanding" value={meta?.unresolved ?? 0} colour={meta?.unresolved ? "text-[var(--cs-cara-gold)]" : "text-[var(--cs-text-muted)]"} bg={meta?.unresolved ? "bg-[var(--cs-cara-gold-bg)]" : "bg-slate-50"} />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by young person, location, risk level…"
              className="pl-9 h-9 text-sm rounded-xl"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {(["all", "active", "closed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                  statusFilter === s
                    ? "bg-white shadow-sm text-[var(--cs-navy)]"
                    : "text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]"
                )}
              >
                {s === "active" ? "Active (missing)" : s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)]">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-[var(--cs-border)] bg-white px-2 py-1.5 text-xs text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-emerald-300"
            >
              <option value="date">Date Missing</option>
              <option value="risk">Risk Level</option>
              <option value="yp">Young Person</option>
              <option value="duration">Duration</option>
            </select>
          </div>
          <ExportButton data={filteredEpisodes} columns={MFC_EXPORT_COLS} filename="missing-from-care" />
          <div className="ml-auto">
            <Button
              size="sm"
              className="gap-1.5 bg-red-600 hover:bg-red-700"
              onClick={() => setShowReport(true)}
            >
              <Plus className="h-4 w-4" />
              Report Missing
            </Button>
          </div>
        </div>

        {/* Results count */}
        {isSearchActive && (
          <div className="text-xs text-[var(--cs-text-muted)]">
            Showing {filteredEpisodes.length} of {episodes.length} episode{episodes.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* Episode list */}
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredEpisodes.length === 0 ? (
          <EmptyState
            icon={isSearchActive ? Search : MapPin}
            title={isSearchActive ? "No episodes match your search" : "No missing episodes found"}
            description={
              isSearchActive
                ? "Try adjusting your search terms"
                : statusFilter === "active"
                ? "No young people are currently reported missing."
                : "No episodes match the current filter."
            }
            compact
          />
        ) : (
          <div className="space-y-3">
            {/* Active episodes first */}
            {activeEpisodes.length > 0 && (
              <>
                <div className="text-[11px] font-semibold text-[--cs-risk] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  Currently Missing ({activeEpisodes.length})
                </div>
                {activeEpisodes.map((ep) => (
                  <EpisodeCard key={ep.id} episode={ep} onLogReturn={setLogReturnEp} onCompleteRHI={setRhiEp} />
                ))}
              </>
            )}

            {/* Awaiting RHI */}
            {awaitingRHI.length > 0 && statusFilter !== "active" && (
              <>
                <div className="text-[11px] font-semibold text-[var(--cs-cara-gold)] uppercase tracking-wider flex items-center gap-1.5 pt-2">
                  <FileText className="h-3.5 w-3.5" />
                  Awaiting Return Interview ({awaitingRHI.length})
                </div>
                {awaitingRHI.map((ep) => (
                  <EpisodeCard key={ep.id} episode={ep} onLogReturn={setLogReturnEp} onCompleteRHI={setRhiEp} />
                ))}
              </>
            )}

            {/* Closed */}
            {closedEpisodes.length > 0 && statusFilter !== "active" && (
              <>
                <div className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-1.5 pt-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Closed Episodes ({closedEpisodes.length})
                </div>
                {closedEpisodes.map((ep) => (
                  <EpisodeCard key={ep.id} episode={ep} onLogReturn={setLogReturnEp} onCompleteRHI={setRhiEp} />
                ))}
              </>
            )}
          </div>
        )}

        {/* Pattern Analysis */}
        {patterns.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <TrendingUp className="h-3.5 w-3.5" />
              Pattern Analysis
            </div>
            <div className="space-y-2">
              {(highRiskPatterns.length > 0 ? highRiskPatterns : patterns).map((p) => (
                <PatternRow key={p.child_id} p={p} />
              ))}
            </div>
            {highRiskPatterns.length > 0 && (
              <p className="text-[11px] text-[var(--cs-text-muted)] mt-2">
                Showing {highRiskPatterns.length} high-risk pattern{highRiskPatterns.length !== 1 ? "s" : ""} (3+ episodes or CS risk flagged).
              </p>
            )}
          </div>
        )}

        {/* Statutory reminder */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-800">
            <strong className="text-blue-900">Statutory obligations:</strong> Every missing episode must be reported to the
            Responsible Individual and the placing Local Authority within the timescales set out in the placement plan.
            A Return Home Interview must be completed for every episode where the young person is returned or found.
            High risk episodes require immediate police notification. Contextual safeguarding concerns must trigger a
            strategy discussion.
          </div>
        </div>

      </div>

      {/* Dialogs */}
      <ReportMissingDialog open={showReport} onClose={() => setShowReport(false)} />
      <LogReturnDialog episode={logReturnEp} onClose={() => setLogReturnEp(null)} />
      <RhiDialog episode={rhiEp} onClose={() => setRhiEp(null)} />

      {/* Care Events pipeline — missing episode events routed here */}
      <CareEventsPanel
        title="Care Events — Missing Episodes"
        category="missing_episode"
        days={90}
        defaultCollapsed
      />
      <div className="mt-4">
        <WritingToChildPanel defaultRecordType="missing_episode" showRecordTypeSelect={false} showAdvanced={false} title="Writing to the Child — check this return record" />
      </div>
    </PageShell>
  );
}
