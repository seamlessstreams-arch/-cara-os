"use client";

import { useState } from "react";
import {
  MapPin, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Shield, Building2,
  Car, GraduationCap, Heart, Phone,
  Eye, RefreshCw,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ── types ───────────────────────────────────────────────────────────── */
const RISK_LEVELS = ["low", "medium", "high"] as const;
type RiskLevel = typeof RISK_LEVELS[number];
const RISK_COLORS: Record<RiskLevel, string> = {
  low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

interface AssessmentArea {
  id: string;
  title: string;
  icon: React.ElementType;
  colour: string;
  riskLevel: RiskLevel;
  factors: { factor: string; assessment: string; risk: RiskLevel }[];
  mitigations: string[];
  lastUpdated: string;
}

/* ── data ────────────────────────────────────────────────────────────── */
const AREAS: AssessmentArea[] = [
  {
    id: "neighbourhood", title: "Neighbourhood & Community", icon: Building2, colour: "text-blue-600",
    riskLevel: "low", lastUpdated: "2026-03-15",
    factors: [
      { factor: "Neighbourhood type", assessment: "Quiet residential area. Mix of families and older residents. Low crime area.", risk: "low" },
      { factor: "Neighbour relations", assessment: "Positive relationships with immediate neighbours. Community integration good.", risk: "low" },
      { factor: "Anti-social behaviour", assessment: "Low levels of ASB reported. No significant issues in immediate vicinity.", risk: "low" },
      { factor: "Community tensions", assessment: "No known community tensions or conflicts in the area.", risk: "low" },
    ],
    mitigations: [
      "Good relationships maintained with neighbours",
      "Staff trained in community engagement",
      "Regular liaison with local PCSO",
    ],
  },
  {
    id: "safety", title: "Safety & Crime", icon: Shield, colour: "text-red-600",
    riskLevel: "medium", lastUpdated: "2026-03-15",
    factors: [
      { factor: "Overall crime rate", assessment: "Below national average for the area. Property crime is the most common type.", risk: "low" },
      { factor: "County lines / exploitation", assessment: "Known county lines activity within 1 mile. Western Park area identified as hotspot.", risk: "high" },
      { factor: "CSE risk", assessment: "Town centre identified in local CSE profile. Evening hours are the primary risk period.", risk: "medium" },
      { factor: "Drug-related activity", assessment: "Some drug activity reported in wider area. Not in immediate vicinity of the home.", risk: "medium" },
      { factor: "Gang activity", assessment: "No significant gang activity in the immediate area.", risk: "low" },
    ],
    mitigations: [
      "Locality risk assessment maintained and reviewed quarterly",
      "Individual risk assessments reference locality risks",
      "Staff and young people trained in awareness",
      "Restricted areas identified and communicated",
      "Partnership working with police and multi-agency teams",
    ],
  },
  {
    id: "transport", title: "Transport & Access", icon: Car, colour: "text-purple-600",
    riskLevel: "low", lastUpdated: "2026-03-15",
    factors: [
      { factor: "Public transport", assessment: "Bus stop within 200m. Regular services to town centre and schools.", risk: "low" },
      { factor: "Road safety", assessment: "A-road adjacent to property. Speed limit 40mph. Nearest crossing 300m away.", risk: "medium" },
      { factor: "Vehicle access", assessment: "Off-road parking available. Good access for emergency vehicles.", risk: "low" },
      { factor: "Walking routes", assessment: "Pavements on all surrounding streets. Well-lit main routes.", risk: "low" },
    ],
    mitigations: [
      "Safe walking routes to school identified for each young person",
      "Road safety included in induction",
      "High-visibility items provided for dark months",
      "Minibus available for transport needs",
    ],
  },
  {
    id: "education", title: "Education & Activities", icon: GraduationCap, colour: "text-green-600",
    riskLevel: "low", lastUpdated: "2026-03-15",
    factors: [
      { factor: "Schools", assessment: "Good-rated secondary school within 1 mile. Two further schools within 3 miles. PRU available.", risk: "low" },
      { factor: "Colleges", assessment: "City College (Ofsted: Good) within 2 miles. Multiple courses suitable for 16+ young people.", risk: "low" },
      { factor: "Activities / leisure", assessment: "Sports centre, library, and park within walking distance. Swimming pool within 2 miles.", risk: "low" },
      { factor: "Clubs / groups", assessment: "Youth club, scouts, and sports clubs available locally. Staff support attendance.", risk: "low" },
    ],
    mitigations: [
      "Good partnership working with local schools",
      "Activity programme utilises local resources",
      "Transport provided to activities further afield",
    ],
  },
  {
    id: "health", title: "Health Services", icon: Heart, colour: "text-pink-600",
    riskLevel: "low", lastUpdated: "2026-03-15",
    factors: [
      { factor: "GP access", assessment: "Registered with local GP surgery within 0.5 miles. Good appointment availability.", risk: "low" },
      { factor: "Hospital / A&E", assessment: "A&E within 3 miles. Response times good.", risk: "low" },
      { factor: "Dental", assessment: "NHS dental practice accepting new patients within 1 mile.", risk: "low" },
      { factor: "CAMHS", assessment: "CAMHS service available. Current wait times: 6-8 weeks for new referrals.", risk: "medium" },
      { factor: "Pharmacy", assessment: "Multiple pharmacies within walking distance.", risk: "low" },
    ],
    mitigations: [
      "All young people registered with GP and dentist",
      "CAMHS relationships maintained for expedited access where needed",
      "Health appointments prioritised and accompanied",
    ],
  },
  {
    id: "emergency", title: "Emergency Services", icon: Phone, colour: "text-teal-600",
    riskLevel: "low", lastUpdated: "2026-03-15",
    factors: [
      { factor: "Police response", assessment: "Local police station within 2 miles. Average response time: 8 minutes for emergencies.", risk: "low" },
      { factor: "Fire service", assessment: "Fire station within 3 miles. Response time within target.", risk: "low" },
      { factor: "Ambulance", assessment: "Good ambulance response times for the area.", risk: "low" },
    ],
    mitigations: [
      "Emergency procedures displayed throughout the home",
      "All staff trained in emergency protocols",
      "Fire risk assessment current",
    ],
  },
  {
    id: "monitoring", title: "Monitoring & Review", icon: Eye, colour: "text-amber-600",
    riskLevel: "low", lastUpdated: "2026-03-15",
    factors: [
      { factor: "Ofsted notifications", assessment: "Home compliant with Reg 40 notification requirements.", risk: "low" },
      { factor: "Reg 44 visits", assessment: "Monthly visits conducted. Locality issues discussed with visitor.", risk: "low" },
      { factor: "Police liaison", assessment: "Regular contact with local policing team. Information sharing in place.", risk: "low" },
      { factor: "Multi-agency working", assessment: "Active participation in local safeguarding arrangements.", risk: "low" },
    ],
    mitigations: [
      "Quarterly locality risk review cycle",
      "Police community briefings reviewed",
      "Multi-agency intelligence integrated into individual risk assessments",
    ],
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function LocationAssessmentPage() {
  const [expanded, setExpanded] = useState<string | null>("neighbourhood");

  const totalRisks = AREAS.length;
  const highRisks = AREAS.filter((a) => a.riskLevel === "high").length;
  const mediumRisks = AREAS.filter((a) => a.riskLevel === "medium").length;

  return (
    <PageShell
      title="Location Assessment"
      subtitle="Regulation 46 — Suitability of the home's location for children's care"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Location Assessment — Oak House" />
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
          {AREAS.map((area) => {
            const isExpanded = expanded === area.id;
            const Icon = area.icon;

            return (
              <div key={area.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : area.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5", area.colour)} />
                    <div>
                      <p className="font-medium">{area.title}</p>
                      <p className="text-xs text-muted-foreground">Updated: {area.lastUpdated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", RISK_COLORS[area.riskLevel])}>
                      {area.riskLevel.charAt(0).toUpperCase() + area.riskLevel.slice(1)} Risk
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
    </PageShell>
  );
}
