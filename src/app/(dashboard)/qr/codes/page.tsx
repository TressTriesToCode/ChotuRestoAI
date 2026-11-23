"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Table } from "@/types/restaurant";
import { INITIAL_TABLES } from "@/data/mockData";
import { fetchTables } from "@/lib/api/tables";
import { QrCode, Printer, ExternalLink, Download, Sparkles } from "lucide-react";

export default function QrCodesAdminPage() {
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);

  useEffect(() => {
    async function loadTables() {
      try {
        const data = await fetchTables();
        if (data && data.length > 0) setTables(data);
      } catch (err) {
        console.warn("Using local QR tables fallback", err);
      }
    }
    loadTables();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        category="Digital Ordering Setup"
        title="Table QR Codes & Print Cards"
        subtitle="Download or print contactless QR codes for each dining table. Guests scan with any camera to order directly."
        actions={
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E07A5F] hover:bg-[#d0694e] text-stone-950 font-bold text-xs shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print All Table Cards</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map((table) => {
          const directUrl = `/qr/${table.id.toLowerCase()}`;
          return (
            <div
              key={table.id}
              className="p-6 rounded-3xl bg-[#181514] border border-stone-800 text-center flex flex-col items-center justify-between shadow-xl relative overflow-hidden group hover:border-[#E07A5F]/50 transition-all"
            >
              <div className="mb-4">
                <span className="text-[10px] font-mono uppercase font-bold text-[#E07A5F] tracking-widest block mb-1">
                  The Spice Junction
                </span>
                <h3 className="text-xl font-extrabold text-white">{table.label}</h3>
                <span className="text-xs text-stone-400 font-medium">Capacity: {table.capacity} Guests</span>
              </div>

              {/* QR Code Container */}
              <div className="p-4 bg-white rounded-2xl shadow-inner mb-4 flex flex-col items-center justify-center">
                <QrCode className="w-32 h-32 text-stone-950" />
                <span className="text-[9px] font-mono text-stone-600 mt-1 uppercase font-semibold">
                  SCAN TO BROWSE & ORDER
                </span>
              </div>

              <div className="w-full space-y-2">
                <Link
                  href={directUrl}
                  target="_blank"
                  className="w-full py-2 px-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-[#E07A5F]/40 text-stone-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview Customer Menu</span>
                </Link>

                <p className="text-[10px] text-stone-500 font-mono truncate">
                  chotu.restro/qr/{table.id.toLowerCase()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
