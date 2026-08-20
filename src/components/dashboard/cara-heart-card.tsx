"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CARA HEART CARD
// Dashboard card surfacing the Cara Heart Residential Practice Intelligence
// Engine output. Shows the Heart Card summary, prompts, and key signals.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Brain,
  Users,
  Shield,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CaraPracticeIntelligenceOutput, HeartTone } from "@/lib/cara-heart";

// ── Tone styles ───────────────────────────────────────────────────────────────

const TONE_CONFIG: Record<HeartTone, { badge: string; icon: React.ReactNode; label: string }> = {
  urgent: {
    badge: "bg-[--cs-risk-bg] text-[--cs-risk]",
    icon: <AlertTriangle className="h-4 w-4" />,
    label: "Urgent",
  },
  managerial: {
    badge: "bg-[--cs-warning-bg] text-[--cs-warning]",
    icon: <Shield className="h-4 w-4" />,
    label: "Manager Review",
  },
  reflective: {
    badge: "bg-[--cs-oversight-bg] text-[--cs-oversight]",
    icon: <Brain className="h-4 w-4" />,
    label: "Reflective",
  },
  supportive: {
    badge: "bg-[--cs-success-bg] text-[--cs-success]",
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: "Supportive",
  },
};

// ── Section: Heart Check ──────────────────────────────────────────────────────

function HeartCheckRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-[--cs-border] last:border-0">
      <span className="text-xs text-[--cs-text-secondary]">{label}</span>
      {value ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-[--cs-success]" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5 text-[--cs-warning]" />
      )}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CaraHeartCardProps {
  output: CaraPracticeIntelligenceOutput;
  isLoading?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CaraHeartCard({ output, isLoading }: CaraHeartCardProps) {
  const [showCheck, setShowCheck] = useState(false);
  const [showSocialPedagogy, setShowSocialPedagogy] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-[--cs-risk]" />
            Cara Heart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[--cs-text-secondary]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { heartCard, heartCheck, safeguardingOverride, socialPedagogyReflection, staffSupportSignals, repairPlan, childVoiceRightsReview, recordingQualityReview, auditTrail } = output;

  const toneConfig = TONE_CONFIG[heartCard.tone];
  const urgentAuditCount = auditTrail.filter((a) => a.severity === "urgent" && a.triggered).length;
  const warningAuditCount = auditTrail.filter((a) => a.severity === "warning" && a.triggered).length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-[--cs-risk]" />
            Cara Heart
          </CardTitle>
          <Badge className={cn("text-[10px] flex items-center gap-1", toneConfig.badge)}>
            {toneConfig.icon}
            {toneConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* ── Safeguarding override ─────────────────────────────────────── */}

        {safeguardingOverride.triggered && (
          <div className="rounded border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-3 text-xs text-[--cs-risk]">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Safeguarding Alert
            </div>
            {safeguardingOverride.reason.map((r, i) => (
              <p key={i} className="mb-0.5">{r}</p>
            ))}
          </div>
        )}

        {/* ── Summary ───────────────────────────────────────────────────── */}

        <p className="text-xs text-[--cs-text-secondary] leading-relaxed">{heartCard.summary}</p>

        {/* ── Prompts ───────────────────────────────────────────────────── */}

        {heartCard.prompts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-[--cs-oversight]">
              <Brain className="h-3 w-3" />
              Reflective Prompts
            </p>
            {heartCard.prompts.map((p, i) => (
              <div
                key={i}
                className="rounded border border-[--cs-oversight-soft] bg-[--cs-oversight-bg] p-2.5 text-xs leading-relaxed text-[--cs-oversight]"
              >
                {p}
              </div>
            ))}
          </div>
        )}

        {/* ── Missing information ───────────────────────────────────────── */}

        {heartCard.missingInformation.length > 0 && (
          <div className="rounded border border-[--cs-warning-soft] bg-[--cs-warning-bg] p-3 text-xs">
            <p className="font-medium text-[--cs-warning] mb-1">Not yet in this record:</p>
            <ul className="space-y-0.5">
              {heartCard.missingInformation.map((m, i) => (
                <li key={i} className="text-[--cs-warning]">· {m}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Staff support ─────────────────────────────────────────────── */}

        {staffSupportSignals && staffSupportSignals.length > 0 && staffSupportSignals[0].supportNeed !== "none" && (
          <div className="rounded border border-[--cs-info-soft] bg-[--cs-info-bg] p-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[--cs-info] mb-1">
              <Users className="h-3.5 w-3.5" />
              Staff Support
            </div>
            <p className="text-[--cs-info]">
              {staffSupportSignals[0].stressIndicators[0] ?? "Staff support may be needed after this record."}
            </p>
            <p className="text-[--cs-info] mt-1 text-[10px]">
              Recommended: {staffSupportSignals[0].supportNeed.replace(/_/g, " ")}
            </p>
          </div>
        )}

        {/* ── Repair plan ────────────────────────────────────────────────── */}

        {repairPlan && !output.recordingQualityReview?.missingElements.includes("A repair plan or restorative conversation") === false && (
          <div className="rounded border border-[--cs-success-soft] bg-[--cs-success-bg] p-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[--cs-success] mb-1">
              <MessageSquare className="h-3.5 w-3.5" />
              Repair Plan
            </div>
            <p className="text-[--cs-success]">
              Suggested timing: {repairPlan.suggestedTiming.replace(/_/g, " ")}
            </p>
          </div>
        )}

        {/* ── Suggested actions ─────────────────────────────────────────── */}

        {heartCard.suggestedActions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[--cs-text-secondary]">Suggested Actions</p>
            {heartCard.suggestedActions.map((a, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-[--cs-text-secondary]">
                <span className="mt-0.5 text-[--cs-success]">→</span>
                <span>{a}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Heart Check accordion ─────────────────────────────────────── */}

        <button
          className="flex w-full items-center justify-between text-xs font-semibold text-[--cs-text-secondary] py-1 border-t border-[--cs-border]"
          onClick={() => setShowCheck(!showCheck)}
        >
          <span>Heart Check ({urgentAuditCount + warningAuditCount} signal{urgentAuditCount + warningAuditCount !== 1 ? "s" : ""})</span>
          {showCheck ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {showCheck && (
          <div className="rounded border border-[--cs-border] p-2">
            <HeartCheckRow label="Child dignity protected" value={heartCheck.childDignityProtected} />
            <HeartCheckRow label="Child voice included" value={heartCheck.childVoiceIncluded} />
            <HeartCheckRow label="Adult reflection included" value={heartCheck.adultReflectionIncluded} />
            <HeartCheckRow label="Trauma context considered" value={heartCheck.traumaContextConsidered} />
            <HeartCheckRow label="Relational repair considered" value={heartCheck.relationalRepairConsidered} />
            <HeartCheckRow label="Rights considered" value={heartCheck.rightsConsidered} />
            <HeartCheckRow label="Proportionality considered" value={heartCheck.proportionalityConsidered} />
            <HeartCheckRow label="Staff support considered" value={heartCheck.staffSupportConsidered} />
          </div>
        )}

        {/* ── Social pedagogy accordion ─────────────────────────────────── */}

        {socialPedagogyReflection && (
          <>
            <button
              className="flex w-full items-center justify-between text-xs font-semibold text-[--cs-text-secondary] py-1 border-t border-[--cs-border]"
              onClick={() => setShowSocialPedagogy(!showSocialPedagogy)}
            >
              <span>Head · Heart · Hands Reflection</span>
              {showSocialPedagogy ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showSocialPedagogy && (
              <div className="space-y-2">
                {(["head", "heart", "hands"] as const).map((dimension) => {
                  const labels = { head: "Head — what we know", heart: "Heart — what it is like", hands: "Hands — what we do" };
                  const items = dimension === "head"
                    ? socialPedagogyReflection.head.whatDoWeKnow
                    : dimension === "heart"
                      ? socialPedagogyReflection.heart.whatMightTheChildFeel
                      : socialPedagogyReflection.hands.nextPracticalSteps;
                  return (
                    <div key={dimension} className="rounded border border-[--cs-border] p-2.5">
                      <p className="text-[10px] font-semibold text-[--cs-text-secondary] mb-1.5">{labels[dimension]}</p>
                      {items.slice(0, 2).map((item, i) => (
                        <p key={i} className="text-xs text-[--cs-text-secondary] mb-1 leading-relaxed">{item}</p>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Audit trail accordion ─────────────────────────────────────── */}

        <button
          className="flex w-full items-center justify-between text-xs font-semibold text-[--cs-text-secondary] py-1 border-t border-[--cs-border]"
          onClick={() => setShowAudit(!showAudit)}
        >
          <span>Audit Trail ({auditTrail.filter((a) => a.triggered).length} rules triggered)</span>
          {showAudit ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {showAudit && (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {auditTrail.filter((a) => a.triggered).map((entry, i) => (
              <div
                key={i}
                className={cn(
                  "rounded p-2 text-[10px]",
                  entry.severity === "urgent"
                    ? "bg-[--cs-risk-bg] text-[--cs-risk]"
                    : entry.severity === "warning"
                      ? "bg-[--cs-warning-bg] text-[--cs-warning]"
                      : entry.severity === "prompt"
                        ? "bg-[--cs-oversight-bg] text-[--cs-oversight]"
                        : "bg-[--cs-bg] text-[--cs-text-secondary]",
                )}
              >
                <span className="font-medium">{entry.ruleId}</span> · {entry.engine}
                <p className="mt-0.5">{entry.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Professional reminder ─────────────────────────────────────── */}

        <p className="text-[10px] text-[--cs-text-secondary] border-t border-[--cs-border] pt-2 leading-relaxed">
          {heartCard.professionalReminder}
        </p>

      </CardContent>
    </Card>
  );
}
