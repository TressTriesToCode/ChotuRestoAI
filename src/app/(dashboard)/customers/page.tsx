"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Customer } from "@/types/restaurant";
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Award, 
  Clock, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Tag
} from "lucide-react";

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-01",
    name: "Vikram Singhania",
    phone: "+91 98200 12999",
    email: "vikram.s@example.com",
    totalOrders: 18,
    totalSpend: 16420,
    loyaltyPoints: 320,
    lastVisit: "22-Nov-2026",
    tags: ["VIP", "Regular", "Weekend Diner"],
    favoriteDishes: ["Butter Chicken", "Garlic Butter Naan"],
  },
  {
    id: "cust-02",
    name: "Pooja Hegde",
    phone: "+91 98333 77123",
    email: "pooja.h@example.com",
    totalOrders: 9,
    totalSpend: 7850,
    loyaltyPoints: 155,
    lastVisit: "23-Nov-2026",
    tags: ["Vegetarian", "Delivery Regular"],
    favoriteDishes: ["Paneer Tikka Masala", "Dal Makhani"],
  },
  {
    id: "cust-03",
    name: "Aakash Mehta",
    phone: "+91 98200 44321",
    email: "aakash.m@example.com",
    totalOrders: 12,
    totalSpend: 11200,
    loyaltyPoints: 220,
    lastVisit: "21-Nov-2026",
    tags: ["Corporate", "Lunch Rush"],
    favoriteDishes: ["Biryani", "Lassi"],
  },
  {
    id: "cust-04",
    name: "Rhea Chakraborty",
    phone: "+91 98199 55432",
    email: "rhea.c@example.com",
    totalOrders: 5,
    totalSpend: 4290,
    loyaltyPoints: 85,
    lastVisit: "18-Nov-2026",
    tags: ["Dine-In"],
    favoriteDishes: ["Chicken Tikka", "Gulab Jamun"],
  },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "" });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;
    const added: Customer = {
      id: `cust-${Date.now().toString().slice(-4)}`,
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email,
      totalOrders: 1,
      totalSpend: 0,
      loyaltyPoints: 20,
      lastVisit: "Today",
      tags: ["New Guest"],
    };
    setCustomers([added, ...customers]);
    showToast(`Added customer profile for ${newCustomer.name}`);
    setShowAddModal(false);
    setNewCustomer({ name: "", phone: "", email: "" });
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const totalPoints = customers.reduce((a, b) => a + b.loyaltyPoints, 0);
  const totalRevenue = customers.reduce((a, b) => a + b.totalSpend, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        category="Guest Relations & Retention"
        title="Customer CRM & Loyalty"
        subtitle="Manage guest profiles, dining history, lifetime spend, dietary preferences, and reward loyalty points."
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E07A5F] hover:bg-[#d0694e] text-stone-950 font-bold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer Profile</span>
          </button>
        }
      />

      {/* CRM Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#181514] border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-400">Total Enrolled Guests</span>
            <p className="text-xl font-bold text-white mt-0.5">{customers.length} Profiles</p>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-800 text-[#E07A5F]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#181514] border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-400">Total Guest Lifetime Spend</span>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-800 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#181514] border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-400">Active Loyalty Points</span>
            <p className="text-xl font-bold text-amber-400 mt-0.5">{totalPoints} Pts</p>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-800 text-amber-400">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 rounded-2xl bg-[#181514] border border-stone-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-stone-500" />
        <input
          type="text"
          placeholder="Search by customer name, phone number, or tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder:text-stone-500 focus:outline-none"
        />
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-[#181514] border border-stone-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151211] border-b border-stone-800 text-stone-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Total Visits</th>
                <th className="px-4 py-3.5">Lifetime Spend</th>
                <th className="px-4 py-3.5">Loyalty Points</th>
                <th className="px-4 py-3.5">Tags & Preferences</th>
                <th className="px-4 py-3.5 text-right">Last Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-stone-900/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-stone-800 text-[#E07A5F] flex items-center justify-center font-bold text-xs">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">{c.name}</p>
                        {c.favoriteDishes && c.favoriteDishes.length > 0 && (
                          <p className="text-[10px] text-stone-400">Fav: {c.favoriteDishes.join(", ")}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-[11px] text-stone-300">
                    <p>{c.phone}</p>
                    {c.email && <p className="text-[10px] text-stone-500">{c.email}</p>}
                  </td>
                  <td className="px-4 py-4 font-bold text-stone-200">
                    {c.totalOrders} visits
                  </td>
                  <td className="px-4 py-4 font-bold text-emerald-400">
                    ₹{c.totalSpend.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold font-mono">
                      <Award className="w-3 h-3 text-amber-400" />
                      {c.loyaltyPoints} pts
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {c.tags?.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-[10px] text-stone-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-stone-400 text-[11px]">
                    {c.lastVisit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="New Customer Registration"
        description="Add guest details to loyalty database"
        maxWidth="sm"
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              value={newCustomer.name}
              onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              placeholder="e.g. Rahul Singhania"
              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Phone Number (10 digits) *</label>
            <input
              type="tel"
              required
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              placeholder="+91 98200 12345"
              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Email Address</label>
            <input
              type="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              placeholder="guest@example.com"
              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#E07A5F] text-stone-950 font-bold text-xs"
            >
              Save Profile
            </button>
          </div>
        </form>
      </Modal>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-stone-900 border border-emerald-500/40 text-emerald-300 text-xs shadow-2xl backdrop-blur-md">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
