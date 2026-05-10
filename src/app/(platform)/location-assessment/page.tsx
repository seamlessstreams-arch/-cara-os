"use client";

import { useState } from "react";
import {
  MapPin, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Shield, Building2,
  Car, GraduationCap, Heart, Phone,
  Eye, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLocationAssessmentAreas } from "@/hooks/use-location-assessment-areas";
import type { LocationAssessmentArea, LocationRiskLevel } from "@/types/extended";
import { LOCATION_RISK_LEVEL_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────── */

const RISK_COLORS: Record<LocationRiskLevel, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

const ICON_MAP: Record<string, React.ElementType> = {
  neighbourhood: Building2,
  safety: Shield,
  transport: Car,
  education: GraduationCap,
  health: Heart,
  emergency: Phone,
  monitoring: Eye,
};

const COLOUR_MAP: Record<string, string> = {
  neighbourhood: "text-blue-600",
  safety: "text-red-600",
  transport: "text-purple-600",
  education: "text-green-600",
  health: "text-pink-600",
  emergency: "text-teal-600",
  monitoring: "text-amber-600",
};

/* ── component ───────────────────────────────────────────────────────── */
export default function LocationAssessmentPage() {
  const { data: records = [], isLoading } = useLocationAssessmentAreas();
  const [expanded, setExpanded] = useState<string | null>("neighbourhood");

  const totalRisks = records.length;
  const highRisks = records.filter((a) => a.risk_level === "high").length;
  const mediumRisks = records.filter((a) => a.risk_level === "medium").length;

  if (isLoading) {
    return (
      <PageShell title="Location Assessment" subtitle="Regulation 46 — Suitability of the home's location for children's care">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Location Assessment"
      subtitle="Regulation 46 — Suitability of the home's location for children's care"
      ariaContext={{ pageTitle: "Location Assessment", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Location Assessment — Oak House" />
          <AriaStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── overview ──────────────────────────────────────────── */}
        <div className="rounded-xl border bg-white p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Areas Assessed", value: totalRisks, icon: MapPin, colour: "text-blue-600" },
              { label: "High Risk", value: highRisks, icon: AlertTriangle, colour: highRisks > 0 ? "text-red-600" : "text-green-600" },
              { label: "Medium Risk", value: mediumRisks, icon: Shield, colour: mediumRisks > 0 ? "text-yellow-600" : "text-green-600" },
              { label: "Last Full Review", value: "Mar 2026", icon: Eye, colour: "text-blue-600" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <s.icon className={cn("h-5 w-5", s.colour)} />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── sections ──────────────────────────────────────────── */}
        <div className="space-y-3">
          {records.map((area) => {
            const isExpanded = expanded === area.id;
            const Icon = ICON_MAP[area.id] || MapPin;
            const colour = COLOUR_MAP[area.id] || "text-blue-600";

            return (
              <div key={area.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : area.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5", colour)} />
                    <div>
                      <p className="font-medium">{area.title}</p>
                      <p className="text-xs text-muted-foreground">Updated: {area.last_updated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", RISK_COLORS[area.risk_level])}>
                      {area.risk_level.charAt(0).toUpperCase() + area.risk_level.slice(1)} Risk
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* factors */}
                    <div className="space-y-2">
                      {area.factors.map((f, idx) => (
                        <div key={idx} className={cn("rounded-lg border p-3 text-sm",
                          f.risk === "low" ? "bg-green-50 border-green-200" :
                          f.risk === "medium" ? "bg-yellow-50 border-yellow-200" :
                          "bg-red-50 border-red-200"
                        )}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{f.factor}</span>
                            <Badge className={cn("text-xs", RISK_COLORS[f.risk])}>
                              {f.risk.charAt(0).toUpperCase() + f.risk.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{f.assessment}</p>
                        </div>
                      ))}
                    </div>

                    {/* mitigations */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-medium text-blue-700 mb-2">Mitigations</p>
                      <ul className="space-y-1">
                        {area.mitigations.map((m, i) => (
                          <li key={i} className="flex items-start gap-1 text-sm">
                            <CheckCircle2 className="h-3 w-3 text-blue-600 mt-0.5 shrink-0" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulation 46:</strong> Before a children&apos;s home is established, the registered person
          must prepare a written assessment of the suitability of the premises and the area. This must
          be kept under review and revised when changes occur. The assessment must consider local
          services, transport, education, health, leisure opportunities, and any risks in the local area.
          The assessment should inform the Statement of Purpose and placement matching decisions.
          <p className="mt-2 text-xs text-blue-700">
            Last full review: March 2026 · Next review due: September 2026 · Reviewed by: Darren Laville (RM)
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Safeguarding"
        category={["safeguarding", "missing_episode"]}
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Location Assessment — Regulation 46 suitability of premises and area, neighbourhood risks, transport, education, health services, safety factors, mitigations, monitoring"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}
