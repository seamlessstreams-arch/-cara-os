"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Receipt, Plus, CheckCircle2, XCircle, Clock, AlertTriangle,
  Download, TrendingUp, Coins, ShoppingCart, Car,
  Shirt, Wrench, GraduationCap, Coffee,
  PieChart, FileText, Camera, X, Search, ArrowUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { getStaffName } from "@/lib/seed-data";
import { useStaff } from "@/hooks/use-staff";
import { cn, formatDate, daysFromNow } from "@/lib/utils";
import type { Expense } from "@/types";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { useExpenses, useCreateExpense, useUpdateExpense } from "@/hooks/use-expenses";
import { useAuthContext } from "@/contexts/auth-context";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const CAT_LABELS: Record<string, string> = {
  petty_cash: "Petty Cash", young_person_activities: "YP Activities",
  food_shopping: "Food Shopping", clothing: "Clothing",
  transport: "Transport", maintenance: "Maintenance",
  office_supplies: "Office", training: "Training", other: "Other",
};

const CAT_ICONS: Record<string, React.ElementType> = {
  petty_cash: Coins, young_person_activities: Coffee, food_shopping: ShoppingCart,
  clothing: Shirt, transport: Car, maintenance: Wrench,
  office_supplies: FileText, training: GraduationCap, other: Receipt,
};

const CAT_COLORS: Record<string, string> = {
  petty_cash: "bg-amber-100 text-amber-700",
  young_person_activities: "bg-violet-100 text-violet-700",
  food_shopping: "bg-emerald-100 text-emerald-700",
  clothing: "bg-pink-100 text-pink-700",
  transport: "bg-blue-100 text-blue-700",
  maintenance: "bg-orange-100 text-orange-700",
  office_supplies: "bg-slate-100 text-slate-600",
  training: "bg-teal-100 text-teal-700",
  other: "bg-slate-100 text-slate-600",
};

const EXPENSE_EXPORT_COLS: ExportColumn<Expense>[] = [
  { header: "Date", accessor: (e) => e.date },
  { header: "Submitted By", accessor: (e) => getStaffName(e.submitted_by) },
  { header: "Category", accessor: (e) => CAT_LABELS[e.category] ?? e.category },
  { header: "Description", accessor: (e) => e.description },
  { header: "Amount", accessor: (e) => e.amount.toFixed(2) },
  { header: "Payment Method", accessor: (e) => e.payment_method },
  { header: "Status", accessor: (e) => e.status },
  { header: "Approved By", accessor: (e) => e.approved_by ? getStaffName(e.approved_by) : "" },
  { header: "Approved At", accessor: (e) => e.approved_at },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-500",
  submitted: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  paid: "bg-blue-100 text-blue-700",
};

const EMPTY_FORM = {
  category: "young_person_activities",
  amount: "",
  date: "",
  payment_method: "personal card",
  description: "",
};

type StatusFilter = "all" | "submitted" | "approved" | "paid" | "draft";

