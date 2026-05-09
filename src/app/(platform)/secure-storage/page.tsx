"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Key,
  Loader2,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getStaffName, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useSecureStorageRecords, useCreateSecureStorageRecord } from "@/hooks/use-secure-storage-records";
import type { SecureStorageRecord, SecureStorageCategory, SecureStorageLocation, SecureStorageAccessLevel, SecureStorageItemStatus, SecureStorageAction } from "@/types/extended";
import {
  SECURE_STORAGE_CATEGORY_LABEL,
  SECURE_STORAGE_LOCATION_LABEL,
  SECURE_STORAGE_ACCESS_LEVEL_LABEL,
  SECURE_STORAGE_ITEM_STATUS_LABEL,
  SECURE_STORAGE_ACTION_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config ─────────────────────────────────────────────────────── */

const ACCESS_COLOUR: Record<SecureStorageAccessLevel, string> = {
  rm_only: "bg-red-100 text-red-700", seniors: "bg-amber-100 text-amber-700",
  all_staff: "bg-green-100 text-green-700", designated: "bg-purple-100 text-purple-700",
};

const STATUS_COLOUR: Record<SecureStorageItemStatus, string> = {
  stored: "bg-green-100 text-green-700",
  in_use: "bg-amber-100 text-amber-700",
  removed: "bg-gray-100 text-gray-700",
  disposed: "bg-red-100 text-red-700",
};

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── component ─────────────────────────────────────────────────────────── */

export default function SecureStoragePage() {
  const { data: records = [], isLoading } = useSecureStorageRecords();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterLoc, setFilterLoc] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showDialog, setShowDialog] = useState(false);

  const createItem = useCreateSecureStorageRecord();
  const [ssForm, setSsForm] = useState({ name: "", category: "documentation" as SecureStorageCategory, description: "", location: "filing_cabinet" as SecureStorageLocation, access_level: "all_staff" as SecureStorageAccessLevel, owner: "", notes: "" });
  const setSSF = (k: keyof typeof ssForm, v: string) => setSsForm((p) => ({ ...p, [k]: v }));

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssForm.name.trim()) { toast.error("Item name is required."); return; }
    const today = new Date().toISOString().slice(0, 10);
    await createItem.mutateAsync({ name: ssForm.name.trim(), category: ssForm.category, description: ssForm.description, location: ssForm.location, access_level: ssForm.access_level, owner: ssForm.owner || "staff_darren", added_date: today, added_by: "staff_darren", last_checked: today, next_check_due: d(90), status: "stored", notes: ssForm.notes, access_log: [] });
    toast.success("Item added to secure storage.");
    setSsForm({ name: "", category: "documentation", description: "", location: "filing_cabinet", access_level: "all_staff", owner: "", notes: "" });
    setShowDialog(false);
  };

  /* ── stats ───────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const checksDue = records.filter((i) => i.next_check_due <= d(0) && i.status === "stored").length;
    const totalAccess = records.reduce((s, i) => s + i.access_log.length, 0);
    return {
      total: records.length,
      stored: records.filter((i) => i.status === "stored").length,
      checksDue,
      locations: new Set(records.map((i) => i.location)).size,
      totalAccess,
    };
  }, [records]);

  /* ── filtered ────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (filterCat !== "all") list = list.filter((i) => i.category === filterCat);
    if (filterLoc !== "all") list = list.filter((i) => i.location === filterLoc);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "category": return SECURE_STORAGE_CATEGORY_LABEL[a.category].localeCompare(SECURE_STORAGE_CATEGORY_LABEL[b.category]);
        case "location": return SECURE_STORAGE_LOCATION_LABEL[a.location].localeCompare(SECURE_STORAGE_LOCATION_LABEL[b.location]);
        case "check":    return a.next_check_due.localeCompare(b.next_check_due);
        default:         return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [records, filterCat, filterLoc, search, sortBy]);

  /* ── export (flattened access log) ──────────────────────────────────── */
  const exportData = useMemo(() => records.flatMap((i) =>
    i.access_log.map((al) => ({
      item: i.name,
      category: SECURE_STORAGE_CATEGORY_LABEL[i.category],
      location: SECURE_STORAGE_LOCATION_LABEL[i.location],
      accessLevel: SECURE_STORAGE_ACCESS_LEVEL_LABEL[i.access_level],
      owner: i.owner,
      status: SECURE_STORAGE_ITEM_STATUS_LABEL[i.status],
      lastChecked: i.last_checked,
      nextCheckDue: i.next_check_due,
      logDate: al.date,
      logTime: al.time,
      action: SECURE_STORAGE_ACTION_LABEL[al.action],
      accessedBy: getStaffName(al.accessed_by),
      reason: al.reason,
      witness: al.witnessed_by ? getStaffName(al.witnessed_by) : "None",
    }))
  ), [records]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Item",          accessor: (r) => r.item },
    { header: "Category",      accessor: (r) => r.category },
    { header: "Location",      accessor: (r) => r.location },
    { header: "Access Level",  accessor: (r) => r.accessLevel },
    { header: "Owner",         accessor: (r) => r.owner },
    { header: "Status",        accessor: (r) => r.status },
    { header: "Last Checked",  accessor: (r) => r.lastChecked },
    { header: "Next Check Due",accessor: (r) => r.nextCheckDue },
    { header: "Log Date",      accessor: (r) => r.logDate },
    { header: "Log Time",      accessor: (r) => r.logTime },
    { header: "Action",        accessor: (r) => r.action },
    { header: "Accessed By",   accessor: (r) => r.accessedBy },
    { header: "Reason",        accessor: (r) => r.reason },
    { header: "Witness",       accessor: (r) => r.witness },
  ];

  if (isLoading) {
    return (
      <PageShell title="Secure Storage Log" subtitle="Controlled items register — access tracking, stock checks and audit trail">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Secure Storage Log"
      subtitle="Controlled items register — access tracking, stock checks and audit trail"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="secure-storage" />
          <PrintButton title="Secure Storage Log" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Total Items",    v: stats.total, icon: Lock, c: "text-blue-600" },
            { l: "Currently Stored", v: stats.stored, icon: CheckCircle2, c: "text-green-600" },
            { l: "Checks Due",     v: stats.checksDue, icon: stats.checksDue > 0 ? AlertTriangle : Clock, c: stats.checksDue > 0 ? "text-red-600" : "text-gray-400" },
            { l: "Locations Used", v: stats.locations, icon: Key, c: "text-purple-600" },
            { l: "Access Entries", v: stats.totalAccess, icon: Clock, c: "text-amber-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* checks due alert */}
        {stats.checksDue > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800"><strong>{stats.checksDue} item{stats.checksDue > 1 ? "s" : ""}</strong> due for stock check today or overdue.</p>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(Object.keys(SECURE_STORAGE_CATEGORY_LABEL) as SecureStorageCategory[]).map((k) => (
                <SelectItem key={k} value={k}>{SECURE_STORAGE_CATEGORY_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterLoc} onValueChange={setFilterLoc}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {(Object.keys(SECURE_STORAGE_LOCATION_LABEL) as SecureStorageLocation[]).map((k) => (
                <SelectItem key={k} value={k}>{SECURE_STORAGE_LOCATION_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="name">Item Name</option>
              <option value="category">Category</option>
              <option value="location">Location</option>
              <option value="check">Next Check</option>
            </select>
          </div>
        </div>

        {/* ── item cards ────────────────────────────────────────────────── */}
        {filtered.map((item) => (
          <div key={item.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === item.id ? null : item.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{item.name}</h3>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLOUR[item.status])}>{SECURE_STORAGE_ITEM_STATUS_LABEL[item.status]}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ACCESS_COLOUR[item.access_level])}>{SECURE_STORAGE_ACCESS_LEVEL_LABEL[item.access_level]}</span>
                    {item.next_check_due <= d(0) && item.status === "stored" && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Check Due</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{SECURE_STORAGE_CATEGORY_LABEL[item.category]} · {SECURE_STORAGE_LOCATION_LABEL[item.location]} · {item.access_log.length} access entries</p>
                </div>
              </div>
              {expanded === item.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === item.id && (
              <div className="border-t p-4 space-y-4">
                {/* details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Owner:</span> {item.owner}</div>
                  <div><span className="text-muted-foreground">Added:</span> {item.added_date} by {getStaffName(item.added_by)}</div>
                  <div><span className="text-muted-foreground">Last Checked:</span> {item.last_checked}</div>
                  <div><span className="text-muted-foreground">Next Check:</span> <span className={item.next_check_due <= d(0) ? "text-red-600 font-medium" : ""}>{item.next_check_due}</span></div>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>

                {item.notes && (
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">Notes</h4>
                    <p className="text-sm text-blue-900">{item.notes}</p>
                  </div>
                )}

                {/* access log */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Access Log</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="pb-2 pr-3">Date</th>
                          <th className="pb-2 pr-3">Time</th>
                          <th className="pb-2 pr-3">Action</th>
                          <th className="pb-2 pr-3">Staff</th>
                          <th className="pb-2 pr-3">Witness</th>
                          <th className="pb-2">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.access_log.map((al) => (
                          <tr key={al.id} className="border-b last:border-0">
                            <td className="py-2 pr-3 whitespace-nowrap">{al.date}</td>
                            <td className="py-2 pr-3">{al.time}</td>
                            <td className="py-2 pr-3">
                              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
                                al.action === "retrieved" ? "bg-amber-100 text-amber-700" :
                                al.action === "returned" ? "bg-green-100 text-green-700" :
                                al.action === "checked" ? "bg-blue-100 text-blue-700" :
                                al.action === "added" ? "bg-purple-100 text-purple-700" :
                                "bg-red-100 text-red-700"
                              )}>{SECURE_STORAGE_ACTION_LABEL[al.action]}</span>
                            </td>
                            <td className="py-2 pr-3">{getStaffName(al.accessed_by)}</td>
                            <td className="py-2 pr-3">{al.witnessed_by ? getStaffName(al.witnessed_by) : <span className="text-muted-foreground">—</span>}</td>
                            <td className="py-2 text-xs text-muted-foreground">{al.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* actions */}
                <div className="flex gap-2">
                  <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Log Access</button>
                  <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">Mark Checked</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── regulatory note ───────────────────────────────────────────── */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 25 / COSHH / Controlled Drugs</strong> — Children&apos;s homes must ensure secure storage of medication, hazardous substances, confidential documents, cash, and valuables. Access must be logged with witness verification for controlled items. Regular stock checks evidence compliance.
        </div>
      </div>

      {/* ── dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Secure Item</DialogTitle></DialogHeader>
          <form onSubmit={handleAddItem} className="grid gap-3 py-2">
            <input required placeholder="Item name *" className="rounded border px-3 py-2 text-sm" value={ssForm.name} onChange={(e) => setSSF("name", e.target.value)} />
            <select className="rounded border px-3 py-2 text-sm" value={ssForm.category} onChange={(e) => setSSF("category", e.target.value)}>
              {(Object.keys(SECURE_STORAGE_CATEGORY_LABEL) as SecureStorageCategory[]).map((k) => (
                <option key={k} value={k}>{SECURE_STORAGE_CATEGORY_LABEL[k]}</option>
              ))}
            </select>
            <textarea placeholder="Description" rows={2} className="rounded border px-3 py-2 text-sm" value={ssForm.description} onChange={(e) => setSSF("description", e.target.value)} />
            <select className="rounded border px-3 py-2 text-sm" value={ssForm.location} onChange={(e) => setSSF("location", e.target.value)}>
              {(Object.keys(SECURE_STORAGE_LOCATION_LABEL) as SecureStorageLocation[]).map((k) => (
                <option key={k} value={k}>{SECURE_STORAGE_LOCATION_LABEL[k]}</option>
              ))}
            </select>
            <select className="rounded border px-3 py-2 text-sm" value={ssForm.access_level} onChange={(e) => setSSF("access_level", e.target.value)}>
              {(Object.keys(SECURE_STORAGE_ACCESS_LEVEL_LABEL) as SecureStorageAccessLevel[]).map((k) => (
                <option key={k} value={k}>{SECURE_STORAGE_ACCESS_LEVEL_LABEL[k]}</option>
              ))}
            </select>
            <select className="rounded border px-3 py-2 text-sm" value={ssForm.owner} onChange={(e) => setSSF("owner", e.target.value)}>
              <option value="">Owner (staff)…</option>
              {STAFF.filter((s) => s.employment_status === "active").map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            <textarea placeholder="Notes" rows={2} className="rounded border px-3 py-2 text-sm" value={ssForm.notes} onChange={(e) => setSSF("notes", e.target.value)} />
            <DialogFooter>
              <button type="button" onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={createItem.isPending} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90 disabled:opacity-50">{createItem.isPending ? "Adding…" : "Add Item"}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
