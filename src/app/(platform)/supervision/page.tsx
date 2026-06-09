"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { PageGuidance } from "@/components/ui/page-guidance";
import { AriaPracticePanel } from "@/components/aria-practice/aria-practice-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  MessageSquare, Plus, CheckCircle2, AlertTriangle, Clock,
  Calendar, Target, Award, Smile, Meh, Frown, UserCheck,
  ClipboardList, Filter, X, Loader2, Sparkles, Brain, ChevronDown, ChevronUp,
  Search, BarChart3, Heart, ArrowUpDown,
} from "lucide-react";
import { getStaffName } from "@/lib/seed-data";
import { useStaff } from "@/hooks/use-staff";
import { cn, formatDate, daysFromNow, todayStr } from "@/lib/utils";
import { useSupervisions, useCreateSupervision, useUpdateSupervision } from "@/hooks/use-supervision";
import { useAuthContext } from "@/contexts/auth-context";
import { useCreateTrainingNeed } from "@/hooks/use-ri-learning";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { api } from "@/hooks/use-api";
import type { Supervision, SupervisionAction } from "@/types";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

type Tab = "supervision" | "probation" | "appraisals" | "goals";

const SUPERVISION_EXPORT_COLS: ExportColumn<Supervision>[] = [
  { header: "Staff", accessor: (s) => getStaffName(s.staff_id) },
  { header: "Supervisor", accessor: (s) => getStaffName(s.supervisor_id) },
  { header: "Scheduled Date", accessor: (s) => s.scheduled_date },
  { header: "Actual Date", accessor: (s) => s.actual_date },
  { header: "Type", accessor: (s) => s.type.replace(/_/g, " ") },
  { header: "Status", accessor: (s) => s.status },
  { header: "Discussion", accessor: (s) => s.discussion_points },
  { header: "Actions", accessor: (s) => s.actions_agreed.map((a) => a.description).join("; ") },
  { header: "Next Due", accessor: (s) => s.next_date },
];

// ── Static reference data (uses real staff IDs from seed) ────────────────────

const APPRAISALS = [
  { staffId: "staff_ryan",     date: daysFromNow(-90),  rating: "effective",   completedBy: "staff_darren", nextDue: daysFromNow(275), objectives: 4, achieved: 3 },
  { staffId: "staff_anna",     date: daysFromNow(-180), rating: "developing",  completedBy: "staff_ryan",   nextDue: daysFromNow(185), objectives: 3, achieved: 2 },
  { staffId: "staff_chervelle",date: null,              rating: null,          completedBy: null,           nextDue: daysFromNow(30),  objectives: 0, achieved: 0 },
  { staffId: "staff_edward",   date: daysFromNow(-200), rating: "exceptional", completedBy: "staff_darren", nextDue: daysFromNow(165), objectives: 5, achieved: 5 },
  { staffId: "staff_diane",    date: null,              rating: null,          completedBy: null,           nextDue: daysFromNow(150), objectives: 0, achieved: 0 },
];

const GOALS = [
  { id: "g1", staffId: "staff_ryan",      title: "Complete Level 4 Diploma Unit 5",                        targetDate: daysFromNow(60),  progress: 65,  status: "in_progress" },
  { id: "g2", staffId: "staff_ryan",      title: "Lead three house meetings independently",                 targetDate: daysFromNow(30),  progress: 100, status: "achieved" },
  { id: "g3", staffId: "staff_anna",      title: "Improve medication recording accuracy",                   targetDate: daysFromNow(45),  progress: 80,  status: "in_progress" },
  { id: "g4", staffId: "staff_edward",    title: "Mentor new bank staff member",                            targetDate: daysFromNow(14),  progress: 40,  status: "in_progress" },
  { id: "g5", staffId: "staff_chervelle", title: "Complete Child Sexual Exploitation awareness training",   targetDate: daysFromNow(-10), progress: 0,   status: "overdue" },
  { id: "g6", staffId: "staff_diane",     title: "Complete induction training portfolio",                   targetDate: daysFromNow(20),  progress: 55,  status: "in_progress" },
  { id: "g7", staffId: "staff_lackson",   title: "NVQ Level 3 Children and Young People",                   targetDate: daysFromNow(90),  progress: 30,  status: "in_progress" },
  { id: "g8", staffId: "staff_mirela",    title: "Lead a risk assessment review independently",             targetDate: daysFromNow(28),  progress: 50,  status: "in_progress" },
];

const PROBATION = [
  { staffId: "staff_diane",    startDate: daysFromNow(-90), endDate: daysFromNow(90),   status: "active", reviews: 1, nextReview: daysFromNow(30), concerns: ["Timekeeping — discussed 14 March"] },
  { staffId: "staff_mirela",   startDate: daysFromNow(-60), endDate: daysFromNow(120),  status: "active", reviews: 1, nextReview: daysFromNow(60), concerns: [] },
  { staffId: "staff_anna",     startDate: daysFromNow(-400), endDate: daysFromNow(-220), status: "passed", reviews: 2, nextReview: null, concerns: [] },
];