function ExpenseRow({
  expense, onApprove, onReject,
}: { expense: Expense; onApprove: () => void; onReject: () => void }) {
  const Icon = CAT_ICONS[expense.category] || Receipt;
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-50 transition-colors group">
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", CAT_COLORS[expense.category] || "bg-slate-100")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900 truncate">{expense.description}</div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
          <span>{getStaffName(expense.submitted_by).split(" ")[0]}</span>
          <span>·</span>
          <span>{formatDate(expense.date)}</span>
          <span>·</span>
          <span>{CAT_LABELS[expense.category] || expense.category}</span>
          {expense.payment_method && <><span>·</span><span className="capitalize">{expense.payment_method}</span></>}
        </div>
      </div>
      <div className="text-base font-bold text-slate-900 shrink-0">£{expense.amount.toFixed(2)}</div>
      <Badge className={cn("text-[10px] rounded-full shrink-0 capitalize", STATUS_COLORS[expense.status] || "bg-slate-100")}>
        {expense.status}
      </Badge>
      {expense.receipt_url ? (
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0 shrink-0 opacity-0 group-hover:opacity-100"
          title="View receipt"
          onClick={() => window.open(expense.receipt_url!, "_blank")}
        >
          <Camera className="h-3 w-3" />
        </Button>
      ) : (
        <div className="h-7 w-7 shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" aria-label="No receipt" />
        </div>
      )}
      {expense.status === "submitted" && (
        <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" onClick={onApprove} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />Approve
          </Button>
          <Button size="sm" variant="outline" onClick={onReject} className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50">
            <XCircle className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ExpensesPage() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const staffQuery = useStaff();
  const allActiveStaff = (staffQuery.data?.data ?? []).filter((s) => s.is_active);
  const expensesQuery = useExpenses();
  const expenses: Expense[] = expensesQuery.data?.data ?? [];
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  type SortKey = "newest" | "oldest" | "amount_high" | "amount_low";
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const filtered = useMemo(() => {
    let list = expenses;
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => {
        const hay = [
          e.description,
          getStaffName(e.submitted_by),
          CAT_LABELS[e.category] || e.category,
          e.payment_method || "",
          `£${e.amount.toFixed(2)}`,
          e.status,
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    switch (sortBy) {
      case "oldest": return [...list].sort((a, b) => a.date.localeCompare(b.date));
      case "amount_high": return [...list].sort((a, b) => b.amount - a.amount);
      case "amount_low": return [...list].sort((a, b) => a.amount - b.amount);
      default: return [...list].sort((a, b) => b.date.localeCompare(a.date));
    }
  }, [expenses, statusFilter, search, sortBy]);

  const stats = useMemo(() => {
    const pending = expenses.filter((e) => e.status === "submitted");
    const totalPending = pending.reduce((a, e) => a + e.amount, 0);
    const thisMonth = expenses.filter((e) => e.date >= daysFromNow(-30));
    const totalMonth = thisMonth.reduce((a, e) => a + e.amount, 0);
    const noReceipt = pending.filter((e) => !e.receipt_url);
    return { pendingCount: pending.length, pendingAmount: totalPending, monthAmount: totalMonth, noReceipt: noReceipt.length };
  }, [expenses]);

  const byCategory = EXPENSE_CATEGORIES.map((cat) => {
    const total = expenses.filter((e) => e.category === cat && e.status !== "rejected").reduce((a, e) => a + e.amount, 0);
    return { cat, total };
  }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const grandTotal = byCategory.reduce((a, c) => a + c.total, 0);

  function handleApprove(id: string) {
    updateExpense.mutate({
      id,
      data: { status: "approved", approved_by: currentUser?.id ?? "staff_darren", approved_at: new Date().toISOString() },
    });
  }

  function handleReject(id: string) {
    updateExpense.mutate({ id, data: { status: "rejected" } });
  }

  function handleSubmitExpense() {
    if (!form.description.trim()) { setFormError("Description is required"); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setFormError("Enter a valid amount"); return; }
    if (!form.date) { setFormError("Date is required"); return; }
    setFormError("");

    createExpense.mutate(
      {
        submitted_by: currentUser?.id ?? "staff_darren",
        category: form.category as Expense["category"],
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        receipt_url: null,
        date: form.date,
        status: "submitted",
        approved_by: null,
        approved_at: null,
        linked_child_id: null,
        payment_method: form.payment_method,
        home_id: homeId,
        created_by: currentUser?.id ?? "staff_darren",
        updated_by: currentUser?.id ?? "staff_darren",
      },
      {
        onSuccess: () => {
          setShowNewForm(false);
          setForm(EMPTY_FORM);
        },
      }
    );
  }

  return (
    <PageShell
      title="Expenses"
      subtitle="Expense claims, receipts, approvals, and spend reporting"
      quickCreateContext={{ module: "expenses", defaultTaskCategory: "finance" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Expenses" subtitle="Oak House — Expense Claims & Reporting" targetId="expenses-content" />
          <SmartUploadButton variant="inline" label="Upload Receipt" uploadContext="Expenses — receipt or invoice upload" />
          <ExportButton<Expense> filename="expenses-export" data={filtered} columns={EXPENSE_EXPORT_COLS} label="Export" />
          <Button size="sm" onClick={() => setShowNewForm(!showNewForm)}>
            <Plus className="h-3.5 w-3.5 mr-1" />Submit Expense
          </Button>
        </div>
      }
    >
      <div id="expenses-content" className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Awaiting Approval", value: `${stats.pendingCount}`, sub: `£${stats.pendingAmount.toFixed(2)} total`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Spend This Month", value: `£${stats.monthAmount.toFixed(0)}`, sub: `${expenses.filter((e) => e.date >= daysFromNow(-30)).length} claims`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "No Receipt", value: stats.noReceipt, sub: "Submitted claims", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
            { label: "Total on Record", value: `£${grandTotal.toFixed(0)}`, sub: `${expenses.length} claims`, icon: Coins, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
                  <div className={cn("mt-1 text-2xl font-bold tabular-nums", color)}>{value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
                </div>
                <div className={cn("rounded-2xl p-3", bg)}><Icon className={cn("h-5 w-5", color)} /></div>
              </div>
            </div>
          ))}
        </div>

        {/* New expense form */}
        {showNewForm && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">New Expense Claim</CardTitle>
                <button onClick={() => setShowNewForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{CAT_LABELS[cat] || cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Amount (£) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Payment method</label>
                  <select
                    value={form.payment_method}
                    onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
                    className="w-full h-9 rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>Personal card</option>
                    <option>House card</option>
                    <option>Petty cash</option>
                    <option>Mileage</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe what was purchased and why..."
                  />
                </div>
                {formError && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-red-600 font-medium">{formError}</p>
                  </div>
                )}
                <div className="md:col-span-2 flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowNewForm(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={handleSubmitExpense} disabled={createExpense.isPending}>Submit for Approval</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Claims list */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <CardTitle className="text-base flex items-center gap-2 flex-1">
                    <Receipt className="h-4 w-4 text-blue-500" />All Claims
                    {(search || statusFilter !== "all") && (
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex gap-1">
                    {(["all", "submitted", "approved", "paid", "draft"] as StatusFilter[]).map((s) => (
                      <button key={s} onClick={() => setStatusFilter(s)}
                        className={cn("px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all",
                          statusFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                      >{s}</button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search description, staff, category…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 h-8 text-xs rounded-lg"
                    />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="amount_high">Highest amount</option>
                    <option value="amount_low">Lowest amount</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {expensesQuery.isLoading ? (
                  <div className="py-12 text-center text-sm text-slate-400">Loading expenses…</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filtered.map((expense) => (
                      <ExpenseRow
                        key={expense.id}
                        expense={expense}
                        onApprove={() => handleApprove(expense.id)}
                        onReject={() => handleReject(expense.id)}
                      />
                    ))}
                    {filtered.length === 0 && (
                      <div className="py-12 text-center text-sm text-slate-400">
                        {search || statusFilter !== "all" ? "No expenses match your filters" : "No expenses on record"}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Spend breakdown */}
          <div className="space-y-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><PieChart className="h-4 w-4 text-blue-500" />Spend by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {byCategory.map(({ cat, total }) => {
                    const Icon = CAT_ICONS[cat] || Receipt;
                    const pct = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center shrink-0", CAT_COLORS[cat] || "bg-slate-100")}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <span className="text-xs text-slate-700 flex-1 truncate">{CAT_LABELS[cat] || cat}</span>
                          <span className="text-xs font-semibold text-slate-900">£{total.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400 w-8 text-right">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-8">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">By Staff Member</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allActiveStaff.map((staff) => {
                    const staffExpenses = expenses.filter((e) => e.submitted_by === staff.id);
                    const total = staffExpenses.reduce((a, e) => a + e.amount, 0);
                    if (total === 0) return null;
                    return (
                      <div key={staff.id} className="flex items-center gap-3">
                        <Avatar name={staff.full_name} size="xs" />
                        <span className="text-xs text-slate-700 flex-1 truncate">{staff.first_name}</span>
                        <span className="text-xs font-semibold text-slate-900">£{total.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-400">{staffExpenses.length} claims</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
