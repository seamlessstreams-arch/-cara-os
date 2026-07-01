"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ArrowRight } from "lucide-react";
import { useComplaintsClock } from "@/hooks/use-complaints-clock";
import { cn } from "@/lib/utils";

/**
 * Command Centre entry card for the Complaints Clock.
 * Live — surfaces how many complaints are open and (critically) past a statutory
 * deadline, turning red when a timescale has been breached.
 */
export function ComplaintsClockCard() {
  const { data } = useComplaintsClock();
  const s = data?.summary;
  const breached = s?.breached ?? 0;
  const hot = breached > 0;

  return (
    <Card className={cn("overflow-hidden border-2", hot ? "border-[--cs-risk-soft]" : "border-slate-300")}>
      <CardContent className="p-0">
        <Link
          href="/complaints-clock"
          className={cn(
            "group flex items-center gap-4 bg-gradient-to-r p-4 transition-colors",
            hot ? "from-[--cs-risk-bg] to-white hover:from-[--cs-risk-soft]" : "from-slate-50 to-white hover:from-slate-100",
          )}
        >
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm", hot ? "bg-[--cs-risk]" : "bg-slate-600")}>
            <Clock className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Complaints Clock</span>
              <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                Statutory timescales
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              {s
                ? `${s.open} open${breached > 0 ? `, ${breached} past deadline` : ""} — acknowledgement & response clocks tracked live.`
                : "Live countdown to every complaint's statutory acknowledgement & response deadlines."}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" />
        </Link>
      </CardContent>
    </Card>
  );
}
