"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import {
  Building2, AlertTriangle, CheckCircle2, Clock, XCircle,
  Plus, Search, Shield, Flame, Zap, Droplets, Thermometer,
  FileText, Upload, ChevronRight, Calendar, AlertCircle,
  ClipboardList, Wrench, Eye, CheckSquare, Filter, Car, TrendingDown,
  ArrowUpDown,
} from "lucide-react";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { useMaintenance } from "@/hooks/use-maintenance";
import type { MaintenanceItem } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Building {
  id: string;
  name: string;
  type: string;
  address: string;
  areas: string[];
  gas_cert_expiry: string;
  electrical_cert_expiry: string;
  fire_risk_assessment_date: string;
  epc_rating: string;
  last_full_inspection: string;
  next_inspection_due: string;
  status: string;
}

interface BuildingCheck {
  id: string;
  building_id: string;
  area: string;
  check_type: string;
  check_date: string;
  due_date: string;
  responsible_person: string;
  status: "due" | "completed" | "overdue" | "failed" | "waived";
  result: "pass" | "fail" | "advisory" | null;
  risk_level: "low" | "medium" | "high" | "critical" | null;
  notes: string;
  action_required: string | null;
  action_due: string | null;
  manager_oversight: boolean;
  linked_maintenance_id: string | null;
}

