"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — NIGHT CHECKS / OVERNIGHT OBSERVATIONS
// Records overnight welfare checks on each young person, including sleep
// status, mood observations, and any concerns. Supports Reg 12 (Protection
// of Children) and provides evidence of overnight care quality.
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
import { cn, formatDate, todayStr, daysFromNow } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  Moon, Sun, Search, Filter, ArrowUpDown, X, Plus,
  CheckCircle2, AlertTriangle, Clock, User, Calendar,
  Eye, CloudMoon, BedDouble, ThermometerSun, Activity,
  Loader2, ChevronDown, ChevronUp,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type SleepStatus = "sleeping" | "awake_settled" | "awake_unsettled" | "distressed" | "not_in_room" | "asleep_restless";
type CheckType = "scheduled" | "additional" | "concern_follow_up";

interface NightCheck {
  id: string;
  date: string;              // the night of (e.g. "2026-04-30" for the night of 30 Apr)
  time: string;              // "01:30"
  child_id: string;
  staff_id: string;
  sleep_status: SleepStatus;
  check_type: CheckType;
  notes: string;
  concern_raised: boolean;
  concern_detail: string | null;
  room_temp_ok: boolean;
  door_position: "open" | "closed" | "ajar";
  created_at: string;
}

// ── Seed Data ─────────────────────────────────────────────────────────────────

const tonight = todayStr();
const lastNight = daysFromNow(-1);
const twoNightsAgo = daysFromNow(-2);

