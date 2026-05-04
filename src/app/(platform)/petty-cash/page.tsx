"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  Wallet, Calendar, Receipt, TrendingDown, TrendingUp,
  AlertTriangle, CheckCircle2, Clock
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type TransactionType = "withdrawal" | "top_up" | "refund";
type Category = "food" | "activities" | "transport" | "clothing" | "personal_care" | "education" | "household" | "emergency" | "other";

interface PettyCashEntry {
  id: string;
  date: string;
  type: TransactionType;
  category: Category;
  amount: number;
  description: string;
  receiptRef: string;
  receiptAttached: boolean;
  youngPersonId: string;
  authorisedBy: string;
  recordedBy: string;
  notes: string;
  balanceAfter: number;
  createdAt: string;
}

const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  food:          { label: "Food & Groceries",  color: "bg-green-100 text-green-800" },
  activities:    { label: "Activities",        color: "bg-blue-100 text-blue-800" },
  transport:     { label: "Transport",         color: "bg-purple-100 text-purple-800" },
  clothing:      { label: "Clothing",          color: "bg-pink-100 text-pink-800" },
  personal_care: { label: "Personal Care",     color: "bg-amber-100 text-amber-800" },
  education:     { label: "Education",         color: "bg-indigo-100 text-indigo-800" },
  household:     { label: "Household",         color: "bg-teal-100 text-teal-800" },
  emergency:     { label: "Emergency",         color: "bg-red-100 text-red-800" },
  other:         { label: "Other",             color: "bg-gray-100 text-gray-800" },
};

// ── Seed data ────────────────────────────────────────────────────────────────
const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: PettyCashEntry[] = [
  { id: "pc_001", date: d(0), type: "withdrawal", category: "food", amount: 24.50, description: "Weekly grocery shop — fruit, milk, bread, snacks", receiptRef: "REC-0123", receiptAttached: true, youngPersonId: "", authorisedBy: "staff_darren", recordedBy: "staff_anna", notes: "", balanceAfter: 175.50, createdAt: d(0) },
  { id: "pc_002", date: d(-1), type: "withdrawal", category: "activities", amount: 18.00, description: "Bowling trip — 3 games for Alex, Jordan, Casey", receiptRef: "REC-0122", receiptAttached: true, youngPersonId: "", authorisedBy: "staff_ryan", recordedBy: "staff_ryan", notes: "All three YP attended. Great outing.", balanceAfter: 200.00, createdAt: d(-1) },
  { id: "pc_003", date: d(-2), type: "withdrawal", category: "transport", amount: 6.80, description: "Bus fares for Jordan to football training", receiptRef: "", receiptAttached: false, youngPersonId: "yp_jordan", authorisedBy: "staff_ryan", recordedBy: "staff_chervelle", notes: "No receipt — cash fares on bus.", balanceAfter: 218.00, createdAt: d(-2) },
  { id: "pc_004", date: d(-3), type: "withdrawal", category: "personal_care", amount: 12.99, description: "Toiletries for Casey — shower gel, deodorant, hair products", receiptRef: "REC-0121", receiptAttached: true, youngPersonId: "yp_casey", authorisedBy: "staff_darren", recordedBy: "staff_chervelle", notes: "Casey chose their own products.", balanceAfter: 224.80, createdAt: d(-3) },
  { id: "pc_005", date: d(-3), type: "withdrawal", category: "food", amount: 12.50, description: "Taco night ingredients — mince, wraps, salsa, guacamole", receiptRef: "REC-0120", receiptAttached: true, youngPersonId: "", authorisedBy: "staff_ryan", recordedBy: "staff_ryan", notes: "Jordan's house meeting request.", balanceAfter: 237.79, createdAt: d(-3) },
  { id: "pc_006", date: d(-5), type: "withdrawal", category: "education", amount: 8.50, description: "Art supplies for Casey — sketchbook, coloured pencils", receiptRef: "REC-0119", receiptAttached: true, youngPersonId: "yp_casey", authorisedBy: "staff_darren", recordedBy: "staff_anna", notes: "Linked to identity work.", balanceAfter: 250.29, createdAt: d(-5) },
  { id: "pc_007", date: d(-7), type: "top_up", category: "other", amount: 200.00, description: "Weekly petty cash top-up from main account", receiptRef: "TFR-0089", receiptAttached: true, youngPersonId: "", authorisedBy: "staff_darren", recordedBy: "staff_darren", notes: "Standard weekly top-up.", balanceAfter: 258.79, createdAt: d(-7) },
  { id: "pc_008", date: d(-7), type: "withdrawal", category: "household", amount: 15.99, description: "Light bulbs, cleaning products, bin bags", receiptRef: "REC-0118", receiptAttached: true, youngPersonId: "", authorisedBy: "staff_anna", recordedBy: "staff_anna", notes: "", balanceAfter: 58.79, createdAt: d(-7) },
  { id: "pc_009", date: d(-8), type: "withdrawal", category: "clothing", amount: 25.00, description: "School shoes for Alex — old pair worn out", receiptRef: "REC-0117", receiptAttached: true, youngPersonId: "yp_alex", authorisedBy: "staff_darren", recordedBy: "staff_darren", notes: "Taken from clothing allowance budget.", balanceAfter: 74.78, createdAt: d(-8) },
  { id: "pc_010", date: d(-10), type: "withdrawal", category: "emergency", amount: 5.00, description: "Emergency taxi fare for Jordan — missed school bus", receiptRef: "", receiptAttached: false, youngPersonId: "yp_jordan", authorisedBy: "staff_anna", recordedBy: "staff_anna", notes: "Jordan overslept. Taxi used to avoid absence.", balanceAfter: 99.78, createdAt: d(-10) },
];

// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<PettyCashEntry>[] = [
  { header: "ID",            accessor: (r: PettyCashEntry) => r.id },
  { header: "Date",          accessor: (r: PettyCashEntry) => r.date },
  { header: "Type",          accessor: (r: PettyCashEntry) => r.type === "top_up" ? "Top Up" : r.type === "refund" ? "Refund" : "Withdrawal" },
  { header: "Category",      accessor: (r: PettyCashEntry) => CATEGORY_META[r.category].label },
  { header: "Amount",        accessor: (r: PettyCashEntry) => `£${r.amount.toFixed(2)}` },
  { header: "Description",   accessor: (r: PettyCashEntry) => r.description },
  { header: "Receipt Ref",   accessor: (r: PettyCashEntry) => r.receiptRef || "—" },
  { header: "Receipt",       accessor: (r: PettyCashEntry) => r.receiptAttached ? "Yes" : "No" },
  { header: "Young Person",  accessor: (r: PettyCashEntry) => r.youngPersonId ? getYPName(r.youngPersonId) : "General" },
  { header: "Authorised By", accessor: (r: PettyCashEntry) => getStaffName(r.authorisedBy) },
  { header: "Recorded By",   accessor: (r: PettyCashEntry) => getStaffName(r.recordedBy) },
  { header: "Balance After", accessor: (r: PettyCashEntry) => `£${r.balanceAfter.toFixed(2)}` },
  { header: "Notes",         accessor: (r: PettyCashEntry) => r.notes },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function PettyCashPage() {
  const [entries, setEntries] = useState<PettyCashEntry[]>(SEED);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tab, setTab] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((e) => e.description.toLowerCase().includes(s) || e.notes.toLowerCase().includes(s));
    }
    if (categoryFilter !== "all") list = list.filter((e) => e.category === categoryFilter);
    if (tab === "withdrawals") list = list.filter((e) => e.type === "withdrawal");
    if (tab === "top_ups") list = list.filter((e) => e.type === "top_up" || e.type === "refund");

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":     return b.date.localeCompare(a.date);
        case "amount":   return b.amount - a.amount;
        case "category": return CATEGORY_META[a.category].label.localeCompare(CATEGORY_META[b.category].label);
        default:         return 0;
      }
    });
    return list;
  }, [entries, search, categoryFilter, tab, sortBy]);

  const stats = useMemo(() => {
    const currentBalance = entries[0]?.balanceAfter || 0;
    const weekSpend = entries.filter((e) => e.type === "withdrawal" && e.date >= d(-7)).reduce((a, e) => a + e.amount, 0);
    const missingReceipts = entries.filter((e) => e.type === "withdrawal" && !e.receiptAttached).length;
    const totalEntries = entries.length;
    return { currentBalance, weekSpend, missingReceipts, totalEntries };
  }, [entries]);

  return (
    <PageShell
      title="Petty Cash"
      subtitle="Tracking all petty cash transactions — withdrawals, top-ups, and receipts"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Petty Cash" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="petty-cash" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Entry</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Current Balance", value: `£${stats.currentBalance.toFixed(2)}`, icon: <Wallet className="h-4 w-4" />, color: stats.currentBalance < 50 ? "text-red-600" : "text-green-600" },
            { label: "Week Spend",      value: `£${stats.weekSpend.toFixed(2)}`,      icon: <TrendingDown className="h-4 w-4" />, color: "text-blue-600" },
            { label: "Missing Receipts",value: stats.missingReceipts,                  icon: <AlertTriangle className="h-4 w-4" />, color: stats.missingReceipts > 0 ? "text-red-600" : "text-green-600" },
            { label: "Total Entries",   value: stats.totalEntries,                     icon: <Receipt className="h-4 w-4" />,       color: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {stats.currentBalance < 50 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3 flex items-center gap-2 text-sm text-red-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Petty cash balance is low (£{stats.currentBalance.toFixed(2)}). Consider arranging a top-up.</span>
            </CardContent>
          </Card>
        )}

        {stats.missingReceipts > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-3 flex items-center gap-2 text-sm text-amber-800">
              <Receipt className="h-4 w-4 flex-shrink-0" />
              <span><strong>{stats.missingReceipts}</strong> transaction{stats.missingReceipts !== 1 && "s"} missing receipts. Attach or record reasons for missing receipts.</span>
            </CardContent>
          </Card>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="top_ups">Top-Ups / Refunds</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search transactions…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No transactions match your filters.</p>}
          {filtered.map((e) => {
            const open = !!expanded[e.id];
            const isIncome = e.type === "top_up" || e.type === "refund";
            return (
              <Card key={e.id} className={cn("border-l-4", isIncome ? "border-l-green-400" : "border-l-red-400")}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggle(e.id)}>
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div className={cn("p-1.5 rounded", isIncome ? "bg-green-100" : "bg-red-100")}>
                        {isIncome ? <TrendingUp className="h-4 w-4 text-green-700" /> : <TrendingDown className="h-4 w-4 text-red-700" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-sm truncate">{e.description}</p>
                          {!e.receiptAttached && e.type === "withdrawal" && <Badge variant="outline" className="text-xs text-red-600 border-red-200">No receipt</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{e.date}</span>
                          <Badge className={cn("text-xs", CATEGORY_META[e.category].color)}>{CATEGORY_META[e.category].label}</Badge>
                          {e.youngPersonId && <span>{getYPName(e.youngPersonId)}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("font-bold", isIncome ? "text-green-700" : "text-red-700")}>
                        {isIncome ? "+" : "-"}£{e.amount.toFixed(2)}
                      </span>
                      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {open && (
                    <div className="mt-3 pt-2 border-t text-xs space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><p className="text-muted-foreground">Authorised</p><p className="font-medium">{getStaffName(e.authorisedBy)}</p></div>
                        <div><p className="text-muted-foreground">Recorded</p><p className="font-medium">{getStaffName(e.recordedBy)}</p></div>
                        <div><p className="text-muted-foreground">Receipt Ref</p><p className="font-medium">{e.receiptRef || "—"}</p></div>
                        <div><p className="text-muted-foreground">Balance After</p><p className="font-medium">£{e.balanceAfter.toFixed(2)}</p></div>
                      </div>
                      {e.notes && <p className="italic text-muted-foreground">{e.notes}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Receipt className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              All petty cash transactions must be recorded and receipts attached where possible. Withdrawals over £25 require manager authorisation. The petty cash tin must be reconciled weekly. Missing receipts must be explained and documented. Auditors may inspect petty cash records at any time.
            </span>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Petty Cash Entry</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setShowNew(false); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Date</label><Input type="date" /></div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="top_up">Top-Up</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Amount (£)</label><Input type="number" step="0.01" placeholder="0.00" /></div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{Object.entries(CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Description</label><Input placeholder="What was the purchase for?" /></div>
            <div><label className="text-sm font-medium">Receipt Reference</label><Input placeholder="Receipt number (if applicable)" /></div>
            <div><label className="text-sm font-medium">Notes</label><Textarea placeholder="Any additional notes…" rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Save Entry</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
