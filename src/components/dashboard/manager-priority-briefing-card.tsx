"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Radar, ArrowRight, AlertOctagon, ShieldAlert, AlertTriangle, Eye } from "lucide-react";

/**
 * Lightweight entry card for the Command Centre.
 *
 * Deliberately does NOT call /api/v1/manager-priority-briefing — that endpoint
 * fans out to 78 engines, all of which the dashboard already renders as their
 * own cards, so fetching it here would redundantly re-compute ~25% of the
 * dashboard on every load. The live, ranked briefing lives one click away on its
 * own page, where the manager explicitly accepts the sweep cost.
 */
export function ManagerPriorityBriefingCard() {
  return (
    <Card className="overflow-hidden border-2 border-indigo-300">
      <CardContent className="p-0">
        <Link
          href="/priority-briefing"
          className="group flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-white p-4 transition-colors hover:from-indigo-100"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Radar className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Priority Briefing</span>
              <span className="rounded-full border border-indigo-200 bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                All engines
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              Your single &ldquo;what needs my attention&rdquo; view — critical signals ranked across all 78 intelligence engines.
            </p>
            <div className="mt-1.5 flex items-center gap-2 text-slate-400">
              <AlertOctagon className="h-3.5 w-3.5 text-[--cs-risk]" />
              <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />
              <AlertTriangle className="h-3.5 w-3.5 text-[--cs-warning]" />
              <Eye className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11px]">critical · high · warning · watch</span>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-indigo-400 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-600" />
        </Link>
      </CardContent>
    </Card>
  );
}
