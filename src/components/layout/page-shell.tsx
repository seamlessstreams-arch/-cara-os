"use client";

import React from "react";
import { Header } from "./header";
import { QuickCreateActions } from "@/components/common/quick-create-actions";
import { RecordAnythingButton } from "@/components/forms/record-anything-button";
import type { QuickCreateContext } from "@/components/common/quick-create-modal";
import type { AriaDrawerContext } from "@/components/aria/aria-drawer";

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
  ariaContext?:      AriaDrawerContext;
  children:          React.ReactNode;
  fullWidth?:        boolean;
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
  ariaContext,
  children,
  fullWidth = false,
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
    <div className="relative flex min-h-screen flex-col">
      {/* Ambient brand glow — the same warmth as the marketing site, kept
          subtle enough for a dense working screen. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-50 print:hidden"
        style={{ background: "radial-gradient(55% 90% at 70% 0%, var(--cs-teal-glow) 0%, transparent 60%), radial-gradient(40% 70% at 10% 0%, var(--cs-aria-glow) 0%, transparent 55%)" }}
      />
      <Header
        title={title}
        subtitle={subtitle ?? description}
        actions={headerActions}
        ariaContext={ariaContext}
      />
      <main className={`relative flex-1 p-4 sm:p-6 ${fullWidth ? "" : "max-w-[1440px] mx-auto w-full"}`}>
        {children}
      </main>
    </div>
  );
}
