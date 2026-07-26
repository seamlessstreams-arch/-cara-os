"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { InspectionEvidenceAnalysis, EvidenceSection, SignalColour } from "@/lib/cara-visual-toolkit/types";

async function fetchInspectionEvidence(): Promise<InspectionEvidenceAnalysis> {
  const res = await fetch("/api/v1/cara-toolkit/inspection-evidence");
  if (!res.ok) throw new Error("Failed to fetch inspection evidence data");
  const json = await res.json();
  return json.data as InspectionEvidenceAnalysis;
}

function useCaraToolkitInspectionEvidence() {
  return useQuery({
    queryKey: ["cara-toolkit-inspection-evidence"],
    queryFn: fetchInspectionEvidence,
    staleTime: 120_000,
  });
}

const SIGNAL_STYLES: Record<SignalColour, { bg: string; border: string; text: string; dot: string; badge: string; label: string }> = {
  green: { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  dot: "bg-green-400",  badge: "bg-green-100 text-green-700",  label: "Good evidence"  },
  amber: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  dot: "bg-amber-400",  badge: "bg-amber-100 text-amber-700",  label: "Gaps identified" },
  red:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    dot: "bg-red-400",    badge: "bg-red-100 text-red-700",      label: "Action needed"   },
  grey:  { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-600",  dot: "bg-slate-300",  badge: "bg-slate-100 text-slate-500",  label: "No data"         },
};

const READINESS_STYLES: Record<SignalColour, { ring: string; bg: string; text: string }> = {
  green: { ring: "border-green-300",  bg: "bg-green-50",  text: "text-green-800"  },
  amber: { ring: "border-amber-300",  bg: "bg-amber-50",  text: "text-amber-800"  },
  red:   { ring: "border-red-300",    bg: "bg-red-50",    text: "text-red-800"    },
  grey:  { ring: "border-slate-300",  bg: "bg-slate-50",  text: "text-slate-600"  },
};

function SectionCard({ section }: { section: EvidenceSection }) {
  const style = SIGNAL_STYLES[section.signal];
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${style.bg} ${style.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
            <p className={`font-semibold text-sm ${style.text}`}>{section.title}</p>
          </div>
          <p className="text-xs text-slate-400 ml-4">{section.regulatoryRef}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${style.badge}`}>
          {style.label}
        </span>
      </div>

      {/* Findings */}
      <div className="flex flex-col gap-1 ml-4">
        {section.keyFindings.map((f, i) => (
          <p key={i} className="text-xs text-slate-600">• {f}</p>
        ))}
      </div>

      {/* Strengths */}
      {section.evidenceStrengths.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1">Evidence strengths</p>
          <div className="flex flex-col gap-0.5">
            {section.evidenceStrengths.map((s, i) => (
              <p key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                <span className="shrink-0 mt-0.5">✓</span>
                {s}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Gaps */}
      {section.gaps.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-500 mb-1">Gaps</p>
          <div className="flex flex-col gap-0.5">
            {section.gaps.map((g, i) => (
              <p key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                <span className="shrink-0 mt-0.5">!</span>
                {g}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InspectionEvidencePage() {
  const { data, isLoading, error } = useCaraToolkitInspectionEvidence();

  if (isLoading) return <div className="p-8 text-slate-500 text-sm">Building inspection evidence pack…</div>;
  if (error || !data) return <div className="p-8 text-red-600 text-sm">Unable to load inspection evidence data.</div>;

  const readiness = READINESS_STYLES[data.overallReadiness];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link href="/cara-toolkit" className="hover:text-slate-600">Cara Toolkit</Link>
        <span>/</span>
        <span className="text-slate-600">Inspection Evidence Pack</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inspection Evidence Pack</h1>
        <p className="text-sm text-slate-600 mt-1">
          Reg 44 · Reg 45 · Ofsted SCCIF. Five evidence sections auto-populated from current records — showing where you are strong and where gaps need addressing before inspection.
        </p>
      </div>

      {/* Readiness summary */}
      <div className={`rounded-2xl border-2 p-5 ${readiness.ring} ${readiness.bg}`}>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Inspection readiness</p>
            <p className={`text-xl font-bold ${readiness.text}`}>{data.readinessLabel}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {data.greenSections > 0 && (
              <div className="rounded-xl bg-green-100 border border-green-200 px-3 py-2 text-center">
                <p className="text-xl font-bold text-green-700">{data.greenSections}</p>
                <p className="text-xs text-green-600">Good</p>
              </div>
            )}
            {data.amberSections > 0 && (
              <div className="rounded-xl bg-amber-100 border border-amber-200 px-3 py-2 text-center">
                <p className="text-xl font-bold text-amber-700">{data.amberSections}</p>
                <p className="text-xs text-amber-600">Gaps</p>
              </div>
            )}
            {data.redSections > 0 && (
              <div className="rounded-xl bg-red-100 border border-red-200 px-3 py-2 text-center">
                <p className="text-xl font-bold text-red-700">{data.redSections}</p>
                <p className="text-xs text-red-600">Action needed</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Priority actions */}
      {data.priorityActions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Priority actions before inspection</h2>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-2">
            {data.priorityActions.map((action, i) => (
              <div key={i} className="text-sm text-amber-800 flex items-start gap-2">
                <span className="shrink-0 mt-0.5 font-bold">{i + 1}.</span>
                {action}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Evidence sections */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Evidence sections</h2>
        <div className="flex flex-col gap-3">
          {data.sections.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-semibold mb-1">Regulatory reference</p>
        <p>{data.regulatoryNote}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
        This tool surfaces evidence signals from existing records. Ofsted inspectors assess quality through direct observation, conversations with children and staff, and document review — not through this tool. The Registered Manager is professionally accountable for all inspection responses and self-evaluation.
      </div>
    </div>
  );
}
