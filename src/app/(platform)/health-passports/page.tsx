"use client";

import { useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
  Pill, Phone, Heart, Calendar, Shield, Eye, Ear,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

interface Medication {
  name: string;
  dose: string;
  frequency: string;
  prescribedFor: string;
  prescribedBy: string;
}

interface Allergy {
  allergen: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe" | "life_threatening";
}

interface HealthContact {
  role: string;
  name: string;
  phone: string;
  address: string;
}

interface HealthPassport {
  id: string;
  youngPersonId: string;
  lastUpdated: string;
  updatedBy: string;
  nhsNumber: string;
  bloodType: string;
  medications: Medication[];
  allergies: Allergy[];
  conditions: { condition: string; managedBy: string; notes: string }[];
  immunisationsUpToDate: boolean;
  immunisationNotes: string;
  dietaryNeeds: string;
  healthContacts: HealthContact[];
  mentalHealth: string;
  sensoryNeeds: string | null;
  emergencyInfo: string;
  consentStatus: string;
  lastHealthAssessment: string;
  nextHealthAssessment: string;
  dentalCheckDate: string;
  opticalCheckDate: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEVERITY_META: Record<string, { label: string; color: string }> = {
  mild: { label: "Mild", color: "bg-green-100 text-green-800" },
  moderate: { label: "Moderate", color: "bg-amber-100 text-amber-800" },
  severe: { label: "Severe", color: "bg-orange-100 text-orange-800" },
  life_threatening: { label: "Life Threatening", color: "bg-red-100 text-red-800" },
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: HealthPassport[] = [
  {
    id: "hp_001", youngPersonId: "yp_alex", lastUpdated: d(-14), updatedBy: "staff_ryan",
    nhsNumber: "943 812 6547", bloodType: "O+",
    medications: [
      { name: "Salbutamol inhaler", dose: "2 puffs", frequency: "PRN (as needed for asthma symptoms)", prescribedFor: "Asthma", prescribedBy: "Dr M. Patel, Eastbrook Medical Practice" },
      { name: "Montelukast", dose: "5mg", frequency: "Once daily (evening)", prescribedFor: "Asthma prevention", prescribedBy: "Dr M. Patel, Eastbrook Medical Practice" },
    ],
    allergies: [
      { allergen: "Penicillin", reaction: "Skin rash and mild swelling", severity: "moderate" },
    ],
    conditions: [
      { condition: "Asthma", managedBy: "GP + asthma nurse", notes: "Well-controlled with current medication. Reliever inhaler must be accessible at all times (school, home, sports bag). Asthma action plan in bedroom and with school nurse. Triggers: cold air, exercise (especially running), dust. Peak flow monitored weekly." },
    ],
    immunisationsUpToDate: true,
    immunisationNotes: "All childhood immunisations up to date. HPV vaccine course completed. Flu vaccine offered annually — Alex agreed to have it this year.",
    dietaryNeeds: "No specific dietary requirements. Good appetite. Drinks plenty of water (important for asthma management). Prefers home-cooked meals. Enjoys pasta, chicken, rice dishes. Dislikes mushrooms.",
    healthContacts: [
      { role: "GP", name: "Dr M. Patel", phone: "01234 567890", address: "Eastbrook Medical Practice, 42 High Street" },
      { role: "Asthma Nurse", name: "Nurse S. Williams", phone: "01234 567891", address: "Eastbrook Medical Practice" },
      { role: "Dentist", name: "Mr R. Johnson", phone: "01234 678901", address: "Bright Smiles Dental, 15 Park Road" },
      { role: "Optician", name: "Specsavers, Town Centre", phone: "01234 789012", address: "12 Market Street" },
    ],
    mentalHealth: "Generally good mental health. Some anxiety around family contact — managed through key working and activity-based therapeutic support. No CAMHS involvement. Emotionally resilient but can struggle to express vulnerability. Staff should watch for withdrawal patterns on contact days.",
    sensoryNeeds: null,
    emergencyInfo: "ASTHMA: If Alex is wheezing or short of breath — administer 2 puffs of Salbutamol via spacer. Wait 5 minutes. If no improvement, repeat. If still no improvement after 10 puffs or breathing worsens, call 999. ALLERGY: Penicillin — do not administer any penicillin-based antibiotics. Alert all medical professionals. Alex wears a medical alert bracelet.",
    consentStatus: "Social worker (Lisa Green) holds delegated authority for routine medical decisions. GP and dental appointments — home staff can consent. Hospital admissions — contact SW and RM. Alex can consent to own treatment for some decisions (Gillick competent for routine care).",
    lastHealthAssessment: d(-90),
    nextHealthAssessment: d(90),
    dentalCheckDate: d(-120),
    opticalCheckDate: d(-180),
  },
  {
    id: "hp_002", youngPersonId: "yp_jordan", lastUpdated: d(-10), updatedBy: "staff_anna",
    nhsNumber: "756 934 2810", bloodType: "A+",
    medications: [
      { name: "Melatonin", dose: "3mg", frequency: "Once daily (bedtime, 20:45)", prescribedFor: "Sleep regulation (ASD-related sleep difficulties)", prescribedBy: "Dr K. Rahman, CAMHS" },
      { name: "Chloramphenicol eye drops", dose: "1 drop each eye", frequency: "4 times daily (08:00, 12:00, 16:00, 20:00)", prescribedFor: "Conjunctivitis (temporary — day 5 of 7-day course)", prescribedBy: "Dr M. Patel, Eastbrook Medical Practice" },
    ],
    allergies: [],
    conditions: [
      { condition: "Autism Spectrum Disorder (ASD)", managedBy: "CAMHS + school SENCO + SALT", notes: "Diagnosed age 6. EHCP in place. Communication needs — see language & communication profile. Sensory processing differences — see sensory profile. Routine-dependent. Transitions require visual preparation (Now-and-Next board). Meltdowns can occur with sensory overload — follow the sensory profile de-escalation protocol." },
      { condition: "Conjunctivitis (acute)", managedBy: "GP", notes: "Current infection, day 5 of 7-day antibiotic drop course. Resolving well. Eye drops can be uncomfortable for Jordan — use the agreed administration technique (Jordan lies down, staff applies drops while Jordan closes eyes, then opens). No swimming until course complete." },
    ],
    immunisationsUpToDate: true,
    immunisationNotes: "All immunisations up to date. Flu vaccine administered at school. Jordan found the injection experience distressing — social story prepared for future vaccinations.",
    dietaryNeeds: "Restricted diet linked to ASD — see dietary sheet. Preferred foods: plain pasta, chicken nuggets, toast, cereal, apples, cheese. Will not eat mixed foods, sauces, or foods that touch on the plate. Uses a specific blue plate and cup (sensory preference). New foods introduced very gradually — not forced.",
    healthContacts: [
      { role: "GP", name: "Dr M. Patel", phone: "01234 567890", address: "Eastbrook Medical Practice, 42 High Street" },
      { role: "CAMHS", name: "Dr K. Rahman", phone: "01234 456789", address: "CAMHS Team, Riverside Centre" },
      { role: "SALT", name: "Ms F. Carter", phone: "01234 567123", address: "Meadowbank School" },
      { role: "Dentist", name: "Mr R. Johnson", phone: "01234 678901", address: "Bright Smiles Dental (familiar with ASD needs)" },
      { role: "OT", name: "Ms L. Bridges", phone: "01234 567456", address: "Community OT Service" },
    ],
    mentalHealth: "Anxiety is a significant feature — managed through routine, predictability, and sensory strategies. CAMHS involved for sleep and anxiety management. Jordan's anxiety increases with change (new people, new environments, unexpected events). Jordan communicates distress through behaviour rather than words — watch for hand-flapping, rocking, covering ears, withdrawal to bedroom.",
    sensoryNeeds: "Significant sensory processing differences. Hypersensitive to: noise (especially sudden or loud), certain textures (clothing labels, some fabrics), bright lights. Hyposensitive to: deep pressure (weighted blanket is calming). Sensory toolkit in bedroom: weighted blanket, ear defenders, fidget tools, chewy tube. Sensory breaks built into daily routine (every 2 hours during school, as needed at home).",
    emergencyInfo: "ASD: If Jordan is in meltdown — do NOT touch, do NOT raise voice, reduce sensory input (dim lights, reduce noise), offer ear defenders, allow space. Stay nearby but at a safe distance. Use minimal language: 'You're safe. I'm here.' Meltdowns can last 10-30 minutes. Do not attempt to reason or redirect during a meltdown. After meltdown — offer weighted blanket, quiet space, preferred activity. MEDICATION: Melatonin is time-critical at 20:45 — late administration disrupts sleep pattern significantly.",
    consentStatus: "Social worker holds delegated authority for medical decisions. Jordan's advocate should be consulted for significant medical decisions. Jordan can indicate preferences through visual tools — these must be respected. EHCP requires consultation with the multi-disciplinary team for health-related changes.",
    lastHealthAssessment: d(-60),
    nextHealthAssessment: d(120),
    dentalCheckDate: d(-90),
    opticalCheckDate: d(-150),
  },
  {
    id: "hp_003", youngPersonId: "yp_casey", lastUpdated: d(-7), updatedBy: "staff_chervelle",
    nhsNumber: "812 467 3921", bloodType: "B+",
    medications: [
      { name: "Fluoxetine", dose: "20mg", frequency: "Once daily (morning, with breakfast)", prescribedFor: "Depression and anxiety", prescribedBy: "Dr K. Rahman, CAMHS" },
      { name: "Melatonin", dose: "6mg", frequency: "Once daily (bedtime, 21:00)", prescribedFor: "Sleep difficulties", prescribedBy: "Dr K. Rahman, CAMHS" },
    ],
    allergies: [
      { allergen: "Latex", reaction: "Contact dermatitis — red, itchy rash", severity: "mild" },
    ],
    conditions: [
      { condition: "Depression", managedBy: "CAMHS (Dr K. Rahman)", notes: "Diagnosed 18 months ago. Currently on Fluoxetine 20mg. CAMHS reviews every 6 weeks. Mood has been low since LADO investigation began. Self-harm history — see safety plan. Casey sometimes refuses medication — staff should encourage but not force. If Casey refuses Fluoxetine for more than 2 consecutive days, contact CAMHS." },
      { condition: "Self-harm (active risk)", managedBy: "CAMHS + home safety plan", notes: "History of cutting and scratching. Most recent incident d(-4). Safety plan in place — located in Casey's file AND copy in staff office. 30-minute night checks. Environmental risk assessment — window restrictor in place, sharps removed from bedroom. Distress tolerance toolkit in Casey's room (box on shelf). If self-harm occurs: treat injuries (first aid), comfort Casey, document, contact CAMHS if wounds require medical attention." },
    ],
    immunisationsUpToDate: false,
    immunisationNotes: "Casey refused HPV vaccine at school. Catch-up offered — Casey declined. Casey has capacity to make this decision. Discussed with school nurse and SW — decision recorded and respected. All other immunisations up to date.",
    dietaryNeeds: "No medical dietary requirements. Casey is currently interested in vegetarianism — menu adapted to include vegetarian options. Casey sometimes skips meals when low in mood — staff to monitor and offer alternatives without pressure. Casey enjoys cooking and baking — used therapeutically.",
    healthContacts: [
      { role: "GP", name: "Dr M. Patel", phone: "01234 567890", address: "Eastbrook Medical Practice, 42 High Street" },
      { role: "CAMHS", name: "Dr K. Rahman", phone: "01234 456789", address: "CAMHS Team, Riverside Centre" },
      { role: "CAMHS Crisis", name: "Crisis Line", phone: "01234 456000", address: "24-hour mental health crisis line" },
      { role: "Dentist", name: "Mr R. Johnson", phone: "01234 678901", address: "Bright Smiles Dental, 15 Park Road" },
      { role: "Sexual Health", name: "The Brook", phone: "01234 890123", address: "Brook Centre, Town Centre" },
    ],
    mentalHealth: "Casey has significant mental health needs. Depression and anxiety managed with Fluoxetine. CAMHS involvement ongoing. Self-harm risk is HIGH — safety plan must be followed by all staff. Casey's emotional state is currently deteriorating due to LADO investigation and exploitation concerns. Casey uses defensive humour and bravado to mask distress. Key indicators of deterioration: withdrawal to bedroom, refusal of meals, refusal of medication, increase in contact attempts with Marcus. Chervelle is Casey's primary emotional support within the staff team.",
    sensoryNeeds: null,
    emergencyInfo: "SELF-HARM: If Casey is found self-harming or has self-harmed: (1) Stay calm. (2) Administer first aid for any wounds. (3) Contact on-call manager. (4) If wounds are deep or bleeding won't stop, call 999. (5) Stay with Casey — do not leave alone. (6) Contact CAMHS crisis line. (7) Document in incident log. MENTAL HEALTH CRISIS: If Casey expresses suicidal ideation — stay with Casey, remove access to means, call CAMHS crisis line immediately. Do not minimise or dismiss. LATEX: Use non-latex gloves for any first aid. Inform A&E of latex allergy if attending.",
    consentStatus: "Casey is Gillick competent for most health decisions. Casey has refused HPV vaccine — decision respected. Social worker holds delegated authority for medical decisions Casey is unable to make. Casey's consent is sought first for routine appointments. For sexual health — Casey can access services independently (Brook).",
    lastHealthAssessment: d(-45),
    nextHealthAssessment: d(135),
    dentalCheckDate: d(-60),
    opticalCheckDate: d(-200),
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function HealthPassportsPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <PageShell
      title="Health Passports"
      subtitle="Portable Health Summary · Key Health Information · Emergency Protocols"
      actions={<PrintButton title="Health Passports" />}
    >
      <div id="print-area">
        {/* summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start gap-2">
          <Stethoscope className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800">Health Passport Overview</p>
            <p className="text-blue-700">Each child has a portable health passport containing essential health information. This document travels with the child to appointments, hospital visits, respite, and placement transitions. It must be kept current and accessible to all staff on shift. Last updated information is shown for each child.</p>
          </div>
        </div>

        {/* alerts */}
        {data.some((p) => p.conditions.some((c) => c.condition.toLowerCase().includes("self-harm"))) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">Active Safety Plans</p>
              <p className="text-red-700">
                {data.filter((p) => p.conditions.some((c) => c.condition.toLowerCase().includes("self-harm"))).map((p) => getYPName(p.youngPersonId)).join(", ")} — has an active self-harm safety plan. All staff must be familiar with the safety plan before working with this child.
              </p>
            </div>
          </div>
        )}

        {/* health passport cards */}
        <div className="space-y-3">
          {data.map((passport) => {
            const isOpen = expandedId === passport.id;
            const hasSevereAllergy = passport.allergies.some((a) => a.severity === "severe" || a.severity === "life_threatening");
            const hasActiveCondition = passport.conditions.some((c) => c.condition.toLowerCase().includes("self-harm") || c.condition.toLowerCase().includes("acute"));
            return (
              <Card key={passport.id} className={cn(
                "border-l-4",
                hasActiveCondition ? "border-l-red-500" : hasSevereAllergy ? "border-l-orange-400" : "border-l-green-400"
              )}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : passport.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-blue-600" />
                        {getYPName(passport.youngPersonId)}
                        {passport.allergies.length > 0 && <Badge variant="outline" className="bg-orange-100 text-orange-800">{passport.allergies.length} allergy</Badge>}
                        {passport.medications.length > 0 && <Badge variant="outline" className="bg-green-100 text-green-800">{passport.medications.length} medication(s)</Badge>}
                        {!passport.immunisationsUpToDate && <Badge variant="outline" className="bg-amber-100 text-amber-800">Immunisations incomplete</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Blood type: {passport.bloodType} · Updated: {passport.lastUpdated} by {getStaffName(passport.updatedBy)} · Conditions: {passport.conditions.map((c) => c.condition).join(", ")}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* emergency info - always first */}
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="font-medium text-xs text-red-800 mb-1 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Emergency Information</p>
                      <p className="text-xs text-red-700 whitespace-pre-line">{passport.emergencyInfo}</p>
                    </div>

                    {/* medications */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1"><Pill className="h-4 w-4 text-green-600" /> Medications</p>
                      {passport.medications.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No current medications.</p>
                      ) : (
                        <div className="space-y-1">
                          {passport.medications.map((med, i) => (
                            <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-medium">{med.name} — {med.dose}</span>
                                <Badge variant="outline" className="text-[10px]">{med.frequency}</Badge>
                              </div>
                              <p className="text-muted-foreground">For: {med.prescribedFor} · Prescribed by: {med.prescribedBy}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* allergies */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1"><Shield className="h-4 w-4 text-orange-600" /> Allergies</p>
                      {passport.allergies.length === 0 ? (
                        <p className="text-xs text-green-700">No known allergies (NKA).</p>
                      ) : (
                        <div className="space-y-1">
                          {passport.allergies.map((allergy, i) => (
                            <div key={i} className="bg-orange-50 border border-orange-200 rounded p-2 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{allergy.allergen}</span>
                                <Badge variant="outline" className={SEVERITY_META[allergy.severity].color}>{SEVERITY_META[allergy.severity].label}</Badge>
                              </div>
                              <p className="text-muted-foreground">Reaction: {allergy.reaction}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* conditions */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1"><Heart className="h-4 w-4 text-red-600" /> Conditions</p>
                      {passport.conditions.map((cond, i) => (
                        <div key={i} className="bg-muted/40 rounded p-2 mb-1 text-xs">
                          <p className="font-medium mb-0.5">{cond.condition}</p>
                          <p className="text-muted-foreground mb-0.5">Managed by: {cond.managedBy}</p>
                          <p className="text-muted-foreground">{cond.notes}</p>
                        </div>
                      ))}
                    </div>

                    {/* immunisations */}
                    <div className="flex items-center gap-2">
                      {passport.immunisationsUpToDate ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      <div>
                        <p className="font-medium text-xs">{passport.immunisationsUpToDate ? "Immunisations Up To Date" : "Immunisations Incomplete"}</p>
                        <p className="text-xs text-muted-foreground">{passport.immunisationNotes}</p>
                      </div>
                    </div>

                    {/* dietary */}
                    <div>
                      <p className="font-medium text-xs mb-0.5">Dietary Needs</p>
                      <p className="text-xs text-muted-foreground">{passport.dietaryNeeds}</p>
                    </div>

                    {/* mental health */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Mental Health</p>
                      <p className="text-xs text-blue-700">{passport.mentalHealth}</p>
                    </div>

                    {/* sensory needs */}
                    {passport.sensoryNeeds && (
                      <div className="bg-purple-50 border border-purple-200 rounded p-2">
                        <p className="font-medium text-xs text-purple-800 mb-1 flex items-center gap-1"><Ear className="h-3.5 w-3.5" /> Sensory Needs</p>
                        <p className="text-xs text-purple-700">{passport.sensoryNeeds}</p>
                      </div>
                    )}

                    {/* health contacts */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1"><Phone className="h-4 w-4 text-blue-600" /> Health Contacts</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {passport.healthContacts.map((contact, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                            <p className="font-medium">{contact.role}: {contact.name}</p>
                            <p className="text-muted-foreground">{contact.phone} · {contact.address}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* appointments */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2 text-center text-xs">
                        <Calendar className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                        <p className="font-medium">Health Assessment</p>
                        <p className="text-muted-foreground">Last: {passport.lastHealthAssessment}</p>
                        <p className="text-muted-foreground">Next: {passport.nextHealthAssessment}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center text-xs">
                        <Stethoscope className="h-4 w-4 mx-auto mb-1 text-green-600" />
                        <p className="font-medium">Dental</p>
                        <p className="text-muted-foreground">Last: {passport.dentalCheckDate}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center text-xs">
                        <Eye className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                        <p className="font-medium">Optical</p>
                        <p className="text-muted-foreground">Last: {passport.opticalCheckDate}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center text-xs">
                        <Shield className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                        <p className="font-medium">Consent</p>
                        <p className="text-muted-foreground text-[10px]">{passport.consentStatus.slice(0, 60)}...</p>
                      </div>
                    </div>

                    {/* consent detail */}
                    <div>
                      <p className="font-medium text-xs mb-0.5">Consent & Delegated Authority</p>
                      <p className="text-xs text-muted-foreground">{passport.consentStatus}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Health Passports</p>
          <p>Health passports provide a portable summary of each child&apos;s essential health information. Under the Children&apos;s Homes Regulations 2015 (Reg 23) and the Quality Standards, children&apos;s homes must promote and protect each child&apos;s health and wellbeing. Health assessments must be completed within 20 working days of admission (initial) and annually thereafter. Children must be registered with a GP, dentist, and optician. Medication must be managed safely in line with the home&apos;s medication policy. Health passports should accompany the child to all medical appointments and should be shared during placement transitions. The passport must be kept up to date — reviewed at least quarterly or whenever health circumstances change.</p>
        </div>
      </div>
    </PageShell>
  );
}
