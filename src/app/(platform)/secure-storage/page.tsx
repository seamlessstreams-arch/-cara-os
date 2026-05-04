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
} from "lucide-react";
import { PageShell }    from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type ItemCategory = "medication" | "documentation" | "valuables" | "keys" | "hazardous" | "electronics" | "confidential" | "cash" | "other";
type StorageLocation = "office_safe" | "medication_cabinet" | "key_safe" | "filing_cabinet" | "secure_room" | "manager_office" | "staff_room_locker";
type AccessLevel = "rm_only" | "seniors" | "all_staff" | "designated";

interface AccessLog {
  id: string;
  date: string;
  time: string;
  accessedBy: string;
  action: "retrieved" | "returned" | "added" | "checked" | "removed";
  reason: string;
  witnessedBy: string | null;
}

interface SecureItem {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  location: StorageLocation;
  accessLevel: AccessLevel;
  owner: string;
  addedDate: string;
  addedBy: string;
  lastChecked: string;
  nextCheckDue: string;
  status: "stored" | "in_use" | "removed" | "disposed";
  notes: string;
  accessLog: AccessLog[];
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: SecureItem[] = [
  {
    id: "ss1", name: "Controlled Medication — Alex",
    category: "medication", description: "Methylphenidate 10mg (56 tablets). Batch: MH-2025-441. Expires 2026-03.",
    location: "medication_cabinet", accessLevel: "seniors",
    owner: "Alex Thompson", addedDate: d(-90), addedBy: "staff_anna",
    lastChecked: d(-1), nextCheckDue: d(6), status: "stored",
    notes: "Double-locked cabinet. Count verified daily. Current count: 42 tablets.",
    accessLog: [
      { id: "al1", date: d(-1), time: "08:15", accessedBy: "staff_anna", action: "retrieved", reason: "Morning medication administration — 1 tablet", witnessedBy: "staff_edward" },
      { id: "al2", date: d(-1), time: "08:20", accessedBy: "staff_anna", action: "returned", reason: "Medication secured after admin. Count 42.", witnessedBy: "staff_edward" },
      { id: "al3", date: d(-2), time: "08:10", accessedBy: "staff_chervelle", action: "retrieved", reason: "Morning medication administration — 1 tablet", witnessedBy: "staff_diane" },
      { id: "al4", date: d(-2), time: "08:15", accessedBy: "staff_chervelle", action: "returned", reason: "Medication secured. Count 43.", witnessedBy: "staff_diane" },
      { id: "al5", date: d(-7), time: "10:00", accessedBy: "staff_darren", action: "checked", reason: "Weekly controlled drug stock check. Count 49. All correct.", witnessedBy: "staff_ryan" },
    ],
  },
  {
    id: "ss2", name: "Passports & Birth Certificates",
    category: "documentation", description: "Passports and certified birth certificates for all 3 young people. Stored in fireproof envelope.",
    location: "office_safe", accessLevel: "rm_only",
    owner: "Oak House", addedDate: d(-180), addedBy: "staff_darren",
    lastChecked: d(-14), nextCheckDue: d(16), status: "stored",
    notes: "Alex passport expires 2028-06. Jordan — no passport, birth cert only. Casey passport expires 2027-11. All documents photographed for backup.",
    accessLog: [
      { id: "al6", date: d(-14), time: "14:00", accessedBy: "staff_darren", action: "checked", reason: "Monthly document check — all 3 sets present and in good condition.", witnessedBy: null },
      { id: "al7", date: d(-30), time: "09:30", accessedBy: "staff_darren", action: "retrieved", reason: "Casey's passport needed for school trip abroad application.", witnessedBy: null },
      { id: "al8", date: d(-28), time: "16:00", accessedBy: "staff_darren", action: "returned", reason: "Casey's passport returned after school copied details.", witnessedBy: null },
    ],
  },
  {
    id: "ss3", name: "Petty Cash Float",
    category: "cash", description: "£200 petty cash float in denominations. Cash box with key.",
    location: "office_safe", accessLevel: "seniors",
    owner: "Oak House", addedDate: d(-365), addedBy: "staff_darren",
    lastChecked: d(-1), nextCheckDue: d(0), status: "stored",
    notes: "Current balance: £127.50. Reconciled daily against receipt book. Float topped up weekly to £200.",
    accessLog: [
      { id: "al9", date: d(-1), time: "09:00", accessedBy: "staff_ryan", action: "retrieved", reason: "£15 withdrawn for grocery top-up. Receipt #PC-0892.", witnessedBy: "staff_edward" },
      { id: "al10", date: d(-1), time: "12:30", accessedBy: "staff_ryan", action: "returned", reason: "Cash box returned. £12.50 change + receipt. Balance now £127.50.", witnessedBy: "staff_edward" },
      { id: "al11", date: d(-1), time: "17:00", accessedBy: "staff_ryan", action: "checked", reason: "End of shift cash count. £127.50 confirmed. Receipts reconciled.", witnessedBy: "staff_diane" },
    ],
  },
  {
    id: "ss4", name: "Master Key Set",
    category: "keys", description: "Master key set for all internal doors, external doors, medication cabinet, office safe, vehicle lockbox. 8 keys total on ring.",
    location: "key_safe", accessLevel: "all_staff",
    owner: "Oak House", addedDate: d(-365), addedBy: "staff_darren",
    lastChecked: d(0), nextCheckDue: d(7), status: "stored",
    notes: "Key safe code changed monthly — last change " + d(-5) + ". Spare set held by RM in separate location. All keys numbered and logged.",
    accessLog: [
      { id: "al12", date: d(0), time: "07:00", accessedBy: "staff_edward", action: "retrieved", reason: "Shift start — master keys signed out.", witnessedBy: null },
      { id: "al13", date: d(0), time: "06:55", accessedBy: "staff_diane", action: "returned", reason: "Night shift end — master keys returned. All 8 keys present.", witnessedBy: "staff_edward" },
    ],
  },
  {
    id: "ss5", name: "CCTV Hard Drive Backup",
    category: "electronics", description: "External HDD containing CCTV footage backup (monthly rotation). Current drive covers last 30 days. Encrypted (AES-256).",
    location: "manager_office", accessLevel: "rm_only",
    owner: "Oak House", addedDate: d(-30), addedBy: "staff_darren",
    lastChecked: d(-3), nextCheckDue: d(4), status: "stored",
    notes: "Encryption key stored separately in safe. Previous month's drive stored off-site at registered office. Footage retention: 90 days per policy.",
    accessLog: [
      { id: "al14", date: d(-3), time: "10:00", accessedBy: "staff_darren", action: "checked", reason: "Verified drive integrity and encryption status. 78% capacity used.", witnessedBy: null },
      { id: "al15", date: d(-10), time: "14:30", accessedBy: "staff_darren", action: "retrieved", reason: "Police requested footage for incident review. SAR reference: MC-2025-1184.", witnessedBy: "staff_ryan" },
      { id: "al16", date: d(-10), time: "16:00", accessedBy: "staff_darren", action: "returned", reason: "Footage copied to encrypted USB for police. Drive returned to secure storage.", witnessedBy: "staff_ryan" },
    ],
  },
  {
    id: "ss6", name: "Confidential HR Files",
    category: "confidential", description: "Staff HR files including references, DBS certificates, health declarations. 9 files (1 per staff member).",
    location: "filing_cabinet", accessLevel: "rm_only",
    owner: "Oak House", addedDate: d(-365), addedBy: "staff_darren",
    lastChecked: d(-7), nextCheckDue: d(23), status: "stored",
    notes: "Cabinet is fire-rated and locked. Key held by RM only. Files reviewed annually. All staff consented to data storage.",
    accessLog: [
      { id: "al17", date: d(-7), time: "11:00", accessedBy: "staff_darren", action: "checked", reason: "Quarterly HR file audit. All 9 files present and up to date.", witnessedBy: null },
      { id: "al18", date: d(-21), time: "09:00", accessedBy: "staff_darren", action: "retrieved", reason: "Edward's file accessed for supervision — reference check update.", witnessedBy: null },
      { id: "al19", date: d(-21), time: "09:30", accessedBy: "staff_darren", action: "returned", reason: "File returned after update. New reference filed.", witnessedBy: null },
    ],
  },
  {
    id: "ss7", name: "Cleaning Chemicals Store",
    category: "hazardous", description: "COSHH-rated cleaning chemicals including bleach, industrial cleaner, oven cleaner. Stored in ventilated cabinet.",
    location: "secure_room", accessLevel: "all_staff",
    owner: "Oak House", addedDate: d(-365), addedBy: "staff_darren",
    lastChecked: d(-3), nextCheckDue: d(4), status: "stored",
    notes: "COSHH data sheets filed in folder on cabinet door. Stock level adequate. Chemical usage log maintained. YP must not access — key required.",
    accessLog: [
      { id: "al20", date: d(-3), time: "10:00", accessedBy: "staff_lackson", action: "retrieved", reason: "Cleaning supplies for weekly deep clean. Bleach x1, multi-surface x1.", witnessedBy: null },
      { id: "al21", date: d(-3), time: "14:00", accessedBy: "staff_lackson", action: "returned", reason: "Cleaning supplies returned. Bleach nearly empty — order more.", witnessedBy: null },
    ],
  },
  {
    id: "ss8", name: "Young People's Valuables",
    category: "valuables", description: "High-value personal items stored at YP's request. Alex: Nintendo Switch (£300 value). Casey: gold chain from grandmother (sentimental).",
    location: "office_safe", accessLevel: "seniors",
    owner: "Multiple YP", addedDate: d(-60), addedBy: "staff_ryan",
    lastChecked: d(-7), nextCheckDue: d(0), status: "stored",
    notes: "Items stored voluntarily at YP request (not confiscated). Each item has a property receipt signed by YP. Items can be retrieved on request during staffed hours.",
    accessLog: [
      { id: "al22", date: d(-3), time: "16:00", accessedBy: "staff_ryan", action: "retrieved", reason: "Alex requested Nintendo Switch for weekend. Signed out.", witnessedBy: "staff_anna" },
      { id: "al23", date: d(-1), time: "20:00", accessedBy: "staff_anna", action: "returned", reason: "Alex returned Nintendo Switch. Checked condition — good. Secured.", witnessedBy: "staff_edward" },
      { id: "al24", date: d(-7), time: "10:00", accessedBy: "staff_ryan", action: "checked", reason: "Weekly valuables check. Both items present and in good condition.", witnessedBy: "staff_darren" },
    ],
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const CAT_LABELS: Record<ItemCategory, string> = {
  medication: "Medication", documentation: "Documentation", valuables: "Valuables",
  keys: "Keys", hazardous: "Hazardous Substances", electronics: "Electronics",
  confidential: "Confidential Files", cash: "Cash", other: "Other",
};

const LOC_LABELS: Record<StorageLocation, string> = {
  office_safe: "Office Safe", medication_cabinet: "Medication Cabinet",
  key_safe: "Key Safe", filing_cabinet: "Filing Cabinet",
  secure_room: "Secure Room", manager_office: "Manager's Office",
  staff_room_locker: "Staff Room Locker",
};

const ACCESS_LABELS: Record<AccessLevel, string> = {
  rm_only: "RM Only", seniors: "Seniors+", all_staff: "All Staff", designated: "Designated Staff",
};

const ACCESS_COLOUR: Record<AccessLevel, string> = {
  rm_only: "bg-red-100 text-red-700", seniors: "bg-amber-100 text-amber-700",
  all_staff: "bg-green-100 text-green-700", designated: "bg-purple-100 text-purple-700",
};

const STATUS_META: Record<string, { label: string; colour: string }> = {
  stored: { label: "Stored", colour: "bg-green-100 text-green-700" },
  in_use: { label: "In Use", colour: "bg-amber-100 text-amber-700" },
  removed: { label: "Removed", colour: "bg-gray-100 text-gray-700" },
  disposed: { label: "Disposed", colour: "bg-red-100 text-red-700" },
};

const ACTION_LABELS: Record<string, string> = {
  retrieved: "Retrieved", returned: "Returned", added: "Added", checked: "Checked", removed: "Removed",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function SecureStoragePage() {
  const [data] = useState<SecureItem[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterLoc, setFilterLoc] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showDialog, setShowDialog] = useState(false);

  /* ── stats ───────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const checksDue = data.filter((i) => i.nextCheckDue <= d(0) && i.status === "stored").length;
    const totalAccess = data.reduce((s, i) => s + i.accessLog.length, 0);
    return {
      total: data.length,
      stored: data.filter((i) => i.status === "stored").length,
      checksDue,
      locations: new Set(data.map((i) => i.location)).size,
      totalAccess,
    };
  }, [data]);

  /* ── filtered ────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...data];
    if (filterCat !== "all") list = list.filter((i) => i.category === filterCat);
    if (filterLoc !== "all") list = list.filter((i) => i.location === filterLoc);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "category": return CAT_LABELS[a.category].localeCompare(CAT_LABELS[b.category]);
        case "location": return LOC_LABELS[a.location].localeCompare(LOC_LABELS[b.location]);
        case "check":    return a.nextCheckDue.localeCompare(b.nextCheckDue);
        default:         return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [data, filterCat, filterLoc, search, sortBy]);

  /* ── export ──────────────────────────────────────────────────────────── */
  const exportData = useMemo(() => data.flatMap((i) =>
    i.accessLog.map((al) => ({
      item: i.name,
      category: CAT_LABELS[i.category],
      location: LOC_LABELS[i.location],
      accessLevel: ACCESS_LABELS[i.accessLevel],
      owner: i.owner,
      status: STATUS_META[i.status].label,
      lastChecked: i.lastChecked,
      nextCheckDue: i.nextCheckDue,
      logDate: al.date,
      logTime: al.time,
      action: ACTION_LABELS[al.action],
      accessedBy: getStaffName(al.accessedBy),
      reason: al.reason,
      witness: al.witnessedBy ? getStaffName(al.witnessedBy) : "None",
    }))
  ), [data]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Item",          accessor: (r: typeof exportData[number]) => r.item },
    { header: "Category",      accessor: (r: typeof exportData[number]) => r.category },
    { header: "Location",      accessor: (r: typeof exportData[number]) => r.location },
    { header: "Access Level",  accessor: (r: typeof exportData[number]) => r.accessLevel },
    { header: "Owner",         accessor: (r: typeof exportData[number]) => r.owner },
    { header: "Status",        accessor: (r: typeof exportData[number]) => r.status },
    { header: "Last Checked",  accessor: (r: typeof exportData[number]) => r.lastChecked },
    { header: "Next Check Due",accessor: (r: typeof exportData[number]) => r.nextCheckDue },
    { header: "Log Date",      accessor: (r: typeof exportData[number]) => r.logDate },
    { header: "Log Time",      accessor: (r: typeof exportData[number]) => r.logTime },
    { header: "Action",        accessor: (r: typeof exportData[number]) => r.action },
    { header: "Accessed By",   accessor: (r: typeof exportData[number]) => r.accessedBy },
    { header: "Reason",        accessor: (r: typeof exportData[number]) => r.reason },
    { header: "Witness",       accessor: (r: typeof exportData[number]) => r.witness },
  ];

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
              {Object.entries(CAT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterLoc} onValueChange={setFilterLoc}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {Object.entries(LOC_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[item.status].colour)}>{STATUS_META[item.status].label}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ACCESS_COLOUR[item.accessLevel])}>{ACCESS_LABELS[item.accessLevel]}</span>
                    {item.nextCheckDue <= d(0) && item.status === "stored" && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Check Due</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{CAT_LABELS[item.category]} · {LOC_LABELS[item.location]} · {item.accessLog.length} access entries</p>
                </div>
              </div>
              {expanded === item.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === item.id && (
              <div className="border-t p-4 space-y-4">
                {/* details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Owner:</span> {item.owner}</div>
                  <div><span className="text-muted-foreground">Added:</span> {item.addedDate} by {getStaffName(item.addedBy)}</div>
                  <div><span className="text-muted-foreground">Last Checked:</span> {item.lastChecked}</div>
                  <div><span className="text-muted-foreground">Next Check:</span> <span className={item.nextCheckDue <= d(0) ? "text-red-600 font-medium" : ""}>{item.nextCheckDue}</span></div>
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
                        {item.accessLog.map((al) => (
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
                              )}>{ACTION_LABELS[al.action]}</span>
                            </td>
                            <td className="py-2 pr-3">{getStaffName(al.accessedBy)}</td>
                            <td className="py-2 pr-3">{al.witnessedBy ? getStaffName(al.witnessedBy) : <span className="text-muted-foreground">—</span>}</td>
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
          <div className="grid gap-3 py-2">
            <input placeholder="Item name" className="rounded border px-3 py-2 text-sm" />
            <select className="rounded border px-3 py-2 text-sm"><option value="">Category…</option>{Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <textarea placeholder="Description" rows={2} className="rounded border px-3 py-2 text-sm" />
            <select className="rounded border px-3 py-2 text-sm"><option value="">Storage location…</option>{Object.entries(LOC_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select className="rounded border px-3 py-2 text-sm"><option value="">Access level…</option>{Object.entries(ACCESS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input placeholder="Owner" className="rounded border px-3 py-2 text-sm" />
            <textarea placeholder="Notes" rows={2} className="rounded border px-3 py-2 text-sm" />
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowDialog(false)} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Add Item</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
