"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONSENT MANAGEMENT INTELLIGENCE CARD
// Dashboard card for consent status, expiries, and evidence tracking.
// CHR 2015 Reg 7/8/14/32. SCCIF: Overall Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardSignature, ChevronRight, AlertTriangle, Brain,
  CheckCircle2, Clock, FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_records: 32,
  granted_count: 24,
  refused_count: 2,
  pending_count: 3,
  expired_count: 2,
  withdrawn_count: 1,
  consent_coverage: 100,
  evidence_on_file_rate: 78.1,
  expiring_soon: 4,
  medical_consent_rate: 100,
  emergency_consent_rate: 83.3,
};

const DEMO_CONSENTS: {
  child: string;
  category: string;
  status: string;
  expiry: string | null;
  givenBy: string;
}[] = [
  { child: "Child A", category: "Medical Treatment", status: "granted", expiry: "2026-06-01", givenBy: "Parent (Mother)" },
  { child: "Child B", category: "Emergency Medical", status: "pending", expiry: null, givenBy: "Local Authority" },
  { child: "Child C", category: "Photographs", status: "granted", expiry: "2026-05-20", givenBy: "Parent (Father)" },
  { child: "Child A", category: "Outings & Trips", status: "granted", expiry: "2026-12-31", givenBy: "Parent (Mother)" },
  { child: "Child D", category: "Therapy/Counselling", status: "refused", expiry: null, givenBy: "Young Person" },
  { child: "Child E", category: "Information Sharing", status: "granted", expiry: "2026-03-01", givenBy: "Local Authority" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "no_emergency_consent", severity: "critical", message: "1 child does not have emergency medical consent on file — this must be obtained urgently." },
  { type: "consent_expired", severity: "high", message: "Information sharing consent for Child E expired on 2026-03-01 — do not proceed without renewed consent." },
  { type: "consent_expiring", severity: "medium", message: "Photographs consent for Child C expires 2026-05-20 — arrange renewal." },
];

const ARIA_INSIGHTS = [
  "32 consent records across 6 children. 24 granted, 3 pending, 2 expired, 2 refused, 1 withdrawn. Medical consent: 100% coverage. Emergency medical: 83.3% — 1 child missing. Evidence on file: 78.1%.",
  "Priority: Child B's emergency medical consent is pending from the local authority — escalate immediately. Child E has an expired information-sharing consent that needs urgent renewal before any data can be shared with partner agencies.",
  "Recommendation: Schedule a quarterly consent audit. 4 consents are expiring within 30 days. Consider adding consent renewal reminders to the staff handover checklist to prevent lapses.",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  granted: { label: "Granted", color: "text-green-700 bg-green-50 border-green-200" },
  refused: { label: "Refused", color: "text-red-700 bg-red-50 border-red-200" },
  pending: { label: "Pending", color: "text-amber-700 bg-amber-50 border-amber-200" },
  expired: { label: "Expired", color: "text-gray-700 bg-gray-50 border-gray-200" },
  withdrawn: { label: "Withdrawn", color: "text-orange-700 bg-orange-50 border-orange-200" },
};

// ── Component ────────────────────────────────────────────────────────────────

export function ConsentManagementCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardSignature className="h-4 w-4 text-brand" />
            Consent Management
          </CardTitle>
          <Link href="/consent-management" className="text-xs text-brand hover:underline flex items-center gap-1">
            Consents <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{m.granted_count}</p>
            <p className="text-[10px] text-muted-foreground">Granted</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.pending_count === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.pending_count === 0 ? "text-green-600" : "text-amber-600")}>
              {m.pending_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.expired_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.expired_count === 0 ? "text-green-600" : "text-red-600")}>
              {m.expired_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Expired</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.expiring_soon === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.expiring_soon === 0 ? "text-green-600" : "text-amber-600")}>
              {m.expiring_soon}
            </p>
            <p className="text-[10px] text-muted-foreground">Expiring</p>
          </div>
        </div>

        {/* ── Consent records ─────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <FileWarning className="h-3 w-3" />
            Consent Records
          </p>
          <div className="space-y-1">
            {DEMO_CONSENTS.map((c, i) => {
              const badge = STATUS_BADGES[c.status] ?? STATUS_BADGES.pending;
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium">{c.child}</span>
                    <span className="text-muted-foreground truncate">{c.category}</span>
                    {c.status === "granted" && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                    {c.status === "pending" && <Clock className="h-3 w-3 text-amber-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {c.expiry && <span className="text-muted-foreground">{c.expiry}</span>}
                    <Badge variant="outline" className={cn("text-[10px]", badge.color)}>
                      {badge.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Consent Alerts
            </p>
            {DEMO_ALERTS.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  alert.severity === "critical" || alert.severity === "high"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ───────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Consent Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-blue-200 bg-blue-50 text-blue-800"
                  : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-green-200 bg-green-50 text-green-800",
              )}
            >
              {insight}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
