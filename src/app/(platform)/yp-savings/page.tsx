"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  PiggyBank,
  Plus,
  ArrowUpDown,
  Search,
  TrendingUp,
  TrendingDown,
  Wallet,
  Loader2,
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
import { useYPSavingsAccountRecords } from "@/hooks/use-yp-savings-account-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { YPSavingsAccountRecord, YPSavingsTransactionType } from "@/types/extended";
import { YP_SAVINGS_TRANSACTION_TYPE_LABEL } from "@/types/extended";

/* ── component ─────────────────────────────────────────────────────────── */

export default function YPSavingsPage() {
  const { data: records = [], isLoading } = useYPSavingsAccountRecords();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("balance");
  const [showDialog, setShowDialog] = useState(false);

  const stats = useMemo(() => {
    const totalBalance = records.reduce((s, a) => s + a.current_balance, 0);
    const totalDeposits = records.flatMap((a) => a.transactions).filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    return {
      accounts: records.length,
      totalBalance,
      totalDeposits,
      selfManaged: records.filter((a) => a.child_manages).length,
      avgBalance: records.length > 0 ? Math.round(totalBalance / records.length) : 0,
    };
  }, [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterYP !== "all") list = list.filter((a) => a.child_id === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => getYPName(a.child_id).toLowerCase().includes(q) || a.provider.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":    return a.child_id.localeCompare(b.child_id);
        case "provider":return a.provider.localeCompare(b.provider);
        default:        return b.current_balance - a.current_balance;
      }
    });
    return list;
  }, [records, filterYP, search, sortBy]);

  const exportData = useMemo(() => records.flatMap((a) => a.transactions.map((t) => ({
    youngPerson: getYPName(a.child_id),
    accountType: a.account_type,
    provider: a.provider,
    date: t.date,
    type: YP_SAVINGS_TRANSACTION_TYPE_LABEL[t.type],
    description: t.description,
    amount: t.amount.toFixed(2),
    balance: t.balance.toFixed(2),
    recordedBy: getStaffName(t.recorded_by),
    authorisedBy: t.authorised_by ? getStaffName(t.authorised_by) : "",
    receiptRef: t.receipt_ref,
    currentBalance: a.current_balance.toFixed(2),
    childManages: a.child_manages ? "Yes" : "No",
  }))), [records]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Young Person",   accessor: (r: typeof exportData[number]) => r.youngPerson },
    { header: "Account Type",   accessor: (r: typeof exportData[number]) => r.accountType },
    { header: "Provider",       accessor: (r: typeof exportData[number]) => r.provider },
    { header: "Date",           accessor: (r: typeof exportData[number]) => r.date },
    { header: "Type",           accessor: (r: typeof exportData[number]) => r.type },
    { header: "Description",    accessor: (r: typeof exportData[number]) => r.description },
    { header: "Amount",         accessor: (r: typeof exportData[number]) => r.amount },
    { header: "Balance",        accessor: (r: typeof exportData[number]) => r.balance },
    { header: "Recorded By",    accessor: (r: typeof exportData[number]) => r.recordedBy },
    { header: "Authorised By",  accessor: (r: typeof exportData[number]) => r.authorisedBy },
    { header: "Receipt Ref",    accessor: (r: typeof exportData[number]) => r.receiptRef },
    { header: "Current Balance",accessor: (r: typeof exportData[number]) => r.currentBalance },
    { header: "Child Manages",  accessor: (r: typeof exportData[number]) => r.childManages },
  ];

  if (isLoading) {
    return (
      <PageShell title="Young Person Savings" subtitle="Individual savings accounts, transactions, goals and financial independence tracking">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Young Person Savings"
      subtitle="Individual savings accounts, transactions, goals and financial independence tracking"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="yp-savings" />
          <PrintButton title="Young Person Savings" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> New Transaction
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { l: "Accounts",       v: stats.accounts, icon: PiggyBank, c: "text-pink-600" },
            { l: "Total Saved",    v: `£${stats.totalBalance.toFixed(2)}`, icon: Wallet, c: "text-green-600" },
            { l: "Total Deposits", v: `£${stats.totalDeposits.toFixed(2)}`, icon: TrendingUp, c: "text-blue-600" },
            { l: "Avg Balance",    v: `£${stats.avgBalance}`, icon: PiggyBank, c: "text-purple-600" },
            { l: "Self-Managed",   v: stats.selfManaged, icon: TrendingUp, c: "text-amber-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* per-child cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {records.map((acc) => (
            <div key={acc.id} className="rounded-lg border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{getYPName(acc.child_id)}</h3>
                <span className="text-lg font-bold text-green-600">£{acc.current_balance.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{acc.account_type} · {acc.provider} · {acc.child_manages ? "Self-managed" : "Staff-managed"}</p>
              {/* goals progress */}
              {acc.savings_goals.map((g, i) => {
                const pct = Math.min((g.current / g.target) * 100, 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{g.goal}</span>
                      <span>£{g.current}/£{g.target}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search accounts…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {records.map((a) => <SelectItem key={a.child_id} value={a.child_id}>{getYPName(a.child_id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="balance">Balance</option>
              <option value="name">Name</option>
              <option value="provider">Provider</option>
            </select>
          </div>
        </div>

        {filtered.map((acc) => (
          <div key={acc.id} className="rounded-lg border bg-white overflow-hidden">
            <button onClick={() => setExpanded(expanded === acc.id ? null : acc.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <PiggyBank className="h-5 w-5 text-pink-500" />
                <div className="text-left">
                  <h3 className="font-semibold">{getYPName(acc.child_id)}</h3>
                  <p className="text-xs text-muted-foreground">{acc.account_type} · {acc.provider} · £{acc.current_balance.toFixed(2)} · {acc.transactions.length} transactions</p>
                </div>
              </div>
              {expanded === acc.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded === acc.id && (
              <div className="border-t p-4 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 pr-3">Date</th>
                        <th className="pb-2 pr-3">Type</th>
                        <th className="pb-2 pr-3">Description</th>
                        <th className="pb-2 pr-3 text-right">Amount</th>
                        <th className="pb-2 pr-3 text-right">Balance</th>
                        <th className="pb-2 pr-3">Recorded By</th>
                        <th className="pb-2">Ref</th>
                      </tr>
                    </thead>
                    <tbody>
                      {acc.transactions.map((t) => (
                        <tr key={t.id} className="border-b last:border-0">
                          <td className="py-2 pr-3 whitespace-nowrap">{t.date}</td>
                          <td className="py-2 pr-3">{YP_SAVINGS_TRANSACTION_TYPE_LABEL[t.type]}</td>
                          <td className="py-2 pr-3">{t.description}</td>
                          <td className={cn("py-2 pr-3 text-right font-medium", t.amount >= 0 ? "text-green-600" : "text-red-600")}>
                            {t.amount >= 0 ? <TrendingUp className="inline h-3 w-3 mr-1" /> : <TrendingDown className="inline h-3 w-3 mr-1" />}
                            £{Math.abs(t.amount).toFixed(2)}
                          </td>
                          <td className="py-2 pr-3 text-right">£{t.balance.toFixed(2)}</td>
                          <td className="py-2 pr-3">{getStaffName(t.recorded_by)}</td>
                          <td className="py-2 text-xs text-muted-foreground">{t.receipt_ref}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {acc.notes && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <h4 className="text-sm font-semibold mb-1">Notes</h4>
                    <p className="text-sm text-muted-foreground">{acc.notes}</p>
                  </div>
                )}

                {/* smart link panel */}
                <SmartLinkPanel
                  sourceType="yp-savings-account-record"
                  sourceId={acc.id}
                  childId={acc.child_id}
                  compact
                />
              </div>
            )}
          </div>
        ))}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Reg 20 / Leaving Care Act 2000</strong> — Children&apos;s homes should support young people to develop financial skills and build savings. Savings must be transparently managed with appropriate oversight. For care leavers, financial preparation is a key element of pathway planning.
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Transaction</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <select className="rounded border px-3 py-2 text-sm"><option value="">Young Person…</option>{records.map((a) => <option key={a.child_id} value={a.child_id}>{getYPName(a.child_id)}</option>)}</select>
            <select className="rounded border px-3 py-2 text-sm"><option value="">Transaction type…</option>{(Object.keys(YP_SAVINGS_TRANSACTION_TYPE_LABEL) as YPSavingsTransactionType[]).map((k) => <option key={k} value={k}>{YP_SAVINGS_TRANSACTION_TYPE_LABEL[k]}</option>)}</select>
            <input placeholder="Description" className="rounded border px-3 py-2 text-sm" />
            <input type="number" step="0.01" placeholder="Amount (£)" className="rounded border px-3 py-2 text-sm" />
            <input type="date" className="rounded border px-3 py-2 text-sm" />
            <input placeholder="Receipt reference" className="rounded border px-3 py-2 text-sm" />
          </div>
          <DialogFooter>
            <button onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => setShowDialog(false)} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">Record Transaction</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
