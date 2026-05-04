"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  PiggyBank,
  Wallet,
  ArrowUpDown,
  Search,
  TrendingUp,
  Target,
  Calendar,
  Info,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

type AccountType =
  | "Junior ISA"
  | "Children's Current Account"
  | "Savings Account"
  | "Cash Card Account";

type SupportLevel = "Independent" | "Supervised" | "Joint signatory";

type TransactionType = "Deposit" | "Withdrawal" | "Interest";

interface Transaction {
  date: string;
  type: TransactionType;
  amount: number;
  description: string;
  supportedBy: string;
}

interface BankAccount {
  id: string;
  youngPerson: string;
  accountType: AccountType;
  bankProvider: string;
  accountLast4: string;
  opened: string;
  childIsAccountHolder: boolean;
  corporateParentSignatory: string;
  depositSchedule: string;
  currentBalance: number;
  savingsTarget?: number;
  recentTransactions: Transaction[];
  monthlyAllowance: number;
  financialLiteracySkills: Record<string, string>;
  savingsGoals: string[];
  parentalContributions: string;
  lookedAfterChildEntitlements: string[];
  supportLevel: SupportLevel;
  reviewedDate: string;
  reviewedBy: string;
  childAgreed: boolean;
  nextReviewDate: string;
}

/* ── helpers ───────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const fmtMoney = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });

/* ── seed (illustrative — no real account numbers) ─────────────────────── */