interface BuildingsData {
  buildings: Building[];
  checks: BuildingCheck[];
  due: BuildingCheck[];
  overdue: BuildingCheck[];
  failed: BuildingCheck[];
  summary: {
    total_checks: number;
    due: number;
    overdue: number;
    failed: number;
    passed: number;
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CHECK_TYPE_LABELS: Record<string, string> = {
  daily_walkround: "Daily Walkround",
  medication_room_security: "Medication Room Security",
  food_hygiene: "Food Hygiene (Kitchen)",
  fire_alarm_test: "Fire Alarm Test",
  external_security: "External Security",
  emergency_lighting: "Emergency Lighting",
  perimeter_check: "Perimeter Check",
  water_temperature: "Water Temperature",
  infection_control: "Infection Control",
  fire_drill: "Fire Drill",
  coshh: "COSHH Check",
  garden_inspection: "Garden Inspection",
  gas_safety: "Gas Safety",
  electrical_inspection: "Electrical Inspection",
  fire_risk_assessment: "Fire Risk Assessment",
  pat_testing: "PAT Testing",
};

const CHECK_FREQUENCY: {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  checks: { key: string; label: string }[];
}[] = [
  {
    label: "Daily",
    icon: CheckSquare,
    color: "text-blue-600",
    bg: "bg-blue-50",
    checks: [
      { key: "daily_walkround", label: "Building Walkround" },
      { key: "fire_alarm_test", label: "Fire Alarm Test" },
      { key: "medication_room_security", label: "Medication Room Security" },
      { key: "food_hygiene", label: "Kitchen / Food Hygiene" },
    ],
  },
  {
    label: "Weekly",
    icon: Calendar,
    color: "text-violet-600",
    bg: "bg-violet-50",
    checks: [
      { key: "fire_alarm_test", label: "Fire Alarm (Weekly Test)" },
      { key: "perimeter_check", label: "Perimeter Check" },
      { key: "external_security", label: "External Security" },
    ],
  },
  {
    label: "Monthly",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    checks: [
      { key: "emergency_lighting", label: "Emergency Lighting" },
      { key: "water_temperature", label: "Water Temperature" },
      { key: "infection_control", label: "Infection Control Audit" },
    ],
  },
  {
    label: "Quarterly",
    icon: Shield,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    checks: [
      { key: "fire_drill", label: "Fire Drill" },
      { key: "coshh", label: "COSHH Check" },
      { key: "garden_inspection", label: "Garden / External Areas" },
    ],
  },
  {
    label: "Annual",
    icon: FileText,
    color: "text-rose-600",
    bg: "bg-rose-50",
    checks: [
      { key: "gas_safety", label: "Gas Safety Certificate" },
      { key: "electrical_inspection", label: "Electrical Safety" },
      { key: "fire_risk_assessment", label: "Fire Risk Assessment" },
      { key: "pat_testing", label: "PAT Testing" },
    ],
  },
];

const STATUS_CFG: Record<string, { color: string; bg: string; border: string; label: string; icon: React.ElementType }> = {
  completed: { color: "text-[--cs-success]", bg: "bg-[--cs-success-bg]", border: "border-[--cs-success-soft]", label: "Completed", icon: CheckCircle2 },
  due: { color: "text-[--cs-info]", bg: "bg-[--cs-info-bg]", border: "border-[--cs-info-soft]", label: "Due", icon: Clock },
  overdue: { color: "text-[--cs-risk]", bg: "bg-[--cs-risk-bg]", border: "border-[--cs-risk-soft]", label: "Overdue", icon: AlertTriangle },
  failed: { color: "text-[--cs-risk]", bg: "bg-[--cs-risk-bg]", border: "border-[--cs-risk-soft]", label: "Failed", icon: XCircle },
  waived: { color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200", label: "Waived", icon: Eye },
};

const RESULT_CFG: Record<string, { color: string; bg: string; label: string }> = {
  pass: { color: "text-[--cs-success]", bg: "bg-[--cs-success-bg]", label: "Pass" },
  fail: { color: "text-[--cs-risk]", bg: "bg-[--cs-risk-bg]", label: "Fail" },
  advisory: { color: "text-[--cs-warning]", bg: "bg-[--cs-warning-bg]", label: "Advisory" },
};

const RISK_CFG: Record<string, { color: string; bg: string }> = {
  low: { color: "text-slate-600", bg: "bg-slate-100" },
  medium: { color: "text-[--cs-warning]", bg: "bg-[--cs-warning-bg]" },
  high: { color: "text-orange-700", bg: "bg-orange-100" },
  critical: { color: "text-[--cs-risk]", bg: "bg-[--cs-risk-bg]" },
};

// ── Cert expiry helpers ───────────────────────────────────────────────────────

function daysUntil(date: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

function certStatus(date: string): "ok" | "warning" | "expired" {
  const days = daysUntil(date);
  if (days < 0) return "expired";
  if (days < 60) return "warning";
  return "ok";
}

const CERT_STATUS_CFG = {
  ok: { color: "text-[--cs-success]", bg: "bg-[--cs-success-bg]", border: "border-[--cs-success-soft]", dot: "bg-[--cs-success]", label: "Valid" },
  warning: { color: "text-[--cs-warning]", bg: "bg-[--cs-warning-bg]", border: "border-[--cs-warning-soft]", dot: "bg-[--cs-warning]", label: "Expiring Soon" },
  expired: { color: "text-[--cs-risk]", bg: "bg-[--cs-risk-bg]", border: "border-[--cs-risk-soft]", dot: "bg-[--cs-risk]", label: "Expired / Overdue" },
};

// ── Add Check Form ────────────────────────────────────────────────────────────

function AddCheckForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: Record<string, string>) => void }) {
  const { currentUser } = useAuthContext();
  const [form, setForm] = useState({
    check_type: "daily_walkround",
    area: "main_building",
    check_date: todayStr(),
    responsible_person: currentUser?.id ?? "staff_darren",
    status: "completed",
    result: "pass",
    risk_level: "",
    notes: "",
    action_required: "",
    action_due: "",
  });
  const [isNonPass, setIsNonPass] = useState(false);

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (k === "result") setIsNonPass(v === "fail" || v === "advisory");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
          <div className="font-bold text-slate-900">Record Building Check</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Check Type</label>
              <select value={form.check_type} onChange={(e) => set("check_type", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                {Object.entries(CHECK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Area</label>
              <select value={form.area} onChange={(e) => set("area", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                {["main_building", "kitchen", "garden", "medication_room", "bedrooms", "office", "garage", "external"].map((a) => (
                  <option key={a} value={a}>{a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Date</label>
              <input type="date" value={form.check_date} onChange={(e) => set("check_date", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Result</label>
              <select value={form.result} onChange={(e) => set("result", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
                <option value="advisory">Advisory</option>
              </select>
            </div>
          </div>
          {isNonPass && (
            <div className="rounded-xl bg-[--cs-risk-bg] border border-[--cs-risk-soft] p-3 space-y-3">
              <div className="text-xs font-semibold text-[--cs-risk] flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Non-pass result — additional details required</div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Risk Level</label>
                <select value={form.risk_level} onChange={(e) => set("risk_level", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="">Select risk level</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Action Required</label>
                <input value={form.action_required} onChange={(e) => set("action_required", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" placeholder="Describe action needed..." />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Action Due By</label>
                <input type="date" value={form.action_due} onChange={(e) => set("action_due", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              </div>
              <div className="rounded-lg bg-[--cs-warning-bg] border border-[--cs-warning-soft] px-3 py-2 text-xs text-[--cs-warning]">
                Submitting will automatically create a maintenance task and notify the manager.
              </div>
            </div>
          )}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none" placeholder="Any observations or comments..." />
          </div>
        </div>
        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onSubmit(form)} className="bg-slate-900 hover:bg-slate-800">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Record Check
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Dashboard (Home Operations Hub) ─────────────────────────────────────

function DashboardTab({ data, onAddCheck }: { data: BuildingsData; onAddCheck: () => void }) {
  const { checks = [], summary, overdue = [], failed = [] } = data;
  const today = todayStr();
  const completedToday = checks.filter((c) => c.check_date === today && c.status === "completed").length;
  const hasAlerts = overdue.length > 0 || failed.length > 0;

  // Cross-domain data
  const maintQuery = useMaintenance();
  const maintMeta = maintQuery.data?.meta;
  const maintItems = maintQuery.data?.data ?? [];
  const urgentMaint = maintItems.filter((m: MaintenanceItem) => m.priority === "urgent" && m.status === "open");

  const vehicleQuery = useQuery({
    queryKey: ["vehicles-summary"],
    queryFn: async () => {
      const res = await fetch("/api/v1/vehicles");
      if (!res.ok) return null;
      return res.json() as Promise<{ data: { vehicles: Array<{ id: string; registration: string; status: string }>; defects: Array<{ id: string }> } }>;
    },
  });
  const vehicleSummary = vehicleQuery.data?.data;
  const vehicleDefects = vehicleSummary?.defects?.length ?? 0;
  const vehiclesRestricted = vehicleSummary?.vehicles?.filter((v) => v.status === "restricted" || v.status === "off_road").length ?? 0;
  const vehiclesAvailable = vehicleSummary?.vehicles?.filter((v) => v.status === "available").length ?? 0;

  const getCheckStatus = (checkKey: string) => {
    const recent = [...checks]
      .filter((c) => c.check_type === checkKey)
      .sort((a, b) => b.check_date.localeCompare(a.check_date))[0];
    if (!recent) return { lastDone: null, status: "never", result: null };
    return { lastDone: recent.check_date, status: recent.status, result: recent.result };
  };

  const dailyChecks = CHECK_FREQUENCY.find((f) => f.label === "Daily")?.checks ?? [];
  const allDailyDone = dailyChecks.every(({ key }) => {
    const { lastDone } = getCheckStatus(key);
    return lastDone === today;
  });

  return (
    <div className="space-y-6">

      {/* Alert strip */}
      {hasAlerts && (
        <div className="rounded-2xl bg-[--cs-risk-bg] border border-[--cs-risk-soft] p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[--cs-risk] shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-[--cs-risk]">
              {overdue.length > 0 && `${overdue.length} overdue check${overdue.length > 1 ? "s" : ""}`}
              {overdue.length > 0 && failed.length > 0 && " — "}
              {failed.length > 0 && `${failed.length} failed check${failed.length > 1 ? "s" : ""} requiring action`}
            </div>
            <div className="text-xs text-[--cs-risk] mt-0.5">
              {overdue.map((c) => CHECK_TYPE_LABELS[c.check_type] || c.check_type).join(", ")} must be completed immediately.
            </div>
          </div>
        </div>
      )}

      {/* Cross-domain operations summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Buildings domain */}
        <div className={cn(
          "rounded-2xl border p-5 space-y-3",
          hasAlerts ? "border-[--cs-risk-soft] bg-[--cs-risk-bg]" : "border-[--cs-success-soft] bg-[--cs-success-bg]"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-xl bg-white shadow-sm", hasAlerts ? "border border-[--cs-risk-soft]" : "border border-[--cs-success-soft]")}>
                <Building2 className={cn("h-4 w-4", hasAlerts ? "text-[--cs-risk]" : "text-[--cs-success]")} />
              </div>
              <span className="text-xs font-semibold text-slate-700">Buildings</span>
            </div>
            {hasAlerts
              ? <AlertTriangle className="h-4 w-4 text-[--cs-risk]" />
              : <CheckCircle2 className="h-4 w-4 text-[--cs-success]" />
            }
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <div className={cn("text-2xl font-bold tabular-nums", hasAlerts ? "text-[--cs-risk]" : "text-[--cs-success]")}>{completedToday}</div>
              <div className="text-[10px] text-slate-500">Done today</div>
            </div>
            <div className="text-center">
              <div className={cn("text-2xl font-bold tabular-nums", (summary?.overdue ?? 0) > 0 ? "text-[--cs-risk]" : "text-slate-600")}>{summary?.overdue ?? 0}</div>
              <div className="text-[10px] text-slate-500">Overdue</div>
            </div>
          </div>
          {allDailyDone && (
            <div className="rounded-xl bg-white/60 border border-[--cs-success-soft] px-3 py-1.5 text-[11px] text-[--cs-success] font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />All daily checks done
            </div>
          )}
        </div>

        {/* Vehicles domain */}
        <div className={cn(
          "rounded-2xl border p-5 space-y-3",
          vehicleDefects > 0 ? "border-[--cs-warning-soft] bg-[--cs-warning-bg]" : "border-slate-200 bg-slate-50"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-100">
                <Car className={cn("h-4 w-4", vehicleDefects > 0 ? "text-[--cs-warning]" : "text-slate-600")} />
              </div>
              <span className="text-xs font-semibold text-slate-700">Vehicles</span>
            </div>
            {vehicleDefects > 0
              ? <AlertTriangle className="h-4 w-4 text-[--cs-warning]" />
              : <CheckCircle2 className="h-4 w-4 text-slate-400" />
            }
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums text-slate-800">{vehiclesAvailable}</div>
              <div className="text-[10px] text-slate-500">Available</div>
            </div>
            <div className="text-center">
              <div className={cn("text-2xl font-bold tabular-nums", vehicleDefects > 0 ? "text-[--cs-warning]" : "text-slate-500")}>{vehicleDefects}</div>
              <div className="text-[10px] text-slate-500">Defects</div>
            </div>
          </div>
          {vehiclesRestricted > 0 && (
            <div className="rounded-xl bg-white/60 border border-[--cs-warning-soft] px-3 py-1.5 text-[11px] text-[--cs-warning] font-medium flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />{vehiclesRestricted} vehicle{vehiclesRestricted !== 1 ? "s" : ""} restricted
            </div>
          )}
          <a href="/vehicles">
            <Button size="sm" variant="outline" className="w-full h-7 text-xs mt-1">
              <ChevronRight className="h-3.5 w-3.5 mr-1" />View Vehicles
            </Button>
          </a>
        </div>

        {/* Maintenance domain */}
        <div className={cn(
          "rounded-2xl border p-5 space-y-3",
          urgentMaint.length > 0 ? "border-orange-200 bg-orange-50" : "border-slate-200 bg-slate-50"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-100">
                <Wrench className={cn("h-4 w-4", urgentMaint.length > 0 ? "text-orange-600" : "text-slate-600")} />
              </div>
              <span className="text-xs font-semibold text-slate-700">Maintenance</span>
            </div>
            {urgentMaint.length > 0
              ? <AlertTriangle className="h-4 w-4 text-orange-500" />
              : <CheckCircle2 className="h-4 w-4 text-slate-400" />
            }
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <div className={cn("text-2xl font-bold tabular-nums", (maintMeta?.open ?? 0) > 0 ? "text-orange-700" : "text-slate-600")}>{maintMeta?.open ?? "—"}</div>
              <div className="text-[10px] text-slate-500">Open jobs</div>
            </div>
            <div className="text-center">
              <div className={cn("text-2xl font-bold tabular-nums", urgentMaint.length > 0 ? "text-[--cs-risk]" : "text-slate-500")}>{urgentMaint.length}</div>
              <div className="text-[10px] text-slate-500">Urgent</div>
            </div>
          </div>
          {urgentMaint.length > 0 && (
            <div className="rounded-xl bg-white/60 border border-orange-200 px-3 py-1.5 text-[11px] text-orange-700 font-medium truncate">
              {urgentMaint[0]?.title ?? "Urgent job outstanding"}
            </div>
          )}
          <a href="/maintenance">
            <Button size="sm" variant="outline" className="w-full h-7 text-xs mt-1">
              <ChevronRight className="h-3.5 w-3.5 mr-1" />View Maintenance
            </Button>
          </a>
        </div>
      </div>

      {/* Today's required checks */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5" />Today&apos;s Required Checks
        </h3>
        <div className="rounded-2xl border bg-white divide-y divide-slate-50">
          {dailyChecks.map(({ key, label }) => {
            const { lastDone, result } = getCheckStatus(key);
            const doneToday = lastDone === today;
            return (
              <div key={key} className={cn(
                "flex items-center gap-3 px-4 py-3",
                doneToday ? "bg-[--cs-success-bg]" : ""
              )}>
                <div className="shrink-0">
                  {doneToday
                    ? <CheckCircle2 className="h-4 w-4 text-[--cs-success]" />
                    : <Clock className="h-4 w-4 text-[--cs-warning]" />
                  }
                </div>
                <span className="text-sm text-slate-700 flex-1 font-medium">{label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {doneToday ? (
                    <>
                      {result && (
                        <Badge className={cn("text-[9px] rounded-full border-0", RESULT_CFG[result]?.bg, RESULT_CFG[result]?.color)}>
                          {RESULT_CFG[result]?.label}
                        </Badge>
                      )}
                      <span className="text-[10px] text-[--cs-success] font-medium">Done</span>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-xs border-[--cs-warning-soft] text-[--cs-warning] hover:bg-[--cs-warning-bg]" onClick={onAddCheck}>
                      <Plus className="h-3 w-3 mr-0.5" />Record
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Frequency grid — weekly through annual */}
      <div className="space-y-3">
        {CHECK_FREQUENCY.filter((f) => f.label !== "Daily").map((freq) => {
          const Icon = freq.icon;
          return (
            <Card key={freq.label} className="overflow-hidden">
              <CardHeader className="py-3 px-5">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className={cn("rounded-lg p-1.5", freq.bg)}>
                    <Icon className={cn("h-3.5 w-3.5", freq.color)} />
                  </div>
                  <span>{freq.label} Checks</span>
                  <Badge className={cn("text-[9px] rounded-full ml-auto border-0", freq.bg, freq.color)}>
                    {(freq.checks?.length ?? 0)} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-slate-100">
                  {freq.checks.map(({ key, label }) => {
                    const { lastDone, status, result } = getCheckStatus(key);
                    const isOverdue = status === "overdue";
                    const isFailed = result === "fail";
                    const isDue = status === "due";
                    return (
                      <div key={key} className={cn(
                        "flex items-center gap-4 py-3 px-1",
                        (isOverdue || isFailed) && "bg-[--cs-risk-bg] -mx-1 px-2 rounded-xl",
                        isDue && "bg-[--cs-info-bg] -mx-1 px-2 rounded-xl",
                      )}>
                        <div className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          isOverdue || isFailed ? "bg-[--cs-risk]" : isDue ? "bg-[--cs-info]" : lastDone ? "bg-[--cs-success]" : "bg-slate-300"
                        )} />
                        <span className="text-sm text-slate-700 flex-1 font-medium">{label}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {lastDone ? (
                            <span className="text-xs text-slate-400">Last: {formatDate(lastDone)}</span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Never recorded</span>
                          )}
                          {result && (
                            <Badge className={cn("text-[9px] rounded-full border-0", RESULT_CFG[result]?.bg, RESULT_CFG[result]?.color)}>
                              {RESULT_CFG[result]?.label}
                            </Badge>
                          )}
                          {isOverdue && <Badge className="text-[9px] rounded-full bg-[--cs-risk-bg] text-[--cs-risk] border-0">Overdue</Badge>}
                          {isDue && <Badge className="text-[9px] rounded-full bg-[--cs-info-bg] text-[--cs-info] border-0">Due</Badge>}
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={onAddCheck}>
                          <Plus className="h-3 w-3 mr-0.5" />Record
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab: Check History ────────────────────────────────────────────────────────

function CheckHistoryTab({ data, onAddCheck }: { data: BuildingsData; onAddCheck: () => void }) {
  const [search, setSearch] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "type" | "status" | "risk">("date");

  const areas = [...new Set((data.checks ?? []).map((c) => c.area))].filter(Boolean);

  const filtered = useMemo(() => {
    let list = [...(data.checks ?? [])];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        (CHECK_TYPE_LABELS[c.check_type] || c.check_type).toLowerCase().includes(q) ||
        c.area?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q)
      );
    }
    if (filterArea) list = list.filter((c) => c.area === filterArea);
    if (filterResult) list = list.filter((c) => c.result === filterResult);
    if (filterStatus) list = list.filter((c) => c.status === filterStatus);

    const statusOrder: Record<string, number> = { overdue: 0, failed: 1, due: 2, completed: 3, waived: 4 };
    const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

    switch (sortBy) {
      case "date":
        list.sort((a, b) => b.check_date.localeCompare(a.check_date));
        break;
      case "type":
        list.sort((a, b) => (CHECK_TYPE_LABELS[a.check_type] ?? a.check_type).localeCompare(CHECK_TYPE_LABELS[b.check_type] ?? b.check_type));
        break;
      case "status":
        list.sort((a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5));
        break;
      case "risk":
        list.sort((a, b) => (riskOrder[a.risk_level ?? ""] ?? 5) - (riskOrder[b.risk_level ?? ""] ?? 5));
        break;
    }
    return list;
  }, [data.checks, search, filterArea, filterResult, filterStatus, sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search checks..." className="pl-9" />
        </div>
        <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs">
          <option value="">All areas</option>
          {areas.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
        </select>
        <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs">
          <option value="">All results</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
          <option value="advisory">Advisory</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs">
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="due">Due</option>
          <option value="overdue">Overdue</option>
          <option value="failed">Failed</option>
        </select>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs">
            <option value="date">Date</option>
            <option value="type">Type</option>
            <option value="status">Status</option>
            <option value="risk">Risk Level</option>
          </select>
        </div>
        <Button size="sm" className="ml-auto" onClick={onAddCheck}>
          <Plus className="h-3.5 w-3.5 mr-1" />Add Check
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">No checks match your filters.</div>
        )}
        {filtered.map((check) => {
          const isFail = check.result === "fail";
          const statusCfg = STATUS_CFG[check.status] || STATUS_CFG.due;
          const StatusIcon = statusCfg.icon;
          return (
            <div key={check.id} className={cn(
              "rounded-2xl border bg-white p-4 hover:shadow-sm transition-all",
              isFail ? "border-l-4 border-l-[--cs-risk] border-[--cs-risk-soft] bg-[--cs-risk-bg]" : "border-slate-200"
            )}>
              <div className="flex items-start gap-4">
                <div className={cn("rounded-xl p-2 shrink-0", statusCfg.bg)}>
                  <StatusIcon className={cn("h-4 w-4", statusCfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-900">
                      {CHECK_TYPE_LABELS[check.check_type] || check.check_type}
                    </span>
                    {check.result && (
                      <Badge className={cn("text-[9px] rounded-full border-0", RESULT_CFG[check.result].bg, RESULT_CFG[check.result].color)}>
                        {RESULT_CFG[check.result].label}
                      </Badge>
                    )}
                    {check.risk_level && (
                      <Badge className={cn("text-[9px] rounded-full border-0", RISK_CFG[check.risk_level].bg, RISK_CFG[check.risk_level].color)}>
                        {check.risk_level} risk
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                    <span>{formatDate(check.check_date)}</span>
                    {check.area && <span className="capitalize">{check.area.replace(/_/g, " ")}</span>}
                  </div>
                  {check.notes && (
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{check.notes}</p>
                  )}
                  {check.action_required && (
                    <div className="mt-2 rounded-xl bg-[--cs-warning-bg] border border-[--cs-warning-soft] px-3 py-2">
                      <div className="text-xs font-medium text-[--cs-warning]">Action required: {check.action_required}</div>
                      {check.action_due && <div className="text-[10px] text-[--cs-warning] mt-0.5">Due: {formatDate(check.action_due)}</div>}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <Badge className={cn("text-[9px] rounded-full border-0", statusCfg.bg, statusCfg.color)}>
                    {statusCfg.label}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab: Certificates & Compliance ────────────────────────────────────────────

function CertificatesTab({ data }: { data: BuildingsData }) {
  const building = data.buildings?.[0];
  if (!building) return null;

  const certs = [
    {
      label: "Gas Safety Certificate",
      icon: Flame,
      expiry: building.gas_cert_expiry,
      description: "Annual gas safety inspection by Gas Safe registered engineer",
      required_by: "Gas Safety (Installation and Use) Regulations 1998",
    },
    {
      label: "Electrical Safety Certificate",
      icon: Zap,
      expiry: building.electrical_cert_expiry,
      description: "EICR — Electrical Installation Condition Report",
      required_by: "Electricity at Work Regulations 1989",
    },
    {
      label: "Fire Risk Assessment",
      icon: Flame,
      expiry: null,
      lastDone: building.fire_risk_assessment_date,
      description: "Review and update at least annually or after significant change",
      required_by: "Regulatory Reform (Fire Safety) Order 2005",
    },
    {
      label: "EPC Rating",
      icon: Building2,
      expiry: null,
      lastDone: null,
      rating: building.epc_rating,
      description: "Energy Performance Certificate — valid for 10 years",
      required_by: "Energy Performance of Buildings Regulations",
    },
    {
      label: "Ofsted Registration",
      icon: Shield,
      expiry: null,
      lastDone: null,
      description: "Children's Home registration with Ofsted",
      required_by: "Children's Homes (England) Regulations 2015",
      status_override: "ok",
      note: "URN: SC123456 — Registration active",
    },
    {
      label: "Full Building Inspection",
      icon: Eye,
      expiry: building.next_inspection_due,
      lastDone: building.last_full_inspection,
      description: "Annual structural inspection and compliance check",
      required_by: "Internal policy",
    },
  ];

  const upcoming = certs.filter((c) => c.expiry && daysUntil(c.expiry) >= 0 && daysUntil(c.expiry) <= 90);

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <div className="rounded-2xl bg-[--cs-warning-bg] border border-[--cs-warning-soft] p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[--cs-warning] shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-[--cs-warning]">Upcoming renewals in the next 90 days</div>
            <div className="text-xs text-[--cs-warning] mt-0.5">
              {upcoming.map((c) => `${c.label} (${formatDate(c.expiry!)})`).join(" · ")}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {certs.map(({ label, icon: Icon, expiry, lastDone, rating, description, required_by, status_override, note }) => {
          const status = status_override as "ok" | "warning" | "expired" || (expiry ? certStatus(expiry) : "ok");
          const cfg = CERT_STATUS_CFG[status];
          const days = expiry ? daysUntil(expiry) : null;

          return (
            <div key={label} className={cn("rounded-2xl border p-5 bg-white", cfg.border)}>
              <div className="flex items-start gap-4">
                <div className={cn("rounded-xl p-3 shrink-0", cfg.bg)}>
                  <Icon className={cn("h-5 w-5", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{label}</span>
                        <div className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                        <Badge className={cn("text-[9px] rounded-full border-0", cfg.bg, cfg.color)}>{cfg.label}</Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{description}</div>
                    </div>
                    <div className="text-right shrink-0">
                      {expiry && (
                        <>
                          <div className={cn("text-sm font-bold", cfg.color)}>
                            {days !== null && days < 0 ? "Expired" : days === 0 ? "Expires today" : `${days} days`}
                          </div>
                          <div className="text-xs text-slate-400">{formatDate(expiry)}</div>
                        </>
                      )}
                      {lastDone && !expiry && <div className="text-xs text-slate-400">Last: {formatDate(lastDone)}</div>}
                      {rating && <div className="text-xl font-black text-[--cs-success]">{rating}</div>}
                      {note && <div className="text-xs text-slate-500 mt-0.5">{note}</div>}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-[10px] text-slate-400 italic">{required_by}</div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0"
                      disabled
                      title="Certificate uploads are managed in the Documents section."
                    >
                      <Upload className="h-3 w-3 mr-1" />Upload Certificate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab: Hazards & Maintenance ────────────────────────────────────────────────

function HazardsTab({ data }: { data: BuildingsData }) {
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const openHazards = [...(data.failed ?? []), ...(data.overdue ?? [])].filter((c) =>
    c.action_required || c.status === "overdue"
  );

  // Deduplicate
  const hazards = openHazards
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)
    .filter((c) => !resolvedIds.has(c.id));

  const caraSrc = hazards
    .map((h) => `• ${CHECK_TYPE_LABELS[h.check_type] || h.check_type} (${h.area}): ${h.action_required || "Overdue check"} — Risk: ${h.risk_level || "unknown"}`)
    .join("\n");

  return (
    <div className="space-y-6">
      {hazards.length === 0 ? (
        <div className="rounded-2xl border border-[--cs-success-soft] bg-[--cs-success-bg] p-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-[--cs-success] mx-auto mb-2" />
          <div className="text-sm font-semibold text-[--cs-success]">No open hazards</div>
          <div className="text-xs text-[--cs-success] mt-1">All checks are up to date and no actions are outstanding.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {hazards.map((hazard) => {
            const riskCfg = hazard.risk_level ? RISK_CFG[hazard.risk_level] : RISK_CFG.low;
            const isCritical = hazard.risk_level === "critical" || hazard.risk_level === "high";
            return (
              <div key={hazard.id} className={cn(
                "rounded-2xl border-l-4 border p-5 bg-white",
                isCritical ? "border-l-[--cs-risk] border-[--cs-risk-soft]" :
                  hazard.status === "overdue" ? "border-l-[--cs-warning] border-[--cs-warning-soft]" :
                    "border-l-orange-400 border-orange-200"
              )}>
                <div className="flex items-start gap-4">
                  <div className={cn("rounded-xl p-2.5 shrink-0", riskCfg.bg)}>
                    <AlertTriangle className={cn("h-5 w-5", riskCfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">
                            {CHECK_TYPE_LABELS[hazard.check_type] || hazard.check_type}
                          </span>
                          {hazard.risk_level && (
                            <Badge className={cn("text-[9px] rounded-full border-0 capitalize", riskCfg.bg, riskCfg.color)}>
                              {hazard.risk_level} risk
                            </Badge>
                          )}
                          {hazard.status === "overdue" && (
                            <Badge className="text-[9px] rounded-full bg-[--cs-warning-bg] text-[--cs-warning] border-0">Overdue</Badge>
                          )}
                          {hazard.result === "fail" && (
                            <Badge className="text-[9px] rounded-full bg-[--cs-risk-bg] text-[--cs-risk] border-0">Failed check</Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 capitalize">
                          Area: {hazard.area?.replace(/_/g, " ")} · Check date: {formatDate(hazard.check_date)}
                        </div>
                      </div>
                    </div>
                    {hazard.notes && (
                      <p className="text-xs text-slate-700 mt-2 leading-relaxed">{hazard.notes}</p>
                    )}
                    {hazard.action_required && (
                      <div className="mt-3 rounded-xl bg-[--cs-warning-bg] border border-[--cs-warning-soft] px-3 py-2">
                        <div className="text-xs font-semibold text-[--cs-warning]">Action required</div>
                        <div className="text-xs text-[--cs-warning] mt-0.5">{hazard.action_required}</div>
                        {hazard.action_due && (
                          <div className="text-[10px] text-[--cs-warning] mt-1">Due: {formatDate(hazard.action_due)}</div>
                        )}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      {hazard.linked_maintenance_id && (
                        <Badge variant="outline" className="text-[9px] rounded-full gap-1">
                          <Wrench className="h-3 w-3" />Maintenance job linked
                        </Badge>
                      )}
                      <a href="/maintenance">
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <Wrench className="h-3 w-3 mr-1" />View Maintenance
                        </Button>
                      </a>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setResolvedIds((prev) => new Set([...prev, hazard.id]))}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />Mark Resolved
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cara for contractor comms */}
      <CaraPanel
        mode="write"
        pageContext="Buildings & Premises — property maintenance, hazards, COSHH, asbestos, pest control, fire safety, Reg 44 evidence, health and safety compliance"
        recordType="contractor_communication"
        sourceContent={caraSrc || "No open hazards to communicate."}
        linkedRecords={`${hazards.length} open hazard(s) — Chamberlain House`}
        defaultStyle="professional_formal"
      />
    </div>
  );
}

// ── Export columns ────────────────────────────────────────────────────────────

const CHECK_EXPORT_COLS: ExportColumn<BuildingCheck>[] = [
  { header: "Check Type", accessor: (r) => CHECK_TYPE_LABELS[r.check_type] ?? r.check_type },
  { header: "Area", accessor: (r) => r.area?.replace(/_/g, " ") ?? "" },
  { header: "Date", accessor: (r) => r.check_date },
  { header: "Due Date", accessor: (r) => r.due_date },
  { header: "Status", accessor: (r) => r.status },
  { header: "Result", accessor: (r) => r.result ?? "" },
  { header: "Risk Level", accessor: (r) => r.risk_level ?? "" },
  { header: "Notes", accessor: (r) => r.notes },
  { header: "Action Required", accessor: (r) => r.action_required ?? "" },
  { header: "Action Due", accessor: (r) => r.action_due ?? "" },
  { header: "Manager Oversight", accessor: (r) => r.manager_oversight ? "Yes" : "No" },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BuildingsPage() {
  const [tab, setTab] = useState<"dashboard" | "history" | "certificates" | "hazards">("dashboard");
  const [showAddCheck, setShowAddCheck] = useState(false);
  const queryClient = useQueryClient();

  const { data: raw, isLoading, error } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const res = await fetch("/api/v1/buildings");
      if (!res.ok) throw new Error("Failed to fetch buildings data");
      const json = await res.json();
      return json.data as BuildingsData;
    },
  });

  const addCheck = useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const res = await fetch("/api/v1/buildings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          building_id: "bld_oak_main",
          status: body.result === "pass" ? "completed" : body.result === "fail" ? "failed" : "completed",
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      setShowAddCheck(false);
      if (data.linked_updates?.length) {
        setTab("hazards");
      }
    },
  });

  const TABS = [
    { id: "dashboard" as const, label: "Dashboard", icon: Building2 },
    { id: "history" as const, label: "Check History", icon: ClipboardList },
    { id: "certificates" as const, label: "Certificates", icon: FileText },
    { id: "hazards" as const, label: "Hazards & Maintenance", icon: AlertTriangle },
  ];

  const alertCount = raw ? (raw.overdue?.length ?? 0) + (raw.failed?.length ?? 0) : 0;

  return (
    <PageShell
      title="Building & H&S Compliance"
      subtitle="safety checks, certificates, and hazard management"
      caraContext={{ pageTitle: "Building & H&S Compliance", sourceType: "home_check" }}
      quickCreateContext={{ module: "buildings", defaultTaskCategory: "health_and_safety", defaultFormType: "health_safety_check" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            filename="building-checks"
            columns={CHECK_EXPORT_COLS}
            data={raw?.checks ?? []}
            label="Export"
          />
          <PrintButton title="Buildings & Safety" subtitle="Building Safety & Compliance" targetId="buildings-content" />
          <SmartUploadButton variant="inline" label="Upload Certificate" uploadContext="Buildings — safety certificate/inspection report upload" />
          <Button size="sm" onClick={() => setShowAddCheck(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />Record Check
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="buildings-content" className="space-y-6 animate-fade-in">
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all relative",
                tab === id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {id === "hazards" && alertCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[--cs-risk] text-white text-[9px] font-bold flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
              <span className="text-sm">Loading compliance data...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-[--cs-risk-bg] border border-[--cs-risk-soft] p-4 text-sm text-[--cs-risk]">
            Failed to load buildings data. Please refresh.
          </div>
        )}

        {raw && (
          <>
            {tab === "dashboard" && <DashboardTab data={raw} onAddCheck={() => setShowAddCheck(true)} />}
            {tab === "history" && <CheckHistoryTab data={raw} onAddCheck={() => setShowAddCheck(true)} />}
            {tab === "certificates" && <CertificatesTab data={raw} />}
            {tab === "hazards" && <HazardsTab data={raw} />}
          </>
        )}
      </div>

      {showAddCheck && (
        <AddCheckForm
          onClose={() => setShowAddCheck(false)}
          onSubmit={(data) => addCheck.mutate(data)}
        />
      )}
      <CareEventsPanel
        title="Care Events — Health & Safety"
        category="general"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
