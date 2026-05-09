"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POCKET MONEY ACCOUNTS
// Individual running-balance ledgers for each child. Tracks credits (weekly
// allowance, birthday money, savings interest, chore bonuses) and debits
// (shop purchases, online purchases, activity costs). Receipts retained.
// Required under Children's Homes Regulations 2015 (Reg 39) — the home must
// maintain transparent financial records for each looked-after child.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Wallet, Plus, Search, ArrowUpDown, Receipt,
  TrendingUp, TrendingDown, PoundSterling, Gift,
  ShoppingCart, Globe, Sparkles, AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { usePocketMoneyAccounts, useCreatePocketMoneyAccount } from "@/hooks/use-pocket-money-accounts";
import type { PocketMoneyAccount, PocketMoneyAccountTxType, PocketMoneyAccountCategory } from "@/types/extended";
import { POCKET_MONEY_ACCOUNT_CATEGORY_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Helpers ───────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<PocketMoneyAccountCategory, React.ElementType> = {
  weekly_allowance: PoundSterling,
  birthday_gift: Gift,
  savings_transfer: TrendingUp,
  chore_bonus: Sparkles,
  purchase_shop: ShoppingCart,
  purchase_online: Globe,
  activity_cost: TrendingDown,
  lost: AlertTriangle,
  adjustment: Wallet,
};

const ALLOWANCE_RATES: Record<string, number> = {
  yp_alex: 15,
  yp_jordan: 12,
  yp_casey: 15,
};

// ── Export Columns ────────────────────────────────────────────────────────────

const EXPORT_COLS: ExportColumn<PocketMoneyAccount>[] = [
  { header: "Date",           accessor: (r) => r.date },
  { header: "Young Person",   accessor: (r) => getYPName(r.child_id) },
  { header: "Type",           accessor: (r) => r.transaction_type === "credit" ? "Credit" : "Debit" },
  { header: "Category",       accessor: (r) => POCKET_MONEY_ACCOUNT_CATEGORY_LABEL[r.category] },
  { header: "Amount",         accessor: (r) => `£${r.amount.toFixed(2)}` },
  { header: "Running Balance",accessor: (r) => `£${r.running_balance.toFixed(2)}` },
  { header: "Description",    accessor: (r) => r.description },
  { header: "Receipt Ref",    accessor: (r) => r.receipt_ref || "—" },
  { header: "Authorised By",  accessor: (r) => getStaffName(r.authorised_by) },
  { header: "Witnessed By",   accessor: (r) => r.witnessed_by ? getStaffName(r.witnessed_by) : "—" },
  { header: "Notes",          accessor: (r) => r.notes },
];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function PocketMoneyAccountsPage() {
  const { data = [], isLoading } = usePocketMoneyAccounts();
  const createTx = useCreatePocketMoneyAccount();
  const [showNew, setShowNew] = useState(false);

  // Filters
  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<PocketMoneyAccountTxType | "all">("all");
  const [sortDir, setSortDir] = useState<"newest" | "oldest">("newest");
  const [search, setSearch] = useState("");

  // ── Per-child account summaries ─────────────────────────────────────────────

  const accountSummaries = useMemo(() => {
    const ypIds = ["yp_alex", "yp_jordan", "yp_casey"] as const;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    return ypIds.map((id) => {
      const txs = data.filter((t) => t.child_id === id);
      // Current balance is the running balance of the most recent transaction
      const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
      const currentBalance = sorted[0]?.running_balance ?? 0;

      // Monthly totals
      const monthTxs = txs.filter((t) => t.date >= monthStart);
      const creditsThisMonth = monthTxs.filter((t) => t.transaction_type === "credit").reduce((s, t) => s + t.amount, 0);
      const debitsThisMonth = monthTxs.filter((t) => t.transaction_type === "debit").reduce((s, t) => s + t.amount, 0);

      return {
        id,
        name: getYPName(id),
        currentBalance,
        creditsThisMonth,
        debitsThisMonth,
        weeklyAllowance: ALLOWANCE_RATES[id],
        transactionCount: txs.length,
      };
    });
  }, [data]);

  // ── Filtered transaction list ───────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...data];

    if (childFilter !== "all") list = list.filter((t) => t.child_id === childFilter);
    if (typeFilter !== "all") list = list.filter((t) => t.transaction_type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q) ||
          POCKET_MONEY_ACCOUNT_CATEGORY_LABEL[t.category].toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return sortDir === "newest" ? -cmp || b.id.localeCompare(a.id) : cmp || a.id.localeCompare(b.id);
    });

    return list;
  }, [data, childFilter, typeFilter, search, sortDir]);

  // ── New transaction handler ────────────────────────────────────────────────

  function handleNewTransaction(tx: Partial<PocketMoneyAccount>) {
    createTx.mutate(tx as Partial<PocketMoneyAccount>);
    setShowNew(false);
  }

  if (isLoading) {
    return (
      <PageShell title="Pocket Money Accounts" subtitle="Individual running-balance ledgers — credits, debits, and receipt tracking">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Pocket Money Accounts"
      subtitle="Individual running-balance ledgers — credits, debits, and receipt tracking"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Pocket Money Accounts" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="pocket-money-accounts" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Transaction
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* ── Per-child account summary cards ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accountSummaries.map((acc) => (
            <Card key={acc.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-blue-600" />
                    {acc.name}
                  </span>
                  <Badge variant="outline" className="text-xs font-normal">
                    £{acc.weeklyAllowance}/week
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-900">
                    £{acc.currentBalance.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <p className="text-sm font-semibold text-emerald-700">
                      +£{acc.creditsThisMonth.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-emerald-600">Credits this month</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-2">
                    <p className="text-sm font-semibold text-red-700">
                      -£{acc.debitsThisMonth.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-red-600">Debits this month</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  {acc.transactionCount} transactions on record
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-[170px] h-9 text-sm">
              <SelectValue placeholder="All Children" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
              <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
              <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as PocketMoneyAccountTxType | "all")}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="credit">Credits</SelectItem>
              <SelectItem value="debit">Debits</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1 text-sm"
            onClick={() => setSortDir((p) => (p === "newest" ? "oldest" : "newest"))}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortDir === "newest" ? "Newest first" : "Oldest first"}
          </Button>
        </div>

        {/* ── Transaction list ────────────────────────────────────────────── */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No transactions match your filters.
              </CardContent>
            </Card>
          )}

          {filtered.map((tx) => {
            const isCredit = tx.transaction_type === "credit";
            const CatIcon = CATEGORY_ICONS[tx.category];

            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 rounded-lg border bg-white p-3 hover:shadow-sm transition-shadow"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex-shrink-0 rounded-md p-2 border",
                    isCredit
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  )}
                >
                  <CatIcon
                    className={cn(
                      "h-4 w-4",
                      isCredit ? "text-emerald-600" : "text-red-600"
                    )}
                  />
                </div>

                {/* Date */}
                <div className="w-[80px] flex-shrink-0 text-xs text-muted-foreground">
                  {tx.date}
                </div>

                {/* Young person */}
                <div className="w-[90px] flex-shrink-0">
                  <Badge variant="outline" className="text-[10px]">
                    {getYPName(tx.child_id)}
                  </Badge>
                </div>

                {/* Description + category */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {tx.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {POCKET_MONEY_ACCOUNT_CATEGORY_LABEL[tx.category]}
                    </span>
                    {tx.receipt_ref && (
                      <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[9px] px-1.5 py-0">
                        <Receipt className="h-2.5 w-2.5 mr-0.5" />
                        {tx.receipt_ref}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      Auth: {getStaffName(tx.authorised_by)}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div
                  className={cn(
                    "text-sm font-bold tabular-nums flex-shrink-0 w-[80px] text-right",
                    isCredit ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {isCredit ? "+" : "-"}£{tx.amount.toFixed(2)}
                </div>

                {/* Running balance */}
                <div className="text-xs text-muted-foreground tabular-nums flex-shrink-0 w-[70px] text-right">
                  £{tx.running_balance.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Regulatory note ──────────────────────────────────────────────── */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 39 — Financial records for looked-after children</strong> — The
          registered person must maintain accurate and up-to-date records of all money
          managed on behalf of each child. This includes pocket money, gifts, and any
          funds held in trust. All transactions must be transparent, receipts retained,
          and the child informed of their balance. Two-person authorisation is
          recommended for all transactions.
        </div>
      </div>

      {/* ── New Transaction Dialog ───────────────────────────────────────── */}
      <NewTransactionDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onSubmit={handleNewTransaction}
        transactions={data}
      />
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NEW TRANSACTION DIALOG
// ══════════════════════════════════════════════════════════════════════════════

function NewTransactionDialog({
  open,
  onClose,
  onSubmit,
  transactions,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (tx: Partial<PocketMoneyAccount>) => void;
  transactions: PocketMoneyAccount[];
}) {
  const [childId, setChildId] = useState("yp_alex");
  const [transactionType, setTransactionType] = useState<PocketMoneyAccountTxType>("credit");
  const [category, setCategory] = useState<PocketMoneyAccountCategory>("weekly_allowance");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [receiptRef, setReceiptRef] = useState("");
  const [authorisedBy, setAuthorisedBy] = useState("staff_darren");
  const [witnessedBy, setWitnessedBy] = useState("");
  const [notes, setNotes] = useState("");

  const creditCategories: PocketMoneyAccountCategory[] = ["weekly_allowance", "birthday_gift", "savings_transfer", "chore_bonus", "adjustment"];
  const debitCategories: PocketMoneyAccountCategory[] = ["purchase_shop", "purchase_online", "activity_cost", "lost", "adjustment"];
  const availableCategories = transactionType === "credit" ? creditCategories : debitCategories;

  function handleSubmit() {
    if (!amount || !description.trim()) return;

    const parsedAmount = parseFloat(amount);
    // Calculate new running balance from child's latest transaction
    const childTxs = transactions
      .filter((t) => t.child_id === childId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    const lastBalance = childTxs[0]?.running_balance ?? 0;
    const newBalance = transactionType === "credit"
      ? lastBalance + parsedAmount
      : lastBalance - parsedAmount;

    const tx: Partial<PocketMoneyAccount> = {
      date: new Date().toISOString().slice(0, 10),
      child_id: childId,
      transaction_type: transactionType,
      category,
      amount: parsedAmount,
      running_balance: Math.round(newBalance * 100) / 100,
      description: description.trim(),
      receipt_ref: receiptRef.trim(),
      authorised_by: authorisedBy,
      witnessed_by: witnessedBy || null,
      notes: notes.trim(),
    };

    onSubmit(tx);
    // Reset form
    setAmount("");
    setDescription("");
    setReceiptRef("");
    setNotes("");
    setWitnessedBy("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <PoundSterling className="h-4 w-4 text-blue-600" />
            Record Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Young Person</Label>
              <Select value={childId} onValueChange={setChildId}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
                  <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
                  <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={transactionType} onValueChange={(v) => { setTransactionType(v as PocketMoneyAccountTxType); setCategory(v === "credit" ? "weekly_allowance" : "purchase_shop"); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as PocketMoneyAccountCategory)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableCategories.map((c) => (
                    <SelectItem key={c} value={c}>{POCKET_MONEY_ACCOUNT_CATEGORY_LABEL[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount (£) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description *</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this transaction for?"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Receipt Reference</Label>
            <Input
              value={receiptRef}
              onChange={(e) => setReceiptRef(e.target.value)}
              placeholder="e.g. REC-0123"
              className="h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Authorised By</Label>
              <Select value={authorisedBy} onValueChange={setAuthorisedBy}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["staff_darren", "staff_ryan", "staff_anna", "staff_edward", "staff_chervelle", "staff_lackson", "staff_mirela"].map((s) => (
                    <SelectItem key={s} value={s}>{getStaffName(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Witnessed By</Label>
              <Select value={witnessedBy} onValueChange={setWitnessedBy}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {["staff_darren", "staff_ryan", "staff_anna", "staff_edward", "staff_chervelle", "staff_lackson", "staff_mirela"].map((s) => (
                    <SelectItem key={s} value={s}>{getStaffName(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="text-sm min-h-[60px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={!amount || !description.trim()}>
            Record Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
