// ══════════════════════════════════════════════════════════════════════════════
// Cara Governance Dashboard — Admin overview of AI governance system
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import Link from "next/link";

const GOVERNANCE_MODULES = [
  {
    title: "Providers",
    description: "View available AI providers, capabilities, and connectivity status",
    href: "/cara/governance/providers",
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    colour: "from-blue-500 to-cyan-500",
  },
  {
    title: "Model Routing",
    description: "Task-to-model routing rules, risk classification, and fallback chains",
    href: "/cara/governance/routing",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    colour: "from-violet-500 to-purple-500",
  },
  {
    title: "Audit Log",
    description: "Complete audit trail of all AI operations with governance metadata",
    href: "/cara/governance/audit",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    colour: "from-gray-500 to-slate-600",
  },
  {
    title: "Cost Control",
    description: "Budget monitoring, per-user and per-home limits, usage trends",
    href: "/cara/governance/costs",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    colour: "from-emerald-500 to-green-500",
  },
  {
    title: "Safety & Redaction",
    description: "PII detection, data sensitivity classification, and provider restrictions",
    href: "/cara/governance/safety",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    colour: "from-red-500 to-rose-500",
  },
  {
    title: "Approvals",
    description: "Human approval queue, pending reviews, and approval history",
    href: "/cara/governance/approvals",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z",
    colour: "from-amber-500 to-orange-500",
  },
];

export default function CaraGovernancePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Cara Intelligence Governance</h1>
        <p className="text-muted-foreground mt-1">
          Manage AI providers, routing rules, safety controls, approvals, and audit compliance.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Active Providers" value="4" subtext="of 13 configured" />
        <StatCard label="Today&apos;s Requests" value="—" subtext="across all homes" />
        <StatCard label="Pending Approvals" value="—" subtext="awaiting review" />
        <StatCard label="Monthly Spend" value="—" subtext="of £2,000 budget" />
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {GOVERNANCE_MODULES.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group rounded-lg border border-border bg-card p-5 hover:bg-[var(--cs-surface)] transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${mod.colour} flex items-center justify-center shrink-0`}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mod.icon} />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Governance Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Governance Principles</h4>
        <ul className="mt-2 space-y-1 text-xs text-blue-700 dark:text-blue-400">
          <li>• AI never makes final decisions — all high-risk outputs require human approval</li>
          <li>• Personal data is redacted before external processing — PII never leaves the system</li>
          <li>• Every AI request is audited with full provenance (never raw prompts)</li>
          <li>• Role-based access controls restrict AI capabilities per user role</li>
          <li>• Cost limits prevent runaway spend at per-request, daily, and monthly levels</li>
          <li>• Provider routing ensures data sensitivity never exceeds provider clearance</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
    </div>
  );
}
