"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — GOVERNANCE SETTINGS
//
// Management page for configuring Cara's behaviour at the home level.
// Controls report approval requirements, AI generation policies, challenge
// mode settings, and per-agent access toggles.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AGENT_ID_LABELS } from "@/types/cara-reports";
import type { AgentId, RiskTier } from "@/types/cara-reports";
import { CaraActivityCard } from "@/components/cara/cara-activity-card";
import { CaraFeedbackStats } from "@/components/cara/cara-feedback-stats";
import { CaraNotificationPrefs } from "@/components/cara/cara-notification-prefs";
import {
  Shield,
  Save,
  CheckCircle2,
  FileText,
  Bot,
  AlertTriangle,
  Lock,
} from "lucide-react";

// ── Agent list ──────────────────────────────────────────────────────────────

const ALL_AGENTS: AgentId[] = [
  "oversight_agent",
  "safeguarding_agent",
  "report_generator_agent",
  "therapeutic_practice_agent",
  "risk_assessment_agent",
  "regulation45_evidence_agent",
  "workforce_agent",
  "filing_agent",
];

// ── Toggle Switch Component ─────────────────────────────────────────────────

function ToggleSwitch({
  value,
  onChange,
  label,
  description,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: "var(--cs-navy)" }}>{label}</p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: "var(--cs-text-muted)" }}>{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          value ? "bg-[var(--cs-cara-gold)]" : "bg-gray-300",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            value ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export default function CaraGovernancePage() {
  // Report controls
  const [requireApproval, setRequireApproval] = useState(true);
  const [requireEvidence, setRequireEvidence] = useState(true);
  const [enforceChildVoice, setEnforceChildVoice] = useState(true);
  const [enforceEvidenceLinks, setEnforceEvidenceLinks] = useState(true);

  // AI controls
  const [allowAutoGeneration, setAllowAutoGeneration] = useState(false);
  const [allowScheduledGeneration, setAllowScheduledGeneration] = useState(false);
  const [auditAllRuns, setAuditAllRuns] = useState(true);
  const [minConfidence, setMinConfidence] = useState(60);
  const [maxAgeDays, setMaxAgeDays] = useState(90);

  // Challenge mode
  const [challengeEnabled, setChallengeEnabled] = useState(true);
  const [challengeThreshold, setChallengeThreshold] = useState<RiskTier>("medium");

  // Agent access
  const [blockedAgents, setBlockedAgents] = useState<Set<AgentId>>(new Set());

  // Save feedback
  const [saved, setSaved] = useState(false);

  function toggleAgent(agentId: AgentId) {
    setBlockedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <PageShell title="Cara Governance Settings">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: "var(--cs-cara-gold-bg)" }}
          >
            <Shield className="h-5 w-5" style={{ color: "var(--cs-cara-gold)" }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--cs-navy)" }}>
              Cara Governance Settings
            </h1>
            <p className="text-sm" style={{ color: "var(--cs-text-muted)" }}>
              Configure how Cara operates within this home
            </p>
          </div>
        </div>
        <Button onClick={handleSave} className="gap-2" style={{ backgroundColor: "var(--cs-cara-gold)" }}>
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved" : "Save Settings"}
        </Button>
      </div>

      {saved && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="mr-2 inline h-4 w-4" />
          Settings saved successfully.
        </div>
      )}

      {/* Cara Activity & Feedback */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <CaraActivityCard days={30} />
        <CaraFeedbackStats days={30} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Report Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
              Report Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <ToggleSwitch
              value={requireApproval}
              onChange={setRequireApproval}
              label="Require manager approval for reports"
              description="All reports must be reviewed and approved by a manager before they can be locked."
            />
            <ToggleSwitch
              value={requireEvidence}
              onChange={setRequireEvidence}
              label="Require evidence for all sections"
              description="Sections without linked evidence will be flagged for manager review."
            />
            <ToggleSwitch
              value={enforceChildVoice}
              onChange={setEnforceChildVoice}
              label="Enforce child voice inclusion"
              description="Reports must include at least one child voice entry to be submitted for review."
            />
            <ToggleSwitch
              value={enforceEvidenceLinks}
              onChange={setEnforceEvidenceLinks}
              label="Enforce evidence links"
              description="Every claim must be linked to a source record before approval."
            />
          </CardContent>
        </Card>

        {/* AI Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
              AI Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <ToggleSwitch
              value={allowAutoGeneration}
              onChange={setAllowAutoGeneration}
              label="Allow automatic report generation"
              description="Cara can automatically generate reports on a schedule without manual triggering."
            />
            <ToggleSwitch
              value={allowScheduledGeneration}
              onChange={setAllowScheduledGeneration}
              label="Allow scheduled generation"
              description="Enable weekly or monthly scheduled report generation."
            />
            <ToggleSwitch
              value={auditAllRuns}
              onChange={setAuditAllRuns}
              label="Audit all agent runs"
              description="Log every Cara agent execution for the full audit trail."
            />
            <div className="pt-2">
              <Label className="text-sm">Minimum Confidence Score</Label>
              <p className="text-xs mb-2" style={{ color: "var(--cs-text-muted)" }}>
                Sections below this score are flagged for review ({minConfidence}%)
              </p>
              <Input
                type="number"
                min={0}
                max={100}
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className="w-24"
              />
            </div>
            <div className="pt-2">
              <Label className="text-sm">Max Report Age (days)</Label>
              <p className="text-xs mb-2" style={{ color: "var(--cs-text-muted)" }}>
                Reports older than this are flagged as stale
              </p>
              <Input
                type="number"
                min={7}
                max={365}
                value={maxAgeDays}
                onChange={(e) => setMaxAgeDays(Number(e.target.value))}
                className="w-24"
              />
            </div>
          </CardContent>
        </Card>

        {/* Challenge Mode */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
              Challenge Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <ToggleSwitch
              value={challengeEnabled}
              onChange={setChallengeEnabled}
              label="Enable challenge mode"
              description="Cara runs quality checks against every draft before submission."
            />
            <div className="pt-2">
              <Label className="text-sm">Severity Threshold</Label>
              <p className="text-xs mb-2" style={{ color: "var(--cs-text-muted)" }}>
                Minimum severity level that blocks submission
              </p>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as RiskTier[]).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setChallengeThreshold(tier)}
                    className={cn(
                      "rounded-md border px-4 py-1.5 text-sm font-medium transition-colors capitalize",
                      challengeThreshold === tier
                        ? "border-[var(--cs-cara-gold)] text-white"
                        : "border-[var(--cs-border)] hover:bg-gray-50",
                    )}
                    style={
                      challengeThreshold === tier
                        ? { backgroundColor: "var(--cs-cara-gold)" }
                        : { color: "var(--cs-text-secondary)" }
                    }
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Access */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4" style={{ color: "var(--cs-cara-gold)" }} />
              Agent Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs mb-3" style={{ color: "var(--cs-text-muted)" }}>
              Disable specific agents to prevent Cara from using them in this home.
            </p>
            <div className="space-y-1">
              {ALL_AGENTS.map((agentId) => (
                <ToggleSwitch
                  key={agentId}
                  value={!blockedAgents.has(agentId)}
                  onChange={() => toggleAgent(agentId)}
                  label={AGENT_ID_LABELS[agentId]}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Preferences */}
      <div className="mt-6">
        <CaraNotificationPrefs userId="staff_darren" />
      </div>
    </PageShell>
  );
}
