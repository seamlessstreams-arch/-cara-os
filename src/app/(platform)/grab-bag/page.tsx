"use client";

import { useState, useMemo } from "react";
import {
  Briefcase, Plus, Search, ArrowUpDown,
  AlertTriangle, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
interface GrabBagItem {
  name: string;
  required: boolean;
  present: boolean;
  expiryDate: string | null;
  notes: string;
}

interface GrabBag {
  id: string;
  youngPersonId: string;
  location: string;
  lastChecked: string;
  checkedBy: string;
  nextCheckDue: string;
  items: GrabBagItem[];
  overallStatus: "complete" | "incomplete" | "expired_items";
  notes: string;
}

/* ── default items per bag ──────────────────────────────────────────── */
const DEFAULT_ITEMS: Omit<GrabBagItem, "present" | "expiryDate" | "notes">[] = [
  { name: "Placement Plan (copy)", required: true },
  { name: "Care Plan (copy)", required: true },
  { name: "Risk Assessment (copy)", required: true },
  { name: "Emergency Contact Numbers", required: true },
  { name: "Medication & MAR Sheet", required: true },
  { name: "Health Passport / Summary", required: true },
  { name: "Photo of Young Person", required: true },
  { name: "Social Worker Contact Details", required: true },
  { name: "Consent Forms (copies)", required: true },
  { name: "Passport / Birth Certificate (copy)", required: false },
  { name: "Change of Clothes", required: true },
  { name: "Toiletries (basic)", required: true },
  { name: "Comfort Item Details", required: false },
  { name: "Cash (£20 emergency)", required: true },
  { name: "Torch", required: true },
  { name: "Phone Charger", required: false },
  { name: "Allergy / Dietary Info Card", required: true },
  { name: "EHCP / PEP Summary (copy)", required: false },
];

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: GrabBag[] = [
  {
    id: "gb_1", youngPersonId: "yp_alex", location: "Office — top shelf, labelled",
    lastChecked: d(-7), checkedBy: "staff_anna", nextCheckDue: d(23),
    overallStatus: "complete",
    items: DEFAULT_ITEMS.map((item) => ({
      ...item,
      present: true,
      expiryDate: item.name.includes("Medication") ? d(60) : null,
      notes: item.name === "Comfort Item Details" ? "Alex's headphones and sketchbook noted" : "",
    })),
    notes: "All items present and current. Medication re-checked after recent prescription change.",
  },
  {
    id: "gb_2", youngPersonId: "yp_jordan", location: "Office — top shelf, labelled",
    lastChecked: d(-14), checkedBy: "staff_chervelle", nextCheckDue: d(16),
    overallStatus: "expired_items",
    items: DEFAULT_ITEMS.map((item, idx) => ({
      ...item,
      present: idx !== 9, // missing passport copy
      expiryDate: item.name.includes("Care Plan") ? d(-5) : item.name.includes("Medication") ? d(45) : null,
      notes: idx === 9 ? "Passport copy requested from SW — awaiting" : item.name === "Cash" ? "£20 in sealed envelope" : "",
    })),
    notes: "Care plan copy needs updating following recent review. Passport copy still being sourced from placing authority.",
  },
  {
    id: "gb_3", youngPersonId: "yp_casey", location: "Office — top shelf, labelled",
    lastChecked: d(-3), checkedBy: "staff_mirela", nextCheckDue: d(27),
    overallStatus: "incomplete",
    items: DEFAULT_ITEMS.map((item) => ({
      ...item,
      present: item.name !== "Change of Clothes",
      expiryDate: item.name.includes("Medication") ? d(30) : null,
      notes: item.name === "Change of Clothes" ? "Casey outgrew last set — new clothes being added this week" :
             item.name === "Allergy / Dietary Info Card" ? "Updated to reflect new vegetarian preference" : "",
    })),
    notes: "Clothing needs replacing — Casey has grown. All documents current. Dietary card updated.",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function GrabBagPage() {
  const [bags, setBags] = useState<GrabBag[]>(SEED);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("nextCheck");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checkBag, setCheckBag] = useState<GrabBag | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let list = [...bags];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          getYPName(b.youngPersonId).toLowerCase().includes(q) ||
          b.notes.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "nextCheck": return a.nextCheckDue.localeCompare(b.nextCheckDue);
        case "name": return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        case "status":
          const order = { incomplete: 0, expired_items: 1, complete: 2 };
          return order[a.overallStatus] - order[b.overallStatus];
        default: return 0;
      }
    });
    return list;
  }, [bags, search, sortBy]);

  /* stats */
  const totalBags = bags.length;
  const completeBags = bags.filter((b) => b.overallStatus === "complete").length;
  const overdueChecks = bags.filter((b) => b.nextCheckDue < today).length;
  const issuesBags = bags.filter((b) => b.overallStatus !== "complete").length;

  const STATUS_COLORS: Record<string, string> = {
    complete: "bg-green-100 text-green-800",
    incomplete: "bg-red-100 text-red-800",
    expired_items: "bg-orange-100 text-orange-800",
  };
  const STATUS_LABELS: Record<string, string> = {
    complete: "Complete", incomplete: "Incomplete", expired_items: "Expired Items",
  };

  /* flatten for export */
  const exportData = useMemo(() => {
    return bags.flatMap((b) =>
      b.items.map((item) => ({ bagId: b.id, youngPersonId: b.youngPersonId, ...item, bagStatus: b.overallStatus, lastChecked: b.lastChecked, checkedBy: b.checkedBy }))
    );
  }, [bags]);

  type ExportRow = { bagId: string; youngPersonId: string; name: string; required: boolean; present: boolean; expiryDate: string | null; notes: string; bagStatus: string; lastChecked: string; checkedBy: string };

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Young Person", accessor: (r: ExportRow) => getYPName(r.youngPersonId) },
    { header: "Item", accessor: (r: ExportRow) => r.name },
    { header: "Required", accessor: (r: ExportRow) => r.required ? "Yes" : "No" },
    { header: "Present", accessor: (r: ExportRow) => r.present ? "Yes" : "No" },
    { header: "Expiry Date", accessor: (r: ExportRow) => r.expiryDate ?? "N/A" },
    { header: "Item Notes", accessor: (r: ExportRow) => r.notes },
    { header: "Bag Status", accessor: (r: ExportRow) => r.bagStatus },
    { header: "Last Checked", accessor: (r: ExportRow) => r.lastChecked },
    { header: "Checked By", accessor: (r: ExportRow) => getStaffName(r.checkedBy) },
  ];

  const handleMarkChecked = (bagId: string) => {
    setBags((prev) =>
      prev.map((b) =>
        b.id === bagId
          ? { ...b, lastChecked: today, checkedBy: "staff_darren", nextCheckDue: d(30) }
          : b
      )
    );
  };

  return (
    <PageShell
      title="Emergency Grab Bags"
      subtitle="Essential documents and supplies for each young person — ready for immediate use"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Emergency Grab Bags" />
          <ExportButton data={exportData} columns={exportCols} filename="grab-bags" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Bags", value: totalBags, icon: Briefcase, colour: "text-blue-600" },
            { label: "Complete", value: completeBags, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Issues", value: issuesBags, icon: AlertTriangle, colour: issuesBags > 0 ? "text-red-600" : "text-slate-400" },
            { label: "Checks Overdue", value: overdueChecks, icon: Clock, colour: overdueChecks > 0 ? "text-orange-600" : "text-slate-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── alerts ────────────────────────────────────────────── */}
        {issuesBags > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>{issuesBags}</strong> grab bag(s) have missing or expired items — resolve immediately.
                Grab bags must be complete and ready at all times.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search young people, notes…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nextCheck">Next Check Due</SelectItem>
                <SelectItem value="name">Young Person</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── bags ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((bag) => {
            const isExpanded = expanded === bag.id;
            const checkOverdue = bag.nextCheckDue < today;
            const missingRequired = bag.items.filter((i) => i.required && !i.present).length;
            const expiredItems = bag.items.filter((i) => i.expiryDate && i.expiryDate < today).length;
            const totalPresent = bag.items.filter((i) => i.present).length;

            return (
              <div key={bag.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : bag.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Briefcase className={cn("h-5 w-5 shrink-0",
                      bag.overallStatus === "complete" ? "text-green-600" :
                      bag.overallStatus === "expired_items" ? "text-orange-600" : "text-red-600"
                    )} />
                    <div className="min-w-0">
                      <p className="font-medium">{getYPName(bag.youngPersonId)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {bag.location} · {totalPresent}/{bag.items.length} items · Checked: {bag.lastChecked}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {checkOverdue && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Check Overdue</Badge>}
                    <Badge className={cn("text-xs", STATUS_COLORS[bag.overallStatus])}>
                      {STATUS_LABELS[bag.overallStatus]}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* meta */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Last Checked:</span> <span className="font-medium">{bag.lastChecked}</span></div>
                      <div><span className="text-muted-foreground">Checked By:</span> <span className="font-medium">{getStaffName(bag.checkedBy)}</span></div>
                      <div><span className="text-muted-foreground">Next Check:</span> <span className={cn("font-medium", checkOverdue && "text-red-600")}>{bag.nextCheckDue}{checkOverdue ? " (Overdue)" : ""}</span></div>
                      <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{bag.location}</span></div>
                    </div>

                    {/* issue summary */}
                    {(missingRequired > 0 || expiredItems > 0) && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                        <p className="text-sm font-medium text-red-800 mb-1">Issues</p>
                        {missingRequired > 0 && <p className="text-sm text-red-700">{missingRequired} required item(s) missing</p>}
                        {expiredItems > 0 && <p className="text-sm text-red-700">{expiredItems} item(s) with expired documents</p>}
                      </div>
                    )}

                    {/* item checklist */}
                    <div>
                      <p className="text-sm font-medium mb-2">Contents Checklist</p>
                      <div className="space-y-1">
                        {bag.items.map((item: GrabBagItem, idx: number) => {
                          const isExpired = item.expiryDate && item.expiryDate < today;
                          return (
                            <div key={idx} className={cn(
                              "flex items-start gap-2 rounded-lg border p-2.5 text-sm",
                              !item.present && item.required ? "bg-red-50 border-red-200" :
                              isExpired ? "bg-orange-50 border-orange-200" : "bg-white"
                            )}>
                              {item.present ? (
                                <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0", isExpired ? "text-orange-600" : "text-green-600")} />
                              ) : (
                                <XCircle className={cn("h-4 w-4 mt-0.5 shrink-0", item.required ? "text-red-600" : "text-slate-400")} />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={cn(!item.present && item.required && "font-medium text-red-800")}>
                                    {item.name}
                                  </span>
                                  {item.required && <Badge variant="outline" className="text-[10px] py-0">Required</Badge>}
                                  {isExpired && <Badge variant="outline" className="text-[10px] py-0 border-orange-300 text-orange-700">Expired</Badge>}
                                </div>
                                {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                                {item.expiryDate && <p className="text-xs text-muted-foreground">Expires: {item.expiryDate}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* notes */}
                    {bag.notes && (
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                        <p className="text-sm">{bag.notes}</p>
                      </div>
                    )}

                    {/* actions */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleMarkChecked(bag.id)}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Mark Checked
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Emergency Preparedness:</strong> Each young person must have an emergency grab bag
          containing essential documents, medication information, emergency contacts, and basic supplies.
          Bags must be checked monthly, stored securely but accessibly, and be ready for immediate use
          in the event of an emergency evacuation. Contents should be updated whenever care plans,
          risk assessments, or medication change.
        </div>
      </div>
    </PageShell>
  );
}
