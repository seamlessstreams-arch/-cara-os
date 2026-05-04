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

/* ── types ─────────────────────────────────────────────────────────────── */

type TransactionType = "deposit" | "withdrawal" | "birthday_money" | "holiday_allowance" | "savings_interest" | "leaving_care_grant" | "education_grant" | "other";

interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  description: string;
  amount: number;
  balance: number;
  recordedBy: string;
  authorisedBy: string | null;
  receiptRef: string;
}

interface SavingsAccount {
  id: string;
  youngPersonId: string;
  accountType: string;
  provider: string;
  openedDate: string;
  currentBalance: number;
  monthlyTarget: number;
  transactions: Transaction[];
  savingsGoals: { goal: string; target: number; current: number }[];
  childManages: boolean;
  notes: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const TX_LABELS: Record<TransactionType, string> = {
  deposit: "Deposit", withdrawal: "Withdrawal", birthday_money: "Birthday Money",
  holiday_allowance: "Holiday Allowance", savings_interest: "Interest",
  leaving_care_grant: "Leaving Care Grant", education_grant: "Education Grant", other: "Other",
};

const SEED: SavingsAccount[] = [
  {
    id: "sv1", youngPersonId: "yp_alex", accountType: "Junior ISA", provider: "Nationwide",
    openedDate: d(-365), currentBalance: 485.20, monthlyTarget: 30,
    transactions: [
      { id: "tx1", date: d(-60), type: "deposit", description: "Monthly savings — March", amount: 30, balance: 395.20, recordedBy: "staff_anna", authorisedBy: null, receiptRef: "SV-0112" },
      { id: "tx2", date: d(-30), type: "deposit", description: "Monthly savings — April", amount: 30, balance: 425.20, recordedBy: "staff_anna", authorisedBy: null, receiptRef: "SV-0118" },
      { id: "tx3", date: d(-15), type: "birthday_money", description: "Birthday money from grandmother", amount: 50, balance: 475.20, recordedBy: "staff_anna", authorisedBy: null, receiptRef: "SV-0121" },
      { id: "tx4", date: d(-5), type: "savings_interest", description: "Quarterly interest", amount: 3.50, balance: 478.70, recordedBy: "staff_anna", authorisedBy: null, receiptRef: "SV-0124" },
      { id: "tx5", date: d(-1), type: "deposit", description: "Monthly savings — May", amount: 30, balance: 508.70, recordedBy: "staff_anna", authorisedBy: null, receiptRef: "SV-0126" },
      { id: "tx6", date: d(-1), type: "withdrawal", description: "Alex requested £23.50 for new headphones", amount: -23.50, balance: 485.20, recordedBy: "staff_anna", authorisedBy: "staff_darren", receiptRef: "SV-0127" },
    ],
    savingsGoals: [
      { goal: "Laptop for college", target: 400, current: 280 },
      { goal: "Driving lessons fund", target: 500, current: 0 },
    ],
    childManages: false,
    notes: "Alex saves £30/month from allowance. Birthday and holiday money also deposited. Alex is involved in decisions about withdrawals but doesn't independently manage the account yet. Working towards independent management as part of independence pathway.",
  },
  {
    id: "sv2", youngPersonId: "yp_jordan", accountType: "Young Saver Account", provider: "Halifax",
    openedDate: d(-180), currentBalance: 165.00, monthlyTarget: 15,
    transactions: [
      { id: "tx7", date: d(-60), type: "deposit", description: "Monthly savings — March", amount: 15, balance: 120.00, recordedBy: "staff_ryan", authorisedBy: null, receiptRef: "SV-0113" },
      { id: "tx8", date: d(-30), type: "deposit", description: "Monthly savings — April", amount: 15, balance: 135.00, recordedBy: "staff_ryan", authorisedBy: null, receiptRef: "SV-0119" },
      { id: "tx9", date: d(-10), type: "holiday_allowance", description: "Summer holiday spending money contribution", amount: 20, balance: 155.00, recordedBy: "staff_ryan", authorisedBy: null, receiptRef: "SV-0122" },
      { id: "tx10", date: d(-1), type: "deposit", description: "Monthly savings — May", amount: 15, balance: 170.00, recordedBy: "staff_ryan", authorisedBy: null, receiptRef: "SV-0125" },
      { id: "tx11", date: d(-1), type: "withdrawal", description: "Jordan wanted new art supplies", amount: -5.00, balance: 165.00, recordedBy: "staff_ryan", authorisedBy: null, receiptRef: "SV-0128" },
    ],
    savingsGoals: [
      { goal: "Summer holiday spending money", target: 100, current: 75 },
    ],
    childManages: false,
    notes: "Jordan saves a smaller amount (£15/month) appropriate to age and understanding. Jordan is aware of the account and chooses small items to spend on. Staff manage the account. Jordan's understanding of money is developing — included in independence skills work.",
  },
  {
    id: "sv3", youngPersonId: "yp_casey", accountType: "Current Account + Savings", provider: "Monzo",
    openedDate: d(-120), currentBalance: 1240.00, monthlyTarget: 80,
    transactions: [
      { id: "tx12", date: d(-60), type: "deposit", description: "Monthly savings — March", amount: 80, balance: 980.00, recordedBy: "staff_darren", authorisedBy: null, receiptRef: "SV-0114" },
      { id: "tx13", date: d(-30), type: "deposit", description: "Monthly savings — April", amount: 80, balance: 1060.00, recordedBy: "staff_darren", authorisedBy: null, receiptRef: "SV-0120" },
      { id: "tx14", date: d(-20), type: "education_grant", description: "16-19 Bursary Fund payment from college", amount: 100, balance: 1160.00, recordedBy: "staff_darren", authorisedBy: null, receiptRef: "SV-0123" },
      { id: "tx15", date: d(-1), type: "deposit", description: "Monthly savings — May", amount: 80, balance: 1240.00, recordedBy: "staff_darren", authorisedBy: null, receiptRef: "SV-0129" },
    ],
    savingsGoals: [
      { goal: "Deposit for flat (first month + deposit)", target: 1500, current: 1240 },
      { goal: "Household essentials for new home", target: 300, current: 0 },
    ],
    childManages: true,
    notes: "Casey manages own Monzo account independently (age 16+). Uses spending insights to track categories. Savings automatically ring-fenced in pots. Casey is building deposit fund for semi-independent living. Excellent financial management — key worker supports with budgeting conversations monthly.",
  },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function YPSavingsPage() {
  const [data] = useState<SavingsAccount[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("balance");
  const [showDialog, setShowDialog] = useState(false);

  const stats = useMemo(() => {
    const totalBalance = data.reduce((s, a) => s + a.currentBalance, 0);
    const totalDeposits = data.flatMap((a) => a.transactions).filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    return {
      accounts: data.length,
      totalBalance,
      totalDeposits,
      selfManaged: data.filter((a) => a.childManages).length,
      avgBalance: Math.round(totalBalance / data.length),
    };
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterYP !== "all") list = list.filter((a) => a.youngPersonId === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => getYPName(a.youngPersonId).toLowerCase().includes(q) || a.provider.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":    return a.youngPersonId.localeCompare(b.youngPersonId);
        case "provider":return a.provider.localeCompare(b.provider);
        default:        return b.currentBalance - a.currentBalance;
      }
    });
    return list;
  }, [data, filterYP, search, sortBy]);

