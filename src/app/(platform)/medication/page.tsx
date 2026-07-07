"use client";

import React, { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { useMedication, useAdminister } from "@/hooks/use-medication";
import { useAuthContext } from "@/contexts/auth-context";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { useStaff } from "@/hooks/use-staff";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useCreateTrainingNeed } from "@/hooks/use-ri-learning";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { cn, formatDate, formatDateTime, todayStr, daysFromNow } from "@/lib/utils";
import type { Medication, MedicationAdministration } from "@/types";
import {
  Pill, Plus, AlertTriangle, CheckCircle2, Clock, Package,
  Shield, FileText, Calendar, TriangleAlert, X, ChevronDown,
  ChevronUp, Sparkles, Eye, ClipboardList, TrendingUp, Filter,
  Info, RefreshCw, Activity, Brain, Search, ArrowUpDown, ArrowUpRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import Link from "next/link";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  given: {
    label: "Given",
    badgeVariant: "success" as const,
    cellClass: "bg-[--cs-success]",
    cellBorder: "border-[--cs-success]",
    icon: CheckCircle2,
    iconClass: "text-[--cs-success]",
    bgClass: "bg-[--cs-success-bg] border-[--cs-success-soft]",
    textClass: "text-[--cs-success]",
  },
  late: {
    label: "Late",
    badgeVariant: "warning" as const,
    cellClass: "bg-[--cs-warning]",
    cellBorder: "border-[--cs-warning]",
    icon: Clock,
    iconClass: "text-[--cs-warning]",
    bgClass: "bg-[--cs-warning-bg] border-[--cs-warning-soft]",
    textClass: "text-[--cs-warning]",
  },
  refused: {
    label: "Refused",
    badgeVariant: "destructive" as const,
    cellClass: "bg-[--cs-risk]",
    cellBorder: "border-[--cs-risk]",
    icon: X,
    iconClass: "text-[--cs-risk]",
    bgClass: "bg-[--cs-risk-bg] border-[--cs-risk-soft]",
    textClass: "text-[--cs-risk]",
  },
  missed: {
    label: "Missed",
    badgeVariant: "destructive" as const,
    cellClass: "bg-[--cs-risk]",
    cellBorder: "border-[--cs-risk]",
    icon: AlertTriangle,
    iconClass: "text-[--cs-risk]",
    bgClass: "bg-[--cs-risk-bg] border-[--cs-risk-soft]",
    textClass: "text-[--cs-risk]",
  },
  scheduled: {
    label: "Scheduled",
    badgeVariant: "info" as const,
    cellClass: "bg-[--cs-info]",
    cellBorder: "border-[--cs-info]",
    icon: Clock,
    iconClass: "text-[--cs-info]",
    bgClass: "bg-[--cs-info-bg] border-[--cs-info-soft]",
    textClass: "text-[--cs-info]",
  },
};

