"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
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
import { toast } from "sonner";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  Wallet, Calendar, Receipt, TrendingDown, TrendingUp,
  AlertTriangle, CheckCircle2, Clock
} from "lucide-react";
import type { PettyCashEntry, PettyCashTransactionType, PettyCashCategory } from "@/types/extended";
import { PETTY_CASH_TRANSACTION_TYPE_LABEL, PETTY_CASH_CATEGORY_LABEL } from "@/types/extended";
import { usePettyCashEntries, useCreatePettyCashEntry } from "@/hooks/use-petty-cash-entries";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Category UI metadata ────────────────────────────────────────────────────
const CATEGORY_META: Record<PettyCashCategory, { label: string; color: string }> = {
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

// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<PettyCashEntry>[] = [
  { header: "ID",            accessor: (r: PettyCashEntry) => r.id },
  { header: "Date",          accessor: (r: PettyCashEntry) => r.date },
  { header: "Type",          accessor: (r: PettyCashEntry) => PETTY_CASH_TRANSACTION_TYPE_LABEL[r.type] },
  { header: "Category",      accessor: (r: PettyCashEntry) => CATEGORY_META[r.category].label },
  { header: "Amount",        accessor: (r: PettyCashEntry) => `£${r.amount.toFixed(2)}` },
  { header: "Description",   accessor: (r: PettyCashEntry) => r.description },
  { header: "Receipt Ref",   accessor: (r: PettyCashEntry) => r.receipt_ref || "—" },
  { header: "Receipt",       accessor: (r: PettyCashEntry) => r.receipt_attached ? "Yes" : "No" },
  { header: "Young Person",  accessor: (r: PettyCashEntry) => r.child_id ? getYPName(r.child_id) : "General" },
  { header: "Authorised By", accessor: (r: PettyCashEntry) => getStaffName(r.authorised_by) },
  { header: "Recorded By",   accessor: (r: PettyCashEntry) => getStaffName(r.recorded_by) },
  { header: "Balance After", accessor: (r: PettyCashEntry) => `£${r.balance_after.toFixed(2)}` },
  { header: "Notes",         accessor: (r: PettyCashEntry) => r.notes },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function PettyCashPage() {
  const { data: res, isLoading } = usePettyCashEntries();
  const records = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tab, setTab] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const createEntry = useCreatePettyCashEntry();
  const [pcForm, setPcForm] = useState({ date: new Date().toISOString().slice(0, 10), type: "withdrawal" as PettyCashTransactionType, amount: "", category: "activities" as PettyCashCategory, description: "", receipt_ref: "", notes: "" });
  const setPC2 = (k: string, v: unknown) => setPcForm((p) => ({ ...p, [k]: v }));

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(pcForm.amount);
    if (!pcForm.description.trim()) { toast.error("Description is required."); return; }
    if (isNaN(amount) || amount <= 0) { toast.error("Valid amount is required."); return; }
    await createEntry.mutateAsync({ date: pcForm.date, type: pcForm.type, category: pcForm.category, amount, description: pcForm.description.trim(), receipt_ref: pcForm.receipt_ref.trim(), receipt_attached: false, child_id: "", authorised_by: "staff_darren", recorded_by: "staff_darren", notes: pcForm.notes.trim(), balance_after: 0, created_at: new Date().toISOString() });
    toast.success("Petty cash entry saved.");
    setPcForm({ date: new Date().toISOString().slice(0, 10), type: "withdrawal", amount: "", category: "activities", description: "", receipt_ref: "", notes: "" });
    setShowNew(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let list = [...records];
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
  }, [records, search, categoryFilter, tab, sortBy]);

  const stats = useMemo(() => {
    const currentBalance = records[0]?.balance_after || 0;
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const weekSpend = records.filter((e) => e.type === "withdrawal" && e.date >= sevenDaysAgo).reduce((a, e) => a + e.amount, 0);
    const missingReceipts = records.filter((e) => e.type === "withdrawal" && !e.receipt_attached).length;
    const totalEntries = records.length;
    return { currentBalance, weekSpend, missingReceipts, totalEntries };
  }, [records]);

  return (
    <PageShell
      title="Petty Cash"
      subtitle="Tracking all petty cash transactions — withdrawals, top-ups, and receipts"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Petty Cash" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="petty-cash" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Entry</Button>
        </div>
      }
    >
      {isLoading && <p className="text-center py-12 text-muted-foreground">Loading…</p>}

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
                          {!e.receipt_attached && e.type === "withdrawal" && <Badge variant="outline" className="text-xs text-red-600 border-red-200">No receipt</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{e.date}</span>
                          <Badge className={cn("text-xs", CATEGORY_META[e.category].color)}>{CATEGORY_META[e.category].label}</Badge>
                          {e.child_id && <span>{getYPName(e.child_id)}</span>}
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
                        <div><p className="text-muted-foreground">Authorised</p><p className="font-medium">{getStaffName(e.authorised_by)}</p></div>
                        <div><p className="text-muted-foreground">Recorded</p><p className="font-medium">{getStaffName(e.recorded_by)}</p></div>
                        <div><p className="text-muted-foreground">Receipt Ref</p><p className="font-medium">{e.receipt_ref || "—"}</p></div>
                        <div><p className="text-muted-foreground">Balance After</p><p className="font-medium">£{e.balance_after.toFixed(2)}</p></div>
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
          <form onSubmit={handleSaveEntry} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Date</label><Input type="date" value={pcForm.date} onChange={(e) => setPC2("date", e.target.value)} /></div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={pcForm.type} onValueChange={(v) => setPC2("type", v)}><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="top_up">Top-Up</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Amount (£)</label><Input type="number" step="0.01" placeholder="0.00" value={pcForm.amount} onChange={(e) => setPC2("amount", e.target.value)} /></div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={pcForm.category} onValueChange={(v) => setPC2("category", v)}><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>{Object.entries(CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Description *</label><Input placeholder="What was the purchase for?" value={pcForm.description} onChange={(e) => setPC2("description", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Receipt Reference</label><Input placeholder="Receipt number (if applicable)" value={pcForm.receipt_ref} onChange={(e) => setPC2("receipt_ref", e.target.value)} /></div>
            <div><label className="text-sm font-medium">Notes</label><Textarea placeholder="Any additional notes…" rows={2} value={pcForm.notes} onChange={(e) => setPC2("notes", e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createEntry.isPending}>{createEntry.isPending ? "Saving…" : "Save Entry"}</Button>
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
