"use client";

import { useEffect, useState } from "react";

function ScoreBar({ label, value, max = 25 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colour = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : pct >= 40 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="mb-2">
      <div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="font-medium">{value}/{max}</span></div>
      <div className="w-full h-2 bg-gray-200 rounded"><div className={`${colour} h-2 rounded`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="bg-gray-50 rounded p-3 text-center"><p className="text-xs text-gray-500">{label}</p><p className="text-lg font-semibold">{String(value)}</p></div>;
}

function Section({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded mb-3">
      <button className="w-full flex justify-between items-center p-3 text-left font-medium text-sm" onClick={() => setOpen(!open)}>{title}<span>{open ? "▲" : "▼"}</span></button>
      {open && <div className="p-3 pt-0">{children}</div>}
    </div>
  );
}

function ratingBadge(rating: string) {
  const colours: Record<string, string> = { outstanding: "bg-green-100 text-green-800", good: "bg-yellow-100 text-yellow-800", requires_improvement: "bg-orange-100 text-orange-800", inadequate: "bg-red-100 text-red-800" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${colours[rating] ?? "bg-gray-100"}`}>{rating.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
}

export function ChildrenFundManagementIntelligenceWidget() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/children-fund-management")
      .then((r) => { if (!r.ok) throw new Error("Failed to load"); return r.json(); })
      .then((json) => setData(json.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse space-y-3 p-4"><div className="h-6 bg-gray-200 rounded w-2/3" /><div className="h-4 bg-gray-200 rounded w-1/2" /><div className="h-32 bg-gray-200 rounded" /></div>;
  if (error) return <div className="text-red-600 p-4 text-sm">Error loading children fund management intelligence: {error}</div>;
  if (!data) return null;

  const d = data as Record<string, unknown>;
  const account = d.accountManagement as Record<string, number>;
  const transaction = d.transactionIntegrity as Record<string, number>;
  const literacy = d.financialLiteracy as Record<string, number>;
  const audit = d.auditCompliance as Record<string, number>;
  const childProfiles = (d.childProfiles ?? []) as Record<string, unknown>[];
  const strengths = (d.strengths ?? []) as string[];
  const areas = (d.areasForImprovement ?? []) as string[];
  const actions = (d.actions ?? []) as string[];
  const regs = (d.regulatoryLinks ?? []) as string[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Children&apos;s Fund Management Intelligence</h2>
        {ratingBadge(d.rating as string)}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Stat label="Overall Score" value={`${d.overallScore}/100`} />
        <Stat label="Account Mgmt" value={`${account.overallScore}/25`} />
        <Stat label="Transaction Integrity" value={`${transaction.overallScore}/25`} />
        <Stat label="Total Accounts" value={account.totalAccounts} />
      </div>

      <Section title="Account Management" defaultOpen>
        <ScoreBar label="Account Management Score" value={account.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Active Rate" value={`${account.activeRate}%`} />
          <Stat label="Reconciled" value={`${account.reconciledRate}%`} />
          <Stat label="Child Access" value={`${account.childAccessRate}%`} />
          <Stat label="Signed Agreement" value={`${account.signedAgreementRate}%`} />
          <Stat label="Overdue" value={account.overdueCount} />
          <Stat label="Total Savings" value={`£${account.totalSavings}`} />
        </div>
      </Section>

      <Section title="Transaction Integrity">
        <ScoreBar label="Transaction Integrity Score" value={transaction.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Transactions" value={transaction.totalTransactions} />
          <Stat label="Receipt Rate" value={`${transaction.receiptRate}%`} />
          <Stat label="Consent Rate" value={`${transaction.consentRate}%`} />
          <Stat label="Two Signatures" value={`${transaction.twoSignatureRate}%`} />
          <Stat label="Avg Transaction" value={`£${transaction.averageTransaction}`} />
        </div>
      </Section>

      <Section title="Financial Literacy">
        <ScoreBar label="Financial Literacy Score" value={literacy.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Sessions" value={literacy.totalSessions} />
          <Stat label="Engagement" value={`${literacy.engagementRate}%`} />
          <Stat label="Practical" value={`${literacy.practicalRate}%`} />
          <Stat label="Age Appropriate" value={`${literacy.ageAppropriateRate}%`} />
          <Stat label="Topic Coverage" value={`${literacy.topicCoverage}%`} />
        </div>
      </Section>

      <Section title="Audit Compliance">
        <ScoreBar label="Audit Compliance Score" value={audit.overallScore} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Stat label="Total Audits" value={audit.totalAudits} />
          <Stat label="All Reconciled" value={`${audit.allReconciledRate}%`} />
          <Stat label="Receipt Compliant" value={`${audit.receiptCompliantRate}%`} />
          <Stat label="Two-Sig Compliant" value={`${audit.twoSigCompliantRate}%`} />
          <Stat label="Discrepancy Resolved" value={`${audit.discrepancyRate}%`} />
          <Stat label="Policy Compliant" value={`${audit.policyCompliantRate}%`} />
        </div>
      </Section>

      {childProfiles.length > 0 && (
        <Section title={`Child Profiles (${childProfiles.length})`}>
          {childProfiles.map((c) => (
            <div key={c.childId as string} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex justify-between text-sm font-medium"><span>{c.childName as string}</span><span>{c.overallScore as number}/10</span></div>
              <p className="text-xs text-gray-500 mt-1">Status: {String(c.accountStatus).replace(/_/g, " ")} · Balance: £{c.balance as number} · Savings: £{c.savingsBalance as number}</p>
              <p className="text-xs text-gray-500 mt-1">{c.transactionCount as number} transaction(s) · {c.literacySessions as number} literacy session(s) · {c.consentRate as number}% consent</p>
            </div>
          ))}
        </Section>
      )}

      {strengths.length > 0 && <Section title="Strengths"><ul className="text-sm space-y-1">{strengths.map((s, i) => <li key={i} className="text-green-700">✓ {s}</li>)}</ul></Section>}
      {areas.length > 0 && <Section title="Areas for Improvement"><ul className="text-sm space-y-1">{areas.map((a, i) => <li key={i} className="text-orange-700">⚠ {a}</li>)}</ul></Section>}
      {actions.length > 0 && <Section title="Actions"><ul className="text-sm space-y-1">{actions.map((a, i) => <li key={i}>{a}</li>)}</ul></Section>}
      <Section title="Regulatory Links"><ul className="text-sm text-gray-600 space-y-1">{regs.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
    </div>
  );
}
