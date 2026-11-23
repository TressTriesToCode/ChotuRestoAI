"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { MenuItem } from "@/types/restaurant";
import { MENU_ITEMS } from "@/data/mockData";
import { fetchMenuItems, updateMenuItem } from "@/lib/api/menu";
import { 
  Plus, 
  Search, 
  Edit, 
  Check, 
  ToggleLeft, 
  ToggleRight, 
  AlertCircle,
  Filter,
  DollarSign
} from "lucide-react";

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editItemModal, setEditItemModal] = useState<MenuItem | null>(null);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadRemoteMenu() {
      try {
        const data = await fetchMenuItems();
        if (data && data.length > 0) setItems(data);
      } catch (err) {
        console.warn("Using local menu fallback", err);
      }
    }
    loadRemoteMenu();
  }, []);

  const toggleStock = async (dishId: string) => {
    const item = items.find((i) => i.id === dishId);
    if (!item) return;
    const next = !item.inStock;
    setItems((prev) =>
      prev.map((it) => (it.id === dishId ? { ...it, inStock: next } : it))
    );
    showToast(`${item.name} is now marked ${next ? "IN STOCK" : "86'd / OUT OF STOCK"}`);
    try {
      await updateMenuItem(dishId, { inStock: next });
    } catch {
      // keep local update
    }
  };

  const handleSavePrice = async (dishId: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === dishId ? { ...it, price: newPrice } : it))
    );
    showToast("Menu pricing updated successfully");
    setEditItemModal(null);
    try {
      await updateMenuItem(dishId, { price: newPrice });
    } catch {
      // keep local update
    }
  };

  const filteredItems = items.filter((it) => {
    if (selectedCategory !== "all" && it.category !== selectedCategory) return false;
    if (
      searchQuery &&
      !it.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !it.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        category="Catalog & Recipes"
        title="Menu & Pricing Management"
        subtitle="Configure dish pricing, tax rates, kitchen station routing, and toggle 86'd items in real time across POS, QR and Kiosks."
        actions={
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E07A5F] hover:bg-[#d0694e] text-stone-950 font-bold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        }
      />

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#181514] border border-stone-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["all", "starters", "mains", "breads", "beverages", "desserts"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-[#E07A5F]/20 text-[#F4A261] border border-[#E07A5F]/40"
                  : "text-stone-400 hover:text-white hover:bg-stone-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dish or recipe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#E07A5F]"
          />
        </div>
      </div>

      {/* Menu Table / Cards */}
      <div className="rounded-2xl bg-[#181514] border border-stone-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151211] border-b border-stone-800 text-stone-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Dish Details</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Station</th>
                <th className="px-4 py-3.5">Selling Price</th>
                <th className="px-4 py-3.5">Live Stock Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filteredItems.map((dish) => (
                <tr key={dish.id} className="hover:bg-stone-900/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                          dish.dietary === "veg" ? "border-emerald-500" : "border-rose-500"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            dish.dietary === "veg" ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{dish.name}</span>
                          {dish.bestseller && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Bestseller
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                          {dish.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 capitalize text-stone-300 font-medium">
                    {dish.category}
                  </td>
                  <td className="px-4 py-4 font-mono text-[11px] text-stone-400 capitalize">
                    {dish.station}
                  </td>
                  <td className="px-4 py-4 font-bold text-emerald-400 text-xs">
                    ₹{dish.price}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleStock(dish.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                        dish.inStock
                          ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40 hover:bg-rose-950/60 hover:text-rose-400 hover:border-rose-500/40"
                          : "bg-rose-950/80 text-rose-400 border-rose-500/40 hover:bg-emerald-950/60 hover:text-emerald-400 hover:border-emerald-500/40"
                      }`}
                      title="Click to toggle stock availability"
                    >
                      <span className={`w-2 h-2 rounded-full ${dish.inStock ? "bg-emerald-400" : "bg-rose-400"}`} />
                      <span>{dish.inStock ? "Available" : "86'd (Out of Stock)"}</span>
                    </button>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => setEditItemModal(dish)}
                      className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-300 hover:text-white transition-colors"
                      title="Edit Dish Pricing"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Price Modal */}
      {editItemModal && (
        <Modal
          isOpen={!!editItemModal}
          onClose={() => setEditItemModal(null)}
          title={`Edit Menu Item: ${editItemModal.name}`}
          description="Update pricing and station routing"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Selling Price (₹ INR)
              </label>
              <input
                type="number"
                defaultValue={editItemModal.price}
                id="edit-price-input"
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setEditItemModal(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById("edit-price-input") as HTMLInputElement;
                  if (input) handleSavePrice(editItemModal.id, Number(input.value));
                }}
                className="px-4 py-2 rounded-xl bg-[#E07A5F] text-stone-950 font-bold text-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Floating toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-stone-900 border border-emerald-500/40 text-emerald-300 text-xs shadow-2xl backdrop-blur-md">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
