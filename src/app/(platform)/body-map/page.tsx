"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BODY MAP RECORDS
// Records physical marks, bruises, injuries, and observations on young people.
// Each entry captures location on a body outline, type, size, colour,
// explanation, and linked incident. Required after any physical intervention
// and for safeguarding evidence. Supports Reg 12 (Protection of Children)
// and Schedule 5 (Events to be Notified).
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
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  Search, Filter, ArrowUpDown, X, Plus,
  AlertTriangle, Shield, CheckCircle2, Clock, User,
  Calendar, Eye, ChevronDown, ChevronUp, Loader2,
  PersonStanding, CircleDot, FileText, Link2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type BodyRegion =
  | "head_front" | "head_back" | "head_left" | "head_right"
  | "face" | "neck"
  | "chest" | "abdomen" | "upper_back" | "lower_back"
  | "left_shoulder" | "right_shoulder"
  | "left_upper_arm" | "right_upper_arm"
  | "left_forearm" | "right_forearm"
  | "left_hand" | "right_hand"
  | "left_hip" | "right_hip"
  | "left_thigh" | "right_thigh"
  | "left_knee" | "right_knee"
  | "left_shin" | "right_shin"
  | "left_foot" | "right_foot";

type MarkType = "bruise" | "scratch" | "cut" | "burn" | "swelling" | "redness" | "bite_mark" | "pressure_mark" | "old_scar" | "other";
type MarkColour = "red" | "purple" | "blue" | "yellow" | "green" | "brown" | "black" | "mixed" | "not_applicable";
type RecordStatus = "draft" | "completed" | "reviewed" | "linked_to_incident";

interface BodyMapEntry {
  id: string;
  child_id: string;
  date: string;
  time: string;
  recorded_by: string;
  body_region: BodyRegion;
  mark_type: MarkType;
  mark_colour: MarkColour;
  size_cm: string;
  description: string;
  child_explanation: string;
  staff_observation: string;
  status: RecordStatus;
  linked_incident_id: string | null;
  photos_attached: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const REGION_LABELS: Record<BodyRegion, string> = {
  head_front: "Head (Front)", head_back: "Head (Back)", head_left: "Head (Left)", head_right: "Head (Right)",
  face: "Face", neck: "Neck",
  chest: "Chest", abdomen: "Abdomen", upper_back: "Upper Back", lower_back: "Lower Back",
  left_shoulder: "Left Shoulder", right_shoulder: "Right Shoulder",
  left_upper_arm: "Left Upper Arm", right_upper_arm: "Right Upper Arm",
  left_forearm: "Left Forearm", right_forearm: "Right Forearm",
  left_hand: "Left Hand", right_hand: "Right Hand",
  left_hip: "Left Hip", right_hip: "Right Hip",
  left_thigh: "Left Thigh", right_thigh: "Right Thigh",
  left_knee: "Left Knee", right_knee: "Right Knee",
  left_shin: "Left Shin", right_shin: "Right Shin",
  left_foot: "Left Foot", right_foot: "Right Foot",
};

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
  other:         { label: "Other",         colour: "bg-slate-100 text-slate-600" },
};

const COLOUR_LABELS: Record<MarkColour, string> = {
  red: "Red", purple: "Purple", blue: "Blue", yellow: "Yellow",
  green: "Green", brown: "Brown", black: "Black", mixed: "Mixed",
  not_applicable: "N/A",
};

const STATUS_CONFIG: Record<RecordStatus, { label: string; colour: string }> = {
  draft:              { label: "Draft",              colour: "bg-yellow-100 text-yellow-700" },
  completed:          { label: "Completed",          colour: "bg-blue-100 text-blue-700"     },
  reviewed:           { label: "Reviewed",           colour: "bg-green-100 text-green-700"   },
  linked_to_incident: { label: "Linked to Incident", colour: "bg-purple-100 text-purple-700" },
};

// ── Seed Data ─────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10);
};

