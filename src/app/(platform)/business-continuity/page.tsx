"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBcpScenarios } from "@/hooks/use-bcp-scenarios";
import type { BcpScenarioPlan } from "@/types/extended";
import { BCP_SEVERITY_LABEL } from "@/types/extended";
import {
  ChevronDown,
  ChevronUp,
  Phone,
  Flame,
  Droplets,
  Zap,
  Users,
  Wifi,
  CloudSnow,
  Building2,
  HeartPulse,
  ShieldCheck,
  Package,
  GitBranch,
  RotateCcw,
  AlertTriangle,
  ClipboardList,
  Info,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const ICON_MAP: Record<string, LucideIcon> = {
  flame: Flame,
  droplets: Droplets,
  zap: Zap,
  users: Users,
  wifi: Wifi,
  cloud_snow: CloudSnow,
  building2: Building2,
  heart_pulse: HeartPulse,
};

const SEV_CLR: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-amber-100 text-amber-800",
  medium: "bg-blue-100 text-blue-800",
};

const BORDER_SEV: Record<string, string> = {
  critical: "border-l-red-500",
  high: "border-l-amber-400",
  medium: "border-l-blue-400",
};

const todayDate = () => {
  const dt = new Date();
  return dt.toISOString().slice(0, 10);
};

const offsetDate = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

