"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WELFARE CHECKS
// Night-time welfare checks for every young person in the home.
// Compliance: Quality Standards 6.3, Reg 34 (supervision), ILACS safe care.
// Every residential children's home must demonstrate regular welfare checks
// throughout the night with documented evidence.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { useWelfareChecks, useCreateWelfareCheckRound } from "@/hooks/use-welfare-checks";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useAuthContext } from "@/contexts/auth-context";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { cn, todayStr, formatRelative } from "@/lib/utils";
import {
  Moon, Sun, Shield, CheckCircle2, AlertTriangle, Clock,
  Eye, Loader2, Plus, ChevronDown, ChevronUp, Heart,
  DoorOpen, Thermometer, Lock, Flame, BedDouble,
  AlertCircle, Send, RefreshCw, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { WelfareCheckRound, WelfareCheckStatus } from "@/types/extended";
import { toast } from "sonner";

// ── Status config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<WelfareCheckStatus, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  ok:            { label: "OK",           icon: CheckCircle2, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  concern:       { label: "Concern",      icon: AlertTriangle, color: "text-red-600",    bgColor: "bg-red-100" },
  asleep:        { label: "Asleep",       icon: Moon,          color: "text-indigo-600",  bgColor: "bg-indigo-100" },
  awake:         { label: "Awake",        icon: Sun,           color: "text-amber-600",   bgColor: "bg-amber-100" },
  not_in_room:   { label: "Not in Room",  icon: DoorOpen,      color: "text-red-600",     bgColor: "bg-red-100" },
  refused:       { label: "Refused",      icon: AlertCircle,   color: "text-orange-600",  bgColor: "bg-orange-100" },
};

// ── New Check Form ──────────────────────────────────────────────────────────

function NewCheckForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { currentUser } = useAuthContext();
  const { data: ypData } = useYoungPeople("current");
  const createRound = useCreateWelfareCheckRound();

  const children = ypData?.data ?? [];
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const [checkData, setCheckData] = useState<Record<string, {
    status: WelfareCheckStatus;
    mood: string;
    notes: string;
    concern_details: string;
    physical_marks: boolean;
    marks_desc: string;
  }>>(
    Object.fromEntries(
      children.map((c) => [c.id, {
        status: "asleep" as WelfareCheckStatus,
        mood: "settled",
        notes: "",
        concern_details: "",
        physical_marks: false,
        marks_desc: "",
      }])
    )
  );

  const [buildingSecure, setBuildingSecure] = useState(true);
  const [fireExitsClear, setFireExitsClear] = useState(true);
  const [doorsLocked, setDoorsLocked] = useState(true);
  const [alarmSet, setAlarmSet] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const handleSubmit = () => {
    if (!currentUser?.id) return;

    createRound.mutate(
      {
        staff_id: currentUser.id,
        round_date: todayStr(),
        round_time: timeStr,
        shift_type: "sleep_in",
        children_checks: children.map((c) => ({
          child_id: c.id,
          status: checkData[c.id]?.status ?? "ok",
          location: "bedroom",
          mood: checkData[c.id]?.mood,
          notes: checkData[c.id]?.notes,
          concern_details: checkData[c.id]?.concern_details,
          physical_marks_noted: checkData[c.id]?.physical_marks,
          marks_description: checkData[c.id]?.marks_desc,
        })),
        building_secure: buildingSecure,
        fire_exits_clear: fireExitsClear,
        external_doors_locked: doorsLocked,
        alarm_set: alarmSet,
        additional_notes: additionalNotes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Welfare check round recorded");
          onSuccess();
        },
      }
    );
  };

  const statusOptions: WelfareCheckStatus[] = ["asleep", "awake", "ok", "concern", "not_in_room", "refused"];

  return (
    <Card className="border-indigo-200 bg-indigo-50/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Moon className="h-4 w-4 text-indigo-500" />
            New Welfare Check — {timeStr}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Individual child checks */}
        {children.map((child) => {
          const data = checkData[child.id];
          if (!data) return null;
          const statusCfg = STATUS_CONFIG[data.status];

          return (
            <div key={child.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={`${child.first_name} ${child.last_name}`} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {child.preferred_name || child.first_name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    DOB: {child.date_of_birth} · Key worker: {getStaffName(child.key_worker_id ?? "")}
                  </p>
                </div>
              </div>

              {/* Status selector */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {statusOptions.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={s}
                      onClick={() => setCheckData((prev) => ({
                        ...prev,
                        [child.id]: { ...prev[child.id], status: s },
                      }))}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        data.status === s
                          ? `${cfg.bgColor} ${cfg.color} border-current`
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              {/* Mood */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-slate-500 w-12 shrink-0">Mood:</span>
                <div className="flex gap-1">
                  {["settled", "restless", "upset", "calm", "agitated"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setCheckData((prev) => ({
                        ...prev,
                        [child.id]: { ...prev[child.id], mood: m },
                      }))}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] border transition-all capitalize",
                        data.mood === m
                          ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                          : "bg-white text-slate-500 border-slate-200",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <textarea
                placeholder="Brief notes (optional)..."
                value={data.notes}
                onChange={(e) => setCheckData((prev) => ({
                  ...prev,
                  [child.id]: { ...prev[child.id], notes: e.target.value },
                }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-300 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />

              {/* Concern details */}
              {data.status === "concern" && (
                <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-3">
                  <label className="text-[10px] font-semibold text-red-700 block mb-1">
                    Concern Details (required)
                  </label>
                  <textarea
                    placeholder="Describe the concern..."
                    value={data.concern_details}
                    onChange={(e) => setCheckData((prev) => ({
                      ...prev,
                      [child.id]: { ...prev[child.id], concern_details: e.target.value },
                    }))}
                    className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-xs placeholder:text-red-300 resize-none h-20 focus:outline-none focus:ring-1 focus:ring-red-300"
                  />
                </div>
              )}

              {/* Physical marks checkbox */}
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.physical_marks}
                  onChange={(e) => setCheckData((prev) => ({
                    ...prev,
                    [child.id]: { ...prev[child.id], physical_marks: e.target.checked },
                  }))}
                  className="rounded border-slate-300"
                />
                <span className="text-[11px] text-slate-600">Physical marks or injuries noted</span>
              </label>
              {data.physical_marks && (
                <textarea
                  placeholder="Describe marks/injuries..."
                  value={data.marks_desc}
                  onChange={(e) => setCheckData((prev) => ({
                    ...prev,
                    [child.id]: { ...prev[child.id], marks_desc: e.target.value },
                  }))}
                  className="w-full mt-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs placeholder:text-amber-400 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-amber-300"
                />
              )}
            </div>
          );
        })}

        {/* Building checks */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 mb-3 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-indigo-500" />
            Building Security
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Building secure", value: buildingSecure, setter: setBuildingSecure, icon: Lock },
              { label: "Fire exits clear", value: fireExitsClear, setter: setFireExitsClear, icon: Flame },
              { label: "External doors locked", value: doorsLocked, setter: setDoorsLocked, icon: DoorOpen },
              { label: "Alarm set", value: alarmSet, setter: setAlarmSet, icon: Shield },
            ].map(({ label, value, setter, icon: Icon }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer rounded-lg border border-slate-100 p-2.5 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setter(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <Icon className="h-3 w-3 text-slate-400" />
                <span className="text-[11px] text-slate-600">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Additional notes */}
        <textarea
          placeholder="Additional notes for this round (optional)..."
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs placeholder:text-slate-300 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-indigo-300"
        />

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={createRound.isPending}
          className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"
        >
          {createRound.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Record Welfare Check Round
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Round Card ──────────────────────────────────────────────────────────────

function RoundCard({ round }: { round: WelfareCheckRound }) {
  const [expanded, setExpanded] = useState(false);
  const staffName = getStaffName(round.staff_id);

  const hasConcerns = round.checks.some((c) => c.status === "concern" || c.status === "not_in_room" || c.physical_marks_noted);

  return (
    <div className={cn(
      "rounded-xl border bg-white overflow-hidden transition-all",
      hasConcerns ? "border-red-200" : "border-slate-200",
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <div className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl shrink-0",
          hasConcerns ? "bg-red-100" : "bg-indigo-100",
        )}>
          {round.round_time >= "20:00" || round.round_time < "07:00" ? (
            <Moon className={cn("h-4 w-4", hasConcerns ? "text-red-600" : "text-indigo-600")} />
          ) : (
            <Sun className={cn("h-4 w-4", hasConcerns ? "text-red-600" : "text-amber-600")} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 tabular-nums">{round.round_time}</span>
            <span className="text-[10px] text-slate-400">{formatRelative(round.round_date)}</span>
            {hasConcerns && (
              <Badge className="bg-red-100 text-red-700 border-0 text-[9px] rounded-full">
                Concern
              </Badge>
            )}
            {round.all_children_checked && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[9px] rounded-full">
                All checked
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {staffName} · {round.checks.length} children checked
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Security indicators */}
          <div className="flex gap-1">
            {round.building_secure && <Lock className="h-3 w-3 text-emerald-500" />}
            {round.fire_exits_clear && <Flame className="h-3 w-3 text-emerald-500" />}
            {round.external_doors_locked && <DoorOpen className="h-3 w-3 text-emerald-500" />}
            {round.alarm_set && <Shield className="h-3 w-3 text-emerald-500" />}
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {round.checks.map((check) => {
            const cfg = STATUS_CONFIG[check.status] ?? STATUS_CONFIG.ok;
            const Icon = cfg.icon;
            const childName = getYPName(check.child_id);

            return (
              <div key={check.id} className="flex items-start gap-3 px-4 py-3">
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg shrink-0 mt-0.5", cfg.bgColor)}>
                  <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-800">{childName}</span>
                    <Badge className={cn("text-[9px] rounded-full border-0 shrink-0", cfg.bgColor, cfg.color)}>
                      {cfg.label}
                    </Badge>
                    {check.mood && (
                      <span className="text-[10px] text-slate-400 capitalize">{check.mood}</span>
                    )}
                  </div>
                  {check.notes && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{check.notes}</p>
                  )}
                  {check.concern_details && (
                    <p className="text-[11px] text-red-600 mt-0.5 font-medium">{check.concern_details}</p>
                  )}
                  {check.physical_marks_noted && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      Physical marks: {check.marks_description}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {check.window_secure && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <Lock className="h-2.5 w-2.5" /> Window secure
                      </span>
                    )}
                    {check.room_temperature && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <Thermometer className="h-2.5 w-2.5" /> {check.room_temperature}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Building security summary */}
          <div className="px-4 py-3 bg-slate-50">
            <div className="flex flex-wrap items-center gap-3 text-[10px]">
              <span className="font-semibold text-slate-500 uppercase tracking-wider">Building:</span>
              {[
                { label: "Secure", ok: round.building_secure },
                { label: "Fire exits clear", ok: round.fire_exits_clear },
                { label: "Doors locked", ok: round.external_doors_locked },
                { label: "Alarm set", ok: round.alarm_set },
              ].map(({ label, ok }) => (
                <span key={label} className={cn("flex items-center gap-0.5", ok ? "text-emerald-600" : "text-red-600")}>
                  {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                  {label}
                </span>
              ))}
            </div>
            {round.additional_notes && (
              <p className="text-[11px] text-slate-500 mt-2">{round.additional_notes}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const WELFARE_EXPORT_COLS: ExportColumn<WelfareCheckRound>[] = [
  { header: "Date", accessor: (r) => r.round_date },
  { header: "Time", accessor: (r) => r.round_time },
  { header: "Staff", accessor: (r) => getStaffName(r.staff_id) },
  { header: "Shift", accessor: (r) => r.shift_type },
  { header: "Children Checked", accessor: (r) => String(r.checks.length) },
  { header: "All Checked", accessor: (r) => r.all_children_checked ? "Yes" : "No" },
  { header: "Concerns", accessor: (r) => String(r.checks.filter((c) => c.status === "concern").length) },
  { header: "Building Secure", accessor: (r) => r.building_secure ? "Yes" : "No" },
  { header: "Fire Exits Clear", accessor: (r) => r.fire_exits_clear ? "Yes" : "No" },
  { header: "Notes", accessor: (r) => r.additional_notes ?? "" },
];

// ── Main Page ───────────────────────────────────────────────────────────────

export default function WelfareChecksPage() {
  const today = todayStr();
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useWelfareChecks(selectedDate ? { date: selectedDate } : undefined);

  const rounds = data?.data ?? [];
  const meta = data?.meta;

  // Filter rounds by search
  const filteredRounds = useMemo(() => {
    if (!search.trim()) return rounds;
    const q = search.toLowerCase();
    return rounds.filter((r) => {
      const hay = [
        getStaffName(r.staff_id),
        r.round_time,
        r.round_date,
        r.additional_notes || "",
        ...r.checks.map((c) => [
          getYPName(c.child_id),
          c.status,
          c.mood || "",
          c.notes || "",
          c.concern_details || "",
        ].join(" ")),
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [rounds, search]);

  // Group rounds by date
  const groupedRounds = useMemo(() => {
    const groups: Record<string, WelfareCheckRound[]> = {};
    filteredRounds.forEach((r) => {
      if (!groups[r.round_date]) groups[r.round_date] = [];
      groups[r.round_date].push(r);
    });
    // Sort each group by time
    Object.values(groups).forEach((g) => g.sort((a, b) => a.round_time.localeCompare(b.round_time)));
    // Sort dates descending
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredRounds]);

  // Calculate tonight's coverage
  const todayRounds = rounds.filter((r) => r.round_date === today);
  const expectedChecks = 5; // 22:00, 00:00, 02:00, 04:00, 06:00
  const completedChecks = todayRounds.length;
  const coveragePct = Math.min(100, Math.round((completedChecks / expectedChecks) * 100));

  if (isLoading) {
    return (
      <PageShell title="Welfare Checks" subtitle="Loading…">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Welfare Checks"
      subtitle="Night-time welfare monitoring — every child, every check, documented"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filteredRounds} columns={WELFARE_EXPORT_COLS} filename="welfare-checks" />
          <PrintButton
            title="Welfare Check Log"
            subtitle="Oak House — Night Welfare Checks"
            targetId="welfare-checks-content"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            New Check
          </Button>
        </div>
      }
    >
      <div id="welfare-checks-content" className="space-y-6">
        {/* Stats Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-900 p-6 text-white">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="text-center">
              <Moon className="h-5 w-5 mx-auto mb-1 text-indigo-300" />
              <div className="text-2xl font-bold tabular-nums">{meta?.total_rounds ?? 0}</div>
              <div className="text-[10px] text-slate-400">Total Rounds</div>
            </div>
            <div className="text-center">
              <Eye className="h-5 w-5 mx-auto mb-1 text-emerald-300" />
              <div className="text-2xl font-bold tabular-nums">{meta?.today_rounds ?? 0}</div>
              <div className="text-[10px] text-slate-400">Tonight</div>
            </div>
            <div className="text-center">
              <Heart className="h-5 w-5 mx-auto mb-1 text-blue-300" />
              <div className="text-2xl font-bold tabular-nums">{meta?.total_checks ?? 0}</div>
              <div className="text-[10px] text-slate-400">Total Checks</div>
            </div>
            <div className="text-center">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-amber-300" />
              <div className="text-2xl font-bold tabular-nums">{meta?.concerns_flagged ?? 0}</div>
              <div className="text-[10px] text-slate-400">Concerns</div>
            </div>
            <div className="text-center">
              <Shield className="h-5 w-5 mx-auto mb-1 text-green-300" />
              <div className="text-2xl font-bold tabular-nums">{meta?.consecutive_days ?? 0}</div>
              <div className="text-[10px] text-slate-400">Day Streak</div>
            </div>
          </div>
        </div>

        {/* Tonight's coverage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BedDouble className="h-4 w-4 text-indigo-500" />
              Tonight&apos;s Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-slate-500">
                    {completedChecks} of {expectedChecks} scheduled rounds
                  </span>
                  <span className={cn(
                    "text-xs font-bold",
                    coveragePct === 100 ? "text-emerald-600" : coveragePct >= 60 ? "text-amber-600" : "text-red-600",
                  )}>
                    {coveragePct}%
                  </span>
                </div>
                <Progress
                  value={coveragePct}
                  className="h-2.5"
                />
              </div>
            </div>
            {/* Expected times */}
            <div className="flex gap-1.5 mt-3">
              {["22:00", "00:00", "02:00", "04:00", "06:00"].map((time) => {
                const done = todayRounds.some((r) => r.round_time === time);
                return (
                  <div
                    key={time}
                    className={cn(
                      "flex-1 text-center rounded-lg py-2 text-xs font-medium border",
                      done
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : "bg-slate-50 border-slate-200 text-slate-400",
                    )}
                  >
                    {done && <CheckCircle2 className="h-3 w-3 mx-auto mb-0.5" />}
                    {time}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* New check form */}
        {showForm && (
          <NewCheckForm
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              refetch();
            }}
          />
        )}

        {/* Search + Date filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search staff, children, notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs rounded-lg"
            />
          </div>
          {search && (
            <span className="text-[10px] text-slate-400">
              {filteredRounds.length} result{filteredRounds.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Filter:</span>
          {[
            { label: "All", value: undefined },
            { label: "Today", value: today },
            { label: "Yesterday", value: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })() },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => setSelectedDate(f.value)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                selectedDate === f.value
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Check rounds by date */}
        {groupedRounds.length === 0 ? (
          <div className="py-12 text-center">
            <Moon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">No welfare checks recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Start a new check round to document tonight&apos;s welfare monitoring
            </p>
            <Button
              size="sm"
              className="mt-4 gap-1.5 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Start First Check
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedRounds.map(([date, dateRounds]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {date === today ? "Today" : formatRelative(date)} — {date}
                  </span>
                  <Badge className="bg-slate-100 text-slate-600 border-0 text-[10px] rounded-full">
                    {dateRounds.length} rounds
                  </Badge>
                </div>
                <div className="space-y-2">
                  {dateRounds.map((round) => (
                    <RoundCard key={round.id} round={round} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Regulatory note */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Regulatory Basis — </span>
          Children&apos;s Homes Quality Standards 2015 (6.3): The home must ensure children are safe and feel safe.
          Night-time welfare checks are a critical safeguarding measure demonstrating that children&apos;s
          wellbeing is actively monitored throughout the night. Checks must be documented with time, staff member,
          status of each child, and building security. This evidence is reviewed during Ofsted inspections
          and Reg 44 visits.
        </div>
      </div>
    </PageShell>
  );
}
