"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, ArrowRight } from "lucide-react";
import { useShiftBriefing } from "@/hooks/use-shift-briefing";
import { cn } from "@/lib/utils";

/**
 * Command Centre entry card for the Shift Briefing.
 * Live — the auto-generated "what's due this shift" operational snapshot:
 * who's on duty, tasks & reviews due, open incidents to be aware of.
 * Red when any open incident, amber when work is due, calm otherwise.
 */
export function ShiftBriefingCard() {
  const { data } = useShiftBriefing();
  const s = data?.summary;
  const openInc = s?.open_incidents ?? 0;
  const due = (s?.tasks_due ?? 0) + (s?.reviews_due ?? 0);
  const tone = openInc > 0 ? "red" : due > 0 ? "amber" : "teal";

  const ring = tone === "red" ? "border-red-300" : tone === "amber" ? "border-amber-300" : "border-[var(--cs-teal)]";
  const grad = tone === "red" ? "from-red-50 to-white hover:from-red-100"
    : tone === "amber" ? "from-amber-50 to-white hover:from-amber-100"
    : "from-[var(--cs-teal-bg)] to-white hover:from-[var(--cs-teal-bg)]";
  const iconBg = tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-[var(--cs-teal-strong)]";

  return (
    <Card className={cn("overflow-hidden border-2", ring)}>
      <CardContent className="p-0">
        <Link href="/shift-briefing" className={cn("group flex items-center gap-4 bg-gradient-to-r p-4 transition-colors", grad)}>
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm", iconBg)}>
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Shift Briefing</span>
              <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                This shift
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              {s
                ? `${s.on_duty} on duty now · ${due} due this shift${openInc > 0 ? ` · ${openInc} open incident${openInc === 1 ? "" : "s"}` : ""}.`
                : "What must happen this shift — who's on, what's due, overnight events."}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" />
        </Link>
      </CardContent>
    </Card>
  );
}
