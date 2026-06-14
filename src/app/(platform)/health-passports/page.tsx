"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
  Pill, Phone, Heart, Calendar, Shield, Eye, Ear, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useHealthPassports } from "@/hooks/use-health-passports";
import type { HealthPassport, AllergySeverity } from "@/types/extended";
import { ALLERGY_SEVERITY_LABEL } from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const SEVERITY_META: Record<AllergySeverity, { label: string; color: string }> = {
  mild: { label: "Mild", color: "bg-green-100 text-green-800" },
  moderate: { label: "Moderate", color: "bg-amber-100 text-amber-800" },
  severe: { label: "Severe", color: "bg-orange-100 text-orange-800" },
  anaphylactic: { label: "Anaphylactic", color: "bg-red-100 text-red-800" },
  life_threatening: { label: "Life Threatening", color: "bg-red-100 text-red-800" },
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function HealthPassportsPage() {
  const { data: raw, isLoading } = useHealthPassports();
  const data = useMemo(() => raw?.data ?? [], [raw]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageShell title="Health Passports" subtitle="Loading…">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Health Passports"
      subtitle="Portable Health Summary · Key Health Information · Emergency Protocols"
      caraContext={{ pageTitle: "Health Passports", sourceType: "child_record" }}
      actions={<div className="flex items-center gap-2"><PrintButton title="Health Passports" /><CaraStudioQuickActionButton context={{ record_type: "health", record_id: "home_oak", home_id: "home_oak" }} /></div>}
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
                {data.filter((p) => p.conditions.some((c) => c.condition.toLowerCase().includes("self-harm"))).map((p) => getYPName(p.child_id)).join(", ")} — has an active self-harm safety plan. All staff must be familiar with the safety plan before working with this child.
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
                        {getYPName(passport.child_id)}
                        {passport.allergies.length > 0 && <Badge variant="outline" className="bg-orange-100 text-orange-800">{passport.allergies.length} allergy</Badge>}
                        {passport.medications.length > 0 && <Badge variant="outline" className="bg-green-100 text-green-800">{passport.medications.length} medication(s)</Badge>}
                        {!passport.immunisations_up_to_date && <Badge variant="outline" className="bg-amber-100 text-amber-800">Immunisations incomplete</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Blood type: {passport.blood_type} · Updated: {passport.last_updated} by {getStaffName(passport.updated_by)} · Conditions: {passport.conditions.map((c) => c.condition).join(", ")}
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
                      <p className="text-xs text-red-700 whitespace-pre-line">{passport.emergency_info}</p>
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
                              <p className="text-muted-foreground">For: {med.prescribed_for} · Prescribed by: {med.prescribed_by}</p>
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
                          <p className="text-muted-foreground mb-0.5">Managed by: {cond.managed_by}</p>
                          <p className="text-muted-foreground">{cond.notes}</p>
                        </div>
                      ))}
                    </div>

                    {/* immunisations */}
                    <div className="flex items-center gap-2">
                      {passport.immunisations_up_to_date ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                      <div>
                        <p className="font-medium text-xs">{passport.immunisations_up_to_date ? "Immunisations Up To Date" : "Immunisations Incomplete"}</p>
                        <p className="text-xs text-muted-foreground">{passport.immunisation_notes}</p>
                      </div>
                    </div>

                    {/* dietary */}
                    <div>
                      <p className="font-medium text-xs mb-0.5">Dietary Needs</p>
                      <p className="text-xs text-muted-foreground">{passport.dietary_needs}</p>
                    </div>

                    {/* mental health */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Mental Health</p>
                      <p className="text-xs text-blue-700">{passport.mental_health}</p>
                    </div>

                    {/* sensory needs */}
                    {passport.sensory_needs && (
                      <div className="bg-purple-50 border border-purple-200 rounded p-2">
                        <p className="font-medium text-xs text-purple-800 mb-1 flex items-center gap-1"><Ear className="h-3.5 w-3.5" /> Sensory Needs</p>
                        <p className="text-xs text-purple-700">{passport.sensory_needs}</p>
                      </div>
                    )}

                    {/* health contacts */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1"><Phone className="h-4 w-4 text-blue-600" /> Health Contacts</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {passport.health_contacts.map((contact, i) => (
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
                        <p className="text-muted-foreground">Last: {passport.last_health_assessment}</p>
                        <p className="text-muted-foreground">Next: {passport.next_health_assessment}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center text-xs">
                        <Stethoscope className="h-4 w-4 mx-auto mb-1 text-green-600" />
                        <p className="font-medium">Dental</p>
                        <p className="text-muted-foreground">Last: {passport.dental_check_date}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center text-xs">
                        <Eye className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                        <p className="font-medium">Optical</p>
                        <p className="text-muted-foreground">Last: {passport.optical_check_date}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center text-xs">
                        <Shield className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                        <p className="font-medium">Consent</p>
                        <p className="text-muted-foreground text-[10px]">{passport.consent_status.slice(0, 60)}...</p>
                      </div>
                    </div>

                    {/* consent detail */}
                    <div>
                      <p className="font-medium text-xs mb-0.5">Consent & Delegated Authority</p>
                      <p className="text-xs text-muted-foreground">{passport.consent_status}</p>
                    </div>

                    <SmartLinkPanel sourceType="health-passports" sourceId={passport.id} childId={passport.child_id} compact />
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
      <CareEventsPanel
        title="Care Events — Health"
        category="health"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
