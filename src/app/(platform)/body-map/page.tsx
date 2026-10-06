"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — BODY MAP RECORDS
// Records physical marks, bruises, injuries, and observations on young people.
// Each entry captures location on a body outline, type, size, colour,
// explanation, and linked incident. Required after any physical intervention
// and for safeguarding evidence. Supports Reg 12 (Protection of Children)
// and Schedule 5 (Events to be Notified).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { currentUserId } from "@/lib/auth/current-user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { toast } from "sonner";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { FlatList, FlatListRow, FlatListRowDetail, type RowSeverity } from "@/components/ui/list-row";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import type { BodyRegion, MarkType, MarkColour, BodyMapStatus, BodyMapEntry, BodyMark, BodyMapAction } from "@/types/extended";
import {
  Search,
  ArrowUpDown,
  X,
  Plus,
  Shield,
  CheckCircle2,
  Clock,
  User,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  PersonStanding,
  CircleDot,
  FileText,
  Link2,
} from "lucide-react";

import { api } from "@/hooks/use-api";
import { BodyMapDiagram, REGION_LABELS } from "@/components/body-map/body-map-diagram";
// ── Config ────────────────────────────────────────────────────────────────────

const MARK_TYPE_CONFIG: Record<MarkType, { label: string; colour: string }> = {
  bruise:        { label: "Bruise",        colour: "bg-purple-100 text-purple-700" },
  scratch:       { label: "Scratch",       colour: "bg-orange-100 text-orange-700" },
  cut:           { label: "Cut",           colour: "bg-red-100 text-red-700"     },
  burn:          { label: "Burn",          colour: "bg-red-100 text-red-800"     },
  swelling:      { label: "Swelling",      colour: "bg-blue-100 text-blue-700"   },
  redness:       { label: "Redness",       colour: "bg-rose-100 text-rose-700"   },
  bite_mark:     { label: "Bite Mark",     colour: "bg-amber-100 text-amber-700" },
  pressure_mark: { label: "Pressure Mark", colour: "bg-yellow-100 text-yellow-700" },
  old_scar:      { label: "Old Scar",      colour: "bg-gray-100 text-gray-600"   },
  other:         { label: "Other",         colour: "bg-slate-100 text-[var(--cs-text-secondary)]" },
};

const COLOUR_LABELS: Record<MarkColour, string> = {
  red: "Red", purple: "Purple", blue: "Blue", yellow: "Yellow",
  green: "Green", brown: "Brown", black: "Black", mixed: "Mixed",
  not_applicable: "N/A",
};

// Actions / notifications after a mark is observed. Order runs from immediate
// care through to the safeguarding escalations.
const ACTION_OPTIONS: { action: BodyMapAction; label: string }[] = [
  { action: "first_aid",             label: "First aid given" },
  { action: "medical_attention",     label: "Medical attention" },
  { action: "manager_informed",      label: "Manager informed" },
  { action: "parent_informed",       label: "Parent/carer informed" },
  { action: "social_worker_informed",label: "Social worker informed" },
  { action: "safeguarding_referral", label: "Safeguarding referral made" },
  { action: "lado_referral",         label: "LADO referral" },
  { action: "police_informed",       label: "Police informed" },
  { action: "photograph_taken",      label: "Photograph taken" },
];
const ACTION_LABEL: Record<BodyMapAction, string> = Object.fromEntries(
  ACTION_OPTIONS.map((o) => [o.action, o.label]),
) as Record<BodyMapAction, string>;

const STATUS_CONFIG: Record<BodyMapStatus, { label: string; colour: string }> = {
  draft:              { label: "Draft",              colour: "bg-yellow-100 text-yellow-700" },
  completed:          { label: "Completed",          colour: "bg-[--cs-info-bg] text-[--cs-info]"     },
  reviewed:           { label: "Reviewed",           colour: "bg-[--cs-success-bg] text-[--cs-success]"   },
  linked_to_incident: { label: "Linked to Incident", colour: "bg-purple-100 text-purple-700" },
};

