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
    <Card className="overflow-hidden border-2 border-emerald-300">
      <CardContent className="p-0">
        <Link
          href="/home-summary-report"
          className="group flex items-center gap-4 bg-gradient-to-r from-emerald-50 to-white p-4 transition-colors hover:from-emerald-100"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <FileText className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Home Summary Report</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Print-ready
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              One-click shareable summary of the home&rsquo;s standing across six domains — for the LA, board or a review.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-emerald-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
        </Link>
      </CardContent>
    </Card>
  );
}
