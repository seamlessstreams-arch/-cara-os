"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Shirt,
  Plus,
  ArrowUpDown,
  Search,
  Wallet,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell }    from "@/components/layout/page-shell";
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
import type { ClothingAllowanceRecord, ClothingPurchaseCategory, ClothingPurchase } from "@/types/extended";
import { CLOTHING_PURCHASE_CATEGORY_LABEL } from "@/types/extended";
import { useClothingAllowanceRecords, useCreateClothingAllowanceRecord } from "@/hooks/use-clothing-allowance-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── component ─────────────────────────────────────────────────────────── */

export default function ClothingAllowancesPage() {
  const { data: res, isLoading } = useClothingAllowanceRecords();
  const items = res?.data ?? [];
  const createMut = useCreateClothingAllowanceRecord();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterYP, setFilterYP] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showDialog, setShowDialog] = useState(false);

  /* form state */
  const [formChildId, setFormChildId] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formStore, setFormStore] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formChildPresent, setFormChildPresent] = useState(false);
  const [formChildChose, setFormChildChose] = useState(false);
  const [formReceiptRef, setFormReceiptRef] = useState("");

  if (isLoading) {
    return <PageShell title="Clothing & Allowances" subtitle="Individual clothing budgets, purchases and preferences — child choice and dignity"><div /></PageShell>;
  }

  const stats = (() => {
    const totalBudget = items.reduce((s, r) => s + r.quarterly_allowance, 0);
    const totalSpend = items.reduce((s, r) => s + r.quarter_spend, 0);
    const allP = items.flatMap((r) => r.purchases);
    return {
      quarterBudget: totalBudget,
      quarterSpend: totalSpend,
      remaining: totalBudget - totalSpend,
      purchases: allP.length,
      childChose: allP.filter((p) => p.child_chose).length,
    };
  })();

  const allPurchases = (() => {
    let list = items.flatMap((r) => r.purchases.map((p) => ({ ...p, child_id: r.child_id })));
    if (filterYP !== "all") list = list.filter((p) => p.child_id === filterYP);
    if (filterCat !== "all") list = list.filter((p) => p.category === filterCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.description.toLowerCase().includes(q) || p.store.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "amount": return b.amount - a.amount;
        case "category": return CLOTHING_PURCHASE_CATEGORY_LABEL[a.category].localeCompare(CLOTHING_PURCHASE_CATEGORY_LABEL[b.category]);
        default:        return b.date.localeCompare(a.date);
      }
    });
    return list;
  })();

  const exportData = items.flatMap((r) => r.purchases.map((p) => ({
    youngPerson: getYPName(r.child_id),
    date: p.date,
    category: CLOTHING_PURCHASE_CATEGORY_LABEL[p.category],
    description: p.description,
    amount: p.amount.toFixed(2),
    store: p.store,
    purchasedBy: getStaffName(p.purchased_by),
    childPresent: p.child_present ? "Yes" : "No",
    childChose: p.child_chose ? "Yes" : "No",
    receiptRef: p.receipt_ref,
    quarterBudget: r.quarterly_allowance.toFixed(2),
    quarterSpend: r.quarter_spend.toFixed(2),
    remaining: (r.quarterly_allowance - r.quarter_spend).toFixed(2),
  })));

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Young Person",   accessor: (r: typeof exportData[number]) => r.youngPerson },
    { header: "Date",           accessor: (r: typeof exportData[number]) => r.date },
    { header: "Category",       accessor: (r: typeof exportData[number]) => r.category },
    { header: "Description",    accessor: (r: typeof exportData[number]) => r.description },
    { header: "Amount",         accessor: (r: typeof exportData[number]) => r.amount },
    { header: "Store",          accessor: (r: typeof exportData[number]) => r.store },
    { header: "Purchased By",   accessor: (r: typeof exportData[number]) => r.purchasedBy },
    { header: "Child Present",  accessor: (r: typeof exportData[number]) => r.childPresent },
    { header: "Child Chose",    accessor: (r: typeof exportData[number]) => r.childChose },
    { header: "Receipt Ref",    accessor: (r: typeof exportData[number]) => r.receiptRef },
    { header: "Quarter Budget", accessor: (r: typeof exportData[number]) => r.quarterBudget },
    { header: "Quarter Spend",  accessor: (r: typeof exportData[number]) => r.quarterSpend },
    { header: "Remaining",      accessor: (r: typeof exportData[number]) => r.remaining },
  ];

  async function onSubmit() {
    try {
      await createMut.mutateAsync({
        child_id: formChildId,
        purchases: [{
          id: "",
          date: formDate,
          category: formCategory as ClothingPurchaseCategory,
          description: formDescription,
          amount: parseFloat(formAmount),
          store: formStore,
          purchased_by: "",
          child_present: formChildPresent,
          child_chose: formChildChose,
          receipt_ref: formReceiptRef,
        }],
      });
      toast.success("Purchase logged");
      setShowDialog(false);
      setFormChildId("");
      setFormCategory("");
      setFormDescription("");
      setFormAmount("");
      setFormStore("");
      setFormDate("");
      setFormChildPresent(false);
      setFormChildChose(false);
      setFormReceiptRef("");
    } catch {
      toast.error("Failed to log purchase");
    }
  }

  return (
    <PageShell
      title="Clothing & Allowances"
      subtitle="Individual clothing budgets, purchases and preferences — child choice and dignity"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="clothing-allowances" />
          <PrintButton title="Clothing & Allowances" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> Log Purchase
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Quarter Budget",  v: `£${stats.quarterBudget}`, icon: Wallet, c: "text-blue-600" },
            { l: "Quarter Spend",   v: `£${stats.quarterSpend.toFixed(2)}`, icon: TrendingUp, c: "text-amber-600" },
            { l: "Remaining",       v: `£${stats.remaining.toFixed(2)}`, icon: Wallet, c: stats.remaining > 100 ? "text-green-600" : "text-red-600" },
            { l: "Total Purchases", v: stats.purchases, icon: Shirt, c: "text-purple-600" },
            { l: "Child Chose",     v: `${Math.round((stats.childChose / stats.purchases) * 100)}%`, icon: TrendingUp, c: "text-green-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* per-child budget cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((rec) => {
            const pct = (rec.quarter_spend / rec.quarterly_allowance) * 100;
            const remaining = rec.quarterly_allowance - rec.quarter_spend;
            return (
              <div key={rec.id} className="rounded-lg border bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{getYPName(rec.child_id)}</h3>
                  <span className={cn("text-sm font-bold", remaining > 100 ? "text-green-600" : remaining > 0 ? "text-amber-600" : "text-red-600")}>
                    £{remaining.toFixed(2)} left
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={cn("h-full rounded-full", pct > 90 ? "bg-red-400" : pct > 70 ? "bg-amber-400" : "bg-green-400")} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>£{rec.quarter_spend.toFixed(2)} spent</span>
                  <span>Q{rec.current_quarter} of £{rec.quarterly_allowance}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(rec.sizes).map(([k, v]) => (
                    <span key={k} className="rounded bg-gray-100 px-2 py-0.5 text-xs">{k}: {v}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search purchases…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {items.map((r) => <SelectItem key={r.child_id} value={r.child_id}>{getYPName(r.child_id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CLOTHING_PURCHASE_CATEGORY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        {/* expandable per-child detail */}
        {items.filter((r) => filterYP === "all" || r.child_id === filterYP).map((rec) => (
          <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === rec.id ? null : rec.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <Shirt className="h-5 w-5 text-brand" />
                <div className="text-left">
                  <h3 className="font-semibold">{getYPName(rec.child_id)}</h3>
                  <p className="text-xs text-muted-foreground">{rec.purchases.length} purchases · £{rec.quarter_spend.toFixed(2)}/£{rec.quarterly_allowance} this quarter · {rec.financial_year}</p>
                </div>
              </div>
              {expanded === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === rec.id && (
              <div className="border-t p-4 space-y-4">
                {/* purchases table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-3">Date</th>
                        <th className="pb-2 pr-3">Category</th>
                        <th className="pb-2 pr-3">Description</th>
                        <th className="pb-2 pr-3">Amount</th>
                        <th className="pb-2 pr-3">Store</th>
                        <th className="pb-2 pr-3">Staff</th>
                        <th className="pb-2 pr-3">Child Chose</th>
                        <th className="pb-2">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rec.purchases.map((p) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="py-2 pr-3 whitespace-nowrap">{p.date}</td>
                          <td className="py-2 pr-3">{CLOTHING_PURCHASE_CATEGORY_LABEL[p.category]}</td>
                          <td className="py-2 pr-3">{p.description}</td>
                          <td className="py-2 pr-3 font-medium">£{p.amount.toFixed(2)}</td>
                          <td className="py-2 pr-3">{p.store}</td>
                          <td className="py-2 pr-3">{getStaffName(p.purchased_by)}</td>
                          <td className="py-2 pr-3">{p.child_chose ? <span className="text-green-600">Yes</span> : <span className="text-muted-foreground">No</span>}</td>
                          <td className="py-2 text-xs text-muted-foreground">{p.receipt_ref}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* preferences */}
                <div className="rounded-lg bg-pink-50 p-3">
                  <h4 className="text-sm font-semibold text-pink-800 mb-1">Preferences & Choices</h4>
                  <ul className="list-disc list-inside text-sm text-pink-900">{rec.preferences.map((p, i) => <li key={i}>{p}</li>)}</ul>
                </div>

                {rec.notes && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h4 className="text-sm font-semibold mb-1">Staff Notes</h4>
                    <p className="text-sm text-muted-foreground">{rec.notes}</p>
                  </div>
                )}

                <SmartLinkPanel sourceType="clothing-allowance" sourceId={rec.id} childId={rec.child_id} compact />
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 20 — Contact &amp; access to possessions</strong> — Children must be provided with appropriate clothing and personal possessions. The child should be involved in choosing their own clothing where appropriate, reflecting their identity, preferences, and dignity. Budgets should be transparent and receipts maintained.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Clothing Purchase</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <select value={formChildId} onChange={(e) => setFormChildId(e.target.value)} className="rounded border px-3 py-2 text-sm"><option value="">Young Person…</option>{items.map((r) => <option key={r.child_id} value={r.child_id}>{getYPName(r.child_id)}</option>)}</select>
            <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="rounded border px-3 py-2 text-sm"><option value="">Category…</option>{Object.entries(CLOTHING_PURCHASE_CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Description" className="rounded border px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input value={formAmount} onChange={(e) => setFormAmount(e.target.value)} type="number" step="0.01" placeholder="Amount (£)" className="rounded border px-3 py-2 text-sm" />
              <input value={formStore} onChange={(e) => setFormStore(e.target.value)} placeholder="Store" className="rounded border px-3 py-2 text-sm" />
            </div>
            <input value={formDate} onChange={(e) => setFormDate(e.target.value)} type="date" className="rounded border px-3 py-2 text-sm" />
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={formChildPresent} onChange={(e) => setFormChildPresent(e.target.checked)} className="rounded border" /> Child was present</label>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={formChildChose} onChange={(e) => setFormChildChose(e.target.checked)} className="rounded border" /> Child chose item</label>
            </div>
            <input value={formReceiptRef} onChange={(e) => setFormReceiptRef(e.target.value)} placeholder="Receipt reference" className="rounded border px-3 py-2 text-sm" />
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={onSubmit} disabled={createMut.isPending} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">
              {createMut.isPending ? "Saving…" : "Log Purchase"}
            </button>
          </DialogFooter>
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
