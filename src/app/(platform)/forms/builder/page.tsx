"use client";

import React, { useState, useMemo, useCallback } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FormFieldDefinition, FormFieldType } from "@/types/operations";
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp,
  Settings, Eye, Save, Copy, FileText, Type,
  AlignLeft, Hash, Calendar, Clock, List,
  CheckSquare, ToggleLeft, Upload, PenTool,
  Star, SlidersHorizontal, Users, Heart,
  Heading, Info, Layers, Repeat,
  Sparkles, Shield, AlertTriangle,
} from "lucide-react";
import { demoSeed } from "@/lib/demo/demo-seed";

// ── Field type config ──────────────────────────────────────────────────────

interface FieldTypeConfig {
  type: FormFieldType;
  label: string;
  icon: React.ElementType;
  category: "basic" | "choice" | "advanced" | "layout" | "picker";
  hasOptions: boolean;
  hasValidation: boolean;
}

const FIELD_TYPES: FieldTypeConfig[] = [
  // Basic
  { type: "text", label: "Text Input", icon: Type, category: "basic", hasOptions: false, hasValidation: true },
  { type: "textarea", label: "Text Area", icon: AlignLeft, category: "basic", hasOptions: false, hasValidation: true },
  { type: "rich_text", label: "Rich Text", icon: FileText, category: "basic", hasOptions: false, hasValidation: false },
  { type: "number", label: "Number", icon: Hash, category: "basic", hasOptions: false, hasValidation: true },
  { type: "date", label: "Date", icon: Calendar, category: "basic", hasOptions: false, hasValidation: true },
  { type: "time", label: "Time", icon: Clock, category: "basic", hasOptions: false, hasValidation: false },
  { type: "datetime", label: "Date & Time", icon: Calendar, category: "basic", hasOptions: false, hasValidation: false },

  // Choice
  { type: "select", label: "Dropdown", icon: List, category: "choice", hasOptions: true, hasValidation: false },
  { type: "multi_select", label: "Multi Select", icon: List, category: "choice", hasOptions: true, hasValidation: false },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare, category: "choice", hasOptions: false, hasValidation: false },
  { type: "radio", label: "Radio Group", icon: CheckSquare, category: "choice", hasOptions: true, hasValidation: false },
  { type: "toggle", label: "Toggle", icon: ToggleLeft, category: "choice", hasOptions: false, hasValidation: false },

  // Advanced
  { type: "file_upload", label: "File Upload", icon: Upload, category: "advanced", hasOptions: false, hasValidation: false },
  { type: "signature", label: "Signature", icon: PenTool, category: "advanced", hasOptions: false, hasValidation: false },
  { type: "rating", label: "Rating", icon: Star, category: "advanced", hasOptions: false, hasValidation: true },
  { type: "scale", label: "Scale", icon: SlidersHorizontal, category: "advanced", hasOptions: false, hasValidation: true },

  // Pickers
  { type: "staff_picker", label: "Staff Picker", icon: Users, category: "picker", hasOptions: false, hasValidation: false },
  { type: "child_picker", label: "Child Picker", icon: Heart, category: "picker", hasOptions: false, hasValidation: false },

  // Layout
  { type: "section_header", label: "Section Header", icon: Heading, category: "layout", hasOptions: false, hasValidation: false },
  { type: "info_block", label: "Info Block", icon: Info, category: "layout", hasOptions: false, hasValidation: false },
  { type: "conditional_group", label: "Conditional Group", icon: Layers, category: "layout", hasOptions: false, hasValidation: false },
  { type: "repeater", label: "Repeater", icon: Repeat, category: "layout", hasOptions: false, hasValidation: false },
];

const CATEGORY_LABELS: Record<string, string> = {
  basic: "Basic Fields",
  choice: "Choice Fields",
  advanced: "Advanced",
  picker: "Entity Pickers",
  layout: "Layout & Logic",
};

const CATEGORY_ORDER = ["basic", "choice", "advanced", "picker", "layout"];

