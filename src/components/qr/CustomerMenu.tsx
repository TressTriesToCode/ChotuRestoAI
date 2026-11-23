"use client";

import React, { useState, useEffect } from "react";
import { MenuItem } from "@/types/restaurant";
import { MENU_ITEMS } from "@/data/mockData";
import { Plus, Check, ArrowRight, Smartphone } from "lucide-react";
import { ClickSpark } from "@/components/animations/ClickSpark";
import { ReactiveButton } from "@/components/animations/ReactiveButton";
import { submitQROrder, fetchQRMenu } from "@/lib/api/qr";
import { mapBackendMenuItem } from "@/lib/api/menu";

interface CustomerMenuProps {
  token?: string;
  tableLabel?: string;
  onOrderCreated?: () => void;
}

export const CustomerMenu: React.FC<CustomerMenuProps> = ({
  token = "qr-t04-demo",
  tableLabel = "Table 04",
  onOrderCreated,
}) => {
  const [dietary, setDietary] = useState<"all" | "veg" | "nonveg">("all");
  const [dishes, setDishes] = useState<MenuItem[]>(MENU_ITEMS);
  const [cart, setCart] = useState<{ dish: MenuItem; qty: number }[]>([]);
  const [orderPlaced, setOrderPlaced] = useState<boolean>(false);
  const [confirmedToken, setConfirmedToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function loadMenu() {
      try {
        const data = await fetchQRMenu(token);
        if (data && data.items && data.items.length > 0) {
          setDishes(data.items.map(mapBackendMenuItem));
        }
      } catch (err) {
        console.warn("Using fallback menu for QR:", err);
      }
    }
    loadMenu();
  }, [token]);

  const addItem = (dish: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.dish.id === dish.id);
      if (existing) {
        return prev.map((i) => (i.dish.id === dish.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { dish, qty: 1 }];
    });
  };

  const totalItems = cart.reduce((a, b) => a + b.qty, 0);
  const subtotal = cart.reduce((a, b) => a + b.dish.price * b.qty, 0);
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;

  const filteredDishes = dishes.filter((dish) => {
    if (dietary === "all") return true;
    return dish.dietary === dietary;
  });

  const handlePlaceQROrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const res = await submitQROrder(token, {
        customer_name: "Guest (Table QR)",
        items: cart.map((c) => ({
          dish_id: c.dish.id,
          name: c.dish.name,
          price: c.dish.price,
          quantity: c.qty,
          dietary: c.dish.dietary,
          station: c.dish.station,
        })),
        captain_notes: `Table self-order via smartphone QR`,
      });
      setOrderPlaced(true);
      setConfirmedToken(res.token_number || res.order_number || "ORDER-PLACED");
      if (onOrderCreated) {
        onOrderCreated();
      }
    } catch (err) {
      console.error("QR order API error:", err);
      // Fallback display if offline
      setOrderPlaced(true);
      setConfirmedToken("IND-QR-001");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 bg-canvas">
      
      {/* Smartphone Viewport Frame */}
      <div className="w-full max-w-sm bg-canvas-card border border-border shadow-xl flex flex-col h-[740px] overflow-hidden">
        
        {/* Device Top Bar with Golden Amber Table Badge */}
        <div className="px-4 py-2.5 bg-canvas-subtle border-b border-border flex items-center justify-between text-[11px] font-mono text-ink-secondary">
          <span className="flex items-center gap-1.5 font-bold text-ink">
            <Smartphone className="w-3.5 h-3.5 text-brand" />
            <span className="px-1.5 py-0.2 bg-badge text-ink text-[10px] font-bold uppercase">{tableLabel}</span>
          </span>
          <span>9:41 AM • 100%</span>
        </div>

        {/* Restaurant Header */}
        <div className="p-6 border-b border-border bg-canvas">
          <span className="text-[10px] font-mono uppercase tracking-wider text-brand font-bold">
            Live QR Ordering Menu
          </span>
          <h2 className="text-xl font-bold tracking-tight text-ink mt-0.5">
            The Spice Junction
          </h2>
          <p className="text-xs text-ink-secondary mt-1">
            Order directly from your table • Zero wait time
          </p>
        </div>

        {/* Dietary Filters */}
        <div className="px-4 py-2.5 border-b border-border bg-canvas-subtle flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setDietary("all")}
              className={`px-3 py-1 font-medium transition-all btn-reactive active:scale-95 rounded ${
                dietary === "all"
                  ? "bg-ink text-canvas font-semibold shadow-xs"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietary("veg")}
              className={`px-3 py-1 font-medium transition-all btn-reactive active:scale-95 rounded ${
                dietary === "veg"
                  ? "bg-dietary-veg text-white font-semibold shadow-xs"
                  : "text-dietary-veg hover:bg-dietary-veg/10"
              }`}
            >
              Veg Only
            </button>
            <button
              onClick={() => setDietary("nonveg")}
              className={`px-3 py-1 font-medium transition-all btn-reactive active:scale-95 rounded ${
                dietary === "nonveg"
                  ? "bg-dietary-nonveg text-white font-semibold shadow-xs"
                  : "text-dietary-nonveg hover:bg-dietary-nonveg/10"
              }`}
            >
              Non-Veg
            </button>
          </div>
          <span className="text-[11px] font-mono text-ink-faint">{filteredDishes.length} Items</span>
        </div>

        {/* Dishes List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border-subtle p-4 space-y-3">
          {filteredDishes.map((dish) => (
            <div key={dish.id} className="pt-3 first:pt-0 space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-0.5 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        dish.dietary === "veg" ? "bg-dietary-veg" : "bg-dietary-nonveg"
                      }`}
                    ></span>
                    <h3 className="font-semibold text-sm text-ink">{dish.name}</h3>
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed pt-0.5">
                    {dish.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-mono font-bold text-ink">
                  ₹ {dish.price.toFixed(2)}
                </span>
                <ClickSpark sparkColor="#D95D39" sparkCount={6} sparkRadius={16}>
                  <button
                    onClick={() => addItem(dish)}
                    className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded btn-reactive active:scale-90 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-white" />
                    <span>Add</span>
                  </button>
                </ClickSpark>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Tray */}
        <div className="p-4 border-t border-border bg-canvas">
          {orderPlaced ? (
            <div className="p-3 bg-dietary-veg/10 border border-dietary-veg text-dietary-veg text-xs text-center space-y-1 rounded">
              <div className="font-bold flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4 text-dietary-veg" />
                <span>Order Sent to Kitchen!</span>
              </div>
              {confirmedToken && (
                <div className="font-mono text-[11px] font-bold text-ink">
                  Token: {confirmedToken}
                </div>
              )}
              <div className="text-[10px] text-ink-secondary">
                Your dishes are being prepared for {tableLabel}.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-ink-secondary font-mono">
                <span>{totalItems} items selected</span>
                <span className="text-ink font-bold">Total: ₹ {grandTotal.toFixed(2)}</span>
              </div>
              <ReactiveButton
                variant="primary"
                size="md"
                onClick={handlePlaceQROrder}
                disabled={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full text-xs uppercase tracking-wider py-3 shadow-md"
              >
                {isSubmitting ? "Connecting..." : "Pay Now & Confirm (UPI)"}
              </ReactiveButton>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
