"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RestaurantSettings } from "@/types/restaurant";
import { 
  Settings, 
  Store, 
  ShieldCheck, 
  Percent, 
  QrCode, 
  Printer, 
  Save, 
  Check,
  Building
} from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings>({
    restaurantName: "The Spice Junction",
    tagline: "Authentic Indian Flavors & Modern Hospitality",
    phone: "+91 98200 12345",
    email: "contact@spicejunction.in",
    address: "Shop 4, Pali Hill Road, Bandra West, Mumbai, MH 400050",
    gstin: "27AABCU9603R1ZM",
    fssaiNumber: "11521005000432",
    cgstPercent: 2.5,
    sgstPercent: 2.5,
    serviceChargePercent: 5.0,
    serviceChargeEnabled: true,
    currency: "INR (₹)",
    upiVpa: "spicejunction@okhdfcbank",
    autoPrintKOT: true,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Restaurant configuration and tax rules updated successfully!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        category="System & Administration"
        title="Restaurant Profile & Tax Configuration"
        subtitle="Manage outlet branding, FSSAI & GSTIN compliance, dynamic UPI VPA for customer billing, and station routing rules."
      />

      <form onSubmit={handleSave} className="space-y-8">
        {/* Outlet Profile */}
        <div className="p-6 rounded-2xl bg-[#181514] border border-stone-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-800">
            <Store className="w-5 h-5 text-[#E07A5F]" />
            <h2 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Outlet Information & Contact
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Restaurant Legal Name</label>
              <input
                type="text"
                value={settings.restaurantName}
                onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Brand Tagline / Header</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Official Contact Phone</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Billing Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-stone-300 mb-1">Complete Physical Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Legal & Tax Compliance */}
        <div className="p-6 rounded-2xl bg-[#181514] border border-stone-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Statutory Compliance & Indian GST
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">GSTIN Number (15 Digits)</label>
              <input
                type="text"
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">FSSAI License Number (14 Digits)</label>
              <input
                type="text"
                value={settings.fssaiNumber}
                onChange={(e) => setSettings({ ...settings, fssaiNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">CGST Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.cgstPercent}
                onChange={(e) => setSettings({ ...settings, cgstPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">SGST Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.sgstPercent}
                onChange={(e) => setSettings({ ...settings, sgstPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Service Charge (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.serviceChargePercent}
                onChange={(e) => setSettings({ ...settings, serviceChargePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs font-mono"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="sc-toggle"
                checked={settings.serviceChargeEnabled}
                onChange={(e) => setSettings({ ...settings, serviceChargeEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-[#E07A5F] bg-stone-900 border-stone-700"
              />
              <label htmlFor="sc-toggle" className="text-xs text-stone-300 font-medium">
                Apply Discretionary Service Charge on Dine-In bills
              </label>
            </div>
          </div>
        </div>

        {/* Digital Payment & UPI */}
        <div className="p-6 rounded-2xl bg-[#181514] border border-stone-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-stone-800">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h2 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              UPI Gateway & Payment QR
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Merchant UPI VPA ID</label>
            <input
              type="text"
              value={settings.upiVpa}
              onChange={(e) => setSettings({ ...settings, upiVpa: e.target.value })}
              placeholder="merchant@bank"
              className="w-full max-w-md px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs font-mono"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Dynamic QR codes on customer receipts and POS settlement will route to this UPI handle.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#E07A5F] to-[#F4A261] text-stone-950 font-bold text-xs shadow-lg hover:opacity-95 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configuration</span>
          </button>
        </div>
      </form>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-stone-900 border border-emerald-500/40 text-emerald-300 text-xs shadow-2xl backdrop-blur-md">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
