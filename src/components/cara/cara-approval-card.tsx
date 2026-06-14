"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraApprovalCard
//
// Card that shows an Cara draft with approve/reject/edit controls.
// Used in the Cara review queue and wherever drafts need manager sign-off.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CaraHumanReviewBanner } from "./cara-human-review-banner";
import { CaraConfidenceIndicator } from "./cara-confidence-indicator";
import {
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Copy,
  CheckCircle2,
  Sparkles,
  Clock,
  User,
} from "lucide-react";

interface CaraApprovalCardProps {
  outputId: string;
  generatedText: string;
  commandLabel: string;
  confidence: "low" | "medium" | "high";
  requestedBy?: string;
  requestedAt?: string;
  highRisk?: boolean;
  onApprove: (outputId: string, editedText?: string) => void;
  onReject: (outputId: string, reason: string) => void;
  className?: string;
}

export function CaraApprovalCard({
  outputId,
  generatedText,
  commandLabel,
  confidence,
  requestedBy,
  requestedAt,
  highRisk = false,
  onApprove,
  onReject,
  className,
}: CaraApprovalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(generatedText);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editedText : generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = () => {
    onApprove(outputId, isEditing ? editedText : undefined);
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    onReject(outputId, rejectReason);
  };

  return (
    <div className={cn(
      "rounded-xl border border-[var(--cs-border)] bg-white overflow-hidden",
      className,
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--cs-border)] bg-[var(--cs-surface)]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
          <span className="text-sm font-medium text-[var(--cs-navy)]">
            {commandLabel}
          </span>
          <CaraConfidenceIndicator confidence={confidence} />
        </div>
        <Badge
          variant="warning"
          className="text-[9px]"
        >
          Awaiting review
        </Badge>
      </div>

      {/* Review banner */}
      <div className="px-4 pt-3">
        <CaraHumanReviewBanner
          confidence={confidence}
          highRisk={highRisk}
        />
      </div>

      {/* Metadata */}
      {(requestedBy || requestedAt) && (
        <div className="px-4 pt-2 flex items-center gap-3 text-[10px] text-[var(--cs-text-muted)]">
          {requestedBy && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {requestedBy}
            </span>
          )}
          {requestedAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {requestedAt}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={8}
            className="text-xs"
          />
        ) : (
          <div className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] p-3 text-xs text-[var(--cs-text-secondary)] whitespace-pre-wrap max-h-64 overflow-y-auto">
            {generatedText}
          </div>
        )}
      </div>

      {/* Reject reason */}
      {showReject && (
        <div className="px-4 pb-3">
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={2}
            className="text-xs"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
        <Button
          size="sm"
          className="text-xs gap-1 bg-green-600 hover:bg-green-700 text-white"
          onClick={handleApprove}
        >
          <ThumbsUp className="h-3 w-3" />
          {isEditing ? "Approve edited" : "Approve"}
        </Button>

        {showReject ? (
          <Button
            size="sm"
            variant="destructive"
            className="text-xs gap-1"
            onClick={handleReject}
            disabled={!rejectReason.trim()}
          >
            <ThumbsDown className="h-3 w-3" />
            Confirm rejection
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1 text-red-700 border-red-200 hover:bg-red-50"
            onClick={() => setShowReject(true)}
          >
            <ThumbsDown className="h-3 w-3" />
            Reject
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          className="text-xs gap-1"
          onClick={() => {
            setIsEditing(!isEditing);
            if (!isEditing) setEditedText(generatedText);
          }}
        >
          <Edit3 className="h-3 w-3" />
          {isEditing ? "Cancel edit" : "Edit"}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="text-xs gap-1 ml-auto"
          onClick={handleCopy}
        >
          {copied ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
