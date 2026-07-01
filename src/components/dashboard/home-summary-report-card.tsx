"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ArrowRight } from "lucide-react";

/**
 * Lightweight Command Centre entry card for the Home Summary Report.
 * Link-only (no fetch) — the report endpoint fans out to 41 engines the
 * dashboard already renders, so fetching it here would be redundant.
 */
export function HomeSummaryReportCard() {
  return (
    <Card className="overflow-hidden border-2 border-[--cs-success-soft]">
      <CardContent className="p-0">
        <Link
          href="/home-summary-report"
          className="group flex items-center gap-4 bg-gradient-to-r from-[--cs-success-bg] to-white p-4 transition-colors hover:from-[--cs-success-soft]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[--cs-success] text-white shadow-sm">
            <FileText className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Home Summary Report</span>
              <span className="rounded-full border border-[--cs-success-soft] bg-[--cs-success-bg] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[--cs-success]">
                Print-ready
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              One-click shareable summary of the home&rsquo;s standing across six domains — for the LA, board or a review.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-[--cs-success]/50 transition-transform group-hover:translate-x-0.5 group-hover:text-[--cs-success]" />
        </Link>
      </CardContent>
    </Card>
  );
}