export default function BusinessContinuityPage() {
  const { data: res, isLoading } = useBcpScenarios();
  const scenarios = useMemo(() => res?.data ?? [], [res]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    sc_fire: true,
    sc_death: true,
  });
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  if (isLoading) {
    return (
      <PageShell title="Business Continuity Plan" subtitle="Emergency Preparedness · Operational Resilience · Civil Contingencies">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Business Continuity Plan"
      subtitle="Emergency Preparedness · Operational Resilience · Civil Contingencies"
      caraContext={{ pageTitle: "Business Continuity Plan", sourceType: "document" }}
      actions={<div className="flex items-center gap-2"><PrintButton title="Business Continuity Plan" /><CaraStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} /></div>}
    >
      <div id="print-area">
        {/* ── Review Status Banner ── */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
            <p className="font-semibold text-emerald-800">Document Review Status</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-emerald-700">
            <span>Last reviewed: <strong>{offsetDate(-45)}</strong> by {getStaffName("staff_darren")} (RM)</span>
            <span>Next review due: <strong>{offsetDate(45)}</strong></span>
            <span>Review frequency: Every 6 months or after any activation</span>
          </div>
        </div>

        {/* ── Section 1: Key Contacts ── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-indigo-600" />
              Key Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { role: "Emergency On-Call", name: getStaffName("staff_darren"), detail: "07XXX XXXXXX (24/7)", tag: "Primary" },
                { role: "Deputy On-Call", name: getStaffName("staff_ryan"), detail: "07XXX XXXXXX (backup)", tag: "Secondary" },
                { role: "Responsible Individual", name: getStaffName("staff_alicia"), detail: "07XXX XXXXXX", tag: "Escalation" },
                { role: "Head Office", name: "Avisaar Childrens Care Ltd", detail: "01332 XXX XXXX", tag: "Corporate" },
                { role: "LA Emergency Duty (Derby)", name: "Derby City Council", detail: "0300 XXX XXXX", tag: "External" },
                { role: "LA Emergency Duty (Notts)", name: "Nottinghamshire CC", detail: "0300 XXX XXXX", tag: "External" },
                { role: "Emergency Maintenance", name: "HomeFix 24/7", detail: "0800 XXX XXXX (ref: OAK-001)", tag: "Utilities" },
                { role: "Water Emergency", name: "Severn Trent", detail: "0800 783 4444", tag: "Utilities" },
                { role: "Power Emergency", name: "Western Power Distribution", detail: "105 (free call)", tag: "Utilities" },
                { role: "Gas Emergency", name: "National Gas", detail: "0800 111 999", tag: "Utilities" },
              ].map((c, i) => (
                <div key={i} className="flex items-start justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{c.role}</p>
                    <p className="text-sm text-muted-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.detail}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{c.tag}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Section 2: Scenario Plans ── */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Scenario Plans
          </h2>
          <div className="space-y-4">
            {scenarios.map((s) => {
              const open = expanded[s.id];
              const Icon = ICON_MAP[s.icon_key] ?? AlertTriangle;
              return (
                <Card key={s.id} className={cn("border-l-4", BORDER_SEV[s.severity])}>
                  <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(s.id)}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Icon className="h-4 w-4 text-indigo-600" />
                          {s.title}
                          <Badge variant="outline" className={SEV_CLR[s.severity]}>{BCP_SEVERITY_LABEL[s.severity]}</Badge>
                        </CardTitle>
                      </div>
                      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </CardHeader>
                  {open && (
                    <CardContent className="pt-0 space-y-2 text-sm">
                      {s.content.map((line, i) =>
                        line === "" ? (
                          <div key={i} className="h-2" />
                        ) : (
                          <p
                            key={i}
                            className={cn(
                              "text-muted-foreground",
                              line.startsWith("•") ? "pl-4" : "",
                              line.match(/^\d+\./) ? "pl-4" : "",
                              line.endsWith(":") ? "font-semibold text-foreground mt-2" : ""
                            )}
                          >
                            {line}
                          </p>
                        )
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* ── Section 3: Minimum Staffing Levels ── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-indigo-600" />Minimum Staffing Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Based on 3 young people in placement. Levels must be maintained at all times. Any shortfall requires immediate RM/on-call notification.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium">Period</th>
                    <th className="text-left p-2 font-medium">Times</th>
                    <th className="text-center p-2 font-medium">Minimum Staff</th>
                    <th className="text-center p-2 font-medium">Senior Required</th>
                    <th className="text-left p-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { period: "Weekday — Day", times: "07:00–22:00", min: 2, senior: "Yes", notes: "1 senior/shift leader + 1 RCW minimum" },
                    { period: "Weekday — Night", times: "22:00–07:00", min: 2, senior: "No", notes: "1 waking night + 1 sleep-in" },
                    { period: "Weekend — Day", times: "07:00–22:00", min: 2, senior: "Yes", notes: "Activities require additional risk assessment" },
                    { period: "Weekend — Night", times: "22:00–07:00", min: 2, senior: "No", notes: "1 waking night + 1 sleep-in" },
                    { period: "Bank Holiday", times: "07:00–22:00", min: 2, senior: "Yes", notes: "On-call RM must be available within 30 mins" },
                    { period: "Emergency Minimum", times: "Any", min: 1, senior: "Yes", notes: "Absolute minimum — only while replacement en route (max 2 hrs)" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2 font-medium">{row.period}</td>
                      <td className="p-2 text-muted-foreground">{row.times}</td>
                      <td className="p-2 text-center">
                        <Badge variant="outline" className={row.period === "Emergency Minimum" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}>{row.min}</Badge>
                      </td>
                      <td className="p-2 text-center text-muted-foreground">{row.senior}</td>
                      <td className="p-2 text-muted-foreground text-xs">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 4: Emergency Supplies Checklist ── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4 text-indigo-600" />Emergency Supplies Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-2">Grab Bag Contents (2 bags — office and kitchen exit)</p>
              <div className="grid gap-1 sm:grid-cols-2 text-sm text-muted-foreground">
                {["Young people's emergency contact cards", "Copy of current MAR charts", "Medication summary sheet", "Copy of Business Continuity Plan", "Cash float — minimum £100", "2 x torches with spare batteries", "Emergency blankets (foil) x 6", "High-vis vests x 6", "First aid kit (HSE compliant)", "Mobile phone + charger + power bank", "Pen, notepad, and blank incident forms", "Building keys (spare set)"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2"><ClipboardList className="h-3 w-3 text-emerald-600 shrink-0" /><span>{item}</span></div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">First Aid Supplies</p>
              <div className="grid gap-1 sm:grid-cols-2 text-sm text-muted-foreground">
                {["HSE-compliant first aid kit (office)", "HSE-compliant first aid kit (kitchen)", "Burns kit (kitchen)", "EpiPen — kitchen first aid box and office cabinet", "Defibrillator — main hallway (if installed)", "Eye wash station — kitchen"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2"><ClipboardList className="h-3 w-3 text-emerald-600 shrink-0" /><span>{item}</span></div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">Backup Medication List</p>
              <p className="text-sm text-muted-foreground">
                A paper copy of all current prescriptions and MAR charts is printed every Monday by the shift leader and stored in the medication cabinet. This includes dosage, timing, contraindications, and pharmacy contact details. In the event of IT failure, paper MARs become the primary record.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Section 5: Communication Tree ── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><GitBranch className="h-4 w-4 text-indigo-600" />Communication Tree</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">In any emergency, the following communication chain is activated. Each person is responsible for contacting the next level. If unable to reach someone, move to the next contact and retry later.</p>
            <div className="space-y-3">
              {[
                { step: 1, who: "Staff on duty (discovering staff member)", contacts: "999 (if applicable) + On-call Manager", timeframe: "Immediately" },
                { step: 2, who: `${getStaffName("staff_darren")} (RM / On-call)`, contacts: `${getStaffName("staff_alicia")} (RI) + ${getStaffName("staff_ryan")} (Deputy)`, timeframe: "Within 15 minutes" },
                { step: 3, who: `${getStaffName("staff_ryan")} (Deputy)`, contacts: "All rostered staff + agency if needed", timeframe: "Within 30 minutes" },
                { step: 4, who: `${getStaffName("staff_darren")} (RM)`, contacts: "Young people's social workers + LA emergency duty", timeframe: "Within 1 hour" },
                { step: 5, who: `${getStaffName("staff_alicia")} (RI)`, contacts: "Ofsted + Head Office + insurance", timeframe: "Within 24 hours" },
                { step: 6, who: `${getStaffName("staff_darren")} (RM)`, contacts: "Parents/carers as per placement plans", timeframe: "Within 24 hours" },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold">{s.step}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.who}</p>
                    <p className="text-sm text-muted-foreground">Contacts: {s.contacts}</p>
                    <p className="text-xs text-muted-foreground">Timeframe: {s.timeframe}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Section 6: Recovery Procedures ── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><RotateCcw className="h-4 w-4 text-indigo-600" />Recovery Procedures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {[
              { title: "Phase 1: Immediate Stabilisation (0–24 hours)", items: ["Ensure all young people and staff are safe and accounted for.", "Secure temporary accommodation if home is uninhabitable.", "Ensure medication continuity — contact pharmacy if needed.", "Complete all regulatory notifications (Ofsted, LA, social workers).", "Brief all staff — verbal and written communication."] },
              { title: "Phase 2: Short-Term Recovery (24 hours – 1 week)", items: ["Assess building safety and begin remediation if applicable.", "Restore IT systems and transfer any paper records to digital.", "Arrange therapeutic support for affected young people and staff.", "Review and adjust rotas to manage staff wellbeing.", "Insurance claim initiated and loss assessment completed."] },
              { title: "Phase 3: Return to Normal Operations (1–4 weeks)", items: ["Full return to home (if evacuated) — safety sign-off by RM and RI.", "Resume all normal routines, activities, and education.", "Post-incident review meeting with all staff.", "Update this Business Continuity Plan with lessons learned.", "Reg 45 report to include details of incident and response."] },
              { title: "Phase 4: Review and Learning (4+ weeks)", items: ["Formal debrief and lessons-learned report produced.", "Training needs identified and scheduled.", "Policy and procedure updates implemented.", "Share learning with Avisaar Childrens Care Ltd group (if applicable).", "RI to confirm sign-off that recovery is complete."] },
            ].map((phase, idx) => (
              <div key={idx}>
                <p className="font-semibold mb-1">{phase.title}</p>
                <div className="space-y-1 text-muted-foreground">
                  {phase.items.map((item, i) => (<p key={i} className="pl-4">• {item}</p>))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Regulatory Footer ── */}
        <div className="bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Regulatory Framework</p>
              <p>
                This Business Continuity Plan is maintained in accordance with the Civil Contingencies Act 2004,
                the Children&apos;s Homes (England) Regulations 2015 (Regulation 5, Regulation 12, Regulation 13),
                and the Guide to the Children&apos;s Homes Regulations including the Quality Standards. Ofsted
                inspectors will assess the home&apos;s emergency preparedness as part of the leadership and management
                judgement. This plan is reviewed every six months, following any activation, or following any significant
                change to the home&apos;s operation.
              </p>
              <p className="mt-2">
                Document owner: {getStaffName("staff_darren")} (Registered Manager) · Approved by: {getStaffName("staff_alicia")} (Responsible Individual) · Version: 3.1 · Classification: Internal — All Staff
              </p>
            </div>
          </div>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Business Continuity Plan — emergency scenarios, staffing failure, IT outage, evacuation, flood, fire, pandemic, critical incident, recovery plan, notification chain, Reg 44 evidence"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>
  );
}
