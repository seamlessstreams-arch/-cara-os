"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ListChecks, ArrowRight } from "lucide-react";
import { useActionsRegister } from "@/hooks/use-actions-register";
import { cn } from "@/lib/utils";

/**
 * Command Centre entry card for the Unified Actions Register.
 * Live (cheap single-engine fan-in) — surfaces how many agreed actions are open
 * and overdue across every forum, a view that exists nowhere else.
 */
export function ActionsRegisterCard() {
  const { data } = useActionsRegister();
  const s = data?.summary;
  const overdue = s?.overdue ?? 0;
  const hot = overdue > 0;

  return (
    <Card className={cn("overflow-hidden border-2", hot ? "border-amber-300" : "border-slate-300")}>
      <CardContent className="p-0">
        <Link
          href="/actions-register"
          className={cn(
            "group flex items-center gap-4 bg-gradient-to-r p-4 transition-colors",
            hot ? "from-amber-50 to-white hover:from-amber-100" : "from-slate-50 to-white hover:from-slate-100",
          )}
        >
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm", hot ? "bg-amber-500" : "bg-slate-600")}>
            <ListChecks className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Actions Register</span>
              <span className="rounded-full border border-slate-200 bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                Agreed actions
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              {s
                ? `${s.open} open${overdue > 0 ? `, ${overdue} overdue` : ""} — across reviews, supervisions, meetings, Reg 44 & audits.`
                : "Every agreed action in one place — what did we agree, and is it done?"}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" />
        </Link>
      </CardContent>
    </Card>
  );
}
