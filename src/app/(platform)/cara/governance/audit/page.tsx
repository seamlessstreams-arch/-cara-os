// ══════════════════════════════════════════════════════════════════════════════
// Cara Governance — Audit Log Page
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import { CaraAuditViewer } from "@/components/cara/CaraAuditViewer";

// Demo data — in production this fetches from /api/cara/audit
const DEMO_ENTRIES = [
  {
    id: "audit-001",
    userId: "user-rm-01",
    taskType: "reg45_report" as const,
    provider: "anthropic" as const,
    model: "claude-sonnet-4-20250514",
    riskLevel: "high" as const,
    redactionApplied: true,
    approvalRequired: true,
    approvalStatus: "pending_review",
    tokenUsage: 4250,
    estimatedCost: 0.0425,
    latencyMs: 3200,
    success: true,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "audit-002",
    userId: "user-sw-03",
    taskType: "keywork_session_plan" as const,
    provider: "anthropic" as const,
    model: "claude-sonnet-4-20250514",
    riskLevel: "medium" as const,
    redactionApplied: true,
    approvalRequired: false,
    approvalStatus: "draft_ai_generated",
    tokenUsage: 2100,
    estimatedCost: 0.0189,
    latencyMs: 2400,
    success: true,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "audit-003",
    userId: "user-sw-01",
    taskType: "public_research" as const,
    provider: "perplexity" as const,
    model: "sonar-pro",
    riskLevel: "low" as const,
    redactionApplied: false,
    approvalRequired: false,
    approvalStatus: "draft_ai_generated",
    tokenUsage: 1800,
    estimatedCost: 0.0054,
    latencyMs: 1200,
    success: true,
    timestamp: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: "audit-004",
    userId: "user-sw-02",
    taskType: "safeguarding_analysis" as const,
    provider: "perplexity" as const,
    model: "sonar-pro",
    riskLevel: "critical" as const,
    redactionApplied: false,
    approvalRequired: true,
    approvalStatus: "draft_ai_generated",
    tokenUsage: 0,
    estimatedCost: 0,
    latencyMs: 12,
    success: false,
    errorCode: "ROUTING_BLOCKED",
    timestamp: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: "audit-005",
    userId: "user-tl-01",
    taskType: "quality_assurance_review" as const,
    provider: "anthropic" as const,
    model: "claude-sonnet-4-20250514",
    riskLevel: "medium" as const,
    redactionApplied: true,
    approvalRequired: false,
    approvalStatus: "draft_ai_generated",
    tokenUsage: 3400,
    estimatedCost: 0.0306,
    latencyMs: 2800,
    success: true,
    timestamp: new Date(Date.now() - 28800000).toISOString(),
  },
];

export default function CaraAuditPage() {
  const [entries] = useState(DEMO_ENTRIES);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Audit Log</h1>
        <p className="text-muted-foreground mt-1">
          Complete audit trail of all AI operations. Prompts are never stored — only hashes for traceability.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Total Operations</p>
          <p className="text-xl font-bold">{entries.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Success Rate</p>
          <p className="text-xl font-bold">
            {Math.round((entries.filter(e => e.success).length / entries.length) * 100)}%
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Blocked Routes</p>
          <p className="text-xl font-bold text-red-600">{entries.filter(e => e.errorCode === "ROUTING_BLOCKED").length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Total Cost</p>
          <p className="text-xl font-bold">£{entries.reduce((sum, e) => sum + e.estimatedCost, 0).toFixed(4)}</p>
        </div>
      </div>

      <CaraAuditViewer entries={entries} />
    </div>
  );
}
