"use client";

import { useState, useMemo } from "react";
import {
  MapPin, Search, ArrowUpDown,
  AlertTriangle, CheckCircle2, Shield,
  ChevronDown, ChevronUp, Eye, RefreshCw, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useLocalityRisks, useUpdateLocalityRisk } from "@/hooks/use-locality-risks";
import type { LocalityRisk, LocalityRiskCategory, LocalityRiskLevel, LocalityMitigation } from "@/types/extended";
import { LOCALITY_RISK_CATEGORY_LABEL, LOCALITY_RISK_LEVEL_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── UI metadata ──────────────────────────────────────────────────────── */

const RISK_LEVELS: LocalityRiskLevel[] = ["low", "medium", "high", "critical"];

const RISK_COLORS: Record<LocalityRiskLevel, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function LocalityRiskPage() {
  const { data: res, isLoading } = useLocalityRisks();
  const updateMut = useUpdateLocalityRisk();
  const data: LocalityRisk[] = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("risk");
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let list = [...data];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          LOCALITY_RISK_CATEGORY_LABEL[r.category].toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "risk": return RISK_LEVELS.indexOf(b.risk_level) - RISK_LEVELS.indexOf(a.risk_level);
        case "category": return a.category.localeCompare(b.category);
        case "review": return a.next_review.localeCompare(b.next_review);
        default: return 0;
      }
    });
    return list;
  }, [data, search, sortBy]);

  const total = data.length;
  const highCritical = data.filter((r) => r.risk_level === "high" || r.risk_level === "critical").length;
  const reviewDue = data.filter((r) => r.next_review < today).length;

  const exportCols: ExportColumn<LocalityRisk>[] = [
    { header: "ID", accessor: (r) => r.id },
    { header: "Category", accessor: (r) => LOCALITY_RISK_CATEGORY_LABEL[r.category] },
    { header: "Risk Level", accessor: (r) => LOCALITY_RISK_LEVEL_LABEL[r.risk_level] },
    { header: "Location", accessor: (r) => r.location },
    { header: "Description", accessor: (r) => r.description },
    { header: "Intelligence", accessor: (r) => r.intelligence },
    { header: "Mitigations", accessor: (r) => r.mitigations.map((m: LocalityMitigation) => `${m.measure} (${m.effectiveness})`).join("; ") },
    { header: "Impact on YP", accessor: (r) => r.impact_on_yp },
    { header: "Last Reviewed", accessor: (r) => r.last_reviewed },
    { header: "Reviewed By", accessor: (r) => getStaffName(r.reviewed_by) },
    { header: "Next Review", accessor: (r) => r.next_review },
    { header: "Notes", accessor: (r) => r.notes },
  ];

  if (isLoading) return <PageShell title="Locality Risk Assessment" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Locality Risk Assessment"
      subtitle="Environmental and community risks affecting the children's home"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Locality Risk Assessment" />
          <ExportButton data={filtered} columns={exportCols} filename="locality-risk" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Risks", value: total, icon: MapPin, colour: "text-blue-600" },
            { label: "High / Critical", value: highCritical, icon: AlertTriangle, colour: highCritical > 0 ? "text-red-600" : "text-green-600" },
            { label: "Reviews Due", value: reviewDue, icon: Eye, colour: reviewDue > 0 ? "text-orange-600" : "text-slate-400" },
            { label: "Mitigations Active", value: data.reduce((s, r) => s + r.mitigations.length, 0), icon: Shield, colour: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search risks, locations, categories…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="risk">Risk Level</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="review">Next Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* cards */}
        <div className="space-y-3">
          {filtered.map((risk) => {
            const isExpanded = expanded === risk.id;
            const overdue = risk.next_review < today;

            return (
              <div key={risk.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : risk.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <MapPin className={cn("h-5 w-5 shrink-0",
                      risk.risk_level === "high" || risk.risk_level === "critical" ? "text-red-600" :
                      risk.risk_level === "medium" ? "text-yellow-600" : "text-green-600"
                    )} />
                    <div className="min-w-0">
                      <p className="font-medium">{LOCALITY_RISK_CATEGORY_LABEL[risk.category]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{risk.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {overdue && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Review Due</Badge>}
                    <Badge className={cn("text-xs", RISK_COLORS[risk.risk_level])}>
                      {LOCALITY_RISK_LEVEL_LABEL[risk.risk_level]}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Description</p>
                      <p className="text-sm">{risk.description}</p>
                    </div>

                    <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                      <p className="text-xs font-medium text-indigo-700 mb-1">Intelligence Source</p>
                      <p className="text-sm">{risk.intelligence}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Mitigations</p>
                      <div className="space-y-1">
                        {risk.mitigations.map((m: LocalityMitigation, idx: number) => (
                          <div key={idx} className={cn("flex items-start gap-2 rounded-lg border p-2.5 text-sm",
                            m.effectiveness === "effective" ? "bg-green-50 border-green-200" :
                            m.effectiveness === "partial" ? "bg-yellow-50 border-yellow-200" :
                            "bg-red-50 border-red-200"
                          )}>
                            <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0",
                              m.effectiveness === "effective" ? "text-green-600" :
                              m.effectiveness === "partial" ? "text-yellow-600" : "text-red-600"
                            )} />
                            <div>
                              <span>{m.measure}</span>
                              <Badge variant="outline" className="text-xs ml-2">
                                {m.effectiveness.charAt(0).toUpperCase() + m.effectiveness.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                      <p className="text-xs font-medium text-pink-700 mb-1">Impact on Young People</p>
                      <p className="text-sm">{risk.impact_on_yp}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Last Reviewed:</span> <span className="font-medium">{risk.last_reviewed}</span></div>
                      <div><span className="text-muted-foreground">Reviewed By:</span> <span className="font-medium">{getStaffName(risk.reviewed_by)}</span></div>
                      <div><span className="text-muted-foreground">Next Review:</span> <span className={cn("font-medium", overdue && "text-red-600")}>{risk.next_review}</span></div>
                    </div>

                    {risk.notes && (
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                        <p className="text-sm">{risk.notes}</p>
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 90);
                        updateMut.mutate({
                          id: risk.id,
                          last_reviewed: new Date().toISOString().slice(0, 10),
                          reviewed_by: "staff_darren",
                          next_review: d.toISOString().slice(0, 10),
                        });
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Mark Reviewed
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* reg note */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Reg 12 — Location Risk Assessment:</strong> The registered person must keep under review
          and revise the assessment of risks to children in the area around the home. This includes risks
          from exploitation, anti-social behaviour, environmental hazards, and any local factors that could
          affect children&apos;s safety and wellbeing. The assessment must inform individual risk assessments
          and the home&apos;s Statement of Purpose.
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