  const exportData = useMemo(() => data.flatMap((a) => a.transactions.map((t) => ({
    youngPerson: getYPName(a.youngPersonId),
    accountType: a.accountType,
    provider: a.provider,
    date: t.date,
    type: TX_LABELS[t.type],
    description: t.description,
    amount: t.amount.toFixed(2),
    balance: t.balance.toFixed(2),
    recordedBy: getStaffName(t.recordedBy),
    authorisedBy: t.authorisedBy ? getStaffName(t.authorisedBy) : "",
    receiptRef: t.receiptRef,
    currentBalance: a.currentBalance.toFixed(2),
    childManages: a.childManages ? "Yes" : "No",
  }))), [data]);

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
          {data.map((acc) => (
            <div key={acc.id} className="rounded-lg border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{getYPName(acc.youngPersonId)}</h3>
                <span className="text-lg font-bold text-green-600">£{acc.currentBalance.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{acc.accountType} · {acc.provider} · {acc.childManages ? "Self-managed" : "Staff-managed"}</p>
              {/* goals progress */}
              {acc.savingsGoals.map((g, i) => {
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
              {data.map((a) => <SelectItem key={a.youngPersonId} value={a.youngPersonId}>{getYPName(a.youngPersonId)}</SelectItem>)}
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
                  <h3 className="font-semibold">{getYPName(acc.youngPersonId)}</h3>
                  <p className="text-xs text-muted-foreground">{acc.accountType} · {acc.provider} · £{acc.currentBalance.toFixed(2)} · {acc.transactions.length} transactions</p>
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
                          <td className="py-2 pr-3">{TX_LABELS[t.type]}</td>
                          <td className="py-2 pr-3">{t.description}</td>
                          <td className={cn("py-2 pr-3 text-right font-medium", t.amount >= 0 ? "text-green-600" : "text-red-600")}>
                            {t.amount >= 0 ? <TrendingUp className="inline h-3 w-3 mr-1" /> : <TrendingDown className="inline h-3 w-3 mr-1" />}
                            £{Math.abs(t.amount).toFixed(2)}
                          </td>
                          <td className="py-2 pr-3 text-right">£{t.balance.toFixed(2)}</td>
                          <td className="py-2 pr-3">{getStaffName(t.recordedBy)}</td>
                          <td className="py-2 text-xs text-muted-foreground">{t.receiptRef}</td>
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
            <select className="rounded border px-3 py-2 text-sm"><option value="">Young Person…</option>{data.map((a) => <option key={a.youngPersonId} value={a.youngPersonId}>{getYPName(a.youngPersonId)}</option>)}</select>
            <select className="rounded border px-3 py-2 text-sm"><option value="">Transaction type…</option>{Object.entries(TX_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
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
