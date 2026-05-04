"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PRINT BUTTON
// Reusable print button that generates a clean, print-optimised version
// of page content. Adds proper headers with home name, date, and page title.
// Used across all key pages for Ofsted-ready documentation.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Printer } from "lucide-react";

interface PrintButtonProps {
  title: string;
  subtitle?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
  /** ID of the DOM element to print. If not given, prints the whole page. */
  targetId?: string;
}

export function PrintButton({
  title,
  subtitle,
  className,
  variant = "outline",
  size = "sm",
  targetId,
}: PrintButtonProps) {
  const handlePrint = useCallback(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    // Create print-specific stylesheet
    const printStyles = `
      @media print {
        @page {
          size: A4;
          margin: 20mm 15mm;
        }
        body * {
          visibility: hidden;
        }
        #print-content, #print-content * {
          visibility: visible;
        }
        #print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #1a1a1a;
        }
        .print-header {
          display: flex !important;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #1a1a1a;
          padding-bottom: 8pt;
          margin-bottom: 16pt;
        }
        .print-header h1 {
          font-size: 16pt;
          font-weight: 700;
          margin: 0;
        }
        .print-header .print-meta {
          text-align: right;
          font-size: 9pt;
          color: #666;
        }
        .print-footer {
          display: flex !important;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          border-top: 1px solid #ccc;
          padding-top: 4pt;
          font-size: 8pt;
          color: #999;
          justify-content: space-between;
        }
        /* Hide interactive elements */
        button, .no-print, [data-no-print] {
          display: none !important;
        }
        /* Make cards print nicely */
        .rounded-2xl, .rounded-xl {
          border-radius: 0 !important;
          border: 1px solid #e5e5e5 !important;
          box-shadow: none !important;
        }
        /* Ensure tables and content don't break awkwardly */
        tr, .flex { page-break-inside: avoid; }
        h2, h3 { page-break-after: avoid; }
      }
    `;

    // If targeting a specific element, clone it into a print container
    if (targetId) {
      const target = document.getElementById(targetId);
      if (!target) return;

      // Create wrapper
      const wrapper = document.createElement("div");
      wrapper.id = "print-content";

      // Header
      wrapper.innerHTML = `
        <div class="print-header" style="display:flex;justify-content:space-between;border-bottom:2px solid #1a1a1a;padding-bottom:8px;margin-bottom:16px;">
          <div>
            <h1 style="font-size:16pt;font-weight:700;margin:0;">${title}</h1>
            ${subtitle ? `<p style="font-size:10pt;color:#666;margin:4px 0 0;">${subtitle}</p>` : ""}
          </div>
          <div style="text-align:right;font-size:9pt;color:#666;">
            <div>Oak House — Cornerstone</div>
            <div>${dateStr}</div>
            <div>Printed at ${timeStr}</div>
          </div>
        </div>
      `;

      // Content
      const content = target.cloneNode(true) as HTMLElement;
      wrapper.appendChild(content);

      // Footer
      const footer = document.createElement("div");
      footer.className = "print-footer";
      footer.style.cssText = "position:fixed;bottom:0;left:0;right:0;border-top:1px solid #ccc;padding-top:4px;font-size:8pt;color:#999;display:flex;justify-content:space-between;";
      footer.innerHTML = `<span>Cornerstone — Oak House</span><span>Printed ${dateStr} ${timeStr}</span>`;
      wrapper.appendChild(footer);

      // Add to DOM
      document.body.appendChild(wrapper);

      // Add print styles
      const style = document.createElement("style");
      style.id = "print-styles";
      style.textContent = printStyles;
      document.head.appendChild(style);

      window.print();

      // Clean up
      document.body.removeChild(wrapper);
      document.head.removeChild(style);
    } else {
      window.print();
    }
  }, [title, subtitle, targetId]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePrint}
      className={cn("gap-1.5 text-slate-500 data-[no-print]:hidden", className)}
      data-no-print
    >
      <Printer className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Print</span>
    </Button>
  );
}
