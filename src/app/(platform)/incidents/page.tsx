"use client";

import React, { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaCompose } from "@/components/aria/aria-compose";
import { appRoleToAriaRole } from "@/lib/aria/aria-permissions";
import {
  AlertTriangle, Shield, Eye, Clock, CheckCircle2, FileText,
  Users, MapPin, Calendar, Plus, Search, Sparkles, Phone,
  UserCheck, X, ChevronRight, Bell, ClipboardList, Loader2,
  TrendingUp, ArrowUpRight, Brain, Link as LinkIcon, ArrowUpDown,
} from "lucide-react";
import { useIncidents, useAddOversight, useCreateIncident } from "@/hooks/use-incidents";
import { useAuthContext } from "@/contexts/auth-context";
import { useYoungPeople } from "@/hooks/use-young-people";
import { useCreateTrainingNeed } from "@/hooks/use-ri-learning";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName, getYPName, getYPById } from "@/lib/seed-data";
import { INCIDENT_TYPE_LABELS, INCIDENT_TYPES, INCIDENT_SEVERITIES } from "@/lib/constants";
import { cn, formatDate, formatRelative, todayStr } from "@/lib/utils";
import type { Incident, IncidentNotification } from "@/types";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Config ────────────────────────────────────────────────────────────────────

const SEV_CONFIG = {
  critical: {
    color: "text-red-700", bg: "bg-red-50", border: "border-l-red-600",
    badge: "bg-red-100 text-red-800", dot: "bg-red-500",
  },
  high: {
    color: "text-orange-700", bg: "bg-orange-50", border: "border-l-orange-500",
    badge: "bg-orange-100 text-orange-800", dot: "bg-orange-500",
  },
  medium: {
    color: "text-amber-700", bg: "bg-amber-50", border: "border-l-amber-400",
    badge: "bg-amber-100 text-amber-800", dot: "bg-amber-400",
  },
  low: {
    color: "text-slate-600", bg: "bg-slate-50", border: "border-l-slate-300",
    badge: "bg-slate-100 text-slate-700", dot: "bg-slate-400",
  },
} as const;

const STATUS_CONFIG = {
  open: { badge: "bg-red-100 text-red-700", label: "Open" },
  under_review: { badge: "bg-amber-100 text-amber-700", label: "Under Review" },
  closed: { badge: "bg-emerald-100 text-emerald-700", label: "Closed" },
} as const;

const TABS = [
  { id: "all", label: "All Incidents", icon: ClipboardList },
  { id: "oversight", label: "Oversight Queue", icon: Shield },
  { id: "log", label: "Log New Incident", icon: Plus },
] as const;
type TabId = typeof TABS[number]["id"];

