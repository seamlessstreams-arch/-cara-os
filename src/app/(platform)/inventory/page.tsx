"use client";

import { useState, useMemo } from "react";
import {
  Package, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, Clock, Wrench,
  Tag, MapPin, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useInventoryItems, useCreateInventoryItem } from "@/hooks/use-inventory-items";
import type { InventoryItem, InventoryCategory, InventoryCondition, InventoryLocation } from "@/types/extended";
import { INVENTORY_CATEGORY_LABEL, INVENTORY_CONDITION_LABEL, INVENTORY_LOCATION_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── constants ─────────────────────────────────────────────────────────── */

const CATEGORIES: InventoryCategory[] = [
  "furniture", "electronics", "kitchen", "safety_equipment",
  "bedding_linen", "cleaning", "office", "outdoor", "medical", "other",
];

const CONDITIONS: InventoryCondition[] = ["new", "good", "fair", "poor", "condemned"];

const CONDITION_COLORS: Record<InventoryCondition, string> = {
  new: "bg-green-100 text-green-800", good: "bg-blue-100 text-blue-800",
  fair: "bg-yellow-100 text-yellow-800", poor: "bg-orange-100 text-orange-800",
  condemned: "bg-red-100 text-red-800",
};

const LOCATIONS: InventoryLocation[] = [
  "lounge", "kitchen", "office", "bedroom_1", "bedroom_2", "bedroom_3",
  "bathroom", "garden", "utility", "hallway", "storage",
];

/* ── component ───────────────────────────────────────────────────────── */
export default function InventoryPage() {
  const { data: res, isLoading } = useInventoryItems();
  const items: InventoryItem[] = res?.data ?? [];
  const createItem = useCreateInventoryItem();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterCondition, setFilterCondition] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  /* form fields */
  const [fName, setFName] = useState("");
  const [fCategory, setFCategory] = useState<InventoryCategory>("furniture");
  const [fLocation, setFLocation] = useState<InventoryLocation>("lounge");
  const [fCondition, setFCondition] = useState<InventoryCondition>("new");
  const [fQuantity, setFQuantity] = useState("1");
  const [fCost, setFCost] = useState("");
  const [fSupplier, setFSupplier] = useState("");
  const [fSerial, setFSerial] = useState("");
  const [fNotes, setFNotes] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let list = [...items];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.supplier.toLowerCase().includes(q) ||
          (i.serial_number && i.serial_number.toLowerCase().includes(q))
      );
    }
    if (filterCategory !== "all") list = list.filter((i) => i.category === filterCategory);
    if (filterCondition !== "all") list = list.filter((i) => i.condition === filterCondition);
    if (filterLocation !== "all") list = list.filter((i) => i.location === filterLocation);

    list.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "category": return a.category.localeCompare(b.category);
        case "condition": return CONDITIONS.indexOf(a.condition) - CONDITIONS.indexOf(b.condition);
        case "cost": return b.purchase_cost - a.purchase_cost;
        case "lastChecked": return b.last_checked.localeCompare(a.last_checked);
        default: return 0;
      }
    });
    return list;
  }, [items, search, filterCategory, filterCondition, filterLocation, sortBy]);

  /* stats */
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalValue = items.reduce((s, i) => s + i.purchase_cost * i.quantity, 0);
  const poorOrCondemned = items.filter((i) => i.condition === "poor" || i.condition === "condemned").length;
  const patOverdue = items.filter((i) => i.pat_test_due && i.pat_test_due < today).length;

  const exportCols: ExportColumn<InventoryItem>[] = [
    { header: "ID", accessor: (r: InventoryItem) => r.id },
    { header: "Name", accessor: (r: InventoryItem) => r.name },
    { header: "Category", accessor: (r: InventoryItem) => INVENTORY_CATEGORY_LABEL[r.category] },
    { header: "Location", accessor: (r: InventoryItem) => INVENTORY_LOCATION_LABEL[r.location] },
    { header: "Condition", accessor: (r: InventoryItem) => INVENTORY_CONDITION_LABEL[r.condition] },
    { header: "Quantity", accessor: (r: InventoryItem) => r.quantity },
    { header: "Purchase Date", accessor: (r: InventoryItem) => r.purchase_date },
    { header: "Cost (£)", accessor: (r: InventoryItem) => r.purchase_cost.toFixed(2) },
    { header: "Supplier", accessor: (r: InventoryItem) => r.supplier },
    { header: "Warranty Expiry", accessor: (r: InventoryItem) => r.warranty_expiry ?? "N/A" },
    { header: "PAT Test Due", accessor: (r: InventoryItem) => r.pat_test_due ?? "N/A" },
    { header: "Last Checked", accessor: (r: InventoryItem) => r.last_checked },
    { header: "Checked By", accessor: (r: InventoryItem) => getStaffName(r.checked_by) },
    { header: "Serial No.", accessor: (r: InventoryItem) => r.serial_number ?? "" },
    { header: "Notes", accessor: (r: InventoryItem) => r.notes },
  ];

  const handleSave = () => {
    if (!fName.trim()) return;
    createItem.mutate({
      name: fName.trim(),
      category: fCategory,
      location: fLocation,
      condition: fCondition,
      quantity: parseInt(fQuantity) || 1,
      purchase_date: today,
      purchase_cost: parseFloat(fCost) || 0,
      supplier: fSupplier.trim(),
      warranty_expiry: null,
      pat_test_due: null,
      last_checked: today,
      checked_by: "staff_darren",
      serial_number: fSerial.trim() || null,
      notes: fNotes.trim(),
    });
    setShowNew(false);
    setFName(""); setFCategory("furniture"); setFLocation("lounge");
    setFCondition("new"); setFQuantity("1"); setFCost(""); setFSupplier("");
    setFSerial(""); setFNotes("");
  };

  if (isLoading) return <PageShell title="Inventory & Assets" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Inventory & Assets"
      subtitle="Track all property, equipment, and supplies across the home"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Inventory & Assets" />
          <ExportButton data={filtered} columns={exportCols} filename="inventory" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Items", value: totalItems, icon: Package, colour: "text-blue-600" },
            { label: "Est. Value", value: `£${totalValue.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`, icon: Tag, colour: "text-emerald-600" },
            { label: "Poor / Condemned", value: poorOrCondemned, icon: AlertTriangle, colour: poorOrCondemned > 0 ? "text-red-600" : "text-slate-400" },
            { label: "PAT Overdue", value: patOverdue, icon: Clock, colour: patOverdue > 0 ? "text-orange-600" : "text-slate-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── alerts ────────────────────────────────────────────── */}
        {(poorOrCondemned > 0 || patOverdue > 0) && (
          <div className="rounded-lg border-l-4 border-orange-400 bg-orange-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                {poorOrCondemned > 0 && (
                  <p><strong>{poorOrCondemned}</strong> item(s) in poor/condemned condition — review for replacement.</p>
                )}
                {patOverdue > 0 && (
                  <p><strong>{patOverdue}</strong> item(s) with overdue PAT testing — arrange inspection.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items, suppliers, serial numbers…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{INVENTORY_CATEGORY_LABEL[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterCondition} onValueChange={setFilterCondition}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              {CONDITIONS.map((c) => (
                <SelectItem key={c} value={c}>{INVENTORY_CONDITION_LABEL[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>{INVENTORY_LOCATION_LABEL[l]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="condition">Condition</SelectItem>
                <SelectItem value="cost">Cost (High→Low)</SelectItem>
                <SelectItem value="lastChecked">Last Checked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No items match your filters.</div>
          )}
          {filtered.map((item) => {
            const isExpanded = expanded === item.id;
            const warrantyExpired = item.warranty_expiry && item.warranty_expiry < today;
            const patDue = item.pat_test_due && item.pat_test_due < today;

            return (
              <div key={item.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : item.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Package className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {INVENTORY_LOCATION_LABEL[item.location]}
                        <span>·</span>
                        <span>Qty: {item.quantity}</span>
                        <span>·</span>
                        <span>£{item.purchase_cost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {patDue && <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">PAT Overdue</Badge>}
                    <Badge className={cn("text-xs", CONDITION_COLORS[item.condition])}>
                      {INVENTORY_CONDITION_LABEL[item.condition]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{INVENTORY_CATEGORY_LABEL[item.category]}</Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Supplier:</span> <span className="font-medium">{item.supplier}</span></div>
                      <div><span className="text-muted-foreground">Purchased:</span> <span className="font-medium">{item.purchase_date}</span></div>
                      <div><span className="text-muted-foreground">Last Checked:</span> <span className="font-medium">{item.last_checked}</span></div>
                      <div><span className="text-muted-foreground">Checked By:</span> <span className="font-medium">{getStaffName(item.checked_by)}</span></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Serial No.:</span>{" "}
                        <span className="font-medium">{item.serial_number ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Warranty:</span>{" "}
                        <span className={cn("font-medium", warrantyExpired && "text-red-600")}>
                          {item.warranty_expiry ? `${item.warranty_expiry}${warrantyExpired ? " (Expired)" : ""}` : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">PAT Test Due:</span>{" "}
                        <span className={cn("font-medium", patDue && "text-orange-600")}>
                          {item.pat_test_due ? `${item.pat_test_due}${patDue ? " (Overdue)" : ""}` : "N/A"}
                        </span>
                      </div>
                    </div>
                    {item.notes && (
                      <div className="rounded-lg bg-white border p-3 text-sm">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                        <p>{item.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Asset Management:</strong> All electrical items must have current PAT testing.
          Safety equipment must be checked per manufacturer guidelines. Condemned items should be
          disposed of safely and recorded. Reg 44 visitors may inspect asset registers.
        </div>
      </div>

      {/* ── new item dialog ─────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Item Name *</Label>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="e.g. Dining Table" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <Select value={fCategory} onValueChange={(v) => setFCategory(v as InventoryCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{INVENTORY_CATEGORY_LABEL[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Location</Label>
                <Select value={fLocation} onValueChange={(v) => setFLocation(v as InventoryLocation)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((l) => (
                      <SelectItem key={l} value={l}>{INVENTORY_LOCATION_LABEL[l]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <Label>Condition</Label>
                <Select value={fCondition} onValueChange={(v) => setFCondition(v as InventoryCondition)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>{INVENTORY_CONDITION_LABEL[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Quantity</Label>
                <Input type="number" min={1} value={fQuantity} onChange={(e) => setFQuantity(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Cost (£)</Label>
                <Input type="number" step="0.01" value={fCost} onChange={(e) => setFCost(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Supplier</Label>
                <Input value={fSupplier} onChange={(e) => setFSupplier(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Serial Number</Label>
                <Input value={fSerial} onChange={(e) => setFSerial(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!fName.trim()}>Save Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
