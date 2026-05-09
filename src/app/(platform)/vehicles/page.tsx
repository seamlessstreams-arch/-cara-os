"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Car, AlertTriangle, CheckCircle2, Clock, XCircle,
  Plus, Search, Shield, Fuel, Wrench, Eye,
  Calendar, FileText, ChevronRight, AlertCircle,
  Users, MapPin, Gauge,
} from "lucide-react";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Vehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
  colour: string;
  year: number;
  seats: number;
  mot_expiry: string;
  insurance_expiry: string;
  tax_expiry: string;
  last_service: string;
  next_service_due: string;
  mileage: number;
  status: "available" | "restricted" | "in_use" | "off_road";
  breakdown_cover: boolean;
  notes: string | null;
}

const VEHICLE_EXPORT_COLS: ExportColumn<Vehicle>[] = [
  { header: "Registration", accessor: (v) => v.registration },
  { header: "Make", accessor: (v) => v.make },
  { header: "Model", accessor: (v) => v.model },
  { header: "Year", accessor: (v) => String(v.year) },
  { header: "Colour", accessor: (v) => v.colour },
  { header: "Seats", accessor: (v) => String(v.seats) },
  { header: "Status", accessor: (v) => v.status },
  { header: "MOT Expiry", accessor: (v) => v.mot_expiry },
  { header: "Insurance Expiry", accessor: (v) => v.insurance_expiry },
  { header: "Tax Expiry", accessor: (v) => v.tax_expiry },
  { header: "Last Service", accessor: (v) => v.last_service },
  { header: "Next Service Due", accessor: (v) => v.next_service_due },
  { header: "Mileage", accessor: (v) => String(v.mileage) },
];

interface VehicleCheck {
  id: string;
  vehicle_id: string;
  check_type: string;
  check_date: string;
  driver: string;
  tyres: "pass" | "fail" | "advisory";
  lights: "pass" | "fail" | "advisory";
  brakes: "pass" | "fail" | "advisory";
  mirrors: "pass" | "fail" | "advisory";
  fluids: "pass" | "fail" | "advisory";
  wipers: "pass" | "fail" | "advisory";
  cleanliness: "pass" | "fail" | "advisory";
  mileage_start: number;
  mileage_end: number | null;
  fuel_level: string;
  overall_result: "pass" | "fail" | "advisory";
  defects: string | null;
  notes: string | null;
}

interface VehicleWithCheck extends Vehicle {
  latest_check: VehicleCheck | null;
}

interface VehiclesData {
  vehicles: VehicleWithCheck[];
  checks: VehicleCheck[];
  defects: VehicleCheck[];
  alerts: string[];
}

