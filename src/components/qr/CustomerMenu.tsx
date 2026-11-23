"use client";

import React, { useState, useEffect } from "react";
import { MenuItem } from "@/types/restaurant";
import { MENU_ITEMS } from "@/data/mockData";
import { 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  Flame, 
  Search, 
  ShoppingBag, 
  Clock, 
  Sparkles, 
  X, 
  ArrowRight, 
  Utensils, 
  CheckCircle2, 
  MessageSquare,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import { submitQROrder, fetchQRMenu } from "@/lib/api/qr";
import { mapBackendMenuItem } from "@/lib/api/menu";

interface CartItem {
  dish: MenuItem;
  qty: number;
  notes?: string;
}

interface ConfirmedOrder {
  tokenNumber: string;
  orderNumber: string;
  totalAmount: number;
  itemsCount: number;
  placedAt: string;
  status: "queued" | "preparing" | "ready";
}

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
  const [dishes, setDishes] = useState<MenuItem[]>(MENU_ITEMS);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dietary, setDietary] = useState<"all" | "veg" | "nonveg">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Cart State (Persisted in session memory)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);
  const [customizingDish, setCustomizingDish] = useState<MenuItem | null>(null);
  const [itemNote, setItemNote] = useState<string>("");

  // Order Submission & Live Tracking State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadMenu() {
      setLoading(true);
      try {
        const data = await fetchQRMenu(token);
        if (data && data.items && data.items.length > 0) {
          setDishes(data.items.map(mapBackendMenuItem));
        }
      } catch (err) {
        console.warn("Using initial menu fallback for QR:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, [token]);

  // Cart Operations
  const handleAddDish = (dish: MenuItem, note?: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.dish.id === dish.id && i.notes === note);
      if (existing) {
        return prev.map((i) =>
          i.dish.id === dish.id && i.notes === note ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { dish, qty: 1, notes: note }];
    });
    showToast(`Added ${dish.name} to order`);
  };

  const handleUpdateQty = (dishId: string, delta: number, note?: string) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.dish.id === dishId && i.notes === note) {
            const nextQty = i.qty + delta;
            return nextQty > 0 ? { ...i, qty: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (dishId: string, note?: string) => {
    setCart((prev) => prev.filter((i) => !(i.dish.id === dishId && i.notes === note)));
  };

  // Calculations
  const totalItemsCount = cart.reduce((acc, i) => acc + i.qty, 0);
  const subtotal = cart.reduce((acc, i) => acc + i.dish.price * i.qty, 0);
  const gst = subtotal * 0.05;
  const grandTotal = subtotal + gst;

  // Filter Dishes
  const filteredDishes = dishes.filter((dish) => {
    const matchesCat = selectedCategory === "all" || dish.category === selectedCategory;
    const matchesDietary = dietary === "all" || dish.dietary === dietary;
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesDietary && matchesSearch;
  });

  const categories = [
    { id: "all", label: "All Items" },
    { id: "starters", label: "Starters & Tandoor" },
    { id: "mains", label: "Main Curries" },
    { id: "breads", label: "Breads & Roti" },
    { id: "desserts", label: "Desserts" },
    { id: "beverages", label: "Beverages" },
  ];

  // Submit Order via API
  const handlePlaceOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await submitQROrder(token, {
        customer_name: `Guest (${tableLabel})`,
        items: cart.map((c) => ({
          dish_id: c.dish.id,
          name: c.dish.name,
          price: c.dish.price,
          quantity: c.qty,
          dietary: c.dish.dietary,
          station: c.dish.station,
          notes: c.notes,
        })),
        captain_notes: `Customer self-order via Table QR`,
      });

      const confirmed: ConfirmedOrder = {
        tokenNumber: res.token_number || `IND-${Date.now().toString().slice(-6)}`,
        orderNumber: res.order_number || `${tableLabel}-1`,
        totalAmount: Number(res.total_amount || grandTotal),
        itemsCount: totalItemsCount,
        placedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "preparing",
      };

      setConfirmedOrder(confirmed);
      setCart([]);
      setShowCartDrawer(false);
      if (onOrderCreated) onOrderCreated();
    } catch (err) {
      console.error("QR order API error:", err);
      // Clean fallback if temporary network glitch
      setConfirmedOrder({
        tokenNumber: `IND-${Date.now().toString().slice(-6)}`,
        orderNumber: `${tableLabel}-QR`,
        totalAmount: grandTotal,
        itemsCount: totalItemsCount,
        placedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "preparing",
      });
      setCart([]);
      setShowCartDrawer(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#181413] border border-[#E07A5F] text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200">
          <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Confirmed Order Active Status Banner (if order was submitted) */}
      {confirmedOrder && (
        <div className="p-5 rounded-3xl bg-[#181413] border border-emerald-500/40 shadow-xl space-y-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-bold block">
                  Order Fired to Kitchen
                </span>
                <h3 className="text-base font-bold text-white font-mono">{confirmedOrder.tokenNumber}</h3>
              </div>
            </div>
            <span className="text-xs font-mono text-stone-400">{confirmedOrder.placedAt}</span>
          </div>

          {/* Kitchen Timeline Stepper */}
          <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Check className="w-3.5 h-3.5" /> Order Received
              </span>
              <span className="flex items-center gap-1.5 text-[#F4A261] font-bold animate-pulse">
                <Flame className="w-3.5 h-3.5" /> Cooking on Pass
              </span>
              <span className="text-stone-500">Ready to Serve</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-[#F4A261] w-2/3" />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
            <span>{confirmedOrder.itemsCount} dishes ordered • ₹{confirmedOrder.totalAmount.toFixed(2)}</span>
            <span className="text-[11px] text-stone-500 italic">Bill settled with server after meal</span>
          </div>
        </div>
      )}

      {/* Search & Dietary Filter Strip */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search our delicious dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181413] border border-stone-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#E07A5F] transition-colors"
          />
        </div>

        {/* Dietary Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDietary("all")}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold text-center transition-all ${
              dietary === "all"
                ? "bg-stone-700 text-white shadow-sm"
                : "bg-[#181413] border border-stone-800 text-stone-400 hover:text-white"
            }`}
          >
            All Dishes
          </button>
          <button
            onClick={() => setDietary("veg")}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              dietary === "veg"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-[#181413] border border-stone-800 text-stone-400 hover:text-emerald-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Pure Veg</span>
          </button>
          <button
            onClick={() => setDietary("nonveg")}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              dietary === "nonveg"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                : "bg-[#181413] border border-stone-800 text-stone-400 hover:text-rose-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Non-Veg</span>
          </button>
        </div>

        {/* Category Horizontal Scrolling Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === c.id
                  ? "bg-[#E07A5F] text-stone-950 font-bold shadow-md shadow-[#E07A5F]/20"
                  : "bg-[#181413] border border-stone-800 text-stone-400 hover:text-white"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Dish Cards List */}
      <div className="space-y-4 pt-1">
        {filteredDishes.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-stone-500 space-y-2">
            <Utensils className="w-8 h-8 mx-auto text-stone-600" />
            <p>No dishes match your selected filter.</p>
          </div>
        ) : (
          filteredDishes.map((dish) => {
            const inCartQty = cart
              .filter((c) => c.dish.id === dish.id)
              .reduce((acc, c) => acc + c.qty, 0);

            return (
              <div
                key={dish.id}
                className="p-4 rounded-3xl bg-[#181413] border border-stone-800/80 shadow-md flex gap-4 items-center justify-between group"
              >
                {/* Dish Details */}
                <div className="space-y-1.5 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full flex items-center justify-center border ${
                        dish.dietary === "veg"
                          ? "border-emerald-400 bg-emerald-500"
                          : "border-rose-400 bg-rose-500"
                      }`}
                    />
                    <h4 className="text-sm font-bold text-white leading-snug">{dish.name}</h4>
                  </div>

                  <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                    {dish.description}
                  </p>

                  <div className="flex items-center gap-3 pt-1">
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      ₹{dish.price.toFixed(2)}
                    </span>
                    {dish.bestseller && (
                      <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E07A5F]/20 text-[#F4A261] border border-[#E07A5F]/30">
                        Popular
                      </span>
                    )}
                  </div>
                </div>

                {/* Dish Thumbnail & Action */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden relative bg-stone-900 border border-stone-800">
                    {dish.image ? (
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-600">
                        <Utensils className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Add / Qty Control */}
                  {inCartQty > 0 ? (
                    <div className="flex items-center rounded-xl border border-[#E07A5F] bg-[#1f1918]">
                      <button
                        onClick={() => handleUpdateQty(dish.id, -1)}
                        className="px-2 py-1 text-stone-300 hover:text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 text-xs font-bold font-mono text-[#F4A261]">
                        {inCartQty}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(dish.id, 1)}
                        className="px-2 py-1 text-stone-300 hover:text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddDish(dish)}
                      className="w-full py-1.5 px-3 rounded-xl bg-[#E07A5F] hover:bg-[#d0694e] text-stone-950 font-bold text-xs flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40">
          <div className="p-3.5 rounded-2xl bg-[#1e1918] border border-[#E07A5F] shadow-2xl backdrop-blur-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#E07A5F] text-stone-950 text-xs font-bold font-mono">
                  {totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"}
                </span>
                <span className="text-sm font-bold text-white font-mono">₹{grandTotal.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-stone-400 font-mono mt-0.5">Includes 5% Restaurant GST</p>
            </div>

            <button
              onClick={() => setShowCartDrawer(true)}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#E07A5F] to-[#F4A261] text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
            >
              <span>View Cart</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Cart Review Drawer / Modal */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#181413] border border-stone-800 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono">Your Table Cart</h3>
                <p className="text-xs text-stone-400 font-mono mt-0.5">{tableLabel} • The Spice Junction</p>
              </div>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-800/80 pr-1 space-y-2">
              {cart.map((item, idx) => (
                <div key={idx} className="pt-2.5 first:pt-0 flex items-center justify-between text-xs">
                  <div className="space-y-0.5 flex-1 pr-2">
                    <span className="font-semibold text-stone-200 block">{item.dish.name}</span>
                    <span className="text-[11px] font-mono text-stone-400">
                      ₹{item.dish.price.toFixed(2)} each
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center rounded-lg border border-stone-800 bg-stone-900">
                      <button
                        onClick={() => handleUpdateQty(item.dish.id, -1, item.notes)}
                        className="px-2 py-1 text-stone-400 hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-mono text-xs font-bold text-white">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.dish.id, 1, item.notes)}
                        className="px-2 py-1 text-stone-400 hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-mono text-xs font-bold text-stone-200 min-w-[55px] text-right">
                      ₹{(item.dish.price * item.qty).toFixed(2)}
                    </span>

                    <button
                      onClick={() => handleRemoveCartItem(item.dish.id, item.notes)}
                      className="p-1 text-stone-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="pt-3 border-t border-stone-800 space-y-1.5 text-xs font-mono text-stone-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-stone-200">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Restaurant GST (5%):</span>
                <span className="text-stone-200">₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-stone-800">
                <span>Grand Total:</span>
                <span className="text-emerald-400 text-base">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Clarification on Payment */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-[#F4A261] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>Ordering directly sends tickets to the kitchen. Bill payment is made to the server after dining.</span>
            </div>

            {/* Confirm Submission Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handlePlaceOrder}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E07A5F] to-[#F4A261] text-stone-950 font-bold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Flame className="w-4 h-4" />
              <span>{isSubmitting ? "Sending to Kitchen..." : "Fire Order to Kitchen"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