// Bar carries the assurance state: draft & completed still await management review.
const STATUS_ROW: Record<BodyMapStatus, RowSeverity> = {
  draft: "warning", completed: "warning", reviewed: "success", linked_to_incident: "neutral",
};
const STATUS_TEXT: Record<BodyMapStatus, string> = {
  draft: "text-yellow-700", completed: "text-[--cs-info]", reviewed: "text-[--cs-success]", linked_to_incident: "text-purple-700",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function BodyMapPage() {
  const { currentUser } = useAuthContext();

  /* ── data ───────────────────────────────────────────────────────────────── */
  const API = "/api/v1/body-map";
  const qc = useQueryClient();
  const { data: result, isLoading } = useQuery<{ data: import("@/types/extended").BodyMapEntry[] }>({
    queryKey: ["body-map"],
    queryFn: () => api.get<{ data: import("@/types/extended").BodyMapEntry[] }>(API),
  });
  const createEntry = useMutation({
    mutationFn: (data: Partial<import("@/types/extended").BodyMapEntry>) =>
      api.post(API, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["body-map"] }),
  });
  const updateEntry = useMutation({
    mutationFn: (data: Partial<import("@/types/extended").BodyMapEntry> & { id: string }) =>
      api.post(API, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["body-map"] }),
  });
  const entries = useMemo(() => result?.data ?? [], [result]);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<"all" | "needs_review" | "linked">("all");

  /* ── new entry form ─────────────────────────────────────────────────────── */
  const [nChild, setNChild] = useState("");
  const [nRegion, setNRegion] = useState<BodyRegion | "">("");
  const [nType, setNType] = useState<MarkType | "">("");
  const [nColour, setNColour] = useState<MarkColour | "">("");
  const [nSize, setNSize] = useState("");
  const [nDesc, setNDesc] = useState("");
  const [nChildExp, setNChildExp] = useState("");
  const [nStaffObs, setNStaffObs] = useState("");
  const [nLinkedInc, setNLinkedInc] = useState("");
  const [nMark, setNMark] = useState<BodyMark | null>(null);
  const [nConsistent, setNConsistent] = useState<"" | "yes" | "no" | "unsure">("");
  const [nActions, setNActions] = useState<BodyMapAction[]>([]);
  const [nFollowUp, setNFollowUp] = useState(false);
  const [nFollowUpDate, setNFollowUpDate] = useState("");

  /* ── filtering ──────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...entries];

    // tab
    if (tab === "needs_review") list = list.filter(e => e.status === "draft" || e.status === "completed");
    if (tab === "linked") list = list.filter(e => e.linked_incident_id !== null);

    // filters
    if (childFilter !== "all") list = list.filter(e => e.child_id === childFilter);
    if (typeFilter !== "all") list = list.filter(e => e.mark_type === typeFilter);
    if (statusFilter !== "all") list = list.filter(e => e.status === statusFilter);

    // search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.description.toLowerCase().includes(q) ||
        e.child_explanation.toLowerCase().includes(q) ||
        e.staff_observation.toLowerCase().includes(q) ||
        REGION_LABELS[e.body_region].toLowerCase().includes(q) ||
        getYPName(e.child_id).toLowerCase().includes(q) ||
        (e.linked_incident_id || "").toLowerCase().includes(q)
      );
    }

    // sort
    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.created_at.localeCompare(a.created_at);
        case "oldest": return a.created_at.localeCompare(b.created_at);
        case "child":  return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "type":   return a.mark_type.localeCompare(b.mark_type);
        case "region":  return a.body_region.localeCompare(b.body_region);
        default: return 0;
      }
    });
    return list;
  }, [entries, search, childFilter, typeFilter, statusFilter, sortBy, tab]);

  /* ── stats ──────────────────────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total: entries.length,
    needsReview: entries.filter(e => e.status === "draft" || e.status === "completed").length,
    linked: entries.filter(e => e.linked_incident_id !== null).length,
    reviewed: entries.filter(e => e.status === "reviewed").length,
    thisMonth: entries.filter(e => {
      const now = new Date();
      const entryDate = new Date(e.date);
      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    }).length,
  }), [entries]);

  /* ── per-child summary ──────────────────────────────────────────────────── */
  const childSummaries = useMemo(() => {
    const map = new Map<string, { count: number; latest: string; unreviewed: number }>();
    entries.forEach(e => {
      const cur = map.get(e.child_id) || { count: 0, latest: "", unreviewed: 0 };
      cur.count++;
      if (e.date > cur.latest) cur.latest = e.date;
      if (e.status === "draft" || e.status === "completed") cur.unreviewed++;
      map.set(e.child_id, cur);
    });
    return map;
  }, [entries]);

  /* ── export columns ─────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<BodyMapEntry>[] = [
    { header: "ID", accessor: (r) => r.id },
    { header: "Child", accessor: (r) => getYPName(r.child_id) },
    { header: "Date", accessor: (r) => r.date },
    { header: "Time", accessor: (r) => r.time },
    { header: "Recorded By", accessor: (r) => getStaffName(r.recorded_by) },
    { header: "Body Region", accessor: (r) => REGION_LABELS[r.body_region] },
    { header: "Mark Type", accessor: (r) => MARK_TYPE_CONFIG[r.mark_type].label },
    { header: "Colour", accessor: (r) => COLOUR_LABELS[r.mark_colour] },
    { header: "Size (cm)", accessor: (r) => r.size_cm },
    { header: "Description", accessor: (r) => r.description },
    { header: "Child Explanation", accessor: (r) => r.child_explanation },
    { header: "Staff Observation", accessor: (r) => r.staff_observation },
    { header: "Account Consistent", accessor: (r) => r.explanation_consistent === true ? "Yes" : r.explanation_consistent === false ? "No" : "" },
    { header: "Actions Taken", accessor: (r) => (r.actions_taken ?? []).map(a => ACTION_LABEL[a] ?? a).join("; ") },
    { header: "Follow-up", accessor: (r) => r.follow_up_required ? (r.follow_up_date ? `Yes (by ${r.follow_up_date})` : "Yes") : "No" },
    { header: "Status", accessor: (r) => STATUS_CONFIG[r.status].label },
    { header: "Linked Incident", accessor: (r) => r.linked_incident_id || "" },
    { header: "Photos", accessor: (r) => r.photos_attached ? "Yes" : "No" },
    { header: "Reviewed By", accessor: (r) => r.reviewed_by ? getStaffName(r.reviewed_by) : "" },
  ];

  /* ── create entry ───────────────────────────────────────────────────────── */
  const handleCreate = () => {
    if (!nChild || !nRegion || !nType || !nColour || !nDesc) return;
    createEntry.mutate({
      child_id: nChild,
      date: todayStr(),
      time: new Date().toTimeString().slice(0, 5),
      recorded_by: currentUser?.id || currentUserId(),
      body_region: nRegion as BodyRegion,
      coord_x: nMark?.x,
      coord_y: nMark?.y,
      body_view: nMark?.view,
      mark_type: nType as MarkType,
      mark_colour: nColour as MarkColour,
      size_cm: nSize || "N/A",
      description: nDesc,
      child_explanation: nChildExp,
      staff_observation: nStaffObs,
      explanation_consistent: nConsistent === "" ? null : nConsistent === "yes",
      actions_taken: nActions,
      follow_up_required: nFollowUp,
      follow_up_date: nFollowUp ? (nFollowUpDate || null) : null,
      status: nLinkedInc ? "linked_to_incident" : "draft",
      linked_incident_id: nLinkedInc || null,
      photos_attached: nActions.includes("photograph_taken"),
      reviewed_by: null,
      reviewed_at: null,
    });
    toast.success("Body map record saved");
    setShowNew(false);
    setNChild(""); setNRegion(""); setNType(""); setNColour("");
    setNSize(""); setNDesc(""); setNChildExp(""); setNStaffObs(""); setNLinkedInc("");
    setNMark(null);
    setNConsistent(""); setNActions([]); setNFollowUp(false); setNFollowUpDate("");
  };

  /* ── mark as reviewed ───────────────────────────────────────────────────── */
  const handleReview = (id: string) => {
    updateEntry.mutate({
      id,
      status: "reviewed",
      reviewed_by: currentUser?.id || currentUserId(),
      reviewed_at: new Date().toISOString(),
    });
  };

  /* ── unique children ────────────────────────────────────────────────────── */
  const childIds = useMemo(() => [...new Set(entries.map(e => e.child_id))], [entries]);

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Body Map Records"
      subtitle="Physical observations, marks, and injury recording"
      caraContext={{ pageTitle: "Body Map Records", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Body Map Records" subtitle="Safeguarding" />
          <ExportButton data={filtered} columns={exportCols} filename="body-map-records" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Record Observation
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "safeguarding" }} />
        </div>
      }
    >
      <CaraPanel mode="assist" pageContext="Body Map — physical injury recording, safeguarding observations, marks and bruising, non-accidental injury indicators" recordType="body_map" userRole="registered_manager" className="mb-2" />
      {/* ── Loading ────────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (<>
      {/* ── Stats Strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Records", value: stats.total, icon: FileText, colour: "text-blue-600" },
          { label: "Needs Review",  value: stats.needsReview, icon: Eye, colour: "text-[--cs-warning]" },
          { label: "Linked to PI",  value: stats.linked, icon: Link2, colour: "text-purple-600" },
          { label: "Reviewed",      value: stats.reviewed, icon: CheckCircle2, colour: "text-[--cs-success]" },
          { label: "This Month",    value: stats.thisMonth, icon: Calendar, colour: "text-indigo-600" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border bg-card p-3 flex items-center gap-3">
            <s.icon className={cn("h-5 w-5", s.colour)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Review Alert ─────────────────────────────────────────────────────── */}
      {stats.needsReview > 0 && (
        <div className="rounded-lg border border-[--cs-warning-soft] bg-[--cs-warning-bg] p-3 mb-6 flex items-center gap-3">
          <Eye className="h-5 w-5 text-[--cs-warning] shrink-0" />
          <div>
            <p className="text-sm font-medium text-[--cs-warning]">
              {stats.needsReview} body map {stats.needsReview === 1 ? "record requires" : "records require"} management review
            </p>
            <p className="text-xs text-[--cs-warning]">
              All body map entries must be reviewed by the Registered Manager or deputy.
            </p>
          </div>
        </div>
      )}

      {/* ── Per-child summary cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {childIds.map(cid => {
          const s = childSummaries.get(cid)!;
          return (
            <div key={cid} className="rounded-lg border bg-card p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm">{getYPName(cid)}</p>
                {s.unreviewed > 0 && (
                  <Badge variant="outline" className="bg-[--cs-warning-bg] text-[--cs-warning] text-xs">
                    {s.unreviewed} unreviewed
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{s.count} record{s.count !== 1 ? "s" : ""}</span>
                <span>Latest: {formatDate(s.latest)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: "all", label: "All Records", count: entries.length },
          { key: "needs_review", label: "Needs Review", count: stats.needsReview },
          { key: "linked", label: "Linked to Incident", count: stats.linked },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label} <span className="text-xs text-muted-foreground ml-1">({t.count})</span>
          </button>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <Select value={childFilter} onValueChange={setChildFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Child" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.entries(MARK_TYPE_CONFIG) as [MarkType, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {(Object.entries(STATUS_CONFIG) as [BodyMapStatus, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
              <SelectItem value="region">By Region</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Results count ─────────────────────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        {(search || childFilter !== "all" || typeFilter !== "all" || statusFilter !== "all") && " (filtered)"}
      </p>

      {/* ── Record Cards ──────────────────────────────────────────────────────── */}
      <FlatList id="body-map-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <PersonStanding className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No records found</p>
            <p className="text-sm">Adjust your filters or record a new observation.</p>
          </div>
        )}

        {filtered.map(entry => {
          const isOpen = expandedId === entry.id;
          const mc = MARK_TYPE_CONFIG[entry.mark_type];
          const sc = STATUS_CONFIG[entry.status];

          return (
            <div key={entry.id}>
              <FlatListRow severity={STATUS_ROW[entry.status]} onClick={() => setExpandedId(isOpen ? null : entry.id)} aria-expanded={isOpen} className="items-center gap-3 py-3">
                <CircleDot className="h-4 w-4 shrink-0 text-muted-foreground" />

                {/* main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{getYPName(entry.child_id)}</span>
                    <Badge variant="outline" className={cn("text-xs", mc.colour)}>
                      {mc.label}
                    </Badge>
                    <span className={cn("text-[11px] font-semibold uppercase tracking-wide", STATUS_TEXT[entry.status])}>
                      {sc.label}
                    </span>
                    {entry.linked_incident_id && (
                      <span className="inline-flex items-center text-[11px] font-medium text-purple-700">
                        <Link2 className="h-3 w-3 mr-1" />
                        {entry.linked_incident_id.toUpperCase().replace("INC_", "INC-")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {REGION_LABELS[entry.body_region]} · {entry.size_cm} · {COLOUR_LABELS[entry.mark_colour]} · {formatDate(entry.date)} at {entry.time}
                  </p>
                </div>

                {/* photos indicator */}
                {entry.photos_attached && (
                  <span className="text-xs text-muted-foreground shrink-0">📷 Photos</span>
                )}

                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </FlatListRow>

              {/* expanded detail */}
              {isOpen && (
                <FlatListRowDetail>
                  {/* body map location (if marked on the outline) */}
                  {entry.coord_x != null && entry.coord_y != null && entry.body_view && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Location on Body</p>
                      <div className="rounded-lg border bg-muted/20 p-2 w-fit">
                        <BodyMapDiagram
                          mode="single"
                          initialView={entry.body_view}
                          marks={[{
                            id: entry.id,
                            view: entry.body_view,
                            x: entry.coord_x,
                            y: entry.coord_y,
                            region: entry.body_region,
                            type: entry.mark_type,
                          }]}
                        />
                      </div>
                    </div>
                  )}

                  {/* description */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description of Mark</p>
                    <p className="text-sm">{entry.description}</p>
                  </div>

                  {/* child explanation */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Child&apos;s Explanation</p>
                    <p className="text-sm italic">{entry.child_explanation || "Not recorded"}</p>
                  </div>

                  {/* staff observation */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Staff Observation &amp; Assessment</p>
                    <p className="text-sm">{entry.staff_observation || "Not recorded"}</p>
                  </div>

                  {/* safeguarding review */}
                  {(entry.explanation_consistent === true || entry.explanation_consistent === false ||
                    (entry.actions_taken && entry.actions_taken.length > 0) || entry.follow_up_required) && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Safeguarding Review</p>
                      <div className="space-y-1.5">
                        {(entry.explanation_consistent === true || entry.explanation_consistent === false) && (
                          <p className="text-sm">
                            Account {entry.explanation_consistent
                              ? <span className="font-medium text-[--cs-success]">consistent</span>
                              : <span className="font-medium text-rose-600">inconsistent</span>} with the mark
                          </p>
                        )}
                        {entry.actions_taken && entry.actions_taken.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {entry.actions_taken.map(a => (
                              <span key={a} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{ACTION_LABEL[a] ?? a}</span>
                            ))}
                          </div>
                        )}
                        {entry.follow_up_required && (
                          <p className="text-sm text-muted-foreground">
                            Follow-up required{entry.follow_up_date ? ` by ${formatDate(entry.follow_up_date)}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* meta */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      Recorded by: <span className="font-medium text-foreground">{getStaffName(entry.recorded_by)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Date: <span className="font-medium text-foreground">{formatDate(entry.date)}</span>
                    </div>
                    {entry.reviewed_by && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[--cs-success]" />
                        Reviewed by: <span className="font-medium text-foreground">{getStaffName(entry.reviewed_by)}</span>
                      </div>
                    )}
                    {entry.reviewed_at && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        Reviewed: <span className="font-medium text-foreground">{formatDate(entry.reviewed_at.slice(0, 10))}</span>
                      </div>
                    )}
                  </div>

                  {/* smart links */}
                  <SmartLinkPanel
                    sourceType="body_map"
                    sourceId={entry.id}
                    childId={entry.child_id}
                    compact
                  />

                  {/* actions */}
                  {(entry.status === "draft" || entry.status === "completed") && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => handleReview(entry.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Mark as Reviewed
                      </Button>
                    </div>
                  )}
                </FlatListRowDetail>
              )}
            </div>
          );
        })}
      </FlatList>

      {/* ── Regulatory Note ───────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Regulatory Context</p>
            <p>
              Body maps are a critical safeguarding tool required under <strong>Regulation 12 (Protection of Children)</strong> and
              referenced in <strong>Schedule 5 (Events Notifiable to HMCI)</strong>. Every physical intervention must have a
              corresponding body map completed within 24 hours. All marks discovered during routine checks must also be recorded.
            </p>
            <p>
              Records should include the child&apos;s own explanation, accurate body location, size, colour, and staff
              professional assessment. Body maps must be reviewed by the Registered Manager or deputy and linked to
              relevant incident records.
            </p>
          </div>
        </div>
      </div>
      </>)}

      {/* ══ New Entry Dialog ══════════════════════════════════════════════════ */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Body Map Observation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* child */}
            <div>
              <label htmlFor="e1de-child" className="text-sm font-medium mb-1 block">Child *</label>
              <Select value={nChild} onValueChange={setNChild}>
                <SelectTrigger id="e1de-child"><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>
                  {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* body map — click the outline to mark the exact location */}
            <div>
              <label className="text-sm font-medium mb-1 block">Where is the mark? *</label>
              <div className="rounded-lg border bg-muted/30 p-3">
                <BodyMapDiagram
                  mode="single"
                  marks={nMark ? [nMark] : []}
                  onChange={(ms) => {
                    const m = ms[0] ?? null;
                    setNMark(m);
                    if (m) setNRegion(m.region);
                  }}
                />
                <p className="text-xs text-center mt-1">
                  {nMark ? (
                    <>Marked: <span className="font-semibold text-foreground">{REGION_LABELS[nMark.region]}</span>{" "}
                    <span className="text-muted-foreground">({nMark.view})</span></>
                  ) : nRegion ? (
                    <>Region: <span className="font-semibold text-foreground">{REGION_LABELS[nRegion]}</span></>
                  ) : (
                    <span className="text-muted-foreground">No location marked yet</span>
                  )}
                </p>
              </div>
              <div className="mt-2">
                <label htmlFor="e1de-body-region" className="text-xs text-muted-foreground mb-1 block">Or choose the region from a list</label>
                <Select value={nRegion} onValueChange={(v) => { setNRegion(v as BodyRegion); setNMark(null); }}>
                  <SelectTrigger id="e1de-body-region"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(REGION_LABELS) as [BodyRegion, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* mark type & colour */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="e1de-mark-type" className="text-sm font-medium mb-1 block">Mark Type *</label>
                <Select value={nType} onValueChange={(v) => setNType(v as MarkType)}>
                  <SelectTrigger id="e1de-mark-type"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(MARK_TYPE_CONFIG) as [MarkType, { label: string }][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="e1de-colour" className="text-sm font-medium mb-1 block">Colour *</label>
                <Select value={nColour} onValueChange={(v) => setNColour(v as MarkColour)}>
                  <SelectTrigger id="e1de-colour"><SelectValue placeholder="Colour" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(COLOUR_LABELS) as [MarkColour, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* size */}
            <div>
              <label htmlFor="e1de-size-cm" className="text-sm font-medium mb-1 block">Size (cm)</label>
              <Input id="e1de-size-cm"
                placeholder="e.g. 3x2"
                value={nSize}
                onChange={e => setNSize(e.target.value)}
              />
            </div>

            {/* description */}
            <div>
              <label htmlFor="e1de-description-of-mark" className="text-sm font-medium mb-1 block">Description of Mark *</label>
              <Textarea id="e1de-description-of-mark"
                placeholder="Detailed description of the mark — location, appearance, colour, edges, swelling..."
                value={nDesc}
                onChange={e => setNDesc(e.target.value)}
                rows={3}
              />
            </div>

            {/* child explanation */}
            <div>
              <label htmlFor="e1de-child-apos-s-explanation" className="text-sm font-medium mb-1 block">Child&apos;s Explanation</label>
              <Textarea id="e1de-child-apos-s-explanation"
                placeholder="Record what the child said about how the mark occurred, in their own words..."
                value={nChildExp}
                onChange={e => setNChildExp(e.target.value)}
                rows={2}
              />
            </div>

            {/* staff observation */}
            <div>
              <label htmlFor="e1de-staff-observation-amp-assessment" className="text-sm font-medium mb-1 block">Staff Observation &amp; Assessment</label>
              <Textarea id="e1de-staff-observation-amp-assessment"
                placeholder="Professional assessment — is the explanation consistent? Any safeguarding concerns?"
                value={nStaffObs}
                onChange={e => setNStaffObs(e.target.value)}
                rows={2}
              />
            </div>

            {/* safeguarding review */}
            <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-[--cs-info]" /> Safeguarding review
              </p>

              {/* consistency judgement */}
              <div>
                <label className="text-xs font-medium mb-1 block">Is the account consistent with the mark?</label>
                <div className="flex gap-1.5">
                  {([["yes", "Consistent"], ["no", "Inconsistent"], ["unsure", "Not sure"]] as const).map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setNConsistent(nConsistent === val ? "" : val)}
                      aria-pressed={nConsistent === val}
                      className={cn(
                        "rounded-md px-3 py-1 text-xs font-medium border transition-colors",
                        nConsistent === val
                          ? (val === "no" ? "bg-rose-600 text-white border-transparent" : "bg-[var(--cs-navy,#1e293b)] text-white border-transparent")
                          : "bg-background text-muted-foreground border-border hover:bg-muted",
                      )}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                {nConsistent === "no" && (
                  <p className="text-[11px] text-rose-600 mt-1">Inconsistent account — consider a safeguarding referral.</p>
                )}
              </div>

              {/* actions / notifications */}
              <div>
                <label className="text-xs font-medium mb-1 block">Actions taken &amp; people notified</label>
                <div className="flex flex-wrap gap-1.5">
                  {ACTION_OPTIONS.map(({ action, label }) => {
                    const on = nActions.includes(action);
                    return (
                      <button
                        key={action}
                        type="button"
                        onClick={() => setNActions(on ? nActions.filter(a => a !== action) : [...nActions, action])}
                        aria-pressed={on}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium border transition-colors",
                          on ? "bg-[var(--cs-navy,#1e293b)] text-white border-transparent" : "bg-background text-muted-foreground border-border hover:bg-muted",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* follow-up */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNFollowUp(!nFollowUp)}
                  aria-pressed={nFollowUp}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-medium border transition-colors",
                    nFollowUp ? "bg-[var(--cs-navy,#1e293b)] text-white border-transparent" : "bg-background text-muted-foreground border-border hover:bg-muted",
                  )}
                >
                  Follow-up required
                </button>
                {nFollowUp && (
                  <Input
                    type="date"
                    aria-label="Follow-up date"
                    value={nFollowUpDate}
                    onChange={e => setNFollowUpDate(e.target.value)}
                    className="w-auto h-8"
                  />
                )}
              </div>
            </div>

            {/* linked incident */}
            <div>
              <label htmlFor="e1de-linked-incident-id-optional" className="text-sm font-medium mb-1 block">Linked Incident ID (optional)</label>
              <Input id="e1de-linked-incident-id-optional"
                placeholder="e.g. inc_005"
                value={nLinkedInc}
                onChange={e => setNLinkedInc(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Link to a physical intervention or incident record if applicable.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!nChild || !nRegion || !nType || !nColour || !nDesc}
            >
              Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        category="safeguarding"
        days={60}
        defaultCollapsed
      />
    </PageShell>
  );
}
