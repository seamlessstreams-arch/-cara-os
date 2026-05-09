"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POCKET MONEY & SAVINGS
// Tracks pocket money allowances, spending, savings, and receipts for each
// young person. Required under Children's Homes Regulations 2015 (Reg 37)
// and Schedule 3 — the home must keep a record of money managed on behalf
// of each child, including income, spending, and balances.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { usePocketMoneyTransactions, useCreatePocketMoneyTransaction } from "@/hooks/use-pocket-money-transactions";
import type { PocketMoneyTransaction, PocketMoneyTransactionType } from "@/types/extended";
import {
  Wallet, Search, Filter, ArrowUpDown, X, Plus,
  TrendingUp, TrendingDown, PiggyBank, Receipt,
  Calendar, User, ChevronDown, ChevronUp,
  ShoppingBag, Banknote, ArrowDownLeft, ArrowUpRight,
  Loader2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Helpers ───────────────────────────────────────────────────────────────────

function isIncome(t: PocketMoneyTransactionType): boolean {
  return t === "allowance" || t === "gift" || t === "earnings" || t === "refund" || t === "savings_withdrawal";
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<PocketMoneyTransactionType, { label: string; icon: React.ElementType; color: string; bg: string; border: string; direction: "in" | "out" }> = {
  allowance:           { label: "Allowance",        icon: Banknote,       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", direction: "in"  },
  spending:            { label: "Spending",          icon: ShoppingBag,    color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     direction: "out" },
  savings_deposit:     { label: "Savings In",        icon: PiggyBank,      color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    direction: "out" },
  savings_withdrawal:  { label: "Savings Out",       icon: PiggyBank,      color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   direction: "in"  },
  gift:                { label: "Gift",              icon: ArrowDownLeft,  color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200",  direction: "in"  },
  earnings:            { label: "Earnings",          icon: TrendingUp,     color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200",    direction: "in"  },
  refund:              { label: "Refund",            icon: ArrowDownLeft,  color: "text-sky-700",     bg: "bg-sky-50",     border: "border-sky-200",     direction: "in"  },
};

const CATEGORY_LABELS: Record<string, string> = {
  allowance: "Allowance", food: "Food & Drink", personal: "Personal Items", activities: "Activities",
  transport: "Transport", education: "Education", creative: "Creative", savings: "Savings",
  gift: "Gift", earnings: "Earnings", clothing: "Clothing", hygiene: "Hygiene", other: "Other",
};

// ── Export Columns ────────────────────────────────────────────────────────────

const PM_EXPORT_COLS: ExportColumn<PocketMoneyTransaction>[] = [
  { header: "Date",         accessor: (r) => r.date },
  { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
  { header: "Type",         accessor: (r) => TYPE_CONFIG[r.type]?.label ?? r.type },
  { header: "Amount",       accessor: (r) => `£${r.amount.toFixed(2)}` },
  { header: "Direction",    accessor: (r) => isIncome(r.type) ? "In" : "Out" },
  { header: "Description",  accessor: (r) => r.description },
  { header: "Category",     accessor: (r) => CATEGORY_LABELS[r.category] ?? r.category },
  { header: "Receipt Held", accessor: (r) => r.receipt_held ? "Yes" : "No" },
  { header: "Approved By",  accessor: (r) => getStaffName(r.approved_by) },
  { header: "Notes",        accessor: (r) => r.notes ?? "" },
];

// ── Transaction Row ──────────────────────────────────────────────────────────

function TransactionRow({ tx }: { tx: PocketMoneyTransaction }) {
  const [expanded, setExpanded] = useState(false);
  const tc = TYPE_CONFIG[tx.type];
  const TxIcon = tc.icon;
  const income = isIncome(tx.type);

  return (
    <div className="rounded-lg border bg-white transition-all hover:shadow-sm">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn("rounded-md p-1.5 border flex-shrink-0", tc.bg, tc.border)}>
          <TxIcon className={cn("h-3.5 w-3.5", tc.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-semibold text-slate-900">{tx.description}</span>
            {tx.receipt_held && (
              <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[9px] px-1.5 py-0">
                <Receipt className="h-2.5 w-2.5 mr-0.5" /> Receipt
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>{getYPName(tx.child_id)}</span>
            <span>·</span>
            <span>{formatDate(tx.date)}</span>
            <span>·</span>
            <Badge className={cn("text-[9px] px-1.5 py-0 border", tc.bg, tc.color, tc.border)}>
              {tc.label}
            </Badge>
          </div>
        </div>

        <div className={cn("text-sm font-bold tabular-nums flex-shrink-0", income ? "text-emerald-600" : "text-red-600")}>
          {income ? "+" : "−"}£{tx.amount.toFixed(2)}
        </div>

        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
      </div>

      {expanded && (
        <div className="border-t px-3 pb-3 pt-2 space-y-2">
          <div className="text-[10px] text-slate-400 flex items-center gap-4">
            <span>Category: {CATEGORY_LABELS[tx.category] ?? tx.category}</span>
            <span>Approved by: {getStaffName(tx.approved_by)}</span>
            {tx.notes && <span className="text-slate-600 italic">{tx.notes}</span>}
          </div>
          <SmartLinkPanel sourceType="pocket_money_transaction" sourceId={tx.id} childId={tx.child_id} compact />
        </div>
      )}
    </div>
  );
}

// ── New Transaction Dialog ───────────────────────────────────────────────────

function NewTransactionDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (tx: Partial<PocketMoneyTransaction>) => void;
}) {
  const { currentUser } = useAuthContext();
  const [childId, setChildId] = useState("yp_alex");
  const [type, setType] = useState<PocketMoneyTransactionType>("spending");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [receiptHeld, setReceiptHeld] = useState(false);
  const [notes, setNotes] = useState("");

  function handleSubmit() {
    if (!amount || !description.trim()) return;
    const tx: Partial<PocketMoneyTransaction> = {
      child_id: childId,
      date: todayStr(),
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      category,
      receipt_held: receiptHeld,
      approved_by: currentUser?.id ?? "staff_darren",
      notes: notes.trim() || null,
    };
    onSubmit(tx);
    onClose();
    setAmount(""); setDescription(""); setNotes(""); setReceiptHeld(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-emerald-600" />
            Record Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Young Person</label>
              <Select value={childId} onValueChange={setChildId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
                  <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
                  <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Type</label>
              <Select value={type} onValueChange={(v) => setType(v as PocketMoneyTransactionType)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_CONFIG) as PocketMoneyTransactionType[]).map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_CONFIG[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Amount (£) *</label>
              <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Description *</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was the money for?" className="h-8 text-xs" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="receipt-check" checked={receiptHeld} onChange={(e) => setReceiptHeld(e.target.checked)} className="rounded border-slate-300" />
            <label htmlFor="receipt-check" className="text-xs text-slate-700">Receipt held on file</label>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes…" className="text-xs min-h-[50px]" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="text-xs" onClick={handleSubmit} disabled={!amount || !description.trim()}>
            Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function PocketMoneyPage() {
  const { data = [], isLoading } = usePocketMoneyTransactions();
  const createTx = useCreatePocketMoneyTransaction();
  const [showNew, setShowNew] = useState(false);

  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<PocketMoneyTransactionType | "all">("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");

  // Balances per child
  const balances = useMemo(() => {
    const ypIds = ["yp_alex", "yp_casey", "yp_jordan"];
    return ypIds.map((id) => {
      const txs = data.filter((t) => t.child_id === id);
      let wallet = 0;
      let savings = 0;
      txs.forEach((t) => {
        if (t.type === "savings_deposit") { savings += t.amount; }
        else if (t.type === "savings_withdrawal") { savings -= t.amount; wallet += t.amount; }
        else if (isIncome(t.type)) { wallet += t.amount; }
        else { wallet -= t.amount; }
      });
      const totalIn = txs.filter((t) => isIncome(t.type)).reduce((s, t) => s + t.amount, 0);
      const totalOut = txs.filter((t) => !isIncome(t.type)).reduce((s, t) => s + t.amount, 0);
      return { id, name: getYPName(id), wallet: Math.max(0, wallet), savings, totalIn, totalOut, txCount: txs.length };
    });
  }, [data]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = [...data];

    if (childFilter !== "all") list = list.filter((t) => t.child_id === childFilter);
    if (typeFilter !== "all") list = list.filter((t) => t.type === typeFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.description.toLowerCase().includes(q) ||
        getYPName(t.child_id).toLowerCase().includes(q) ||
        (t.notes ?? "").toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case "amount": list.sort((a, b) => b.amount - a.amount); break;
      case "child": list.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id))); break;
      case "type": list.sort((a, b) => a.type.localeCompare(b.type)); break;
      default: list.sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
    }

    return list;
  }, [data, childFilter, typeFilter, search, sortBy]);

  const totalWallet = balances.reduce((s, b) => s + b.wallet, 0);
  const totalSavings = balances.reduce((s, b) => s + b.savings, 0);
  const hasFilters = search || childFilter !== "all" || typeFilter !== "all";

  if (isLoading) {
    return (
      <PageShell title="Pocket Money & Savings" subtitle="Financial records for each young person">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Pocket Money & Savings"
      subtitle="Financial records for each young person"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={PM_EXPORT_COLS} filename="pocket-money" />
          <PrintButton title="Pocket Money" subtitle="Oak House — Financial Records" />
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowNew(true)}>
            <Plus className="h-3.5 w-3.5" />
            Record Transaction
          </Button>
        </div>
      }
    >
      {/* ── YP Balance Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {balances.map((b) => (
          <div key={b.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-900">{b.name}</span>
              <span className="text-[10px] text-slate-400">{b.txCount} transactions</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-lg font-bold text-emerald-600 tabular-nums">£{b.wallet.toFixed(2)}</div>
                <div className="text-[10px] text-slate-500">Wallet balance</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600 tabular-nums">£{b.savings.toFixed(2)}</div>
                <div className="text-[10px] text-slate-500">Savings</div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-0.5"><ArrowDownLeft className="h-2.5 w-2.5 text-emerald-500" /> In: £{b.totalIn.toFixed(2)}</span>
              <span className="flex items-center gap-0.5"><ArrowUpRight className="h-2.5 w-2.5 text-red-500" /> Out: £{b.totalOut.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Summary strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total in Wallets",   value: `£${totalWallet.toFixed(2)}`,  color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
          { label: "Total Savings",      value: `£${totalSavings.toFixed(2)}`, color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200"    },
          { label: "Transactions",       value: data.length,           color: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-200"   },
          { label: "Receipts on File",   value: data.filter((t) => t.receipt_held).length, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-lg border p-3 text-center", s.bg, s.border)}>
            <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input placeholder="Search transactions…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Filter className="h-3.5 w-3.5 text-slate-400" />
        <Select value={childFilter} onValueChange={setChildFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Child" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as PocketMoneyTransactionType | "all")}>
          <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(Object.keys(TYPE_CONFIG) as PocketMoneyTransactionType[]).map((t) => (
              <SelectItem key={t} value={t}>{TYPE_CONFIG[t].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="child">Child</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500" onClick={() => { setSearch(""); setChildFilter("all"); setTypeFilter("all"); }}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* ── Transaction List ──────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No transactions found</p>
          <p className="text-xs mt-1">{hasFilters ? "Try adjusting your filters" : "Record the first transaction"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      )}

      <div className="text-center text-[10px] text-slate-400 mt-6">
        Showing {filtered.length} of {data.length} transaction{data.length !== 1 ? "s" : ""}
      </div>

      {/* ── Regulatory Note ───────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-slate-50 border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <Wallet className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-1">Regulatory Context</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The Children&apos;s Homes Regulations 2015 (Reg 37, Schedule 3) require children&apos;s homes to
              maintain a record of money held or managed on behalf of each child. This includes pocket money
              allowances, spending, savings, gifts, and earnings. Receipts should be retained where possible.
              Each transaction must be approved by a staff member. These records are inspectable by
              Ofsted and the Regulation 44 visitor.
            </p>
          </div>
        </div>
      </div>

      <NewTransactionDialog open={showNew} onClose={() => setShowNew(false)} onSubmit={(tx) => createTx.mutate(tx as Partial<PocketMoneyTransaction>)} />
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
