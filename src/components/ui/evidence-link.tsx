"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  FileText, Image, Link2, Calendar, MessageCircle,
  ClipboardList, ExternalLink,
} from "lucide-react";

type EvidenceType =
  | "document"
  | "photo"
  | "log_entry"
  | "daily_log"
  | "observation"
  | "incident"
  | "meeting"
  | "link";

interface EvidenceLinkProps {
  type: EvidenceType;
  title: string;
  href: string;
  date?: string;
  author?: string;
  preview?: string;
  className?: string;
}

const TYPE_CONFIG: Record<
  EvidenceType,
  { icon: React.ElementType; label: string; color: string }
> = {
  document:    { icon: FileText,      label: "Document",    color: "text-blue-600 bg-blue-50" },
  photo:       { icon: Image,         label: "Photo",       color: "text-purple-600 bg-purple-50" },
  log_entry:   { icon: ClipboardList, label: "Log Entry",   color: "text-emerald-600 bg-emerald-50" },
  daily_log:   { icon: Calendar,      label: "Daily Log",   color: "text-amber-600 bg-amber-50" },
  observation: { icon: MessageCircle, label: "Observation", color: "text-cyan-600 bg-cyan-50" },
  incident:    { icon: FileText,      label: "Incident",    color: "text-red-600 bg-red-50" },
  meeting:     { icon: Calendar,      label: "Meeting",     color: "text-indigo-600 bg-indigo-50" },
  link:        { icon: Link2,         label: "Link",        color: "text-[var(--cs-text-secondary)] bg-[var(--cs-surface)]" },
};

export function EvidenceLink({
  type,
  title,
  href,
  date,
  author,
  preview,
  className,
}: EvidenceLinkProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-[var(--cs-border)] p-3",
        "bg-[var(--cs-surface)] hover:bg-[var(--cs-surface-elevated)]",
        "hover:border-[var(--cs-border-emphasis)] hover:shadow-[var(--cs-shadow-soft)]",
        "transition-all duration-200",
        className,
      )}
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
        config.color,
      )}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-text-muted)]">
            {config.label}
          </span>
          {date && (
            <span className="text-[10px] text-[var(--cs-text-gentle)]">
              {date}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-[var(--cs-navy)] leading-tight truncate group-hover:text-[var(--cs-info)] transition-colors">
          {title}
        </p>
        {(preview || author) && (
          <p className="mt-0.5 text-xs text-[var(--cs-text-muted)] truncate">
            {author && <span className="font-medium">{author}</span>}
            {author && preview && " — "}
            {preview}
          </p>
        )}
      </div>

      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--cs-text-gentle)] opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
    </Link>
  );
}
