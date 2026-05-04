"use client";

import { useState, useMemo } from "react";
import {
  MapPin, Plus, Search, ArrowUpDown,
  AlertTriangle, CheckCircle2, Shield,
  ChevronDown, ChevronUp, Eye, RefreshCw,
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

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
type RiskLevel = typeof RISK_LEVELS[number];
const RISK_COLORS: Record<RiskLevel, string> = {
  low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800", critical: "bg-red-100 text-red-800",
};

const CATEGORIES = [
  "county_lines", "cse", "trafficking", "anti_social_behaviour",
  "drug_activity", "gang_activity", "road_safety", "environmental",
  "community_tensions", "online_risks", "other",
] as const;
type Category = typeof CATEGORIES[number];
const CAT_LABELS: Record<Category, string> = {
  county_lines: "County Lines", cse: "CSE Risk",
  trafficking: "Trafficking", anti_social_behaviour: "Anti-Social Behaviour",
  drug_activity: "Drug Activity", gang_activity: "Gang Activity",
  road_safety: "Road Safety", environmental: "Environmental",
  community_tensions: "Community Tensions", online_risks: "Online Risks",
  other: "Other",
};

interface Mitigation {
  measure: string;
  effectiveness: "effective" | "partial" | "ineffective";
}

interface LocalityRisk {
  id: string;
  category: Category;
  riskLevel: RiskLevel;
  location: string;
  description: string;
  intelligence: string;
  mitigations: Mitigation[];
  lastReviewed: string;
  reviewedBy: string;
  nextReview: string;
  impactOnYP: string;
  notes: string;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: LocalityRisk[] = [
  {
    id: "lr_1", category: "county_lines", riskLevel: "high",
    location: "Western Park area — particularly around the shopping precinct",
    description: "Intelligence from police indicates county lines activity in the Western Park area. Targeting of young people for drug running has been reported within a 1-mile radius of the home.",
    intelligence: "West Midlands Police Community Briefing (March 2026). Two arrests within 500m of home in last quarter. Local youth service reports an increase in approaches to young people.",
    mitigations: [
      { measure: "Risk awareness sessions with all young people — completed quarterly", effectiveness: "effective" },
      { measure: "Staff awareness training — county lines indicators", effectiveness: "effective" },
      { measure: "Western Park precinct identified as restricted area — young people do not go unsupervised", effectiveness: "effective" },
      { measure: "Partnership working with local police — regular intel sharing", effectiveness: "partial" },
    ],
    lastReviewed: d(-14), reviewedBy: "staff_darren", nextReview: d(76),
    impactOnYP: "All three young people are aware of the risk in age-appropriate terms. Alex has been specifically counselled as they have expressed interest in going to the precinct with school friends. Supervised visits only.",
    notes: "Risk remains high but well-managed. Police liaison continues. Must be referenced in all individual risk assessments.",
  },
  {
    id: "lr_2", category: "road_safety", riskLevel: "medium",
    location: "Main road (A456) adjacent to property",
    description: "The home is situated 50m from a busy A-road with a 40mph speed limit. Limited crossing points in the immediate area.",
    intelligence: "Two pedestrian incidents in last 12 months at the nearest junction. Council consulted about additional crossing — response awaited.",
    mitigations: [
      { measure: "Road safety included in induction for new young people and staff", effectiveness: "effective" },
      { measure: "Agreed safe route to school avoids A456 crossing", effectiveness: "effective" },
      { measure: "High-visibility items provided for walking in dark months", effectiveness: "partial" },
    ],
    lastReviewed: d(-30), reviewedBy: "staff_ryan", nextReview: d(60),
    impactOnYP: "Casey walks independently to college — safe route agreed. Alex and Jordan accompanied or use minibus. All YP understand road safety expectations.",
    notes: "Council response on crossing pending. Chase in May 2026.",
  },
  {
    id: "lr_3", category: "anti_social_behaviour", riskLevel: "low",
    location: "Residential streets surrounding the home",
    description: "Low-level anti-social behaviour in the area — occasional noise and littering. No direct impact on the home or young people reported.",
    intelligence: "Neighbourhood Watch updates. Police Community Support Officer visits quarterly. No recent escalation.",
    mitigations: [
      { measure: "Good relationships with immediate neighbours maintained", effectiveness: "effective" },
      { measure: "CCTV covering front and rear of property", effectiveness: "effective" },
      { measure: "Staff vigilance during evening hours", effectiveness: "effective" },
    ],
    lastReviewed: d(-7), reviewedBy: "staff_darren", nextReview: d(83),
    impactOnYP: "No direct impact. Young people report feeling safe in the neighbourhood.",
    notes: "Risk remains low. Continue positive community engagement.",
  },
  {
    id: "lr_4", category: "cse", riskLevel: "medium",
    location: "Town centre — particularly late evenings",
    description: "Local CSE profile identifies town centre as an area of concern, particularly around fast food outlets and the bus station after 9pm.",
    intelligence: "Multi-agency CSE profile (updated Jan 2026). LSCB briefings. Two Disruption Orders issued in the area in last 6 months.",
    mitigations: [
      { measure: "Town centre visits supervised for all young people during evening hours", effectiveness: "effective" },
      { measure: "CSE awareness training for all staff — refreshed annually", effectiveness: "effective" },
      { measure: "Healthy relationships programme delivered through key working", effectiveness: "partial" },
      { measure: "Partnership with CSE specialist team — information sharing protocol in place", effectiveness: "effective" },
    ],
    lastReviewed: d(-21), reviewedBy: "staff_darren", nextReview: d(69),
    impactOnYP: "All young people have received age-appropriate CSE awareness. Individual CSE risk assessments in place. No current specific concerns but proactive monitoring continues.",
    notes: "Reviewed against latest LSCB profile. Risk reduced from high following multi-agency disruption activity. Maintaining medium as context can change.",
  },
  {
    id: "lr_5", category: "online_risks", riskLevel: "medium",
    location: "Within the home — WiFi and mobile data",
    description: "Online risks remain a constant concern. Young people access social media and gaming platforms. Recent incident with Alex receiving upsetting messages demonstrates the ongoing nature of this risk.",
    intelligence: "Internal incident log. CEOP resources. Alex's social media distress incident (recent). National trends in online harm to LAC.",
    mitigations: [
      { measure: "WiFi filtering in place — age-appropriate restrictions", effectiveness: "effective" },
      { measure: "Phone collection at 21:00 (adjusted following recent incident)", effectiveness: "partial" },
      { measure: "Online safety sessions in key working — using CEOP resources", effectiveness: "effective" },
      { measure: "Staff trained in online safety awareness", effectiveness: "effective" },
    ],
    lastReviewed: d(-5), reviewedBy: "staff_anna", nextReview: d(25),
    impactOnYP: "Alex particularly vulnerable to social media distress. Phone boundaries adjusted. Casey uses social media with generally good awareness. Jordan minimal social media use currently.",
    notes: "Review brought forward following Alex's social media incident. New phone boundaries being tested. Review effectiveness in 30 days.",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function LocalityRiskPage() {
  const [risks, setRisks] = useState<LocalityRisk[]>(SEED);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("risk");
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let list = [...risks];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          CAT_LABELS[r.category].toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "risk": return RISK_LEVELS.indexOf(b.riskLevel) - RISK_LEVELS.indexOf(a.riskLevel);
        case "category": return a.category.localeCompare(b.category);
        case "review": return a.nextReview.localeCompare(b.nextReview);
        default: return 0;
      }
    });
    return list;
  }, [risks, search, sortBy]);

  const total = risks.length;
  const highCritical = risks.filter((r) => r.riskLevel === "high" || r.riskLevel === "critical").length;
  const reviewDue = risks.filter((r) => r.nextReview < today).length;

  const exportCols: ExportColumn<LocalityRisk>[] = [
    { header: "ID", accessor: (r: LocalityRisk) => r.id },
    { header: "Category", accessor: (r: LocalityRisk) => CAT_LABELS[r.category] },
    { header: "Risk Level", accessor: (r: LocalityRisk) => r.riskLevel },
    { header: "Location", accessor: (r: LocalityRisk) => r.location },
    { header: "Description", accessor: (r: LocalityRisk) => r.description },
    { header: "Intelligence", accessor: (r: LocalityRisk) => r.intelligence },
    { header: "Mitigations", accessor: (r: LocalityRisk) => r.mitigations.map((m: Mitigation) => `${m.measure} (${m.effectiveness})`).join("; ") },
    { header: "Impact on YP", accessor: (r: LocalityRisk) => r.impactOnYP },
    { header: "Last Reviewed", accessor: (r: LocalityRisk) => r.lastReviewed },
    { header: "Reviewed By", accessor: (r: LocalityRisk) => getStaffName(r.reviewedBy) },
    { header: "Next Review", accessor: (r: LocalityRisk) => r.nextReview },
    { header: "Notes", accessor: (r: LocalityRisk) => r.notes },
  ];

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
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Risks", value: total, icon: MapPin, colour: "text-blue-600" },
            { label: "High / Critical", value: highCritical, icon: AlertTriangle, colour: highCritical > 0 ? "text-red-600" : "text-green-600" },
            { label: "Reviews Due", value: reviewDue, icon: Eye, colour: reviewDue > 0 ? "text-orange-600" : "text-slate-400" },
            { label: "Mitigations Active", value: risks.reduce((s, r) => s + r.mitigations.length, 0), icon: Shield, colour: "text-green-600" },
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

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search risks, locations, categories…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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

        {/* ── cards ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((risk) => {
            const isExpanded = expanded === risk.id;
            const overdue = risk.nextReview < today;

            return (
              <div key={risk.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : risk.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <MapPin className={cn("h-5 w-5 shrink-0",
                      risk.riskLevel === "high" || risk.riskLevel === "critical" ? "text-red-600" :
                      risk.riskLevel === "medium" ? "text-yellow-600" : "text-green-600"
                    )} />
                    <div className="min-w-0">
                      <p className="font-medium">{CAT_LABELS[risk.category]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{risk.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {overdue && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Review Due</Badge>}
                    <Badge className={cn("text-xs", RISK_COLORS[risk.riskLevel])}>
                      {risk.riskLevel.charAt(0).toUpperCase() + risk.riskLevel.slice(1)}
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
                        {risk.mitigations.map((m: Mitigation, idx: number) => (
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
                      <p className="text-sm">{risk.impactOnYP}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Last Reviewed:</span> <span className="font-medium">{risk.lastReviewed}</span></div>
                      <div><span className="text-muted-foreground">Reviewed By:</span> <span className="font-medium">{getStaffName(risk.reviewedBy)}</span></div>
                      <div><span className="text-muted-foreground">Next Review:</span> <span className={cn("font-medium", overdue && "text-red-600")}>{risk.nextReview}</span></div>
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
                        setRisks((prev) =>
                          prev.map((r) =>
                            r.id === risk.id ? { ...r, lastReviewed: today, reviewedBy: "staff_darren", nextReview: d(90) } : r
                          )
                        );
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

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Reg 12 — Location Risk Assessment:</strong> The registered person must keep under review
          and revise the assessment of risks to children in the area around the home. This includes risks
          from exploitation, anti-social behaviour, environmental hazards, and any local factors that could
          affect children&apos;s safety and wellbeing. The assessment must inform individual risk assessments
          and the home&apos;s Statement of Purpose.
        </div>
      </div>
    </PageShell>
  );
}
