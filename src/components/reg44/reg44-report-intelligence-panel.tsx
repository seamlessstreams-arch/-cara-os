"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Reg 44 Report Intelligence Panel
//
// For the independent visitor: Cara's evidence assembled against the nine Quality
// Standards, plus DRAFT positions for the two statutory opinions and the
// validation flags before sign-off. Cara suggests; the visitor decides — the
// panel makes that explicit and never presents an opinion as settled.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, ClipboardCheck, Loader2, ShieldQuestion, AlertTriangle, Ban } from "lucide-react";
import { useReg44ReportIntelligence } from "@/hooks/use-reg44-report-intelligence";
import type { QualityStandardAssessment, QualityStandardStatus, StatutoryOpinion } from "@/lib/reg44-report-intelligence/types";

const STATUS_STYLE: Record<QualityStandardStatus, { label: string; bg: string; fg: string }> = {
  met: { label: "Met", bg: "#e6f7f2", fg: "#0d9488" },
  partly_met: { label: "Partly met", bg: "#fdf4e3", fg: "#b7791f" },
  not_met: { label: "Not met", bg: "#fdeceb", fg: "#c0392b" },
  insufficient_evidence: { label: "Insufficient evidence", bg: "#eef1f3", fg: "#6c7a83" },
  not_assessed: { label: "Not assessed", bg: "#eef1f3", fg: "#6c7a83" },
};

function StandardRow({ s }: { s: QualityStandardAssessment }) {
  const [open, setOpen] = useState(false);
  const st = STATUS_STYLE[s.suggestedStatus];
  return (
    <div className="rounded-lg border border-[var(--cs-border,#e2e8ec)] bg-[var(--cs-surface,#fff)]">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left">
        <span className="min-w-0">
          <span className="text-sm font-medium text-[var(--cs-text,#14202a)]">{s.label}</span>
          <span className="ml-1.5 text-[11px] text-[var(--cs-text-muted,#6c7a83)]">{s.regulation}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: st.bg, color: st.fg }}>{st.label}</span>
          {open ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted,#6c7a83)]" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted,#6c7a83)]" />}
        </span>
      </button>
      {open && (
        <div className="space-y-1.5 border-t border-[var(--cs-border,#e2e8ec)] px-3 py-2">
          <p className="text-xs leading-relaxed text-[var(--cs-text,#14202a)]">{s.suggestedNarrative}</p>
          {s.concerns.length > 0 && (
            <p className="text-[11px]" style={{ color: "#c0392b" }}>Concerns: {s.concerns.join("; ")}</p>
          )}
          {s.evidence.length > 0 && (
            <ul className="space-y-0.5">
              {s.evidence.slice(0, 6).map((e, i) => (
                <li key={i} className="text-[11px] text-[var(--cs-text-muted,#6c7a83)]">· {e.summary} <span className="italic">({e.sourceType.replace(/_/g, " ")})</span></li>
              ))}
            </ul>
          )}
          {s.gaps.length > 0 && <p className="text-[11px] text-[var(--cs-text-muted,#6c7a83)]">Gaps: {s.gaps.join("; ")}</p>}
          <p className="text-[10px] italic text-[var(--cs-text-muted,#6c7a83)]">Confidence: {s.confidence} · visitor to confirm</p>
        </div>
      )}
    </div>
  );
}

function OpinionCard({ o }: { o: StatutoryOpinion }) {
  const posColor = o.position === "concerns_identified" ? "#c0392b" : o.position === "insufficient_evidence" ? "#6c7a83" : "#b7791f";
  return (
    <div className="rounded-lg border border-[var(--cs-border,#e2e8ec)] bg-[var(--cs-surface-subtle,#f6f8f9)] p-3">
      <p className="flex items-start gap-1.5 text-sm font-semibold text-[var(--cs-text,#14202a)]">
        <ShieldQuestion className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--cs-teal,#0d9488)" }} /> {o.question}
      </p>
      <p className="mt-1 text-xs" style={{ color: posColor }}>Cara reads the evidence as: <strong>{o.position.replace(/_/g, " ")}</strong></p>
      <p className="mt-0.5 text-xs leading-relaxed text-[var(--cs-text,#14202a)]">{o.basis}</p>
      <p className="mt-1 text-[11px] font-medium italic" style={{ color: "var(--cs-teal,#0d9488)" }}>This statutory opinion is yours to form — Cara has only assembled the evidence.</p>
    </div>
  );
}

