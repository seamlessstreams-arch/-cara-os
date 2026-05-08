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
import type {
  ChildBankAccount,
  ChildBankAccountType,
  ChildBankSupportLevel,
  ChildBankTransactionType,
} from "@/types/extended";
import {
  CHILD_BANK_ACCOUNT_TYPE_LABEL,
  CHILD_BANK_SUPPORT_LEVEL_LABEL,
  CHILD_BANK_TRANSACTION_TYPE_LABEL,
} from "@/types/extended";
import { useChildBankAccounts } from "@/hooks/use-child-bank-accounts";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";

/* ── helpers ───────────────────────────────────────────────────────────── */

const fmtMoney = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP" });

/* ── constants ─────────────────────────────────────────────────────────── */

const SUPPORT_META: Record<ChildBankSupportLevel, { colour: string }> = {
  independent: { colour: "bg-green-100 text-green-700" },
  supervised: { colour: "bg-amber-100 text-amber-700" },
  joint_signatory: { colour: "bg-blue-100 text-blue-700" },
};

const SKILL_COLOUR: Record<string, string> = {
  "Confident":  "bg-green-100 text-green-700",
  "Developing": "bg-amber-100 text-amber-700",
  "Emerging":   "bg-orange-100 text-orange-700",
};

const TX_COLOUR: Record<ChildBankTransactionType, string> = {
  deposit: "bg-green-100 text-green-700",
  withdrawal: "bg-red-100 text-red-700",
  interest: "bg-blue-100 text-blue-700",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildBankAccountPage() {
  const { data: resp, isLoading } = useChildBankAccounts();
  const data = resp?.data ?? [];

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
      totalSaved: data.reduce((s, r) => s + r.current_balance, 0),
      meetingGoals: data.filter((r) => r.savings_target && r.current_balance >= r.savings_target * 0.5).length,
      reviewsDue: data.filter((r) => {
        const nr = new Date(r.next_review_date);
        return nr >= today && nr <= in30;
      }).length,
    };
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterType !== "all") list = list.filter((r) => r.account_type === filterType);
    if (filterYP !== "all")   list = list.filter((r) => r.child_id === filterYP);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.bank_provider.toLowerCase().includes(q) ||
        CHILD_BANK_ACCOUNT_TYPE_LABEL[r.account_type].toLowerCase().includes(q) ||
        r.savings_goals.join(" ").toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "yp":      return a.child_id.localeCompare(b.child_id);
        case "review":  return a.next_review_date.localeCompare(b.next_review_date);
        case "type":    return a.account_type.localeCompare(b.account_type);
        default:        return b.current_balance - a.current_balance;
      }
    });
    return list;
  }, [data, filterType, filterYP, search, sortBy]);

  const exportCols: ExportColumn<ChildBankAccount>[] = [
    { header: "Young Person",       accessor: (r: ChildBankAccount) => getYPName(r.child_id) },
    { header: "Account Type",       accessor: (r: ChildBankAccount) => CHILD_BANK_ACCOUNT_TYPE_LABEL[r.account_type] },
    { header: "Bank Provider",      accessor: (r: ChildBankAccount) => r.bank_provider },
    { header: "Account (last 4)",   accessor: (r: ChildBankAccount) => r.account_last4 },
    { header: "Opened",             accessor: (r: ChildBankAccount) => r.opened },
    { header: "Child Account Holder", accessor: (r: ChildBankAccount) => r.child_is_account_holder ? "Yes" : "No" },
    { header: "Corporate Parent Signatory", accessor: (r: ChildBankAccount) => r.corporate_parent_signatory },
    { header: "Deposit Schedule",   accessor: (r: ChildBankAccount) => r.deposit_schedule },
    { header: "Current Balance",    accessor: (r: ChildBankAccount) => fmtMoney(r.current_balance) },
    { header: "Savings Target",     accessor: (r: ChildBankAccount) => r.savings_target ? fmtMoney(r.savings_target) : "—" },
    { header: "Monthly Allowance",  accessor: (r: ChildBankAccount) => fmtMoney(r.monthly_allowance) },
    { header: "Savings Goals",      accessor: (r: ChildBankAccount) => r.savings_goals.join("; ") },
    { header: "Parental Contributions", accessor: (r: ChildBankAccount) => r.parental_contributions },
    { header: "LAC Entitlements",   accessor: (r: ChildBankAccount) => r.looked_after_child_entitlements.join("; ") },
    { header: "Support Level",      accessor: (r: ChildBankAccount) => CHILD_BANK_SUPPORT_LEVEL_LABEL[r.support_level] },
    { header: "Reviewed Date",      accessor: (r: ChildBankAccount) => r.reviewed_date },
    { header: "Reviewed By",        accessor: (r: ChildBankAccount) => getStaffName(r.reviewed_by) },
    { header: "Child Agreed",       accessor: (r: ChildBankAccount) => r.child_agreed ? "Yes" : "No" },
    { header: "Next Review",        accessor: (r: ChildBankAccount) => r.next_review_date },
  ];

  const ypIds = [...new Set(data.map((r) => r.child_id))];
  const types = [...new Set(data.map((r) => r.account_type))];

  if (isLoading) {
    return (
      <PageShell
        title="Child Bank Account & Money Management"
        subtitle="QS1 — Child-centred care · financial literacy · transition preparation"
      >
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading bank account data…</div>
      </PageShell>
    );
  }

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
              {types.map((t) => <SelectItem key={t} value={t}>{CHILD_BANK_ACCOUNT_TYPE_LABEL[t]}</SelectItem>)}
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
          const goalProgress = rec.savings_target
            ? Math.min(100, Math.round((rec.current_balance / rec.savings_target) * 100))
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
                      <h3 className="font-semibold">{getYPName(rec.child_id)}</h3>
                      <span className="text-sm text-muted-foreground">— {CHILD_BANK_ACCOUNT_TYPE_LABEL[rec.account_type]}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", SUPPORT_META[rec.support_level].colour)}>
                        {CHILD_BANK_SUPPORT_LEVEL_LABEL[rec.support_level]}
                      </span>
                      {rec.child_agreed && (
                        <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-700">Child agreed</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {rec.bank_provider} · {rec.account_last4} · Balance {fmtMoney(rec.current_balance)}
                      {rec.savings_target && ` · Target ${fmtMoney(rec.savings_target)} (${goalProgress}%)`}
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
                    <div><span className="text-muted-foreground">Child Holder:</span> {rec.child_is_account_holder ? "Yes" : "No"}</div>
                    <div><span className="text-muted-foreground">Monthly Allowance:</span> {fmtMoney(rec.monthly_allowance)}</div>
                    <div><span className="text-muted-foreground">Reviewed:</span> {rec.reviewed_date} ({getStaffName(rec.reviewed_by)})</div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 text-sm">
                    <p><span className="font-semibold">Corporate parent signatory:</span> {rec.corporate_parent_signatory}</p>
                    <p className="mt-1"><span className="font-semibold">Deposit schedule:</span> {rec.deposit_schedule}</p>
                  </div>

                  {/* Savings progress */}
                  {rec.savings_target && goalProgress !== null && (
                    <div>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="font-semibold flex items-center gap-1"><Target className="h-4 w-4" /> Savings progress</span>
                        <span className="text-muted-foreground">{fmtMoney(rec.current_balance)} / {fmtMoney(rec.savings_target)}</span>
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
                      {rec.recent_transactions.map((t, i) => (
                        <div key={i} className="rounded border p-2 text-sm flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <span className={cn("rounded px-2 py-0.5 text-xs font-medium", TX_COLOUR[t.type])}>{CHILD_BANK_TRANSACTION_TYPE_LABEL[t.type]}</span>
                            <div>
                              <p className="text-sm">{t.description}</p>
                              <p className="text-xs text-muted-foreground">{t.date} · supported by {getStaffName(t.supported_by)}</p>
                            </div>
                          </div>
                          <span className={cn("font-semibold whitespace-nowrap", t.type === "withdrawal" ? "text-red-700" : "text-green-700")}>
                            {t.type === "withdrawal" ? "−" : "+"}{fmtMoney(t.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-1"><GraduationCap className="h-4 w-4" /> Financial literacy skills</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(rec.financial_literacy_skills).map(([skill, level]) => (
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
                      {rec.savings_goals.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>

                  {/* Contributions */}
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">Parental / family contributions</h4>
                    <p className="text-sm text-blue-900">{rec.parental_contributions}</p>
                  </div>

                  {/* Entitlements */}
                  <div className="rounded-lg bg-green-50 p-3">
                    <h4 className="text-sm font-semibold text-green-800 mb-1 flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4" /> Looked-after child entitlements
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-900">
                      {rec.looked_after_child_entitlements.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>

                  {/* Review */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm rounded-lg border p-3">
                    <div><span className="text-muted-foreground">Last review:</span> {rec.reviewed_date}</div>
                    <div><span className="text-muted-foreground">Reviewed by:</span> {getStaffName(rec.reviewed_by)}</div>
                    <div><span className="text-muted-foreground">Next review:</span> {rec.next_review_date}</div>
                  </div>

                  {/* Smart link panel */}
                  <SmartLinkPanel sourceType="child-bank-account" sourceId={rec.id} childId={rec.child_id} compact />
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
