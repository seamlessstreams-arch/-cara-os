"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EXPORT BUTTON
// Reusable CSV export button. Takes column definitions and row data,
// generates a CSV file, and triggers a browser download. Used across
// listing pages for Ofsted-ready data export.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

export interface ExportColumn<T> {
  /** CSV column header */
  header: string;
  /** Function to extract the cell value from a row */
  accessor: (row: T) => string | number | boolean | null | undefined;
}

interface ExportButtonProps<T> {
  /** CSV filename (without .csv extension) */
  filename: string;
  /** Column definitions */
  columns: ExportColumn<T>[];
  /** The data rows to export */
  data: T[];
  /** Optional — defaults to "outline" */
  variant?: "default" | "outline" | "ghost";
  /** Optional — defaults to "sm" */
  size?: "default" | "sm" | "icon";
  className?: string;
  /** Label text — defaults to "Export" */
  label?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ExportButton<T>({
  filename,
  columns,
  data,
  variant = "outline",
  size = "sm",
  className,
  label = "Export",
  disabled = false,
}: ExportButtonProps<T>) {
  const handleExport = useCallback(() => {
    if (data.length === 0) return;

    // Build CSV content
    const headerRow = columns.map((c) => escapeCSV(c.header)).join(",");
    const dataRows = data.map((row) =>
      columns
        .map((col) => {
          const val = col.accessor(row);
          if (val === null || val === undefined) return "";
          return escapeCSV(String(val));
        })
        .join(",")
    );

    const csv = [headerRow, ...dataRows].join("\n");

    // Generate timestamp for filename
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const fullFilename = `${filename}-${dateStr}.csv`;

    // Create blob and trigger download
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fullFilename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filename, columns, data]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={disabled || data.length === 0}
      className={cn("gap-1.5 text-slate-500", className)}
      data-no-print
    >
      <Download className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