// ── Demo form fields ───────────────────────────────────────────────────────

const DEMO_FIELDS: FormFieldDefinition[] = [
  {
    id: "f1", type: "section_header", label: "Incident Details",
    name: "incident_details_header", required: false,
  },
  {
    id: "f2", type: "date", label: "Date of Incident",
    name: "incident_date", required: true,
    help_text: "Enter the date the incident occurred",
  },
  {
    id: "f3", type: "time", label: "Time of Incident",
    name: "incident_time", required: true,
  },
  {
    id: "f4", type: "child_picker", label: "Young Person Involved",
    name: "child_id", required: true,
    help_text: "Select the young person involved in the incident",
  },
  {
    id: "f5", type: "select", label: "Incident Type",
    name: "incident_type", required: true,
    options: [
      { label: "Physical Intervention", value: "physical_intervention" },
      { label: "Verbal Aggression", value: "verbal_aggression" },
      { label: "Physical Aggression", value: "physical_aggression" },
      { label: "Self-Harm", value: "self_harm" },
      { label: "Missing from Care", value: "missing" },
      { label: "Property Damage", value: "property_damage" },
      { label: "Safeguarding Concern", value: "safeguarding" },
      { label: "Medication Error", value: "medication_error" },
      { label: "Other", value: "other" },
    ],
  },
  {
    id: "f6", type: "select", label: "Severity",
    name: "severity", required: true,
    options: [
      { label: "Low", value: "low" },
      { label: "Medium", value: "medium" },
      { label: "High", value: "high" },
      { label: "Critical", value: "critical" },
    ],
  },
  {
    id: "f7", type: "text", label: "Location",
    name: "location", required: true,
    placeholder: "e.g., Living room, Garden, Bedroom",
  },
  {
    id: "f8", type: "section_header", label: "Description & Response",
    name: "description_header", required: false,
  },
  {
    id: "f9", type: "textarea", label: "Description of Incident",
    name: "description", required: true,
    help_text: "Provide a factual, detailed account of what happened",
    validation: { min_length: 50, message: "Please provide at least 50 characters" },
  },
  {
    id: "f10", type: "textarea", label: "Immediate Action Taken",
    name: "immediate_action", required: true,
    help_text: "Describe the steps taken immediately after the incident",
  },
  {
    id: "f11", type: "toggle", label: "Physical Intervention Used?",
    name: "pi_used", required: false,
  },
  {
    id: "f12", type: "textarea", label: "Physical Intervention Details",
    name: "pi_details", required: false,
    help_text: "If physical intervention was used, describe the technique, duration, and justification",
    conditional_on: { field: "pi_used", operator: "equals", value: true },
  },
  {
    id: "f13", type: "multi_select", label: "Notifications Made",
    name: "notifications_made", required: true,
    options: [
      { label: "Social Worker", value: "social_worker" },
      { label: "Parent/Carer", value: "parent" },
      { label: "Manager", value: "manager" },
      { label: "Police", value: "police" },
      { label: "Ofsted", value: "ofsted" },
      { label: "LADO", value: "lado" },
    ],
  },
  {
    id: "f14", type: "staff_picker", label: "Reported By",
    name: "reported_by", required: true,
  },
  {
    id: "f15", type: "signature", label: "Staff Signature",
    name: "staff_signature", required: true,
  },
];

// ══════════════════════════════════════════════════════════════════════════════

type ViewMode = "build" | "preview";

