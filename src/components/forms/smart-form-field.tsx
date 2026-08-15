"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SMART FORM FIELD
// Reusable form field that auto-fills from RecordOnce context.
// If autoFillKey matches a known field, pre-fills the value and shows an
// "(auto-filled)" indicator. Staff can override any auto-filled value.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useRecordOnce } from "@/contexts/record-once-context";
import { Sparkles } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SmartFormFieldProps {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "date" | "time" | "number";
  autoFillKey?: string;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  className?: string;
  /** Controlled value from parent form */
  value?: string;
  /** Controlled onChange from parent form */
  onChange?: (value: string) => void;
  /** Disable editing (read-only) */
  disabled?: boolean;
  /** Minimum height for textarea (rows) */
  rows?: number;
  /** Min/max/step. Numbers for type="number"; an ISO date string for
   *  type="date" (e.g. max={todayStr()} to stop a record of something that
   *  happened being dated in the future). Both are forwarded to the input. */
  min?: number | string;
  max?: number | string;
  step?: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export function SmartFormField({
  name,
  label,
  type,
  autoFillKey,
  required = false,
  placeholder,
  options,
  className,
  value: controlledValue,
  onChange: controlledOnChange,
  disabled = false,
  rows = 3,
  min,
  max,
  step,
}: SmartFormFieldProps) {
  const { getValue, isLoading } = useRecordOnce();

  // Resolve auto-fill value
  const autoFillValue = autoFillKey ? getValue(autoFillKey) : null;
  const autoFillStr = autoFillValue != null ? String(autoFillValue) : "";

  // Internal state for uncontrolled usage
  const [internalValue, setInternalValue] = useState("");
  const [wasAutoFilled, setWasAutoFilled] = useState(false);
  const [wasOverridden, setWasOverridden] = useState(false);

  // Determine effective value
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  // Apply auto-fill on mount / when auto-fill data arrives
  useEffect(() => {
    if (autoFillStr && !wasOverridden) {
      if (isControlled) {
        if (!controlledValue) {
          controlledOnChange?.(autoFillStr);
          setWasAutoFilled(true);
        }
      } else {
        if (!internalValue) {
          setInternalValue(autoFillStr);
          setWasAutoFilled(true);
        }
      }
    }
    // Intentionally only run when autoFillStr changes (data loaded)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFillStr]);

  const handleChange = useCallback(
    (newValue: string) => {
      if (wasAutoFilled && newValue !== autoFillStr) {
        setWasOverridden(true);
      }
      if (isControlled) {
        controlledOnChange?.(newValue);
      } else {
        setInternalValue(newValue);
      }
    },
    [wasAutoFilled, autoFillStr, isControlled, controlledOnChange],
  );

  // Show auto-fill indicator
  const showAutoFillTag = wasAutoFilled && !wasOverridden && !!currentValue;

  const fieldId = `smart-field-${name}`;

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Label row */}
      <div className="flex items-center gap-2">
        <Label
          htmlFor={fieldId}
          className="text-sm font-medium text-[var(--cs-navy)]"
        >
          {label}
          {required && (
            <span className="text-[var(--cs-risk)] ml-0.5">*</span>
          )}
        </Label>
        {showAutoFillTag && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-medium text-blue-700">
            <Sparkles className="h-2.5 w-2.5" />
            auto-filled
          </span>
        )}
      </div>

      {/* Field */}
      {type === "textarea" ? (
        <Textarea
          id={fieldId}
          name={name}
          value={currentValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled || isLoading}
          rows={rows}
          className={cn(
            "min-h-[48px]",
            showAutoFillTag && "border-blue-200 bg-blue-50/30",
          )}
        />
      ) : type === "select" ? (
        <Select
          value={currentValue}
          onValueChange={handleChange}
          disabled={disabled || isLoading}
        >
          <SelectTrigger
            id={fieldId}
            className={cn(
              "h-12",
              showAutoFillTag && "border-blue-200 bg-blue-50/30",
            )}
          >
            <SelectValue placeholder={placeholder ?? `Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {(options ?? []).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={fieldId}
          name={name}
          type={type}
          value={currentValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled || isLoading}
          min={min}
          max={max}
          step={step}
          className={cn(
            "h-12",
            showAutoFillTag && "border-blue-200 bg-blue-50/30",
          )}
        />
      )}
    </div>
  );
}
