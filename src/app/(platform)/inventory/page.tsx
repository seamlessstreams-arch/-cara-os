"use client";

import { useState, useMemo } from "react";
import {
  Package, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, Clock, Wrench,
  Tag, MapPin, ChevronDown, ChevronUp,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
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

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const CATEGORIES = [
  "furniture", "electronics", "kitchen", "safety_equipment",
  "bedding_linen", "cleaning", "office", "outdoor", "medical", "other",
] as const;
type Category = typeof CATEGORIES[number];
const CATEGORY_LABELS: Record<Category, string> = {
  furniture: "Furniture", electronics: "Electronics", kitchen: "Kitchen",
  safety_equipment: "Safety Equipment", bedding_linen: "Bedding & Linen",
  cleaning: "Cleaning", office: "Office", outdoor: "Outdoor",
  medical: "Medical", other: "Other",
};

const CONDITIONS = ["new", "good", "fair", "poor", "condemned"] as const;
type Condition = typeof CONDITIONS[number];
const CONDITION_COLORS: Record<Condition, string> = {
  new: "bg-green-100 text-green-800", good: "bg-blue-100 text-blue-800",
  fair: "bg-yellow-100 text-yellow-800", poor: "bg-orange-100 text-orange-800",
  condemned: "bg-red-100 text-red-800",
};

const LOCATIONS = [
  "lounge", "kitchen", "office", "bedroom_1", "bedroom_2", "bedroom_3",
  "bathroom", "garden", "utility", "hallway", "storage",
] as const;
type Location = typeof LOCATIONS[number];
const LOCATION_LABELS: Record<Location, string> = {
  lounge: "Lounge", kitchen: "Kitchen", office: "Office",
  bedroom_1: "Bedroom 1", bedroom_2: "Bedroom 2", bedroom_3: "Bedroom 3",
  bathroom: "Bathroom", garden: "Garden", utility: "Utility Room",
  hallway: "Hallway", storage: "Storage",
};

interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  location: Location;
  condition: Condition;
  quantity: number;
  purchaseDate: string;
  purchaseCost: number;
  supplier: string;
  warrantyExpiry: string | null;
  patTestDue: string | null;
  lastChecked: string;
  checkedBy: string;
  serialNumber: string | null;
  notes: string;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: InventoryItem[] = [
  {
    id: "inv_1", name: "Samsung 55\" Smart TV", category: "electronics",
    location: "lounge", condition: "good", quantity: 1,
    purchaseDate: d(-365), purchaseCost: 449.99, supplier: "Currys",
    warrantyExpiry: d(0), patTestDue: d(30), lastChecked: d(-14),
    checkedBy: "staff_darren", serialNumber: "SN-TV-2025-001",
    notes: "Wall-mounted. Remote stored in office lockbox.",
  },
  {
    id: "inv_2", name: "Fire Extinguisher (CO2)", category: "safety_equipment",
    location: "hallway", condition: "good", quantity: 3,
    purchaseDate: d(-180), purchaseCost: 89.99, supplier: "SafetyFirst Ltd",
    warrantyExpiry: null, patTestDue: null, lastChecked: d(-7),
    checkedBy: "staff_ryan", serialNumber: null,
    notes: "Annual service due June. One each: hallway, kitchen, office.",
  },
  {
    id: "inv_3", name: "Single Divan Bed", category: "furniture",
    location: "bedroom_1", condition: "fair", quantity: 1,
    purchaseDate: d(-730), purchaseCost: 299.00, supplier: "Dreams",
    warrantyExpiry: d(-365), patTestDue: null, lastChecked: d(-30),
    checkedBy: "staff_anna", serialNumber: null,
    notes: "Mattress protector replaced Oct 2025. Frame slightly scuffed.",
  },
  {
    id: "inv_4", name: "Microwave (800W)", category: "kitchen",
    location: "kitchen", condition: "good", quantity: 1,
    purchaseDate: d(-200), purchaseCost: 79.99, supplier: "Argos",
    warrantyExpiry: d(165), patTestDue: d(60), lastChecked: d(-21),
    checkedBy: "staff_edward", serialNumber: "MW-ARG-4421",
    notes: "Young people can use with supervision only.",
  },
  {
    id: "inv_5", name: "Duvet Set (Single)", category: "bedding_linen",
    location: "storage", condition: "new", quantity: 6,
    purchaseDate: d(-30), purchaseCost: 24.99, supplier: "Dunelm",
    warrantyExpiry: null, patTestDue: null, lastChecked: d(-30),
    checkedBy: "staff_chervelle", serialNumber: null,
    notes: "Hypoallergenic. 3 blue, 2 grey, 1 white.",
  },
  {
    id: "inv_6", name: "Office Desktop PC", category: "office",
    location: "office", condition: "good", quantity: 2,
    purchaseDate: d(-500), purchaseCost: 649.00, supplier: "Dell Direct",
    warrantyExpiry: d(-135), patTestDue: d(45), lastChecked: d(-10),
    checkedBy: "staff_darren", serialNumber: "DELL-OPT-7090-A",
    notes: "Staff only. Password-protected. Encrypted drives.",
  },
  {
    id: "inv_7", name: "First Aid Kit", category: "medical",
    location: "office", condition: "good", quantity: 2,
    purchaseDate: d(-90), purchaseCost: 34.99, supplier: "St John Ambulance",
    warrantyExpiry: null, patTestDue: null, lastChecked: d(-3),
    checkedBy: "staff_mirela", serialNumber: null,
    notes: "Contents checked weekly. Replacement items on order.",
  },
  {
    id: "inv_8", name: "Garden Furniture Set", category: "outdoor",
    location: "garden", condition: "fair", quantity: 1,
    purchaseDate: d(-600), purchaseCost: 189.00, supplier: "B&Q",
    warrantyExpiry: null, patTestDue: null, lastChecked: d(-14),
    checkedBy: "staff_lackson", serialNumber: null,
    notes: "Table + 4 chairs. Parasol damaged — replacement needed.",
  },
  {
    id: "inv_9", name: "Smoke Detector (Mains)", category: "safety_equipment",
    location: "hallway", condition: "good", quantity: 6,
    purchaseDate: d(-120), purchaseCost: 22.99, supplier: "Screwfix",
    warrantyExpiry: d(1340), patTestDue: null, lastChecked: d(-7),
    checkedBy: "staff_ryan", serialNumber: null,
    notes: "One per room + hallway. Tested weekly during fire drill checks.",
  },
  {
    id: "inv_10", name: "Hoover Upright Vacuum", category: "cleaning",
    location: "utility", condition: "poor", quantity: 1,
    purchaseDate: d(-400), purchaseCost: 149.99, supplier: "Currys",
    warrantyExpiry: d(-35), patTestDue: d(-10), lastChecked: d(-5),
    checkedBy: "staff_diane", serialNumber: "HVR-300-X",
    notes: "Suction reduced. Replacement requested — awaiting approval.",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterCondition, setFilterCondition] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  /* form fields */
  const [fName, setFName] = useState("");
  const [fCategory, setFCategory] = useState<Category>("furniture");
  const [fLocation, setFLocation] = useState<Location>("lounge");
  const [fCondition, setFCondition] = useState<Condition>("new");
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
          (i.serialNumber && i.serialNumber.toLowerCase().includes(q))
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
        case "cost": return b.purchaseCost - a.purchaseCost;
        case "lastChecked": return b.lastChecked.localeCompare(a.lastChecked);
        default: return 0;
      }
    });
    return list;
  }, [items, search, filterCategory, filterCondition, filterLocation, sortBy]);

  /* stats */
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalValue = items.reduce((s, i) => s + i.purchaseCost * i.quantity, 0);
  const poorOrCondemned = items.filter((i) => i.condition === "poor" || i.condition === "condemned").length;
  const patOverdue = items.filter((i) => i.patTestDue && i.patTestDue < today).length;

  const exportCols: ExportColumn<InventoryItem>[] = [
    { header: "ID", accessor: (r: InventoryItem) => r.id },
    { header: "Name", accessor: (r: InventoryItem) => r.name },
    { header: "Category", accessor: (r: InventoryItem) => CATEGORY_LABELS[r.category] },
    { header: "Location", accessor: (r: InventoryItem) => LOCATION_LABELS[r.location] },
    { header: "Condition", accessor: (r: InventoryItem) => r.condition },
    { header: "Quantity", accessor: (r: InventoryItem) => r.quantity },
    { header: "Purchase Date", accessor: (r: InventoryItem) => r.purchaseDate },
    { header: "Cost (£)", accessor: (r: InventoryItem) => r.purchaseCost.toFixed(2) },
    { header: "Supplier", accessor: (r: InventoryItem) => r.supplier },
    { header: "Warranty Expiry", accessor: (r: InventoryItem) => r.warrantyExpiry ?? "N/A" },
    { header: "PAT Test Due", accessor: (r: InventoryItem) => r.patTestDue ?? "N/A" },
    { header: "Last Checked", accessor: (r: InventoryItem) => r.lastChecked },
    { header: "Checked By", accessor: (r: InventoryItem) => getStaffName(r.checkedBy) },
    { header: "Serial No.", accessor: (r: InventoryItem) => r.serialNumber ?? "" },
    { header: "Notes", accessor: (r: InventoryItem) => r.notes },
  ];

  const handleSave = () => {
    if (!fName.trim()) return;
    const item: InventoryItem = {
      id: `inv_${Date.now()}`,
      name: fName.trim(),
      category: fCategory,
      location: fLocation,
      condition: fCondition,
      quantity: parseInt(fQuantity) || 1,
      purchaseDate: today,
      purchaseCost: parseFloat(fCost) || 0,
      supplier: fSupplier.trim(),
      warrantyExpiry: null,
      patTestDue: null,
      lastChecked: today,
      checkedBy: "staff_darren",
      serialNumber: fSerial.trim() || null,
      notes: fNotes.trim(),
    };
    setItems((prev) => [item, ...prev]);
    setShowNew(false);
    setFName(""); setFCategory("furniture"); setFLocation("lounge");
    setFCondition("new"); setFQuantity("1"); setFCost(""); setFSupplier("");
    setFSerial(""); setFNotes("");
  };

  return (
    <PageShell
      title="Inventory & Assets"
      subtitle="Track all property, equipment, and supplies across the home"
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
                  <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterCondition} onValueChange={setFilterCondition}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              {CONDITIONS.map((c) => (
                <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>{LOCATION_LABELS[l]}</SelectItem>
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
            const warrantyExpired = item.warrantyExpiry && item.warrantyExpiry < today;
            const patDue = item.patTestDue && item.patTestDue < today;

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
                        {LOCATION_LABELS[item.location]}
                        <span>·</span>
                        <span>Qty: {item.quantity}</span>
                        <span>·</span>
                        <span>£{item.purchaseCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {patDue && <Badge variant="outline" className="bg-orange-100 text-orange-800 text-xs">PAT Overdue</Badge>}
                    <Badge className={cn("text-xs", CONDITION_COLORS[item.condition])}>
                      {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[item.category]}</Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Supplier:</span> <span className="font-medium">{item.supplier}</span></div>
                      <div><span className="text-muted-foreground">Purchased:</span> <span className="font-medium">{item.purchaseDate}</span></div>
                      <div><span className="text-muted-foreground">Last Checked:</span> <span className="font-medium">{item.lastChecked}</span></div>
                      <div><span className="text-muted-foreground">Checked By:</span> <span className="font-medium">{getStaffName(item.checkedBy)}</span></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Serial No.:</span>{" "}
                        <span className="font-medium">{item.serialNumber ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Warranty:</span>{" "}
                        <span className={cn("font-medium", warrantyExpired && "text-red-600")}>
                          {item.warrantyExpiry ? `${item.warrantyExpiry}${warrantyExpired ? " (Expired)" : ""}` : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">PAT Test Due:</span>{" "}
                        <span className={cn("font-medium", patDue && "text-orange-600")}>
                          {item.patTestDue ? `${item.patTestDue}${patDue ? " (Overdue)" : ""}` : "N/A"}
                        </span>
                      </div>
                    </div>
                    {item.notes && (
                      <div className="rounded-lg bg-white border p-3 text-sm">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                        <p>{item.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setItems((prev) =>
                            prev.map((i) =>
                              i.id === item.id ? { ...i, lastChecked: today, checkedBy: "staff_darren" } : i
                            )
                          );
                        }}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Checked
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const next = CONDITIONS[Math.min(CONDITIONS.indexOf(item.condition) + 1, CONDITIONS.length - 1)];
                          setItems((prev) =>
                            prev.map((i) =>
                              i.id === item.id ? { ...i, condition: next } : i
                            )
                          );
                        }}
                      >
                        <Wrench className="h-3 w-3 mr-1" /> Downgrade Condition
                      </Button>
                    </div>
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
                <Select value={fCategory} onValueChange={(v) => setFCategory(v as Category)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Location</Label>
                <Select value={fLocation} onValueChange={(v) => setFLocation(v as Location)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((l) => (
                      <SelectItem key={l} value={l}>{LOCATION_LABELS[l]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <Label>Condition</Label>
                <Select value={fCondition} onValueChange={(v) => setFCondition(v as Condition)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
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
    </PageShell>
  );
}
