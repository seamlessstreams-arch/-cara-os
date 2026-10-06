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
import type { BodyRegion, MarkType, MarkColour, BodyMapStatus, BodyMapEntry, BodyMark, BodyMapAction, BodyMapMark, BodyView } from "@/types/extended";
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

// A mark while it's being edited in the dialog: location (from the diagram) +
// its own clinical detail. type/colour are "" until the recorder sets them.
type EditMark = {
  id: string;
  view: BodyView;
  x: number;
  y: number;
  region: BodyRegion;
  mark_type: MarkType | "";
  mark_colour: MarkColour | "";
  size_cm: string;
  description: string;
};

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
  const [nMarks, setNMarks] = useState<EditMark[]>([]);
  const [nChildExp, setNChildExp] = useState("");
  const [nStaffObs, setNStaffObs] = useState("");
  const [nLinkedInc, setNLinkedInc] = useState("");
  const [nConsistent, setNConsistent] = useState<"" | "yes" | "no" | "unsure">("");
  const [nActions, setNActions] = useState<BodyMapAction[]>([]);
  const [nFollowUp, setNFollowUp] = useState(false);
  const [nFollowUpDate, setNFollowUpDate] = useState("");

  // Reconcile the diagram's marks with the per-mark clinical detail, keeping
  // existing marks' type/colour/size/description and blanking new ones.
  const handleMarksChange = (bmarks: BodyMark[]) =>
    setNMarks((prev) =>
      bmarks.map((bm) => {
        const existing = prev.find((p) => p.id === bm.id);
        return existing
          ? { ...existing, view: bm.view, x: bm.x, y: bm.y, region: bm.region }
          : { id: bm.id, view: bm.view, x: bm.x, y: bm.y, region: bm.region, mark_type: "" as const, mark_colour: "" as const, size_cm: "", description: "" };
      }),
    );
  const updateMark = (id: string, patch: Partial<EditMark>) =>
    setNMarks((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const marksValid = nMarks.length > 0 && nMarks.every((m) => m.mark_type && m.mark_colour && m.description.trim());
  const resetForm = () => {
    setNChild(""); setNMarks([]); setNChildExp(""); setNStaffObs(""); setNLinkedInc("");
    setNConsistent(""); setNActions([]); setNFollowUp(false); setNFollowUpDate("");
  };

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
    { header: "All Marks", accessor: (r) => (r.marks && r.marks.length > 1)
      ? r.marks.map((m, i) => `${i + 1}. ${REGION_LABELS[m.region]} (${m.view}) ${MARK_TYPE_CONFIG[m.mark_type].label}/${COLOUR_LABELS[m.mark_colour]}${m.size_cm && m.size_cm !== "N/A" ? ` ${m.size_cm}` : ""}${m.description ? ` — ${m.description}` : ""}`).join(" | ")
      : "" },
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
    if (!nChild || !marksValid) return;
    const marks: BodyMapMark[] = nMarks.map((m) => ({
      id: m.id, view: m.view, x: m.x, y: m.y, region: m.region,
      mark_type: m.mark_type as MarkType,
      mark_colour: m.mark_colour as MarkColour,
      size_cm: m.size_cm.trim() || "N/A",
      description: m.description.trim(),
    }));
    const primary = marks[0];
    createEntry.mutate({
      child_id: nChild,
      date: todayStr(),
      time: new Date().toTimeString().slice(0, 5),
      recorded_by: currentUser?.id || currentUserId(),
      // top-level mirrors the first mark so single-mark readers keep working
      body_region: primary.region,
      coord_x: primary.x,
      coord_y: primary.y,
      body_view: primary.view,
      mark_type: primary.mark_type,
      mark_colour: primary.mark_colour,
      size_cm: primary.size_cm,
      description: primary.description,
      marks,
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
    toast.success(marks.length > 1 ? `Body map saved — ${marks.length} marks` : "Body map record saved");
    setShowNew(false);
    resetForm();
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
                    {entry.marks && entry.marks.length > 1 ? `${entry.marks.length} marks · ` : ""}
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
                  {/* body map marks */}
                  {(() => {
                    const marks: BodyMapMark[] = (entry.marks && entry.marks.length > 0)
                      ? entry.marks
                      : (entry.coord_x != null && entry.coord_y != null && entry.body_view
                          ? [{ id: entry.id, view: entry.body_view, x: entry.coord_x, y: entry.coord_y, region: entry.body_region, mark_type: entry.mark_type, mark_colour: entry.mark_colour, size_cm: entry.size_cm, description: entry.description }]
                          : []);
                    if (marks.length === 0) {
                      // legacy region-only record (no coordinates)
                      return (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Mark</p>
                          <p className="text-sm"><span className="font-medium">{REGION_LABELS[entry.body_region]}</span> — {entry.description}</p>
                        </div>
                      );
                    }
                    return (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{marks.length > 1 ? `Marks (${marks.length})` : "Location on Body"}</p>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className="rounded-lg border bg-muted/20 p-2 w-fit shrink-0">
                            <BodyMapDiagram
                              initialView={marks[0].view}
                              marks={marks.map(m => ({ id: m.id, view: m.view, x: m.x, y: m.y, region: m.region, type: m.mark_type }))}
                            />
                          </div>
                          <ol className="space-y-1.5 text-sm flex-1">
                            {marks.map((m, i) => (
                              <li key={m.id} className="flex items-baseline gap-2">
                                <span className="inline-flex items-center justify-center rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold min-w-[18px] h-[18px] px-1 shrink-0">{i + 1}</span>
                                <span>
                                  <span className="font-medium">{REGION_LABELS[m.region]}</span>
                                  <span className="text-muted-foreground"> · {MARK_TYPE_CONFIG[m.mark_type].label} · {COLOUR_LABELS[m.mark_colour]}{m.size_cm && m.size_cm !== "N/A" ? ` · ${m.size_cm}` : ""}</span>
                                  {m.description ? <> — {m.description}</> : null}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    );
                  })()}

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
      <Dialog open={showNew} onOpenChange={(o) => { setShowNew(o); if (!o) resetForm(); }}>
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

            {/* body map — click the outline to add each mark */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Marks * <span className="font-normal text-muted-foreground">— click the outline to add each mark</span>
              </label>
              <div className="rounded-lg border bg-muted/30 p-3">
                <BodyMapDiagram
                  mode="multi"
                  marks={nMarks.map((m) => ({ id: m.id, view: m.view, x: m.x, y: m.y, region: m.region, type: (m.mark_type || undefined) as MarkType | undefined }))}
                  onChange={handleMarksChange}
                />
                {nMarks.length === 0 && (
                  <p className="text-xs text-center mt-1 text-muted-foreground">No marks placed yet — click the body outline for each mark.</p>
                )}
              </div>

              {/* per-mark detail */}
              {nMarks.length > 0 && (
                <div className="mt-2 space-y-2">
                  {nMarks.map((m, i) => (
                    <div key={m.id} className="rounded-lg border p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          <span className="inline-flex items-center justify-center rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold min-w-[18px] h-[18px] px-1">{i + 1}</span>
                          {REGION_LABELS[m.region]} <span className="text-muted-foreground font-normal">({m.view})</span>
                        </p>
                        <button type="button" onClick={() => setNMarks(prev => prev.filter(x => x.id !== m.id))} className="text-xs text-muted-foreground hover:text-rose-600">Remove</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={m.mark_type} onValueChange={(v) => updateMark(m.id, { mark_type: v as MarkType })}>
                          <SelectTrigger aria-label={`Mark ${i + 1} type`} className="h-9"><SelectValue placeholder="Type *" /></SelectTrigger>
                          <SelectContent>
                            {(Object.entries(MARK_TYPE_CONFIG) as [MarkType, { label: string }][]).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={m.mark_colour} onValueChange={(v) => updateMark(m.id, { mark_colour: v as MarkColour })}>
                          <SelectTrigger aria-label={`Mark ${i + 1} colour`} className="h-9"><SelectValue placeholder="Colour *" /></SelectTrigger>
                          <SelectContent>
                            {(Object.entries(COLOUR_LABELS) as [MarkColour, string][]).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input aria-label={`Mark ${i + 1} size (cm)`} placeholder="Size (cm) — e.g. 3x2" value={m.size_cm} onChange={e => updateMark(m.id, { size_cm: e.target.value })} className="h-9" />
                      <Textarea aria-label={`Mark ${i + 1} description`} placeholder="Description of this mark — appearance, colour, edges, swelling..." value={m.description} onChange={e => updateMark(m.id, { description: e.target.value })} rows={2} />
                    </div>
                  ))}
                </div>
              )}
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
            <Button variant="outline" onClick={() => { setShowNew(false); resetForm(); }}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={!nChild || !marksValid}
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
