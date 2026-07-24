"use client";

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function CaraGovernancePage() {
  const links = [
    { label: "Approvals", href: "/cara/governance/approvals", desc: "AI feature approvals & gating" },
    { label: "Audit Trail", href: "/cara/governance/audit", desc: "AI call audit log" },
    { label: "Usage & Costs", href: "/cara/governance/costs", desc: "API call metering & credit usage" },
    { label: "Providers", href: "/cara/governance/providers", desc: "AI provider configuration" },
    { label: "Routing", href: "/cara/governance/routing", desc: "Model routing & fallback logic" },
    { label: "Safety", href: "/cara/governance/safety", desc: "Injection guard & response safety" },
  ];

  return (
    <PageShell title="Cara Intelligence Governance" subtitle="AI governance hub">
      <div className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--cs-cara-gold)]" />
              AI Governance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--cs-surface)]">
              <AlertCircle className="h-5 w-5 text-[var(--cs-text-muted)] shrink-0 mt-0.5" />
              <div className="text-sm leading-relaxed">
                <p className="font-medium text-[var(--cs-navy)] mb-1">Governance Hub</p>
                <p className="text-[var(--cs-text-secondary)]">
                  Centralised control for AI feature enablement, audit trails, cost metering, provider management, routing, and safety guardrails.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="p-4 rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface-elevated)] hover:shadow-[var(--cs-shadow-card)] transition-all hover:-translate-y-0.5"
                >
                  <div className="font-medium text-sm text-[var(--cs-navy)]">{link.label}</div>
                  <div className="text-xs text-[var(--cs-text-muted)] mt-1">{link.desc}</div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