interface VehiclesMeta {
  total: number;
  available: number;
  restricted: number;
  defects: number;
  compliance_alerts: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntil(date: string | null): number {
  if (!date) return 9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

function expiryStatus(date: string | null): "ok" | "warning" | "expired" {
  const days = daysUntil(date);
  if (days < 0) return "expired";
  if (days < 60) return "warning";
  return "ok";
}

const EXP_CFG = {
  ok: { color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500" },
  warning: { color: "text-amber-700", bg: "bg-amber-100", dot: "bg-amber-500" },
  expired: { color: "text-red-700", bg: "bg-red-100", dot: "bg-red-500" },
};

const STATUS_CFG = {
  available: { color: "text-emerald-700", bg: "bg-emerald-100", label: "Available" },
  restricted: { color: "text-red-700", bg: "bg-red-100", label: "Restricted" },
  in_use: { color: "text-amber-700", bg: "bg-amber-100", label: "In Use" },
  off_road: { color: "text-slate-600", bg: "bg-slate-100", label: "Off Road" },
};

const CHECK_ITEM_CFG = {
  pass: { color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500", icon: CheckCircle2 },
  advisory: { color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500", icon: AlertTriangle },
  fail: { color: "text-red-600", bg: "bg-red-50", dot: "bg-red-500", icon: XCircle },
};

const RESULT_CFG = {
  pass: { color: "text-emerald-700", bg: "bg-emerald-100", label: "Pass" },
  advisory: { color: "text-amber-700", bg: "bg-amber-100", label: "Advisory" },
  fail: { color: "text-red-700", bg: "bg-red-100", label: "Fail" },
};

const FUEL_LEVELS = ["Empty", "1/4", "1/2", "3/4", "Full"];

// ── Check Item Indicator ──────────────────────────────────────────────────────

function CheckDot({ result, label }: { result: "pass" | "fail" | "advisory"; label: string }) {
  const cfg = CHECK_ITEM_CFG[result];
  return (
    <div className={cn("flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-center", cfg.bg)} title={label}>
      <div className={cn("h-2 w-2 rounded-full", cfg.dot)} />
      <span className={cn("text-[9px] font-medium", cfg.color)}>{label.slice(0, 4)}</span>
    </div>
  );
}

// ── Vehicle Check Form ────────────────────────────────────────────────────────

function VehicleCheckForm({
  vehicles,
  onClose,
  onSubmit,
  isPending,
  preVehicleId,
}: {
  vehicles: VehicleWithCheck[];
  onClose: () => void;
  onSubmit: (data: Record<string, string | number>) => void;
  isPending: boolean;
  preVehicleId?: string;
}) {
  const [form, setForm] = useState<Record<string, string | number>>({
    vehicle_id: preVehicleId || vehicles[0]?.id || "",
    driver: "",
    check_date: todayStr(),
    tyres: "pass",
    lights: "pass",
    brakes: "pass",
    mirrors: "pass",
    fluids: "pass",
    wipers: "pass",
    cleanliness: "pass",
    mileage_start: vehicles[0]?.mileage || 0,
    mileage_end: "",
    fuel_level: "3/4",
    defects: "",
    notes: "",
  });

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const checkItems = ["tyres", "lights", "brakes", "mirrors", "fluids", "wipers", "cleanliness"] as const;

  const overallResult = (): "pass" | "advisory" | "fail" => {
    const values = checkItems.map((k) => form[k] as string);
    if (values.some((v) => v === "fail")) return "fail";
    if (values.some((v) => v === "advisory")) return "advisory";
    return "pass";
  };

  const result = overallResult();
  const isNonPass = result !== "pass";

  const handleVehicleChange = (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    set("vehicle_id", id);
    if (v) set("mileage_start", v.mileage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
          <div className="font-bold text-slate-900">Log Vehicle Check</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Vehicle + Driver */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Vehicle</label>
              <select
                value={form.vehicle_id as string}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.registration} — {v.make} {v.model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Driver</label>
              <input
                value={form.driver as string}
                onChange={(e) => set("driver", e.target.value)}
                placeholder="Driver name..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Check Date</label>
            <input type="date" value={form.check_date as string} onChange={(e) => set("check_date", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          </div>

          {/* Check items */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-3">Vehicle Condition Checks</label>
            <div className="grid grid-cols-1 gap-2">
              {checkItems.map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm text-slate-700 capitalize w-24 shrink-0">{key}</span>
                  <div className="flex gap-1">
                    {(["pass", "advisory", "fail"] as const).map((val) => (
                      <button
                        key={val}
                        onClick={() => set(key, val)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border",
                          form[key] === val
                            ? val === "pass" ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                              : val === "advisory" ? "bg-amber-100 text-amber-700 border-amber-300"
                              : "bg-red-100 text-red-700 border-red-300"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mileage + Fuel */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Mileage Start</label>
              <input type="number" value={form.mileage_start as number} onChange={(e) => set("mileage_start", Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Mileage End</label>
              <input type="number" value={form.mileage_end as string} onChange={(e) => set("mileage_end", e.target.value)} placeholder="Optional" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Fuel Level</label>
              <select value={form.fuel_level as string} onChange={(e) => set("fuel_level", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                {FUEL_LEVELS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Defects */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Defects / Issues</label>
            <textarea
              value={form.defects as string}
              onChange={(e) => set("defects", e.target.value)}
              rows={3}
              placeholder="Describe any defects, advisories, or issues observed..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">Additional Notes</label>
            <textarea
              value={form.notes as string}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Any other observations..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none"
            />
          </div>

          {/* Overall result preview */}
          <div className={cn(
            "rounded-xl p-4 border",
            result === "pass" ? "bg-emerald-50 border-emerald-200" :
              result === "advisory" ? "bg-amber-50 border-amber-200" :
                "bg-red-50 border-red-200"
          )}>
            <div className="flex items-center gap-2">
              {result === "pass" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> :
                result === "advisory" ? <AlertTriangle className="h-4 w-4 text-amber-600" /> :
                  <XCircle className="h-4 w-4 text-red-600" />}
              <span className={cn("text-sm font-bold capitalize",
                result === "pass" ? "text-emerald-700" : result === "advisory" ? "text-amber-700" : "text-red-700"
              )}>
                Overall Result: {result}
              </span>
            </div>
            {isNonPass && (
              <div className={cn("text-xs mt-1.5", result === "fail" ? "text-red-700" : "text-amber-700")}>
                Submitting will automatically create a maintenance task and notify the manager.
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={isPending || !form.driver}
            onClick={() => onSubmit({ ...form, overall_result: result, resource: "check" })}
            className={cn(
              result === "pass" ? "bg-emerald-600 hover:bg-emerald-700" :
                result === "advisory" ? "bg-amber-600 hover:bg-amber-700" :
                  "bg-red-600 hover:bg-red-700"
            )}
          >
            {isPending ? (
              <><div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />Saving...</>
            ) : (
              <><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Submit Check</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Fleet Overview ───────────────────────────────────────────────────────

function FleetOverviewTab({
  data,
  meta,
  onRunCheck,
}: {
  data: VehiclesData;
  meta: VehiclesMeta;
  onRunCheck: (vehicleId: string) => void;
}) {
  const { vehicles, alerts, defects } = data;

  return (
    <div className="space-y-6">
      {/* Compliance alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => {
            const isCritical = alert.includes("EXPIRED");
            return (
              <div key={i} className={cn(
                "rounded-2xl border p-4 flex items-start gap-3",
                isCritical ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
              )}>
                <AlertTriangle className={cn("h-5 w-5 shrink-0 mt-0.5", isCritical ? "text-red-600" : "text-amber-600")} />
                <div>
                  <div className={cn("text-sm font-semibold", isCritical ? "text-red-800" : "text-amber-800")}>{alert}</div>
                  {!isCritical && (
                    <div className={cn("text-xs mt-0.5", isCritical ? "text-red-600" : "text-amber-600")}>
                      Book renewal now to maintain compliance — vehicle should not be driven after expiry.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fleet stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Vehicles", value: meta.total, color: "text-slate-700", bg: "bg-slate-50", icon: Car },
          { label: "Available", value: meta.available, color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 },
          { label: "Restricted", value: meta.restricted, color: "text-red-600", bg: "bg-red-50", icon: XCircle },
          { label: "Active Defects", value: meta.defects, color: "text-amber-600", bg: "bg-amber-50", icon: Wrench },
          { label: "Compliance Alerts", value: meta.compliance_alerts, color: "text-rose-600", bg: "bg-rose-50", icon: AlertTriangle },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
                <div className={cn("mt-1 text-2xl font-bold", color)}>{value}</div>
              </div>
              <div className={cn("rounded-xl p-2", bg)}>
                <Icon className={cn("h-4 w-4", color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {vehicles.map((vehicle) => {
          const statusCfg = STATUS_CFG[vehicle.status];
          const latestCheck = vehicle.latest_check;
          const checkResult = latestCheck?.overall_result;

          const compliance = [
            { label: "MOT", expiry: vehicle.mot_expiry, icon: Shield },
            { label: "Insurance", expiry: vehicle.insurance_expiry, icon: FileText },
            { label: "Road Tax", expiry: vehicle.tax_expiry, icon: Car },
            { label: "Service", expiry: vehicle.next_service_due, icon: Wrench },
          ];

          const hasDefect = vehicle.status === "restricted" || (latestCheck && latestCheck.overall_result !== "pass");

          return (
            <div key={vehicle.id} className={cn(
              "rounded-2xl border bg-white p-5",
              hasDefect ? "border-amber-200" : "border-slate-200"
            )}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-slate-100 p-3">
                    <Car className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900 tracking-wide">{vehicle.registration}</span>
                      <Badge className={cn("text-[9px] rounded-full border-0", statusCfg.bg, statusCfg.color)}>
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">{vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.colour}</div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Users className="h-3 w-3" />{vehicle.seats} seats
                      <Gauge className="h-3 w-3 ml-1" />{vehicle.mileage.toLocaleString()} mi
                    </div>
                  </div>
                </div>
                <Button size="sm" className="shrink-0 bg-slate-900 hover:bg-slate-800 h-8 text-xs" onClick={() => onRunCheck(vehicle.id)}>
                  <Plus className="h-3 w-3 mr-0.5" />Run Check
                </Button>
              </div>

              {/* Compliance grid */}
              <div className="grid grid-cols-4 gap-1.5 mb-4">
                {compliance.map(({ label, expiry, icon: Icon }) => {
                  const status = expiryStatus(expiry);
                  const cfg = EXP_CFG[status];
                  const days = daysUntil(expiry);
                  return (
                    <div key={label} className={cn("rounded-xl p-2.5 text-center border", cfg.bg,
                      status === "expired" ? "border-red-200" : status === "warning" ? "border-amber-200" : "border-transparent"
                    )}>
                      <Icon className={cn("h-3.5 w-3.5 mx-auto mb-1", cfg.color)} />
                      <div className="text-[9px] font-semibold text-slate-500">{label}</div>
                      <div className={cn("text-[10px] font-bold mt-0.5", cfg.color)}>
                        {days < 0 ? "Expired" : days === 0 ? "Today!" : days < 30 ? `${days}d` : formatDate(expiry).split(" ").slice(0, 2).join(" ")}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Latest check */}
              {latestCheck ? (
                <div className={cn(
                  "rounded-xl border px-3 py-2.5 flex items-center gap-3",
                  checkResult === "pass" ? "bg-emerald-50 border-emerald-200" :
                    checkResult === "advisory" ? "bg-amber-50 border-amber-200" :
                      "bg-red-50 border-red-200"
                )}>
                  {checkResult === "pass" ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> :
                    checkResult === "advisory" ? <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" /> :
                      <XCircle className="h-4 w-4 text-red-600 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-700">
                      Last check: {formatDate(latestCheck.check_date)} · Driver: {latestCheck.driver}
                    </div>
                    {latestCheck.defects && (
                      <div className="text-[10px] text-amber-700 mt-0.5 truncate">{latestCheck.defects}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {(["tyres", "lights", "brakes", "fluids"] as const).map((k) => (
                      <CheckDot key={k} result={latestCheck[k]} label={k.charAt(0).toUpperCase() + k.slice(1)} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs text-slate-400 italic">
                  No vehicle check recorded yet
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Defects section */}
      {defects.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="rounded-lg p-1.5 bg-amber-50">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              </div>
              Active Defects / Advisories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {defects.map((d) => {
                const vehicle = vehicles.find((v) => v.id === d.vehicle_id);
                return (
                  <div key={d.id} className={cn(
                    "rounded-xl border px-4 py-3 flex items-center gap-4",
                    d.overall_result === "fail" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                  )}>
                    <div className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      d.overall_result === "fail" ? "bg-red-500" : "bg-amber-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-slate-800">{vehicle?.registration} — {vehicle?.make} {vehicle?.model}</span>
                      {d.defects && <div className="text-xs text-slate-600 mt-0.5 truncate">{d.defects}</div>}
                    </div>
                    <div className="text-xs text-slate-400">{formatDate(d.check_date)}</div>
                    <Badge className={cn("text-[9px] rounded-full border-0 capitalize", RESULT_CFG[d.overall_result].bg, RESULT_CFG[d.overall_result].color)}>
                      {RESULT_CFG[d.overall_result].label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Tab: Check History ────────────────────────────────────────────────────────

function CheckHistoryTab({
  data,
  onLogCheck,
}: {
  data: VehiclesData;
  onLogCheck: () => void;
}) {
  const [filterVehicle, setFilterVehicle] = useState("");
  const [filterResult, setFilterResult] = useState("");
  const [search, setSearch] = useState("");

  const { vehicles, checks } = data;

  const filtered = useMemo(() => {
    let list = [...checks];
    if (filterVehicle) list = list.filter((c) => c.vehicle_id === filterVehicle);
    if (filterResult) list = list.filter((c) => c.overall_result === filterResult);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => {
        const v = vehicles.find((x) => x.id === c.vehicle_id);
        return (
          c.driver?.toLowerCase().includes(q) ||
          v?.registration?.toLowerCase().includes(q) ||
          c.defects?.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [checks, filterVehicle, filterResult, search, vehicles]);

  const CHECK_COLS = ["tyres", "lights", "brakes", "mirrors", "fluids", "wipers", "cleanliness"] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search checks, drivers..." className="pl-9" />
        </div>
        <select value={filterVehicle} onChange={(e) => setFilterVehicle(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs">
          <option value="">All vehicles</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration}</option>)}
        </select>
        <select value={filterResult} onChange={(e) => setFilterResult(e.target.value)} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs">
          <option value="">All results</option>
          <option value="pass">Pass</option>
          <option value="advisory">Advisory</option>
          <option value="fail">Fail</option>
        </select>
        <Button size="sm" className="ml-auto" onClick={onLogCheck}>
          <Plus className="h-3.5 w-3.5 mr-1" />Log Vehicle Check
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">No vehicle checks match your filters.</div>
        )}
        {filtered.map((check) => {
          const vehicle = vehicles.find((v) => v.id === check.vehicle_id);
          const resultCfg = RESULT_CFG[check.overall_result];
          const isNonPass = check.overall_result !== "pass";

          return (
            <div key={check.id} className={cn(
              "rounded-2xl border bg-white p-4 transition-all hover:shadow-sm",
              check.overall_result === "fail" ? "border-l-4 border-l-red-500 border-red-200" :
                check.overall_result === "advisory" ? "border-l-4 border-l-amber-400 border-amber-200" :
                  "border-slate-200"
            )}>
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">
                      {vehicle?.registration || check.vehicle_id}
                    </span>
                    <span className="text-xs text-slate-500">{vehicle?.make} {vehicle?.model}</span>
                    <Badge className={cn("text-[9px] rounded-full border-0", resultCfg.bg, resultCfg.color)}>
                      {resultCfg.label}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 flex-wrap">
                    <span>{formatDate(check.check_date)}</span>
                    <span>Driver: {check.driver}</span>
                    <span>Fuel: {check.fuel_level}</span>
                    <span>Mileage: {check.mileage_start.toLocaleString()}{check.mileage_end ? `–${check.mileage_end.toLocaleString()}` : ""}</span>
                  </div>
                  {check.defects && isNonPass && (
                    <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                      <span className="font-semibold">Defect: </span>{check.defects}
                    </div>
                  )}
                  {check.notes && (
                    <p className="text-xs text-slate-500 mt-1.5 italic">{check.notes}</p>
                  )}
                </div>

                {/* Check item dots */}
                <div className="flex items-center gap-1 flex-wrap shrink-0">
                  {CHECK_COLS.map((k) => (
                    <CheckDot key={k} result={check[k]} label={k.charAt(0).toUpperCase() + k.slice(1)} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab: Transport Compliance ─────────────────────────────────────────────────

function TransportComplianceTab({ data }: { data: VehiclesData }) {
  const { vehicles } = data;

  const sections = [
    {
      title: "Vehicle Documentation",
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
      rows: vehicles.flatMap((v) => [
        { vehicle: v.registration, item: "MOT", expiry: v.mot_expiry, required: "Annual — must be valid at all times" },
        { vehicle: v.registration, item: "Insurance (Business Use)", expiry: v.insurance_expiry, required: "Continuous — must cover transport of young people" },
        { vehicle: v.registration, item: "Road Tax (VED)", expiry: v.tax_expiry, required: "Continuous — DVLA registered" },
        { vehicle: v.registration, item: "Next Service", expiry: v.next_service_due, required: "Per manufacturer schedule" },
      ]),
    },
  ];

  const additionalChecks = [
    { label: "Driver Licence Verification", description: "All drivers' licences checked against DVLA", status: "ok" as const, lastChecked: "2026-02-01", note: "DVLA online check — all staff verified" },
    { label: "Transport Risk Assessments", description: "Route and journey risk assessments in place", status: "ok" as const, lastChecked: "2026-01-15", note: "Individual TRAs filed per young person" },
    { label: "Child Transport Equipment", description: "Seatbelts, booster seats, restraints checked", status: "warning" as const, lastChecked: "2026-03-01", note: "Due for review — check seatbelts in FG23 HIJ" },
    { label: "Business Use Insurance Confirmed", description: "All drivers confirmed for business use journeys", status: "ok" as const, lastChecked: "2026-04-01", note: "Annual confirmation signed by all staff" },
    { label: "Driver Emergency Contacts", description: "Emergency procedures and contacts available in vehicles", status: "ok" as const, lastChecked: "2026-01-01", note: "Emergency packs in both vehicles" },
    { label: "Lone Working Policy (Transport)", description: "Lone transport journey risk protocol in place", status: "ok" as const, lastChecked: "2026-02-15", note: "Check-in procedure active" },
  ];

  const statusCfg = {
    ok: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", label: "Compliant", icon: CheckCircle2 },
    warning: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", label: "Attention Needed", icon: AlertTriangle },
    expired: { color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", label: "Non-Compliant", icon: XCircle },
  };

  return (
    <div className="space-y-6">
      {/* Vehicle compliance table */}
      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <Card key={section.title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className={cn("rounded-lg p-1.5", section.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", section.color)} />
                </div>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-2 px-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Vehicle</th>
                      <th className="py-2 px-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Item</th>
                      <th className="py-2 px-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Expiry / Due</th>
                      <th className="py-2 px-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="py-2 px-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Requirement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {section.rows.map(({ vehicle, item, expiry, required }) => {
                      const status = expiryStatus(expiry);
                      const cfg = EXP_CFG[status];
                      const days = daysUntil(expiry);
                      return (
                        <tr key={`${vehicle}-${item}`} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3">
                            <span className="text-xs font-bold text-slate-800 tracking-wide">{vehicle}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-xs text-slate-700">{item}</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className={cn("text-xs font-semibold", cfg.color)}>
                              {formatDate(expiry)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {days < 0 ? "Expired" : `${days} days`}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <div className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                              <span className={cn("text-[10px] font-medium", cfg.color)}>
                                {status === "ok" ? "Valid" : status === "warning" ? "Expiring Soon" : "Expired"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] text-slate-400">{required}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Additional checks */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Transport Safety Checks</h3>
        <div className="grid gap-3">
          {additionalChecks.map(({ label, description, status, lastChecked, note }) => {
            const cfg = statusCfg[status];
            const Icon = cfg.icon;
            return (
              <div key={label} className={cn("rounded-2xl border p-4 bg-white flex items-start gap-4", cfg.border)}>
                <div className={cn("rounded-xl p-2.5 shrink-0", cfg.bg)}>
                  <Icon className={cn("h-4 w-4", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{description}</div>
                    </div>
                    <Badge className={cn("text-[9px] rounded-full border-0 shrink-0", cfg.bg, cfg.color)}>{cfg.label}</Badge>
                  </div>
                  {note && <div className="text-xs text-slate-600 mt-2 italic">{note}</div>}
                  <div className="text-[10px] text-slate-400 mt-1">Last reviewed: {formatDate(lastChecked)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Renewal reminders */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="rounded-lg p-1.5 bg-violet-50">
              <Calendar className="h-3.5 w-3.5 text-violet-600" />
            </div>
            Renewal Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {vehicles.flatMap((v) => {
              const items = [
                { label: `${v.registration} — MOT`, expiry: v.mot_expiry },
                { label: `${v.registration} — Insurance`, expiry: v.insurance_expiry },
                { label: `${v.registration} — Service`, expiry: v.next_service_due },
              ].filter((x) => daysUntil(x.expiry) <= 90 && daysUntil(x.expiry) >= 0);
              return items;
            }).sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry))
              .map(({ label, expiry }) => {
                const days = daysUntil(expiry);
                const isUrgent = days <= 30;
                return (
                  <div key={label} className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 border",
                    isUrgent ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
                  )}>
                    <AlertCircle className={cn("h-4 w-4 shrink-0", isUrgent ? "text-red-500" : "text-amber-500")} />
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-slate-800">{label}</span>
                      <span className="text-xs text-slate-500 ml-2">expires {formatDate(expiry)}</span>
                    </div>
                    <span className={cn("text-xs font-bold", isUrgent ? "text-red-700" : "text-amber-700")}>{days} days</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0"
                      disabled
                      title="Contact your fleet provider or garage to book the renewal. Log the new date in the vehicle record once confirmed."
                    >
                      Book Renewal
                    </Button>
                  </div>
                );
              })}
            {vehicles.every((v) => [v.mot_expiry, v.insurance_expiry, v.next_service_due].every((x) => daysUntil(x) > 90)) && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4 mx-auto mb-1" />No renewals due in the next 90 days.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function VehiclesPage() {
  const [tab, setTab] = useState<"fleet" | "history" | "compliance">("fleet");
  const [showCheckForm, setShowCheckForm] = useState(false);
  const [checkVehicleId, setCheckVehicleId] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data: raw, isLoading, error } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/v1/vehicles");
      if (!res.ok) throw new Error("Failed to fetch vehicles data");
      return res.json() as Promise<{ data: VehiclesData; meta: VehiclesMeta }>;
    },
  });

  const logCheck = useMutation({
    mutationFn: async (body: Record<string, string | number>) => {
      const res = await fetch("/api/v1/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setShowCheckForm(false);
      setCheckVehicleId(undefined);
      if (result.linked_updates?.length) {
        setTab("compliance");
      }
    },
  });

  const handleRunCheck = (vehicleId: string) => {
    setCheckVehicleId(vehicleId);
    setShowCheckForm(true);
  };

  const TABS = [
    { id: "fleet" as const, label: "Fleet Overview", icon: Car },
    { id: "history" as const, label: "Check History", icon: ClipboardList },
    { id: "compliance" as const, label: "Transport Compliance", icon: Shield },
  ];

  const alertCount = raw?.meta.compliance_alerts || 0;

  return (
    <PageShell
      title="Vehicle Compliance"
      subtitle="Fleet management, vehicle checks, and transport compliance"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      quickCreateContext={{ module: "vehicles", defaultTaskCategory: "maintenance" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={raw?.data?.vehicles ?? []} columns={VEHICLE_EXPORT_COLS} filename="vehicles" />
          <PrintButton title="Vehicles" subtitle="Oak House — Vehicle Fleet Management" targetId="vehicles-content" />
          <SmartUploadButton variant="inline" label="Upload Certificate" uploadContext="Vehicles — MOT/service/insurance certificate upload" />
          <Button size="sm" onClick={() => setShowCheckForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />Log Check
          </Button>
        </div>
      }
    >
      <div id="vehicles-content" className="space-y-6 animate-fade-in">
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
              {id === "fleet" && alertCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
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
              <span className="text-sm">Loading vehicle data...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            Failed to load vehicle data. Please refresh.
          </div>
        )}

        {raw && (
          <>
            {tab === "fleet" && (
              <FleetOverviewTab data={raw.data} meta={raw.meta} onRunCheck={handleRunCheck} />
            )}
            {tab === "history" && (
              <CheckHistoryTab data={raw.data} onLogCheck={() => setShowCheckForm(true)} />
            )}
            {tab === "compliance" && (
              <TransportComplianceTab data={raw.data} />
            )}
          </>
        )}
      </div>

      {showCheckForm && raw && (
        <VehicleCheckForm
          vehicles={raw.data.vehicles}
          onClose={() => { setShowCheckForm(false); setCheckVehicleId(undefined); }}
          onSubmit={(data) => logCheck.mutate(data)}
          isPending={logCheck.isPending}
          preVehicleId={checkVehicleId}
        />
      )}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}

// Fix for ClipboardList import missing
const ClipboardList = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>
  </svg>
);
