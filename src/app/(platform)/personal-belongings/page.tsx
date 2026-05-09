"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Package,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  CheckCircle2,
  Camera,
  Loader2,
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName, YOUNG_PEOPLE } from "@/lib/seed-data";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useBelongingsRecords, useCreateBelongingsRecord } from "@/hooks/use-belongings-records";
import type { BelongingsRecord, BelongingCategory, BelongingCondition, BelongingItemStatus, BelongingItem } from "@/types/extended";
import { BELONGING_CATEGORY_LABEL, BELONGING_CONDITION_LABEL, BELONGING_ITEM_STATUS_LABEL } from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── colour maps ──────────────────────────────────────────────────────── */

const STATUS_COLOURS: Record<BelongingItemStatus, string> = {
  in_possession: "bg-green-100 text-green-800",
  in_storage: "bg-blue-100 text-blue-800",
  lost: "bg-red-100 text-red-800",
  damaged: "bg-orange-100 text-orange-800",
  returned_to_family: "bg-purple-100 text-purple-800",
  disposed: "bg-gray-100 text-gray-700",
};

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string; itemDescription: string; category: string;
  condition: string; status: string; dateLogged: string; loggedBy: string;
  estimatedValue: string; photoOnFile: string; storageLocation: string;
  lastAudit: string; nextAuditDue: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",   accessor: (r: FlatRow) => r.youngPerson },
  { header: "Item",           accessor: (r: FlatRow) => r.itemDescription },
  { header: "Category",       accessor: (r: FlatRow) => r.category },
  { header: "Condition",      accessor: (r: FlatRow) => r.condition },
  { header: "Status",         accessor: (r: FlatRow) => r.status },
  { header: "Date Logged",    accessor: (r: FlatRow) => r.dateLogged },
  { header: "Logged By",      accessor: (r: FlatRow) => r.loggedBy },
  { header: "Est. Value",     accessor: (r: FlatRow) => r.estimatedValue },
  { header: "Photo on File",  accessor: (r: FlatRow) => r.photoOnFile },
  { header: "Storage",        accessor: (r: FlatRow) => r.storageLocation },
  { header: "Last Audit",     accessor: (r: FlatRow) => r.lastAudit },
  { header: "Next Audit Due", accessor: (r: FlatRow) => r.nextAuditDue },
  { header: "Notes",          accessor: (r: FlatRow) => r.notes },
];

/* ── helpers ──────────────────────────────────────────────────────────── */

/** ISO date string N days from today */
function daysFromNow(n: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
}

/* ── component ────────────────────────────────────────────────────────── */

