"use client";

import { useHomeName } from "@/hooks/use-home-profile";
import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home, Heart, GraduationCap, Shield, Users, Star, MapPin,
  ChevronDown, ChevronUp, CheckCircle2, Stethoscope, Activity,
  Palette, BookOpen, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalOfferSections } from "@/hooks/use-local-offer-sections";
import type { LocalOfferSection, LocalOfferCategory } from "@/types/extended";
import { LOCAL_OFFER_CATEGORY_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const CAT_META: Record<LocalOfferCategory, { label: string; color: string; icon: React.ElementType }> = {
  care: { label: "Care & Nurture", color: "bg-pink-100 text-pink-800", icon: Heart },
  education: { label: "Education", color: "bg-blue-100 text-blue-800", icon: GraduationCap },
  health: { label: "Health & Wellbeing", color: "bg-green-100 text-green-800", icon: Stethoscope },
  safety: { label: "Safety & Protection", color: "bg-red-100 text-red-800", icon: Shield },
  activities: { label: "Activities & Leisure", color: "bg-amber-100 text-amber-800", icon: Palette },
  community: { label: "Community", color: "bg-purple-100 text-purple-800", icon: MapPin },
  independence: { label: "Independence", color: "bg-teal-100 text-teal-800", icon: Star },
  therapeutic: { label: "Therapeutic", color: "bg-indigo-100 text-indigo-800", icon: Heart },
  environment: { label: "Environment", color: "bg-emerald-100 text-emerald-800", icon: Home },
  workforce: { label: "Workforce", color: "bg-slate-100 text-[var(--cs-text-secondary)]", icon: Users },
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function LocalOfferPage() {
  const homeName = useHomeName();
  const { data: records = [], isLoading } = useLocalOfferSections();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageShell title="Local Offer" subtitle={`What ${homeName} Offers · Our Strengths · Our Commitments`}>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Local Offer"
      subtitle={`What ${homeName} Offers · Our Strengths · Our Commitments`}
      caraContext={{ pageTitle: "Local Offer", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title={`${homeName} — Local Offer`} />
          <CaraStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }>
      <div id="print-area">
        {/* intro */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Home className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800">{`${homeName} — Our Local Offer`}</p>
              <p className="text-blue-700">{`This document sets out what ${homeName} offers to the children in our care, their families, and our local community. It is designed to help placing authorities, social workers, and families understand what we provide and how we deliver it. This document is shared with prospective placing authorities as part of the referral process and is reviewed annually alongside the Statement of Purpose.`}</p>
            </div>
          </div>
        </div>

        {/* quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card>
            <CardContent className="pt-3 pb-2 text-center">
              <p className="text-lg font-bold text-blue-600">3</p>
              <p className="text-[10px] text-muted-foreground">Children (capacity 4)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-2 text-center">
              <p className="text-lg font-bold text-green-600">11–17</p>
              <p className="text-[10px] text-muted-foreground">Age Range</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-2 text-center">
              <p className="text-lg font-bold text-amber-600">Good</p>
              <p className="text-[10px] text-muted-foreground">Ofsted Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-2 text-center">
              <p className="text-lg font-bold text-purple-600">7</p>
              <p className="text-[10px] text-muted-foreground">Staff Team</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-2 text-center">
              <p className="text-lg font-bold text-green-600">100%</p>
              <p className="text-[10px] text-muted-foreground">Placement Stability</p>
            </CardContent>
          </Card>
        </div>

        {/* category cards */}
        <div className="space-y-3">
          {records.map((section) => {
            const isOpen = expandedId === section.id;
            const catMeta = CAT_META[section.category] || CAT_META.care;
            const Icon = catMeta.icon;
            return (
              <Card key={section.id} className="border-l-4 border-l-blue-400">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : section.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className="h-4 w-4 text-blue-600" />
                        {section.title}
                        <Badge variant="outline" className={catMeta.color}>{catMeta.label}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{section.summary}</p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* what we offer */}
                    <div>
                      <p className="font-medium text-xs mb-1">What We Offer</p>
                      <ul className="space-y-0.5">
                        {section.what_we_offer.map((item, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 text-blue-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* how we deliver */}
                    <div>
                      <p className="font-medium text-xs mb-1">How We Deliver It</p>
                      <ul className="space-y-0.5">
                        {section.how_we_deliver.map((item, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-green-600 shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* evidence of impact */}
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <p className="font-medium text-xs text-green-800 mb-1">Evidence of Impact</p>
                      <ul className="space-y-0.5">
                        {section.evidence_of_impact.map((item, i) => (
                          <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                            <Star className="h-3 w-3 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Local Offer</p>
          <p>The Local Offer describes what a children&apos;s home provides for the children in its care. Under the Children and Families Act 2014, local authorities are required to publish a Local Offer for children with SEND, and children&apos;s homes should articulate their own offer clearly. The Statement of Purpose (Reg 16) and Children&apos;s Guide (Reg 19) complement this document. The Local Offer should be shared with placing authorities during the referral process and reviewed annually. Ofsted inspectors use the Statement of Purpose and Local Offer to understand the home&apos;s intended purpose and assess whether practice matches the stated offer.</p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Activities & Education"
        category={["activity", "education"]}
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext={`Local Offer — what ${homeName} provides to children and families, care commitments, education, health, therapeutic services, activities, community links, independence, workforce`}
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}