const RATING_COLORS: Record<string, string> = {
  exceptional: "bg-emerald-100 text-emerald-700",
  effective: "bg-blue-100 text-blue-700",
  developing: "bg-amber-100 text-amber-700",
  requires_support: "bg-red-100 text-red-700",
};

function WellbeingIcon({ score }: { score: number | null }) {
  if (score === null) return <span className="text-[var(--cs-text-muted)] text-xs">—</span>;
  if (score >= 7) return <Smile className="h-4 w-4 text-emerald-500" />;
  if (score >= 5) return <Meh className="h-4 w-4 text-amber-500" />;
  return <Frown className="h-4 w-4 text-red-500" />;
}

// ── Record Supervision dialog ─────────────────────────────────────────────────
function RecordSupervisionDialog({ sup, onClose }: { sup: Supervision; onClose: () => void }) {
  const [discussionPoints, setDiscussionPoints] = useState(sup.discussion_points || "");
  const [wellbeing, setWellbeing] = useState<number>(sup.wellbeing_score ?? 7);
  const [duration, setDuration] = useState<string>(sup.duration_minutes ? String(sup.duration_minutes) : "60");
  const [newAction, setNewAction] = useState("");
  const [actions, setActions] = useState<SupervisionAction[]>(sup.actions_agreed ?? []);
  const [staffSigned, setStaffSigned] = useState(sup.staff_signature ?? false);
  const [supervisorSigned, setSupervisorSigned] = useState(sup.supervisor_signature ?? false);
  const updateMutation = useUpdateSupervision();

  const addAction = () => {
    if (!newAction.trim()) return;
    setActions((prev) => [...prev, {
      id: `act_${Date.now()}`,
      description: newAction.trim(),
      due_date: daysFromNow(14),
      status: "pending",
      owner: "",
      completed_at: null,
    }]);
    setNewAction("");
  };

  const removeAction = (id: string) => setActions((prev) => prev.filter((a) => a.id !== id));

  const handleSave = (markComplete: boolean) => {
    updateMutation.mutate(
      {
        id: sup.id,
        discussion_points: discussionPoints,
        wellbeing_score: wellbeing,
        duration_minutes: parseInt(duration) || null,
        actions_agreed: actions,
        staff_signature: staffSigned,
        supervisor_signature: supervisorSigned,
        actual_date: sup.actual_date ?? new Date().toISOString().split("T")[0],
        ...(markComplete ? { status: "completed" } : {}),
      },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-[var(--cs-shadow-elevated)] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-[var(--cs-border-subtle)] px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-base font-bold text-[var(--cs-navy)]">Record Supervision</p>
            <p className="text-xs text-[var(--cs-text-muted)]">
              {sup.type.replace(/_/g, " ")} · {formatDate(sup.scheduled_date)}
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Discussion points */}
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Discussion Points & Notes</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-[var(--cs-border)] bg-slate-50 px-3 py-2.5 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              rows={6}
              placeholder="Record key discussion points, concerns raised, reflections, and any significant matters discussed…"
              value={discussionPoints}
              onChange={(e) => setDiscussionPoints(e.target.value)}
            />
          </div>

          {/* Wellbeing + duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">
                Wellbeing Score: <span className="text-[var(--cs-navy)]">{wellbeing}/10</span>
              </label>
              <input
                type="range" min={1} max={10} step={1}
                value={wellbeing}
                onChange={(e) => setWellbeing(Number(e.target.value))}
                className="mt-2 w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-[var(--cs-text-muted)] mt-0.5">
                <span>1 (Low)</span><span>10 (High)</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Duration (minutes)</label>
              <Input
                type="number"
                className="mt-1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
                min="15"
                max="180"
              />
            </div>
          </div>

          {/* Actions agreed */}
          <div>
            <label className="text-xs font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wide">Actions Agreed</label>
            <div className="mt-2 space-y-2">
              {actions.map((action) => (
                <div key={action.id} className="flex items-center gap-2 rounded-lg bg-slate-50 border border-[var(--cs-border-subtle)] px-3 py-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-xs text-[var(--cs-text-secondary)] flex-1">{action.description}</span>
                  <button onClick={() => removeAction(action.id)} className="text-[var(--cs-text-gentle)] hover:text-red-500 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  className="text-sm flex-1"
                  placeholder="Add action…"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAction()}
                />
                <Button size="sm" variant="outline" onClick={addAction} className="shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={staffSigned} onChange={(e) => setStaffSigned(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
              <span className="text-sm text-[var(--cs-text-secondary)]">Staff signed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={supervisorSigned} onChange={(e) => setSupervisorSigned(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-blue-600" />
              <span className="text-sm text-[var(--cs-text-secondary)]">Supervisor signed</span>
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-[var(--cs-border-subtle)] px-6 py-4 flex gap-2">
          <Button
            onClick={() => handleSave(true)}
            disabled={!discussionPoints.trim() || updateMutation.isPending}
            className="flex-1 gap-1.5"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {updateMutation.isPending ? "Saving…" : "Complete Supervision"}
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={updateMutation.isPending}>
            Save Draft
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}

// ── Supervision card ───────────────────────────────────────────────────────────
function SupervisionCard({ sup }: { sup: Supervision }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const router = useRouter();
  const [recording, setRecording] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [needCreated, setNeedCreated] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const cardStaffQuery = useStaff();
  const cardAllStaff = cardStaffQuery.data?.data ?? [];
  const staff = cardAllStaff.find((s) => s.id === sup.staff_id);
  const supervisor = cardAllStaff.find((s) => s.id === sup.supervisor_id);
  const createNeed = useCreateTrainingNeed();

  const statusConfig = {
    completed:   { label: "Completed",   color: "bg-emerald-100 text-emerald-700" },
    scheduled:   { label: "Scheduled",   color: "bg-blue-100 text-blue-700"      },
    cancelled:   { label: "Cancelled",   color: "bg-slate-100 text-[var(--cs-text-muted)]"    },
    rescheduled: { label: "Rescheduled", color: "bg-amber-100 text-amber-700"    },
  }[sup.status] ?? { label: sup.status, color: "bg-slate-100 text-[var(--cs-text-secondary)]" };

  const typeLabel: Record<string, string> = {
    formal: "Formal Supervision", informal: "Informal Check-in",
    group: "Group Supervision", reflective_practice: "Reflective Practice",
    probation_review: "Probation Review",
  };

  const pendingActions = sup.actions_agreed.filter((a) => a.status === "pending");

  const extractTrainingNeeds = async () => {
    if (!sup.discussion_points) return;
    setExtracting(true);
    try {
      const res = await api.post<{ data: { parsed?: { needs?: Array<{ title: string; description: string; priority: string; need_type: string }> } } }>(
        "/aria",
        {
          mode: "training_needs_analysis",
          style: "professional_formal",
          source_content: `Supervision record for ${staff?.full_name ?? "staff member"}. Discussion points: ${sup.discussion_points}. Actions agreed: ${sup.actions_agreed.map((a) => a.description).join(", ") || "none"}.`,
          page_context: "Supervision — Training Need Extraction",
          record_type: "training_need",
          user_role: "registered_manager",
        }
      );
      const needs = res.data?.parsed?.needs ?? [];
      if (needs.length > 0) {
        const first = needs[0];
        createNeed.mutate(
          {
            home_id: homeId,
            identified_by: "supervision",
            need_type: first.need_type ?? "safeguarding",
            title: first.title,
            description: first.description,
            priority: (first.priority as "urgent" | "high" | "medium" | "low") ?? "medium",
            status: "identified",
            aria_evidence: `Extracted from supervision with ${staff?.full_name ?? "staff"} on ${formatDate(sup.scheduled_date)}.`,
            created_by: currentUser?.id ?? "staff_darren",
          },
          { onSuccess: () => setNeedCreated(true) }
        );
      }
    } catch { /* ignore */ } finally {
      setExtracting(false);
    }
  };

  return (
    <>
      {recording && <RecordSupervisionDialog sup={sup} onClose={() => setRecording(false)} />}
      <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 space-y-3 hover:shadow-md transition-all">
        <div className="flex items-start gap-3">
          <Avatar name={staff?.full_name || "?"} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[var(--cs-navy)]">{staff?.full_name}</span>
              <Badge className={cn("text-[9px] rounded-full", statusConfig.color)}>{statusConfig.label}</Badge>
              {sup.type === "probation_review" && (
                <Badge className="text-[9px] rounded-full bg-purple-100 text-purple-700">Probation</Badge>
              )}
            </div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">
              {typeLabel[sup.type] ?? sup.type} · {formatDate(sup.scheduled_date)}
            </div>
            <div className="text-xs text-[var(--cs-text-muted)]">
              With {supervisor?.first_name || "?"} · {sup.duration_minutes ? `${sup.duration_minutes} mins` : "Scheduled"}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {sup.wellbeing_score !== null && (
              <div className="flex items-center gap-1 text-xs text-[var(--cs-text-muted)]">
                <WellbeingIcon score={sup.wellbeing_score} />
                {sup.wellbeing_score}/10
              </div>
            )}
            {sup.status === "completed" && (
              <button onClick={() => setExpanded((p) => !p)} className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] ml-1">
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Inline discussion points (collapsed by default) */}
        {expanded && sup.status === "completed" && (
          <div className="space-y-3 border-t border-[var(--cs-border-subtle)] pt-3">
            {sup.discussion_points && (
              <div>
                <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Discussion Points</p>
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-[var(--cs-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {sup.discussion_points}
                </div>
              </div>
            )}
            {pendingActions.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wide mb-1">Pending Actions ({pendingActions.length})</p>
                <div className="space-y-1.5">
                  {pendingActions.map((action) => (
                    <div key={action.id} className="flex items-center gap-2 text-xs">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-[var(--cs-text-secondary)] flex-1">{action.description}</span>
                      <span className="text-[var(--cs-text-muted)] shrink-0">{formatDate(action.due_date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsed pending actions hint */}
        {!expanded && pendingActions.length > 0 && (
          <div className="text-[10px] text-[var(--cs-text-muted)] flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {pendingActions.length} pending action{pendingActions.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center gap-2 flex-wrap">
          {sup.status === "scheduled" && (
            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setRecording(true)}>
              <MessageSquare className="h-3 w-3" />
              Record Supervision
            </Button>
          )}
          {sup.status === "completed" && (
            <>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setRecording(true)}>
                <MessageSquare className="h-3 w-3" />
                Edit Record
              </Button>
              {sup.discussion_points && !needCreated && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 text-[var(--cs-aria-gold)] border-[var(--cs-aria-gold-soft)] hover:bg-[var(--cs-aria-gold-bg)]"
                  onClick={extractTrainingNeeds}
                  disabled={extracting || createNeed.isPending}
                >
                  <Sparkles className={cn("h-3 w-3", extracting && "animate-pulse")} />
                  {extracting ? "Extracting…" : "ARIA: Find Training Need"}
                </Button>
              )}
              {needCreated && (
                <span className="text-[10px] text-[var(--cs-aria-gold)] flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />Training need created
                </span>
              )}
            </>
          )}
          {sup.status === "completed" && (
            <div className="ml-auto flex items-center gap-1 text-[10px] text-[var(--cs-text-muted)]">
              {sup.staff_signature && sup.supervisor_signature ? (
                <><CheckCircle2 className="h-3 w-3 text-emerald-500" />Signed</>
              ) : (
                <><Clock className="h-3 w-3 text-amber-500" />Unsigned</>
              )}
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 text-blue-600 hover:bg-blue-50 ml-auto"
            onClick={() => router.push(`/supervision/${sup.id}`)}
          >
            View
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Schedule Supervision Modal ────────────────────────────────────────────────

function ScheduleModal({ onClose }: { onClose: () => void }) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const createSupervision = useCreateSupervision();
  const modalStaffQuery = useStaff();
  const modalAllStaff = (modalStaffQuery.data?.data ?? []).filter((s) => s.is_active);
  const activeStaff = modalAllStaff.filter((s) => s.role !== "responsible_individual");
  const supervisors = modalAllStaff.filter((s) => s.role === "registered_manager" || s.role === "deputy_manager" || s.role === "team_leader");

  const [form, setForm] = useState({
    staff_id: "",
    supervisor_id: currentUser?.id ?? "staff_darren",
    type: "formal" as Supervision["type"],
    scheduled_date: daysFromNow(7),
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit() {
    if (!form.staff_id || !form.scheduled_date) { setError("Staff member and date are required."); return; }
    setError("");
    createSupervision.mutate(
      {
        ...form,
        status: "scheduled",
        home_id: homeId,
        created_by: currentUser?.id ?? "staff_darren",
        updated_by: currentUser?.id ?? "staff_darren",
        actions_agreed: [],
        discussion_points: "",
        staff_signature: false,
        supervisor_signature: false,
        wellbeing_score: null,
        actual_date: null,
        duration_minutes: null,
        next_date: null,
        linked_document_id: null,
      } as Partial<Supervision>,
      {
        onSuccess: () => { setSuccess(true); setTimeout(onClose, 1200); },
        onError: (e) => setError(e.message),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[var(--cs-shadow-elevated)] p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-[var(--cs-navy)]">Schedule Supervision</div>
            <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">Book a supervision session for a team member</div>
          </div>
          <button onClick={onClose} className="text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-medium text-emerald-800">Supervision scheduled successfully.</span>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Staff Member <span className="text-red-500">*</span></label>
                <select
                  value={form.staff_id}
                  onChange={(e) => setForm((p) => ({ ...p, staff_id: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--cs-border)] bg-slate-50 px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select staff member…</option>
                  {activeStaff.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name} — {s.job_title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Supervisor</label>
                <select
                  value={form.supervisor_id}
                  onChange={(e) => setForm((p) => ({ ...p, supervisor_id: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--cs-border)] bg-slate-50 px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as Supervision["type"] }))}
                    className="w-full rounded-xl border border-[var(--cs-border)] bg-slate-50 px-3 py-2.5 text-sm text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="formal">Formal Supervision</option>
                    <option value="informal">Informal Check-in</option>
                    <option value="group">Group Supervision</option>
                    <option value="reflective_practice">Reflective Practice</option>
                    <option value="probation_review">Probation Review</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--cs-text-secondary)] block mb-1.5">Date <span className="text-red-500">*</span></label>
                  <Input
                    type="date"
                    value={form.scheduled_date}
                    onChange={(e) => setForm((p) => ({ ...p, scheduled_date: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={handleSubmit}
                disabled={!form.staff_id || !form.scheduled_date || createSupervision.isPending}
                className="flex-1"
              >
                {createSupervision.isPending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
                ) : (
                  <><Calendar className="h-3.5 w-3.5" />Schedule</>
                )}
              </Button>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "scheduled" | "completed" | "overdue";

export default function SupervisionPage() {
  const [tab, setTab] = useState<Tab>("supervision");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<"date" | "staff" | "type" | "status">("date");

  const staffQuery = useStaff();
  const allActiveStaff = (staffQuery.data?.data ?? []).filter((s) => s.is_active);
  const activeNonRI = allActiveStaff.filter((s) => s.role !== "responsible_individual");

  const supervisionsQuery = useSupervisions();
  const supervisionRecords: Supervision[] = supervisionsQuery.data?.data ?? [];

  const stats = useMemo(() => {
    const today = todayStr();
    const due = allActiveStaff.filter((s) => s.next_supervision_due && s.next_supervision_due < today);
    const upcoming = allActiveStaff.filter((s) => s.next_supervision_due && s.next_supervision_due >= today && s.next_supervision_due <= daysFromNow(14));
    const completed = supervisionRecords.filter((s) => s.status === "completed").length;
    const scheduled = supervisionRecords.filter((s) => s.status === "scheduled").length;
    const appraisalsDue = APPRAISALS.filter((a) => a.nextDue <= daysFromNow(30)).length;
    const wellbeingScores = supervisionRecords
      .filter((s) => s.status === "completed" && s.wellbeing_score !== null)
      .map((s) => s.wellbeing_score!);
    const avgWellbeing = wellbeingScores.length > 0
      ? Math.round((wellbeingScores.reduce((a, b) => a + b, 0) / wellbeingScores.length) * 10) / 10
      : null;
    const pendingActions = supervisionRecords.reduce(
      (sum, s) => sum + s.actions_agreed.filter((a) => a.status === "pending").length, 0,
    );
    return { overdue: due.length, upcoming: upcoming.length, completed, scheduled, appraisalsDue, avgWellbeing, pendingActions };
  }, [supervisionRecords, allActiveStaff]);

  // Filtered staff cards
  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return activeNonRI;
    return activeNonRI.filter((s) =>
      s.full_name.toLowerCase().includes(q) ||
      s.job_title.toLowerCase().includes(q)
    );
  }, [activeNonRI, search]);

  // Filtered supervision records
  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = [...supervisionRecords];

    // Status filter
    if (statusFilter === "overdue") {
      const today = todayStr();
      const overdueStaffIds = new Set(
        allActiveStaff.filter((s) => s.next_supervision_due && s.next_supervision_due < today).map((s) => s.id)
      );
      list = list.filter((s) => overdueStaffIds.has(s.staff_id));
    } else if (statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter);
    }

    // Search
    if (q) {
      list = list.filter((s) => {
        const staffName = getStaffName(s.staff_id);
        const supervisorName = getStaffName(s.supervisor_id);
        const notes = s.discussion_points ?? "";
        const actions = s.actions_agreed.map((a) => a.description).join(" ");
        const type = s.type.replace(/_/g, " ");
        const haystack = `${staffName} ${supervisorName} ${notes} ${actions} ${type}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "staff": return getStaffName(a.staff_id).localeCompare(getStaffName(b.staff_id));
        case "type": return a.type.localeCompare(b.type);
        case "status": return a.status.localeCompare(b.status);
        default: return (b.scheduled_date || "").localeCompare(a.scheduled_date || "");
      }
    });
  }, [supervisionRecords, search, statusFilter, allActiveStaff, sortBy]);

  const isFiltered = search.trim() !== "" || statusFilter !== "all";

  const tabs = [
    { id: "supervision" as Tab, label: "Supervision", icon: MessageSquare },
    { id: "probation" as Tab, label: "Probation", icon: UserCheck },
    { id: "appraisals" as Tab, label: "Appraisals", icon: Award },
    { id: "goals" as Tab, label: "Goals", icon: Target },
  ];

  return (
    <>
    {scheduleOpen && <ScheduleModal onClose={() => setScheduleOpen(false)} />}
    <PageShell
      title="Supervision & Performance"
      subtitle="Supervision records, probation, appraisals, and individual goal tracking"
      ariaContext={{ pageTitle: "Supervision & Performance", sourceType: "general" }}
      quickCreateContext={{ module: "supervision", defaultTaskCategory: "supervision", defaultFormType: "supervision_record", preferredTab: "form" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton<Supervision> filename="supervision-export" data={filteredRecords} columns={SUPERVISION_EXPORT_COLS} label="Export" />
          <PrintButton title="Supervision Records" subtitle="Chamberlain House — Staff Supervision Log" targetId="supervision-content" />
          <SmartUploadButton variant="inline" label="Upload Document" uploadContext="Supervision — evidence/notes upload" />
          <Button size="sm" onClick={() => setScheduleOpen(true)}>
            <Plus className="h-3.5 w-3.5" />Schedule Supervision
          </Button>
          <AriaStudioQuickActionButton context={{ record_type: "supervision", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="supervision-content" className="space-y-6">
        <PageGuidance
          title="Supervision & performance"
          description="Schedule, record, and track formal supervision for all staff. Overdue supervisions are flagged automatically. Actions from supervision feed into the task system."
          evidenceTip="Supervision records should evidence reflective practice, not just operational updates. Inspectors look for professional development discussions linked to individual children."
          ariaTip="ARIA can identify supervision themes across the team and flag when a staff member's caseload may be affecting their wellbeing."
          regulationRef="Children's Homes Regulations 2015, Reg 33(4)(b) — Supervision of staff"
          variant="compliance"
        />
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Overdue", value: stats.overdue, icon: AlertTriangle, color: stats.overdue > 0 ? "text-red-600" : "text-emerald-600", bg: stats.overdue > 0 ? "bg-red-50" : "bg-emerald-50" },
            { label: "Due in 14 Days", value: stats.upcoming, icon: Clock, color: stats.upcoming > 0 ? "text-amber-600" : "text-[var(--cs-text-muted)]", bg: stats.upcoming > 0 ? "bg-amber-50" : "bg-slate-50" },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Avg Wellbeing", value: stats.avgWellbeing ?? "—", icon: Heart, color: "text-pink-600", bg: "bg-pink-50" },
            { label: "Pending Actions", value: stats.pendingActions, icon: ClipboardList, color: stats.pendingActions > 0 ? "text-amber-600" : "text-[var(--cs-text-muted)]", bg: stats.pendingActions > 0 ? "bg-amber-50" : "bg-slate-50" },
            { label: "Appraisals Due", value: stats.appraisalsDue, icon: Award, color: "text-blue-600", bg: "bg-blue-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-[var(--cs-border)] bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider">{label}</div>
                  <div className={cn("mt-1 text-2xl font-bold tabular-nums", color)}>{value}</div>
                </div>
                <div className={cn("rounded-xl p-2", bg)}>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                tab === id ? "bg-white text-[var(--cs-navy)] shadow-sm" : "text-[var(--cs-text-muted)] hover:text-[var(--cs-text-secondary)]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Supervision tab */}
        {tab === "supervision" && (
          <div className="space-y-5">
            {/* Overdue banner */}
            {stats.overdue > 0 && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <div className="text-sm text-red-800">
                  <strong>{stats.overdue} staff member{stats.overdue > 1 ? "s" : ""}</strong> are overdue for supervision.
                  Minimum supervision frequency must be maintained under Reg 34(3) CSCS.
                </div>
              </div>
            )}

            {/* Search & Filter toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by staff name, job title, notes…"
                  className="pl-9 h-9 text-sm rounded-xl"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {([
                  ["all", "All"],
                  ["scheduled", "Scheduled"],
                  ["completed", "Completed"],
                  ["overdue", "Overdue"],
                ] as [StatusFilter, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={cn(
                      "px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors",
                      statusFilter === key
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-[var(--cs-text-secondary)] border-[var(--cs-border)] hover:bg-[var(--cs-surface)]"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)] shrink-0">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-lg border border-[var(--cs-border)] bg-white px-2 py-1.5 text-xs text-[var(--cs-text-secondary)] focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <option value="date">Date</option>
                  <option value="staff">Staff Name</option>
                  <option value="type">Type</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            {isFiltered && (
              <div className="text-xs text-[var(--cs-text-muted)]">
                Showing {filteredStaff.length} staff · {filteredRecords.length} records
              </div>
            )}

            {/* Staff supervision status */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStaff.map((staff) => {
                const lastSup = supervisionRecords.filter((s) => s.staff_id === staff.id && s.status === "completed")
                  .sort((a, b) => (b.actual_date || "").localeCompare(a.actual_date || "")).at(0);
                const nextSup = supervisionRecords.find((s) => s.staff_id === staff.id && s.status === "scheduled");
                const isOverdue = staff.next_supervision_due && staff.next_supervision_due < todayStr();
                const isDueSoon = staff.next_supervision_due && staff.next_supervision_due >= todayStr() && staff.next_supervision_due <= daysFromNow(14);

                return (
                  <div key={staff.id} className={cn(
                    "rounded-2xl border p-4 space-y-3",
                    isOverdue ? "border-red-200 bg-red-50" : isDueSoon ? "border-amber-200 bg-amber-50" : "border-[var(--cs-border)] bg-white"
                  )}>
                    <div className="flex items-center gap-3">
                      <Avatar name={staff.full_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[var(--cs-navy)] truncate">{staff.full_name}</div>
                        <div className="text-xs text-[var(--cs-text-muted)]">{staff.job_title}</div>
                      </div>
                      {isOverdue ? (
                        <Badge className="text-[9px] rounded-full bg-red-100 text-red-700">Overdue</Badge>
                      ) : isDueSoon ? (
                        <Badge className="text-[9px] rounded-full bg-amber-100 text-amber-700">Due soon</Badge>
                      ) : (
                        <Badge className="text-[9px] rounded-full bg-emerald-100 text-emerald-700">Current</Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-[var(--cs-text-secondary)]">
                      <div className="flex justify-between">
                        <span>Last supervision</span>
                        <span className="font-medium">{lastSup ? formatDate(lastSup.actual_date || lastSup.scheduled_date) : "None recorded"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next due</span>
                        <span className={cn("font-medium", isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : "text-[var(--cs-navy)]")}>
                          {staff.next_supervision_due ? formatDate(staff.next_supervision_due) : "Not set"}
                        </span>
                      </div>
                      {lastSup?.wellbeing_score && (
                        <div className="flex justify-between">
                          <span>Last wellbeing</span>
                          <span className="flex items-center gap-1 font-medium">
                            <WellbeingIcon score={lastSup.wellbeing_score} />{lastSup.wellbeing_score}/10
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isOverdue ? "default" : "outline"}
                      className={cn("w-full h-7 text-xs", isOverdue && "bg-red-600 hover:bg-red-700")}
                      onClick={() => setScheduleOpen(true)}
                    >
                      {nextSup ? "View Scheduled" : "Schedule Now"}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Recent supervision records */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><ClipboardList className="h-4 w-4 text-blue-500" />Recent Supervision Records</CardTitle>
              </CardHeader>
              <CardContent>
                {supervisionsQuery.isPending ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
                  </div>
                ) : supervisionRecords.length === 0 ? (
                  <div className="py-8 text-center text-sm text-[var(--cs-text-muted)]">No supervision records yet. Schedule one above.</div>
                ) : filteredRecords.length === 0 && isFiltered ? (
                  <div className="py-8 text-center text-[var(--cs-text-muted)]">
                    <Search className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                    <div className="text-sm font-medium">No records match your filters</div>
                    <div className="text-xs mt-1">Try adjusting your search or status filter</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRecords.map((sup) => <SupervisionCard key={sup.id} sup={sup} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Probation tab */}
        {tab === "probation" && (
          <div className="space-y-5">
            {PROBATION.map((prob) => {
              const staff = allActiveStaff.find((s) => s.id === prob.staffId);
              const daysLeft = prob.endDate ? Math.max(0, Math.ceil((new Date(prob.endDate).getTime() - Date.now()) / 86400000)) : 0;
              const totalDays = Math.ceil((new Date(prob.endDate || "").getTime() - new Date(prob.startDate).getTime()) / 86400000);
              const elapsed = totalDays - daysLeft;
              const pct = totalDays > 0 ? Math.round((elapsed / totalDays) * 100) : 100;

              return (
                <Card key={prob.staffId}>
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-4">
                      <Avatar name={staff?.full_name || "?"} size="md" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-base font-semibold text-[var(--cs-navy)]">{staff?.full_name}</span>
                          <Badge className={cn("text-[10px] rounded-full", prob.status === "active" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700")}>
                            {prob.status === "active" ? "On Probation" : "Passed"}
                          </Badge>
                          {prob.status === "active" && daysLeft < 30 && (
                            <Badge className="text-[10px] rounded-full bg-amber-100 text-amber-700">{daysLeft}d remaining</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-[10px] text-[var(--cs-text-muted)] mb-0.5">Started</div>
                            <div className="font-medium text-[var(--cs-navy)]">{formatDate(prob.startDate)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[var(--cs-text-muted)] mb-0.5">{prob.status === "passed" ? "Completed" : "Due to end"}</div>
                            <div className="font-medium text-[var(--cs-navy)]">{formatDate(prob.endDate || "")}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[var(--cs-text-muted)] mb-0.5">Reviews done</div>
                            <div className="font-medium text-[var(--cs-navy)]">{prob.reviews}</div>
                          </div>
                        </div>
                        {prob.status === "active" && (
                          <div>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-[var(--cs-text-muted)]">Probation progress</span>
                              <span className="font-medium text-[var(--cs-navy)]">{pct}%</span>
                            </div>
                            <Progress value={pct} color={pct > 80 ? "bg-emerald-500" : "bg-blue-500"} />
                          </div>
                        )}
                        {prob.concerns.length > 0 && (
                          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                            <div className="text-xs font-semibold text-amber-800 mb-1">Concerns on record</div>
                            {prob.concerns.map((c, i) => (
                              <div key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />{c}
                              </div>
                            ))}
                          </div>
                        )}
                        {prob.nextReview && (
                          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-secondary)]">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            Next review: <strong>{formatDate(prob.nextReview)}</strong>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-8 text-xs" disabled title="Probation history is stored in the staff member's HR file.">View history</Button>
                          {prob.status === "active" && <Button size="sm" className="h-8 text-xs" disabled title="Schedule probation reviews through your HR system.">Schedule review</Button>}
                          {prob.status === "active" && daysLeft === 0 && (
                            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" disabled title="Probation sign-off must be recorded in the staff HR file and confirmed with your RI.">Confirm passed</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Appraisals tab */}
        {tab === "appraisals" && (
          <div className="space-y-4">
            {activeNonRI.map((staff) => {
              const appraisal = APPRAISALS.find((a) => a.staffId === staff.id);
              const isDueSoon = appraisal?.nextDue && appraisal.nextDue <= daysFromNow(30);
              const isOverdue = appraisal?.nextDue && appraisal.nextDue < todayStr();
              const objectivePct = appraisal && appraisal.objectives > 0 ? Math.round((appraisal.achieved / appraisal.objectives) * 100) : 0;

              return (
                <div key={staff.id} className={cn(
                  "rounded-2xl border p-4 flex items-center gap-5 hover:shadow-md transition-all",
                  isOverdue ? "border-red-200 bg-red-50" : isDueSoon ? "border-amber-200 bg-amber-50" : "border-[var(--cs-border)] bg-white"
                )}>
                  <Avatar name={staff.full_name} size="md" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--cs-navy)]">{staff.full_name}</span>
                      <span className="text-xs text-[var(--cs-text-muted)]">{staff.job_title}</span>
                      {appraisal?.rating && (
                        <Badge className={cn("text-[9px] rounded-full capitalize", RATING_COLORS[appraisal.rating])}>
                          {appraisal.rating}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs text-[var(--cs-text-secondary)]">
                      <div>
                        <span className="text-[var(--cs-text-muted)]">Last appraisal</span>
                        <div className="font-medium text-[var(--cs-navy)]">{appraisal?.date ? formatDate(appraisal.date) : "None"}</div>
                      </div>
                      <div>
                        <span className="text-[var(--cs-text-muted)]">Next due</span>
                        <div className={cn("font-medium", isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : "text-[var(--cs-navy)]")}>
                          {appraisal?.nextDue ? formatDate(appraisal.nextDue) : "Not set"}
                        </div>
                      </div>
                      <div>
                        <span className="text-[var(--cs-text-muted)]">Objectives</span>
                        <div className="font-medium text-[var(--cs-navy)]">{appraisal?.achieved || 0}/{appraisal?.objectives || 0} achieved</div>
                      </div>
                    </div>
                    {appraisal && appraisal.objectives > 0 && (
                      <Progress value={objectivePct} color={objectivePct === 100 ? "bg-emerald-500" : "bg-blue-500"} className="h-1.5" />
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {isOverdue && <Button size="sm" className="h-8 text-xs bg-red-600 hover:bg-red-700" disabled title="Book the appraisal and record it in the Documents section when complete.">Start Appraisal</Button>}
                    {isDueSoon && !isOverdue && <Button size="sm" className="h-8 text-xs" disabled title="Schedule this appraisal through your HR system.">Schedule</Button>}
                    {!isDueSoon && !isOverdue && <Button size="sm" variant="outline" className="h-8 text-xs" disabled title="Appraisal records are stored in the Documents section.">View</Button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Goals tab */}
        {tab === "goals" && (
          <div className="space-y-4">
            {allActiveStaff.map((staff) => {
              const staffGoals = GOALS.filter((g) => g.staffId === staff.id);
              if (staffGoals.length === 0) return null;
              return (
                <Card key={staff.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar name={staff.full_name} size="sm" />
                      <CardTitle className="text-sm font-semibold">{staff.full_name}</CardTitle>
                      <span className="text-xs text-[var(--cs-text-muted)]">{staffGoals.filter((g) => g.status === "achieved").length}/{staffGoals.length} achieved</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {staffGoals.map((goal) => (
                        <div key={goal.id} className={cn(
                          "flex items-center gap-4 rounded-xl px-3 py-2.5 border",
                          goal.status === "achieved" ? "bg-emerald-50 border-emerald-200" :
                          goal.status === "overdue" ? "bg-red-50 border-red-200" :
                          "bg-slate-50 border-[var(--cs-border)]"
                        )}>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-[var(--cs-navy)] truncate">{goal.title}</div>
                            <div className="text-xs text-[var(--cs-text-muted)] mt-0.5">Due {formatDate(goal.targetDate)}</div>
                            <Progress
                              value={goal.progress}
                              color={goal.status === "achieved" ? "bg-emerald-500" : goal.status === "overdue" ? "bg-red-500" : "bg-blue-500"}
                              className="h-1.5 mt-2"
                            />
                          </div>
                          <div className="text-center shrink-0">
                            <div className={cn("text-sm font-bold", goal.status === "achieved" ? "text-emerald-600" : goal.status === "overdue" ? "text-red-600" : "text-blue-600")}>
                              {goal.progress}%
                            </div>
                          </div>
                          <Badge className={cn("text-[9px] rounded-full shrink-0",
                            goal.status === "achieved" ? "bg-emerald-100 text-emerald-700" :
                            goal.status === "overdue" ? "bg-red-100 text-red-700" :
                            "bg-blue-100 text-blue-700"
                          )}>
                            {goal.status.replace("_", " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Supervision & Performance — staff supervision records, performance reviews, development plans, appraisal records, management oversight, Reg 40 supervision compliance, Ofsted workforce evidence"
        recordType="supervision"
        className="mt-6"
      />
      <AriaPracticePanel sourceType="supervision" homeId="home_oak" title="Run ARIA on this supervision" />
    </PageShell>
    </>
  );
}
