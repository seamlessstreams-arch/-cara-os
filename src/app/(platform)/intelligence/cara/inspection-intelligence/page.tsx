"use client";

import React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { ManagerIntelligenceNav } from "@/components/intelligence/manager-intelligence-nav";
import { Card, CardContent } from "@/components/ui/card";
import { useInspectionIntelligence } from "@/hooks/use-inspection-intelligence";
import type {
  EvidenceStrength,
  SccifArea,
  ChildRef,
} from "@/lib/inspection-intelligence/inspection-intelligence-engine";
import { cn } from "@/lib/utils";
import {
  ClipboardCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
  ShieldAlert,
  FileText,
} from "lucide-react";

const STRENGTH_CONFIG: Record<EvidenceStrength, { label: string; badge: string; icon: React.ElementType; bar: string }> = {
  strong: { label: "Strong evidence", badge: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2, bar: "bg-emerald-400" },
  developing: { label: "Developing", badge: "bg-amber-100 text-amber-800 border-amber-200", icon: CircleDot, bar: "bg-amber-300" },
  limited: { label: "Limited evidence", badge: "bg-red-100 text-red-800 border-red-200", icon: AlertTriangle, bar: "bg-red-400" },
};

/** Clickable chips for the specific children behind a gap → their record. */
function ChildChips({ childRefs }: { childRefs?: ChildRef[] }) {
  if (!childRefs || childRefs.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {childRefs.map((c) => (
        <Link
          key={c.id}
          href={`/young-people/${c.id}`}
          className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-rose-200 transition-colors hover:bg-white"
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}

function AreaCard({ area }: { area: SccifArea }) {
  const s = STRENGTH_CONFIG[area.strength];
  const StrengthIcon = s.icon;
  return (
    <Card className={cn(area.strength === "limited" && "border-l-4 border-l-red-400")}>
      <CardContent className="p-5">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="text-sm font-bold text-[var(--cs-navy,#1e293b)]">{area.label}</h3>
          <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", s.badge)}>
            <StrengthIcon className="h-3 w-3" /> {s.label}
          </span>
        </div>
        <p className="mb-3 text-sm text-[var(--cs-text-secondary,#475569)]">{area.summary}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Evidence the home can show */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
              <FileText className="h-3.5 w-3.5" /> Evidence on record
            </div>
            <ul className="space-y-1.5">
              {area.evidence.map((e) => (
                <li key={e.label} className="flex items-start justify-between gap-2 text-sm">
                  <span className="text-[var(--cs-navy,#1e293b)]" title={e.detail}>{e.label}</span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-bold", e.count > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400")}>
                    {e.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Gaps an inspector would probe */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-rose-700">
              <ShieldAlert className="h-3.5 w-3.5" /> Gaps to close
            </div>
            {area.gaps.length === 0 ? (
              <p className="text-sm text-emerald-700">No evidence gaps detected in this area.</p>
            ) : (
              <ul className="space-y-1.5">
                {area.gaps.map((g) => (
                  <li key={g.label} className="flex items-start gap-2 text-sm">
                    <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", g.severity === "high" ? "bg-red-500" : "bg-amber-400")} />
                    <span className="min-w-0">
                      <span className="text-[var(--cs-text-secondary,#475569)]" title={g.detail}>{g.label}</span>
                      <ChildChips childRefs={g.childRefs} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InspectionIntelligencePage() {
  const { data, isLoading } = useInspectionIntelligence();

  return (
    <PageShell
      title="Inspection Intelligence"
      subtitle="Your evidence and gaps across Ofsted's three SCCIF judgement areas — a self-evaluation view"
    >
      <div className="space-y-6 animate-fade-in">
        <ManagerIntelligenceNav active="inspection" />
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[var(--cs-text-muted,#64748b)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Assembling inspection evidence…
          </div>
        )}

        {data && (
          <>
            {/* Headline + readiness counts */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-[var(--cs-cara-gold,#b45309)]" />
                  <h2 className="text-base font-bold text-[var(--cs-navy,#1e293b)]">Inspection readiness — whole home</h2>
                </div>
                <p className="mt-1 max-w-3xl text-sm text-[var(--cs-text-secondary,#475569)]">{data.headline}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {data.areasStrong} area{data.areasStrong === 1 ? "" : "s"} strong
                  </span>
                  {data.areasDeveloping > 0 && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      {data.areasDeveloping} developing
                    </span>
                  )}
                  {data.areasLimited > 0 && (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      {data.areasLimited} limited
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Priority gaps */}
            {data.priorities.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--cs-navy,#1e293b)]">
                    <ShieldAlert className="h-4 w-4 text-rose-500" /> Close these before inspection
                  </h3>
                  <div className="space-y-2">
                    {data.priorities.map((p, i) => (
                      <div key={`${p.label}-${i}`} className="flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                        <span className="min-w-0">
                          <span className="font-semibold text-rose-800">{p.label}.</span>{" "}
                          <span className="text-rose-700">{p.detail}</span>
                          <span className="ml-1 text-[11px] uppercase tracking-wide text-rose-400">{p.area}</span>
                          <ChildChips childRefs={p.childRefs} />
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SCCIF area cards */}
            <div className="space-y-4">
              {data.areas.map((a) => (
                <AreaCard key={a.key} area={a} />
              ))}
            </div>

            <p className="px-1 text-xs text-[var(--cs-text-muted,#64748b)]">
              CARA assembles the evidence you already hold and highlights gaps to support your self-evaluation and inspection
              preparation. It does <span className="font-semibold">not</span> predict or assign an Ofsted grade — that
              judgement is the inspector's. Intelligence informs practice; people make the decisions.
            </p>
          </>
        )}
      </div>
    </PageShell>
  );
}
