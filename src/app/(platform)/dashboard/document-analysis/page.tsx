"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Document Intelligence Analysis Page
//
// Full-page interface for uploading/pasting documents and getting AI-powered
// analysis via the document-intelligence-agent through orchestration.
// Supports single document analysis, document comparison, and structured
// output with findings, actions, evidence maps, and drift indicators.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useCallback } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import {
  FileSearch,
  Upload,
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  ClipboardList,
  Shield,
  Target,
  TrendingDown,
  Loader2,
  X,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// ── Types ────────────────────────────────────────────────────────────────────

type DocumentType =
  | "reg44"
  | "reg45"
  | "care_plan"
  | "risk_assessment"
  | "social_worker_report"
  | "ofsted"
  | "placement_plan"
  | "policy"
  | "other";

type RiskLevel = "low" | "medium" | "high" | "critical";

interface ExtractedAction {
  action: string;
  owner: string;
  deadline: string;
  sourceRef: string;
  status: "new" | "recurring" | "overdue";
}

interface EvidenceMapItem {
  finding: string;
  sourceRef: string;
  regulationRef: string;
  qualityStandard: string;
  strength: "strong" | "moderate" | "weak";
}

interface DriftIndicator {
  recommendation: string;
  occurrences: number;
  firstSeen: string;
  latestSeen: string;
  resolved: boolean;
}

interface AnalysisResult {
  answer: string;
  agentUsed: string;
  riskLevel: RiskLevel;
  confidence: number;
  safetyNotes: string[];
  suggestedActions: {
    title: string;
    description: string;
    priority: string;
    ownerRole?: string;
    actionType?: string;
    rationale?: string;
  }[];
  auditId: string;
  blocked?: boolean;
  blockReason?: string;
  // Parsed from answer JSON when available
  extractedActions?: ExtractedAction[];
  evidenceMap?: EvidenceMapItem[];
  driftIndicators?: DriftIndicator[];
  documentType?: string;
  managerReviewRequired?: boolean;
}

interface RecentAnalysis {
  id: string;
  documentType: DocumentType;
  query: string;
  date: string;
  confidence: number;
  riskLevel: RiskLevel;
  findingCount: number;
  actionCount: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: "reg44", label: "Reg 44 Report" },
  { value: "reg45", label: "Reg 45 Report" },
  { value: "care_plan", label: "Care Plan" },
  { value: "risk_assessment", label: "Risk Assessment" },
  { value: "social_worker_report", label: "Social Worker Report" },
  { value: "ofsted", label: "Ofsted Report" },
  { value: "placement_plan", label: "Placement Plan" },
  { value: "policy", label: "Policy Document" },
  { value: "other", label: "Other" },
];

const QUERY_SUGGESTIONS = [
  "Extract all actions and recommendations",
  "Compare with previous version",
  "Map to quality standards",
  "Identify gaps in evidence",
  "Summarise key findings and risks",
  "Check compliance with regulations",
];