export default function FormBuilderPage() {
  const [fields, setFields] = useState<FormFieldDefinition[]>(demoSeed(DEMO_FIELDS));
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("build");
  const [formTitle, setFormTitle] = useState("Incident Report Form");
  const [formCategory, setFormCategory] = useState("incident_reporting");
  const [paletteCategory, setPaletteCategory] = useState("basic");

  const selectedField = selectedFieldId ? fields.find((f) => f.id === selectedFieldId) : null;

  const addField = useCallback((type: FormFieldType) => {
    const config = FIELD_TYPES.find((ft) => ft.type === type);
    if (!config) return;

    const newField: FormFieldDefinition = {
      id: `f${Date.now()}`,
      type,
      label: config.label,
      name: `field_${Date.now()}`,
      required: false,
      ...(config.hasOptions ? {
        options: [
          { label: "Option 1", value: "option_1" },
          { label: "Option 2", value: "option_2" },
        ],
      } : {}),
    };

    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }, []);

  const removeField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  }, [selectedFieldId]);

  const moveField = useCallback((id: string, direction: "up" | "down") => {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx === -1) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.length - 1) return prev;

      const next = [...prev];
      const swap = direction === "up" ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, []);

  const updateField = useCallback((id: string, updates: Partial<FormFieldDefinition>) => {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, ...updates } : f));
  }, []);

  return (
    <PageShell title="Form Builder" subtitle="Design and configure form templates with conditional logic">
      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex items-center gap-3">
          <Input
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            className="text-lg font-semibold w-80"
          />
          <Badge variant="outline" className="bg-blue-50 text-blue-700 capitalize">
            {formCategory.replace(/_/g, " ")}
          </Badge>
          <Badge variant="outline" className="bg-gray-50 text-gray-600">
            {fields.length} fields
          </Badge>
          <div className="flex-1" />
          <div className="flex gap-2">
            <Button
              variant={viewMode === "build" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("build")}
              className="gap-1.5"
            >
              <Settings className="h-4 w-4" /> Build
            </Button>
            <Button
              variant={viewMode === "preview" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("preview")}
              className="gap-1.5"
            >
              <Eye className="h-4 w-4" /> Preview
            </Button>
          </div>
          <Button size="sm" className="gap-1.5">
            <Save className="h-4 w-4" /> Save Template
          </Button>
        </div>

        {viewMode === "build" ? (
          <div className="flex gap-4">
            {/* Field palette */}
            <div className="w-56 shrink-0">
              <Card className="sticky top-4">
                <CardContent className="p-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Add Field</h3>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {CATEGORY_ORDER.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setPaletteCategory(cat)}
                        className={cn(
                          "px-2 py-1 text-[10px] rounded-full font-medium transition-colors",
                          paletteCategory === cat ? "bg-[var(--cs-primary)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                        )}
                      >
                        {CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {FIELD_TYPES.filter((ft) => ft.category === paletteCategory).map((ft) => {
                      const Icon = ft.icon;
                      return (
                        <button
                          key={ft.type}
                          onClick={() => addField(ft.type)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-gray-50 transition-colors text-sm"
                        >
                          <Icon className="h-4 w-4 text-gray-500 shrink-0" />
                          <span className="text-gray-700">{ft.label}</span>
                          <Plus className="h-3 w-3 text-gray-400 ml-auto" />
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Canvas */}
            <div className="flex-1 space-y-2">
              {fields.map((field, idx) => {
                const config = FIELD_TYPES.find((ft) => ft.type === field.type);
                const Icon = config?.icon ?? FileText;
                const isSelected = field.id === selectedFieldId;

                return (
                  <div
                    key={field.id}
                    className={cn(
                      "group flex items-start gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer",
                      isSelected ? "border-[var(--cs-primary)] bg-blue-50/30 shadow-sm" : "border-transparent hover:border-gray-200 bg-white",
                      field.conditional_on && "ml-6 border-l-4 border-l-violet-300",
                    )}
                    onClick={() => setSelectedFieldId(field.id)}
                  >
                    {/* Drag handle */}
                    <div className="flex flex-col gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); moveField(field.id, "up"); }}>
                        <ChevronUp className="h-3.5 w-3.5 text-gray-400 hover:text-gray-700" />
                      </button>
                      <GripVertical className="h-3.5 w-3.5 text-gray-300" />
                      <button onClick={(e) => { e.stopPropagation(); moveField(field.id, "down"); }}>
                        <ChevronDown className="h-3.5 w-3.5 text-gray-400 hover:text-gray-700" />
                      </button>
                    </div>

                    {/* Field icon */}
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      field.type === "section_header" ? "bg-indigo-100" :
                      field.type === "info_block" ? "bg-amber-100" :
                      "bg-gray-100",
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        field.type === "section_header" ? "text-indigo-600" :
                        field.type === "info_block" ? "text-amber-600" :
                        "text-gray-600",
                      )} />
                    </div>

                    {/* Field info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-medium",
                          field.type === "section_header" ? "text-indigo-900 text-base" : "text-gray-900",
                        )}>
                          {field.label}
                        </span>
                        {field.required && (
                          <span className="text-red-500 text-xs">*</span>
                        )}
                        <Badge className="text-[9px] bg-gray-100 text-gray-500">{config?.label ?? field.type}</Badge>
                        {field.conditional_on && (
                          <Badge className="text-[9px] bg-violet-100 text-violet-600">
                            <Layers className="h-2.5 w-2.5 mr-0.5" /> Conditional
                          </Badge>
                        )}
                      </div>
                      {field.help_text && (
                        <p className="text-xs text-gray-500 mt-0.5">{field.help_text}</p>
                      )}
                      {field.options && field.options.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {field.options.slice(0, 4).map((opt) => (
                            <span key={opt.value} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {opt.label}
                            </span>
                          ))}
                          {field.options.length > 4 && (
                            <span className="text-[10px] text-gray-400">+{field.options.length - 4} more</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); const dup = { ...field, id: `f${Date.now()}`, name: `${field.name}_copy` }; setFields((p) => { const idx2 = p.findIndex((f2) => f2.id === field.id); const n = [...p]; n.splice(idx2 + 1, 0, dup); return n; }); }}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                        className="p-1 rounded hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add field shortcut */}
              <button
                onClick={() => addField("text")}
                className="w-full p-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4" /> Add Field
              </button>
            </div>

            {/* Properties panel */}
            <div className="w-72 shrink-0">
              {selectedField ? (
                <Card className="sticky top-4">
                  <CardContent className="p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Settings className="h-4 w-4" /> Field Properties
                    </h3>

                    {/* Label */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Label</label>
                      <Input
                        value={selectedField.label}
                        onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                        className="text-sm"
                      />
                    </div>

                    {/* Name */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Field Name (API)</label>
                      <Input
                        value={selectedField.name}
                        onChange={(e) => updateField(selectedField.id, { name: e.target.value })}
                        className="text-sm font-mono"
                      />
                    </div>

                    {/* Required */}
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-600">Required</label>
                      <button
                        onClick={() => updateField(selectedField.id, { required: !selectedField.required })}
                        className={cn(
                          "h-6 w-11 rounded-full relative transition-colors",
                          selectedField.required ? "bg-blue-500" : "bg-gray-300",
                        )}
                      >
                        <div className={cn(
                          "h-5 w-5 bg-white rounded-full absolute top-0.5 transition-all shadow",
                          selectedField.required ? "left-[22px]" : "left-0.5",
                        )} />
                      </button>
                    </div>

                    {/* Placeholder */}
                    {!["section_header", "info_block", "checkbox", "toggle", "signature", "file_upload"].includes(selectedField.type) && (
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Placeholder</label>
                        <Input
                          value={selectedField.placeholder ?? ""}
                          onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value || undefined })}
                          className="text-sm"
                          placeholder="Optional placeholder text"
                        />
                      </div>
                    )}

                    {/* Help text */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Help Text</label>
                      <Input
                        value={selectedField.help_text ?? ""}
                        onChange={(e) => updateField(selectedField.id, { help_text: e.target.value || undefined })}
                        className="text-sm"
                        placeholder="Instructions for the user"
                      />
                    </div>

                    {/* Options (for select/radio/multi_select) */}
                    {selectedField.options && (
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Options</label>
                        <div className="space-y-1">
                          {selectedField.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <Input
                                value={opt.label}
                                onChange={(e) => {
                                  const newOpts = [...(selectedField.options ?? [])];
                                  newOpts[i] = { ...newOpts[i], label: e.target.value };
                                  updateField(selectedField.id, { options: newOpts });
                                }}
                                className="text-xs flex-1"
                              />
                              <button
                                onClick={() => {
                                  const newOpts = (selectedField.options ?? []).filter((_, j) => j !== i);
                                  updateField(selectedField.id, { options: newOpts });
                                }}
                                className="p-1 rounded hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 text-gray-400" />
                              </button>
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs gap-1"
                            onClick={() => {
                              const newOpts = [...(selectedField.options ?? []), { label: `Option ${(selectedField.options?.length ?? 0) + 1}`, value: `option_${Date.now()}` }];
                              updateField(selectedField.id, { options: newOpts });
                            }}
                          >
                            <Plus className="h-3 w-3" /> Add Option
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Validation */}
                    {FIELD_TYPES.find((ft) => ft.type === selectedField.type)?.hasValidation && (
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">Validation</label>
                        <div className="space-y-2">
                          {["text", "textarea", "rich_text"].includes(selectedField.type) && (
                            <>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="text-[10px] text-gray-400">Min Length</label>
                                  <Input
                                    type="number"
                                    value={selectedField.validation?.min_length ?? ""}
                                    onChange={(e) => updateField(selectedField.id, {
                                      validation: { ...selectedField.validation, min_length: e.target.value ? parseInt(e.target.value) : undefined },
                                    })}
                                    className="text-xs"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="text-[10px] text-gray-400">Max Length</label>
                                  <Input
                                    type="number"
                                    value={selectedField.validation?.max_length ?? ""}
                                    onChange={(e) => updateField(selectedField.id, {
                                      validation: { ...selectedField.validation, max_length: e.target.value ? parseInt(e.target.value) : undefined },
                                    })}
                                    className="text-xs"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          {["number", "rating", "scale"].includes(selectedField.type) && (
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-400">Min</label>
                                <Input
                                  type="number"
                                  value={selectedField.validation?.min ?? ""}
                                  onChange={(e) => updateField(selectedField.id, {
                                    validation: { ...selectedField.validation, min: e.target.value ? parseInt(e.target.value) : undefined },
                                  })}
                                  className="text-xs"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-400">Max</label>
                                <Input
                                  type="number"
                                  value={selectedField.validation?.max ?? ""}
                                  onChange={(e) => updateField(selectedField.id, {
                                    validation: { ...selectedField.validation, max: e.target.value ? parseInt(e.target.value) : undefined },
                                  })}
                                  className="text-xs"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Conditional logic */}
                    <div>
                      <label className="text-xs text-gray-500 block mb-1 flex items-center gap-1">
                        <Layers className="h-3 w-3" /> Conditional Logic
                      </label>
                      {selectedField.conditional_on ? (
                        <div className="bg-violet-50 rounded-lg p-2 text-xs space-y-1">
                          <p className="text-violet-700">
                            Show when <span className="font-mono font-bold">{selectedField.conditional_on.field}</span>
                            {" "}{selectedField.conditional_on.operator.replace(/_/g, " ")}
                            {" "}<span className="font-bold">{String(selectedField.conditional_on.value)}</span>
                          </p>
                          <button
                            className="text-[10px] text-red-500 hover:underline"
                            onClick={() => updateField(selectedField.id, { conditional_on: undefined })}
                          >
                            Remove condition
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No conditions set — field always visible</p>
                      )}
                    </div>

                    {/* Delete */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 hover:bg-red-50 gap-1.5"
                      onClick={() => removeField(selectedField.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove Field
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="sticky top-4">
                  <CardContent className="p-6 text-center">
                    <Settings className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Select a field to edit its properties</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <FormPreview fields={fields} title={formTitle} />
        )}
      </div>
    </PageShell>
  );
}

// ── Form preview ───────────────────────────────────────────────────────────

function FormPreview({ fields, title }: { fields: FormFieldDefinition[]; title: string }) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">Preview of how this form will appear to staff</p>
        </div>

        <div className="space-y-5">
          {fields.map((field) => {
            if (field.type === "section_header") {
              return (
                <div key={field.id} className="pt-4 pb-2 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-800">{field.label}</h3>
                </div>
              );
            }

            if (field.type === "info_block") {
              return (
                <div key={field.id} className="flex items-start gap-2 px-4 py-3 rounded-lg bg-blue-50 border border-blue-100">
                  <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">{field.label}</p>
                </div>
              );
            }

            return (
              <div
                key={field.id}
                className={cn("space-y-1.5", field.conditional_on && "ml-4 pl-4 border-l-2 border-violet-200")}
              >
                <label className="text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.help_text && (
                  <p className="text-xs text-gray-500">{field.help_text}</p>
                )}

                {/* Render preview input */}
                {["text", "number", "date", "time", "datetime"].includes(field.type) && (
                  <input
                    type={field.type === "datetime" ? "datetime-local" : field.type}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    disabled
                  />
                )}
                {["textarea", "rich_text"].includes(field.type) && (
                  <textarea
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
                    rows={3}
                    disabled
                  />
                )}
                {field.type === "select" && (
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" disabled>
                    <option>Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
                {field.type === "multi_select" && (
                  <div className="flex flex-wrap gap-1.5">
                    {field.options?.map((opt) => (
                      <span key={opt.value} className="px-2.5 py-1 text-xs border border-gray-300 rounded-full bg-white text-gray-600">
                        {opt.label}
                      </span>
                    ))}
                  </div>
                )}
                {field.type === "radio" && (
                  <div className="space-y-1.5">
                    {field.options?.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-600">
                        <input type="radio" disabled className="h-4 w-4" />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                )}
                {field.type === "checkbox" && (
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" disabled className="h-4 w-4" />
                    {field.label}
                  </label>
                )}
                {field.type === "toggle" && (
                  <div className="h-6 w-11 rounded-full bg-gray-300 relative">
                    <div className="h-5 w-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow" />
                  </div>
                )}
                {field.type === "file_upload" && (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Drop files here or click to upload</p>
                  </div>
                )}
                {field.type === "signature" && (
                  <div className="h-24 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                    <PenTool className="h-6 w-6 text-gray-300" />
                  </div>
                )}
                {field.type === "rating" && (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className="h-6 w-6 text-gray-300" />
                    ))}
                  </div>
                )}
                {field.type === "scale" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{field.validation?.min ?? 1}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full" />
                    <span className="text-xs text-gray-400">{field.validation?.max ?? 10}</span>
                  </div>
                )}
                {field.type === "staff_picker" && (
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" disabled>
                    <option>Select staff member...</option>
                  </select>
                )}
                {field.type === "child_picker" && (
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white" disabled>
                    <option>Select young person...</option>
                  </select>
                )}

                {field.conditional_on && (
                  <p className="text-[10px] text-violet-500 flex items-center gap-1">
                    <Layers className="h-3 w-3" /> Shown when {field.conditional_on.field} {field.conditional_on.operator.replace(/_/g, " ")} {String(field.conditional_on.value)}
                  </p>
                )}
              </div>
            );
          })}

          {/* Submit button preview */}
          <div className="pt-6 border-t border-gray-200 flex gap-3">
            <Button className="gap-1.5" disabled>
              <Save className="h-4 w-4" /> Save Draft
            </Button>
            <Button variant="outline" disabled>
              Submit for Review
            </Button>
          </div>
        </div>

        {/* Cara suggestion */}
        <div className="mt-6 flex items-start gap-2 px-4 py-3 rounded-lg bg-violet-50 border border-violet-100">
          <Sparkles className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-violet-700 font-medium">Cara Form Analysis</p>
            <p className="text-xs text-violet-600 mt-0.5">
              This form has {fields.filter((f) => f.required).length} required fields and {fields.filter((f) => f.conditional_on).length} conditional fields.
              {fields.filter((f) => f.type === "signature").length > 0 && " Signature capture enabled for evidence purposes."}
              {" "}Form structure follows CHR 2015 regulation requirements for incident documentation.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
