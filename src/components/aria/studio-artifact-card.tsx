"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import {
  FileText, Eye, CheckCircle, XCircle, Clock, AlertTriangle,
  Send, Trash2, Archive, RotateCcw, Lock, ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import type { AriaArtifact, AriaArtifactStatus, AriaArtifactType } from "@/types/aria-studio";
import { ARIA_ARTIFACT_TYPE_LABELS, ARIA_STATUS_LABELS } from "@/types/aria-studio";

interface AriaStudioArtifactCardProps {
  artifact: AriaArtifact;
  onSubmit?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRecover?: (id: string) => void;
}

const STATUS_CONFIG: Record<AriaArtifactStatus, {
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: "default" | "secondary" | "destructive" | "outline";
}> = {
  draft: { color: "text-yellow-700", icon: Clock, variant: "outline" },
  in_review: { color: "text-blue-700", icon: Eye, variant: "outline" },
  changes_requested: { color: "text-orange-700", icon: AlertTriangle, variant: "outline" },
  approved: { color: "text-green-700", icon: CheckCircle, variant: "outline" },
  rejected: { color: "text-red-700", icon: XCircle, variant: "destructive" },
  committed: { color: "text-emerald-700", icon: Lock, variant: "outline" },
  archived: { color: "text-gray-500", icon: Archive, variant: "secondary" },
  deleted_recoverable: { color: "text-red-400", icon: Trash2, variant: "destructive" },
};

const SAFEGUARDING_COLOURS: Record<string, string> = {
  none: "",
  low: "border-l-yellow-400",
  medium: "border-l-orange-400",
  high: "border-l-red-500",
};

export function AriaStudioArtifactCard({
  artifact,
  onSubmit,
  onArchive,
  onDelete,
  onRecover,
}: AriaStudioArtifactCardProps) {
  const statusCfg = STATUS_CONFIG[artifact.status] ?? STATUS_CONFIG.draft;
  const StatusIcon = statusCfg.icon;
  const borderClass = SAFEGUARDING_COLOURS[artifact.safeguarding_level] ?? "";

  const typeLabel = ARIA_ARTIFACT_TYPE_LABELS[artifact.artifact_type as AriaArtifactType] ?? artifact.artifact_type;
  const statusLabel = ARIA_STATUS_LABELS[artifact.status] ?? artifact.status;
  const createdAgo = formatDistanceToNow(new Date(artifact.created_at), { addSuffix: true });

  return (
    <Card className={`border-l-4 ${borderClass || "border-l-transparent"} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <Link
                href={`/intelligence/aria/studio/${artifact.id}`}
                className="font-medium text-sm leading-snug hover:underline line-clamp-2"
              >
                {artifact.title}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">{typeLabel}</p>
            </div>
          </div>
          <Badge variant={statusCfg.variant} className="gap-1 text-xs shrink-0">
            <StatusIcon className="h-3 w-3" />
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-3">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {artifact.child_id && (
            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-sm">
              {artifact.child_id}
            </span>
          )}
          <span className="capitalize">{artifact.framework}</span>
          <span>·</span>
          <span>{createdAgo}</span>
          <span>·</span>
          <span>v{artifact.version_number}</span>
          {artifact.evidence_confidence_score !== null && (
            <>
              <span>·</span>
              <span
                className={
                  artifact.evidence_confidence_score >= 70
                    ? "text-green-700"
                    : artifact.evidence_confidence_score >= 40
                      ? "text-yellow-700"
                      : "text-red-600"
                }
              >
                {artifact.evidence_confidence_score}% confidence
              </span>
            </>
          )}
        </div>

        {/* Snippet */}
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
          {artifact.generated_content.replace(/#+\s/g, "").replace(/\*\*/g, "").slice(0, 200)}
        </p>

        {/* Safeguarding banner */}
        {artifact.safeguarding_level !== "none" && (
          <div className={`mt-2 text-xs px-2 py-1 rounded-sm font-medium ${
            artifact.safeguarding_level === "high"
              ? "bg-red-50 text-red-700"
              : artifact.safeguarding_level === "medium"
                ? "bg-orange-50 text-orange-700"
                : "bg-yellow-50 text-yellow-700"
          }`}>
            ⚠ Safeguarding level: {artifact.safeguarding_level}
          </div>
        )}

        {/* QC passed badge */}
        {artifact.quality_checks_passed && (
          <div className="mt-2 text-xs text-green-700 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Quality checks passed
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <Link href={`/intelligence/aria/studio/${artifact.id}`}>
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs gap-1">
              <Eye className="h-3 w-3" />
              View
            </Button>
          </Link>
          {artifact.status === "draft" && onSubmit && (
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs gap-1" onClick={() => onSubmit(artifact.id)}>
              <Send className="h-3 w-3" />
              Submit
            </Button>
          )}
          {artifact.status === "deleted_recoverable" && onRecover && (
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs gap-1" onClick={() => onRecover(artifact.id)}>
              <RotateCcw className="h-3 w-3" />
              Recover
            </Button>
          )}
          {artifact.status !== "committed" && artifact.status !== "deleted_recoverable" && onArchive && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 text-muted-foreground" onClick={() => onArchive(artifact.id)}>
              <Archive className="h-3 w-3" />
              Archive
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
