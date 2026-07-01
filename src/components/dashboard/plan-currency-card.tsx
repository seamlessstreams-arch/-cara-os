"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, ArrowRight } from "lucide-react";
import { usePlanCurrency } from "@/hooks/use-plan-currency";
import { cn } from "@/lib/utils";

/**
 * Command Centre entry card for the Plan Currency Register.
 * Live — surfaces how many statutory child plans are overdue for review across
 * every child, turning red when any plan is out of date.
 */
export function PlanCurrencyCard() {
  const { data } = usePlanCurrency();
  const s = data?.summary;
  const overdue = s?.overdue ?? 0;
  const hot = overdue > 0;

  return (
    <Card className={cn("overflow-hidden border-2", hot ? "border-[--cs-risk-soft]" : "border-slate-300")}>
      <CardContent className="p-0">
        <Link
          href="/plan-currency"
          className={cn(
            "group flex items-center gap-4 bg-gradient-to-r p-4 transition-colors",
            hot ? "from-[--cs-risk-bg] to-white hover:from-[--cs-risk-soft]" : "from-slate-50 to-white hover:from-slate-100",
          )}
        >
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm", hot ? "bg-[--cs-risk]" : "bg-slate-600")}>
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Plan Currency</span>
              <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                Plans in date?
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              {s
                ? `${overdue > 0 ? `${overdue} plan${overdue === 1 ? "" : "s"} overdue for review` : "All plans in date"} — ${s.currency_rate}% currency across every child.`
                : "Are every child's statutory plans reviewed and kept in date?"}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" />
        </Link>
      </CardContent>
    </Card>
  );
}