const TYPE_STYLES: Record<string, string> = {
  regular: "bg-blue-100 text-blue-700",
  prn: "bg-amber-100 text-amber-700",
  controlled: "bg-red-100 text-red-700",
  topical: "bg-emerald-100 text-emerald-700",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function getDayLabel(dateStr: string): string {
  const today = todayStr();
  if (dateStr === today) return "Today";
  if (dateStr === daysFromNow(-1)) return "Yesterday";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
}

// ── Inline Administration Form ─────────────────────────────────────────────────

interface AdminFormProps {
  admin: MedicationAdministration;
  medication: Medication;
  onClose: () => void;
}

function AdminForm({ admin, medication, onClose }: AdminFormProps) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const { mutate: administer, isPending } = useAdminister();
  const adminStaffQuery = useStaff();
  const adminActiveStaff = (adminStaffQuery.data?.data ?? []).filter((s) => s.employment_status === "active");
  const [formData, setFormData] = useState({
    status: "given" as "given" | "refused" | "missed",
    actual_time: new Date().toTimeString().slice(0, 5),
    administered_by: currentUser?.id ?? "staff_darren",
    witnessed_by: "",
    dose_given: medication.dosage,
    notes: "",
    prn_reason: "",
    prn_effectiveness: "",
    reason_not_given: "",
  });

  const isPRN = medication.type === "prn";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = todayStr();
    const actualTimeISO = `${today}T${formData.actual_time}:00.000Z`;

    administer({
      id: admin.id,
      status: formData.status,
      actual_time: actualTimeISO,
      administered_by: formData.administered_by || null,
      witnessed_by: formData.witnessed_by || null,
      dose_given: formData.dose_given || null,
      notes: formData.notes || null,
      prn_reason: formData.prn_reason || null,
      prn_effectiveness: formData.prn_effectiveness || null,
      reason_not_given: formData.status !== "given" ? (formData.reason_not_given || null) : null,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 pt-3 border-t border-slate-200 space-y-3">
      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Record Administration</div>

      {/* Status */}
      <div className="grid grid-cols-3 gap-1.5">
        {(["given", "refused", "missed"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFormData((f) => ({ ...f, status: s }))}
            className={cn(
              "rounded-lg border py-2 text-xs font-medium capitalize transition-all",
              formData.status === s
                ? s === "given"
                  ? "bg-[--cs-success-bg] border-[--cs-success-soft] text-[--cs-success]"
                  : "bg-[--cs-risk-bg] border-[--cs-risk-soft] text-[--cs-risk]"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {formData.status === "given" ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-medium block mb-1">Time given</label>
              <input
                type="time"
                value={formData.actual_time}
                onChange={(e) => setFormData((f) => ({ ...f, actual_time: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium block mb-1">Dose given</label>
              <input
                type="text"
                value={formData.dose_given}
                onChange={(e) => setFormData((f) => ({ ...f, dose_given: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-medium block mb-1">Administered by</label>
              <select
                value={formData.administered_by}
                onChange={(e) => setFormData((f) => ({ ...f, administered_by: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select staff…</option>
                {adminActiveStaff.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium block mb-1">Witnessed by</label>
              <select
                value={formData.witnessed_by}
                onChange={(e) => setFormData((f) => ({ ...f, witnessed_by: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Select witness…</option>
                {adminActiveStaff.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          {isPRN && (
            <>
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">Reason for PRN administration</label>
                <input
                  type="text"
                  value={formData.prn_reason}
                  onChange={(e) => setFormData((f) => ({ ...f, prn_reason: e.target.value }))}
                  placeholder="e.g. Headache, pain, allergic reaction…"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">Effectiveness / outcome</label>
                <input
                  type="text"
                  value={formData.prn_effectiveness}
                  onChange={(e) => setFormData((f) => ({ ...f, prn_effectiveness: e.target.value }))}
                  placeholder="e.g. Headache resolved within 30 minutes…"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </>
          )}
        </>
      ) : (
        <div>
          <label className="text-[10px] text-slate-500 font-medium block mb-1">
            Reason {formData.status === "refused" ? "for refusal" : "not given"}
          </label>
          <input
            type="text"
            value={formData.reason_not_given}
            onChange={(e) => setFormData((f) => ({ ...f, reason_not_given: e.target.value }))}
            placeholder={formData.status === "refused" ? "e.g. YP declined, distressed…" : "e.g. YP not present…"}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      <div>
        <label className="text-[10px] text-slate-500 font-medium block mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Any observations, reactions or relevant context…"
          rows={2}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1" disabled={isPending} variant="success">
          {isPending ? <><RefreshCw className="h-3 w-3 animate-spin" />Saving…</> : <><CheckCircle2 className="h-3 w-3" />Record</>}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

// ── MAR Cell Tooltip ──────────────────────────────────────────────────────────

interface MARCellProps {
  admin?: MedicationAdministration;
  isScheduled?: boolean;
  dateStr: string;
}

function MARCell({ admin, isScheduled, dateStr }: MARCellProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const today = todayStr();
  const isFuture = dateStr > today;

  if (!admin && !isFuture && !isScheduled) {
    return <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 mx-auto" title="No dose scheduled" />;
  }

  if (isFuture || (isScheduled && !admin)) {
    return (
      <div className="relative flex items-center justify-center">
        <div className="h-8 w-8 rounded-full bg-[--cs-info-soft] border-2 border-[--cs-info-soft] mx-auto flex items-center justify-center" title="Scheduled">
          <div className="h-2 w-2 rounded-full bg-[--cs-info]" />
        </div>
      </div>
    );
  }

  if (!admin) {
    return <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 mx-auto" />;
  }

  const cfg = (STATUS_CONFIG as unknown as Record<string, typeof STATUS_CONFIG.given>)[admin.status] ?? STATUS_CONFIG.missed;

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {admin.status === "given" && (
        <div className="h-8 w-8 rounded-full bg-[--cs-success] border-2 border-[--cs-success] mx-auto flex items-center justify-center shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-white" />
        </div>
      )}
      {admin.status === "late" && (
        <div className="h-8 w-8 rounded-full bg-[--cs-warning] border-2 border-[--cs-warning] mx-auto flex items-center justify-center shadow-sm">
          <Clock className="h-4 w-4 text-white" />
        </div>
      )}
      {(admin.status === "refused" || admin.status === "missed") && (
        <div className="h-8 w-8 rounded-full bg-[--cs-risk] border-2 border-[--cs-risk] mx-auto flex items-center justify-center shadow-sm">
          <X className="h-4 w-4 text-white" />
        </div>
      )}
      {admin.status === "scheduled" && (
        <div className="h-8 w-8 rounded-full bg-[--cs-info] border-2 border-[--cs-info] mx-auto flex items-center justify-center shadow-sm">
          <div className="h-2.5 w-2.5 rounded-full bg-white" />
        </div>
      )}

      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-xl bg-slate-900 text-white text-[10px] p-3 shadow-xl pointer-events-none">
          <div className="font-bold capitalize mb-1">{admin.status}</div>
          {admin.actual_time && (
            <div>Given at: <span className="text-slate-300">{formatTime(admin.actual_time)}</span></div>
          )}
          {admin.scheduled_time && (
            <div>Scheduled: <span className="text-slate-300">{formatTime(admin.scheduled_time)}</span></div>
          )}
          {admin.administered_by && (
            <div>By: <span className="text-slate-300">{getStaffName(admin.administered_by)}</span></div>
          )}
          {admin.witnessed_by && (
            <div>Witness: <span className="text-slate-300">{getStaffName(admin.witnessed_by)}</span></div>
          )}
          {admin.notes && (
            <div className="mt-1 text-slate-400 border-t border-slate-700 pt-1">{admin.notes}</div>
          )}
          {admin.reason_not_given && (
            <div className="mt-1 text-amber-300">{admin.reason_not_given}</div>
          )}
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

// ── Tab 1: Today's Schedule ───────────────────────────────────────────────────

function TodayScheduleTab({
  medications,
  todaySchedule,
  exceptions,
  stockAlerts,
  meta,
  mar,
}: {
  medications: Medication[];
  todaySchedule: MedicationAdministration[];
  exceptions: MedicationAdministration[];
  stockAlerts: Medication[];
  meta: Record<string, number>;
  mar: { medication: Medication; administrations: MedicationAdministration[] }[];
}) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [openForms, setOpenForms] = useState<Set<string>>(new Set());
  const [caraFor, setCaraFor] = useState<string | null>(null);
  const [schedSearch, setSchedSearch] = useState("");
  const schedYpQuery = useYoungPeople();
  const schedAllYP = schedYpQuery.data?.data ?? [];

  const todayStr_ = todayStr();
  const todayExceptions = exceptions.filter((a) =>
    a.scheduled_time.startsWith(todayStr_) && (a.status === "refused" || a.status === "missed" || a.status === "late")
  );

  const givenToday = todaySchedule.filter((a) => a.status === "given").length;

  // Group today's schedule by YP
  const byYP = schedAllYP.map((yp) => {
    const ypMeds = medications.filter((m) => m.child_id === yp.id && m.is_active);
    const ypSchedule = todaySchedule.filter((a) => a.child_id === yp.id);

    // Also include PRN meds even if not in today_schedule
    const allEntries: Array<{ med: Medication; admin: MedicationAdministration | null }> = [];

    for (const med of ypMeds) {
      if (med.type === "prn") {
        // PRNs: show any recorded today
        const prnToday = todaySchedule.filter((a) => a.medication_id === med.id);
        if (prnToday.length > 0) {
          prnToday.forEach((a) => allEntries.push({ med, admin: a }));
        } else {
          allEntries.push({ med, admin: null });
        }
      } else {
        const schedAdmin = ypSchedule.find((a) => a.medication_id === med.id);
        allEntries.push({ med, admin: schedAdmin ?? null });
      }
    }

    return { yp, entries: allEntries };
  }).filter((g) => g.entries.length > 0).filter((g) => {
    if (!schedSearch.trim()) return true;
    const q = schedSearch.toLowerCase();
    const ypName = `${g.yp.preferred_name || ""} ${g.yp.first_name} ${g.yp.last_name}`.toLowerCase();
    const medNames = g.entries.map((e) => e.med.name.toLowerCase()).join(" ");
    return ypName.includes(q) || medNames.includes(q);
  });

  const toggleForm = (id: string) => {
    setOpenForms((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Scheduled Today",
            value: meta.scheduled_today ?? todaySchedule.length,
            sub: "doses due",
            color: "text-[--cs-info]",
            bg: "bg-[--cs-info-bg]",
          },
          {
            label: "Given Today",
            value: givenToday,
            sub: "administered",
            color: "text-[--cs-success]",
            bg: "bg-[--cs-success-bg]",
          },
          {
            label: "Exceptions This Week",
            value: meta.exceptions_this_week ?? exceptions.length,
            sub: "need review",
            color: exceptions.length > 0 ? "text-[--cs-risk]" : "text-slate-400",
            bg: exceptions.length > 0 ? "bg-[--cs-risk-bg]" : "bg-slate-50",
          },
          {
            label: "Stock Alerts",
            value: stockAlerts.length,
            sub: "low stock",
            color: stockAlerts.length > 0 ? "text-[--cs-warning]" : "text-slate-400",
            bg: stockAlerts.length > 0 ? "bg-[--cs-warning-bg]" : "bg-slate-50",
          },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className={cn("rounded-2xl border p-4 text-center", bg)}>
            <div className={cn("text-3xl font-bold", color)}>{value}</div>
            <div className="text-xs font-semibold text-slate-700 mt-0.5">{label}</div>
            <div className="text-[10px] text-slate-500">{sub}</div>
          </div>
        ))}
      </div>

      {/* Exception alert banner */}
      {todayExceptions.length > 0 && (
        <div className="rounded-2xl bg-[--cs-risk-bg] border border-[--cs-risk-soft] p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-[--cs-risk] shrink-0" />
            <span className="text-sm font-bold text-[--cs-risk]">
              {todayExceptions.length} exception{todayExceptions.length > 1 ? "s" : ""} today — require{todayExceptions.length === 1 ? "s" : ""} review
            </span>
          </div>
          <div className="space-y-1">
            {todayExceptions.map((ex) => {
              const med = medications.find((m) => m.id === ex.medication_id);
              return (
                <div key={ex.id} className="text-xs text-[--cs-risk] flex items-center gap-2">
                  <span className="capitalize font-medium">{ex.status}</span>
                  <span>—</span>
                  <span>{getYPName(ex.child_id)}</span>
                  <span>·</span>
                  <span>{med?.name}</span>
                  {ex.reason_not_given && <span className="text-[--cs-risk]">({ex.reason_not_given})</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <Input
          placeholder="Search young person or medication…"
          value={schedSearch}
          onChange={(e) => setSchedSearch(e.target.value)}
          className="pl-8 h-8 text-xs rounded-lg"
        />
      </div>

      {schedSearch && (
        <p className="text-xs text-slate-400">
          {byYP.length} result{byYP.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Per-YP schedule */}
      {byYP.map(({ yp, entries }) => {
        const ypExceptions = todayExceptions.filter((e) => e.child_id === yp.id);
        return (
          <div key={yp.id} className="rounded-2xl border bg-white overflow-hidden">
            {/* YP header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-50/80 border-b border-slate-100">
              <Avatar name={yp.preferred_name || yp.first_name} size="md" />
              <div className="flex-1">
                <div className="font-bold text-slate-900">{yp.preferred_name || yp.first_name}</div>
                <div className="text-xs text-slate-500">{entries.length} medication{entries.length !== 1 ? "s" : ""} active</div>
              </div>
              {ypExceptions.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {ypExceptions.length} exception{ypExceptions.length !== 1 ? "s" : ""}
                </Badge>
              )}
              {yp.allergies.length > 0 && (
                <Badge variant="warning" className="gap-1 text-[10px]">
                  <Shield className="h-3 w-3" />
                  Allergies: {yp.allergies.join(", ")}
                </Badge>
              )}
            </div>

            {/* Medication entries */}
            <div className="divide-y divide-slate-100">
              {entries.map(({ med, admin }, idx) => {
                const isPRN = med.type === "prn";
                const status = admin?.status;
                const isException = status === "refused" || status === "missed" || status === "late";
                const isScheduled = status === "scheduled" || (!admin && !isPRN);
                const formKey = `${med.id}-${admin?.id ?? "new"}`;
                const isFormOpen = openForms.has(formKey);
                const showCara = caraFor === formKey;

                return (
                  <div
                    key={`${med.id}-${idx}`}
                    className={cn(
                      "px-5 py-4",
                      isException && "bg-[--cs-risk-bg]/30"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        isPRN ? "bg-amber-100" : "bg-blue-100"
                      )}>
                        <Pill className={cn("h-5 w-5", isPRN ? "text-amber-600" : "text-blue-600")} />
                      </div>

                      {/* Medication info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900">{med.name}</span>
                          <span className="text-sm text-slate-500">{med.dosage}</span>
                          <Badge className={cn("text-[10px] rounded-full border-0 capitalize", TYPE_STYLES[med.type])}>
                            {med.type}
                          </Badge>
                          {status && (
                            <Badge variant={(STATUS_CONFIG as unknown as Record<string, typeof STATUS_CONFIG.given>)[status]?.badgeVariant ?? "secondary"} className="text-[10px] capitalize">
                              {(STATUS_CONFIG as unknown as Record<string, typeof STATUS_CONFIG.given>)[status]?.label ?? status}
                            </Badge>
                          )}
                          {admin && (admin as never as { care_event_id?: string }).care_event_id && (
                            <Link
                              href={`/care-events/${(admin as never as { care_event_id: string }).care_event_id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 rounded-full bg-[--cs-info-bg] border border-[--cs-info-soft] px-2 py-0.5 text-[10px] font-medium text-[--cs-info] hover:bg-[--cs-info-soft] transition-colors"
                            >
                              <ArrowUpRight className="h-3 w-3" />
                              From Care Event
                            </Link>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                          {isPRN ? (
                            <span>As needed — {med.frequency}</span>
                          ) : (
                            <>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {admin?.scheduled_time ? formatTime(admin.scheduled_time) : "—"}
                              </span>
                              <span>{med.route}</span>
                            </>
                          )}
                          {admin?.administered_by && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-[--cs-success]" />
                              {getStaffName(admin.administered_by)}
                              {admin.actual_time && <> · {formatTime(admin.actual_time)}</>}
                            </span>
                          )}
                        </div>

                        {/* Exception details */}
                        {isException && (
                          <div className={cn(
                            "mt-2 rounded-lg border px-3 py-2 text-xs",
                            STATUS_CONFIG[status!]?.bgClass
                          )}>
                            <span className={cn("font-semibold capitalize", STATUS_CONFIG[status!]?.textClass)}>
                              {STATUS_CONFIG[status!]?.label}
                            </span>
                            {admin?.reason_not_given && (
                              <span className="text-slate-600"> — {admin.reason_not_given}</span>
                            )}
                            {admin?.notes && (
                              <span className="text-slate-500"> · {admin.notes}</span>
                            )}
                          </div>
                        )}

                        {/* Special instructions */}
                        {med.special_instructions && (
                          <div className="mt-2 rounded-lg bg-[--cs-info-bg] border border-[--cs-info-soft] px-3 py-1.5 text-[10px] text-[--cs-info] flex items-center gap-1.5">
                            <Info className="h-3 w-3 shrink-0" />
                            {med.special_instructions}
                          </div>
                        )}

                        {/* Admin form or PRN record button */}
                        {(isScheduled || isPRN) && (
                          <div className="mt-3">
                            {!isFormOpen ? (
                              <Button
                                size="sm"
                                variant={isPRN ? "warning" : "success"}
                                className="text-xs h-7"
                                onClick={() => toggleForm(formKey)}
                              >
                                <Plus className="h-3 w-3" />
                                {isPRN ? "Record PRN Administration" : "Record Administration"}
                              </Button>
                            ) : (
                              <AdminForm
                                admin={admin ?? {
                                  id: `tmp-${med.id}`,
                                  medication_id: med.id,
                                  child_id: med.child_id,
                                  scheduled_time: new Date().toISOString(),
                                  actual_time: null,
                                  status: "scheduled",
                                  administered_by: null,
                                  witnessed_by: null,
                                  dose_given: null,
                                  reason_not_given: null,
                                  notes: null,
                                  prn_reason: null,
                                  prn_effectiveness: null,
                                  home_id: homeId,
                                  created_at: new Date().toISOString(),
                                  updated_at: new Date().toISOString(),
                                  created_by: currentUser?.id ?? "staff_darren",
                                  updated_by: currentUser?.id ?? "staff_darren",
                                }}
                                medication={med}
                                onClose={() => toggleForm(formKey)}
                              />
                            )}
                          </div>
                        )}

                        {/* Cara draft button */}
                        {admin && (
                          <div className="mt-2">
                            <button
                              onClick={() => setCaraFor(showCara ? null : formKey)}
                              className="flex items-center gap-1.5 text-[10px] text-violet-600 hover:text-violet-700 font-medium"
                            >
                              <Sparkles className="h-3 w-3" />
                              {showCara ? "Close Cara" : "Draft note with Cara"}
                            </button>
                          </div>
                        )}

                        {showCara && admin && (
                          <div className="mt-3">
                            <CaraPanel
                              mode="write"
                              pageContext="Medication Administration — record a medication administration, prescribed dose, time given, staff signature, child response, any errors or near-misses"
                              recordType="medication_note"
                              sourceContent={`${med.name} ${med.dosage} — ${admin.status} at ${formatTime(admin.actual_time ?? admin.scheduled_time)} for ${getYPName(med.child_id)}. ${admin.notes ?? ""} ${admin.reason_not_given ? "Reason: " + admin.reason_not_given : ""}`}
                              defaultStyle="professional_formal"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tab 2: MAR Chart ──────────────────────────────────────────────────────────

function MARChartTab({
  mar,
}: {
  mar: { medication: Medication; administrations: MedicationAdministration[] }[];
}) {
  // Build 7-day window ending today
  const days = Array.from({ length: 7 }, (_, i) => daysFromNow(i - 6));
  const today = todayStr();
  const marYpQuery = useYoungPeople();
  const marAllYP = marYpQuery.data?.data ?? [];

  // Group by YP
  const byYP = marAllYP.map((yp) => {
    const ypMAR = mar.filter((m) => m.medication.child_id === yp.id && m.medication.is_active);
    return { yp, mar: ypMAR };
  }).filter((g) => g.mar.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">7-Day Medication Administration Record</div>
          <div className="text-xs text-slate-500 mt-0.5">{formatShortDate(days[0])} — {formatShortDate(days[6])}</div>
        </div>
        <Button variant="outline" size="sm" className="text-xs">
          <FileText className="h-3.5 w-3.5" />
          Print MAR Sheet
        </Button>
      </div>

      {byYP.map(({ yp, mar: ypMAR }) => (
        <div key={yp.id} className="rounded-2xl border bg-white overflow-hidden">
          {/* YP header */}
          <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
            <Avatar name={yp.preferred_name || yp.first_name} size="sm" />
            <div className="font-semibold text-slate-900 text-sm">{yp.preferred_name || yp.first_name}</div>
            {yp.allergies.length > 0 && (
              <Badge variant="warning" className="text-[10px] ml-1">
                <Shield className="h-3 w-3" />Allergies: {yp.allergies.join(", ")}
              </Badge>
            )}
          </div>

          {/* MAR grid */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-48">Medication</th>
                  {days.map((d) => (
                    <th
                      key={d}
                      className={cn(
                        "text-center px-2 py-3 text-[10px] font-semibold uppercase tracking-wider min-w-[72px]",
                        d === today ? "text-blue-600 bg-blue-50/50" : "text-slate-500"
                      )}
                    >
                      <div>{getDayLabel(d)}</div>
                      {d === today && <div className="text-[9px] font-normal text-blue-400 normal-case">Today</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ypMAR.map(({ medication: med, administrations }) => {
                  const isPRN = med.type === "prn";
                  return (
                    <tr key={med.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-xs text-slate-900">{med.name}</div>
                        <div className="text-[10px] text-slate-500">{med.dosage}</div>
                        <Badge className={cn("text-[9px] rounded-full border-0 capitalize mt-1", TYPE_STYLES[med.type])}>
                          {med.type}
                        </Badge>
                      </td>
                      {days.map((d) => {
                        const dayAdmins = administrations.filter((a) => a.scheduled_time.startsWith(d));
                        const admin = dayAdmins[0];
                        const isScheduledToday = d >= today && !admin;
                        const isFutureDay = d > today;

                        return (
                          <td key={d} className={cn("px-2 py-3 text-center", d === today && "bg-blue-50/30")}>
                            {isPRN ? (
                              // PRN: show count of administrations on that day
                              dayAdmins.length > 0 ? (
                                <div className="flex flex-col items-center gap-1">
                                  {dayAdmins.map((a, i) => (
                                    <MARCell key={i} admin={a} dateStr={d} />
                                  ))}
                                  {dayAdmins.length > 1 && (
                                    <span className="text-[9px] text-slate-400">{dayAdmins.length}x</span>
                                  )}
                                </div>
                              ) : (
                                <div className="h-8 w-8 mx-auto rounded-full border border-dashed border-slate-200" title="PRN — not given" />
                              )
                            ) : (
                              <MARCell
                                admin={admin}
                                dateStr={d}
                                isScheduled={isScheduledToday}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="rounded-2xl border bg-white px-5 py-4">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Legend</div>
        <div className="flex flex-wrap items-center gap-5">
          {[
            { el: <div className="h-6 w-6 rounded-full bg-[--cs-success] border-2 border-[--cs-success] flex items-center justify-center"><CheckCircle2 className="h-3.5 w-3.5 text-white" /></div>, label: "Given" },
            { el: <div className="h-6 w-6 rounded-full bg-[--cs-warning] border-2 border-[--cs-warning] flex items-center justify-center"><Clock className="h-3.5 w-3.5 text-white" /></div>, label: "Late" },
            { el: <div className="h-6 w-6 rounded-full bg-[--cs-risk] border-2 border-[--cs-risk] flex items-center justify-center"><X className="h-3.5 w-3.5 text-white" /></div>, label: "Refused / Missed" },
            { el: <div className="h-6 w-6 rounded-full bg-[--cs-info-soft] border-2 border-[--cs-info-soft] flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-[--cs-info]" /></div>, label: "Scheduled (today)" },
            { el: <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200" />, label: "Not scheduled" },
            { el: <div className="h-6 w-6 rounded-full border border-dashed border-slate-200" />, label: "PRN — not given" },
          ].map(({ el, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-slate-600">
              {el}
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: PRN Log ────────────────────────────────────────────────────────────

function PRNLogTab({
  medications,
  mar,
}: {
  medications: Medication[];
  mar: { medication: Medication; administrations: MedicationAdministration[] }[];
}) {
  const [filterYP, setFilterYP] = useState<string>("");
  const [filterMed, setFilterMed] = useState<string>("");
  const prnYpQuery = useYoungPeople();
  const prnAllYP = prnYpQuery.data?.data ?? [];

  const prnMeds = medications.filter((m) => m.type === "prn" && m.is_active);

  // All PRN administrations
  const prnAdmins = useMemo(() => {
    const all: Array<{ admin: MedicationAdministration; med: Medication }> = [];
    for (const { medication, administrations } of mar) {
      if (medication.type !== "prn") continue;
      for (const a of administrations) {
        if (a.status === "given" || a.status === "late") {
          all.push({ admin: a, med: medication });
        }
      }
    }
    return all.sort((a, b) => b.admin.scheduled_time.localeCompare(a.admin.scheduled_time));
  }, [mar]);

  const filtered = prnAdmins.filter((e) => {
    if (filterYP && e.med.child_id !== filterYP) return false;
    if (filterMed && e.med.id !== filterMed) return false;
    return true;
  });

  // Stats
  const reasonCounts: Record<string, number> = {};
  prnAdmins.forEach(({ admin }) => {
    const r = admin.prn_reason || admin.notes || "Unspecified";
    reasonCounts[r] = (reasonCounts[r] ?? 0) + 1;
  });
  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];

  const perYP: Record<string, number> = {};
  prnAdmins.forEach(({ med }) => {
    perYP[med.child_id] = (perYP[med.child_id] ?? 0) + 1;
  });

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-2xl font-bold text-amber-600">{prnAdmins.length}</div>
          <div className="text-xs font-semibold text-slate-700">Total PRN administrations</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-sm font-bold text-slate-900 leading-tight">{topReason ? topReason[0] : "—"}</div>
          <div className="text-xs text-slate-500 mt-0.5">Most common reason</div>
          {topReason && <div className="text-[10px] text-slate-400">{topReason[1]} time{topReason[1] !== 1 ? "s" : ""}</div>}
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="space-y-1">
            {Object.entries(perYP).map(([ypId, count]) => (
              <div key={ypId} className="flex items-center justify-between text-xs">
                <span className="text-slate-700">{getYPName(ypId)}</span>
                <span className="font-bold text-amber-600">{count}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">PRN use per young person</div>
        </div>
      </div>

      {/* Filters + Add */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={filterYP}
            onChange={(e) => setFilterYP(e.target.value)}
            className="text-xs text-slate-700 bg-transparent focus:outline-none"
          >
            <option value="">All young people</option>
            {prnAllYP.map((yp) => (
              <option key={yp.id} value={yp.id}>{yp.preferred_name || yp.first_name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2">
          <Pill className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={filterMed}
            onChange={(e) => setFilterMed(e.target.value)}
            className="text-xs text-slate-700 bg-transparent focus:outline-none"
          >
            <option value="">All PRN medications</option>
            {prnMeds.map((m) => (
              <option key={m.id} value={m.id}>{m.name} — {getYPName(m.child_id)}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto">
          <Button
            size="sm"
            variant="warning"
            disabled
            title="PRN administrations are recorded from the Today's Schedule tab after administering."
          >
            <Plus className="h-3.5 w-3.5" />Add PRN Entry
          </Button>
        </div>
      </div>

      {/* PRN table */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            No PRN administrations recorded{filterYP || filterMed ? " for this filter" : ""}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Date / Time", "Young Person", "Medication", "Reason Given", "Dose", "Administered By", "Outcome", "Source"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(({ admin, med }) => (
                  <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-slate-900">{formatDate(admin.actual_time ?? admin.scheduled_time)}</div>
                      <div className="text-[10px] text-slate-500">{formatTime(admin.actual_time ?? admin.scheduled_time)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={getYPName(med.child_id)} size="xs" />
                        <span className="text-xs text-slate-900">{getYPName(med.child_id)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-slate-900">{med.name}</div>
                      <div className="text-[10px] text-slate-500">{med.dosage}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-700">
                        {admin.prn_reason || admin.notes || <span className="text-slate-400 italic">Not recorded</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-700">{admin.dose_given || med.dosage}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-700">
                        {admin.administered_by ? getStaffName(admin.administered_by) : <span className="text-slate-400 italic">Unknown</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">
                        {admin.prn_effectiveness || <span className="text-slate-400 italic">Not recorded</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(admin as never as { care_event_id?: string }).care_event_id ? (
                        <Link
                          href={`/care-events/${(admin as never as { care_event_id: string }).care_event_id}`}
                          className="inline-flex items-center gap-1 rounded-full bg-[--cs-info-bg] border border-[--cs-info-soft] px-2 py-0.5 text-[10px] font-medium text-[--cs-info] hover:bg-[--cs-info-soft] transition-colors"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          Care Event
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-[10px] italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 4: Stock & Oversight ──────────────────────────────────────────────────

function StockOversightTab({
  medications,
  exceptions,
  mar,
}: {
  medications: Medication[];
  exceptions: MedicationAdministration[];
  mar: { medication: Medication; administrations: MedicationAdministration[] }[];
}) {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const [showCara, setShowCara] = useState(false);
  const [needCreated, setNeedCreated] = useState<Set<string>>(new Set());
  const createNeed = useCreateTrainingNeed();
  const activeMeds = medications.filter((m) => m.is_active);
  const controlledMeds = activeMeds.filter((m) => m.type === "controlled");

  // Traffic light for stock
  const stockLight = (count: number | null) => {
    if (count === null) return "bg-slate-100 text-slate-500";
    if (count < 5) return "bg-[--cs-risk-bg] text-[--cs-risk] font-bold";
    if (count < 10) return "bg-[--cs-warning-bg] text-[--cs-warning] font-bold";
    return "bg-[--cs-success-bg] text-[--cs-success]";
  };
  const stockLabel = (count: number | null) => {
    if (count === null) return null;
    if (count < 5) return { label: "Order Required", v: "destructive" as const };
    if (count < 10) return { label: "Low Stock", v: "warning" as const };
    return { label: "Adequate", v: "success" as const };
  };

  // Exception audit — all non-given, non-scheduled administrations
  const exceptionAdmins = useMemo(() => {
    const all: Array<{ admin: MedicationAdministration; med: Medication }> = [];
    for (const { medication, administrations } of mar) {
      for (const a of administrations) {
        if (a.status === "refused" || a.status === "missed" || a.status === "late") {
          all.push({ admin: a, med: medication });
        }
      }
    }
    return all.sort((a, b) => b.admin.scheduled_time.localeCompare(a.admin.scheduled_time));
  }, [mar]);

  const unreviewedExceptions = exceptionAdmins.slice(0, 5);

  const exceptionContext = unreviewedExceptions
    .map(({ admin, med }) =>
      `${admin.status.toUpperCase()} — ${getYPName(med.child_id)} — ${med.name} on ${formatDate(admin.scheduled_time)}. ${admin.reason_not_given ?? ""} ${admin.notes ?? ""}`.trim()
    )
    .join("\n");

  return (
    <div className="space-y-6">
      {/* Stock overview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Stock Levels</h3>
          <Button
            size="sm"
            variant="outline"
            disabled
            title="New medications are added via the Add Medication button at the top of the page after pharmacy authorisation."
          >
            <Package className="h-3.5 w-3.5" />Add to MAR
          </Button>
        </div>
        <div className="rounded-2xl border bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Young Person", "Medication", "Type", "Stock Count", "Last Checked", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeMeds.map((med) => {
                const sl = stockLabel(med.stock_count);
                return (
                  <tr key={med.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={getYPName(med.child_id)} size="xs" />
                        <span className="text-xs text-slate-900">{getYPName(med.child_id)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-slate-900">{med.name}</div>
                      <div className="text-[10px] text-slate-500">{med.dosage}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("text-[10px] rounded-full border-0 capitalize", TYPE_STYLES[med.type])}>
                        {med.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center justify-center h-8 w-12 rounded-lg text-sm", stockLight(med.stock_count))}>
                        {med.stock_count ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">
                        {med.stock_last_checked ? formatDate(med.stock_last_checked) : "Not checked"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sl && <Badge variant={sl.v} className="text-[10px]">{sl.label}</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      {med.stock_count !== null && med.stock_count < 10 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 text-[--cs-warning] border-[--cs-warning-soft] hover:bg-[--cs-warning-bg]"
                          disabled
                          title="Contact your pharmacy directly to request a stock reorder."
                        >
                          Request Order
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Controlled Drugs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-[--cs-risk]" />
          <h3 className="text-sm font-bold text-slate-900">Controlled Drugs Register</h3>
        </div>
        {controlledMeds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <Shield className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <div className="text-sm text-slate-500 font-medium">No controlled drugs currently in use</div>
            <div className="text-xs text-slate-400 mt-1">
              When controlled medications are added, they will appear here with full CD register tracking.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {controlledMeds.map((med) => (
              <div key={med.id} className="rounded-xl border border-[--cs-risk-soft] bg-[--cs-risk-bg]/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-[--cs-risk]">{med.name} {med.dosage}</div>
                    <div className="text-xs text-[--cs-risk]">{getYPName(med.child_id)} · {med.prescriber}</div>
                  </div>
                  <Badge variant="destructive">Controlled Drug</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exception Audit */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[--cs-warning]" />
            <h3 className="text-sm font-bold text-slate-900">Medication Exceptions Audit</h3>
          </div>
          <Badge variant={exceptionAdmins.length > 0 ? "warning" : "success"}>
            {exceptionAdmins.length} total exception{exceptionAdmins.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {exceptionAdmins.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-[--cs-success-bg] p-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-[--cs-success] mx-auto mb-2" />
            <div className="text-sm text-[--cs-success] font-medium">No exceptions recorded</div>
            <div className="text-xs text-[--cs-success] mt-1">All medications administered as prescribed.</div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-white overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Date", "Young Person", "Medication", "Exception", "Reason / Notes", "Oversight Status", "Training"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {exceptionAdmins.map(({ admin, med }) => (
                  <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-700">{formatDate(admin.scheduled_time)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={getYPName(med.child_id)} size="xs" />
                        <span className="text-xs text-slate-900">{getYPName(med.child_id)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-slate-900">{med.name}</div>
                      <div className="text-[10px] text-slate-500">{med.dosage}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={admin.status === "late" ? "warning" : "destructive"}
                        className="text-[10px] capitalize"
                      >
                        {admin.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {admin.reason_not_given || admin.notes || <span className="text-slate-400 italic">No notes</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-[10px]">Pending RM review</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {needCreated.has(admin.id) ? (
                        <span className="flex items-center gap-1 text-[10px] text-[--cs-success] font-medium">
                          <CheckCircle2 className="h-3 w-3" />Need logged
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px] gap-1 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                          disabled={createNeed.isPending}
                          onClick={() => {
                            createNeed.mutate(
                              {
                                home_id: homeId,
                                identified_by: "medication_event",
                                need_type: "medication_management",
                                title: `Medication management review — ${med.name} ${admin.status} (${getYPName(med.child_id)})`,
                                description: `Medication exception recorded: ${med.name} ${med.dosage} was ${admin.status} for ${getYPName(med.child_id)} on ${formatDate(admin.scheduled_time)}. ${admin.reason_not_given ? `Reason: ${admin.reason_not_given}.` : ""} Training need identified to review medication administration procedures.`,
                                priority: admin.status === "missed" ? "high" : "medium",
                                status: "identified",
                                cara_evidence: `${admin.status.toUpperCase()} medication event: ${med.name} for ${getYPName(med.child_id)}. ${admin.reason_not_given ?? admin.notes ?? ""}`.trim(),
                              },
                              { onSuccess: () => setNeedCreated((p) => new Set(p).add(admin.id)) }
                            );
                          }}
                        >
                          <Brain className="h-3 w-3" />Training Need
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RM Oversight with Cara */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-violet-600" />
            <h3 className="text-sm font-bold text-slate-900">Management Oversight</h3>
          </div>
          <button
            onClick={() => setShowCara(!showCara)}
            className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {showCara ? "Close Cara" : "Draft oversight with Cara"}
          </button>
        </div>

        <div className="rounded-2xl border bg-[--cs-warning-bg]/40 border-[--cs-warning-soft] p-5">
          <div className="text-sm text-slate-700 mb-3">
            <span className="font-semibold text-slate-900">{unreviewedExceptions.length}</span> medication exception{unreviewedExceptions.length !== 1 ? "s" : ""} currently require RM oversight comment. Use Cara to draft your oversight narrative.
          </div>

          {unreviewedExceptions.length > 0 && (
            <div className="space-y-2 mb-4">
              {unreviewedExceptions.map(({ admin, med }) => (
                <div key={admin.id} className="flex items-center gap-3 rounded-xl bg-white border border-[--cs-warning-soft] px-3 py-2.5">
                  <div className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    admin.status === "late" ? "bg-[--cs-warning]" : "bg-[--cs-risk]"
                  )} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-slate-900">{med.name}</span>
                    <span className="text-xs text-slate-500"> · {getYPName(med.child_id)}</span>
                    <span className="text-xs text-slate-400"> · {formatDate(admin.scheduled_time)}</span>
                  </div>
                  <Badge variant={admin.status === "late" ? "warning" : "destructive"} className="text-[10px] capitalize shrink-0">
                    {admin.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {showCara && (
            <CaraPanel
              mode="oversee"
              pageContext="Medication Oversight — MAR chart review, administration accuracy, missed doses, controlled drugs, medication errors, storage checks, prescriptions, GP liaison"
              recordType="medication_exception_oversight"
              sourceContent={exceptionContext}
              linkedRecords="medication_exceptions, MAR, incidents"
              userRole="registered_manager"
              defaultStyle="concise_manager"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

// ── Export columns ────────────────────────────────────────────────────────────

const MEDICATION_EXPORT_COLS: ExportColumn<Medication>[] = [
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Medication", accessor: (r) => r.name },
  { header: "Type", accessor: (r) => r.type },
  { header: "Dosage", accessor: (r) => r.dosage },
  { header: "Frequency", accessor: (r) => r.frequency },
  { header: "Route", accessor: (r) => r.route },
  { header: "Prescriber", accessor: (r) => r.prescriber },
  { header: "Active", accessor: (r) => r.is_active ? "Yes" : "No" },
  { header: "Stock Count", accessor: (r) => r.stock_count ?? "—" },
  { header: "Stock Last Checked", accessor: (r) => r.stock_last_checked ?? "—" },
  { header: "Start Date", accessor: (r) => r.start_date },
  { header: "Special Instructions", accessor: (r) => r.special_instructions ?? "" },
];

type Tab = "schedule" | "mar" | "prn" | "stock";

export default function MedicationPage() {
  const [activeTab, setActiveTab] = useState<Tab>("schedule");
  const { data, isLoading, isError, refetch } = useMedication();
  const pageYpQuery = useYoungPeople();
  const ypCount = pageYpQuery.data?.data.length ?? 0;

  const medications = data?.data?.medications ?? [];
  const mar = data?.data?.mar ?? [];
  const todaySchedule = data?.data?.today_schedule ?? [];
  const exceptions = data?.data?.exceptions ?? [];
  const stockAlerts = data?.data?.stock_alerts ?? [];
  const meta = data?.meta ?? {};

  const TABS: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    {
      id: "schedule",
      label: "Today's Schedule",
      icon: Calendar,
      badge: todaySchedule.filter((a) => a.status === "scheduled").length || undefined,
    },
    { id: "mar", label: "MAR Chart", icon: ClipboardList },
    {
      id: "prn",
      label: "PRN Log",
      icon: Activity,
      badge: mar.reduce((sum, { medication, administrations }) =>
        medication.type === "prn" ? sum + administrations.filter((a) => a.status === "given").length : sum, 0) || undefined,
    },
    {
      id: "stock",
      label: "Stock & Oversight",
      icon: Package,
      badge: stockAlerts.length || exceptions.length || undefined,
    },
  ];

  return (
    <PageShell
      darkBody
      title="Medication"
      subtitle={`${medications.length} active medications · ${ypCount} young people`}
      caraContext={{ pageTitle: "Care Events — Medication", sourceType: "medication" }}
      quickCreateContext={{ module: "medication", defaultTaskCategory: "medication" }}
      actions={
        <div className="flex gap-2">
          <ExportButton
            filename="medication-register"
            columns={MEDICATION_EXPORT_COLS}
            data={medications}
            label="Export"
          />
          <PrintButton title="Medication Administration Record" subtitle="Chamberlain House — MAR Chart" />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab("mar")}>
            <FileText className="h-3.5 w-3.5" />MAR Sheet
          </Button>
          <SmartUploadButton variant="inline" label="Upload Prescription" uploadContext="Medication — prescription/MAR upload" />
          <Button
            size="sm"
            disabled
            title="Adding medications requires a prescriber authorisation. Manage prescriptions via your pharmacy system."
          >
            <Plus className="h-3.5 w-3.5" />Add Medication
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "medication", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="space-y-5 animate-fade-in">
        {/* Loading / Error state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin mr-3" />
            <span className="text-sm">Loading medication records…</span>
          </div>
        )}

        {isError && (
          <div className="rounded-2xl bg-[--cs-risk-bg] border border-[--cs-risk-soft] p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-[--cs-risk] mx-auto mb-2" />
            <div className="text-sm font-semibold text-[--cs-risk]">Could not load medication data</div>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>Try again</Button>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-slate-100/80 rounded-2xl p-1.5">
              {TABS.map(({ id, label, icon: Icon, badge }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                    activeTab === id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className={cn(
                      "inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full text-[10px] font-bold",
                      id === "stock" || id === "schedule"
                        ? "bg-[--cs-info] text-white"
                        : "bg-[--cs-warning] text-white"
                    )}>
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "schedule" && (
              <TodayScheduleTab
                medications={medications}
                todaySchedule={todaySchedule}
                exceptions={exceptions}
                stockAlerts={stockAlerts}
                meta={meta}
                mar={mar}
              />
            )}
            {activeTab === "mar" && <MARChartTab mar={mar} />}
            {activeTab === "prn" && <PRNLogTab medications={medications} mar={mar} />}
            {activeTab === "stock" && (
              <StockOversightTab medications={medications} exceptions={exceptions} mar={mar} />
            )}
          </>
        )}
      </div>

      {/* Care Events pipeline — medication events routed here */}
      <CareEventsPanel
        title="Care Events — Medication"
        category="medication"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