function AssembledDraft({ assembly }: { assembly: NonNullable<ReturnType<typeof useReg44ReportIntelligence>["data"]>["data"]["assembly"] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-[var(--cs-border,#e2e8ec)]">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left">
        <span className="text-sm font-medium text-[var(--cs-text,#14202a)]">
          Assembled draft report (A–Q) · {assembly.sectionsDrafted} drafted, {assembly.sectionsNeedingVisitor} for you
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-[var(--cs-text-muted,#6c7a83)]" /> : <ChevronDown className="h-4 w-4 text-[var(--cs-text-muted,#6c7a83)]" />}
      </button>
      {open && (
        <div className="space-y-1 border-t border-[var(--cs-border,#e2e8ec)] px-3 py-2">
          {assembly.sections.map((s) => (
            <div key={s.key} className="py-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--cs-text,#14202a)]">
                <span className="text-[var(--cs-text-muted,#6c7a83)]">{s.key}.</span> {s.label}
                {s.visitorMustComplete && <span className="rounded-full bg-[#fdf4e3] px-1.5 py-0.5 text-[10px]" style={{ color: "#b7791f" }}>for you</span>}
                {s.status === "insufficient_evidence" && <span className="rounded-full bg-[#eef1f3] px-1.5 py-0.5 text-[10px]" style={{ color: "#6c7a83" }}>needs evidence</span>}
              </p>
              <p className="whitespace-pre-line text-[11px] leading-relaxed text-[var(--cs-text-muted,#6c7a83)]">{s.content}</p>
            </div>
          ))}
          <p className="pt-1 text-[11px] italic text-[var(--cs-text-muted,#6c7a83)]">{assembly.disclaimer}</p>
        </div>
      )}
    </div>
  );
}

export function Reg44ReportIntelligencePanel({ homeId = "home_oak", month }: { homeId?: string; month?: string }) {
  const { data, isLoading, isError } = useReg44ReportIntelligence(homeId, month);
  const a = data?.data?.assessment;
  const assembly = data?.data?.assembly;

  return (
    <Card className="border-[var(--cs-border,#e2e8ec)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4" style={{ color: "var(--cs-teal,#0d9488)" }} />
          Reg 44 Evidence &amp; Quality Standards
          {a && (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: a.readiness.status === "ready_for_visitor" ? "#e6f7f2" : a.readiness.status === "needs_review" ? "#fdf4e3" : "#fdeceb", color: a.readiness.status === "ready_for_visitor" ? "#0d9488" : a.readiness.status === "needs_review" ? "#b7791f" : "#c0392b" }}>
              {a.readiness.status.replace(/_/g, " ")} · {a.readiness.score}
            </span>
          )}
        </CardTitle>
        <CardDescription>Cara assembles the evidence it holds against the nine Quality Standards. It suggests; you decide.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <div className="flex items-center gap-2 py-6 text-sm text-[var(--cs-text-muted,#6c7a83)]"><Loader2 className="h-4 w-4 animate-spin" /> Assembling the evidence…</div>}
        {isError && <p className="py-4 text-sm text-[var(--cs-text-muted,#6c7a83)]">Couldn&apos;t load the Reg 44 assessment right now.</p>}

        {a && (
          <>
            {a.validationFlags.length > 0 && (
              <div className="space-y-1.5">
                {a.validationFlags.map((f) => (
                  <div key={f.id} className="flex items-start gap-2 rounded-md border px-2.5 py-1.5" style={f.severity === "block" ? { borderColor: "#f0b8b2", backgroundColor: "#fdeceb" } : { borderColor: "#f0dcb0", backgroundColor: "#fdf4e3" }}>
                    {f.severity === "block" ? <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#c0392b" }} /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "#b7791f" }} />}
                    <span className="text-xs" style={{ color: f.severity === "block" ? "#c0392b" : "#b7791f" }}>{f.message}</span>
                  </div>
                ))}
              </div>
            )}

            <OpinionCard o={a.safeguardingOpinion} />
            <OpinionCard o={a.wellbeingOpinion} />

            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">The nine Quality Standards</p>
              {a.standards.map((s) => (
                <StandardRow key={s.key} s={s} />
              ))}
            </div>

            {assembly && <AssembledDraft assembly={assembly} />}

            <p className="text-[11px] italic leading-relaxed text-[var(--cs-text-muted,#6c7a83)]">{a.disclaimer}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default Reg44ReportIntelligencePanel;
