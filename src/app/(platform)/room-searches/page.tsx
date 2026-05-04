"use client";

import { useState, useMemo } from "react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button }       from "@/components/ui/button";
import { Badge }        from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input }    from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, ArrowUpDown,
  ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, Clock, Eye,
} from "lucide-react";
import { cn }                          from "@/lib/utils";
import { getStaffName, getYPName }     from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────── */

type SearchType = "routine" | "intelligence_led" | "welfare_concern" | "missing_return" | "safeguarding" | "requested";
type DistressLevel = "none" | "mild" | "moderate" | "significant";
type SearchStatus = "completed" | "follow_up_required" | "escalated" | "closed";
type ActionStatus = "pending" | "in_progress" | "completed";

interface FoundItem {
  item: string;
  description: string;
  actionTaken: string;
  retained: boolean;
  photoTaken: boolean;
}

interface FollowUpAction {
  action: string;
  owner: string;
  dueDate: string;
  status: ActionStatus;
}

interface RoomSearch {
  id: string;
  youngPersonId: string;
  date: string;
  time: string;
  searchType: SearchType;
  reason: string;
  conductedBy: string;
  witnessedBy: string;
  childPresent: boolean;
  childInformed: boolean;
  areasSearched: string[];
  itemsFound: FoundItem[];
  nothingFound: boolean;
  childResponse: string;
  childDistressLevel: DistressLevel;
  followUpRequired: boolean;
  followUpActions: FollowUpAction[];
  socialWorkerNotified: boolean;
  parentNotified: boolean;
  managerApproval: string;
  notes: string;
  status: SearchStatus;
  linkedIncident: string | null;
}

/* ── constants ─────────────────────────────────────────────────────────── */

const TYPE_LABELS: Record<SearchType, string> = {
  routine: "Routine",
  intelligence_led: "Intelligence-Led",
  welfare_concern: "Welfare Concern",
  missing_return: "Missing Return",
  safeguarding: "Safeguarding",
  requested: "Requested",
};

const TYPE_COLOUR: Record<SearchType, string> = {
  routine:         "bg-gray-100 text-gray-700",
  intelligence_led:"bg-amber-100 text-amber-700",
  welfare_concern: "bg-red-100 text-red-700",
  missing_return:  "bg-purple-100 text-purple-700",
  safeguarding:    "bg-red-100 text-red-700",
  requested:       "bg-blue-100 text-blue-700",
};

const STATUS_META: Record<SearchStatus, { label: string; colour: string }> = {
  completed:          { label: "Completed",          colour: "bg-green-100 text-green-700" },
  follow_up_required: { label: "Follow-Up Required", colour: "bg-amber-100 text-amber-700" },
  escalated:          { label: "Escalated",           colour: "bg-red-100 text-red-700" },
  closed:             { label: "Closed",              colour: "bg-gray-100 text-gray-700" },
};

const DISTRESS_META: Record<DistressLevel, { label: string; colour: string }> = {
  none:        { label: "None",        colour: "text-green-600 bg-green-50" },
  mild:        { label: "Mild",        colour: "text-yellow-600 bg-yellow-50" },
  moderate:    { label: "Moderate",    colour: "text-amber-600 bg-amber-50" },
  significant: { label: "Significant", colour: "text-red-600 bg-red-50" },
};

const ACTION_STATUS_META: Record<ActionStatus, { label: string; colour: string }> = {
  pending:     { label: "Pending",     colour: "bg-amber-100 text-amber-700" },
  in_progress: { label: "In Progress", colour: "bg-blue-100 text-blue-700" },
  completed:   { label: "Completed",   colour: "bg-green-100 text-green-700" },
};

const AREA_OPTIONS = [
  "Wardrobe", "Under bed", "Drawers", "Desk", "Bathroom cabinet",
  "Bookshelf", "Window sill", "Behind furniture", "Mattress", "Bags",
];