const SEED_CHECKS: NightCheck[] = [
  // Tonight's checks
  { id: "nc_001", date: tonight, time: "23:00", child_id: "yp_alex",   staff_id: "staff_diane",    sleep_status: "awake_settled", check_type: "scheduled", notes: "Watching TV in room, calm. Reminded about lights out at 23:30.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "ajar", created_at: `${tonight}T23:00:00Z` },
  { id: "nc_002", date: tonight, time: "23:00", child_id: "yp_casey",  staff_id: "staff_diane",    sleep_status: "sleeping",      check_type: "scheduled", notes: "Asleep. Room settled.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "open", created_at: `${tonight}T23:02:00Z` },
  { id: "nc_003", date: tonight, time: "23:00", child_id: "yp_jordan", staff_id: "staff_diane",    sleep_status: "sleeping",      check_type: "scheduled", notes: "Asleep with reading light on. Turned off.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "ajar", created_at: `${tonight}T23:05:00Z` },
  { id: "nc_004", date: tonight, time: "01:00", child_id: "yp_alex",   staff_id: "staff_diane",    sleep_status: "sleeping",      check_type: "scheduled", notes: "Asleep. No concerns.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "ajar", created_at: `${tonight}T01:00:00Z` },
  { id: "nc_005", date: tonight, time: "01:00", child_id: "yp_casey",  staff_id: "staff_diane",    sleep_status: "sleeping",      check_type: "scheduled", notes: "Asleep. Breathing normal.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "open", created_at: `${tonight}T01:02:00Z` },
  { id: "nc_006", date: tonight, time: "01:00", child_id: "yp_jordan", staff_id: "staff_diane",    sleep_status: "sleeping",      check_type: "scheduled", notes: "Asleep.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "ajar", created_at: `${tonight}T01:04:00Z` },

  // Last night's checks
  { id: "nc_007", date: lastNight, time: "23:00", child_id: "yp_alex",   staff_id: "staff_ryan",     sleep_status: "awake_unsettled", check_type: "scheduled", notes: "Alex unsettled after argument with peer earlier. Staff sat with him for 10 minutes, talked through breathing exercises.", concern_raised: true, concern_detail: "Unsettled mood following earlier peer conflict. Monitored closely.", room_temp_ok: true, door_position: "ajar", created_at: `${lastNight}T23:00:00Z` },
  { id: "nc_008", date: lastNight, time: "23:00", child_id: "yp_casey",  staff_id: "staff_ryan",     sleep_status: "sleeping",        check_type: "scheduled", notes: "Asleep. Teddy bear in place.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "open", created_at: `${lastNight}T23:03:00Z` },
  { id: "nc_009", date: lastNight, time: "23:00", child_id: "yp_jordan", staff_id: "staff_ryan",     sleep_status: "sleeping",        check_type: "scheduled", notes: "Asleep. Settled.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "closed", created_at: `${lastNight}T23:05:00Z` },
  { id: "nc_010", date: lastNight, time: "00:30", child_id: "yp_alex",   staff_id: "staff_ryan",     sleep_status: "asleep_restless", check_type: "concern_follow_up", notes: "Asleep but restless — tossing. No intervention needed. Will check again at 02:00.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "ajar", created_at: `${lastNight}T00:30:00Z` },
  { id: "nc_011", date: lastNight, time: "02:00", child_id: "yp_alex",   staff_id: "staff_ryan",     sleep_status: "sleeping",        check_type: "concern_follow_up", notes: "Now sleeping soundly. No further concerns.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "ajar", created_at: `${lastNight}T02:00:00Z` },
  { id: "nc_012", date: lastNight, time: "03:00", child_id: "yp_alex",   staff_id: "staff_diane",    sleep_status: "sleeping",        check_type: "scheduled", notes: "All YP asleep. Settled night.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "ajar", created_at: `${lastNight}T03:00:00Z` },
  { id: "nc_013", date: lastNight, time: "03:00", child_id: "yp_casey",  staff_id: "staff_diane",    sleep_status: "sleeping",        check_type: "scheduled", notes: "Asleep.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "open", created_at: `${lastNight}T03:02:00Z` },
  { id: "nc_014", date: lastNight, time: "03:00", child_id: "yp_jordan", staff_id: "staff_diane",    sleep_status: "sleeping",        check_type: "scheduled", notes: "Asleep.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "closed", created_at: `${lastNight}T03:04:00Z` },

  // Two nights ago
  { id: "nc_015", date: twoNightsAgo, time: "23:00", child_id: "yp_alex",   staff_id: "staff_diane", sleep_status: "sleeping",        check_type: "scheduled", notes: "Asleep early. Good day.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "ajar", created_at: `${twoNightsAgo}T23:00:00Z` },
  { id: "nc_016", date: twoNightsAgo, time: "23:00", child_id: "yp_casey",  staff_id: "staff_diane", sleep_status: "awake_settled",   check_type: "scheduled", notes: "Reading in bed. Said she will sleep soon.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "open", created_at: `${twoNightsAgo}T23:02:00Z` },
  { id: "nc_017", date: twoNightsAgo, time: "23:00", child_id: "yp_jordan", staff_id: "staff_diane", sleep_status: "sleeping",        check_type: "scheduled", notes: "Asleep.", concern_raised: false, concern_detail: null, room_temp_ok: true, door_position: "ajar", created_at: `${twoNightsAgo}T23:04:00Z` },
  { id: "nc_018", date: twoNightsAgo, time: "02:00", child_id: "yp_casey",  staff_id: "staff_diane", sleep_status: "distressed",      check_type: "additional", notes: "Casey woke crying from a nightmare. Staff comforted her, stayed until she was calm. Offered warm drink. Back asleep by 02:30.", concern_raised: true, concern_detail: "Nightmare. Required staff support for 30 minutes. Will inform key worker in morning.", room_temp_ok: true, door_position: "open", created_at: `${twoNightsAgo}T02:00:00Z` },
];

// ── Constants ──────────────────────────────────────────────────────────────────

const SLEEP_STATUS_CONFIG: Record<SleepStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  sleeping:         { label: "Sleeping",          icon: Moon,           color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200"  },
  awake_settled:    { label: "Awake (settled)",   icon: Sun,            color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  awake_unsettled:  { label: "Awake (unsettled)", icon: CloudMoon,      color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  asleep_restless:  { label: "Restless sleep",    icon: BedDouble,      color: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200"     },
  distressed:       { label: "Distressed",        icon: AlertTriangle,  color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200"     },
  not_in_room:      { label: "Not in room",       icon: Eye,            color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200"    },
};

const CHECK_TYPE_LABELS: Record<CheckType, string> = {
  scheduled:         "Scheduled",
  additional:        "Additional",
  concern_follow_up: "Concern follow-up",
};

// ── Export Columns ────────────────────────────────────────────────────────────

const CHECK_EXPORT_COLS: ExportColumn<NightCheck>[] = [
  { header: "Date",         accessor: (r) => r.date },
  { header: "Time",         accessor: (r) => r.time },
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Sleep Status", accessor: (r) => SLEEP_STATUS_CONFIG[r.sleep_status]?.label ?? r.sleep_status },
  { header: "Check Type",   accessor: (r) => CHECK_TYPE_LABELS[r.check_type] ?? r.check_type },
  { header: "Concern",      accessor: (r) => r.concern_raised ? "Yes" : "No" },
  { header: "Concern Detail",accessor: (r) => r.concern_detail ?? "" },
  { header: "Notes",        accessor: (r) => r.notes },
  { header: "Room Temp OK", accessor: (r) => r.room_temp_ok ? "Yes" : "No" },
  { header: "Door",         accessor: (r) => r.door_position },
  { header: "Staff",        accessor: (r) => getStaffName(r.staff_id) },
];

// ── Check Row ────────────────────────────────────────────────────────────────

function CheckRow({ check }: { check: NightCheck }) {
  const [expanded, setExpanded] = useState(false);
  const ss = SLEEP_STATUS_CONFIG[check.sleep_status];
  const SsIcon = ss.icon;

  return (
    <div
      className={cn(
        "rounded-lg border bg-white transition-all",
        check.concern_raised && "border-amber-200 bg-amber-50/30",
      )}
    >
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Time */}
        <div className="w-12 text-center flex-shrink-0">
          <div className="text-sm font-bold text-slate-700 tabular-nums">{check.time}</div>
        </div>

        {/* Sleep status icon */}
        <div className={cn("rounded-md p-1.5 border flex-shrink-0", ss.bg, ss.border)}>
          <SsIcon className={cn("h-3.5 w-3.5", ss.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-slate-900">{getYPName(check.child_id)}</span>
            <Badge className={cn("text-[9px] px-1.5 py-0 border", ss.bg, ss.color, ss.border)}>
              {ss.label}
            </Badge>
            {check.concern_raised && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] px-1.5 py-0">
                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                Concern
              </Badge>
            )}
            {check.check_type !== "scheduled" && (
              <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[9px] px-1.5 py-0">
                {CHECK_TYPE_LABELS[check.check_type]}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-slate-600 line-clamp-1">{check.notes}</p>
        </div>

        {/* Staff + expand */}
        <div className="flex items-center gap-2 flex-shrink-0 text-[10px] text-slate-400">
          <span>{getStaffName(check.staff_id)}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t px-3 pb-3 pt-2 space-y-2">
          <p className="text-xs text-slate-700">{check.notes}</p>
          {check.concern_detail && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-2">
              <p className="text-[11px] font-semibold text-amber-800 mb-0.5">Concern Raised</p>
              <p className="text-xs text-amber-700">{check.concern_detail}</p>
            </div>
          )}
          <div className="flex items-center gap-4 text-[10px] text-slate-400">
            <span>Room temp: {check.room_temp_ok ? "OK" : "Issue"}</span>
            <span>Door: {check.door_position}</span>
            <span>Staff: {getStaffName(check.staff_id)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── New Check Dialog ─────────────────────────────────────────────────────────

function NewCheckDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (check: NightCheck) => void;
}) {
  const { currentUser } = useAuthContext();
  const [childId, setChildId] = useState("yp_alex");
  const [sleepStatus, setSleepStatus] = useState<SleepStatus>("sleeping");
  const [checkType, setCheckType] = useState<CheckType>("scheduled");
  const [notes, setNotes] = useState("");
  const [concern, setConcern] = useState(false);
  const [concernDetail, setConcernDetail] = useState("");
  const [doorPosition, setDoorPosition] = useState<"open" | "closed" | "ajar">("ajar");

  function handleSubmit() {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const check: NightCheck = {
      id: `nc_local_${Date.now()}`,
      date: todayStr(),
      time,
      child_id: childId,
      staff_id: currentUser?.id ?? "staff_darren",
      sleep_status: sleepStatus,
      check_type: checkType,
      notes: notes.trim() || `${SLEEP_STATUS_CONFIG[sleepStatus].label}. No additional notes.`,
      concern_raised: concern,
      concern_detail: concern ? concernDetail.trim() || null : null,
      room_temp_ok: true,
      door_position: doorPosition,
      created_at: now.toISOString(),
    };
    onSubmit(check);
    onClose();
    setNotes("");
    setConcern(false);
    setConcernDetail("");
    setSleepStatus("sleeping");
    setCheckType("scheduled");
    setDoorPosition("ajar");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Moon className="h-4 w-4 text-indigo-600" />
            Record Night Check
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Young Person</label>
              <Select value={childId} onValueChange={setChildId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
                  <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
                  <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Check Type</label>
              <Select value={checkType} onValueChange={(v) => setCheckType(v as CheckType)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CHECK_TYPE_LABELS) as CheckType[]).map((t) => (
                    <SelectItem key={t} value={t}>{CHECK_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Sleep Status</label>
              <Select value={sleepStatus} onValueChange={(v) => setSleepStatus(v as SleepStatus)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(SLEEP_STATUS_CONFIG) as SleepStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{SLEEP_STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Door Position</label>
              <Select value={doorPosition} onValueChange={(v) => setDoorPosition(v as "open" | "closed" | "ajar")}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="ajar">Ajar</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observations during this check…" className="text-xs min-h-[60px]" />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="concern-check"
              checked={concern}
              onChange={(e) => setConcern(e.target.checked)}
              className="rounded border-slate-300"
            />
            <label htmlFor="concern-check" className="text-xs text-slate-700">Raise a concern</label>
          </div>

          {concern && (
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Concern Details</label>
              <Textarea value={concernDetail} onChange={(e) => setConcernDetail(e.target.value)} placeholder="Describe the concern…" className="text-xs min-h-[50px]" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="text-xs" onClick={handleSubmit}>
            Record Check
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function NightChecksPage() {
  const [checks, setChecks] = useState<NightCheck[]>(SEED_CHECKS);
  const [showNew, setShowNew] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState(todayStr());
  const [childFilter, setChildFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<SleepStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("time_desc");

  // Unique dates for filter
  const availableDates = useMemo(() => {
    const dates = new Set(checks.map((c) => c.date));
    return Array.from(dates).sort().reverse();
  }, [checks]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = checks.filter((c) => c.date === dateFilter);

    if (childFilter !== "all") {
      list = list.filter((c) => c.child_id === childFilter);
    }

    if (statusFilter !== "all") {
      list = list.filter((c) => c.sleep_status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.notes.toLowerCase().includes(q) ||
          getYPName(c.child_id).toLowerCase().includes(q) ||
          getStaffName(c.staff_id).toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case "time_asc":
        list.sort((a, b) => a.time.localeCompare(b.time));
        break;
      case "child":
        list.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id)));
        break;
      default:
        list.sort((a, b) => b.time.localeCompare(a.time));
    }

    return list;
  }, [checks, dateFilter, childFilter, statusFilter, search, sortBy]);

  // Stats for selected date
  const stats = useMemo(() => {
    const dateChecks = checks.filter((c) => c.date === dateFilter);
    const total = dateChecks.length;
    const concerns = dateChecks.filter((c) => c.concern_raised).length;
    const sleeping = dateChecks.filter((c) => c.sleep_status === "sleeping").length;
    const distressed = dateChecks.filter((c) => c.sleep_status === "distressed").length;
    const uniqueYP = new Set(dateChecks.map((c) => c.child_id)).size;
    return { total, concerns, sleeping, distressed, uniqueYP };
  }, [checks, dateFilter]);

  const hasFilters = search || childFilter !== "all" || statusFilter !== "all";

  // YP summary for selected date
  const ypSummary = useMemo(() => {
    const dateChecks = checks.filter((c) => c.date === dateFilter);
    const ypIds = ["yp_alex", "yp_casey", "yp_jordan"];
    return ypIds.map((id) => {
      const yc = dateChecks.filter((c) => c.child_id === id);
      const hasConcern = yc.some((c) => c.concern_raised);
      const lastCheck = yc.sort((a, b) => b.time.localeCompare(a.time))[0];
      return { id, name: getYPName(id), checkCount: yc.length, hasConcern, lastCheck };
    });
  }, [checks, dateFilter]);

  return (
    <PageShell
      title="Night Checks"
      subtitle="Overnight welfare observations and sleep monitoring"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={CHECK_EXPORT_COLS} filename={`night-checks-${dateFilter}`} />
          <PrintButton title="Night Checks" subtitle={`Oak House — ${formatDate(dateFilter)}`} />
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowNew(true)}>
            <Plus className="h-3.5 w-3.5" />
            Record Check
          </Button>
        </div>
      }
    >
      {/* ── Summary stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Checks",    value: stats.total,      color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-200"  },
          { label: "YP Checked",      value: stats.uniqueYP,   color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200"    },
          { label: "Sleeping",        value: stats.sleeping,   color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
          { label: "Concerns",        value: stats.concerns,   color: stats.concerns > 0 ? "text-amber-600" : "text-emerald-600", bg: stats.concerns > 0 ? "bg-amber-50" : "bg-emerald-50", border: stats.concerns > 0 ? "border-amber-200" : "border-emerald-200" },
          { label: "Distressed",      value: stats.distressed, color: stats.distressed > 0 ? "text-red-600" : "text-emerald-600", bg: stats.distressed > 0 ? "bg-red-50" : "bg-emerald-50", border: stats.distressed > 0 ? "border-red-200" : "border-emerald-200" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-lg border p-3 text-center", s.bg, s.border)}>
            <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── YP Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {ypSummary.map((yp) => {
          const lastSs = yp.lastCheck ? SLEEP_STATUS_CONFIG[yp.lastCheck.sleep_status] : null;
          return (
            <div
              key={yp.id}
              className={cn(
                "rounded-lg border p-3",
                yp.hasConcern ? "border-amber-200 bg-amber-50/30" : "border-slate-200 bg-white"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-900">{yp.name}</span>
                {yp.hasConcern && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] px-1.5 py-0">
                    Concern
                  </Badge>
                )}
              </div>
              <div className="text-[10px] text-slate-500">
                {yp.checkCount} check{yp.checkCount !== 1 ? "s" : ""} recorded
              </div>
              {yp.lastCheck && lastSs && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <lastSs.icon className={cn("h-3 w-3", lastSs.color)} />
                  <span className="text-[10px] text-slate-600">
                    Last: {yp.lastCheck.time} — {lastSs.label}
                  </span>
                </div>
              )}
              {yp.checkCount === 0 && (
                <div className="text-[10px] text-red-500 font-medium mt-1">No checks recorded yet</div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableDates.map((d) => (
                <SelectItem key={d} value={d}>
                  {d === todayStr() ? `Tonight (${d})` : formatDate(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>

        <Select value={childFilter} onValueChange={setChildFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Young person" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SleepStatus | "all")}>
          <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(SLEEP_STATUS_CONFIG) as SleepStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{SLEEP_STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="time_desc">Latest first</SelectItem>
              <SelectItem value="time_asc">Earliest first</SelectItem>
              <SelectItem value="child">Young person</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500" onClick={() => { setSearch(""); setChildFilter("all"); setStatusFilter("all"); }}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* ── Check List ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Moon className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No checks recorded</p>
          <p className="text-xs mt-1">
            {hasFilters ? "Try adjusting your filters" : "No night checks for this date yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
        </div>
      )}

      <div className="text-center text-[10px] text-slate-400 mt-6">
        Showing {filtered.length} check{filtered.length !== 1 ? "s" : ""} for {dateFilter === todayStr() ? "tonight" : formatDate(dateFilter)}
      </div>

      {/* ── Regulatory Note ───────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-slate-50 border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <Moon className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-1">About Night Checks</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Night checks are a regulatory requirement under the Children&apos;s Homes Regulations 2015
              (Reg 12 — Protection of Children). Staff must monitor the welfare of young people during
              overnight hours, recording sleep observations, any concerns, and follow-up actions. This
              record provides direct evidence of overnight care quality for Reg 44 and Reg 45 reports,
              and supports management oversight of young people&apos;s wellbeing and safety.
            </p>
          </div>
        </div>
      </div>

      <NewCheckDialog open={showNew} onClose={() => setShowNew(false)} onSubmit={(check) => setChecks((prev) => [check, ...prev])} />
    </PageShell>
  );
}
