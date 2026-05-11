"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DOCUMENT COMPLIANCE CARD
// Dashboard widget showing document expiry alerts, read-and-sign completion
// rates, and outstanding document actions.
// Quality Standards — Reg 37 (Organisation and Management).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDocuments } from "@/hooks/use-documents";
import { useStaff } from "@/hooks/use-staff";
import { cn, todayStr, daysFromNow } from "@/lib/utils";
import {
  FileText, Loader2, AlertTriangle, CheckCircle2,
  Clock, FileCheck, Shield, BookOpen,
} from "lucide-react";

// ── Component ───────────────────────────────────────────────────────────────

export function DocumentComplianceCard() {
  const docsQuery = useDocuments();
  const staffQuery = useStaff();
  const documents = docsQuery.data?.data ?? [];
  const receipts = docsQuery.data?.receipts ?? [];
  const allStaff = (staffQuery.data?.data ?? []).filter((s) => s.is_active);

  const {
    total, expired, expiringSoon,
    requireSign, signCompletionPct, fullySignedCount,
    outstandingDocs, hasAlert,
  } = useMemo(() => {
    const today = todayStr();
    const soon = daysFromNow(30);
    const expired = documents.filter((d) => d.expiry_date && d.expiry_date < today);
    const expiringSoon = documents.filter((d) => d.expiry_date && d.expiry_date >= today && d.expiry_date <= soon);
    const requireSign = documents.filter((d) => d.requires_read_sign);

    const staffCount = allStaff.length || 1;
    let totalSignable = 0;
    let totalSigned = 0;
    let fullySignedCount = 0;
    const outstandingDocs: { id: string; title: string; outstanding: number }[] = [];

    for (const doc of requireSign) {
      const signedIds = new Set(receipts.filter((r) => r.document_id === doc.id && r.signed_at).map((r) => r.staff_id));
      totalSignable += staffCount;
      totalSigned += signedIds.size;
      if (signedIds.size >= staffCount) {
        fullySignedCount++;
      } else {
        outstandingDocs.push({
          id: doc.id,
          title: doc.title,
          outstanding: staffCount - signedIds.size,
        });
      }
    }

    const signCompletionPct = totalSignable > 0 ? Math.round((totalSigned / totalSignable) * 100) : 100;
    outstandingDocs.sort((a, b) => b.outstanding - a.outstanding);

    return {
      total: documents.length,
      expired: expired.length,
      expiringSoon: expiringSoon.length,
      requireSign: requireSign.length,
      signCompletionPct,
      fullySignedCount,
      outstandingDocs: outstandingDocs.slice(0, 4),
      hasAlert: expired.length > 0 || signCompletionPct < 80,
    };
  }, [documents, receipts, allStaff]);

  if (docsQuery.isPending) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <FileText className="h-4 w-4 text-blue-500" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(hasAlert && "border-amber-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <FileText className="h-4 w-4 text-blue-500" />
            Documents
          </CardTitle>
          <Link href="/documents">
            <Badge className="text-[9px] bg-blue-100 text-blue-700 border-0 rounded-full hover:bg-blue-200 cursor-pointer">
              View all
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-blue-50 p-2 text-center">
            <BookOpen className="h-3 w-3 text-blue-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-blue-700 tabular-nums">{total}</div>
            <div className="text-[9px] text-blue-500">Total</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", expired > 0 ? "bg-red-50" : "bg-emerald-50")}>
            <AlertTriangle className={cn("h-3 w-3 mx-auto mb-0.5", expired > 0 ? "text-red-500" : "text-emerald-500")} />
            <div className={cn("text-sm font-bold tabular-nums", expired > 0 ? "text-red-700" : "text-emerald-700")}>{expired}</div>
            <div className={cn("text-[9px]", expired > 0 ? "text-red-500" : "text-emerald-500")}>Expired</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", expiringSoon > 0 ? "bg-amber-50" : "bg-[var(--cs-surface)]")}>
            <Clock className={cn("h-3 w-3 mx-auto mb-0.5", expiringSoon > 0 ? "text-amber-500" : "text-[var(--cs-text-muted)]")} />
            <div className={cn("text-sm font-bold tabular-nums", expiringSoon > 0 ? "text-amber-700" : "text-[var(--cs-text-muted)]")}>{expiringSoon}</div>
            <div className={cn("text-[9px]", expiringSoon > 0 ? "text-amber-500" : "text-[var(--cs-text-muted)]")}>Expiring</div>
          </div>
        </div>

        {/* Read & Sign completion */}
        {requireSign > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] px-1">
              <span className="flex items-center gap-1 text-[var(--cs-text-muted)]">
                <FileCheck className="h-3 w-3" /> Read & Sign
              </span>
              <span className={cn(
                "font-bold tabular-nums",
                signCompletionPct >= 90 ? "text-emerald-600" : signCompletionPct >= 70 ? "text-amber-600" : "text-red-600",
              )}>
                {signCompletionPct}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--cs-surface)] overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  signCompletionPct >= 90 ? "bg-emerald-500" : signCompletionPct >= 70 ? "bg-amber-500" : "bg-red-500",
                )}
                style={{ width: `${signCompletionPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-[var(--cs-text-muted)] px-1">
              <span>{fullySignedCount} of {requireSign} fully signed</span>
            </div>
          </div>
        )}

        {/* Expired document alert */}
        {expired > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-red-700">
                {expired} expired document{expired !== 1 ? "s" : ""}
              </p>
              <p className="text-[10px] text-red-600">
                Review and update expired policies to maintain compliance
              </p>
            </div>
          </div>
        )}

        {/* Outstanding sign-offs */}
        {outstandingDocs.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-[var(--cs-text-muted)] px-1">Outstanding Sign-offs</span>
            {outstandingDocs.map((doc) => (
              <Link key={doc.id} href="/documents">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--cs-surface)] transition-colors">
                  <Shield className="h-3 w-3 text-[var(--cs-aria-gold)] shrink-0" />
                  <span className="text-[11px] font-medium text-[var(--cs-text-secondary)] flex-1 truncate">
                    {doc.title}
                  </span>
                  <Badge className="text-[8px] px-1.5 py-0 rounded-full border-0 bg-amber-100 text-amber-700">
                    {doc.outstanding} pending
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* All clear */}
        {expired === 0 && expiringSoon === 0 && outstandingDocs.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              All documents compliant
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