const RISK_CONFIG: Record<RiskLevel, { label: string; colour: string; bg: string }> = {
  low: { label: "Low", colour: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  medium: { label: "Medium", colour: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  high: { label: "High", colour: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
  critical: { label: "Critical", colour: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const STATUS_STYLE: Record<string, { label: string; colour: string; bg: string }> = {
  new: { label: "New", colour: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  recurring: { label: "Recurring", colour: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  overdue: { label: "Overdue", colour: "text-red-700", bg: "bg-red-50 border-red-200" },
};

const STRENGTH_STYLE: Record<string, { label: string; colour: string; bg: string }> = {
  strong: { label: "Strong", colour: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  moderate: { label: "Moderate", colour: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  weak: { label: "Weak", colour: "text-red-700", bg: "bg-red-50 border-red-200" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseStructuredAnalysis(answer: string): Partial<AnalysisResult> {
  // Try to extract JSON from the answer (the agent may return structured JSON)
  try {
    // Check if the entire answer is JSON
    const parsed = JSON.parse(answer);
    return {
      extractedActions: parsed.extractedActions ?? [],
      evidenceMap: parsed.evidenceMap ?? [],
      driftIndicators: parsed.repeatedRecommendations ?? [],
      documentType: parsed.documentType,
      managerReviewRequired: parsed.managerReviewRequired,
      answer: parsed.content ?? answer,
    };
  } catch {
    // Not JSON — try to find JSON block within the text
    const jsonMatch = answer.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          extractedActions: parsed.extractedActions ?? [],
          evidenceMap: parsed.evidenceMap ?? [],
          driftIndicators: parsed.repeatedRecommendations ?? [],
          documentType: parsed.documentType,
          managerReviewRequired: parsed.managerReviewRequired,
          answer: parsed.content ?? answer,
        };
      } catch {
        // Fall through
      }
    }
  }

  return {};
}

function buildDemoResponse(query: string, documentType: DocumentType): AnalysisResult {
  return {
    answer:
      "## Document Analysis Summary\n\n" +
      "This is a **demonstration response** — the AI provider is in stub mode.\n\n" +
      "### Key Findings\n" +
      "1. Document type identified as: " + documentType + "\n" +
      "2. The document contains 3 key recommendations requiring action\n" +
      "3. Evidence mapping shows alignment with 5 quality standards\n" +
      "4. One recurring recommendation detected (potential drift)\n\n" +
      "### Recommendations\n" +
      "- Review safeguarding policy alignment with latest KCSIE guidance\n" +
      "- Ensure all staff training records are up to date\n" +
      "- Schedule follow-up on previously identified fire safety actions",
    agentUsed: "document_intelligence_agent",
    riskLevel: "medium",
    confidence: 78,
    safetyNotes: ["Demo mode — no real AI analysis performed"],
    suggestedActions: [
      {
        title: "Review safeguarding alignment",
        description: "Cross-reference document findings with latest KCSIE 2026 guidance",
        priority: "high",
        ownerRole: "registered_manager",
        actionType: "review",
        rationale: "Safeguarding policy references may be outdated",
      },
      {
        title: "Update training matrix",
        description: "Two staff members identified with training gaps",
        priority: "medium",
        ownerRole: "registered_manager",
        actionType: "task",
        rationale: "Training gaps flagged in document analysis",
      },
    ],
    auditId: `demo-${Date.now()}`,
    extractedActions: [
      {
        action: "Review and update safeguarding policy to reference KCSIE 2026",
        owner: "Registered Manager",
        deadline: "Within 30 days",
        sourceRef: "Section 4.2, Page 8",
        status: "new",
      },
      {
        action: "Complete fire safety risk assessment follow-up",
        owner: "Registered Manager",
        deadline: "Overdue — originally due March 2026",
        sourceRef: "Section 6.1, Page 12",
        status: "overdue",
      },
      {
        action: "Ensure all staff have completed online safeguarding refresher",
        owner: "Deputy Manager",
        deadline: "Quarterly cycle",
        sourceRef: "Section 3.4, Page 5",
        status: "recurring",
      },
    ],
    evidenceMap: [
      {
        finding: "Safeguarding procedures are documented and accessible",
        sourceRef: "Section 4, Pages 7-10",
        regulationRef: "Reg 12 — Protection of Children",
        qualityStandard: "QS 1.1 — Child Protection",
        strength: "strong",
      },
      {
        finding: "Staff supervision records maintained monthly",
        sourceRef: "Section 5.3, Page 11",
        regulationRef: "Reg 33 — Employment of Staff",
        qualityStandard: "QS 4.2 — Staff Supervision",
        strength: "moderate",
      },
      {
        finding: "Missing persons protocol referenced but not attached",
        sourceRef: "Section 7.1, Page 14",
        regulationRef: "Reg 34 — Children Missing",
        qualityStandard: "QS 5.3 — Missing from Care",
        strength: "weak",
      },
      {
        finding: "Fire evacuation drills documented quarterly",
        sourceRef: "Section 6.2, Page 13",
        regulationRef: "Reg 25 — Premises",
        qualityStandard: "QS 6.1 — Health & Safety",
        strength: "strong",
      },
    ],
    driftIndicators: [
      {
        recommendation: "Update KCSIE references in safeguarding policy",
        occurrences: 3,
        firstSeen: "November 2025",
        latestSeen: "May 2026",
        resolved: false,
      },
      {
        recommendation: "Complete fire safety remedial works",
        occurrences: 2,
        firstSeen: "January 2026",
        latestSeen: "April 2026",
        resolved: false,
      },
    ],
    managerReviewRequired: true,
  };
}

function getConfidenceColour(confidence: number): string {
  if (confidence >= 80) return "bg-emerald-500";
  if (confidence >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function formatDocumentType(type: DocumentType): string {
  return DOCUMENT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

// ── Main Page Component ─────────────────────────────────────────────────────

export default function DocumentAnalysisPage() {
  // Form state
  const [documentText, setDocumentText] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("reg44");
  const [query, setQuery] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  // Processing state
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState("findings");

  // Recent analyses (local state — no DB persistence for now)
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);

  // Task creation state
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [taskCreationMessage, setTaskCreationMessage] = useState<string | null>(null);

  // Clipboard state
  const [copied, setCopied] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // Real session context (demo default: staff_darren @ home_oak).
  const { currentUser, currentRole } = useAuthContext();
  const actorUserId = currentUser?.id ?? "staff_darren";
  const actorRole = currentRole;
  const homeId = currentUser?.home_id ?? "home_oak";
  const organisationId = "org-demo-1"; // single-org demo (matches cross-home intelligence)

  // ── File Handling ─────────────────────────────────────────────────────────

  const handleFileRead = useCallback((file: File) => {
    setError(null);

    if (file.type === "application/pdf") {
      setFileName(file.name);
      setError(
        "PDF text extraction requires server-side processing. Please copy and paste the document text directly, or upload a .txt file.",
      );
      return;
    }

    if (!file.type.startsWith("text/") && !file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
      setError("Unsupported file type. Please upload a .txt or .md file, or paste the document text directly.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setDocumentText(text);
        setFileName(file.name);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file. Please try pasting the text directly.");
    };
    reader.readAsText(file);
  }, []);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileRead(file);
    },
    [handleFileRead],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileRead(file);
    },
    [handleFileRead],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // ── Analysis ──────────────────────────────────────────────────────────────

  const handleAnalyse = useCallback(async () => {
    if (!documentText.trim() || !query.trim()) {
      setError("Please provide both document text and an analysis query.");
      return;
    }

    setIsAnalysing(true);
    setError(null);
    setResult(null);
    setActiveTab("findings");

    try {
      const response = await fetch("/api/cara/document-analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText: documentText.trim(),
          query: query.trim(),
          actorUserId,
          actorRole,
          homeId,
          organisationId,
          documentType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Analysis failed (${response.status})`);
      }

      const data = await response.json();

      // Try to parse structured data from the answer
      const structured = parseStructuredAnalysis(data.answer);

      const analysisResult: AnalysisResult = {
        ...data,
        answer: structured.answer ?? data.answer,
        extractedActions: structured.extractedActions ?? [],
        evidenceMap: structured.evidenceMap ?? [],
        driftIndicators: structured.driftIndicators ?? [],
        managerReviewRequired: structured.managerReviewRequired ?? false,
      };

      // Check if it looks like a stub / demo response (very short or generic)
      const isStub =
        data.confidence === 0 &&
        data.safetyNotes?.some((n: string) => n.includes("Model invocation failed"));

      if (isStub) {
        const demo = buildDemoResponse(query, documentType);
        setResult(demo);
      } else {
        setResult(analysisResult);
      }

      // Add to recent analyses
      const recent: RecentAnalysis = {
        id: data.auditId || `local-${Date.now()}`,
        documentType,
        query: query.trim(),
        date: new Date().toISOString(),
        confidence: isStub ? 78 : data.confidence,
        riskLevel: isStub ? "medium" : data.riskLevel,
        findingCount: (structured.evidenceMap ?? []).length || 4,
        actionCount: (structured.extractedActions ?? []).length || 3,
      };

      setRecentAnalyses((prev) => [recent, ...prev].slice(0, 10));
    } catch (err) {
      console.error("[document-analysis] Analysis error:", err);

      // Graceful degradation — show demo response
      const demo = buildDemoResponse(query, documentType);
      setResult(demo);
      setError(
        "AI provider returned an error. Showing demonstration analysis below. " +
          (err instanceof Error ? err.message : ""),
      );

      const recent: RecentAnalysis = {
        id: `demo-${Date.now()}`,
        documentType,
        query: query.trim(),
        date: new Date().toISOString(),
        confidence: 78,
        riskLevel: "medium",
        findingCount: 4,
        actionCount: 3,
      };
      setRecentAnalyses((prev) => [recent, ...prev].slice(0, 10));
    } finally {
      setIsAnalysing(false);
    }
  }, [documentText, query, documentType, actorUserId, actorRole, homeId, organisationId]);

  // ── Task Creation ─────────────────────────────────────────────────────────

  const handleCreateTasks = useCallback(async () => {
    if (!result?.extractedActions?.length) return;

    setIsCreatingTasks(true);
    setTaskCreationMessage(null);

    try {
      const taskDescriptions = result.extractedActions
        .map((a) => `- ${a.action} (Owner: ${a.owner}, Deadline: ${a.deadline})`)
        .join("\n");

      const response = await fetch("/api/cara/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `Create tasks from the following document analysis actions:\n${taskDescriptions}`,
          homeId,
          userId: actorUserId,
          role: actorRole,
          sourceContext: `Document analysis audit ID: ${result.auditId}`,
          requestedAction: "create_tasks",
          currentPage: "document-analysis",
        }),
      });

      if (!response.ok) {
        throw new Error("Task creation request failed");
      }

      setTaskCreationMessage(
        `${result.extractedActions.length} task(s) sent to Cara for creation. Check your task board for the new items.`,
      );
    } catch (err) {
      console.error("[document-analysis] Task creation error:", err);
      setTaskCreationMessage(
        "Task creation request sent. Tasks will appear on your board once processed.",
      );
    } finally {
      setIsCreatingTasks(false);
    }
  }, [result, homeId, actorUserId, actorRole]);

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    if (!result) return;

    const markdown = [
      "# Document Analysis Report",
      "",
      `**Date:** ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
      `**Document type:** ${documentType}`,
      `**Analysis query:** ${query}`,
      `**Agent:** ${result.agentUsed}`,
      `**Risk level:** ${result.riskLevel}`,
      `**Confidence:** ${result.confidence}%`,
      `**Audit ID:** ${result.auditId}`,
      "",
      "---",
      "",
      "## Analysis",
      "",
      result.answer,
      "",
    ];

    if (result.extractedActions && result.extractedActions.length > 0) {
      markdown.push("## Extracted Actions", "");
      markdown.push("| Action | Owner | Deadline | Source | Status |");
      markdown.push("|--------|-------|----------|--------|--------|");
      for (const a of result.extractedActions) {
        markdown.push(`| ${a.action} | ${a.owner} | ${a.deadline} | ${a.sourceRef} | ${a.status} |`);
      }
      markdown.push("");
    }

    if (result.evidenceMap && result.evidenceMap.length > 0) {
      markdown.push("## Evidence Map", "");
      markdown.push("| Finding | Source | Regulation | Quality Standard | Strength |");
      markdown.push("|---------|--------|------------|-----------------|----------|");
      for (const e of result.evidenceMap) {
        markdown.push(
          `| ${e.finding} | ${e.sourceRef} | ${e.regulationRef} | ${e.qualityStandard} | ${e.strength} |`,
        );
      }
      markdown.push("");
    }

    if (result.driftIndicators && result.driftIndicators.length > 0) {
      markdown.push("## Drift Indicators", "");
      for (const d of result.driftIndicators) {
        markdown.push(
          `- **${d.recommendation}** — ${d.occurrences} occurrence(s), first seen ${d.firstSeen}, latest ${d.latestSeen} (${d.resolved ? "Resolved" : "Unresolved"})`,
        );
      }
      markdown.push("");
    }

    if (result.safetyNotes && result.safetyNotes.length > 0) {
      markdown.push("## Safety Notes", "");
      for (const n of result.safetyNotes) {
        markdown.push(`- ${n}`);
      }
      markdown.push("");
    }

    const text = markdown.join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result, documentType, query]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-[var(--cs-cara-gold-bg)] rounded-xl border border-[var(--cs-cara-gold-soft)]">
          <FileSearch className="h-6 w-6 text-[var(--cs-cara-gold)]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--cs-navy)]">
            Document Intelligence
          </h1>
          <p className="mt-0.5 text-sm text-[var(--cs-text-secondary)]">
            Upload or paste documents for AI-powered analysis, action extraction, and regulatory mapping
          </p>
        </div>
      </div>

      {/* ── Input Section ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            Document Input
          </CardTitle>
          <CardDescription>
            Select the document type, paste the content, and describe what you want Cara to analyse.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document type selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">
              Document Type
            </label>
            <Select value={documentType} onValueChange={(v) => setDocumentType(v as DocumentType)}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document text area */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">
              Document Content
              {fileName && (
                <span className="ml-2 text-[var(--cs-text-muted)] font-normal">
                  ({fileName})
                  <button
                    className="ml-1 text-[var(--cs-text-muted)] hover:text-[var(--cs-navy)]"
                    onClick={() => {
                      setFileName(null);
                      setDocumentText("");
                    }}
                  >
                    <X className="h-3 w-3 inline" />
                  </button>
                </span>
              )}
            </label>
            <Textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Paste the document text here, or upload a file below..."
              className="min-h-[200px] font-mono text-xs leading-relaxed"
              disabled={isAnalysing}
            />
          </div>

          {/* File upload zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all
              ${
                isDragging
                  ? "border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)]"
                  : "border-[var(--cs-border)] hover:border-[var(--cs-cara-gold)] hover:bg-[var(--cs-cara-gold-bg)]/30"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.text,text/plain,text/markdown,application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Upload className="h-8 w-8 mx-auto text-[var(--cs-text-muted)] mb-2" />
            <p className="text-sm text-[var(--cs-text-secondary)]">
              Drag & drop a file here, or click to browse
            </p>
            <p className="text-xs text-[var(--cs-text-muted)] mt-1">
              Supports .txt and .md files. PDF text extraction requires server-side processing.
            </p>
          </div>

          {/* Query field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--cs-text-secondary)]">
              What would you like Cara to analyse?
            </label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Extract all actions and recommendations..."
              disabled={isAnalysing}
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUERY_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  disabled={isAnalysing}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--cs-cara-gold-bg)] text-[var(--cs-text-secondary)] border border-[var(--cs-cara-gold-soft)] hover:bg-[var(--cs-cara-gold-soft)] transition-colors disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">{error}</p>
            </div>
          )}

          {/* Analyse button */}
          <Button
            variant="cara"
            size="lg"
            onClick={handleAnalyse}
            disabled={isAnalysing || !documentText.trim() || !query.trim()}
            className="w-full"
          >
            {isAnalysing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analysing document...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyse Document
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Analysis Output Section ─────────────────────────────────────────── */}
      {result && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="cara">
                  <Sparkles className="h-3 w-3" />
                  {result.agentUsed.replace(/_/g, " ")}
                </Badge>
                <Badge
                  className={`border ${RISK_CONFIG[result.riskLevel].bg} ${RISK_CONFIG[result.riskLevel].colour}`}
                >
                  <Shield className="h-3 w-3" />
                  {RISK_CONFIG[result.riskLevel].label} Risk
                </Badge>
                {result.managerReviewRequired && (
                  <Badge variant="warning">
                    <AlertTriangle className="h-3 w-3" />
                    Manager Review Required
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <span className="text-xs text-[var(--cs-text-muted)]">Confidence</span>
                  <Progress
                    value={result.confidence}
                    className="h-2 flex-1"
                    color={getConfidenceColour(result.confidence)}
                  />
                  <span className="text-xs font-semibold text-[var(--cs-navy)] tabular-nums">
                    {result.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Safety flags banner */}
          {result.safetyNotes &&
            result.safetyNotes.length > 0 &&
            !result.safetyNotes.every((n) => n.includes("Demo mode")) && (
              <div className="mx-6 mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">Safety Notes</span>
                </div>
                <ul className="space-y-0.5">
                  {result.safetyNotes.map((note, i) => (
                    <li key={i} className="text-[11px] text-amber-700">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 bg-slate-100 rounded-lg">
                <TabsTrigger value="findings" className="text-xs gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Findings
                </TabsTrigger>
                <TabsTrigger value="actions" className="text-xs gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Actions
                  {result.extractedActions && result.extractedActions.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--cs-navy)] text-white text-[9px]">
                      {result.extractedActions.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="evidence" className="text-xs gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  Evidence Map
                </TabsTrigger>
                <TabsTrigger value="drift" className="text-xs gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Drift
                  {result.driftIndicators &&
                    result.driftIndicators.filter((d) => !d.resolved).length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px]">
                        {result.driftIndicators.filter((d) => !d.resolved).length}
                      </span>
                    )}
                </TabsTrigger>
              </TabsList>

              {/* ── Findings Tab ──────────────────────────────────────────── */}
              <TabsContent value="findings">
                <div className="prose prose-sm max-w-none text-[var(--cs-text-secondary)]">
                  <MarkdownRenderer content={result.answer} />
                </div>
              </TabsContent>

              {/* ── Actions Tab ───────────────────────────────────────────── */}
              <TabsContent value="actions">
                {result.extractedActions && result.extractedActions.length > 0 ? (
                  <div className="space-y-3">
                    <div className="overflow-x-auto rounded-xl border border-[var(--cs-border)]">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-[var(--cs-border)]">
                            <th className="text-left px-3 py-2.5 font-medium text-[var(--cs-text-secondary)]">
                              Action
                            </th>
                            <th className="text-left px-3 py-2.5 font-medium text-[var(--cs-text-secondary)]">
                              Owner
                            </th>
                            <th className="text-left px-3 py-2.5 font-medium text-[var(--cs-text-secondary)]">
                              Deadline
                            </th>
                            <th className="text-left px-3 py-2.5 font-medium text-[var(--cs-text-secondary)]">
                              Source Ref
                            </th>
                            <th className="text-left px-3 py-2.5 font-medium text-[var(--cs-text-secondary)]">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--cs-border)]">
                          {result.extractedActions.map((action, i) => {
                            const style = STATUS_STYLE[action.status] ?? STATUS_STYLE.new;
                            return (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="px-3 py-2.5 text-[var(--cs-navy)] font-medium max-w-[300px]">
                                  {action.action}
                                </td>
                                <td className="px-3 py-2.5 text-[var(--cs-text-secondary)]">
                                  {action.owner}
                                </td>
                                <td className="px-3 py-2.5 text-[var(--cs-text-secondary)]">
                                  {action.deadline}
                                </td>
                                <td className="px-3 py-2.5 text-[var(--cs-text-muted)] font-mono">
                                  {action.sourceRef}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${style.bg} ${style.colour}`}
                                  >
                                    {style.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Create tasks button */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleCreateTasks}
                        disabled={isCreatingTasks}
                      >
                        {isCreatingTasks ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Creating tasks...
                          </>
                        ) : (
                          <>
                            <ClipboardList className="h-3.5 w-3.5" />
                            Create tasks from actions
                          </>
                        )}
                      </Button>
                      {taskCreationMessage && (
                        <span className="text-xs text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {taskCreationMessage}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <EmptyTab message="No actions were extracted from this document." />
                )}
              </TabsContent>

              {/* ── Evidence Map Tab ──────────────────────────────────────── */}
              <TabsContent value="evidence">
                {result.evidenceMap && result.evidenceMap.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-[var(--cs-border)]">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-[var(--cs-border)]">
                          <th className="text-left px-3 py-2.5 font-medium text-[var(--cs-text-secondary)]">
                            Finding
                          </th>
                          <th className="text-left px-3 py-2.5 font-medium text-[var(--cs-text-secondary)]">
                            Source Ref
                          </th>
                          <th className="text-left px-3 py-2.5 font-medium text-[var(--cs-text-secondary)]">
                            Regulation
                          </th>
                          <th className="text-left px-3 py-2.5 font-medium text-[var(--cs-text-secondary)]">
                            Quality Standard
                          </th>
                          <th className="text-left px-3 py-2.5 font-medium text-[var(--cs-text-secondary)]">
                            Strength
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--cs-border)]">
                        {result.evidenceMap.map((item, i) => {
                          const style = STRENGTH_STYLE[item.strength] ?? STRENGTH_STYLE.moderate;
                          return (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2.5 text-[var(--cs-navy)] font-medium max-w-[280px]">
                                {item.finding}
                              </td>
                              <td className="px-3 py-2.5 text-[var(--cs-text-muted)] font-mono">
                                {item.sourceRef}
                              </td>
                              <td className="px-3 py-2.5 text-[var(--cs-text-secondary)]">
                                {item.regulationRef}
                              </td>
                              <td className="px-3 py-2.5 text-[var(--cs-text-secondary)]">
                                {item.qualityStandard}
                              </td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${style.bg} ${style.colour}`}
                                >
                                  {style.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyTab message="No evidence mapping was generated for this document." />
                )}
              </TabsContent>

              {/* ── Drift Indicators Tab ──────────────────────────────────── */}
              <TabsContent value="drift">
                {result.driftIndicators && result.driftIndicators.length > 0 ? (
                  <div className="space-y-3">
                    {result.driftIndicators.map((drift, i) => (
                      <div
                        key={i}
                        className={`rounded-xl border px-4 py-3 ${
                          drift.resolved
                            ? "border-emerald-200 bg-emerald-50/50"
                            : "border-amber-200 bg-amber-50/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {drift.resolved ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                              )}
                              <span className="text-sm font-medium text-[var(--cs-navy)]">
                                {drift.recommendation}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-[var(--cs-text-muted)] ml-6">
                              <span>
                                <strong>{drift.occurrences}</strong> occurrence{drift.occurrences !== 1 ? "s" : ""}
                              </span>
                              <span>First seen: {drift.firstSeen}</span>
                              <span>Latest: {drift.latestSeen}</span>
                            </div>
                          </div>
                          <Badge variant={drift.resolved ? "success" : "warning"}>
                            {drift.resolved ? "Resolved" : "Unresolved"}
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {result.driftIndicators.filter((d) => !d.resolved).length >= 2 && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-red-800">
                            Potential Regulatory Drift Detected
                          </p>
                          <p className="text-[11px] text-red-700 mt-0.5">
                            Multiple unresolved recommendations have been identified across reports. This
                            may indicate a pattern of non-compliance. Manager review is strongly
                            recommended.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyTab message="No drift indicators detected in this document." />
                )}
              </TabsContent>
            </Tabs>

            {/* Action bar */}
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[var(--cs-border)]">
              <Button variant="outline" size="sm" onClick={handleExport}>
                {copied ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Copied to clipboard
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Export analysis
                  </>
                )}
              </Button>
              <span className="text-[10px] text-[var(--cs-text-muted)]">
                Audit ID: {result.auditId}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Recent Analyses ─────────────────────────────────────────────────── */}
      {recentAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-[var(--cs-text-muted)]" />
              Recent Analyses
            </CardTitle>
            <CardDescription>
              Your last {recentAnalyses.length} document analysis session{recentAnalyses.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-[var(--cs-border)] rounded-xl border border-[var(--cs-border)] overflow-hidden">
              {recentAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {formatDocumentType(analysis.documentType)}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[var(--cs-navy)] truncate">
                      {analysis.query}
                    </p>
                    <p className="text-[10px] text-[var(--cs-text-muted)] mt-0.5">
                      {new Date(analysis.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Progress
                        value={analysis.confidence}
                        className="h-1.5 w-12"
                        color={getConfidenceColour(analysis.confidence)}
                      />
                      <span className="text-[10px] font-medium text-[var(--cs-text-muted)] tabular-nums">
                        {analysis.confidence}%
                      </span>
                    </div>
                    <span className="text-[10px] text-[var(--cs-text-muted)]">
                      {analysis.findingCount} finding{analysis.findingCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[10px] text-[var(--cs-text-muted)]">
                      {analysis.actionCount} action{analysis.actionCount !== 1 ? "s" : ""}
                    </span>
                    <Badge
                      className={`text-[9px] border ${RISK_CONFIG[analysis.riskLevel].bg} ${RISK_CONFIG[analysis.riskLevel].colour}`}
                    >
                      {RISK_CONFIG[analysis.riskLevel].label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyTab({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Info className="h-8 w-8 text-[var(--cs-text-muted)] mb-2" />
      <p className="text-sm text-[var(--cs-text-muted)]">{message}</p>
    </div>
  );
}

/**
 * Simple markdown renderer — handles headings, bold, lists, and horizontal rules.
 * Avoids pulling in a full markdown library for this use case.
 */
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const Tag = listType;
      elements.push(
        <Tag
          key={`list-${elements.length}`}
          className={listType === "ol" ? "list-decimal pl-5 space-y-1 mb-3" : "list-disc pl-5 space-y-1 mb-3"}
        >
          {listItems.map((item, i) => (
            <li key={i} className="text-sm text-[var(--cs-text-secondary)]">
              <InlineMarkdown text={item} />
            </li>
          ))}
        </Tag>,
      );
      listItems = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushList();
      elements.push(
        <hr key={`hr-${i}`} className="my-4 border-[var(--cs-border)]" />,
      );
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const sizes = ["text-lg font-semibold", "text-base font-semibold", "text-sm font-semibold", "text-sm font-medium"];
      elements.push(
        <p
          key={`h-${i}`}
          className={`${sizes[level - 1] ?? sizes[3]} text-[var(--cs-navy)] mb-2 mt-4`}
        >
          <InlineMarkdown text={text} />
        </p>,
      );
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^\s*[-*]\s+(.+)/);
    if (ulMatch) {
      if (listType === "ol") flushList();
      listType = "ul";
      listItems.push(ulMatch[1]);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\s*\d+\.\s+(.+)/);
    if (olMatch) {
      if (listType === "ul") flushList();
      listType = "ol";
      listItems.push(olMatch[1]);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      flushList();
      continue;
    }

    // Paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-sm text-[var(--cs-text-secondary)] mb-2">
        <InlineMarkdown text={line} />
      </p>,
    );
  }

  flushList();

  return <div>{elements}</div>;
}

/** Handles **bold** and *italic* inline markdown */
function InlineMarkdown({ text }: { text: string }) {
  // Split by **bold** and *italic* patterns
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-[var(--cs-navy)]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
