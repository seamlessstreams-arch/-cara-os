"use client";

import React, { useState, useMemo } from "react";
import { CaraQuickActions } from "@/components/intelligence/cara-quick-actions";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  ArrowRightLeft, Plus, ChevronDown, ChevronRight, Clock, Users,
  AlertTriangle, CheckCircle2, Loader2, AlertCircle, X, Pill,
  ClipboardList, Smile, Meh, Frown, Flag, Sparkles,
  Search, ArrowUpDown, BarChart3, FileCheck, Heart,
} from "lucide-react";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { YoungPerson } from "@/types";
import { cn, formatDate, formatDateTime, todayStr } from "@/lib/utils";
import { useHandover, useCreateHandover, useSignOffHandover } from "@/hooks/use-handover";
import { useHandoverContext } from "@/hooks/use-handover-context";
import { useAuthContext } from "@/contexts/auth-context";
import type { HandoverEntry, HandoverChildUpdate } from "@/types/extended";
import { useShiftSummary } from "@/hooks/use-shift-summary";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { ShiftSummaryCard } from "@/components/dashboard/shift-summary-card";
import { CaraHandoverBuilder } from "@/components/handover/cara-handover-builder";
import { HandoverPrintContext } from "@/components/handover/handover-print-context";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { WritingAssistantInline } from "@/components/writing-assistant/writing-assistant-inline";

const HANDOVER_EXPORT_COLS: ExportColumn<HandoverEntry>[] = [
  { header: "Shift Date", accessor: (h) => h.shift_date },
  { header: "Shift From", accessor: (h) => h.shift_from },
  { header: "Shift To", accessor: (h) => h.shift_to },
  { header: "Handover Time", accessor: (h) => h.handover_time },
  { header: "Outgoing Staff", accessor: (h) => h.outgoing_staff.map(getStaffName).join(", ") },
  { header: "Incoming Staff", accessor: (h) => h.incoming_staff.map(getStaffName).join(", ") },
  { header: "General Notes", accessor: (h) => h.general_notes },
  { header: "Flags", accessor: (h) => (h.flags ?? []).join(", ") },
  { header: "Signed Off", accessor: (h) => h.signed_off_by ? getStaffName(h.signed_off_by) : "No" },
  { header: "Created By", accessor: (h) => getStaffName(h.created_by) },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const SHIFT_LABELS: Record<string, string> = {
  day: "Day",
  sleep_in: "Sleep-in",
  waking_night: "Waking Night",
  night: "Night",
  morning: "Morning",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

function moodColor(score: number | null): string {
  if (score === null) return "bg-slate-100 text-slate-500";
  if (score >= 8) return "bg-emerald-100 text-emerald-700";
  if (score >= 6) return "bg-amber-100 text-amber-700";
  if (score >= 4) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

function MoodIcon({ score }: { score: number | null }) {
  if (score === null) return null;
  if (score >= 7) return <Smile className="h-3 w-3" />;
  if (score >= 4) return <Meh className="h-3 w-3" />;
  return <Frown className="h-3 w-3" />;
}

// ── Handover child entry with Cara toggle ─────────────────────────────────────

function HandoverChildCard({ cu }: { cu: HandoverChildUpdate }) {
  const [showCara, setShowCara] = useState(false);

  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-900">{getYPName(cu.child_id)}</span>
        <div className="flex items-center gap-2">
          {cu.mood_score !== null && (
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5", moodColor(cu.mood_score))}>
              <MoodIcon score={cu.mood_score} />
              {cu.mood_score}/10
            </span>
          )}
          <button
            onClick={() => setShowCara((v) => !v)}
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-colors",
              showCara
                ? "bg-violet-100 text-violet-700 border-violet-200"
                : "bg-white text-slate-500 border-slate-200 hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200"
            )}
          >
            <Sparkles className="h-2.5 w-2.5" />Ask Cara
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">{cu.key_notes}</p>
      {(cu.alerts?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(cu.alerts ?? []).map((alert, i) => (
            <span key={i} className="text-[10px] bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 flex items-center gap-1">
              <AlertTriangle className="h-2.5 w-2.5" />{alert}
            </span>
          ))}
        </div>
      )}
      {showCara && (
        <CaraQuickActions
          childId={cu.child_id}
          sourceType="daily_log"
          defaultOpen
        />
      )}
    </div>
  );
}

