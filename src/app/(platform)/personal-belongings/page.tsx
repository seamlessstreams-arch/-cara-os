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
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type ItemCategory = "clothing" | "electronics" | "furniture" | "toiletries" | "sentimental" | "documents" | "sports_equipment" | "books_media" | "jewellery" | "other";
type ItemCondition = "new" | "good" | "fair" | "poor" | "damaged";
type ItemStatus = "in_possession" | "in_storage" | "lost" | "damaged" | "returned_to_family" | "disposed";

interface BelongingItem {
  id: string;
  description: string;
  category: ItemCategory;
  condition: ItemCondition;
  status: ItemStatus;
  dateLogged: string;
  loggedBy: string;
  estimatedValue: number | null;
  photoOnFile: boolean;
  storageLocation: string;
  notes: string;
}

interface BelongingsRecord {
  id: string;
  youngPersonId: string;
  admissionDate: string;
  admissionInventoryComplete: boolean;
  admissionCheckedBy: string;
  admissionWitnessedBy: string;
  items: BelongingItem[];
  lastAuditDate: string;
  lastAuditBy: string;
  nextAuditDue: string;
  notes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const CAT_LABELS: Record<ItemCategory, string> = {
  clothing: "Clothing", electronics: "Electronics", furniture: "Furniture",
  toiletries: "Toiletries", sentimental: "Sentimental Items", documents: "Documents",
  sports_equipment: "Sports Equipment", books_media: "Books & Media",
  jewellery: "Jewellery", other: "Other",
};

const CONDITION_LABELS: Record<ItemCondition, string> = {
  new: "New", good: "Good", fair: "Fair", poor: "Poor", damaged: "Damaged",
};

const STATUS_LABELS: Record<ItemStatus, string> = {
  in_possession: "In Possession", in_storage: "In Storage", lost: "Lost",
  damaged: "Damaged", returned_to_family: "Returned to Family", disposed: "Disposed",
};

const STATUS_COLOURS: Record<ItemStatus, string> = {
  in_possession: "bg-green-100 text-green-800",
  in_storage: "bg-blue-100 text-blue-800",
  lost: "bg-red-100 text-red-800",
  damaged: "bg-orange-100 text-orange-800",
  returned_to_family: "bg-purple-100 text-purple-800",
  disposed: "bg-gray-100 text-gray-700",
};

const SEED: BelongingsRecord[] = [
  {
    id: "pb1", youngPersonId: "yp_alex", admissionDate: "2024-09-15",
    admissionInventoryComplete: true, admissionCheckedBy: "staff_darren", admissionWitnessedBy: "staff_anna",
    lastAuditDate: d(-30), lastAuditBy: "staff_anna", nextAuditDue: d(60),
    notes: "Alex prefers to keep most items in their room. Photo album stored securely at Alex's request.",
    items: [
      { id: "i1", description: "Samsung Galaxy A54 mobile phone", category: "electronics", condition: "good", status: "in_possession", dateLogged: "2024-09-15", loggedBy: "staff_darren", estimatedValue: 280, photoOnFile: true, storageLocation: "YP's room", notes: "Brought on admission. SW confirmed ownership." },
      { id: "i2", description: "PlayStation 5 console + 3 games", category: "electronics", condition: "good", status: "in_possession", dateLogged: "2024-09-15", loggedBy: "staff_darren", estimatedValue: 400, photoOnFile: true, storageLocation: "YP's room", notes: "Gift from uncle. Games: FIFA 25, Fortnite, Spider-Man 2." },
      { id: "i3", description: "Family photo album (leather bound)", category: "sentimental", condition: "fair", status: "in_storage", dateLogged: "2024-09-15", loggedBy: "staff_darren", estimatedValue: null, photoOnFile: true, storageLocation: "Secure storage – Room 3", notes: "Very precious to Alex. Stored securely at their request." },
      { id: "i4", description: "Gold chain necklace", category: "jewellery", condition: "good", status: "in_storage", dateLogged: "2024-09-15", loggedBy: "staff_darren", estimatedValue: 150, photoOnFile: true, storageLocation: "Secure storage – safe", notes: "Gift from grandmother. Alex chose to store in safe." },
      { id: "i5", description: "Nike Air Max trainers (Size 8)", category: "clothing", condition: "good", status: "in_possession", dateLogged: d(-21), loggedBy: "staff_anna", estimatedValue: 65, photoOnFile: false, storageLocation: "YP's room", notes: "New purchase from clothing allowance." },
      { id: "i6", description: "School backpack with supplies", category: "other", condition: "fair", status: "in_possession", dateLogged: "2024-09-15", loggedBy: "staff_darren", estimatedValue: 30, photoOnFile: false, storageLocation: "YP's room", notes: "" },
      { id: "i7", description: "Bicycle (blue mountain bike)", category: "sports_equipment", condition: "good", status: "in_possession", dateLogged: "2024-10-01", loggedBy: "staff_edward", estimatedValue: 200, photoOnFile: true, storageLocation: "Garden shed", notes: "Brought by social worker from previous placement." },
    ],
  },
  {
    id: "pb2", youngPersonId: "yp_jordan", admissionDate: "2024-11-20",
    admissionInventoryComplete: true, admissionCheckedBy: "staff_ryan", admissionWitnessedBy: "staff_chervelle",
    lastAuditDate: d(-14), lastAuditBy: "staff_ryan", nextAuditDue: d(76),
    notes: "Jordan arrived with very few personal items. Home has been building up possessions since admission.",
    items: [
      { id: "i8", description: "iPhone 13 (cracked screen)", category: "electronics", condition: "fair", status: "in_possession", dateLogged: "2024-11-20", loggedBy: "staff_ryan", estimatedValue: 150, photoOnFile: true, storageLocation: "YP's room", notes: "Screen cracked on arrival. SW aware." },
      { id: "i9", description: "Stuffed bear toy ('Mr Bear')", category: "sentimental", condition: "poor", status: "in_possession", dateLogged: "2024-11-20", loggedBy: "staff_ryan", estimatedValue: null, photoOnFile: true, storageLocation: "YP's room", notes: "Had since baby. Extremely important comfort item." },
      { id: "i10", description: "Art supplies box (paints, brushes, sketchbooks)", category: "other", condition: "good", status: "in_possession", dateLogged: d(-60), loggedBy: "staff_chervelle", estimatedValue: 45, photoOnFile: false, storageLocation: "YP's room", notes: "Bought to support Jordan's love of art." },
      { id: "i11", description: "Birth certificate (copy)", category: "documents", condition: "good", status: "in_storage", dateLogged: "2024-11-20", loggedBy: "staff_ryan", estimatedValue: null, photoOnFile: false, storageLocation: "Secure storage – filing cabinet", notes: "Copy held in secure records." },
      { id: "i12", description: "Skateboard", category: "sports_equipment", condition: "good", status: "damaged", dateLogged: d(-45), loggedBy: "staff_edward", estimatedValue: 55, photoOnFile: true, storageLocation: "Garden shed", notes: "Wheel broken. Replacement being sourced." },
    ],
  },
  {
    id: "pb3", youngPersonId: "yp_casey", admissionDate: "2025-01-10",
    admissionInventoryComplete: true, admissionCheckedBy: "staff_anna", admissionWitnessedBy: "staff_darren",
    lastAuditDate: d(-7), lastAuditBy: "staff_anna", nextAuditDue: d(83),
    notes: "Casey takes great care of belongings. Enjoys organising their room independently.",
    items: [
      { id: "i13", description: "iPad Air (5th gen) with case", category: "electronics", condition: "good", status: "in_possession", dateLogged: "2025-01-10", loggedBy: "staff_anna", estimatedValue: 500, photoOnFile: true, storageLocation: "YP's room", notes: "Used for education. Parental controls active." },
      { id: "i14", description: "Book collection (12 novels)", category: "books_media", condition: "good", status: "in_possession", dateLogged: "2025-01-10", loggedBy: "staff_anna", estimatedValue: 80, photoOnFile: false, storageLocation: "YP's room", notes: "Mix of Harry Potter, Percy Jackson series." },
      { id: "i15", description: "Charm bracelet (silver)", category: "jewellery", condition: "good", status: "in_possession", dateLogged: "2025-01-10", loggedBy: "staff_anna", estimatedValue: 60, photoOnFile: true, storageLocation: "YP's room", notes: "Gift from birth mum. Wears daily." },
      { id: "i16", description: "Passport", category: "documents", condition: "good", status: "in_storage", dateLogged: "2025-01-10", loggedBy: "staff_anna", estimatedValue: null, photoOnFile: false, storageLocation: "Secure storage – safe", notes: "Valid until 2030. Delegated authority for travel obtained." },
      { id: "i17", description: "Toiletries bag (personal care items)", category: "toiletries", condition: "good", status: "in_possession", dateLogged: d(-14), loggedBy: "staff_anna", estimatedValue: 25, photoOnFile: false, storageLocation: "YP's bathroom shelf", notes: "Casey chooses own products." },
      { id: "i18", description: "Lego Technic set (partially built)", category: "other", condition: "new", status: "in_possession", dateLogged: d(-5), loggedBy: "staff_edward", estimatedValue: 70, photoOnFile: false, storageLocation: "YP's room", notes: "Birthday gift from key worker." },
    ],
  },
];

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

/* ── component ────────────────────────────────────────────────────────── */

export default function PersonalBelongingsPage() {
  const [data] = useState<BelongingsRecord[]>(SEED);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const totalItems = data.reduce((s, r) => s + r.items.length, 0);
    const inStorage = data.reduce((s, r) => s + r.items.filter((i) => i.status === "in_storage").length, 0);
    const photosOnFile = data.reduce((s, r) => s + r.items.filter((i) => i.photoOnFile).length, 0);
    const auditsDue = data.filter((r) => r.nextAuditDue <= d(14)).length;
    return { totalItems, inStorage, photosOnFile, auditsDue };
  }, [data]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        getYPName(r.youngPersonId).toLowerCase().includes(q) ||
        r.items.some((i) => i.description.toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") {
      list = list.filter((r) => r.items.some((i) => i.status === filterStatus));
    }
    const out = [...list];
    switch (sortBy) {
      case "name":    out.sort((a, b) => getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId))); break;
      case "items":   out.sort((a, b) => b.items.length - a.items.length); break;
      case "audit":   out.sort((a, b) => a.nextAuditDue.localeCompare(b.nextAuditDue)); break;
    }
    return out;
  }, [data, search, filterStatus, sortBy]);

  /* ── export data ──────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(() =>
    data.flatMap((r) =>
      r.items.map((i) => ({
        youngPerson: getYPName(r.youngPersonId),
        itemDescription: i.description,
        category: CAT_LABELS[i.category],
        condition: CONDITION_LABELS[i.condition],
        status: STATUS_LABELS[i.status],
        dateLogged: i.dateLogged,
        loggedBy: getStaffName(i.loggedBy),
        estimatedValue: i.estimatedValue != null ? `£${i.estimatedValue.toFixed(2)}` : "N/A",
        photoOnFile: i.photoOnFile ? "Yes" : "No",
        storageLocation: i.storageLocation,
        lastAudit: r.lastAuditDate,
        nextAuditDue: r.nextAuditDue,
        notes: i.notes,
      }))
    ), [data]);

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
        {data.map((r) => {
          const totalVal = r.items.reduce((s, i) => s + (i.estimatedValue ?? 0), 0);
          const photoCount = r.items.filter((i) => i.photoOnFile).length;
          return (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <h3 className="font-semibold">{getYPName(r.youngPersonId)}</h3>
              <p className="text-xs text-gray-500 mt-1">Admitted {r.admissionDate} · {r.items.length} items logged</p>
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
                  <span className={cn("font-medium", r.nextAuditDue <= d(14) ? "text-amber-600" : "")}>{r.nextAuditDue}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs">
                {r.admissionInventoryComplete
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
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
                  <h3 className="font-semibold">{getYPName(r.youngPersonId)}</h3>
                  <p className="text-xs text-gray-500">{items.length} item(s) · Last audit {r.lastAuditDate} by {getStaffName(r.lastAuditBy)}</p>
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
                            <td className="py-2 pr-3">{CAT_LABELS[i.category]}</td>
                            <td className="py-2 pr-3">{CONDITION_LABELS[i.condition]}</td>
                            <td className="py-2 pr-3"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[i.status])}>{STATUS_LABELS[i.status]}</span></td>
                            <td className="py-2 pr-3">{i.estimatedValue != null ? `£${i.estimatedValue}` : "—"}</td>
                            <td className="py-2 pr-3">{i.photoOnFile ? <Camera className="h-4 w-4 text-green-600" /> : <span className="text-gray-300">—</span>}</td>
                            <td className="py-2 pr-3 text-xs text-gray-600">{i.storageLocation}</td>
                            <td className="py-2 text-xs text-gray-500">{i.dateLogged}<br />{getStaffName(i.loggedBy)}</td>
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
                    <p className="text-sm">Checked by {getStaffName(r.admissionCheckedBy)}, witnessed by {getStaffName(r.admissionWitnessedBy)} on {r.admissionDate}.</p>
                  </div>

                  {/* child's view */}
                  {r.notes && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Child&apos;s Preferences</h4>
                      <p className="text-sm text-pink-800">{r.notes}</p>
                    </div>
                  )}
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
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{["yp_alex","yp_jordan","yp_casey"].map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Item Description</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Blue backpack with school supplies" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(CAT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Condition</label>
                <Select><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{Object.entries(CONDITION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Estimated Value (£)</label>
                <input type="number" className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="text-sm font-medium">Storage Location</label>
                <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. YP's room" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea rows={2} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Any additional details…" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={() => setDialogOpen(false)} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">Save Item</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