const SEED: BankAccount[] = [
  {
    id: "ba_alex",
    youngPerson: "yp_alex",
    accountType: "Junior ISA",
    bankProvider: "NatWest Adapt — Junior Cash ISA",
    accountLast4: "**** 4231",
    opened: d(-720),
    childIsAccountHolder: true,
    corporateParentSignatory: "Local Authority Corporate Parent (signatory until age 16)",
    depositSchedule: "£20 weekly pocket money + £15 weekly savings + LAC £200 annual top-up",
    currentBalance: 1284.55,
    savingsTarget: 2000,
    recentTransactions: [
      { date: d(-2),  type: "Deposit",    amount: 35,  description: "Weekly pocket money + savings transfer", supportedBy: "staff_darren" },
      { date: d(-9),  type: "Deposit",    amount: 35,  description: "Weekly pocket money + savings transfer", supportedBy: "staff_anna" },
      { date: d(-16), type: "Withdrawal", amount: 12,  description: "Trip to cinema with peers — Alex chose budget",  supportedBy: "staff_darren" },
      { date: d(-30), type: "Interest",   amount: 4.18, description: "Monthly Junior ISA interest credit",      supportedBy: "staff_darren" },
      { date: d(-45), type: "Deposit",    amount: 200, description: "LAC corporate parent annual savings top-up", supportedBy: "staff_darren" },
    ],
    monthlyAllowance: 80,
    financialLiteracySkills: {
      "Reading bank statements":   "Confident",
      "Budgeting weekly money":    "Confident",
      "Using a debit card":        "Developing",
      "Online banking app":        "Confident",
      "Understanding interest":    "Developing",
      "Recognising scams":         "Developing",
    },
    savingsGoals: [
      "New laptop for college (£600 — on track)",
      "Driving lessons fund (£800 — long-term)",
      "Emergency buffer (£200 — achieved)",
    ],
    parentalContributions: "Birthday gift £40 from mother (Apr) — banked by Alex with key worker support.",
    lookedAfterChildEntitlements: [
      "Junior ISA government / LA top-up: £200 per year while looked after",
      "Setting Up Home Allowance ring-fenced (claimed at 18)",
      "Care leaver bursary (16+) for education",
    ],
    supportLevel: "Supervised",
    reviewedDate: d(-12),
    reviewedBy: "staff_darren",
    childAgreed: true,
    nextReviewDate: d(78),
  },
  {
    id: "ba_jordan",
    youngPerson: "yp_jordan",
    accountType: "Children's Current Account",
    bankProvider: "Nationwide FlexOne (11–17)",
    accountLast4: "**** 8867",
    opened: d(-300),
    childIsAccountHolder: true,
    corporateParentSignatory: "Local Authority Corporate Parent (joint until age 16)",
    depositSchedule: "£18 weekly pocket money + £10 weekly savings",
    currentBalance: 412.30,
    savingsTarget: 600,
    recentTransactions: [
      { date: d(-1),  type: "Deposit",    amount: 28,  description: "Weekly pocket money + savings transfer",   supportedBy: "staff_anna" },
      { date: d(-4),  type: "Withdrawal", amount: 8.50, description: "School trip contribution — Jordan paid contactless", supportedBy: "staff_anna" },
      { date: d(-8),  type: "Deposit",    amount: 28,  description: "Weekly pocket money + savings transfer",   supportedBy: "staff_darren" },
      { date: d(-15), type: "Withdrawal", amount: 25,  description: "New trainers (with key worker — budgeted)", supportedBy: "staff_darren" },
      { date: d(-22), type: "Deposit",    amount: 28,  description: "Weekly pocket money + savings transfer",   supportedBy: "staff_anna" },
    ],
    monthlyAllowance: 72,
    financialLiteracySkills: {
      "Reading bank statements":   "Developing",
      "Budgeting weekly money":    "Developing",
      "Using a debit card":        "Confident",
      "Online banking app":        "Confident",
      "Understanding interest":    "Emerging",
      "Recognising scams":         "Emerging",
    },
    savingsGoals: [
      "Bike upgrade (£350 — saving)",
      "Birthday-present fund for siblings (£50 — achieved each year)",
    ],
    parentalContributions: "No regular contributions; grandmother sent £25 voucher at Christmas — Jordan chose to bank £15.",
    lookedAfterChildEntitlements: [
      "Junior ISA opened separately with LA top-up",
      "Care leaver entitlements briefing scheduled at 15+",
    ],
    supportLevel: "Joint signatory",
    reviewedDate: d(-25),
    reviewedBy: "staff_anna",
    childAgreed: true,
    nextReviewDate: d(20),
  },
  {
    id: "ba_casey",
    youngPerson: "yp_casey",
    accountType: "Savings Account",
    bankProvider: "Nationwide Future Saver",
    accountLast4: "**** 1059",
    opened: d(-540),
    childIsAccountHolder: true,
    corporateParentSignatory: "Local Authority Corporate Parent (joint signatory)",
    depositSchedule: "£15 weekly pocket money + £15 weekly savings + ad-hoc earnings",
    currentBalance: 856.90,
    savingsTarget: 1000,
    recentTransactions: [
      { date: d(-3),  type: "Deposit",    amount: 30,  description: "Weekly pocket money + savings transfer",   supportedBy: "staff_darren" },
      { date: d(-10), type: "Deposit",    amount: 30,  description: "Weekly pocket money + savings transfer",   supportedBy: "staff_anna" },
      { date: d(-17), type: "Withdrawal", amount: 18,  description: "Art supplies — Casey researched best price", supportedBy: "staff_anna" },
      { date: d(-24), type: "Interest",   amount: 2.41, description: "Monthly savings interest",                supportedBy: "staff_darren" },
      { date: d(-31), type: "Deposit",    amount: 50,  description: "Babysitting earnings — paid by family friend (consented & risk-assessed)", supportedBy: "staff_darren" },
    ],
    monthlyAllowance: 60,
    financialLiteracySkills: {
      "Reading bank statements":   "Confident",
      "Budgeting weekly money":    "Confident",
      "Using a debit card":        "Developing",
      "Online banking app":        "Confident",
      "Understanding interest":    "Confident",
      "Recognising scams":         "Developing",
    },
    savingsGoals: [
      "First-flat starter kit (£500 — saving towards Setting Up Home Allowance complement)",
      "College course materials (£200 — achieved)",
      "Holiday with friends (£300 — saving)",
    ],
    parentalContributions: "Birth-mother sends £10 monthly when able (irregular) — Casey decides whether to bank or spend with key worker.",
    lookedAfterChildEntitlements: [
      "Junior ISA with annual government / LA £200 top-up",
      "Setting Up Home Allowance (£2,000 ring-fenced for age 18)",
      "Care leaver education bursary",
      "16+ leaving care financial pathway plan",
    ],
    supportLevel: "Independent",
    reviewedDate: d(-5),
    reviewedBy: "staff_darren",
    childAgreed: true,
    nextReviewDate: d(85),
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const SUPPORT_META: Record<SupportLevel, { colour: string }> = {
  "Independent":     { colour: "bg-green-100 text-green-700" },
  "Supervised":      { colour: "bg-amber-100 text-amber-700" },
  "Joint signatory": { colour: "bg-blue-100 text-blue-700" },
};

const SKILL_COLOUR: Record<string, string> = {
  "Confident":  "bg-green-100 text-green-700",
  "Developing": "bg-amber-100 text-amber-700",
  "Emerging":   "bg-orange-100 text-orange-700",
};

const TX_COLOUR: Record<TransactionType, string> = {
  "Deposit":    "bg-green-100 text-green-700",
  "Withdrawal": "bg-red-100 text-red-700",
  "Interest":   "bg-blue-100 text-blue-700",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildBankAccountPage() {
  const [data] = useState<BankAccount[]>(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("balance");

  const stats = useMemo(() => {
    const today = new Date();
    const in30 = new Date(); in30.setDate(today.getDate() + 30);
    return {
      activeAccounts: data.length,
      totalSaved: data.reduce((s, r) => s + r.currentBalance, 0),
      meetingGoals: data.filter((r) => r.savingsTarget && r.currentBalance >= r.savingsTarget * 0.5).length,
      reviewsDue: data.filter((r) => {
        const nr = new Date(r.nextReviewDate);
        return nr >= today && nr <= in30;
      }).length,
    };
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterType !== "all") list = list.filter((r) => r.accountType === filterType);
    if (filterYP !== "all")   list = list.filter((r) => r.youngPerson === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.bankProvider.toLowerCase().includes(q) ||
        r.accountType.toLowerCase().includes(q) ||
        r.savingsGoals.join(" ").toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "yp":      return a.youngPerson.localeCompare(b.youngPerson);
        case "review":  return a.nextReviewDate.localeCompare(b.nextReviewDate);
        case "type":    return a.accountType.localeCompare(b.accountType);
        default:        return b.currentBalance - a.currentBalance;
      }
    });
    return list;
  }, [data, filterType, filterYP, search, sortBy]);

  const exportCols: ExportColumn<BankAccount>[] = [
    { header: "Young Person",       accessor: (r: BankAccount) => getYPName(r.youngPerson) },
    { header: "Account Type",       accessor: (r: BankAccount) => r.accountType },
    { header: "Bank Provider",      accessor: (r: BankAccount) => r.bankProvider },
    { header: "Account (last 4)",   accessor: (r: BankAccount) => r.accountLast4 },
    { header: "Opened",             accessor: (r: BankAccount) => r.opened },
    { header: "Child Account Holder", accessor: (r: BankAccount) => r.childIsAccountHolder ? "Yes" : "No" },
    { header: "Corporate Parent Signatory", accessor: (r: BankAccount) => r.corporateParentSignatory },
    { header: "Deposit Schedule",   accessor: (r: BankAccount) => r.depositSchedule },
    { header: "Current Balance",    accessor: (r: BankAccount) => fmtMoney(r.currentBalance) },
    { header: "Savings Target",     accessor: (r: BankAccount) => r.savingsTarget ? fmtMoney(r.savingsTarget) : "—" },
    { header: "Monthly Allowance",  accessor: (r: BankAccount) => fmtMoney(r.monthlyAllowance) },
    { header: "Savings Goals",      accessor: (r: BankAccount) => r.savingsGoals.join("; ") },
    { header: "Parental Contributions", accessor: (r: BankAccount) => r.parentalContributions },
    { header: "LAC Entitlements",   accessor: (r: BankAccount) => r.lookedAfterChildEntitlements.join("; ") },
    { header: "Support Level",      accessor: (r: BankAccount) => r.supportLevel },
    { header: "Reviewed Date",      accessor: (r: BankAccount) => r.reviewedDate },
    { header: "Reviewed By",        accessor: (r: BankAccount) => getStaffName(r.reviewedBy) },
    { header: "Child Agreed",       accessor: (r: BankAccount) => r.childAgreed ? "Yes" : "No" },
    { header: "Next Review",        accessor: (r: BankAccount) => r.nextReviewDate },
  ];

  const ypIds = [...new Set(data.map((r) => r.youngPerson))];
  const types = [...new Set(data.map((r) => r.accountType))];

  return (
    <PageShell
      title="Child Bank Account & Money Management"
      subtitle="QS1 — Child-centred care · financial literacy · transition preparation"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="child-bank-accounts" />
          <PrintButton title="Child Bank Account & Money Management" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* Banner */}
        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <strong>Financial literacy & corporate parent responsibility.</strong> Every child has the right to their own bank account, savings, and to learn money skills appropriate to their age. As corporate parent we ensure each looked-after child accesses the Junior ISA government top-up, supports independence, and prepares for transition. <em>This page shows illustrative demonstration data only — no real account numbers, sort codes or credentials are stored here. Identifiers shown use last-4-digits format.</em>
            </div>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Active Accounts",        v: stats.activeAccounts,             icon: Wallet,     c: "text-blue-600" },
            { l: "Total Saved (illus.)",   v: fmtMoney(stats.totalSaved),       icon: PiggyBank,  c: "text-green-600" },
            { l: "Meeting Savings Goals",  v: `${stats.meetingGoals}/${data.length}`, icon: Target, c: "text-purple-600" },
            { l: "Reviews Due (30d)",      v: stats.reviewsDue,                 icon: Calendar,   c: "text-amber-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* Filters / sort */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search provider, account type, goal…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Account type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Account Types</SelectItem>
              {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {ypIds.map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="balance">Balance (high → low)</option>
              <option value="review">Next Review</option>
              <option value="type">Account Type</option>
              <option value="yp">Young Person</option>
            </select>
          </div>
        </div>

        {/* Cards */}
        {filtered.map((rec) => {
          const open = expandedId === rec.id;
          const goalProgress = rec.savingsTarget
            ? Math.min(100, Math.round((rec.currentBalance / rec.savingsTarget) * 100))
            : null;

          return (
            <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
              <button
                onClick={() => setExpandedId(open ? null : rec.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <PiggyBank className="h-5 w-5 text-brand" />
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{getYPName(rec.youngPerson)}</h3>
                      <span className="text-sm text-muted-foreground">— {rec.accountType}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SUPPORT_META[rec.supportLevel].colour)}>
                        {rec.supportLevel}
                      </span>
                      {rec.childAgreed && (
                        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-700">Child agreed</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {rec.bankProvider} · {rec.accountLast4} · Balance {fmtMoney(rec.currentBalance)}
                      {rec.savingsTarget && ` · Target ${fmtMoney(rec.savingsTarget)} (${goalProgress}%)`}
                    </p>
                  </div>
                </div>
                {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {open && (
                <div className="border-t p-4 space-y-4">
                  {/* Top facts */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Opened:</span> {rec.opened}</div>
                    <div><span className="text-muted-foreground">Child Holder:</span> {rec.childIsAccountHolder ? "Yes" : "No"}</div>
                    <div><span className="text-muted-foreground">Monthly Allowance:</span> {fmtMoney(rec.monthlyAllowance)}</div>
                    <div><span className="text-muted-foreground">Reviewed:</span> {rec.reviewedDate} ({getStaffName(rec.reviewedBy)})</div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 text-sm">
                    <p><span className="font-semibold">Corporate parent signatory:</span> {rec.corporateParentSignatory}</p>
                    <p className="mt-1"><span className="font-semibold">Deposit schedule:</span> {rec.depositSchedule}</p>
                  </div>

                  {/* Savings progress */}
                  {rec.savingsTarget && goalProgress !== null && (
                    <div>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="font-semibold flex items-center gap-1"><Target className="h-4 w-4" /> Savings progress</span>
                        <span className="text-muted-foreground">{fmtMoney(rec.currentBalance)} / {fmtMoney(rec.savingsTarget)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded bg-gray-100">
                        <div className="h-full bg-brand" style={{ width: `${goalProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Transactions */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Recent transactions (illustrative)</h4>
                    <div className="space-y-2">
                      {rec.recentTransactions.map((t, i) => (
                        <div key={i} className="rounded border p-2 text-sm flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <span className={cn("rounded px-2 py-0.5 text-xs font-medium", TX_COLOUR[t.type])}>{t.type}</span>
                            <div>
                              <p className="text-sm">{t.description}</p>
                              <p className="text-xs text-muted-foreground">{t.date} · supported by {getStaffName(t.supportedBy)}</p>
                            </div>
                          </div>
                          <span className={cn("font-semibold whitespace-nowrap", t.type === "Withdrawal" ? "text-red-700" : "text-green-700")}>
                            {t.type === "Withdrawal" ? "−" : "+"}{fmtMoney(t.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><GraduationCap className="h-4 w-4" /> Financial literacy skills</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(rec.financialLiteracySkills).map(([skill, level]) => (
                        <div key={skill} className="flex items-center justify-between rounded border px-3 py-1.5 text-sm">
                          <span>{skill}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SKILL_COLOUR[level] || "bg-gray-100 text-gray-700")}>
                            {level}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Goals */}
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Savings goals</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {rec.savingsGoals.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>

                  {/* Contributions */}
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">Parental / family contributions</h4>
                    <p className="text-sm text-blue-900">{rec.parentalContributions}</p>
                  </div>

                  {/* Entitlements */}
                  <div className="rounded-lg bg-green-50 p-3">
                    <h4 className="text-sm font-semibold text-green-800 mb-1 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" /> Looked-after child entitlements
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-900">
                      {rec.lookedAfterChildEntitlements.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>

                  {/* Review */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm rounded-lg border p-3">
                    <div><span className="text-muted-foreground">Last review:</span> {rec.reviewedDate}</div>
                    <div><span className="text-muted-foreground">Reviewed by:</span> {getStaffName(rec.reviewedBy)}</div>
                    <div><span className="text-muted-foreground">Next review:</span> {rec.nextReviewDate}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Regulatory note */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Quality Standard 1 — child-centred care &amp; preparation for adulthood.</strong> Children&apos;s homes must support each looked-after child to have their own bank account where appropriate, build financial literacy aligned to their age and stage, and access entitlements such as the Junior ISA government top-up, Setting Up Home Allowance and care leaver bursaries. Money management is reviewed with the child, their views recorded, and the corporate parent acts as a responsible signatory until the young person is ready to act independently. Account credentials and full numbers are <em>never</em> stored in this system — only last-4 identifiers and labelled illustrative balances for review purposes.
        </div>
      </div>
    </PageShell>
  );
}
