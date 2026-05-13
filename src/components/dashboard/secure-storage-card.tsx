"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SECURE STORAGE & RECORDS ACCESS INTELLIGENCE CARD
// CHR 2015 Reg 39, Reg 40; GDPR / UK DPA 2018.
// SCCIF: Leadership & Management — "Records are stored securely."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lock, ChevronRight, AlertTriangle, Brain,
  FileKey, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = {
  total_events: 22,
  storage_audits: 4,
  data_breaches: 0,
  fully_compliant_rate: 86.4,
  gdpr_compliant_rate: 95.5,
  encryption_verified_rate: 81.8,
  non_compliant_count: 1,
  review_overdue_count: 2,
};

const DEMO_RECORDS: { type: string; date: string; location: string; compliance: string }[] = [
  { type: "Storage Audit", date: "10 May", location: "Locked Cabinet", compliance: "Fully Compliant" },
  { type: "Access Log", date: "8 May", location: "Encrypted Digital", compliance: "Fully Compliant" },
  { type: "Backup Check", date: "5 May", location: "Cloud Storage", compliance: "Mostly Compliant" },
  { type: "Retention Review", date: "3 May", location: "Secure Room", compliance: "Fully Compliant" },
  { type: "SAR", date: "1 May", location: "Encrypted Digital", compliance: "Partially Compliant" },
  { type: "Access Log", date: "28 Apr", location: "Cloud Storage", compliance: "Non-Compliant" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "non_compliant", severity: "high", message: "Non-compliant records storage finding on 28 Apr (access log) — address immediately per Reg 39." },
  { type: "encryption_not_verified", severity: "medium", message: "2 digital/cloud storage records have unverified encryption — verify encryption status." },
  { type: "review_overdue", severity: "medium", message: "2 records storage reviews are overdue — schedule review." },
];

const ARIA_INSIGHTS = [
  "22 records events. Audits: 4. Breaches: 0. Full compliance: 86.4%. GDPR: 95.5%. Encryption verified: 81.8%.",
  "Priority: 1 non-compliant finding outstanding. 2 digital records with unverified encryption. 2 reviews overdue. Zero breaches — maintain vigilance.",
  "Positive: 0 data breaches. 86.4% full compliance strong. GDPR at 95.5%. Regular audits happening. Consider automated encryption verification for digital records.",
];

const COMPLIANCE_BADGES: Record<string, { label: string; color: string }> = {
  "Fully Compliant": { label: "Compliant", color: "text-green-700 bg-green-50 border-green-200" },
  "Mostly Compliant": { label: "Mostly", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  "Partially Compliant": { label: "Partial", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Non-Compliant": { label: "Non-Comp", color: "text-red-700 bg-red-50 border-red-200" },
};

export function SecureStorageCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4 text-brand" />
            Secure Storage & Records
          </CardTitle>
          <Link href="/secure-storage" className="text-xs text-brand hover:underline flex items-center gap-1">
            Records <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{m.fully_compliant_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Compliant</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.data_breaches > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.data_breaches > 0 ? "text-red-600" : "text-green-600")}>{m.data_breaches}</p>
            <p className="text-[10px] text-muted-foreground">Breaches</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.gdpr_compliant_rate}%</p>
            <p className="text-[10px] text-muted-foreground">GDPR</p>
          </div>
          <div className="text-center rounded-lg bg-purple-50 p-2">
            <p className="text-lg font-bold tabular-nums text-purple-600">{m.encryption_verified_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Encrypted</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><FileKey className="h-3 w-3" />Recent Events</p>
          <div className="space-y-1">
            {DEMO_RECORDS.map((r, i) => {
              const badge = COMPLIANCE_BADGES[r.compliance] ?? COMPLIANCE_BADGES["Fully Compliant"];
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CheckCircle2 className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="font-medium">{r.type}</span>
                    <span className="text-muted-foreground truncate">{r.date} · {r.location}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Storage Alerts</p>
            {DEMO_ALERTS.map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Records Intelligence</p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
