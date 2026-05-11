"use client";

import React from "react";
import { useHandoverContext } from "@/hooks/use-handover-context";
import { getStaffName } from "@/lib/seed-data";

interface Props {
  incomingStaffIds: string[];
}

export function HandoverPrintContext({ incomingStaffIds }: Props) {
  const { data } = useHandoverContext(incomingStaffIds);
  const contexts = data?.data ?? [];

  if (contexts.length === 0) return null;

  return (
    <div className="hidden print:block mt-8 border-t-2 border-[var(--cs-border)] pt-4">
      <h3 className="text-sm font-bold text-[var(--cs-navy)] mb-3">
        ARIA Personalised Handover Context
      </h3>
      <p className="text-[10px] text-[var(--cs-text-muted)] mb-4">
        Context depth is determined by how long each incoming staff member has been away from shift.
      </p>
      {contexts.map((ctx) => (
        <div key={ctx.staff_id} className="mb-4 break-inside-avoid">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[var(--cs-navy)]">{ctx.staff_name}</span>
            <span className="text-[10px] text-[var(--cs-text-muted)]">
              ({ctx.context_depth} — {ctx.days_since_last_shift === null
                ? "no recent history"
                : ctx.days_since_last_shift === 0
                  ? "on shift today"
                  : `${ctx.days_since_last_shift} day${ctx.days_since_last_shift > 1 ? "s" : ""} since last shift`})
            </span>
          </div>
          <pre className="text-[10px] text-[var(--cs-text-secondary)] whitespace-pre-wrap font-sans leading-relaxed border-l-2 border-[var(--cs-border)] pl-3">
            {ctx.aria_summary}
          </pre>
        </div>
      ))}
    </div>
  );
}
