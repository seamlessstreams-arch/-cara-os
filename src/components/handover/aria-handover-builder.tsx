"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Sparkles, Clock, ChevronDown, ChevronUp, Loader2,
  AlertTriangle, BookOpen, CheckSquare, User,
} from "lucide-react";
import { useHandoverContext, type StaffHandoverContext } from "@/hooks/use-handover-context";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";

const DEPTH_CONFIG = {
  brief: { label: "Brief", color: "bg-emerald-100 text-emerald-700", description: "Was on shift recently" },
  standard: { label: "Standard", color: "bg-blue-100 text-blue-700", description: "2-3 days away" },
  comprehensive: { label: "Comprehensive", color: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]", description: "4+ days away" },
};

function StaffContextCard({ ctx }: { ctx: StaffHandoverContext }) {
  const [expanded, setExpanded] = useState(false);
  const depthCfg = DEPTH_CONFIG[ctx.context_depth];
  const firstName = ctx.staff_name.split(" ")[0];

  return (
    <div className="rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--cs-surface)] transition-colors"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`${ctx.staff_name} handover context`}
      >
        <Avatar name={ctx.staff_name} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--cs-navy)]">{ctx.staff_name}</span>
            <Badge className={cn("text-[9px] rounded-full", depthCfg.color)}>
              {depthCfg.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock className="h-3 w-3 text-[var(--cs-text-muted)]" />
            <span className="text-[11px] text-[var(--cs-text-muted)]">
              {ctx.days_since_last_shift === null
                ? "No recent shift history"
                : ctx.days_since_last_shift === 0
                  ? "On shift today"
                  : ctx.days_since_last_shift === 1
                    ? "Last on shift yesterday"
                    : `Last on shift ${ctx.days_since_last_shift} days ago`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ctx.missed_events.incidents > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              {ctx.missed_events.incidents}
            </span>
          )}
          {ctx.missed_events.daily_logs > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--cs-text-muted)]">
              <BookOpen className="h-3 w-3" />
              {ctx.missed_events.daily_logs}
            </span>
          )}
          {expanded
            ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted)]" />
            : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted)]" />
          }
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--cs-border-subtle)] px-4 py-3 space-y-3">
          {/* Missed events summary */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center rounded-lg bg-orange-50 px-2 py-1.5">
              <div className="text-sm font-bold text-orange-700">{ctx.missed_events.incidents}</div>
              <div className="text-[9px] text-orange-600">Incidents</div>
            </div>
            <div className="text-center rounded-lg bg-emerald-50 px-2 py-1.5">
              <div className="text-sm font-bold text-emerald-700">{ctx.missed_events.daily_logs}</div>
              <div className="text-[9px] text-emerald-600">Log entries</div>
            </div>
            <div className="text-center rounded-lg bg-red-50 px-2 py-1.5">
              <div className="text-sm font-bold text-red-700">{ctx.missed_events.missing_episodes}</div>
              <div className="text-[9px] text-red-600">Missing eps</div>
            </div>
            <div className="text-center rounded-lg bg-blue-50 px-2 py-1.5">
              <div className="text-sm font-bold text-blue-700">{ctx.missed_events.tasks_completed}</div>
              <div className="text-[9px] text-blue-600">Tasks done</div>
            </div>
          </div>

          {/* ARIA generated summary */}
          <div className="rounded-xl bg-[var(--cs-aria-gold-bg)] border border-[var(--cs-aria-gold-soft)] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-[var(--cs-aria-gold)]" />
              <span className="text-[11px] font-semibold text-[var(--cs-aria-gold)]">
                ARIA — Personalised handover for {firstName}
              </span>
            </div>
            <pre className="text-[11px] text-[var(--cs-text-secondary)] whitespace-pre-wrap font-sans leading-relaxed">
              {ctx.aria_summary}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

interface AriaHandoverBuilderProps {
  incomingStaffIds: string[];
}

export function AriaHandoverBuilder({ incomingStaffIds }: AriaHandoverBuilderProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const { data, isLoading } = useHandoverContext(showBuilder ? incomingStaffIds : []);
  const contexts = data?.data ?? [];

  if (incomingStaffIds.length === 0) return null;

  return (
    <Card className="rounded-2xl border-[var(--cs-aria-gold-soft)] bg-gradient-to-br from-[var(--cs-aria-gold-bg)]/50 to-white">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[var(--cs-aria-gold-bg)] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-[var(--cs-aria-gold)]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--cs-navy)]">ARIA Handover Builder</div>
              <div className="text-[11px] text-[var(--cs-text-muted)]">
                Personalised context based on when each staff member was last on shift
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant={showBuilder ? "outline" : "default"}
            onClick={() => setShowBuilder((v) => !v)}
            className={cn(!showBuilder && "bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90")}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            {showBuilder ? "Hide" : "Build Handover"}
          </Button>
        </div>

        {showBuilder && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] text-[var(--cs-text-muted)]">
              <User className="h-3.5 w-3.5" />
              <span>
                Building personalised handover for {incomingStaffIds.length} incoming staff member{incomingStaffIds.length > 1 ? "s" : ""}
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-[var(--cs-aria-gold)]">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">ARIA is building personalised handovers...</span>
              </div>
            ) : contexts.length > 0 ? (
              <div className="space-y-2">
                {contexts.map((ctx) => (
                  <StaffContextCard key={ctx.staff_id} ctx={ctx} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-[var(--cs-text-muted)] text-sm">
                No context available for selected staff
              </div>
            )}

            {!isLoading && contexts.length > 0 && (
              <div className="rounded-xl bg-[var(--cs-surface)] border border-[var(--cs-border-subtle)] px-3 py-2.5 text-[11px] text-[var(--cs-text-muted)]">
                <strong className="text-[var(--cs-text-secondary)]">How this works:</strong> ARIA checks the rota to see when each incoming
                staff member was last on shift. Staff who have been away longer receive more comprehensive context — including
                incidents, young person updates, and completed tasks they missed.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
