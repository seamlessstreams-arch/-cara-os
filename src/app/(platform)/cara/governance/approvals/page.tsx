// ══════════════════════════════════════════════════════════════════════════════
// Cara Governance — Approvals Page
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import { CaraApprovalQueue } from "@/components/cara/CaraApprovalQueue";
import { CaraHumanApprovalBanner } from "@/components/cara/CaraHumanApprovalBanner";
import type { CaraApprovalRecord } from "@/lib/cara/core/types";

// Demo data
const DEMO_APPROVALS: CaraApprovalRecord[] = [
  {
    id: "appr-001",
    taskResultId: "result-001",
    taskType: "reg45_report",
    generatedByModel: "claude-sonnet-4-20250514",
    provider: "anthropic",
    riskLevel: "high",
    sensitivityLevel: "child_sensitive",
    promptHash: "abc123",
    redactionApplied: true,
    status: "pending_review",
    generatedAt: new Date(Date.now() - 1800000).toISOString(),
    organisationId: "org-default",
    homeId: "home-01",
    childId: "child-01",
  },
  {
    id: "appr-002",
    taskResultId: "result-002",
    taskType: "safeguarding_analysis",
    generatedByModel: "claude-sonnet-4-20250514",
    provider: "anthropic",
    riskLevel: "critical",
    sensitivityLevel: "safeguarding_sensitive",
    promptHash: "def456",
    redactionApplied: true,
    status: "pending_review",
    generatedAt: new Date(Date.now() - 3600000).toISOString(),
    organisationId: "org-default",
    homeId: "home-01",
    childId: "child-02",
  },
  {
    id: "appr-003",
    taskResultId: "result-003",
    taskType: "risk_assessment_update",
    generatedByModel: "claude-sonnet-4-20250514",
    provider: "anthropic",
    riskLevel: "high",
    sensitivityLevel: "child_sensitive",
    promptHash: "ghi789",
    redactionApplied: true,
    status: "pending_review",
    generatedAt: new Date(Date.now() - 7200000).toISOString(),
    organisationId: "org-default",
    homeId: "home-02",
    childId: "child-03",
  },
];

export default function CaraApprovalsPage() {
  const [items, setItems] = useState(DEMO_APPROVALS);
  const [selected, setSelected] = useState<CaraApprovalRecord | null>(null);

  const handleApprove = (id: string, notes: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: "approved" as const, reviewedAt: new Date().toISOString() } : item
    ));
  };

  const handleReject = (id: string, reason: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: "rejected" as const, reviewedAt: new Date().toISOString(), approvalNotes: reason } : item
    ));
  };

  const pending = items.filter(i => i.status === "pending_review");
  const reviewed = items.filter(i => i.status !== "pending_review");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Human Approval Queue</h1>
        <p className="text-muted-foreground mt-1">
          AI outputs requiring human review before official use. High-risk and critical tasks always require approval.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4">
          <p className="text-xs text-amber-700 dark:text-amber-400">Pending Review</p>
          <p className="text-2xl font-bold text-amber-800 dark:text-amber-300">{pending.length}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4">
          <p className="text-xs text-emerald-700 dark:text-emerald-400">Approved Today</p>
          <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
            {reviewed.filter(i => i.status === "approved").length}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
          <p className="text-xs text-red-700 dark:text-red-400">Rejected Today</p>
          <p className="text-2xl font-bold text-red-800 dark:text-red-300">
            {reviewed.filter(i => i.status === "rejected").length}
          </p>
        </div>
      </div>

      {/* Queue */}
      <CaraApprovalQueue
        items={pending}
        onSelect={setSelected}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Selected item detail */}
      {selected && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h4 className="text-sm font-semibold">Review Detail</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div><span className="font-medium">Task:</span> {selected.taskType.replace(/_/g, " ")}</div>
            <div><span className="font-medium">Risk:</span> {selected.riskLevel}</div>
            <div><span className="font-medium">Provider:</span> {selected.provider}</div>
            <div><span className="font-medium">Model:</span> {selected.generatedByModel}</div>
            <div><span className="font-medium">Sensitivity:</span> {selected.sensitivityLevel.replace(/_/g, " ")}</div>
            <div><span className="font-medium">Redacted:</span> {selected.redactionApplied ? "Yes" : "No"}</div>
          </div>
          <CaraHumanApprovalBanner
            approvalId={selected.id}
            taskType={selected.taskType}
            riskLevel={selected.riskLevel}
            status={selected.status}
            generatedAt={selected.generatedAt}
            canApprove={true}
            onApprove={(notes) => handleApprove(selected.id, notes)}
            onReject={(reason) => handleReject(selected.id, reason)}
          />
        </div>
      )}

      {/* Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Approval Rules</h4>
        <ul className="mt-2 space-y-1 text-xs text-blue-700 dark:text-blue-400">
          <li>• Critical-risk tasks: only Registered Manager or above can approve</li>
          <li>• High-risk tasks: Deputy Manager or above can approve</li>
          <li>• Medium-risk tasks: Team Leader or above can approve</li>
          <li>• Reviewer must not be the same person who requested the AI output</li>
          <li>• Rejected outputs cannot be used — must be regenerated or manually created</li>
        </ul>
      </div>
    </div>
  );
}
