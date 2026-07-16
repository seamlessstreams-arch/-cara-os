"use client";

import { useHomeName } from "@/hooks/use-home-profile";
import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Heart, BookOpen, Users, Scale, Mic, Home, GraduationCap,
  HeartPulse, Globe, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
  Star, Lock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName } from "@/lib/seed-data";
import { useChildrensRights } from "@/hooks/use-childrens-rights";
import type { ChildrensRightEntry, RightsComplianceLevel } from "@/types/extended";
import { RIGHTS_COMPLIANCE_LEVEL_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const COMPLIANCE_META: Record<RightsComplianceLevel, { label: string; color: string }> = {
  fully: { label: "Fully Met", color: "bg-green-100 text-green-800" },
  partially: { label: "Partially Met", color: "bg-amber-100 text-amber-800" },
  action_needed: { label: "Action Needed", color: "bg-red-100 text-red-800" },
};

const ICON_MAP: Record<string, React.ElementType> = {
  r_01: Heart, r_02: Mic, r_03: Shield, r_04: HeartPulse,
  r_05: GraduationCap, r_06: Globe, r_07: Users, r_08: Lock,
  r_09: Star, r_10: Scale, r_11: Heart, r_12: BookOpen,
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ChildrensRightsPage() {
  const homeName = useHomeName();
  const { data: records = [], isLoading } = useChildrensRights();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fullyMet = records.filter((r) => r.compliance_level === "fully").length;
  const partiallyMet = records.filter((r) => r.compliance_level === "partially").length;
  const actionNeeded = records.filter((r) => r.compliance_level === "action_needed").length;

  if (isLoading) {
    return (
      <PageShell title="Children's Rights" subtitle={`UNCRC · Rights-Based Practice · How We Uphold Children's Rights at ${homeName}`}>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Children's Rights"
      subtitle={`UNCRC · Rights-Based Practice · How We Uphold Children's Rights at ${homeName}`}
      caraContext={{ pageTitle: "Children's Rights", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Children's Rights Charter" />
          <CaraStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* intro banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800">United Nations Convention on the Rights of the Child (UNCRC)</p>
              <p className="text-blue-700">{`${homeName} is committed to upholding the rights of every child in our care. This charter sets out how we meet the key UNCRC articles relevant to residential care, with evidence, children&apos;s own feedback, and identified actions. This document is reviewed quarterly by the Registered Manager and shared with the Reg 44 Visitor and Ofsted upon request.`}</p>
            </div>
          </div>
        </div>

        {/* summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-green-600">{fullyMet}</p>
              <p className="text-xs text-muted-foreground">Rights Fully Met</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{partiallyMet}</p>
              <p className="text-xs text-muted-foreground">Partially Met</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-red-600">{actionNeeded}</p>
              <p className="text-xs text-muted-foreground">Action Needed</p>
            </CardContent>
          </Card>
        </div>

        {/* actions summary */}
        {records.filter((r) => r.action_needed).length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <p className="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Actions Required</p>
            <div className="space-y-1">
              {records.filter((r) => r.action_needed).map((r) => (
                <div key={r.id} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="font-medium shrink-0">{r.article}:</span>
                  <span>{r.action_needed}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* rights cards */}
        <div className="space-y-3">
          {records.map((r) => {
            const isOpen = expandedId === r.id;
            const Icon = ICON_MAP[r.id] || Shield;
            return (
              <Card key={r.id} className={cn(
                "border-l-4",
                r.compliance_level === "fully" ? "border-l-green-400" :
                r.compliance_level === "partially" ? "border-l-amber-400" :
                "border-l-red-500"
              )}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon className="h-4 w-4 text-blue-600" />
                        {r.article} — {r.title}
                        <Badge variant="outline" className={COMPLIANCE_META[r.compliance_level].color}>
                          {COMPLIANCE_META[r.compliance_level].label}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{r.uncrc_summary}</p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* how we uphold */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-600" /> How We Uphold This Right</p>
                      <ul className="space-y-0.5">
                        {r.how_we_uphold.map((item, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-green-600 shrink-0">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* evidence */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1"><BookOpen className="h-4 w-4 text-blue-600" /> Evidence</p>
                      <ul className="space-y-0.5">
                        {r.evidence.map((item, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-blue-600 shrink-0">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* child feedback */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1 flex items-center gap-1">
                        <Mic className="h-3.5 w-3.5" /> Children&apos;s Feedback
                      </p>
                      <p className="text-xs text-blue-700">{r.child_feedback}</p>
                    </div>

                    {/* action needed */}
                    {r.action_needed && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-2">
                        <p className="font-medium text-xs text-amber-800 mb-1 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Action Required
                        </p>
                        <p className="text-xs text-amber-700">{r.action_needed}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Children&apos;s Rights Framework</p>
          <p>The UK ratified the UNCRC in 1991. While not directly incorporated into domestic law, the principles underpin the Children Act 1989, the Children&apos;s Homes (England) Regulations 2015, and the Quality Standards. Ofsted inspectors assess whether children&apos;s rights are upheld in practice — this includes listening to children, acting in their best interests, and ensuring they can participate in decisions about their lives. The Children&apos;s Commissioner for England promotes and protects children&apos;s rights. Every children&apos;s home should have a rights-based culture where children understand their rights and can exercise them. This charter should be reviewed quarterly and updated when evidence changes. Children should be involved in the review process.</p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Children's Rights — UNCRC articles, rights-based practice, children's participation, how we uphold each right, evidence, compliance status, quarterly review"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}
