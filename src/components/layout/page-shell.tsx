"use client";

import React from "react";
import { Header } from "./header";
import { QuickCreateActions } from "@/components/common/quick-create-actions";
import { RecordAnythingButton } from "@/components/forms/record-anything-button";
import { SensitiveSurface } from "@/components/security/capture-deterrence";
import type { QuickCreateContext } from "@/components/common/quick-create-modal";
import type { CaraDrawerContext } from "@/components/cara/cara-drawer";

export interface PageShellProps {
  title:             string;
  subtitle?:         string;
  /** Page description shown below title */
  description?:      string;
  /** Icon rendered beside the title */
  icon?:             React.ReactNode;
  /** Custom action nodes rendered in the top bar */
  actions?:          React.ReactNode;
  /** When provided, renders QuickCreateActions in the header */
  quickCreateContext?: QuickCreateContext;
  /** Set to false to suppress the automatic QuickCreate buttons */
  showQuickCreate?:  boolean;
  /** Show the universal "Record anything" capture button in the header */
  recordAnything?:   boolean;
  /** Pre-fill the captured record against this child (young-person pages) */
  recordChildId?:    string;
  /** Cara context — passed to the Cara drawer for contextual suggestions */
  caraContext?:      CaraDrawerContext;
  /** Wrap the page body in a SensitiveSurface (attribution watermark +
   * blur-when-inactive). Use for child-confidential screens. */
  sensitive?:        boolean;
  children:          React.ReactNode;
  fullWidth?:        boolean;
  /** Opt this page's BODY into the Ask CARA dark skin (phase-2 rollout). */
  darkBody?:         boolean;
}

export function PageShell({
  title,
  subtitle,
  description,
  icon,
  actions,
  quickCreateContext,
  showQuickCreate = true,
  recordAnything = false,
  recordChildId,
  caraContext,
  sensitive = false,
  children,
  fullWidth = false,
  darkBody = false,
}: PageShellProps) {
  const headerActions = (
    <>
      {actions}
      {recordAnything && <RecordAnythingButton childId={recordChildId} />}
      {showQuickCreate && (
        <QuickCreateActions context={quickCreateContext} />
      )}
    </>
  );

  return (
    <div className={`relative flex min-h-screen flex-col${darkBody ? " cara-dark" : ""}`}>
      {/* Ambient brand glow — the same warmth as the marketing site, kept
          subtle enough for a dense working screen. Suppressed on dark pages,
          which carry their own glow. */}
      {!darkBody && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-50 print:hidden"
          style={{ background: "radial-gradient(55% 90% at 70% 0%, var(--cs-teal-glow) 0%, transparent 60%), radial-gradient(40% 70% at 10% 0%, var(--cs-cara-glow) 0%, transparent 55%)" }}
        />
      )}
      <Header
        title={title}
        subtitle={subtitle ?? description}
        actions={headerActions}
        caraContext={caraContext}
      />
      <main className={`relative flex-1 px-4 py-6 sm:px-7 sm:py-8 ${fullWidth ? "" : "max-w-[1440px] mx-auto w-full"}`}>
        {sensitive ? <SensitiveSurface>{children}</SensitiveSurface> : children}
      </main>
    </div>
  );
}
