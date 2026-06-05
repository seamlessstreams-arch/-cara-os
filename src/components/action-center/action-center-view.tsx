"use client";

import Link from "next/link";
import {
  Siren, ShieldAlert, MessageSquare, ClipboardCheck, CheckCircle2, ChevronRight, Loader2, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActionCenter, type ActionItem } from "@/hooks/use-action-center";

const CATEGORY_ICON = {
  emergency: Siren,
  staffing: ShieldAlert,
  comms: MessageSquare,
  approval: ClipboardCheck,
} as const;

const SEV_STYLE: Record<string, { dot: string; border: string }> = {
  critical: { dot: "text-[var(--cs-avisaar-coral)]", border: "border-[var(--cs-avisaar-coral)]/40" },
  attention: { dot: "text-amber-600", border: "border-amber-300" },
  info: { dot: "text-[var(--cs-text-muted)]", border: "border-[var(--cs-border)]" },
};

export function ActionCenterView() {
  const { data, isLoading } = useActionCenter();

  if (isLoading || !data) {
    return <div className="p-10 text-center"><Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)] mx-auto" /></div>;
  }

  if (data.total === 0) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl border border-[var(--cs-teal-soft)] bg-[var(--cs-teal-bg)] p-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-[var(--cs-teal)] mx-auto mb-2" />
        <p className="text-lg font-bold text-[var(--cs-navy)]">You're all caught up</p>
        <p className="text-sm text-[var(--cs-text-secondary)] mt-1">No emergencies, acknowledgements, staffing alerts or sign-offs need you right now.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Bell className="h-4 w-4 text-[var(--cs-teal)]" />
        <p className="text-sm font-semibold text-[var(--cs-navy)]">
          {data.total} item{data.total === 1 ? "" : "s"} need your attention
          {data.critical > 0 && <span className="text-[var(--cs-avisaar-coral)]"> · {data.critical} urgent</span>}
        </p>
      </div>

      {data.items.map((item: ActionItem) => {
        const Icon = CATEGORY_ICON[item.category] ?? Bell;
        const sev = SEV_STYLE[item.severity] ?? SEV_STYLE.info;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn("group flex items-start gap-3 rounded-2xl border bg-white p-4 hover:bg-[var(--cs-surface)] transition-colors", sev.border)}
          >
            <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", sev.dot)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--cs-navy)]">{item.title}</p>
              {item.detail && <p className="text-xs text-[var(--cs-text-muted)] mt-0.5">{item.detail}</p>}
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--cs-text-muted)] group-hover:text-[var(--cs-teal)] mt-0.5" />
          </Link>
        );
      })}
    </div>
  );
}
