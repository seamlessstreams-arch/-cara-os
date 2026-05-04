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
import { PageShell } from "@/components/ui/page-shell";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

// ── Types ─────────────────────────────────────────────────────────────────────

type TransactionType = "credit" | "debit";

type Category =
  | "weekly_allowance"
  | "birthday_gift"
  | "savings_transfer"
  | "chore_bonus"
  | "purchase_shop"
  | "purchase_online"
  | "activity_cost"
  | "lost"
  | "adjustment";

interface PocketMoneyAccount {
  id: string;
  date: string;
  youngPersonId: string;
  transactionType: TransactionType;
  category: Category;
  amount: number;
  runningBalance: number;
  description: string;
  receiptRef: string;
  authorisedBy: string;
  witnessedBy: string | null;
  notes: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const CATEGORY_LABELS: Record<Category, string> = {
  weekly_allowance: "Weekly Allowance",
  birthday_gift: "Birthday Gift",
  savings_transfer: "Savings Transfer",
  chore_bonus: "Chore Bonus",
  purchase_shop: "Shop Purchase",
  purchase_online: "Online Purchase",
  activity_cost: "Activity Cost",
  lost: "Lost",
  adjustment: "Adjustment",
};

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
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

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SEED: PocketMoneyAccount[] = [
  // ── Alex — £15/week, balance ~£32 ──────────────────────────────────────────
  { id: "pma_001", date: d(-21), youngPersonId: "yp_alex", transactionType: "credit",  category: "weekly_allowance", amount: 15.00, runningBalance: 15.00, description: "Weekly allowance",                   receiptRef: "",          authorisedBy: "staff_darren",    witnessedBy: "staff_anna",      notes: "" },
  { id: "pma_002", date: d(-18), youngPersonId: "yp_alex", transactionType: "debit",   category: "purchase_shop",    amount: 3.50,  runningBalance: 11.50, description: "Sweets from corner shop",             receiptRef: "REC-A001",  authorisedBy: "staff_ryan",      witnessedBy: null,              notes: "Receipt in file" },
  { id: "pma_003", date: d(-14), youngPersonId: "yp_alex", transactionType: "credit",  category: "weekly_allowance", amount: 15.00, runningBalance: 26.50, description: "Weekly allowance",                   receiptRef: "",          authorisedBy: "staff_darren",    witnessedBy: "staff_edward",    notes: "" },
  { id: "pma_004", date: d(-10), youngPersonId: "yp_alex", transactionType: "debit",   category: "purchase_shop",    amount: 2.99,  runningBalance: 23.51, description: "Football magazine",                   receiptRef: "REC-A002",  authorisedBy: "staff_lackson",   witnessedBy: null,              notes: "" },
  { id: "pma_005", date: d(-7),  youngPersonId: "yp_alex", transactionType: "credit",  category: "weekly_allowance", amount: 15.00, runningBalance: 38.51, description: "Weekly allowance",                   receiptRef: "",          authorisedBy: "staff_darren",    witnessedBy: "staff_mirela",    notes: "" },
  { id: "pma_006", date: d(-5),  youngPersonId: "yp_alex", transactionType: "debit",   category: "purchase_shop",    amount: 4.50,  runningBalance: 34.01, description: "Football stickers (2 packs)",         receiptRef: "REC-A003",  authorisedBy: "staff_anna",      witnessedBy: null,              notes: "Alex saving stickers for album" },
  { id: "pma_007", date: d(-3),  youngPersonId: "yp_alex", transactionType: "credit",  category: "chore_bonus",      amount: 2.00,  runningBalance: 36.01, description: "Helped tidy communal lounge",         receiptRef: "",          authorisedBy: "staff_ryan",      witnessedBy: "staff_edward",    notes: "Voluntary — great initiative" },
  { id: "pma_008", date: d(-1),  youngPersonId: "yp_alex", transactionType: "debit",   category: "purchase_online",  amount: 3.99,  runningBalance: 32.02, description: "Robux top-up (online gaming)",        receiptRef: "REC-A004",  authorisedBy: "staff_darren",    witnessedBy: null,              notes: "Supervised purchase" },

  // ── Jordan — £12/week (age-based), balance ~£18 ────────────────────────────
  { id: "pma_009", date: d(-14), youngPersonId: "yp_jordan", transactionType: "credit",  category: "weekly_allowance", amount: 12.00, runningBalance: 12.00, description: "Weekly allowance",                  receiptRef: "",          authorisedBy: "staff_darren",    witnessedBy: "staff_chervelle", notes: "" },
  { id: "pma_010", date: d(-11), youngPersonId: "yp_jordan", transactionType: "credit",  category: "birthday_gift",   amount: 20.00, runningBalance: 32.00, description: "Birthday money from grandparent",    receiptRef: "",          authorisedBy: "staff_darren",    witnessedBy: "staff_ryan",      notes: "Card and cash received — logged in gifts register" },
  { id: "pma_011", date: d(-9),  youngPersonId: "yp_jordan", transactionType: "debit",   category: "purchase_shop",   amount: 8.99,  runningBalance: 23.01, description: "Lego minifig blind bag x3",           receiptRef: "REC-J001",  authorisedBy: "staff_anna",      witnessedBy: null,              notes: "" },
  { id: "pma_012", date: d(-7),  youngPersonId: "yp_jordan", transactionType: "credit",  category: "weekly_allowance", amount: 12.00, runningBalance: 35.01, description: "Weekly allowance",                  receiptRef: "",          authorisedBy: "staff_darren",    witnessedBy: "staff_lackson",   notes: "" },
  { id: "pma_013", date: d(-2),  youngPersonId: "yp_jordan", transactionType: "debit",   category: "activity_cost",   amount: 6.50,  runningBalance: 28.51, description: "Swimming session entry fee",          receiptRef: "REC-J002",  authorisedBy: "staff_chervelle", witnessedBy: null,             notes: "Part of weekly activity plan" },
  { id: "pma_014", date: d(0),   youngPersonId: "yp_jordan", transactionType: "debit",   category: "purchase_shop",   amount: 10.50, runningBalance: 18.01, description: "Snacks and drink at cinema",          receiptRef: "REC-J003",  authorisedBy: "staff_ryan",      witnessedBy: null,              notes: "" },

  // ── Casey — £15/week, balance ~£45 ─────────────────────────────────────────
  { id: "pma_015", date: d(-14), youngPersonId: "yp_casey", transactionType: "credit",  category: "weekly_allowance", amount: 15.00, runningBalance: 22.00, description: "Weekly allowance",                   receiptRef: "",          authorisedBy: "staff_darren",    witnessedBy: "staff_mirela",    notes: "" },
  { id: "pma_016", date: d(-12), youngPersonId: "yp_casey", transactionType: "debit",   category: "purchase_shop",    amount: 6.50,  runningBalance: 15.50, description: "Art supplies — watercolour set",      receiptRef: "REC-C001",  authorisedBy: "staff_anna",      witnessedBy: null,              notes: "For Casey's art project" },
  { id: "pma_017", date: d(-7),  youngPersonId: "yp_casey", transactionType: "credit",  category: "weekly_allowance", amount: 15.00, runningBalance: 30.50, description: "Weekly allowance",                   receiptRef: "",          authorisedBy: "staff_darren",    witnessedBy: "staff_edward",    notes: "" },
  { id: "pma_018", date: d(-4),  youngPersonId: "yp_casey", transactionType: "debit",   category: "purchase_online",  amount: 7.99,  runningBalance: 22.51, description: "Phone case from Amazon",              receiptRef: "REC-C002",  authorisedBy: "staff_darren",    witnessedBy: null,              notes: "Supervised online purchase — Casey chose design" },
  { id: "pma_019", date: d(-1),  youngPersonId: "yp_casey", transactionType: "credit",  category: "savings_transfer", amount: 5.00,  runningBalance: 27.51, description: "Transfer from savings (Casey request)", receiptRef: "",        authorisedBy: "staff_darren",    witnessedBy: "staff_ryan",      notes: "Casey asked to move savings for planned purchase" },
  { id: "pma_020", date: d(0),   youngPersonId: "yp_casey", transactionType: "credit",  category: "weekly_allowance", amount: 15.00, runningBalance: 42.51, description: "Weekly allowance",                   receiptRef: "",          authorisedBy: "staff_darren",    witnessedBy: "staff_anna",      notes: "" },
];

// ── Export Columns ────────────────────────────────────────────────────────────

const EXPORT_COLS: ExportColumn<PocketMoneyAccount>[] = [
  { header: "Date",           accessor: (r: PocketMoneyAccount) => r.date },
  { header: "Young Person",   accessor: (r: PocketMoneyAccount) => getYPName(r.youngPersonId) },
  { header: "Type",           accessor: (r: PocketMoneyAccount) => r.transactionType === "credit" ? "Credit" : "Debit" },
  { header: "Category",       accessor: (r: PocketMoneyAccount) => CATEGORY_LABELS[r.category] },
  { header: "Amount",         accessor: (r: PocketMoneyAccount) => `£${r.amount.toFixed(2)}` },
  { header: "Running Balance",accessor: (r: PocketMoneyAccount) => `£${r.runningBalance.toFixed(2)}` },
  { header: "Description",    accessor: (r: PocketMoneyAccount) => r.description },
  { header: "Receipt Ref",    accessor: (r: PocketMoneyAccount) => r.receiptRef || "—" },
  { header: "Authorised By",  accessor: (r: PocketMoneyAccount) => getStaffName(r.authorisedBy) },
  { header: "Witnessed By",   accessor: (r: PocketMoneyAccount) => r.witnessedBy ? getStaffName(r.witnessedBy) : "—" },
  { header: "Notes",          accessor: (r: PocketMoneyAccount) => r.notes },
];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function PocketMoneyAccountsPage() {
  const [transactions, setTransactions] = useState<PocketMoneyAccount[]>(SEED);
  const [showNew, setShowNew] = useState(false);

  // Filters
  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [sortDir, setSortDir] = useState<"newest" | "oldest">("newest");
  const [search, setSearch] = useState("");

  // ── Per-child account summaries ─────────────────────────────────────────────

  const accountSummaries = useMemo(() => {
    const ypIds = ["yp_alex", "yp_jordan", "yp_casey"] as const;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    return ypIds.map((id) => {
      const txs = transactions.filter((t) => t.youngPersonId === id);
      // Current balance is the running balance of the most recent transaction
      const sorted = [...txs].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
      const currentBalance = sorted[0]?.runningBalance ?? 0;

      // Monthly totals
      const monthTxs = txs.filter((t) => t.date >= monthStart);
      const creditsThisMonth = monthTxs.filter((t) => t.transactionType === "credit").reduce((s, t) => s + t.amount, 0);
      const debitsThisMonth = monthTxs.filter((t) => t.transactionType === "debit").reduce((s, t) => s + t.amount, 0);

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
  }, [transactions]);

  // ── Filtered transaction list ───────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...transactions];

    if (childFilter !== "all") list = list.filter((t) => t.youngPersonId === childFilter);
    if (typeFilter !== "all") list = list.filter((t) => t.transactionType === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q) ||
          CATEGORY_LABELS[t.category].toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return sortDir === "newest" ? -cmp || b.id.localeCompare(a.id) : cmp || a.id.localeCompare(b.id);
    });

    return list;
  }, [transactions, childFilter, typeFilter, search, sortDir]);

  // ── New transaction handler ────────────────────────────────────────────────

  function handleNewTransaction(tx: PocketMoneyAccount) {
    setTransactions((prev) => [...prev, tx]);
    setShowNew(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Pocket Money Accounts"
      subtitle="Individual running-balance ledgers — credits, debits, and receipt tracking"
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
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TransactionType | "all")}>
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
            const isCredit = tx.transactionType === "credit";
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
                    {getYPName(tx.youngPersonId)}
                  </Badge>
                </div>

                {/* Description + category */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {tx.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {CATEGORY_LABELS[tx.category]}
                    </span>
                    {tx.receiptRef && (
                      <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[9px] px-1.5 py-0">
                        <Receipt className="h-2.5 w-2.5 mr-0.5" />
                        {tx.receiptRef}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      Auth: {getStaffName(tx.authorisedBy)}
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
                  £{tx.runningBalance.toFixed(2)}
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
        transactions={transactions}
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
  onSubmit: (tx: PocketMoneyAccount) => void;
  transactions: PocketMoneyAccount[];
}) {
  const [youngPersonId, setYoungPersonId] = useState("yp_alex");
  const [transactionType, setTransactionType] = useState<TransactionType>("credit");
  const [category, setCategory] = useState<Category>("weekly_allowance");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [receiptRef, setReceiptRef] = useState("");
  const [authorisedBy, setAuthorisedBy] = useState("staff_darren");
  const [witnessedBy, setWitnessedBy] = useState("");
  const [notes, setNotes] = useState("");

  const creditCategories: Category[] = ["weekly_allowance", "birthday_gift", "savings_transfer", "chore_bonus", "adjustment"];
  const debitCategories: Category[] = ["purchase_shop", "purchase_online", "activity_cost", "lost", "adjustment"];
  const availableCategories = transactionType === "credit" ? creditCategories : debitCategories;

  function handleSubmit() {
    if (!amount || !description.trim()) return;

    const parsedAmount = parseFloat(amount);
    // Calculate new running balance from child's latest transaction
    const childTxs = transactions
      .filter((t) => t.youngPersonId === youngPersonId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    const lastBalance = childTxs[0]?.runningBalance ?? 0;
    const newBalance = transactionType === "credit"
      ? lastBalance + parsedAmount
      : lastBalance - parsedAmount;

    const tx: PocketMoneyAccount = {
      id: `pma_local_${Date.now()}`,
      date: d(0),
      youngPersonId,
      transactionType,
      category,
      amount: parsedAmount,
      runningBalance: Math.round(newBalance * 100) / 100,
      description: description.trim(),
      receiptRef: receiptRef.trim(),
      authorisedBy,
      witnessedBy: witnessedBy || null,
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
              <Select value={youngPersonId} onValueChange={setYoungPersonId}>
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
              <Select value={transactionType} onValueChange={(v) => { setTransactionType(v as TransactionType); setCategory(v === "credit" ? "weekly_allowance" : "purchase_shop"); }}>
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
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableCategories.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
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
