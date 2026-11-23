"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { CustomerMenu } from "@/components/qr/CustomerMenu";
import Link from "next/link";
import { Flame, Bell, Droplets, Receipt, ArrowLeft } from "lucide-react";

export default function DynamicQRMenuPage() {
  const params = useParams();
  const tableParam = Array.isArray(params?.tableId) ? params.tableId[0] : params?.tableId;
  const tableLabel = tableParam ? `Table ${tableParam.toUpperCase()}` : "Table 04";
  const token = `qr-${tableParam || "t04"}`;

  const [assistanceMsg, setAssistanceMsg] = useState<string | null>(null);

  const requestAssistance = (type: string) => {
    setAssistanceMsg(`${type} requested! A captain has been notified.`);
    setTimeout(() => setAssistanceMsg(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#110E0D] text-stone-100 flex flex-col">
      {/* Customer Header */}
      <header className="sticky top-0 z-40 bg-[#161312]/95 backdrop-blur-md border-b border-stone-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E07A5F] to-[#F4A261] flex items-center justify-center text-white font-bold shadow-md shadow-[#E07A5F]/20">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-white tracking-wide">The Spice Junction</h1>
            <p className="text-[10px] text-[#E07A5F] font-mono uppercase tracking-wider">{tableLabel}</p>
          </div>
        </div>

        {/* Waiter Assistance Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => requestAssistance("Water service")}
            className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 hover:text-white transition-colors"
            title="Request Water"
          >
            <Droplets className="w-4 h-4 text-blue-400" />
          </button>
          <button
            onClick={() => requestAssistance("Captain call")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 hover:text-white text-xs font-medium transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Call Server</span>
          </button>
        </div>
      </header>

      {/* Floating alert */}
      {assistanceMsg && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-300 text-xs py-2 px-4 text-center">
          {assistanceMsg}
        </div>
      )}

      {/* Menu Body */}
      <main className="flex-1 max-w-lg mx-auto w-full p-4 pb-20">
        <CustomerMenu token={token} tableLabel={tableLabel} />
      </main>
    </div>
  );
}