const NOTIF_ROLES = [
  "Social Worker", "Independent Reviewing Officer", "Registered Manager",
  "Deputy Manager", "Police", "Local Authority", "MASH",
  "CAMHS", "GP", "Parent / Carer", "School",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function YPAvatar({ childId, size = "sm" }: { childId: string; size?: "sm" | "md" }) {
  const yp = getYPById(childId);
  const name = yp?.preferred_name || yp?.first_name || "?";
  const cls = size === "sm"
    ? "h-7 w-7 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center shrink-0"
    : "h-9 w-9 rounded-full bg-violet-100 text-violet-700 text-sm font-bold flex items-center justify-center shrink-0";
  return <div className={cls}>{name[0]}</div>;
}

// ── Severity → priority map ───────────────────────────────────────────────────

const SEV_TO_PRIORITY: Record<string, "urgent" | "high" | "medium" | "low"> = {
  critical: "urgent",
  high: "high",
  medium: "medium",
  low: "low",
};

const TYPE_TO_NEED: Record<string, string> = {
  physical_altercation: "de_escalation",
  restraint: "de_escalation",
  self_harm: "mental_health_first_aid",
  missing_person: "safeguarding",
  medication_error: "medication_management",
  safeguarding_concern: "safeguarding",
  property_damage: "behaviour_management",
  accident: "first_aid",
  verbal_aggression: "de_escalation",
  substance_misuse: "substance_misuse_awareness",
};

// ── Incident Card ─────────────────────────────────────────────────────────────

function IncidentCard({
  inc,
  onOversightClick,
  onCardClick,
}: {
  inc: Incident;
  onOversightClick?: (inc: Incident) => void;
  onCardClick?: () => void;
}) {
  const [needCreated, setNeedCreated] = useState(false);
  const createNeed = useCreateTrainingNeed();

  const sev = SEV_CONFIG[inc.severity] ?? SEV_CONFIG.low;
  const stat = STATUS_CONFIG[inc.status] ?? STATUS_CONFIG.open;
  const needsOversight = inc.requires_oversight && !inc.oversight_by;

  const handleCreateNeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    createNeed.mutate({
      title: `Post-incident learning: ${INCIDENT_TYPE_LABELS[inc.type] || inc.type}`,
      need_type: TYPE_TO_NEED[inc.type] ?? "safeguarding",
      priority: SEV_TO_PRIORITY[inc.severity] ?? "medium",
      identified_by: "incident",
      status: "identified",
      description: `Created from incident ${inc.reference}. ${inc.description.slice(0, 200)}`,
      linked_incident_id: inc.id,
    }, { onSuccess: () => setNeedCreated(true) });
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white border-l-4 p-5 transition-all hover:shadow-md",
        onCardClick && "cursor-pointer",
        sev.border,
      )}
      onClick={onCardClick}
    >
      {/* Header row */}
      <div className="flex items-start gap-4">
        <div className={cn("rounded-xl p-2.5 shrink-0 mt-0.5", sev.bg)}>
          <AlertTriangle className={cn("h-4 w-4", sev.color)} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Top line */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-900">{inc.reference}</span>
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", stat.badge)}>
                {stat.label}
              </span>
              <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", sev.badge)}>
                {inc.severity}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {INCIDENT_TYPE_LABELS[inc.type] || inc.type}
              </span>
            </div>
          </div>

          {/* YP + date */}
          <div className="mt-2 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <YPAvatar childId={inc.child_id} />
              <span className="text-xs font-semibold text-violet-700">{getYPName(inc.child_id)}</span>
            </div>
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(inc.date)} at {inc.time}
            </span>
            {inc.location && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {inc.location}
              </span>
            )}
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {getStaffName(inc.reported_by)}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-600 mt-2.5 leading-relaxed line-clamp-2">{inc.description}</p>

          {/* Notifications */}
          {inc.notifications.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {inc.notifications.map((n, i) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    n.acknowledged
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  <Bell className="h-2.5 w-2.5" />
                  {n.role}
                  {n.acknowledged && <CheckCircle2 className="h-2.5 w-2.5" />}
                </span>
              ))}
            </div>
          )}

          {/* Status chips + oversight */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {needsOversight && (
              <button
                onClick={(e) => { e.stopPropagation(); onOversightClick?.(inc); }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
              >
                <Shield className="h-3.5 w-3.5" />
                Add Oversight
              </button>
            )}
            {inc.status !== "closed" && (
              needCreated ? (
                <a
                  href="/learning/training-needs"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  Training need created
                </a>
              ) : (
                <button
                  onClick={handleCreateNeed}
                  disabled={createNeed.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 border border-violet-200 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-50"
                >
                  {createNeed.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Brain className="h-3.5 w-3.5" />
                  }
                  Create Training Need
                </button>
              )
            )}
            {inc.oversight_by && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Oversight by {getStaffName(inc.oversight_by)} · {formatDate(inc.oversight_at)}
              </span>
            )}
            {inc.linked_task_ids.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700">
                <FileText className="h-3 w-3" />
                {inc.linked_task_ids.length} task{inc.linked_task_ids.length > 1 ? "s" : ""}
              </span>
            )}
            {inc.body_map_required && (
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium",
                inc.body_map_completed
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              )}>
                Body map {inc.body_map_completed ? "done" : "required"}
              </span>
            )}
            {(inc as never as { care_event_id?: string }).care_event_id && (
              <Link
                href={`/care-events/${(inc as never as { care_event_id: string }).care_event_id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <ArrowUpRight className="h-3 w-3" />
                From Care Event
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const INCIDENT_EXPORT_COLS: ExportColumn<Incident>[] = [
  { header: "Reference", accessor: (i) => i.reference },
  { header: "Date", accessor: (i) => i.date },
  { header: "Time", accessor: (i) => i.time },
  { header: "Type", accessor: (i) => INCIDENT_TYPE_LABELS[i.type] ?? i.type },
  { header: "Severity", accessor: (i) => i.severity },
  { header: "Young Person", accessor: (i) => getYPName(i.child_id) },
  { header: "Description", accessor: (i) => i.description },
  { header: "Immediate Action", accessor: (i) => i.immediate_action },
  { header: "Reported By", accessor: (i) => getStaffName(i.reported_by) },
  { header: "Location", accessor: (i) => i.location },
  { header: "Status", accessor: (i) => i.status },
  { header: "Oversight By", accessor: (i) => i.oversight_by ? getStaffName(i.oversight_by) : "" },
  { header: "Outcome", accessor: (i) => i.outcome },
];

// ── Tab 1: All Incidents ──────────────────────────────────────────────────────

function AllIncidentsTab() {
  const { currentUser } = useAuthContext();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterChild, setFilterChild] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"severity" | "date" | "reference">("severity");
  const [oversightTarget, setOversightTarget] = useState<Incident | null>(null);
  const [oversightNote, setOversightNote] = useState("");
  const router = useRouter();

  const query = useIncidents();
  const addOversight = useAddOversight();
  const ypQuery = useYoungPeople();
  const allYP = ypQuery.data?.data ?? [];

  const incidents: Incident[] = query.data?.data ?? [];

  const stats = useMemo(() => ({
    total: incidents.length,
    open: incidents.filter((i) => i.status === "open").length,
    awaitingOversight: incidents.filter((i) => i.requires_oversight && !i.oversight_by).length,
    critical: incidents.filter((i) => i.severity === "critical" && i.status === "open").length,
  }), [incidents]);

  const filtered = useMemo(() => {
    let list = [...incidents];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        i.description.toLowerCase().includes(q) ||
        i.reference.toLowerCase().includes(q) ||
        getYPName(i.child_id).toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") list = list.filter((i) => i.status === filterStatus);
    if (filterSeverity !== "all") list = list.filter((i) => i.severity === filterSeverity);
    if (filterType !== "all") list = list.filter((i) => i.type === filterType);
    if (filterChild !== "all") list = list.filter((i) => i.child_id === filterChild);
    return list.sort((a, b) => {
      switch (sortBy) {
        case "date": return (b.date ?? "").localeCompare(a.date ?? "");
        case "reference": return a.reference.localeCompare(b.reference);
        default: {
          const sevW: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
          const statusW = (s: string) => s === "open" ? 0 : s === "under_review" ? 1 : 2;
          return (statusW(a.status) * 10 + (sevW[a.severity] ?? 2)) -
                 (statusW(b.status) * 10 + (sevW[b.severity] ?? 2));
        }
      }
    });
  }, [incidents, search, filterStatus, filterSeverity, filterType, filterChild, sortBy]);

  function handleSubmitOversight() {
    if (!oversightTarget || !oversightNote.trim()) return;
    addOversight.mutate(
      { id: oversightTarget.id, note: oversightNote, by: currentUser?.id ?? "staff_darren" },
      { onSuccess: () => { setOversightTarget(null); setOversightNote(""); } }
    );
  }

  if (query.isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Critical alert */}
      {stats.critical > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-red-800">
              {stats.critical} critical incident{stats.critical > 1 ? "s" : ""} — immediate manager oversight required
            </div>
            <div className="text-xs text-red-600 mt-0.5">
              Review and record oversight before end of shift. Ensure all statutory notifications have been made.
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-slate-900" },
          { label: "Open", value: stats.open, color: "text-red-600" },
          { label: "Needs Oversight", value: stats.awaitingOversight, color: "text-amber-600" },
          { label: "Critical Open", value: stats.critical, color: "text-red-700" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border bg-white p-4 text-center">
            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl border bg-white p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, description, young person…"
            className="pl-9 h-8 text-xs"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="all">All severities</option>
          {INCIDENT_SEVERITIES.map((s) => (
            <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="all">All types</option>
          {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{INCIDENT_TYPE_LABELS[t]}</option>)}
        </select>

        <select
          value={filterChild}
          onChange={(e) => setFilterChild(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <option value="all">All young people</option>
          {allYP.map((yp) => (
            <option key={yp.id} value={yp.id}>{yp.preferred_name || yp.first_name}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "severity" | "date" | "reference")}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <option value="severity">Priority</option>
            <option value="date">Date</option>
            <option value="reference">Reference</option>
          </select>
        </div>

        {(filterStatus !== "all" || filterSeverity !== "all" || filterType !== "all" || filterChild !== "all" || search) && (
          <button
            onClick={() => { setFilterStatus("all"); setFilterSeverity("all"); setFilterType("all"); setFilterChild("all"); setSearch(""); }}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Export */}
      <div className="flex items-center gap-2">
        <ExportButton<Incident>
          filename="incidents-export"
          data={filtered}
          columns={INCIDENT_EXPORT_COLS}
          label="Export CSV"
        />
        <span className="text-xs text-slate-400">
          {filtered.length} incident{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Results */}
      <div className="text-xs text-slate-400 font-medium">
        {filtered.length} incident{filtered.length !== 1 ? "s" : ""} shown
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border bg-white p-12 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
            <div className="text-sm font-semibold text-slate-900">No incidents match your filters</div>
            <div className="text-xs text-slate-400 mt-1">Try adjusting your filters to see more records</div>
          </div>
        ) : (
          filtered.map((inc) => (
            <IncidentCard
              key={inc.id}
              inc={inc}
              onOversightClick={setOversightTarget}
              onCardClick={() => router.push(`/incidents/${inc.id}`)}
            />
          ))
        )}
      </div>

      {/* Oversight drawer */}
      {oversightTarget && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm"
          onClick={() => setOversightTarget(null)}
        >
          <div
            className="w-full max-w-lg bg-white shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-bold text-slate-900">Add Management Oversight</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{oversightTarget.reference}</div>
              </div>
              <button onClick={() => setOversightTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Incident summary */}
              <div className={cn("rounded-2xl border-l-4 p-4", SEV_CONFIG[oversightTarget.severity]?.border, "border border-slate-200")}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", SEV_CONFIG[oversightTarget.severity]?.badge)}>
                    {oversightTarget.severity}
                  </span>
                  <span className="text-xs font-medium text-slate-700">{INCIDENT_TYPE_LABELS[oversightTarget.type]}</span>
                  <span className="text-xs text-slate-400">— {getYPName(oversightTarget.child_id)}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{oversightTarget.description}</p>
                {oversightTarget.immediate_action && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Immediate Action</div>
                    <p className="text-xs text-slate-700">{oversightTarget.immediate_action}</p>
                  </div>
                )}
              </div>

              {/* Aria write help */}
              <AriaPanel
                mode="oversee"
                pageContext="Incidents — Oversight Queue"
                recordType="incident_oversight"
                sourceContent={`${oversightTarget.description}\n\nImmediate action: ${oversightTarget.immediate_action}`}
                onInsert={(text) => setOversightNote(text)}
                className="text-sm"
              />

              {/* Oversight textarea */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  Oversight note <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={oversightNote}
                  onChange={(e) => setOversightNote(e.target.value)}
                  rows={5}
                  placeholder="Record your management oversight — what you have considered, any actions agreed, lessons identified…"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSubmitOversight}
                  disabled={!oversightNote.trim() || addOversight.isPending}
                  className="bg-amber-600 hover:bg-amber-700 flex-1"
                >
                  {addOversight.isPending ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                  ) : (
                    <><Shield className="h-3.5 w-3.5" /> Record Oversight</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setOversightTarget(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Oversight Queue ────────────────────────────────────────────────────

function OversightQueueTab() {
  const { currentUser } = useAuthContext();
  const query = useIncidents({ needs_oversight: true });
  const addOversight = useAddOversight();
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [ariaPanelId, setAriaPanelId] = useState<string | null>(null);

  const queue: Incident[] = (query.data?.data ?? [])
    .filter((i) => i.requires_oversight && !i.oversight_by)
    .sort((a, b) => {
      const w = { critical: 0, high: 1, medium: 2, low: 3 };
      return (w[a.severity] ?? 2) - (w[b.severity] ?? 2);
    });

  if (query.isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-16 text-center">
        <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <div className="text-base font-bold text-slate-900">All incidents have manager oversight</div>
        <div className="text-sm text-slate-400 mt-1">
          Every incident requiring oversight has been reviewed. Well done.
        </div>
      </div>
    );
  }

  function handleSubmit(inc: Incident) {
    const note = notesById[inc.id] ?? "";
    if (!note.trim()) return;
    addOversight.mutate(
      { id: inc.id, note, by: currentUser?.id ?? "staff_darren" },
      {
        onSuccess: () => {
          setSubmittedIds((prev) => new Set([...prev, inc.id]));
        },
      }
    );
  }

  return (
    <div className="space-y-4">
      {/* Queue banner */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <Eye className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-amber-800">
            {queue.length} incident{queue.length !== 1 ? "s" : ""} awaiting management oversight
          </div>
          <div className="text-xs text-amber-700 mt-0.5">
            Oversight must be recorded by the Registered Manager. Aria can help you draft your comments.
          </div>
        </div>
      </div>

      {queue.map((inc) => {
        const sev = SEV_CONFIG[inc.severity] ?? SEV_CONFIG.low;
        const submitted = submittedIds.has(inc.id);
        const note = notesById[inc.id] ?? "";

        if (submitted) {
          return (
            <div key={inc.id} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-emerald-800">{inc.reference} — Oversight recorded</div>
                <div className="text-xs text-emerald-600 mt-0.5">Oversight saved. This incident will clear from the queue when you refresh.</div>
              </div>
            </div>
          );
        }

        return (
          <div key={inc.id} className={cn("rounded-2xl border bg-white border-l-4 overflow-hidden", sev.border)}>
            {/* Card header */}
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className={cn("rounded-xl p-2.5 shrink-0", sev.bg)}>
                  <AlertTriangle className={cn("h-4 w-4", sev.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900">{inc.reference}</span>
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", sev.badge)}>
                      {inc.severity}
                    </span>
                    <span className="text-xs font-medium text-slate-600">{INCIDENT_TYPE_LABELS[inc.type]}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <YPAvatar childId={inc.child_id} />
                      <span className="text-xs font-semibold text-violet-700">{getYPName(inc.child_id)}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{formatDate(inc.date)} at {inc.time}</span>
                    {inc.location && <span className="text-[11px] text-slate-400">{inc.location}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Incident body */}
            <div className="p-5 space-y-4">
              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</div>
                <p className="text-sm text-slate-700 leading-relaxed">{inc.description}</p>
              </div>

              {inc.immediate_action && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Immediate Action Taken</div>
                  <p className="text-sm text-slate-700 leading-relaxed">{inc.immediate_action}</p>
                </div>
              )}

              {/* Notifications */}
              {inc.notifications.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Notifications Made</div>
                  <div className="space-y-1.5">
                    {inc.notifications.map((n, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                        <span className="text-xs text-slate-700">
                          <span className="font-medium">{n.role}:</span> {n.name} — {n.method}
                        </span>
                        {n.acknowledged
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          : <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aria panel */}
              <div>
                <button
                  onClick={() => setAriaPanelId(ariaPanelId === inc.id ? null : inc.id)}
                  className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {ariaPanelId === inc.id ? "Close Aria" : "Ask Aria to help draft oversight"}
                </button>

                {ariaPanelId === inc.id && (
                  <div className="mt-3">
                    <AriaPanel
                      mode="oversee"
                      pageContext="Incidents — Oversight Queue"
                      recordType="incident_oversight"
                      sourceContent={`Description: ${inc.description}\n\nImmediate action: ${inc.immediate_action}\n\nSeverity: ${inc.severity}\nType: ${INCIDENT_TYPE_LABELS[inc.type]}\nYoung person: ${getYPName(inc.child_id)}`}
                      onInsert={(text) => setNotesById((prev) => ({ ...prev, [inc.id]: text }))}
                    />
                  </div>
                )}
              </div>

              {/* Oversight form */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">Record Management Oversight</span>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNotesById((prev) => ({ ...prev, [inc.id]: e.target.value }))}
                  rows={4}
                  placeholder="Record your oversight — considerations, actions agreed, lessons identified, follow-up required…"
                  className="w-full rounded-xl border border-amber-200 bg-white px-3.5 py-3 text-xs text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-400 leading-relaxed"
                />
                <Button
                  onClick={() => handleSubmit(inc)}
                  disabled={!note.trim() || addOversight.isPending}
                  className="bg-amber-600 hover:bg-amber-700"
                  size="sm"
                >
                  {addOversight.isPending ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>
                  ) : (
                    <><Shield className="h-3.5 w-3.5" />Record Oversight</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tab 3: Log New Incident ───────────────────────────────────────────────────

const EMPTY_FORM = {
  child_id: "",
  type: "",
  severity: "medium" as string,
  date: todayStr(),
  time: new Date().toTimeString().slice(0, 5),
  location: "",
  description: "",
  immediate_action: "",
  notifications: [] as Array<{ role: string; name: string; method: string }>,
  body_map_required: false,
};

function LogIncidentTab({ onSuccess }: { onSuccess?: () => void }) {
  const { currentUser, currentRole } = useAuthContext();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [notifRole, setNotifRole] = useState("");
  const [notifName, setNotifName] = useState("");
  const [notifMethod, setNotifMethod] = useState("Phone");
  const [successResult, setSuccessResult] = useState<{ ref: string; links: string[] } | null>(null);
  const [ariaOpen, setAriaOpen] = useState(false);

  const createIncident = useCreateIncident();
  const logYpQuery = useYoungPeople();
  const logAllYP = logYpQuery.data?.data ?? [];

  function addNotif() {
    if (!notifRole) return;
    setForm((prev) => ({
      ...prev,
      notifications: [
        ...prev.notifications,
        { role: notifRole, name: notifName, method: notifMethod },
      ],
    }));
    setNotifRole(""); setNotifName(""); setNotifMethod("Phone");
  }

  function removeNotif(i: number) {
    setForm((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((_, idx) => idx !== i),
    }));
  }

  function handleSubmit() {
    if (!form.child_id || !form.type || !form.description || !form.immediate_action) return;

    createIncident.mutate(
      {
        ...form,
        type: form.type as Incident["type"],
        severity: form.severity as Incident["severity"],
        reported_by: currentUser?.id ?? "staff_darren",
        witnesses: [],
        notifications: form.notifications.map((n) => ({
          ...n,
          notified_at: new Date().toISOString(),
          acknowledged: false,
        })),
        body_map_completed: false,
        requires_oversight: ["critical", "high"].includes(form.severity),
        status: "open",
        linked_task_ids: [],
        linked_document_ids: [],
      } as Partial<Incident>,
      {
        onSuccess: (res: { data: Incident; linked_updates?: string[] }) => {
          setSuccessResult({
            ref: res.data?.reference ?? "New incident",
            links: res.linked_updates ?? [],
          });
          setForm({ ...EMPTY_FORM });
        },
      }
    );
  }

  const isValid = form.child_id && form.type && form.description.length > 10 && form.immediate_action.length > 5;

  if (successResult) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <div>
          <div className="text-base font-bold text-emerald-800">{successResult.ref} — Incident logged</div>
          <div className="text-sm text-emerald-700 mt-1">
            The incident has been created and is now in the oversight queue.
          </div>
        </div>
        {successResult.links.length > 0 && (
          <div className="rounded-xl bg-white border border-emerald-200 p-4 text-left">
            <div className="text-xs font-semibold text-slate-700 mb-2">Auto-created linked records:</div>
            <ul className="space-y-1">
              {successResult.links.map((l, i) => (
                <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button
          onClick={() => setSuccessResult(null)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Log Another Incident
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Child + type + severity */}
      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <div className="text-sm font-bold text-slate-900">Incident Details</div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1.5">
            Young Person <span className="text-red-500">*</span>
          </label>
          <select
            value={form.child_id}
            onChange={(e) => setForm((p) => ({ ...p, child_id: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            <option value="">Select young person…</option>
            {logAllYP.map((yp) => (
              <option key={yp.id} value={yp.id}>
                {yp.preferred_name || yp.first_name} {yp.last_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              Incident Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="">Select type…</option>
              {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{INCIDENT_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Severity</label>
            <select
              value={form.severity}
              onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Date</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Time</label>
            <Input
              type="time"
              value={form.time}
              onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Location</label>
            <Input
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              placeholder="e.g. Bedroom, Community"
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-slate-900">Description & Actions</div>
          <button
            onClick={() => setAriaOpen(!ariaOpen)}
            className="flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Aria Write
          </button>
        </div>

        {ariaOpen && (
          <AriaPanel
            mode="write"
            pageContext="Log New Incident"
            recordType="incident"
            sourceContent={form.type ? `Incident type: ${INCIDENT_TYPE_LABELS[form.type as keyof typeof INCIDENT_TYPE_LABELS] || form.type}, severity: ${form.severity}, child: ${getYPName(form.child_id)}` : undefined}
            onInsert={(text) => setForm((p) => ({ ...p, description: text }))}
          />
        )}

        <AriaCompose
          value={form.description}
          onChange={(text) => setForm((p) => ({ ...p, description: text }))}
          actorUserId={currentUser?.id ?? "staff_darren"}
          actorRole={appRoleToAriaRole(currentRole)}
          homeId={currentUser?.home_id ?? "home_oak"}
          childId={form.child_id || undefined}
          sourceModule="incident"
          sourceField="description"
          defaultCommand="draft_incident_record"
          commands={[
            { id: "draft_incident_record", label: "Draft incident record", permission: "aria.generate_drafts" },
            { id: "check_incident_chronology", label: "Check chronology", permission: "aria.analyse_risk" },
            { id: "incident_risk_analysis", label: "Risk analysis", permission: "aria.analyse_risk" },
            { id: "identify_missing_incident_information", label: "Missing information", permission: "aria.analyse_risk" },
            { id: "improve_writing", label: "Improve writing", permission: "aria.rewrite" },
          ]}
          label="Description *"
          placeholder="Describe what happened, what was observed, who was involved, any relevant context."
          rows={5}
        />

        <AriaCompose
          value={form.immediate_action}
          onChange={(text) => setForm((p) => ({ ...p, immediate_action: text }))}
          actorUserId={currentUser?.id ?? "staff_darren"}
          actorRole={appRoleToAriaRole(currentRole)}
          homeId={currentUser?.home_id ?? "home_oak"}
          childId={form.child_id || undefined}
          sourceModule="incident"
          sourceField="immediate_action"
          defaultCommand="improve_writing"
          commands={[
            { id: "improve_writing", label: "Improve writing", permission: "aria.rewrite" },
            { id: "professionalise_record", label: "Professionalise", permission: "aria.rewrite" },
            { id: "extract_actions", label: "Extract follow-up actions", permission: "aria.summarise" },
          ]}
          label="Immediate Action Taken *"
          placeholder="What steps were taken immediately, who was informed, what support was provided."
          rows={3}
        />
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <div className="text-sm font-bold text-slate-900">Notifications</div>
        <div className="text-xs text-slate-500">Record who has been informed of this incident.</div>

        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs font-medium text-slate-600 block mb-1">Role</label>
            <select
              value={notifRole}
              onChange={(e) => setNotifRole(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="">Select role…</option>
              {NOTIF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs font-medium text-slate-600 block mb-1">Name (optional)</label>
            <Input
              value={notifName}
              onChange={(e) => setNotifName(e.target.value)}
              placeholder="Contact name"
              className="h-9 text-xs"
            />
          </div>
          <div className="w-28">
            <label className="text-xs font-medium text-slate-600 block mb-1">Method</label>
            <select
              value={notifMethod}
              onChange={(e) => setNotifMethod(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option>Phone</option>
              <option>Email</option>
              <option>In person</option>
              <option>Text</option>
            </select>
          </div>
          <Button size="sm" variant="outline" onClick={addNotif} disabled={!notifRole}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>

        {form.notifications.length > 0 && (
          <div className="space-y-1.5">
            {form.notifications.map((n, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-xs text-slate-700">
                  <span className="font-medium">{n.role}</span>
                  {n.name && `: ${n.name}`}
                  <span className="text-slate-400"> — {n.method}</span>
                </span>
                <button onClick={() => removeNotif(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Body map */}
      <div className="rounded-2xl border bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-slate-900">Body Map</div>
            <div className="text-xs text-slate-500 mt-0.5">Required for any incident involving physical marks, injuries, or self-harm.</div>
          </div>
          <button
            onClick={() => setForm((p) => ({ ...p, body_map_required: !p.body_map_required }))}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              form.body_map_required ? "bg-violet-600" : "bg-slate-200"
            )}
          >
            <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow transition-transform", form.body_map_required ? "translate-x-6" : "translate-x-1")} />
          </button>
        </div>
        {form.body_map_required && (
          <div className="mt-3 rounded-xl bg-violet-50 border border-violet-100 p-3 text-xs text-violet-700">
            A body map will need to be completed alongside this incident record. You can upload this once the incident is saved.
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || createIncident.isPending}
          className="bg-rose-600 hover:bg-rose-700 px-6"
        >
          {createIncident.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
          ) : (
            <><FileText className="h-4 w-4" />Submit Incident</>
          )}
        </Button>
        {!isValid && (
          <span className="text-xs text-slate-400">
            Complete young person, type, description, and immediate action to submit
          </span>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IncidentsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const oversightQuery = useIncidents({ needs_oversight: true });
  const queueCount = (oversightQuery.data?.data ?? []).filter((i) => i.requires_oversight && !i.oversight_by).length;

  return (
    <PageShell
      title="Incidents"
      subtitle="Log, review, and oversee all incident records"
      ariaContext={{ pageTitle: "Care Events — Behaviour &amp; Safeguarding", sourceType: "incident" }}
      quickCreateContext={{ module: "incidents", defaultTaskCategory: "safeguarding", defaultFormType: "safeguarding_referral" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Incident Report" subtitle="Oak House — Incident Records" targetId="incidents-content" />
          <SmartUploadButton variant="inline" label="Upload Document" uploadContext="Incidents — evidence upload" />
          <Button
            size="sm"
            className="bg-rose-600 hover:bg-rose-700"
            onClick={() => setActiveTab("log")}
          >
            <Plus className="h-3.5 w-3.5" />
            Log Incident
          </Button>
        </div>
      }
    >
      <div id="incidents-content" className="space-y-6">
        {/* Tab bar */}
        <div className="flex items-center gap-1 rounded-2xl border bg-white p-1.5">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            const showBadge = id === "oversight" && queueCount > 0;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {showBadge && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    isActive ? "bg-white text-slate-900" : "bg-amber-500 text-white"
                  )}>
                    {queueCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "all" && <AllIncidentsTab />}
        {activeTab === "oversight" && <OversightQueueTab />}
        {activeTab === "log" && <LogIncidentTab onSuccess={() => setActiveTab("all")} />}

        {/* Care Events pipeline — behaviour, safeguarding events routed here */}
        <CareEventsPanel
          title="Care Events — Behaviour &amp; Safeguarding"
          category={["behaviour", "safeguarding", "missing_episode", "physical_intervention", "restraint"]}
          days={28}
          defaultCollapsed
        />
      </div>
    </PageShell>
  );
}
