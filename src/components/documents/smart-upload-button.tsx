"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentUploadModal } from "./document-upload-modal";

interface SmartUploadButtonProps {
  /** Pre-fill the linked child/staff/incident context */
  linkedChildId?: string;
  linkedStaffId?: string;
  linkedIncidentId?: string;
  /** Upload context hint for Cara */
  uploadContext?: string;
  /** Visual variant */
  variant?: "button" | "icon" | "inline";
  className?: string;
  label?: string;
}

export function SmartUploadButton({
  linkedChildId,
  linkedStaffId,
  linkedIncidentId,
  uploadContext,
  variant = "button",
  className,
  label = "Smart Upload",
}: SmartUploadButtonProps) {
  const [open, setOpen] = useState(false);

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          title="Upload document — Cara will classify and extract intelligence"
          className={cn(
            "inline-flex items-center justify-center rounded-xl bg-[var(--cs-navy)] text-white hover:bg-[var(--cs-navy)]/90 transition-colors h-8 w-8 shrink-0",
            className,
          )}
        >
          <Upload className="h-3.5 w-3.5" />
        </button>
        {open && (
          <DocumentUploadModal
            linkedChildId={linkedChildId}
            linkedStaffId={linkedStaffId}
            linkedIncidentId={linkedIncidentId}
            uploadContext={uploadContext}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    );
  }

  if (variant === "inline") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] px-3 py-2 text-xs font-semibold text-[var(--cs-cara-gold)] hover:bg-[var(--cs-cara-gold-bg)] transition-colors",
            className,
          )}
        >
          <Upload className="h-3.5 w-3.5" />
          {label}
        </button>
        {open && (
          <DocumentUploadModal
            linkedChildId={linkedChildId}
            linkedStaffId={linkedStaffId}
            linkedIncidentId={linkedIncidentId}
            uploadContext={uploadContext}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl bg-[var(--cs-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--cs-navy)]/90 transition-colors shadow-sm",
          className,
        )}
      >
        <Upload className="h-4 w-4" />
        {label}
      </button>
      {open && (
        <DocumentUploadModal
          linkedChildId={linkedChildId}
          linkedStaffId={linkedStaffId}
          linkedIncidentId={linkedIncidentId}
          uploadContext={uploadContext}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
