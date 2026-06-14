"use client";

import { useState, useMemo } from "react";
import { PageShell }    from "@/components/layout/page-shell";
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
  CheckCircle2, Clock, Eye, Loader2,
} from "lucide-react";
import { cn }                          from "@/lib/utils";
import { getStaffName, getYPName }     from "@/lib/seed-data";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useRoomSearchRecords, useCreateRoomSearchRecord } from "@/hooks/use-room-search-records";
import { toast } from "sonner";
import { YOUNG_PEOPLE } from "@/lib/seed-data";
import type { RoomSearchRecord, RoomSearchType, RoomSearchStatus, RoomSearchDistressLevel, RoomSearchActionStatus } from "@/types/extended";
import { ROOM_SEARCH_TYPE_LABEL, ROOM_SEARCH_STATUS_LABEL, ROOM_SEARCH_DISTRESS_LEVEL_LABEL, ROOM_SEARCH_ACTION_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── local config ────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const TYPE_COLOUR: Record<RoomSearchType, string> = {
  routine:         "bg-gray-100 text-gray-700",
  intelligence_led:"bg-amber-100 text-amber-700",
  welfare_concern: "bg-red-100 text-red-700",
  missing_return:  "bg-purple-100 text-purple-700",
  safeguarding:    "bg-red-100 text-red-700",
  requested:       "bg-blue-100 text-blue-700",
};

const STATUS_META: Record<RoomSearchStatus, { colour: string }> = {
  completed:          { colour: "bg-green-100 text-green-700" },
  follow_up_required: { colour: "bg-amber-100 text-amber-700" },
  escalated:          { colour: "bg-red-100 text-red-700" },
  closed:             { colour: "bg-gray-100 text-gray-700" },
};

const DISTRESS_META: Record<RoomSearchDistressLevel, { colour: string }> = {
  none:        { colour: "text-green-600 bg-green-50" },
  mild:        { colour: "text-yellow-600 bg-yellow-50" },
  moderate:    { colour: "text-amber-600 bg-amber-50" },
  significant: { colour: "text-red-600 bg-red-50" },
};

const ACTION_STATUS_META: Record<RoomSearchActionStatus, { colour: string }> = {
  pending:     { colour: "bg-amber-100 text-amber-700" },
  in_progress: { colour: "bg-blue-100 text-blue-700" },
  completed:   { colour: "bg-green-100 text-green-700" },
};

const AREA_OPTIONS = [
  "Wardrobe", "Under bed", "Drawers", "Desk", "Bathroom cabinet",
  "Bookshelf", "Window sill", "Behind furniture", "Mattress", "Bags",
];

/* ── page ────────────────────────────────────────────────────────────── */

export default function RoomSearchesPage() {
  const { data: records = [], isLoading } = useRoomSearchRecords();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showDialog, setShowDialog] = useState(false);

  const createSearch = useCreateRoomSearchRecord();
  const [rsForm, setRsForm] = useState({ child_id: "", search_type: "routine" as RoomSearchType, date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), reason: "", areas: [] as string[], child_response: "", notes: "" });
  const setRS = (k: string, v: unknown) => setRsForm((p) => ({ ...p, [k]: v }));

  const handleSaveSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsForm.child_id) { toast.error("Please select a young person."); return; }
    if (!rsForm.reason.trim()) { toast.error("Reason for search is required."); return; }
    await createSearch.mutateAsync({ child_id: rsForm.child_id, date: rsForm.date, time: rsForm.time, search_type: rsForm.search_type, reason: rsForm.reason.trim(), conducted_by: "staff_darren", witnessed_by: "", child_present: true, child_informed: true, areas_searched: rsForm.areas, items_found: [], nothing_found: true, child_response: rsForm.child_response.trim(), child_distress_level: "none", follow_up_required: false, follow_up_actions: [], social_worker_notified: false, parent_notified: false, manager_approval: "", notes: rsForm.notes.trim(), status: "completed", linked_incident: null });
    toast.success("Room search recorded.");
    setRsForm({ child_id: "", search_type: "routine", date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5), reason: "", areas: [], child_response: "", notes: "" });
    setShowDialog(false);
  };

  const stats = useMemo(() => {
    const totalSearches = records.length;
    const itemsFoundCount = records.reduce((s, r) => s + r.items_found.length, 0);
    const pendingFollowUps = records.reduce(
      (s, r) => s + r.follow_up_actions.filter((a) => a.status !== "completed").length,
      0,
    );
    const escalatedCases = records.filter((r) => r.status === "escalated").length;
    return { totalSearches, itemsFoundCount, pendingFollowUps, escalatedCases };
  }, [records]);

  const hasOverdue = useMemo(() => {
    const today = d(0);
    return records.some(
      (r) =>
        (r.status === "escalated" || r.status === "follow_up_required") &&
        r.follow_up_actions.some((a) => a.status !== "completed" && a.due_date < today),
    );
  }, [records]);

  const childSummaries = useMemo(() => {
    const map = new Map<string, { count: number; lastDate: string; itemsTotal: number; pendingActions: number }>();
    records.forEach((r) => {
      const existing = map.get(r.child_id);
      const pending = r.follow_up_actions.filter((a) => a.status !== "completed").length;
      if (!existing) {
        map.set(r.child_id, {
          count: 1,
          lastDate: r.date,
          itemsTotal: r.items_found.length,
          pendingActions: pending,
        });
      } else {
        existing.count += 1;
        if (r.date > existing.lastDate) existing.lastDate = r.date;
        existing.itemsTotal += r.items_found.length;
        existing.pendingActions += pending;
      }
    });
    return Array.from(map.entries()).map(([id, s]) => ({ id, ...s }));
  }, [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterType !== "all") list = list.filter((r) => r.search_type === filterType);
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
        case "child":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default:
          return b.date.localeCompare(a.date) || b.time.localeCompare(a.time);
      }
    });
    return list;
  }, [records, filterType, filterStatus, search, sortBy]);

  const exportCols: ExportColumn<RoomSearchRecord>[] = [
    { header: "Date",              accessor: (r) => r.date },
    { header: "Time",              accessor: (r) => r.time },
    { header: "Young Person",      accessor: (r) => getYPName(r.child_id) },
    { header: "Search Type",       accessor: (r) => ROOM_SEARCH_TYPE_LABEL[r.search_type] },
    { header: "Reason",            accessor: (r) => r.reason },
    { header: "Conducted By",      accessor: (r) => getStaffName(r.conducted_by) },
    { header: "Witnessed By",      accessor: (r) => getStaffName(r.witnessed_by) },
    { header: "Child Present",     accessor: (r) => r.child_present ? "Yes" : "No" },
    { header: "Items Found",       accessor: (r) => r.nothing_found ? "None" : r.items_found.map((i) => i.item).join("; ") },
    { header: "Distress Level",    accessor: (r) => ROOM_SEARCH_DISTRESS_LEVEL_LABEL[r.child_distress_level] },
    { header: "Status",            accessor: (r) => ROOM_SEARCH_STATUS_LABEL[r.status] },
    { header: "Notes",             accessor: (r) => r.notes },
  ];

  if (isLoading) {
    return (
      <PageShell title="Room Searches Register">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Room Searches Register"
      subtitle="Records all room searches conducted in the home — routine checks, intelligence-led, welfare concerns, and safeguarding"
      caraContext={{ pageTitle: "Room Searches Register", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="room-searches" />
          <PrintButton title="Room Searches Register" />
          <Button onClick={() => setShowDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Search
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

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
              {(Object.keys(ROOM_SEARCH_TYPE_LABEL) as RoomSearchType[]).map((k) => (
                <SelectItem key={k} value={k}>{ROOM_SEARCH_TYPE_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.keys(ROOM_SEARCH_STATUS_LABEL) as RoomSearchStatus[]).map((k) => (
                <SelectItem key={k} value={k}>{ROOM_SEARCH_STATUS_LABEL[k]}</SelectItem>
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

        {filtered.map((rs) => {
          const isOpen = expanded === rs.id;
          const today = d(0);

          return (
            <div key={rs.id} className="rounded-lg border bg-white overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : rs.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-brand" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{getYPName(rs.child_id)}</h3>
                      <span className="text-sm text-muted-foreground">{rs.date} at {rs.time}</span>
                      <Badge className={cn("text-xs", TYPE_COLOUR[rs.search_type])}>
                        {ROOM_SEARCH_TYPE_LABEL[rs.search_type]}
                      </Badge>
                      <Badge className={cn("text-xs", STATUS_META[rs.status].colour)}>
                        {ROOM_SEARCH_STATUS_LABEL[rs.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Conducted by {getStaffName(rs.conducted_by)} &middot; Witnessed by {getStaffName(rs.witnessed_by)}
                    </p>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {isOpen && (
                <div className="border-t p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Conducted by:</span> {getStaffName(rs.conducted_by)}</div>
                    <div><span className="text-muted-foreground">Witnessed by:</span> {getStaffName(rs.witnessed_by)}</div>
                    <div><span className="text-muted-foreground">Child present:</span> {rs.child_present ? "Yes" : "No"}</div>
                    <div><span className="text-muted-foreground">Child informed:</span> {rs.child_informed ? "Yes" : "No"}</div>
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Reason for Search</h4>
                    <p className="text-sm text-amber-900">{rs.reason}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Areas Searched</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {rs.areas_searched.map((area) => (
                        <span key={area} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  {rs.nothing_found ? (
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
                            {rs.items_found.map((item, idx) => (
                              <tr key={idx} className="border-b last:border-0">
                                <td className="py-2 pr-3 font-medium whitespace-nowrap">{item.item}</td>
                                <td className="py-2 pr-3 text-xs text-muted-foreground">{item.description}</td>
                                <td className="py-2 pr-3 text-xs">{item.action_taken}</td>
                                <td className="py-2 pr-3">
                                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                                    item.retained ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                                  )}>
                                    {item.retained ? "Yes" : "No"}
                                  </span>
                                </td>
                                <td className="py-2">
                                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                                    item.photo_taken ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                                  )}>
                                    {item.photo_taken ? "Yes" : "No"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-pink-800">Child&apos;s Response</h4>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", DISTRESS_META[rs.child_distress_level].colour)}>
                        Distress: {ROOM_SEARCH_DISTRESS_LEVEL_LABEL[rs.child_distress_level]}
                      </span>
                    </div>
                    <p className="text-sm text-pink-900">{rs.child_response}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Notifications</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        {rs.social_worker_notified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="h-4 w-4 rounded-full border-2 border-gray-300 inline-block" />
                        )}
                        <span className={rs.social_worker_notified ? "font-medium" : "text-muted-foreground"}>
                          Social Worker
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {rs.parent_notified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="h-4 w-4 rounded-full border-2 border-gray-300 inline-block" />
                        )}
                        <span className={rs.parent_notified ? "font-medium" : "text-muted-foreground"}>
                          Parent / Carer
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Manager ({getStaffName(rs.manager_approval)})</span>
                      </div>
                    </div>
                  </div>

                  {(rs.follow_up_actions?.length ?? 0) > 0 && (
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
                            {(rs.follow_up_actions ?? []).map((fa, idx) => {
                              const overdue = fa.status !== "completed" && fa.due_date < today;
                              return (
                                <tr key={idx} className={cn("border-b last:border-0", overdue && "bg-red-50")}>
                                  <td className="py-2 pr-3">{fa.action}</td>
                                  <td className="py-2 pr-3 whitespace-nowrap">{getStaffName(fa.owner)}</td>
                                  <td className={cn("py-2 pr-3 whitespace-nowrap", overdue && "text-red-600 font-medium")}>
                                    {fa.due_date}
                                    {overdue && <span className="ml-1 text-xs text-red-600">(overdue)</span>}
                                  </td>
                                  <td className="py-2">
                                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ACTION_STATUS_META[fa.status].colour)}>
                                      {ROOM_SEARCH_ACTION_STATUS_LABEL[fa.status]}
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

                  {rs.linked_incident && (
                    <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <p className="text-sm text-purple-800">
                        <span className="font-medium">Linked Incident:</span> {rs.linked_incident}
                      </p>
                    </div>
                  )}

                  {rs.notes && (
                    <div className="rounded-lg bg-blue-50 p-3">
                      <h4 className="text-sm font-semibold text-blue-800 mb-1">Notes</h4>
                      <p className="text-sm text-blue-900">{rs.notes}</p>
                    </div>
                  )}

                  <SmartLinkPanel sourceType="room-search" sourceId={rs.id} childId={rs.child_id} compact />
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Room Search</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSearch} className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Young Person *</label>
                <Select value={rsForm.child_id} onValueChange={(v) => setRS("child_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                  <SelectContent>
                    {YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Search Type</label>
                <Select value={rsForm.search_type} onValueChange={(v) => setRS("search_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROOM_SEARCH_TYPE_LABEL) as RoomSearchType[]).map((k) => (
                      <SelectItem key={k} value={k}>{ROOM_SEARCH_TYPE_LABEL[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Date</label>
                <Input type="date" value={rsForm.date} onChange={(e) => setRS("date", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Time</label>
                <Input type="time" value={rsForm.time} onChange={(e) => setRS("time", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason for Search *</label>
              <Textarea placeholder="Describe the reason for this search..." rows={3} value={rsForm.reason} onChange={(e) => setRS("reason", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Areas Searched</label>
              <div className="flex flex-wrap gap-2">
                {AREA_OPTIONS.map((area) => (
                  <label key={area} className="flex items-center gap-1.5 text-xs">
                    <input type="checkbox" className="rounded border-gray-300" checked={rsForm.areas.includes(area)} onChange={(e) => setRS("areas", e.target.checked ? [...rsForm.areas, area] : rsForm.areas.filter((a) => a !== area))} />
                    {area}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Child&apos;s Response</label>
              <Textarea placeholder="How did the child respond?" rows={2} value={rsForm.child_response} onChange={(e) => setRS("child_response", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea placeholder="Additional notes, linked incidents, items found details..." rows={3} value={rsForm.notes} onChange={(e) => setRS("notes", e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createSearch.isPending}>{createSearch.isPending ? "Saving…" : "Save Search Record"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Safeguarding & Behaviour"
        category={["safeguarding", "behaviour"]}
        days={90}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Room Searches Register — Reg 22 room search records, lawful search authorisation, search outcomes, safeguarding evidence, proportionality, risk evidence, Reg 45 quality evidence"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