const SEED_ENTRIES: BodyMapEntry[] = [
  {
    id: "bm_001", child_id: "yp_alex", date: d(-35), time: "21:45",
    recorded_by: "staff_edward", body_region: "left_forearm",
    mark_type: "bruise", mark_colour: "purple", size_cm: "3x2",
    description: "Oval bruise on inner left forearm, approximately 3cm x 2cm. Purple/blue colouring indicating fresh injury.",
    child_explanation: "Alex stated: 'I banged it when I was struggling. It doesn't hurt much.'",
    staff_observation: "Mark is consistent with brief contact during physical intervention. No grip marks visible. Alex calm during examination.",
    status: "linked_to_incident", linked_incident_id: "inc_005",
    photos_attached: true, reviewed_by: "staff_darren", reviewed_at: d(-34) + "T09:15:00Z",
    created_at: d(-35) + "T21:45:00Z",
  },
  {
    id: "bm_002", child_id: "yp_alex", date: d(-22), time: "15:10",
    recorded_by: "staff_chervelle", body_region: "right_upper_arm",
    mark_type: "redness", mark_colour: "red", size_cm: "5x3",
    description: "Area of redness on outer right upper arm. No swelling. Fading at edges.",
    child_explanation: "Alex stated: 'I don't know how that got there. Maybe from leaning on the door frame.'",
    staff_observation: "Redness consistent with brief pressure contact. No bruising. Alex showed no pain or discomfort.",
    status: "linked_to_incident", linked_incident_id: "inc_006",
    photos_attached: true, reviewed_by: null, reviewed_at: null,
    created_at: d(-22) + "T15:10:00Z",
  },
  {
    id: "bm_003", child_id: "yp_alex", date: d(-10), time: "19:00",
    recorded_by: "staff_ryan", body_region: "left_forearm",
    mark_type: "bruise", mark_colour: "blue", size_cm: "4x3",
    description: "Bruise on left forearm, mid-section. Blue colouration with some swelling. Not caused by hold — occurred during struggle with object prior to intervention.",
    child_explanation: "Alex stated: 'I hit my arm on the desk. It hurts a bit.'",
    staff_observation: "Bruise location and shape consistent with striking the edge of the desk during the incident. Not consistent with hold technique used. Paramedic confirmed minor soft tissue injury only.",
    status: "linked_to_incident", linked_incident_id: "inc_007",
    photos_attached: true, reviewed_by: null, reviewed_at: null,
    created_at: d(-10) + "T19:00:00Z",
  },
  {
    id: "bm_004", child_id: "yp_jordan", date: d(-8), time: "17:30",
    recorded_by: "staff_anna", body_region: "left_knee",
    mark_type: "scratch", mark_colour: "red", size_cm: "6x1",
    description: "Superficial scratch on left knee, approximately 6cm long. Clean edges, no bleeding at time of recording.",
    child_explanation: "Jordan stated: 'I fell off my bike at school. The teacher saw it happen.'",
    staff_observation: "Mark is consistent with a fall on rough ground. Jordan showed no distress. School contacted and confirmed incident occurred during PE. No safeguarding concerns identified.",
    status: "reviewed", linked_incident_id: null,
    photos_attached: false, reviewed_by: "staff_darren", reviewed_at: d(-7) + "T10:00:00Z",
    created_at: d(-8) + "T17:30:00Z",
  },
  {
    id: "bm_005", child_id: "yp_casey", date: d(-5), time: "08:45",
    recorded_by: "staff_diane", body_region: "right_shin",
    mark_type: "bruise", mark_colour: "yellow", size_cm: "2x2",
    description: "Small yellow-green bruise on right shin. Appears to be several days old based on colouring.",
    child_explanation: "Casey stated: 'I kicked the table leg by accident a few days ago. I forgot to mention it.'",
    staff_observation: "Yellow colouring suggests bruise is 5-7 days old. Location and size consistent with accidental impact. Casey relaxed during check. No concerns.",
    status: "completed", linked_incident_id: null,
    photos_attached: false, reviewed_by: null, reviewed_at: null,
    created_at: d(-5) + "T08:45:00Z",
  },
  {
    id: "bm_006", child_id: "yp_alex", date: d(-3), time: "20:00",
    recorded_by: "staff_edward", body_region: "left_hand",
    mark_type: "scratch", mark_colour: "red", size_cm: "3x0.5",
    description: "Thin scratch across the back of the left hand. Superficial, no bleeding.",
    child_explanation: "Alex stated: 'The cat at the park scratched me.'",
    staff_observation: "Mark appears consistent with an animal scratch. Clean, superficial. Alex was on community time earlier and mentioned interacting with a neighbourhood cat. No safeguarding concern.",
    status: "completed", linked_incident_id: null,
    photos_attached: false, reviewed_by: null, reviewed_at: null,
    created_at: d(-3) + "T20:00:00Z",
  },
  {
    id: "bm_007", child_id: "yp_jordan", date: d(-1), time: "16:15",
    recorded_by: "staff_anna", body_region: "right_forearm",
    mark_type: "old_scar", mark_colour: "not_applicable", size_cm: "2x0.5",
    description: "Pre-existing scar on right forearm noted during routine check. Not previously recorded on file. Light, well-healed scar.",
    child_explanation: "Jordan stated: 'I've had that since I was little. I fell on glass at my old house.'",
    staff_observation: "Scar is well-healed and appears several years old. Consistent with child's explanation. Recorded for completeness and baseline mapping. No action required.",
    status: "reviewed", linked_incident_id: null,
    photos_attached: false, reviewed_by: "staff_darren", reviewed_at: d(0) + "T09:00:00Z",
    created_at: d(-1) + "T16:15:00Z",
  },
  {
    id: "bm_008", child_id: "yp_casey", date: d(0), time: "07:30",
    recorded_by: "staff_anna", body_region: "neck",
    mark_type: "redness", mark_colour: "red", size_cm: "1x1",
    description: "Small area of redness on the left side of the neck. No swelling, no tenderness reported.",
    child_explanation: "Casey stated: 'I think my necklace rubbed on it overnight.'",
    staff_observation: "Casey was wearing a new chain necklace yesterday evening. Area is consistent with friction from jewellery. Monitoring today. If persists, will reassess.",
    status: "draft", linked_incident_id: null,
    photos_attached: false, reviewed_by: null, reviewed_at: null,
    created_at: d(0) + "T07:30:00Z",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function BodyMapPage() {
  const { currentUser } = useAuthContext();

  /* ── state ──────────────────────────────────────────────────────────────── */
  const [entries, setEntries] = useState<BodyMapEntry[]>(SEED_ENTRIES);
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
    { header: "Status", accessor: (r) => STATUS_CONFIG[r.status].label },
    { header: "Linked Incident", accessor: (r) => r.linked_incident_id || "" },
    { header: "Photos", accessor: (r) => r.photos_attached ? "Yes" : "No" },
    { header: "Reviewed By", accessor: (r) => r.reviewed_by ? getStaffName(r.reviewed_by) : "" },
  ];

  /* ── create entry ───────────────────────────────────────────────────────── */
  const handleCreate = () => {
    if (!nChild || !nRegion || !nType || !nColour || !nDesc) return;
    const entry: BodyMapEntry = {
      id: `bm_${Date.now()}`,
      child_id: nChild,
      date: todayStr(),
      time: new Date().toTimeString().slice(0, 5),
      recorded_by: currentUser?.id || "staff_darren",
      body_region: nRegion as BodyRegion,
      mark_type: nType as MarkType,
      mark_colour: nColour as MarkColour,
      size_cm: nSize || "N/A",
      description: nDesc,
      child_explanation: nChildExp,
      staff_observation: nStaffObs,
      status: nLinkedInc ? "linked_to_incident" : "draft",
      linked_incident_id: nLinkedInc || null,
      photos_attached: false,
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date().toISOString(),
    };
    setEntries(prev => [entry, ...prev]);
    setShowNew(false);
    setNChild(""); setNRegion(""); setNType(""); setNColour("");
    setNSize(""); setNDesc(""); setNChildExp(""); setNStaffObs(""); setNLinkedInc("");
  };

  /* ── mark as reviewed ───────────────────────────────────────────────────── */
  const handleReview = (id: string) => {
    setEntries(prev => prev.map(e =>
      e.id === id ? {
        ...e,
        status: "reviewed" as RecordStatus,
        reviewed_by: currentUser?.id || "staff_darren",
        reviewed_at: new Date().toISOString(),
      } : e
    ));
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
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Body Map Records" subtitle="Oak House — Safeguarding" />
          <ExportButton data={filtered} columns={exportCols} filename="body-map-records" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Record Observation
          </Button>
        </div>
      }
    >
      {/* ── Stats Strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Records", value: stats.total, icon: FileText, colour: "text-blue-600" },
          { label: "Needs Review",  value: stats.needsReview, icon: Eye, colour: "text-amber-600" },
          { label: "Linked to PI",  value: stats.linked, icon: Link2, colour: "text-purple-600" },
          { label: "Reviewed",      value: stats.reviewed, icon: CheckCircle2, colour: "text-green-600" },
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
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-3 mb-6 flex items-center gap-3">
          <Eye className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {stats.needsReview} body map {stats.needsReview === 1 ? "record requires" : "records require"} management review
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
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
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 text-xs">
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
            {(Object.entries(STATUS_CONFIG) as [RecordStatus, { label: string }][]).map(([k, v]) => (
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
      <div className="space-y-3" id="body-map-print">
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
            <div key={entry.id} className="rounded-lg border bg-card overflow-hidden">
              {/* header */}
              <button
                onClick={() => setExpandedId(isOpen ? null : entry.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                {/* type indicator */}
                <div className={cn("rounded-full p-1.5 shrink-0", mc.colour)}>
                  <CircleDot className="h-4 w-4" />
                </div>

                {/* main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{getYPName(entry.child_id)}</span>
                    <Badge variant="outline" className={cn("text-xs", mc.colour)}>
                      {mc.label}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs", sc.colour)}>
                      {sc.label}
                    </Badge>
                    {entry.linked_incident_id && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                        <Link2 className="h-3 w-3 mr-1" />
                        {entry.linked_incident_id.toUpperCase().replace("INC_", "INC-")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {REGION_LABELS[entry.body_region]} · {entry.size_cm} · {COLOUR_LABELS[entry.mark_colour]} · {formatDate(entry.date)} at {entry.time}
                  </p>
                </div>

                {/* photos indicator */}
                {entry.photos_attached && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 shrink-0">
                    📷 Photos
                  </Badge>
                )}

                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {/* expanded detail */}
              {isOpen && (
                <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
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
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
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

                  {/* actions */}
                  {(entry.status === "draft" || entry.status === "completed") && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => handleReview(entry.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Mark as Reviewed
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

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

      {/* ══ New Entry Dialog ══════════════════════════════════════════════════ */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Body Map Observation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* child */}
            <div>
              <label className="text-sm font-medium mb-1 block">Child *</label>
              <Select value={nChild} onValueChange={setNChild}>
                <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>
                  {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* body region */}
            <div>
              <label className="text-sm font-medium mb-1 block">Body Region *</label>
              <Select value={nRegion} onValueChange={(v) => setNRegion(v as BodyRegion)}>
                <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(REGION_LABELS) as [BodyRegion, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* mark type & colour */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Mark Type *</label>
                <Select value={nType} onValueChange={(v) => setNType(v as MarkType)}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(MARK_TYPE_CONFIG) as [MarkType, { label: string }][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Colour *</label>
                <Select value={nColour} onValueChange={(v) => setNColour(v as MarkColour)}>
                  <SelectTrigger><SelectValue placeholder="Colour" /></SelectTrigger>
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
              <label className="text-sm font-medium mb-1 block">Size (cm)</label>
              <Input
                placeholder="e.g. 3x2"
                value={nSize}
                onChange={e => setNSize(e.target.value)}
              />
            </div>

            {/* description */}
            <div>
              <label className="text-sm font-medium mb-1 block">Description of Mark *</label>
              <Textarea
                placeholder="Detailed description of the mark — location, appearance, colour, edges, swelling..."
                value={nDesc}
                onChange={e => setNDesc(e.target.value)}
                rows={3}
              />
            </div>

            {/* child explanation */}
            <div>
              <label className="text-sm font-medium mb-1 block">Child&apos;s Explanation</label>
              <Textarea
                placeholder="Record what the child said about how the mark occurred, in their own words..."
                value={nChildExp}
                onChange={e => setNChildExp(e.target.value)}
                rows={2}
              />
            </div>

            {/* staff observation */}
            <div>
              <label className="text-sm font-medium mb-1 block">Staff Observation &amp; Assessment</label>
              <Textarea
                placeholder="Professional assessment — is the explanation consistent? Any safeguarding concerns?"
                value={nStaffObs}
                onChange={e => setNStaffObs(e.target.value)}
                rows={2}
              />
            </div>

            {/* linked incident */}
            <div>
              <label className="text-sm font-medium mb-1 block">Linked Incident ID (optional)</label>
              <Input
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
    </PageShell>
  );
}
