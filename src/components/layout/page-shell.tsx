"use client";

import React from "react";
import { Header } from "./header";
import { QuickCreateActions } from "@/components/common/quick-create-actions";
import type { QuickCreateContext } from "@/components/common/quick-create-modal";
import type { AriaDrawerContext } from "@/components/aria/aria-drawer";

interface PageShellProps {
  title:             string;
  subtitle?:         string;
  /** Custom action nodes rendered in the top bar */
  actions?:          React.ReactNode;
  /** When provided, renders QuickCreateActions in the header */
  quickCreateContext?: QuickCreateContext;
  /** Set to false to suppress the automatic QuickCreate buttons */
  showQuickCreate?:  boolean;
  /** Aria context — passed to the Aria drawer for contextual suggestions */
  ariaContext?:      AriaDrawerContext;
  children:          React.ReactNode;
  fullWidth?:        boolean;
}

export function PageShell({
  title,
  subtitle,
  actions,
  quickCreateContext,
  showQuickCreate = true,
  ariaContext,
  children,
  fullWidth = false,
}: PageShellProps) {
  const headerActions = (
    <>
      {actions}
      {showQuickCreate && (
        <QuickCreateActions context={quickCreateContext} />
      )}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title={title}
        subtitle={subtitle}
        actions={headerActions}
        ariaContext={ariaContext}
      />
      <main className={`flex-1 p-4 sm:p-6 ${fullWidth ? "" : "max-w-[1440px] mx-auto w-full"}`}>
        {children}
      </main>
    </div>
  );
}
