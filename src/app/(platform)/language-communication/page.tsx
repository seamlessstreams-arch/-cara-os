"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
  BookOpen, Users, Ear, Volume2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useCommunicationProfiles } from "@/hooks/use-communication-profiles";
import type { CommunicationProfile, CommLevel, CommSupportLevel, CommEffectiveness, SendStatus } from "@/types/extended";
import { COMM_LEVEL_LABEL, COMM_SUPPORT_LEVEL_LABEL, COMM_EFFECTIVENESS_LABEL, SEND_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── UI metadata ─────────────────────────────────────────────────────────── */

const COMM_LEVEL_CLR: Record<CommLevel, string> = {
  age_appropriate: "bg-green-100 text-green-800",
  below_age: "bg-amber-100 text-amber-800",
  significant_need: "bg-red-100 text-red-800",
  non_verbal: "bg-purple-100 text-purple-800",
};

const SUPPORT_CLR: Record<CommSupportLevel, string> = {
  no_additional: "bg-green-100 text-green-800",
  some_support: "bg-blue-100 text-blue-800",
  significant_support: "bg-amber-100 text-amber-800",
  specialist: "bg-red-100 text-red-800",
};

const EFFECT_CLR: Record<CommEffectiveness, string> = {
  effective: "text-green-700",
  partially_effective: "text-amber-700",
  not_effective: "text-red-700",
  not_yet_evaluated: "text-[var(--cs-text-muted)]",
};

export default function LanguageCommunicationPage() {
  const { data: res, isLoading } = useCommunicationProfiles();
  const data: CommunicationProfile[] = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const specialistCount = data.filter((p) => p.support_level === "specialist" || p.support_level === "significant_support").length;
  const saltCount = data.filter((p) => p.salt_involved).length;
  const ehcpCount = data.filter((p) => p.send_status === "ehcp").length;

  if (isLoading) return <PageShell title="Language & Communication" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Language & Communication"
      subtitle="Communication Profiles · SEND · AAC · Staff Guidance"
      ariaContext={{ pageTitle: "Language & Communication", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Communication Profiles" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{data.length}</p>
              <p className="text-xs text-muted-foreground">Communication Profiles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-amber-600">{specialistCount}</p>
              <p className="text-xs text-muted-foreground">Significant / Specialist Need</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-blue-600">{saltCount}</p>
              <p className="text-xs text-muted-foreground">SALT Involved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-purple-600">{ehcpCount}</p>
              <p className="text-xs text-muted-foreground">EHCP in Place</p>
            </CardContent>
          </Card>
        </div>

        {/* alert for specialist needs */}
        {data.some((p) => p.support_level === "specialist") && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <Ear className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-purple-800">Specialist Communication Needs</p>
              <p className="text-purple-700">
                {data.filter((p) => p.support_level === "specialist").map((p) => getYPName(p.child_id)).join(", ")} — has specialist communication needs. All staff must read the communication passport before working directly with this child.
                {saltCount > 0 && " SALT is actively involved — strategies must align with SALT recommendations."}
              </p>
            </div>
          </div>
        )}

        {/* profile cards */}
        <div className="space-y-3">
          {data.map((profile) => {
            const isOpen = expandedId === profile.id;
            return (
              <Card key={profile.id} className={cn(
                "border-l-4",
                profile.support_level === "no_additional" ? "border-l-green-400" :
                profile.support_level === "some_support" ? "border-l-blue-400" :
                profile.support_level === "significant_support" ? "border-l-amber-400" :
                "border-l-purple-500"
              )}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : profile.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-blue-600" />
                        {getYPName(profile.child_id)}
                        <Badge variant="outline" className={SUPPORT_CLR[profile.support_level]}>{COMM_SUPPORT_LEVEL_LABEL[profile.support_level]}</Badge>
                        {profile.send_status !== "none" && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-800">{SEND_STATUS_LABEL[profile.send_status]}</Badge>
                        )}
                        {profile.salt_involved && <Badge variant="outline" className="bg-blue-100 text-blue-800">SALT</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Receptive: {COMM_LEVEL_LABEL[profile.receptive_level]} · Expressive: {COMM_LEVEL_LABEL[profile.expressive_level]} · Last reviewed: {profile.last_review_date}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* language info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Preferred Language</p>
                        <p className="font-medium">{profile.preferred_language}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Receptive Level</p>
                        <Badge variant="outline" className={cn("text-[10px]", COMM_LEVEL_CLR[profile.receptive_level])}>{COMM_LEVEL_LABEL[profile.receptive_level]}</Badge>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Expressive Level</p>
                        <Badge variant="outline" className={cn("text-[10px]", COMM_LEVEL_CLR[profile.expressive_level])}>{COMM_LEVEL_LABEL[profile.expressive_level]}</Badge>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Reviewed By</p>
                        <p className="font-medium">{getStaffName(profile.reviewed_by)}</p>
                      </div>
                    </div>

                    {/* SALT */}
                    {profile.salt_involved && profile.salt_details && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="font-medium text-xs text-blue-800 mb-1 flex items-center gap-1"><Volume2 className="h-3.5 w-3.5" /> Speech & Language Therapy</p>
                        <p className="text-xs text-blue-700">{profile.salt_details}</p>
                      </div>
                    )}

                    {/* strengths & challenges */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="font-medium text-xs text-green-800 mb-1">Strengths</p>
                        <ul className="space-y-0.5">
                          {(profile.strengths ?? []).map((s, i) => (
                            <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                              <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded p-2">
                        <p className="font-medium text-xs text-amber-800 mb-1">Challenges</p>
                        <ul className="space-y-0.5">
                          {profile.challenges.map((c, i) => (
                            <li key={i} className="text-xs text-amber-700 flex items-start gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* strategies */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1"><BookOpen className="h-4 w-4 text-blue-600" /> Communication Strategies</p>
                      <div className="space-y-1">
                        {(profile.strategies ?? []).map((s, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2">
                            <div className="flex items-start justify-between mb-0.5">
                              <p className="text-xs font-medium flex-1">{s.strategy}</p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {s.in_use && <Badge variant="outline" className="bg-green-100 text-green-800 text-[10px]">In Use</Badge>}
                                <span className={cn("text-[10px] font-medium", EFFECT_CLR[s.effectiveness])}>
                                  {COMM_EFFECTIVENESS_LABEL[s.effectiveness]}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{s.notes}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AAC tools */}
                    {profile.aac_tools.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1"><Ear className="h-4 w-4 text-purple-600" /> AAC & Communication Tools</p>
                        <div className="flex flex-wrap gap-1">
                          {profile.aac_tools.map((tool, i) => (
                            <Badge key={i} variant="outline" className="bg-purple-50 text-purple-800 text-xs">{tool}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* staff guidance */}
                    <div className="bg-amber-50 border border-amber-200 rounded p-2">
                      <p className="font-medium text-xs text-amber-800 mb-1 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Staff Guidance — Essential Reading</p>
                      <p className="text-xs text-amber-700">{profile.staff_guidance}</p>
                    </div>

                    {/* child views */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Child&apos;s Views</p>
                      <p className="text-xs text-blue-700">{profile.child_views}</p>
                    </div>

                    <SmartLinkPanel sourceType="communication-profiles" sourceId={profile.id} childId={profile.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Communication & SEND</p>
          <p>The Children&apos;s Homes Regulations 2015 and Quality Standards require that children&apos;s communication needs are understood and met. This includes ensuring that children can express their views, understand what is happening to them, and participate in decisions about their care. For children with SEND, reasonable adjustments must be made in line with the Equality Act 2010 and the Children and Families Act 2014. Communication profiles should be reviewed at least annually or when needs change. SALT recommendations must be integrated into daily practice. All staff should be trained in the communication strategies relevant to the children in their care. Ofsted inspectors will assess whether children&apos;s communication needs are being met and whether staff are equipped to support them.</p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Education & Wellbeing"
        category={["education", "wellbeing"]}
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Language & Communication — child communication profiles, verbal/non-verbal, SEND, AAC devices, EHCP, speech therapy, staff communication strategies, interpreters"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