export default function PersonalBelongingsPage() {
  const { data: res, isLoading } = useBelongingsRecords();
  const createRecord = useCreateBelongingsRecord();
  const records: BelongingsRecord[] = res?.data ?? [];

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [pbForm, setPbForm] = useState({
    child_id: "",
    description: "",
    category: "clothing" as BelongingCategory,
    condition: "good" as BelongingCondition,
    estimated_value: "",
    storage_location: "",
    notes: "",
  });
  const setPBF = (k: keyof typeof pbForm, v: string) => setPbForm((p) => ({ ...p, [k]: v }));

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pbForm.child_id || !pbForm.description.trim()) {
      toast.error("Young person and item description are required.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const item: BelongingItem = {
      id: crypto.randomUUID(),
      description: pbForm.description.trim(),
      category: pbForm.category,
      condition: pbForm.condition,
      status: "in_possession" as BelongingItemStatus,
      date_logged: today,
      logged_by: "staff_darren",
      estimated_value: pbForm.estimated_value ? parseFloat(pbForm.estimated_value) : null,
      photo_on_file: false,
      storage_location: pbForm.storage_location,
      notes: pbForm.notes,
    };
    await createRecord.mutateAsync({
      child_id: pbForm.child_id,
      admission_date: today,
      admission_inventory_complete: false,
      admission_checked_by: "staff_darren",
      admission_witnessed_by: "",
      items: [item],
      last_audit_date: today,
      last_audit_by: "staff_darren",
      next_audit_due: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
      notes: "",
      created_at: new Date().toISOString(),
    });
    toast.success("Belonging logged.");
    setPbForm({ child_id: "", description: "", category: "clothing", condition: "good", estimated_value: "", storage_location: "", notes: "" });
    setDialogOpen(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const totalItems = records.reduce((s, r) => s + r.items.length, 0);
    const inStorage = records.reduce((s, r) => s + r.items.filter((i) => i.status === "in_storage").length, 0);
    const photosOnFile = records.reduce((s, r) => s + r.items.filter((i) => i.photo_on_file).length, 0);
    const auditsDue = records.filter((r) => r.next_audit_due <= daysFromNow(14)).length;
    return { totalItems, inStorage, photosOnFile, auditsDue };
  }, [records]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = records;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getYPName(r.child_id).toLowerCase().includes(q) ||
        r.items.some((i) => i.description.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") {
      list = list.filter((r) => r.items.some((i) => i.status === filterStatus));
    }
    const out = [...list];
    switch (sortBy) {
      case "name":    out.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id))); break;
      case "items":   out.sort((a, b) => b.items.length - a.items.length); break;
      case "audit":   out.sort((a, b) => a.next_audit_due.localeCompare(b.next_audit_due)); break;
    }
    return out;
  }, [records, search, filterStatus, sortBy]);

  /* ── export data ──────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(() =>
    records.flatMap((r) =>
      r.items.map((i) => ({
        youngPerson: getYPName(r.child_id),
        itemDescription: i.description,
        category: BELONGING_CATEGORY_LABEL[i.category],
        condition: BELONGING_CONDITION_LABEL[i.condition],
        status: BELONGING_ITEM_STATUS_LABEL[i.status],
        dateLogged: i.date_logged,
        loggedBy: getStaffName(i.logged_by),
        estimatedValue: i.estimated_value != null ? `£${i.estimated_value.toFixed(2)}` : "N/A",
        photoOnFile: i.photo_on_file ? "Yes" : "No",
        storageLocation: i.storage_location,
        lastAudit: r.last_audit_date,
        nextAuditDue: r.next_audit_due,
        notes: i.notes,
      }))
    ), [records]);

  /* ── loading state ───────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <PageShell title="Personal Belongings" subtitle="Reg 20 — Inventory and safeguarding of each child's personal property">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Personal Belongings"
      subtitle="Reg 20 — Inventory and safeguarding of each child's personal property"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Personal Belongings Register" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="personal-belongings" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Log Item
          </button>
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Items Logged", value: stats.totalItems, icon: Package, colour: "text-blue-600" },
          { label: "Items in Storage", value: stats.inStorage, icon: Package, colour: "text-purple-600" },
          { label: "Photos on File", value: stats.photosOnFile, icon: Camera, colour: "text-green-600" },
          { label: "Audits Due (14 d)", value: stats.auditsDue, icon: AlertTriangle, colour: stats.auditsDue > 0 ? "text-amber-600" : "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── alert ──────────────────────────────────────────────────── */}
      {stats.auditsDue > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Belongings Audit Due</p>
            <p className="text-sm text-amber-700">{stats.auditsDue} child record(s) have an inventory audit due within the next 14 days. Regular audits ensure items are accounted for and conditions recorded.</p>
          </div>
        </div>
      )}

      {/* ── per-child summary ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {records.map((r) => {
          const totalVal = r.items.reduce((s, i) => s + (i.estimated_value ?? 0), 0);
          const photoCount = r.items.filter((i) => i.photo_on_file).length;
          return (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
              <p className="text-xs text-gray-500 mt-1">Admitted {r.admission_date} · {r.items.length} items logged</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Est. Value:</span>{" "}
                  <span className="font-medium">£{totalVal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Photos:</span>{" "}
                  <span className="font-medium">{photoCount}/{r.items.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">In Storage:</span>{" "}
                  <span className="font-medium">{r.items.filter((i) => i.status === "in_storage").length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Next Audit:</span>{" "}
                  <span className={cn("font-medium", r.next_audit_due <= daysFromNow(14) ? "text-amber-600" : "")}>{r.next_audit_due}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs">
                {r.admission_inventory_complete
                  ? <><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /><span className="text-green-700">Admission inventory complete</span></>
                  : <><AlertTriangle className="h-3.5 w-3.5 text-red-600" /><span className="text-red-700">Admission inventory incomplete</span></>
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* ── filters ────────────────────────────────────────────────── */}
      <div id="belongings-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items or children…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(BELONGING_ITEM_STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="items">Most Items</SelectItem>
              <SelectItem value="audit">Audit Due</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((r) => {
          const open = expanded[r.id] ?? false;
          const items = filterStatus !== "all" ? r.items.filter((i) => i.status === filterStatus) : r.items;
          return (
            <div key={r.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(r.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div>
                  <h3 className="font-semibold">{getYPName(r.child_id)}</h3>
                  <p className="text-xs text-gray-500">{items.length} item(s) · Last audit {r.last_audit_date} by {getStaffName(r.last_audit_by)}</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* item table */}
                  <div className="overflow-x-auto mt-3">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-500 border-b">
                          <th className="py-2 pr-3">Item</th>
                          <th className="py-2 pr-3">Category</th>
                          <th className="py-2 pr-3">Condition</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2 pr-3">Value</th>
                          <th className="py-2 pr-3">Photo</th>
                          <th className="py-2 pr-3">Location</th>
                          <th className="py-2">Logged</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((i) => (
                          <tr key={i.id} className="border-b last:border-0">
                            <td className="py-2 pr-3 font-medium">{i.description}</td>
                            <td className="py-2 pr-3">{BELONGING_CATEGORY_LABEL[i.category]}</td>
                            <td className="py-2 pr-3">{BELONGING_CONDITION_LABEL[i.condition]}</td>
                            <td className="py-2 pr-3"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[i.status])}>{BELONGING_ITEM_STATUS_LABEL[i.status]}</span></td>
                            <td className="py-2 pr-3">{i.estimated_value != null ? `£${i.estimated_value}` : "—"}</td>
                            <td className="py-2 pr-3">{i.photo_on_file ? <Camera className="h-4 w-4 text-green-600" /> : <span className="text-gray-300">—</span>}</td>
                            <td className="py-2 pr-3 text-xs text-gray-600">{i.storage_location}</td>
                            <td className="py-2 text-xs text-gray-500">{i.date_logged}<br />{getStaffName(i.logged_by)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* notes per item */}
                  {items.filter((i) => i.notes).length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Item Notes</h4>
                      <div className="space-y-1">
                        {items.filter((i) => i.notes).map((i) => (
                          <p key={i.id} className="text-xs text-gray-600"><span className="font-medium">{i.description}:</span> {i.notes}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* admission info */}
                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Admission Inventory</h4>
                    <p className="text-sm">Checked by {getStaffName(r.admission_checked_by)}, witnessed by {getStaffName(r.admission_witnessed_by)} on {r.admission_date}.</p>
                  </div>

                  {/* child's view */}
                  {r.notes && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Child&apos;s Preferences</h4>
                      <p className="text-sm text-pink-800">{r.notes}</p>
                    </div>
                  )}

                  {/* smart link panel */}
                  <SmartLinkPanel sourceType="personal_belongings" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Reg 20 — Enjoyment &amp; Achievement:</strong> Providers must ensure each child&apos;s personal possessions are recorded on admission with an independent witness, stored safely, and audited regularly. High-value or sentimental items must be photographed and securely stored where requested. Items must not be confiscated as a sanction.
      </div>

      {/* ── dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Log Personal Belonging</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateItem} className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Young Person *</label>
              <Select value={pbForm.child_id} onValueChange={(v) => setPBF("child_id", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.first_name} {y.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Item Description *</label>
              <input required className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Blue backpack with school supplies" value={pbForm.description} onChange={(e) => setPBF("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={pbForm.category} onValueChange={(v) => setPBF("category", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(BELONGING_CATEGORY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Condition</label>
                <Select value={pbForm.condition} onValueChange={(v) => setPBF("condition", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(BELONGING_CONDITION_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Estimated Value (£)</label>
                <input type="number" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="0.00" value={pbForm.estimated_value} onChange={(e) => setPBF("estimated_value", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Storage Location</label>
                <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. YP's room" value={pbForm.storage_location} onChange={(e) => setPBF("storage_location", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea rows={2} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Any additional details…" value={pbForm.notes} onChange={(e) => setPBF("notes", e.target.value)} />
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
              <button type="submit" disabled={createRecord.isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{createRecord.isPending ? "Saving…" : "Save Item"}</button>
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
