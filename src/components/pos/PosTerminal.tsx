"use client";

import React, { useState } from "react";
import { Table, MenuItem, OrderItem } from "@/types/restaurant";
import { MENU_ITEMS } from "@/data/mockData";
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  Send, 
  CreditCard,
  ChevronDown
} from "lucide-react";
import { ReactiveButton } from "@/components/animations/ReactiveButton";
import { ClickSpark } from "@/components/animations/ClickSpark";

interface PosTerminalProps {
  tables: Table[];
  selectedTableId: string;
  onSelectTable: (id: string) => void;
  ledgerItems: OrderItem[];
  onAddDish: (dish: MenuItem) => void;
  onChangeQty: (dishId: string, delta: number) => void;
  onRemoveItem: (dishId: string) => void;
  onTransmitKot: () => void;
  onSendWhatsApp: () => void;
  onSettleBill: () => void;
  dishes?: MenuItem[];
}

export const PosTerminal: React.FC<PosTerminalProps> = ({
  tables,
  selectedTableId,
  onSelectTable,
  ledgerItems,
  onAddDish,
  onChangeQty,
  onRemoveItem,
  onTransmitKot,
  onSendWhatsApp,
  onSettleBill,
  dishes,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "veg" | "nonveg">("all");
  const [showTablePicker, setShowTablePicker] = useState<boolean>(false);

  const selectedTable = tables.find((t) => t.id === selectedTableId) || tables[0];

  // Bill calculations
  const subtotal = ledgerItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const gst = subtotal * 0.05; // 2.5% CGST + 2.5% SGST
  const serviceCharge = subtotal * 0.05;
  const grandTotal = subtotal + gst + serviceCharge;

  // Live menu items from PostgreSQL or fallback to initial catalog
  const availableDishes = dishes && dishes.length > 0 ? dishes : MENU_ITEMS;

  // Filtered menu items
  const filteredDishes = availableDishes.filter((dish) => {
    const matchesCat = selectedCategory === "all" || dish.category === selectedCategory;
    const matchesDietary = dietaryFilter === "all" || dish.dietary === dietaryFilter;
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesDietary && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col bg-canvas">
      
      {/* Calm Operational Bar: Table Selector & Clean Filter */}
      <div className="border-b border-border bg-canvas-card px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Table Selector Dropdown / Pill with Golden Amber Badge */}
        <div className="relative">
          <button
            onClick={() => setShowTablePicker(!showTablePicker)}
            className="flex items-center gap-2.5 px-3 py-1.5 border border-border hover:border-brand bg-canvas text-xs font-mono transition-colors"
          >
            <span className="px-1.5 py-0.5 bg-badge text-ink text-[10px] font-bold uppercase tracking-tight">
              {selectedTable.label}
            </span>
            <span className="font-bold text-ink">Active Table</span>
            <span className="text-ink-secondary text-[11px]">({selectedTable.capacity} Seats • {selectedTable.status.toUpperCase()})</span>
            <ChevronDown className="w-3.5 h-3.5 text-ink-secondary" />
          </button>

          {/* Table Picker Popup */}
          {showTablePicker && (
            <div className="absolute left-0 top-full mt-1.5 z-40 bg-canvas-card border border-border shadow-xl p-3 w-72 grid grid-cols-2 gap-2 text-xs font-mono">
              {tables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onSelectTable(t.id);
                    setShowTablePicker(false);
                  }}
                  className={`p-2 border text-left transition-colors ${
                    t.id === selectedTableId
                      ? "border-brand bg-brand-faint text-brand font-bold"
                      : "border-border hover:bg-canvas-subtle text-ink"
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{t.label}</span>
                    <span className="w-2 h-2 rounded-full bg-badge"></span>
                  </div>
                  <div className="text-[10px] text-ink-secondary">
                    {t.capacity}P • {t.status}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dishes or ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-canvas border border-border pl-8 pr-3 py-1.5 text-xs text-ink placeholder-ink-faint focus:outline-none focus:border-ink-secondary transition-colors"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          {["all", "mains", "breads", "starters", "desserts", "beverages"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 capitalize transition-colors ${
                selectedCategory === cat
                  ? "bg-ink text-canvas font-medium"
                  : "text-ink-secondary hover:text-ink hover:bg-canvas-subtle"
              }`}
            >
              {cat}
            </button>
          ))}
          <div className="h-4 w-[1px] bg-border mx-1"></div>
          <button
            onClick={() => setDietaryFilter(dietaryFilter === "veg" ? "all" : "veg")}
            className={`px-2 py-1 text-[11px] font-mono transition-colors ${
              dietaryFilter === "veg"
                ? "bg-dietary-veg text-white font-bold"
                : "text-ink-secondary hover:text-dietary-veg"
            }`}
          >
            Veg
          </button>
          <button
            onClick={() => setDietaryFilter(dietaryFilter === "nonveg" ? "all" : "nonveg")}
            className={`px-2 py-1 text-[11px] font-mono transition-colors ${
              dietaryFilter === "nonveg"
                ? "bg-dietary-nonveg text-white font-bold"
                : "text-ink-secondary hover:text-dietary-nonveg"
            }`}
          >
            Non-Veg
          </button>
        </div>

      </div>

      {/* Main Workspace: 2-Column Breathing Layout (Menu on Left, Order on Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        
        {/* Left Column: Menu Item Cards (8 cols) */}
        <div className="lg:col-span-8 p-4 lg:p-6 overflow-y-auto border-r border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredDishes.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-xs text-ink-secondary font-mono">
                No items match your search.
              </div>
            ) : (
              filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="bg-canvas-card border border-border p-4 hover:border-ink-secondary hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Minimalist dot indicator */}
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dish.dietary === "veg" ? "bg-dietary-veg" : "bg-dietary-nonveg"
                          }`}
                        ></span>
                        <h4 className="font-semibold text-sm text-ink">{dish.name}</h4>
                      </div>
                      <span className="font-mono text-sm font-bold text-ink">
                        ₹ {dish.price.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs text-ink-secondary leading-relaxed pt-0.5 line-clamp-2">
                      {dish.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-border-subtle flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono uppercase text-ink-faint">
                        {dish.category}
                      </span>
                      {dish.category === "mains" && (
                        <span className="px-1.5 py-0.2 bg-badge text-ink text-[9px] font-bold uppercase tracking-tight">
                          POPULAR
                        </span>
                      )}
                    </div>

                    <ClickSpark sparkColor="#D95D39" sparkRadius={18} sparkCount={6}>
                      <button
                        onClick={() => onAddDish(dish)}
                        className="btn-reactive px-3.5 py-1 bg-brand hover:bg-brand-hover text-white text-xs font-semibold active:scale-90 transition-all flex items-center gap-1 shadow-sm hover:shadow-md rounded-sm"
                      >
                        <Plus className="w-3 h-3 text-white" />
                        <span>Add</span>
                      </button>
                    </ClickSpark>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Live Table Ledger & Billing (4 cols) */}
        <div className="lg:col-span-4 bg-canvas-card flex flex-col justify-between">
          
          {/* Order Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-ink font-mono">{selectedTable.label} Order Summary</h3>
              <p className="text-xs text-ink-secondary">Captain: {selectedTable.captainName || "Staff"}</p>
            </div>
            <span className="px-2 py-0.5 bg-canvas-subtle border border-border text-[11px] font-mono text-ink-secondary">
              {ledgerItems.reduce((a, b) => a + b.quantity, 0)} Items
            </span>
          </div>

          {/* Ledger Items List */}
          <div className="p-4 flex-1 overflow-y-auto divide-y divide-border-subtle">
            {ledgerItems.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-ink-faint">
                No items added yet. Click "+ Add" on any dish to begin.
              </div>
            ) : (
              ledgerItems.map((item) => (
                <div key={item.dishId} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5 pr-2">
                    <div className="font-medium text-ink flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.dietary === "veg" ? "bg-dietary-veg" : "bg-dietary-nonveg"
                        }`}
                      ></span>
                      <span>{item.name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-ink-faint">
                      ₹ {item.price.toFixed(2)} each
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-border bg-canvas">
                      <button
                        onClick={() => onChangeQty(item.dishId, -1)}
                        className="px-1.5 py-0.5 text-ink-secondary hover:text-ink transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-mono text-xs font-bold text-ink">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onChangeQty(item.dishId, 1)}
                        className="px-1.5 py-0.5 text-ink-secondary hover:text-ink transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-mono text-xs font-bold text-ink min-w-[60px] text-right">
                      ₹ {(item.price * item.quantity).toFixed(2)}
                    </span>

                    <button
                      onClick={() => onRemoveItem(item.dishId)}
                      className="text-ink-faint hover:text-dietary-nonveg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Settlement Details */}
          <div className="p-4 border-t border-border bg-canvas-subtle space-y-3">
            <div className="space-y-1 text-xs font-mono text-ink-secondary">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-ink">₹ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (2.5%) + SGST (2.5%)</span>
                <span className="text-ink">₹ {gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge (5%)</span>
                <span className="text-ink">₹ {serviceCharge.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-baseline justify-between font-mono">
              <span className="text-xs uppercase tracking-wider font-bold text-ink">Total Payable</span>
              <span className="text-lg font-bold text-ink">₹ {grandTotal.toFixed(2)}</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <ReactiveButton
                variant="primary"
                size="md"
                onClick={onTransmitKot}
                leftIcon={<Printer className="w-3.5 h-3.5 text-white" />}
                className="w-full"
              >
                Fire KOT
              </ReactiveButton>

              <ReactiveButton
                variant="outline"
                size="md"
                onClick={onSendWhatsApp}
                leftIcon={<Send className="w-3.5 h-3.5 text-brand" />}
                className="w-full"
              >
                WhatsApp Bill
              </ReactiveButton>
            </div>

            <ReactiveButton
              variant="primary"
              size="md"
              onClick={onSettleBill}
              leftIcon={<CreditCard className="w-4 h-4 text-white" />}
              className="w-full text-xs uppercase tracking-wider py-3 shadow-md"
            >
              Settle Payment
            </ReactiveButton>
          </div>

        </div>

      </div>
    </div>
  );
};