// ── Latest Handover Card ──────────────────────────────────────────────────────

function LatestHandoverCard({ handover }: { handover: HandoverEntry }) {
  const isToday = handover.shift_date === todayStr();
  const { data: ctxData } = useHandoverContext(handover.incoming_staff ?? []);
  const staffContexts = ctxData?.data ?? [];

  return (
    <Card className="rounded-2xl border-2 border-slate-900">
      <CardContent className="pt-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900">
                {SHIFT_LABELS[handover.shift_from] ?? handover.shift_from}
                {" → "}
                {SHIFT_LABELS[handover.shift_to] ?? handover.shift_to}
              </span>
              {isToday && <Badge className="text-[9px] rounded-full bg-blue-100 text-blue-700">Today</Badge>}
              {handover.signed_off_by && (
                <Badge className="text-[9px] rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Signed off
                </Badge>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {formatDate(handover.shift_date)} · {handover.handover_time}
            </div>
          </div>
        </div>

        {/* Staff */}
        <div className="flex gap-4 mb-4 text-xs text-slate-600">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block mb-1">Outgoing</span>
            {handover.outgoing_staff.map((id) => (
              <div key={id} className="flex items-center gap-1.5 mb-0.5">
                <Avatar name={getStaffName(id)} size="xs" />
                <span>{getStaffName(id)}</span>
              </div>
            ))}
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 block mb-1">Incoming</span>
            {handover.incoming_staff.map((id) => {
              const ctx = staffContexts.find((c) => c.staff_id === id);
              return (
                <div key={id} className="flex items-center gap-1.5 mb-0.5">
                  <Avatar name={getStaffName(id)} size="xs" />
                  <span>{getStaffName(id)}</span>
                  {ctx && ctx.days_since_last_shift !== null && ctx.days_since_last_shift > 1 && (
                    <span className={cn(
                      "text-[9px] rounded-full px-1.5 py-0.5 font-medium",
                      ctx.days_since_last_shift >= 4
                        ? "bg-violet-100 text-violet-700"
                        : "bg-blue-100 text-blue-600"
                    )}>
                      {ctx.days_since_last_shift}d away
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Child updates */}
        {handover.child_updates.length > 0 && (
          <div className="space-y-3 mb-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Young People</div>
            {handover.child_updates.map((cu) => (
              <HandoverChildCard key={cu.child_id} cu={cu} />
            ))}
          </div>
        )}

        {/* General notes */}
        {handover.general_notes && (
          <div className="mb-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">General Notes</div>
            <p className="text-sm text-slate-700 leading-relaxed">{handover.general_notes}</p>
          </div>
        )}

        {/* Flags */}
        {handover.flags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {handover.flags.map((flag, i) => (
              <span key={i} className="text-[10px] bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 flex items-center gap-1">
                <Flag className="h-2.5 w-2.5" />
                {flag.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        {/* Sign-off section */}
        <HandoverSignOffSection handover={handover} />
      </CardContent>
    </Card>
  );
}

// ── Sign-off section ─────────────────────────────────────────────────────────

function HandoverSignOffSection({ handover }: { handover: HandoverEntry }) {
  const { currentUser } = useAuthContext();
  const signOff = useSignOffHandover();
  const [signOffNotes, setSignOffNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const myId = currentUser?.id ?? "staff_darren";
  const isIncoming = handover.incoming_staff.includes(myId);
  const alreadySigned = handover.sign_offs?.some((s) => s.staff_id === myId);
  const signOffs = handover.sign_offs ?? [];
  const totalExpected = handover.incoming_staff.length;
  const totalSigned = signOffs.length;

  function handleSignOff() {
    signOff.mutate({
      handover_id: handover.id,
      staff_id: myId,
      notes: signOffNotes.trim() || undefined,
    });
    setShowNotes(false);
    setSignOffNotes("");
  }

  return (
    <div className="border-t border-slate-100 pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-semibold text-slate-700">
            Acknowledgements ({totalSigned}/{totalExpected})
          </span>
        </div>
        {totalSigned === totalExpected && (
          <Badge className="text-[9px] rounded-full bg-emerald-100 text-emerald-700">All acknowledged</Badge>
        )}
      </div>

      {/* Existing sign-offs */}
      <div className="space-y-1.5 mb-3">
        {handover.incoming_staff.map((id) => {
          const so = signOffs.find((s) => s.staff_id === id);
          return (
            <div key={id} className="flex items-center gap-2 text-xs">
              <div className={cn(
                "h-2 w-2 rounded-full shrink-0",
                so ? "bg-emerald-500" : "bg-slate-200"
              )} />
              <Avatar name={getStaffName(id)} size="xs" />
              <span className={cn("flex-1", so ? "text-slate-700" : "text-slate-400")}>
                {getStaffName(id)}
              </span>
              {so ? (
                <span className="text-[10px] text-emerald-600">
                  {new Date(so.acknowledged_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              ) : (
                <span className="text-[10px] text-slate-300">Pending</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Sign-off notes from others */}
      {signOffs.filter((s) => s.notes).length > 0 && (
        <div className="space-y-1.5 mb-3">
          {signOffs.filter((s) => s.notes).map((s) => (
            <div key={s.staff_id} className="rounded-lg bg-emerald-50 px-3 py-2">
              <span className="text-[10px] font-medium text-emerald-700">{getStaffName(s.staff_id).split(" ")[0]}:</span>
              <span className="text-[11px] text-slate-600 ml-1">{s.notes}</span>
            </div>
          ))}
        </div>
      )}

      {/* My sign-off button */}
      {isIncoming && !alreadySigned && (
        <div className="space-y-2">
          {showNotes && (
            <input
              type="text"
              value={signOffNotes}
              onChange={(e) => setSignOffNotes(e.target.value)}
              placeholder="Optional note (e.g. 'Will follow up on Casey')..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSignOff}
              disabled={signOff.isPending}
            >
              {signOff.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Signing...</>
              ) : (
                <><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Acknowledge Handover</>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNotes((v) => !v)}
            >
              {showNotes ? "Hide" : "+ Note"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Compact History Card ──────────────────────────────────────────────────────

function HistoryCard({ handover }: { handover: HandoverEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-4">
        <button
          className="w-full flex items-start gap-3 text-left"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
            <ArrowRightLeft className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-900">
                {SHIFT_LABELS[handover.shift_from] ?? handover.shift_from}
                {" → "}
                {SHIFT_LABELS[handover.shift_to] ?? handover.shift_to}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {formatDate(handover.shift_date)} · {handover.handover_time}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {handover.outgoing_staff.map((id) => getStaffName(id).split(" ")[0]).join(", ")}
              {" → "}
              {handover.incoming_staff.map((id) => getStaffName(id).split(" ")[0]).join(", ")}
            </div>
          </div>
          {expanded
            ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
            : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
          }
        </button>

        {expanded && (
          <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
            {handover.child_updates.map((cu) => (
              <div key={cu.child_id} className="rounded-xl bg-slate-50 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-900">{getYPName(cu.child_id)}</span>
                  {cu.mood_score !== null && (
                    <span className={cn("text-[10px] rounded-full px-2 py-0.5 font-medium", moodColor(cu.mood_score))}>
                      {cu.mood_score}/10
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{cu.key_notes}</p>
              </div>
            ))}
            {handover.general_notes && (
              <p className="text-sm text-slate-700 leading-relaxed">{handover.general_notes}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Write Handover Form ───────────────────────────────────────────────────────

interface WriteFormProps {
  youngPeople: YoungPerson[];
  onClose: () => void;
  onSuccess: () => void;
}

type ShiftFrom = HandoverEntry["shift_from"];
type ShiftTo = HandoverEntry["shift_to"];

function WriteHandoverForm({ youngPeople, onClose, onSuccess }: WriteFormProps) {
  const { currentUser } = useAuthContext();
  const createMutation = useCreateHandover();
  const currentYP = youngPeople.filter((y) => y.status === "current");

  const [shiftFrom, setShiftFrom] = useState<ShiftFrom>("day");
  const [shiftTo, setShiftTo] = useState<ShiftTo>("morning");
  const [generalNotes, setGeneralNotes] = useState("");
  const [flagInput, setFlagInput] = useState("");
  const [flags, setFlags] = useState<string[]>([]);
  const [childUpdates, setChildUpdates] = useState<HandoverChildUpdate[]>(
    currentYP.map((yp) => ({ child_id: yp.id, mood_score: null, key_notes: "", alerts: [] }))
  );
  const [alertInputs, setAlertInputs] = useState<Record<string, string>>(
    Object.fromEntries(currentYP.map((yp) => [yp.id, ""]))
  );
  const [caraGenerating, setCaraGenerating] = useState(false);

  const { data: shiftSummaryData } = useShiftSummary(undefined, shiftFrom);

  async function handleCaraGenerate() {
    setCaraGenerating(true);
    try {
      const summary = shiftSummaryData?.data;
      if (!summary) return;

      const lines: string[] = [];
      lines.push(summary.auto_notes);
      if (summary.stats.incidents_logged > 0) {
        lines.push(`\n${summary.stats.incidents_logged} incident(s) to flag to incoming team.`);
      }
      setGeneralNotes(lines.join("\n"));

      const newUpdates = currentYP.map((yp) => {
        const ypData = summary.young_people.find((y) => y.id === yp.id);
        const ypEvents = summary.events.filter((e) => e.child_id === yp.id);
        const notes = ypEvents.map((e) => `${e.time} — ${e.title}`).join(". ") || "No significant events this shift.";
        const alerts = ypEvents
          .filter((e) => e.severity === "high" || e.severity === "critical")
          .map((e) => e.title);
        return {
          child_id: yp.id,
          mood_score: ypData?.mood_score ?? null,
          key_notes: notes,
          alerts,
        };
      });
      setChildUpdates(newUpdates);

      const autoFlags: string[] = [];
      if (summary.stats.medications_missed > 0) autoFlags.push("medication_issue");
      if (summary.stats.missing_episodes > 0) autoFlags.push("missing_from_care");
      if (summary.stats.incidents_logged > 0) autoFlags.push("incidents_logged");
      setFlags(autoFlags);
    } finally {
      setCaraGenerating(false);
    }
  }

  function updateChild(childId: string, patch: Partial<HandoverChildUpdate>) {
    setChildUpdates((prev) => prev.map((cu) => cu.child_id === childId ? { ...cu, ...patch } : cu));
  }

  function addAlert(childId: string) {
    const val = alertInputs[childId]?.trim();
    if (!val) return;
    updateChild(childId, {
      alerts: [...(childUpdates.find((c) => c.child_id === childId)?.alerts ?? []), val],
    });
    setAlertInputs((prev) => ({ ...prev, [childId]: "" }));
  }

  function removeAlert(childId: string, idx: number) {
    const cu = childUpdates.find((c) => c.child_id === childId);
    if (!cu) return;
    updateChild(childId, { alerts: (cu.alerts ?? []).filter((_, i) => i !== idx) });
  }

  function addFlag() {
    const val = flagInput.trim();
    if (!val) return;
    setFlags((prev) => [...prev, val]);
    setFlagInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createMutation.mutateAsync({
      shift_from: shiftFrom,
      shift_to: shiftTo,
      child_updates: childUpdates,
      general_notes: generalNotes,
      flags,
      created_by: currentUser?.id ?? "staff_darren",
    });
    onSuccess();
  }

  return (
    <Card className="rounded-2xl border-2 border-blue-200">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-semibold text-slate-900">Write Handover</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCaraGenerate}
              disabled={caraGenerating || !shiftSummaryData}
              className="border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              {caraGenerating ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Generating...</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5 mr-1" />Generate with Cara</>
              )}
            </Button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Shift selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Shift From</label>
              <select
                value={shiftFrom}
                onChange={(e) => setShiftFrom(e.target.value as ShiftFrom)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="day">Day</option>
                <option value="sleep_in">Sleep-in</option>
                <option value="waking_night">Waking Night</option>
                <option value="night">Night</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Shift To</label>
              <select
                value={shiftTo}
                onChange={(e) => setShiftTo(e.target.value as ShiftTo)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="day">Day</option>
                <option value="sleep_in">Sleep-in</option>
                <option value="waking_night">Waking Night</option>
                <option value="morning">Morning</option>
              </select>
            </div>
          </div>

          {/* Per-YP sections */}
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Young People</div>
            {currentYP.map((yp) => {
              const cu = childUpdates.find((c) => c.child_id === yp.id)!;
              return (
                <div key={yp.id} className="rounded-xl bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">{yp.preferred_name || yp.first_name}</span>
                    {cu.mood_score !== null && (
                      <span className={cn("text-[10px] rounded-full px-2 py-0.5 font-medium", moodColor(cu.mood_score))}>
                        {cu.mood_score}/10
                      </span>
                    )}
                  </div>

                  {/* Mood slider */}
                  <div>
                    <label className="text-[11px] text-slate-500 mb-1 block">
                      Mood: {cu.mood_score !== null ? `${cu.mood_score}/10` : "Not recorded"}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={cu.mood_score ?? 5}
                      onChange={(e) => updateChild(yp.id, { mood_score: parseInt(e.target.value, 10) })}
                      onMouseDown={() => { if (cu.mood_score === null) updateChild(yp.id, { mood_score: 5 }); }}
                      className="w-full accent-slate-900"
                    />
                    {cu.mood_score !== null && (
                      <button
                        type="button"
                        onClick={() => updateChild(yp.id, { mood_score: null })}
                        className="text-[10px] text-slate-400 hover:text-slate-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Key notes */}
                  <div>
                    <label className="text-[11px] text-slate-500 mb-1 block">Key Notes</label>
                    <textarea
                      value={cu.key_notes}
                      onChange={(e) => updateChild(yp.id, { key_notes: e.target.value })}
                      rows={3}
                      placeholder={`Key observations for ${yp.preferred_name || yp.first_name}...`}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    />
                    <WritingAssistantInline
                      value={cu.key_notes}
                      onApplyText={(t) => updateChild(yp.id, { key_notes: t })}
                      recordType="handover"
                      fieldName="key_notes"
                      childId={yp.id}
                      mode="standard"
                    />
                  </div>

                  {/* Alerts */}
                  <div>
                    <label className="text-[11px] text-slate-500 mb-1 block">Alerts</label>
                    {(cu.alerts?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(cu.alerts ?? []).map((alert, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                            {alert}
                            <button type="button" onClick={() => removeAlert(yp.id, idx)}>
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={alertInputs[yp.id] ?? ""}
                        onChange={(e) => setAlertInputs((prev) => ({ ...prev, [yp.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAlert(yp.id); } }}
                        placeholder="Add alert..."
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => addAlert(yp.id)}
                        className="text-xs bg-amber-100 text-amber-700 rounded-xl px-3 py-1.5 hover:bg-amber-200 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* General notes */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">General Notes</label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              rows={4}
              placeholder="Anything else the incoming team needs to know..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
            <WritingAssistantInline
              value={generalNotes}
              onApplyText={setGeneralNotes}
              recordType="handover"
              fieldName="general_notes"
              mode="standard"
            />
          </div>

          {/* Flags */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Flags</label>
            {flags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {flags.map((flag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-orange-100 text-orange-700 rounded-full px-2 py-0.5">
                    <Flag className="h-2.5 w-2.5" />
                    {flag}
                    <button type="button" onClick={() => setFlags((prev) => prev.filter((_, i) => i !== idx))}>
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFlag(); } }}
                placeholder="Add flag (e.g. medication_due)..."
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={addFlag}
                className="text-xs bg-orange-100 text-orange-700 rounded-xl px-3 py-1.5 hover:bg-orange-200 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Submitting...</>
              ) : (
                "Submit Handover"
              )}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          </div>

          {createMutation.isError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {createMutation.error?.message || "Failed to submit handover"}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type ShiftFilter = "all" | "day" | "night" | "waking_night" | "sleep_in";
type SortKey = "newest" | "oldest";

export default function HandoverPage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const { data, isLoading, isError, error } = useHandover();

  const latest = data?.data.latest ?? null;
  const history = data?.data.history ?? [];
  const todayShifts = data?.data.today_shifts ?? [];
  const pendingTasks = data?.data.pending_tasks ?? [];
  const openIncidents = data?.data.open_incidents ?? [];
  const youngPeople = data?.data.young_people ?? [];

  // All handovers = latest + history
  const allHandovers = useMemo(() => {
    const list = latest ? [latest, ...history] : [...history];
    return list;
  }, [latest, history]);

  // Stats
  const stats = useMemo(() => {
    const total = allHandovers.length;
    const signedOff = allHandovers.filter((h) => h.signed_off_by).length;
    const withFlags = allHandovers.filter((h) => (h.flags?.length ?? 0) > 0).length;
    const totalAlerts = allHandovers.reduce(
      (sum, h) => sum + h.child_updates.reduce((s, cu) => s + (cu.alerts?.length ?? 0), 0), 0
    );
    const moodScores = allHandovers.flatMap((h) =>
      h.child_updates.filter((cu) => cu.mood_score !== null).map((cu) => cu.mood_score!)
    );
    const avgMood = moodScores.length > 0
      ? Math.round((moodScores.reduce((a, b) => a + b, 0) / moodScores.length) * 10) / 10
      : null;
    const lowMoodCount = moodScores.filter((m) => m <= 4).length;

    return { total, signedOff, withFlags, totalAlerts, avgMood, lowMoodCount };
  }, [allHandovers]);

  // Filtered + sorted history
  const filteredHistory = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = [...history];

    // Shift filter
    if (shiftFilter !== "all") {
      list = list.filter((h) => h.shift_from === shiftFilter || h.shift_to === shiftFilter);
    }

    // Search
    if (q) {
      list = list.filter((h) => {
        const staffNames = [
          ...h.outgoing_staff.map((id) => getStaffName(id)),
          ...h.incoming_staff.map((id) => getStaffName(id)),
        ].join(" ");
        const ypNames = h.child_updates.map((cu) => getYPName(cu.child_id)).join(" ");
        const notes = h.general_notes ?? "";
        const flags = (h.flags ?? []).join(" ");
        const childNotes = h.child_updates.map((cu) => cu.key_notes).join(" ");
        const alerts = h.child_updates.flatMap((cu) => cu.alerts).join(" ");
        const haystack = `${staffNames} ${ypNames} ${notes} ${flags} ${childNotes} ${alerts}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    // Sort
    if (sortKey === "oldest") {
      list.sort((a, b) => a.shift_date.localeCompare(b.shift_date));
    } else {
      list.sort((a, b) => b.shift_date.localeCompare(a.shift_date));
    }

    return list;
  }, [history, search, shiftFilter, sortKey]);

  const isFiltered = search.trim() !== "" || shiftFilter !== "all";

  return (
    <PageShell
      title="Handover"
      subtitle="Shift-to-shift communication, live notes, and evidence-ready records"
      caraContext={{ pageTitle: "Handover", sourceType: "general" }}
      quickCreateContext={{ module: "handover", defaultTaskCategory: "admin" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filteredHistory} columns={HANDOVER_EXPORT_COLS} filename="handover" />
          <PrintButton title="Shift Handover" subtitle="Chamberlain House — Handover Records" targetId="handover-content" />
          <SmartUploadButton variant="inline" label="Upload" uploadContext="Handover — supporting document upload" />
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            {showForm ? "Cancel" : "Write Handover"}
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "handover", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="handover-content" className="space-y-0">
      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-600 mb-5">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error?.message || "Failed to load handover data"}</p>
        </div>
      )}

      {/* ── Stats Row ── */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Card className="rounded-2xl">
            <CardContent className="pt-4 pb-3 text-center">
              <ArrowRightLeft className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-slate-900 tabular-nums">{stats.total}</div>
              <div className="text-[10px] text-slate-500">Total Handovers</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="pt-4 pb-3 text-center">
              <FileCheck className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-emerald-700 tabular-nums">{stats.signedOff}</div>
              <div className="text-[10px] text-slate-500">Signed Off</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="pt-4 pb-3 text-center">
              <Flag className="h-4 w-4 text-orange-500 mx-auto mb-1" />
              <div className={cn("text-lg font-bold tabular-nums", stats.withFlags > 0 ? "text-orange-700" : "text-slate-400")}>{stats.withFlags}</div>
              <div className="text-[10px] text-slate-500">With Flags</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="pt-4 pb-3 text-center">
              <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto mb-1" />
              <div className={cn("text-lg font-bold tabular-nums", stats.totalAlerts > 0 ? "text-amber-700" : "text-slate-400")}>{stats.totalAlerts}</div>
              <div className="text-[10px] text-slate-500">YP Alerts</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="pt-4 pb-3 text-center">
              <Heart className="h-4 w-4 text-pink-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-slate-900 tabular-nums">{stats.avgMood ?? "—"}</div>
              <div className="text-[10px] text-slate-500">Avg Mood</div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="pt-4 pb-3 text-center">
              <Frown className="h-4 w-4 text-red-500 mx-auto mb-1" />
              <div className={cn("text-lg font-bold tabular-nums", stats.lowMoodCount > 0 ? "text-red-700" : "text-slate-400")}>{stats.lowMoodCount}</div>
              <div className="text-[10px] text-slate-500">Low Mood (≤4)</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Auto-generated shift summary */}
      <div className="mb-6">
        <ShiftSummaryCard
          shiftType="day"
          onUseNotes={(notes) => {
            setShowForm(true);
            // Store notes in a data attribute for the form to pick up
            const el = document.getElementById("handover-auto-notes");
            if (el) el.dataset.notes = notes;
          }}
        />
      </div>
      <div id="handover-auto-notes" className="hidden" />

      {/* Cara Handover Builder — personalised context per incoming staff */}
      {!isLoading && (
        <div className="mb-6">
          <CaraHandoverBuilder
            incomingStaffIds={
              latest?.incoming_staff?.length
                ? latest.incoming_staff
                : todayShifts
                    .filter((s) => s.shift_type === "sleep_in" || s.shift_type === "waking_night")
                    .map((s) => s.staff_id)
                    .filter(Boolean)
            }
          />
        </div>
      )}

      {/* ── Search & Filters ── */}
      {!isLoading && history.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search handovers by staff, young person, notes…"
              className="pl-9 h-9 text-sm rounded-xl"
            />
          </div>

          {/* Shift filter tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "day", "night", "waking_night", "sleep_in"] as ShiftFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setShiftFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors",
                  shiftFilter === f
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                {f === "all" ? "All Shifts" : (SHIFT_LABELS[f] ?? f.replace(/_/g, " "))}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      )}

      {/* Results count */}
      {isFiltered && !isLoading && (
        <div className="text-xs text-slate-500 mb-4">
          Showing {filteredHistory.length} of {history.length} previous handover{history.length !== 1 ? "s" : ""}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left 2 columns: handover content ── */}
        <div className="lg:col-span-2 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span className="text-sm">Loading handovers...</span>
            </div>
          ) : (
            <>
              {/* Write form */}
              {showForm && (
                <WriteHandoverForm
                  youngPeople={youngPeople}
                  onClose={() => setShowForm(false)}
                  onSuccess={() => setShowForm(false)}
                />
              )}

              {/* Latest handover */}
              {latest ? (
                <LatestHandoverCard handover={latest} />
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center text-slate-400">
                  <ArrowRightLeft className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                  <div className="text-sm font-medium">No handovers yet</div>
                  <div className="text-xs mt-1">Write the first handover for today</div>
                  <Button size="sm" className="mt-4" onClick={() => setShowForm(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />Write Handover
                  </Button>
                </div>
              )}

              {/* History */}
              {history.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Previous Handovers</span>
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[10px] text-slate-400">{filteredHistory.length} records</span>
                  </div>
                  {filteredHistory.length === 0 && isFiltered ? (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400">
                      <Search className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                      <div className="text-sm font-medium">No handovers match your filters</div>
                      <div className="text-xs mt-1">Try adjusting your search or shift filter</div>
                    </div>
                  ) : (
                    filteredHistory.map((h) => (
                      <HistoryCard key={h.id} handover={h} />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right column: contextual sidebar ── */}
        <div className="space-y-5">
          {/* Today's shifts */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                On Shift Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-xs text-slate-400 py-2">Loading...</div>
              ) : todayShifts.length === 0 ? (
                <div className="text-xs text-slate-400 py-2">No shifts recorded</div>
              ) : (
                <div className="space-y-2">
                  {todayShifts.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                      <Avatar name={getStaffName(s.staff_id)} size="xs" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-700">{getStaffName(s.staff_id).split(" ")[0]}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{s.shift_type.replace(/_/g, " ")}</div>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{s.start_time}–{s.end_time}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending tasks */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-amber-500" />
                Pending Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-xs text-slate-400 py-2">Loading...</div>
              ) : pendingTasks.length === 0 ? (
                <div className="text-xs text-slate-400 py-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  All tasks complete
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingTasks.map((t) => (
                    <div key={t.id} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2">
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0 mt-2",
                        t.priority === "urgent" ? "bg-red-500" :
                        t.priority === "high" ? "bg-orange-500" :
                        t.priority === "medium" ? "bg-amber-400" : "bg-slate-300"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-700 line-clamp-2">{t.title}</div>
                        <div className="text-[10px] text-slate-400 capitalize mt-0.5">{t.priority} priority</div>
                      </div>
                    </div>
                  ))}
                  <a href="/tasks" className="block text-center text-[10px] text-blue-600 hover:underline pt-1">
                    View all tasks
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Open incidents */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Open Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-xs text-slate-400 py-2">Loading...</div>
              ) : openIncidents.length === 0 ? (
                <div className="text-xs text-slate-400 py-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  No open incidents
                </div>
              ) : (
                <div className="space-y-2">
                  {openIncidents.map((inc) => (
                    <div key={inc.id} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2">
                      <Badge className={cn("text-[9px] rounded-full mt-0.5 shrink-0", SEVERITY_COLORS[inc.severity] ?? "bg-slate-100 text-slate-600")}>
                        {inc.severity}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-700 line-clamp-2">{inc.description}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(inc.date)}</div>
                      </div>
                    </div>
                  ))}
                  <a href="/incidents" className="block text-center text-[10px] text-blue-600 hover:underline pt-1">
                    View all incidents
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medication summary */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Pill className="h-4 w-4 text-violet-500" />
                Medication Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              {youngPeople.length === 0 ? (
                <div className="text-xs text-slate-400 py-2">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {youngPeople.map((yp) => (
                    <div key={yp.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0" />
                      <span className="text-xs text-slate-700 flex-1">{yp.preferred_name || yp.first_name}</span>
                      {yp.risk_flags.includes("medication refusal") && (
                        <Badge className="text-[9px] rounded-full bg-red-100 text-red-600">Risk</Badge>
                      )}
                    </div>
                  ))}
                  <a href="/medication" className="block text-center text-[10px] text-blue-600 hover:underline pt-1">
                    View MAR sheet
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Print-only: Cara personalised context for each incoming staff member */}
      {latest && (
        <HandoverPrintContext incomingStaffIds={latest.incoming_staff} />
      )}
      </div>{/* close #handover-content */}
      <CareEventsPanel
        title="Care Events — Daily Log"
        category="general"
        days={14}
        defaultCollapsed
      />
    </PageShell>
  );
}
