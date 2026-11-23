"use client";

import React, { useState, useEffect } from "react";
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Minus, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  TrendingDown, 
  ShieldAlert, 
  X, 
  Sparkles,
  ArrowUpDown
} from "lucide-react";
import { IngredientStock, fetchIngredients, adjustIngredientStock, fetchStockAlerts } from "@/lib/api/inventory";
import { ClickSpark } from "@/components/animations/ClickSpark";
import { ReactiveButton } from "@/components/animations/ReactiveButton";

export const InventoryHub: React.FC = () => {
  const [ingredients, setIngredients] = useState<IngredientStock[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"all" | "low" | "out">("all");
  
  // Stock Adjustment Modal state
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientStock | null>(null);
  const [adjDelta, setAdjDelta] = useState<string>("1.0");
  const [adjType, setAdjType] = useState<"intake" | "wastage" | "adjustment">("intake");
  const [adjReason, setAdjReason] = useState<string>("Fresh vendor delivery");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ingList, alertList] = await Promise.all([
        fetchIngredients().catch(() => []),
        fetchStockAlerts().catch(() => [])
      ]);
      setIngredients(ingList);
      setAlerts(alertList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleAdjustStock = async () => {
    if (!selectedIngredient) return;
    const numDelta = parseFloat(adjDelta);
    if (isNaN(numDelta) || numDelta === 0) return;

    try {
      setSubmitting(true);
      // For wastage, make delta negative if positive was entered
      const effectiveDelta = adjType === "wastage" ? -Math.abs(numDelta) : numDelta;

      await adjustIngredientStock(selectedIngredient.id, {
        quantity_delta: effectiveDelta,
        transaction_type: adjType,
        reason: adjReason,
      });

      showToast(`Stock updated for ${selectedIngredient.name}: ${effectiveDelta > 0 ? "+" : ""}${effectiveDelta} ${selectedIngredient.unit}`);
      setSelectedIngredient(null);
      setAdjDelta("1.0");
      await loadData();
    } catch (err: any) {
      showToast(err.message || "Failed to update stock");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered ingredients
  const filtered = ingredients.filter((ing) => {
    const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterMode === "low") return matchesSearch && ing.is_low_stock && ing.current_stock > 0;
    if (filterMode === "out") return matchesSearch && ing.current_stock <= 0;
    return matchesSearch;
  });

  const lowStockCount = ingredients.filter((i) => i.is_low_stock && i.current_stock > 0).length;
  const outOfStockCount = ingredients.filter((i) => i.current_stock <= 0).length;
  const totalValuation = ingredients.reduce((acc, i) => acc + i.current_stock * i.cost_per_unit, 0);

  return (
    <div className="flex-1 p-6 lg:p-10 bg-canvas space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="border-b border-border pb-4 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink tracking-tight flex items-center gap-2">
            <span>Raw Material &amp; Recipe Inventory</span>
            <span className="w-2.5 h-2.5 rounded-full bg-dietary-veg"></span>
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Automatic recipe consumption upon KOT firing, supplier purchase orders, and stock reorder controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-1.5 border border-border bg-canvas-card hover:bg-canvas-subtle text-xs font-mono text-ink flex items-center gap-2 rounded transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand ${loading ? "animate-spin" : ""}`} />
            <span>Sync Stock</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-canvas px-4 py-2.5 text-xs font-medium shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150 rounded">
          <CheckCircle2 className="w-4 h-4 text-dietary-veg" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-canvas-card border border-border p-5 space-y-1 rounded">
          <div className="text-xs font-mono text-ink-secondary uppercase">Tracked Items</div>
          <div className="text-2xl font-bold font-mono text-ink">{ingredients.length} Items</div>
          <div className="text-xs text-ink-secondary">Linked to dish recipes</div>
        </div>

        <div className="bg-canvas-card border border-border p-5 space-y-1 rounded">
          <div className="text-xs font-mono text-ink-secondary uppercase">Low Stock Warnings</div>
          <div className="text-2xl font-bold font-mono text-accent">{lowStockCount} Items</div>
          <div className="text-xs text-accent">Below safety threshold</div>
        </div>

        <div className="bg-canvas-card border border-border p-5 space-y-1 rounded">
          <div className="text-xs font-mono text-ink-secondary uppercase">Out of Stock</div>
          <div className="text-2xl font-bold font-mono text-dietary-nonveg">{outOfStockCount} Items</div>
          <div className="text-xs text-dietary-nonveg">Auto-marked 86'd on menu</div>
        </div>

        <div className="bg-canvas-card border border-border p-5 space-y-1 rounded">
          <div className="text-xs font-mono text-ink-secondary uppercase">Est. Stock Valuation</div>
          <div className="text-2xl font-bold font-mono text-ink">₹ {totalValuation.toFixed(2)}</div>
          <div className="text-xs text-dietary-veg font-medium">Weighted average cost</div>
        </div>
      </div>

      {/* Active Low Stock Alerts Banner */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="p-4 bg-accent/10 border border-accent/30 rounded flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-ink">
                Stock Warning: {lowStockCount + outOfStockCount} ingredients require procurement
              </h4>
              <p className="text-xs text-ink-secondary mt-0.5">
                Chotu Copilot identified depleted stock levels for core kitchen staples. Order from your registered vendors to avoid 86ing bestselling dishes.
              </p>
            </div>
          </div>
          <button
            onClick={() => showToast("Chotu dispatched reorder request to vendors via WhatsApp & Email.")}
            className="px-3.5 py-1.5 bg-accent text-white font-mono text-xs font-bold rounded shadow-xs hover:bg-accent/90 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Supplier POs</span>
          </button>
        </div>
      )}

      {/* Operational Filter and Search Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search raw ingredients (e.g. Chicken, Paneer, Flour)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-canvas border border-border pl-8 pr-3 py-1.5 text-xs text-ink placeholder-ink-faint focus:outline-none focus:border-ink-secondary transition-colors rounded"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              filterMode === "all"
                ? "bg-ink text-canvas font-bold"
                : "text-ink-secondary hover:text-ink bg-canvas-card border border-border"
            }`}
          >
            All Items ({ingredients.length})
          </button>
          <button
            onClick={() => setFilterMode("low")}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              filterMode === "low"
                ? "bg-accent text-white font-bold"
                : "text-accent bg-accent/10 border border-accent/20 hover:bg-accent/20"
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterMode("out")}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              filterMode === "out"
                ? "bg-dietary-nonveg text-white font-bold"
                : "text-dietary-nonveg bg-dietary-nonveg/10 border border-dietary-nonveg/20 hover:bg-dietary-nonveg/20"
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="bg-canvas-card border border-border rounded overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-canvas-subtle text-ink-secondary font-mono uppercase text-[11px]">
                <th className="py-3 px-4 font-semibold">Ingredient</th>
                <th className="py-3 px-4 font-semibold text-right">Current Stock</th>
                <th className="py-3 px-4 font-semibold text-right">Min Threshold</th>
                <th className="py-3 px-4 font-semibold text-right">Cost / Unit</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-ink-secondary font-mono">
                    No ingredients found.
                  </td>
                </tr>
              ) : (
                filtered.map((ing) => {
                  const isOut = ing.current_stock <= 0;
                  const isLow = ing.is_low_stock && !isOut;

                  return (
                    <tr key={ing.id} className="hover:bg-canvas-subtle/50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-ink flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-brand" />
                        <span>{ing.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-ink">
                        {Number(ing.current_stock).toFixed(3)} {ing.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-ink-secondary">
                        {Number(ing.min_reorder_level).toFixed(3)} {ing.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-ink">
                        ₹ {Number(ing.cost_per_unit).toFixed(2)} / {ing.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded ${
                            isOut
                              ? "bg-dietary-nonveg/15 text-dietary-nonveg border border-dietary-nonveg/30"
                              : isLow
                              ? "bg-accent/15 text-accent border border-accent/30"
                              : "bg-dietary-veg/15 text-dietary-veg border border-dietary-veg/30"
                          }`}
                        >
                          {ing.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <ClickSpark sparkColor="#D95D39" sparkCount={6} sparkRadius={14}>
                          <button
                            onClick={() => {
                              setSelectedIngredient(ing);
                              setAdjDelta("5.0");
                              setAdjType("intake");
                              setAdjReason("Fresh shipment receipt");
                            }}
                            className="px-2.5 py-1 border border-border hover:border-brand text-ink text-[11px] font-mono font-medium rounded hover:bg-canvas transition-all cursor-pointer"
                          >
                            Adjust Stock
                          </button>
                        </ClickSpark>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedIngredient && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-canvas-card border border-border w-full max-w-md rounded shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-brand" />
                <h3 className="font-bold text-sm text-ink">
                  Stock Adjustment: {selectedIngredient.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIngredient(null)}
                className="text-ink-secondary hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-canvas-subtle border border-border rounded text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-ink-secondary">Current Balance:</span>
                <span className="font-bold text-ink">
                  {Number(selectedIngredient.current_stock).toFixed(3)} {selectedIngredient.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Unit Valuation:</span>
                <span className="text-ink">₹ {Number(selectedIngredient.cost_per_unit).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-ink font-semibold mb-1">Adjustment Type</label>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjType("intake");
                      setAdjReason("Vendor shipment delivery");
                    }}
                    className={`py-1.5 px-2 rounded border text-center transition-all cursor-pointer ${
                      adjType === "intake"
                        ? "border-dietary-veg bg-dietary-veg/15 text-dietary-veg font-bold"
                        : "border-border text-ink-secondary hover:bg-canvas-subtle"
                    }`}
                  >
                    + Intake
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjType("wastage");
                      setAdjReason("Kitchen spoilage / wastage");
                    }}
                    className={`py-1.5 px-2 rounded border text-center transition-all cursor-pointer ${
                      adjType === "wastage"
                        ? "border-dietary-nonveg bg-dietary-nonveg/15 text-dietary-nonveg font-bold"
                        : "border-border text-ink-secondary hover:bg-canvas-subtle"
                    }`}
                  >
                    - Wastage
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjType("adjustment");
                      setAdjReason("Physical inventory reconciliation");
                    }}
                    className={`py-1.5 px-2 rounded border text-center transition-all cursor-pointer ${
                      adjType === "adjustment"
                        ? "border-brand bg-brand-faint text-brand font-bold"
                        : "border-border text-ink-secondary hover:bg-canvas-subtle"
                    }`}
                  >
                    Audit
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-ink font-semibold mb-1">
                  Quantity ({selectedIngredient.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={adjDelta}
                  onChange={(e) => setAdjDelta(e.target.value)}
                  className="w-full bg-canvas border border-border px-3 py-2 text-xs font-mono text-ink rounded focus:outline-none focus:border-brand"
                  placeholder="e.g. 5.0"
                />
              </div>

              <div>
                <label className="block text-ink font-semibold mb-1">Audit Reason / Memo</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full bg-canvas border border-border px-3 py-2 text-xs text-ink rounded focus:outline-none focus:border-brand"
                  placeholder="Reason for adjustment"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedIngredient(null)}
                className="px-3.5 py-1.5 text-xs text-ink-secondary hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <ReactiveButton
                variant="primary"
                size="sm"
                onClick={handleAdjustStock}
                disabled={submitting}
                className="px-4 py-1.5 text-xs font-bold"
              >
                {submitting ? "Saving..." : "Confirm Stock Delta"}
              </ReactiveButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
