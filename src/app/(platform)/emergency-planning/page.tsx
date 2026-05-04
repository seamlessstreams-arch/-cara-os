"use client";

import { useState } from "react";
import {
  AlertOctagon, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Phone, Shield,
  Flame, CloudRain, Zap, Bug, Car,
  Heart, Building2, RefreshCw,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ── types ───────────────────────────────────────────────────────────── */
interface EmergencyPlan {
  id: string;
  title: string;
  icon: React.ElementType;
  colour: string;
  scenario: string;
  immediateActions: string[];
  contactSequence: { who: string; number: string; when: string }[];
  evacuationRequired: boolean;
  assemblyPoint: string | null;
  childConsiderations: string[];
  staffRoles: string[];
  equipmentNeeded: string[];
  recoveryActions: string[];
  lastTested: string;
  nextTest: string;
  status: "current" | "review_due" | "draft";
}

/* ── data ────────────────────────────────────────────────────────────── */
const PLANS: EmergencyPlan[] = [
  {
    id: "ep_1", title: "Fire Evacuation", icon: Flame, colour: "text-red-600",
    scenario: "Fire detected in the building or fire alarm activated. Applies to any time of day or night, including sleep-in and waking night shifts.",
    immediateActions: [
      "Activate fire alarm if not already sounding",
      "Shout 'FIRE' clearly to alert all occupants",
      "Assist all young people to evacuate via nearest safe exit",
      "Close doors behind you as you leave",
      "Do NOT use lifts",
      "Proceed to assembly point — front garden by the gate",
      "Call 999 — Fire Service",
      "Take roll call using grab bags / head count",
      "Do NOT re-enter the building for any reason",
    ],
    contactSequence: [
      { who: "Fire Service", number: "999", when: "Immediately" },
      { who: "Registered Manager (Darren)", number: "07XXX XXXXXX", when: "Immediately after 999" },
      { who: "Deputy Manager (Ryan)", number: "07XXX XXXXXX", when: "If RM unavailable" },
      { who: "On-call Manager", number: "07XXX XXXXXX", when: "Out of hours" },
      { who: "Social Workers (all YP)", number: "As per contact list", when: "As soon as safe" },
      { who: "Parents/Carers", number: "As per contact list", when: "As soon as safe" },
      { who: "Ofsted", number: "0300 123 1231", when: "Within 24 hours" },
    ],
    evacuationRequired: true,
    assemblyPoint: "Front garden, by the main gate. If unsafe, secondary point: neighbour's driveway at No. 42.",
    childConsiderations: [
      "Alex may need direct verbal prompting to leave room — anxiety can cause freezing",
      "Jordan may become distressed — reassurance and calm voice essential",
      "Casey may be disoriented if woken from sleep — guide physically if needed",
      "Grab bags are in the office — take if safe to do so, but NEVER delay evacuation",
      "Comfort items can be retrieved LATER — young people's safety is the only priority",
    ],
    staffRoles: [
      "First staff to discover: Raise alarm, begin evacuation of nearest young people",
      "Second staff: Check all bedrooms and bathrooms, close doors",
      "Sleep-in/Waking night: Assume lead — follow same protocol, call for backup immediately",
      "RM/Deputy: Coordinate response, liaise with emergency services, notify contacts",
    ],
    equipmentNeeded: [
      "Fire extinguishers (locations: hallway, kitchen, office)",
      "Fire blanket (kitchen)",
      "Torches (office drawer, each bedroom)",
      "Emergency grab bags (office — top shelf)",
      "First aid kit (office)",
      "Mobile phone with emergency contacts",
    ],
    recoveryActions: [
      "Account for all young people and staff",
      "Arrange alternative accommodation if home is uninhabitable",
      "Notify Ofsted within 24 hours (Reg 40)",
      "Complete incident report",
      "Debrief with young people — age-appropriate",
      "Staff debrief and wellbeing check",
      "Review fire risk assessment within 48 hours",
    ],
    lastTested: "2026-04-15", nextTest: "2026-05-15", status: "current",
  },
  {
    id: "ep_2", title: "Power Failure", icon: Zap, colour: "text-yellow-600",
    scenario: "Complete loss of electrical power to the property. May be localised or area-wide.",
    immediateActions: [
      "Check trip switches in fuse box (utility room)",
      "If localised: reset trips. If area-wide: contact utility provider",
      "Deploy torches to all young people and common areas",
      "Check that young people are safe and calm",
      "Secure any food items that require refrigeration",
      "Monitor heating — if prolonged, consider alternative arrangements",
    ],
    contactSequence: [
      { who: "Western Power Distribution", number: "105", when: "Immediately if area-wide" },
      { who: "Registered Manager", number: "07XXX XXXXXX", when: "If lasting >1 hour" },
      { who: "Maintenance contractor", number: "07XXX XXXXXX", when: "If electrical fault suspected" },
    ],
    evacuationRequired: false, assemblyPoint: null,
    childConsiderations: [
      "Casey may become anxious in the dark — provide torch and reassurance immediately",
      "Ensure medications requiring refrigeration are managed",
      "Young people may need distraction — board games, conversation",
    ],
    staffRoles: [
      "Senior staff: Assess cause and contact utility provider",
      "All staff: Ensure young people are safe and have light sources",
    ],
    equipmentNeeded: [
      "Torches (office drawer, each bedroom — check batteries monthly)",
      "Portable phone chargers (office)",
      "Battery-powered radio (office)",
      "Candles are NOT to be used due to fire risk",
    ],
    recoveryActions: [
      "Check all electrical appliances on restoration of power",
      "Check food safety — discard anything from fridge/freezer if power out >4 hours",
      "Record incident in log",
    ],
    lastTested: "2026-02-01", nextTest: "2026-08-01", status: "current",
  },
  {
    id: "ep_3", title: "Flood / Water Damage", icon: CloudRain, colour: "text-blue-600",
    scenario: "Significant water ingress from burst pipe, extreme weather, or other water damage.",
    immediateActions: [
      "If burst pipe: turn off water at stopcock (under kitchen sink)",
      "Move young people away from affected area",
      "Turn off electricity to affected area at fuse box if water near electrics",
      "Contain water spread with towels, buckets",
      "Contact emergency plumber / contractor",
    ],
    contactSequence: [
      { who: "Emergency Plumber", number: "07XXX XXXXXX", when: "Immediately" },
      { who: "Registered Manager", number: "07XXX XXXXXX", when: "Immediately" },
      { who: "Insurance (building)", number: "0800 XXX XXXX", when: "Within 24 hours" },
    ],
    evacuationRequired: false, assemblyPoint: null,
    childConsiderations: [
      "If bedrooms affected, relocate young people to dry rooms",
      "Salvage personal belongings where safe to do so",
      "Reassure young people — especially those with attachment to their room/belongings",
    ],
    staffRoles: [
      "Senior staff: Coordinate response, manage water shut-off",
      "All staff: Assist with containment and young people's welfare",
    ],
    equipmentNeeded: [
      "Stopcock key (under kitchen sink — labelled)",
      "Towels and buckets (utility room)",
      "Wet/dry vacuum (if available)",
      "Dehumidifier (storage room)",
    ],
    recoveryActions: [
      "Assess structural damage",
      "Arrange repairs",
      "Insurance claim if significant",
      "Alternative accommodation if uninhabitable",
      "Record incident and notify Ofsted if significant impact on care",
    ],
    lastTested: "N/A — scenario-based", nextTest: "2026-09-01", status: "current",
  },
  {
    id: "ep_4", title: "Infectious Disease Outbreak", icon: Bug, colour: "text-green-600",
    scenario: "Multiple cases of infectious illness (vomiting, diarrhea, flu, COVID, or other communicable disease).",
    immediateActions: [
      "Isolate affected individuals where possible",
      "Implement enhanced cleaning protocols",
      "Contact GP / NHS 111 for medical advice",
      "Record symptoms and onset times",
      "Restrict visitors if advised by health professionals",
    ],
    contactSequence: [
      { who: "GP Surgery", number: "0121 XXX XXXX", when: "Immediately" },
      { who: "NHS 111", number: "111", when: "Out of hours" },
      { who: "Registered Manager", number: "07XXX XXXXXX", when: "Immediately" },
      { who: "UK Health Security Agency", number: "Via NHS guidance", when: "If notifiable disease" },
      { who: "Social Workers", number: "As per contact list", when: "If young person affected" },
      { who: "Ofsted", number: "0300 123 1231", when: "If significant impact (Reg 40)" },
    ],
    evacuationRequired: false, assemblyPoint: null,
    childConsiderations: [
      "Young people may be frightened — age-appropriate reassurance",
      "Maintain contact arrangements where safe to do so (phone/video)",
      "Education absence to be recorded and schools notified",
      "Medications to continue as prescribed",
    ],
    staffRoles: [
      "RM: Coordinate response, notify relevant parties",
      "All staff: Enhanced hygiene, monitoring, record keeping",
      "Agency staff may be needed if multiple staff affected",
    ],
    equipmentNeeded: [
      "PPE (gloves, masks — office)",
      "Enhanced cleaning supplies",
      "Clinical waste bags",
      "Thermometers",
    ],
    recoveryActions: [
      "Deep clean of affected areas",
      "Staff debrief",
      "Review infection control procedures",
      "Notify Ofsted if meets Reg 40 threshold",
    ],
    lastTested: "N/A — scenario-based", nextTest: "2026-10-01", status: "current",
  },
  {
    id: "ep_5", title: "Serious Incident (Requiring Emergency Services)", icon: Heart, colour: "text-pink-600",
    scenario: "Serious injury, medical emergency, or other incident requiring ambulance or police attendance.",
    immediateActions: [
      "Call 999 immediately — state the emergency clearly",
      "Administer first aid if trained and safe to do so",
      "Do NOT move seriously injured person unless life-threatening danger",
      "Clear area of other young people — separate staff to manage others",
      "Preserve the scene if police may be involved",
      "Stay on the line with 999 until help arrives",
    ],
    contactSequence: [
      { who: "Emergency Services", number: "999", when: "Immediately" },
      { who: "Registered Manager", number: "07XXX XXXXXX", when: "Immediately after 999" },
      { who: "Social Worker of affected child", number: "As per contact list", when: "Immediately" },
      { who: "Parents/Carers", number: "As per contact list", when: "As soon as possible" },
      { who: "Ofsted", number: "0300 123 1231", when: "Within 24 hours (Reg 40)" },
      { who: "LADO (if allegation)", number: "As per local arrangements", when: "Immediately if relevant" },
    ],
    evacuationRequired: false, assemblyPoint: null,
    childConsiderations: [
      "Other young people must be shielded from distressing scenes",
      "Assign dedicated staff member to each unaffected young person",
      "Age-appropriate explanation — do not lie but protect from unnecessary detail",
      "Watch for delayed trauma responses in the following days",
    ],
    staffRoles: [
      "First responder: Call 999, administer first aid",
      "Second staff: Manage other young people, clear area",
      "RM/Deputy: Coordinate notifications, liaise with emergency services",
      "All staff: Post-incident support and recording",
    ],
    equipmentNeeded: [
      "First aid kit (office — fully stocked)",
      "AED (if available)",
      "Medication records (for paramedics)",
      "Young person's care file / health passport",
    ],
    recoveryActions: [
      "Complete incident report",
      "Notify Ofsted (Reg 40)",
      "Staff debrief and wellbeing checks",
      "Young people's debrief — age-appropriate",
      "Review risk assessments",
      "Consider Critical Incident Stress Debriefing",
    ],
    lastTested: "2026-03-01", nextTest: "2026-09-01", status: "current",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function EmergencyPlanningPage() {
  const [expanded, setExpanded] = useState<string | null>("ep_1");

  const today = new Date().toISOString().slice(0, 10);
  const testsDue = PLANS.filter((p) => p.nextTest <= today).length;

  return (
    <PageShell
      title="Emergency Planning"
      subtitle="Business continuity and emergency response procedures"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Emergency Planning — Oak House" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Emergency Plans", value: PLANS.length, icon: AlertOctagon, colour: "text-red-600" },
            { label: "All Current", value: PLANS.filter((p) => p.status === "current").length, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Tests Due", value: testsDue, icon: RefreshCw, colour: testsDue > 0 ? "text-orange-600" : "text-slate-400" },
            { label: "Evacuation Plans", value: PLANS.filter((p) => p.evacuationRequired).length, icon: Building2, colour: "text-blue-600" },
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

        {/* ── emergency contacts banner ─────────────────────────── */}
        <div className="rounded-xl bg-red-50 border-2 border-red-300 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="h-5 w-5 text-red-600" />
            <p className="font-bold text-red-800">Emergency Contacts — Quick Reference</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="font-medium">Emergency:</span> 999</div>
            <div><span className="font-medium">Non-Emergency:</span> 101</div>
            <div><span className="font-medium">RM (Darren):</span> 07XXX XXXXXX</div>
            <div><span className="font-medium">Deputy (Ryan):</span> 07XXX XXXXXX</div>
            <div><span className="font-medium">NHS:</span> 111</div>
            <div><span className="font-medium">Ofsted:</span> 0300 123 1231</div>
            <div><span className="font-medium">Gas Emergency:</span> 0800 111 999</div>
            <div><span className="font-medium">Power:</span> 105</div>
          </div>
        </div>

        {/* ── plans ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          {PLANS.map((plan) => {
            const isExpanded = expanded === plan.id;
            const Icon = plan.icon;
            const testDue = plan.nextTest <= today;

            return (
              <div key={plan.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : plan.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-5 w-5", plan.colour)} />
                    <div>
                      <p className="font-medium">{plan.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Last tested: {plan.lastTested} · Next: {plan.nextTest}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {testDue && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Test Due</Badge>}
                    {plan.evacuationRequired && <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Evacuation</Badge>}
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Current</Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* scenario */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Scenario</p>
                      <p className="text-sm">{plan.scenario}</p>
                    </div>

                    {/* immediate actions */}
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-xs font-bold text-red-700 mb-2">IMMEDIATE ACTIONS</p>
                      <ol className="space-y-1">
                        {plan.immediateActions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="font-bold text-red-700 shrink-0">{i + 1}.</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* contact sequence */}
                    <div>
                      <p className="text-sm font-medium mb-2">Contact Sequence</p>
                      <div className="space-y-1">
                        {plan.contactSequence.map((contact, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg border bg-white p-2 text-sm">
                            <Phone className="h-3 w-3 text-blue-600 shrink-0" />
                            <span className="font-medium flex-1">{contact.who}</span>
                            <span className="font-mono text-xs">{contact.number}</span>
                            <Badge variant="outline" className="text-[10px]">{contact.when}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* assembly point */}
                    {plan.assemblyPoint && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-medium text-amber-700 mb-1">Assembly Point</p>
                        <p className="text-sm">{plan.assemblyPoint}</p>
                      </div>
                    )}

                    {/* child considerations */}
                    <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                      <p className="text-xs font-medium text-pink-700 mb-2">Child-Specific Considerations</p>
                      <ul className="space-y-1">
                        {plan.childConsiderations.map((c, i) => (
                          <li key={i} className="flex items-start gap-1 text-sm">
                            <AlertTriangle className="h-3 w-3 text-pink-600 mt-0.5 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* staff roles */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-medium text-blue-700 mb-2">Staff Roles</p>
                      <ul className="space-y-1">
                        {plan.staffRoles.map((r, i) => (
                          <li key={i} className="flex items-start gap-1 text-sm">
                            <Shield className="h-3 w-3 text-blue-600 mt-0.5 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* equipment */}
                    <div>
                      <p className="text-sm font-medium mb-2">Equipment Required</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.equipmentNeeded.map((e, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{e}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* recovery */}
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-xs font-medium text-green-700 mb-2">Recovery Actions</p>
                      <ul className="space-y-1">
                        {plan.recoveryActions.map((r, i) => (
                          <li key={i} className="flex items-start gap-1 text-sm">
                            <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                            <span>{r}</span>
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
          <strong>Business Continuity:</strong> The registered person must ensure that contingency plans
          are in place for all reasonably foreseeable emergencies. Plans must consider the specific needs
          of children in the home and be tested regularly. All staff must be familiar with emergency
          procedures and their specific roles. Plans should be reviewed after any incident and at least
          annually.
        </div>
      </div>
    </PageShell>
  );
}