/* ── seed data ─────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const SEED: RoomSearch[] = [
  {
    id: "rs1",
    youngPersonId: "yp_alex",
    date: d(-14),
    time: "10:30",
    searchType: "routine",
    reason: "Scheduled fortnightly routine room search as per home policy. No specific concerns — standard welfare and safety check.",
    conductedBy: "staff_anna",
    witnessedBy: "staff_ryan",
    childPresent: true,
    childInformed: true,
    areasSearched: ["Wardrobe", "Under bed", "Drawers", "Desk", "Bathroom cabinet"],
    itemsFound: [],
    nothingFound: true,
    childResponse: "Alex was cooperative throughout the search. Understood it was routine and asked if he could tidy his drawers afterwards. Positive interaction.",
    childDistressLevel: "none",
    followUpRequired: false,
    followUpActions: [],
    socialWorkerNotified: false,
    parentNotified: false,
    managerApproval: "staff_darren",
    notes: "Room was tidy and well-maintained. No concerns identified. Alex engaged positively with the process.",
    status: "completed",
    linkedIncident: null,
  },
  {
    id: "rs2",
    youngPersonId: "yp_jordan",
    date: d(-7),
    time: "16:45",
    searchType: "intelligence_led",
    reason: "Intelligence received from school pastoral team that Jordan may have acquired a vape device. Staff observed sweet-smelling residue in bathroom. Search authorised by RM.",
    conductedBy: "staff_edward",
    witnessedBy: "staff_darren",
    childPresent: true,
    childInformed: true,
    areasSearched: ["Wardrobe", "Drawers", "Desk", "Bags", "Bathroom cabinet", "Under bed"],
    itemsFound: [
      {
        item: "Disposable vape pen",
        description: "Elf Bar brand disposable vape pen (mango flavour), approximately half-used. Found concealed inside a rolled-up sock in the bottom drawer.",
        actionTaken: "Item confiscated and placed in secure storage. Jordan informed this is a prohibited item under house rules and that possession by under-18s is illegal.",
        retained: true,
        photoTaken: true,
      },
    ],
    nothingFound: false,
    childResponse: "Jordan was initially defensive and denied ownership of the vape. Became upset when it was found. After calming down, admitted a friend gave it to him at school. Expressed worry about getting into trouble.",
    childDistressLevel: "moderate",
    followUpRequired: true,
    followUpActions: [
      { action: "Key work session with Jordan to discuss vaping risks, peer pressure, and house rules", owner: "staff_anna", dueDate: d(-5), status: "completed" },
      { action: "Update Jordan's risk assessment to include substance use (vaping)", owner: "staff_darren", dueDate: d(-3), status: "in_progress" },
    ],
    socialWorkerNotified: true,
    parentNotified: false,
    managerApproval: "staff_darren",
    notes: "Vape pen logged in confiscated items register (ref: CI-2026-012). School pastoral team informed of outcome. Jordan's social worker (Michael Osei) notified by phone same day.",
    status: "follow_up_required",
    linkedIncident: null,
  },
  {
    id: "rs3",
    youngPersonId: "yp_casey",
    date: d(-3),
    time: "19:20",
    searchType: "welfare_concern",
    reason: "Concern raised following Casey disclosing thoughts of self-harm during key work session. Staff noticed small cuts on forearm during evening routine. Welfare search authorised by RM to ensure room is safe.",
    conductedBy: "staff_darren",
    witnessedBy: "staff_chervelle",
    childPresent: true,
    childInformed: true,
    areasSearched: ["Wardrobe", "Under bed", "Drawers", "Desk", "Bathroom cabinet", "Bookshelf", "Behind furniture", "Mattress"],
    itemsFound: [
      {
        item: "Razor blade",
        description: "Single razor blade found hidden inside a hollowed-out section of a paperback book on the bookshelf. Blade showed signs of use.",
        actionTaken: "Item immediately secured by RM. Casey supported with 1:1 care. CAMHS crisis team contacted. Room made safe — all sharp items removed and catalogued.",
        retained: true,
        photoTaken: true,
      },
    ],
    nothingFound: false,
    childResponse: "Casey became very distressed when the blade was found. Cried and asked staff not to tell anyone. Chervelle provided emotional support and reassured Casey that staff care about her safety. Casey eventually agreed that keeping the blade was unsafe.",
    childDistressLevel: "significant",
    followUpRequired: true,
    followUpActions: [
      { action: "Urgent CAMHS referral for self-harm risk assessment", owner: "staff_darren", dueDate: d(-2), status: "completed" },
      { action: "Update Casey's safety plan and risk assessment with self-harm protocol", owner: "staff_chervelle", dueDate: d(-1), status: "completed" },
      { action: "Daily welfare room checks for Casey until CAMHS review completed", owner: "staff_darren", dueDate: d(4), status: "in_progress" },
    ],
    socialWorkerNotified: true,
    parentNotified: true,
    managerApproval: "staff_darren",
    notes: "Escalated to Reg 40 notification. Social worker (Fiona Brennan) informed by phone at 19:45. Mother informed at 20:10. CAMHS crisis team accepted urgent referral — appointment booked for " + d(1) + ". Casey placed on enhanced monitoring with 30-minute welfare checks overnight. Notifiable event form completed.",
    status: "escalated",
    linkedIncident: null,
  },
  {
    id: "rs4",
    youngPersonId: "yp_alex",
    date: d(-2),
    time: "23:15",
    searchType: "missing_return",
    reason: "Alex returned from a missing from care episode at 23:00 after being absent since 18:30. Standard return-home protocol requires a welfare room search to check for any prohibited or harmful items brought back.",
    conductedBy: "staff_ryan",
    witnessedBy: "staff_diane",
    childPresent: true,
    childInformed: true,
    areasSearched: ["Wardrobe", "Bags", "Drawers", "Under bed", "Desk"],
    itemsFound: [],
    nothingFound: true,
    childResponse: "Alex was tired and slightly agitated but cooperated with the search. Said he understood why it was needed. Asked to go to bed straight after. Staff allowed this after welfare check completed.",
    childDistressLevel: "mild",
    followUpRequired: false,
    followUpActions: [],
    socialWorkerNotified: false,
    parentNotified: false,
    managerApproval: "staff_darren",
    notes: "Search completed as part of missing-from-care return protocol. Nothing of concern found. Alex appeared physically well — no signs of substance use or injury. Full return interview to be completed by key worker in the morning.",
    status: "completed",
    linkedIncident: "INC-2026-0041",
  },
  {
    id: "rs5",
    youngPersonId: "yp_jordan",
    date: d(-1),
    time: "11:00",
    searchType: "routine",
    reason: "Scheduled routine room check. Jordan at school — search conducted in absence as per policy (child informed on return).",
    conductedBy: "staff_anna",
    witnessedBy: "staff_mirela",
    childPresent: false,
    childInformed: true,
    areasSearched: ["Wardrobe", "Under bed", "Drawers", "Desk", "Bathroom cabinet", "Bookshelf"],
    itemsFound: [],
    nothingFound: true,
    childResponse: "Jordan was informed of the search on return from school. Accepted it without concern and said he had nothing to hide. Positive attitude.",
    childDistressLevel: "none",
    followUpRequired: false,
    followUpActions: [],
    socialWorkerNotified: false,
    parentNotified: false,
    managerApproval: "staff_darren",
    notes: "Room tidy. No prohibited items found. No follow-up required. Jordan informed upon return from school at 15:30 — accepted positively.",
    status: "completed",
    linkedIncident: null,
  },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function RoomSearchesPage() {
  const [data] = useState<RoomSearch[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showDialog, setShowDialog] = useState(false);

  /* ── stats ───────────────────────────────────────────────────────────── */

  const stats = useMemo(() => {
    const totalSearches = data.length;
    const itemsFoundCount = data.reduce((s, r) => s + r.itemsFound.length, 0);
    const pendingFollowUps = data.reduce(
      (s, r) => s + r.followUpActions.filter((a) => a.status !== "completed").length,
      0,
    );
    const escalatedCases = data.filter((r) => r.status === "escalated").length;
    return { totalSearches, itemsFoundCount, pendingFollowUps, escalatedCases };
  }, [data]);

  /* ── overdue check ───────────────────────────────────────────────────── */

  const hasOverdue = useMemo(() => {
    const today = d(0);
    return data.some(
      (r) =>
        (r.status === "escalated" || r.status === "follow_up_required") &&
        r.followUpActions.some((a) => a.status !== "completed" && a.dueDate < today),
    );
  }, [data]);

  /* ── per-child summaries ─────────────────────────────────────────────── */

  const childSummaries = useMemo(() => {
    const map = new Map<string, { count: number; lastDate: string; itemsTotal: number; pendingActions: number }>();
    data.forEach((r) => {
      const existing = map.get(r.youngPersonId);
      const pending = r.followUpActions.filter((a) => a.status !== "completed").length;
      if (!existing) {
        map.set(r.youngPersonId, {
          count: 1,
          lastDate: r.date,
          itemsTotal: r.itemsFound.length,
          pendingActions: pending,
        });
      } else {
        existing.count += 1;
        if (r.date > existing.lastDate) existing.lastDate = r.date;
        existing.itemsTotal += r.itemsFound.length;
        existing.pendingActions += pending;
      }
    });
    return Array.from(map.entries()).map(([id, s]) => ({ id, ...s }));
  }, [data]);

  /* ── filtered + sorted ───────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterType !== "all") list = list.filter((r) => r.searchType === filterType);
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.youngPersonId).toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
        case "child":
          return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        default: // newest
          return b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
      }
    });
    return list;
  }, [data, filterType, filterStatus, search, sortBy]);

  /* ── export ──────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<RoomSearch>[] = [
    { header: "Date",              accessor: (r: RoomSearch) => r.date },
    { header: "Time",              accessor: (r: RoomSearch) => r.time },
    { header: "Young Person",      accessor: (r: RoomSearch) => getYPName(r.youngPersonId) },
    { header: "Search Type",       accessor: (r: RoomSearch) => TYPE_LABELS[r.searchType] },
    { header: "Reason",            accessor: (r: RoomSearch) => r.reason },
    { header: "Conducted By",      accessor: (r: RoomSearch) => getStaffName(r.conductedBy) },
    { header: "Witnessed By",      accessor: (r: RoomSearch) => getStaffName(r.witnessedBy) },
    { header: "Child Present",     accessor: (r: RoomSearch) => r.childPresent ? "Yes" : "No" },
    { header: "Items Found",       accessor: (r: RoomSearch) => r.nothingFound ? "None" : r.itemsFound.map((i) => i.item).join("; ") },
    { header: "Distress Level",    accessor: (r: RoomSearch) => DISTRESS_META[r.childDistressLevel].label },
    { header: "Status",            accessor: (r: RoomSearch) => STATUS_META[r.status].label },
    { header: "Notes",             accessor: (r: RoomSearch) => r.notes },
  ];

  /* ── render ──────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="Room Searches Register"
      subtitle="Records all room searches conducted in the home — routine checks, intelligence-led, welfare concerns, and safeguarding"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="room-searches" />
          <PrintButton title="Room Searches Register" />
          <Button onClick={() => setShowDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Search
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* ── summary strip ──────────────────────────────────────────────── */}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Total Searches",    v: stats.totalSearches,  icon: Search,        c: "text-blue-600" },
            { l: "Items Found",       v: stats.itemsFoundCount, icon: Eye,           c: "text-amber-600" },
            { l: "Follow-Ups Pending",v: stats.pendingFollowUps, icon: Clock,        c: stats.pendingFollowUps > 0 ? "text-amber-600" : "text-gray-400" },
            { l: "Escalated Cases",   v: stats.escalatedCases,  icon: AlertTriangle, c: stats.escalatedCases > 0 ? "text-red-600" : "text-gray-400" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* ── alert banner ───────────────────────────────────────────────── */}

        {(hasOverdue || stats.escalatedCases > 0) && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">
              {hasOverdue && (
                <><strong>Overdue follow-up actions</strong> require immediate attention. </>
              )}
              {stats.escalatedCases > 0 && (
                <><strong>{stats.escalatedCases} escalated case{stats.escalatedCases > 1 ? "s" : ""}</strong> with active safeguarding concerns.</>
              )}
            </p>
          </div>
        )}

        {/* ── per-child summary cards ────────────────────────────────────── */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {childSummaries.map((cs) => (
            <Card key={cs.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{getYPName(cs.id)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Searches:</span>{" "}
                    <span className="font-semibold">{cs.count}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last:</span>{" "}
                    <span className="font-semibold">{cs.lastDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Items found:</span>{" "}
                    <span className="font-semibold">{cs.itemsTotal}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pending:</span>{" "}
                    <span className={cn("font-semibold", cs.pendingActions > 0 ? "text-amber-600" : "text-green-600")}>
                      {cs.pendingActions > 0 ? cs.pendingActions : "None"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── filter bar ─────────────────────────────────────────────────── */}

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by child, reason, notes..."
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Search type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="child">Child Name</option>
            </select>
          </div>
        </div>

        {/* ── expandable search cards ────────────────────────────────────── */}

        {filtered.map((rs) => {
          const isOpen = expanded === rs.id;
          const today = d(0);

          return (
            <div key={rs.id} className="rounded-lg border bg-white overflow-hidden">
              {/* header */}
              <button
                onClick={() => setExpanded(isOpen ? null : rs.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-brand" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{getYPName(rs.youngPersonId)}</h3>
                      <span className="text-sm text-muted-foreground">{rs.date} at {rs.time}</span>
                      <Badge className={cn("text-xs", TYPE_COLOUR[rs.searchType])}>
                        {TYPE_LABELS[rs.searchType]}
                      </Badge>
                      <Badge className={cn("text-xs", STATUS_META[rs.status].colour)}>
                        {STATUS_META[rs.status].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Conducted by {getStaffName(rs.conductedBy)} &middot; Witnessed by {getStaffName(rs.witnessedBy)}
                    </p>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {/* expanded body */}
              {isOpen && (
                <div className="border-t p-4 space-y-4">

                  {/* conducted / witnessed / child present */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Conducted by:</span> {getStaffName(rs.conductedBy)}</div>
                    <div><span className="text-muted-foreground">Witnessed by:</span> {getStaffName(rs.witnessedBy)}</div>
                    <div><span className="text-muted-foreground">Child present:</span> {rs.childPresent ? "Yes" : "No"}</div>
                    <div><span className="text-muted-foreground">Child informed:</span> {rs.childInformed ? "Yes" : "No"}</div>
                  </div>

                  {/* reason — amber panel */}
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Reason for Search</h4>
                    <p className="text-sm text-amber-900">{rs.reason}</p>
                  </div>

                  {/* areas searched — tags */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Areas Searched</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {rs.areasSearched.map((area) => (
                        <span key={area} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* items found OR nothing found */}
                  {rs.nothingFound ? (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <p className="text-sm text-green-800 font-medium">Nothing of concern found</p>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Items Found</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-xs text-muted-foreground">
                              <th className="pb-2 pr-3">Item</th>
                              <th className="pb-2 pr-3">Description</th>
                              <th className="pb-2 pr-3">Action Taken</th>
                              <th className="pb-2 pr-3">Retained</th>
                              <th className="pb-2">Photo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rs.itemsFound.map((item, idx) => (
                              <tr key={idx} className="border-b last:border-0">
                                <td className="py-2 pr-3 font-medium whitespace-nowrap">{item.item}</td>
                                <td className="py-2 pr-3 text-xs text-muted-foreground">{item.description}</td>
                                <td className="py-2 pr-3 text-xs">{item.actionTaken}</td>
                                <td className="py-2 pr-3">
                                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                                    item.retained ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                                  )}>
                                    {item.retained ? "Yes" : "No"}
                                  </span>
                                </td>
                                <td className="py-2">
                                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                                    item.photoTaken ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                                  )}>
                                    {item.photoTaken ? "Yes" : "No"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* child response — pink panel */}
                  <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-pink-800">Child&apos;s Response</h4>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", DISTRESS_META[rs.childDistressLevel].colour)}>
                        Distress: {DISTRESS_META[rs.childDistressLevel].label}
                      </span>
                    </div>
                    <p className="text-sm text-pink-900">{rs.childResponse}</p>
                  </div>

                  {/* notifications */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Notifications</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        {rs.socialWorkerNotified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="h-4 w-4 rounded-full border-2 border-gray-300 inline-block" />
                        )}
                        <span className={rs.socialWorkerNotified ? "font-medium" : "text-muted-foreground"}>
                          Social Worker
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {rs.parentNotified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="h-4 w-4 rounded-full border-2 border-gray-300 inline-block" />
                        )}
                        <span className={rs.parentNotified ? "font-medium" : "text-muted-foreground"}>
                          Parent / Carer
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Manager ({getStaffName(rs.managerApproval)})</span>
                      </div>
                    </div>
                  </div>

                  {/* follow-up actions */}
                  {rs.followUpActions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Follow-Up Actions</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-xs text-muted-foreground">
                              <th className="pb-2 pr-3">Action</th>
                              <th className="pb-2 pr-3">Owner</th>
                              <th className="pb-2 pr-3">Due Date</th>
                              <th className="pb-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rs.followUpActions.map((fa, idx) => {
                              const overdue = fa.status !== "completed" && fa.dueDate < today;
                              return (
                                <tr key={idx} className={cn("border-b last:border-0", overdue && "bg-red-50")}>
                                  <td className="py-2 pr-3">{fa.action}</td>
                                  <td className="py-2 pr-3 whitespace-nowrap">{getStaffName(fa.owner)}</td>
                                  <td className={cn("py-2 pr-3 whitespace-nowrap", overdue && "text-red-600 font-medium")}>
                                    {fa.dueDate}
                                    {overdue && <span className="ml-1 text-xs text-red-600">(overdue)</span>}
                                  </td>
                                  <td className="py-2">
                                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ACTION_STATUS_META[fa.status].colour)}>
                                      {ACTION_STATUS_META[fa.status].label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* linked incident */}
                  {rs.linkedIncident && (
                    <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <p className="text-sm text-purple-800">
                        <span className="font-medium">Linked Incident:</span> {rs.linkedIncident}
                      </p>
                    </div>
                  )}

                  {/* notes */}
                  {rs.notes && (
                    <div className="rounded-lg bg-blue-50 p-3">
                      <h4 className="text-sm font-semibold text-blue-800 mb-1">Notes</h4>
                      <p className="text-sm text-blue-900">{rs.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">
            No room searches match your filters.
          </div>
        )}

        {/* ── regulatory note ──────────────────────────────────────────── */}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Regulation 19 / Safeguarding / Data Protection</strong> — Room searches must
          be proportionate, necessary, and conducted with respect for the child&apos;s privacy and
          dignity. Children should be informed before or immediately after a search and, where
          possible, be present. All searches require a witness. Items may only be retained where
          there is a legitimate safeguarding or welfare concern. Records must be maintained in
          accordance with GDPR and the home&apos;s privacy notice. Children have the right to
          complain about any search they consider unfair.
        </div>
      </div>

      {/* ── new room search dialog ─────────────────────────────────────── */}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Room Search</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* row 1 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Young Person</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
                    <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
                    <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Search Type</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* row 2 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Date</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Time</label>
                <Input type="time" />
              </div>
            </div>
            {/* row 3 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Conducted By</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                  <SelectContent>
                    {["staff_darren", "staff_ryan", "staff_edward", "staff_anna", "staff_chervelle", "staff_diane", "staff_lackson", "staff_mirela"].map((id) => (
                      <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Witnessed By</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select witness" /></SelectTrigger>
                  <SelectContent>
                    {["staff_darren", "staff_ryan", "staff_edward", "staff_anna", "staff_chervelle", "staff_diane", "staff_lackson", "staff_mirela"].map((id) => (
                      <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* reason */}
            <div>
              <label className="text-sm font-medium mb-1 block">Reason for Search</label>
              <Textarea placeholder="Describe the reason for this search..." rows={3} />
            </div>
            {/* checkboxes */}
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" /> Child present
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" /> Child informed
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" /> Nothing found
              </label>
            </div>
            {/* areas searched */}
            <div>
              <label className="text-sm font-medium mb-1 block">Areas Searched</label>
              <div className="flex flex-wrap gap-2">
                {AREA_OPTIONS.map((area) => (
                  <label key={area} className="flex items-center gap-1.5 text-xs">
                    <input type="checkbox" className="rounded border-gray-300" />
                    {area}
                  </label>
                ))}
              </div>
            </div>
            {/* child response */}
            <div>
              <label className="text-sm font-medium mb-1 block">Child&apos;s Response</label>
              <Textarea placeholder="How did the child respond?" rows={2} />
            </div>
            {/* distress level */}
            <div>
              <label className="text-sm font-medium mb-1 block">Distress Level</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DISTRESS_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* notifications */}
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" /> Social worker notified
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300" /> Parent notified
              </label>
            </div>
            {/* notes */}
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea placeholder="Additional notes, linked incidents, items found details..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => setShowDialog(false)}>Save Search Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
