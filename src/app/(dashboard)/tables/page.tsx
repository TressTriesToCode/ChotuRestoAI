"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Grid3X3, 
  Users, 
  Clock, 
  Receipt, 
  CheckCircle2, 
  Sparkles, 
  Filter, 
  RefreshCw,
  Plus,
  ArrowRight
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { fetchTables, updateTableStatus } from "@/lib/api/tables";
import { Table, TableStatus } from "@/types/restaurant";
import { INITIAL_TABLES } from "@/data/mockData";
import { wsClient } from "@/lib/api/websocket";

export default function TablesPage() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTableForEdit, setSelectedTableForEdit] = useState<Table | null>(null);
  const [newStatus, setNewStatus] = useState<TableStatus>("vacant");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadTables = async () => {
    setLoading(true);
    try {
      const data = await fetchTables();
      if (data && data.length > 0) {
        setTables(data);
      }
    } catch (err) {
      console.warn("Using local table state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();

    wsClient.connect("rest-spice-jct");
    const unsubscribe = wsClient.subscribe((evt) => {
      if (evt.type === "table_updated" || evt.type === "order_created" || evt.type === "order_updated") {
        loadTables();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleStatusChangeSubmit = async () => {
    if (!selectedTableForEdit) return;
    setIsUpdating(true);
    try {
      await updateTableStatus(selectedTableForEdit.id, newStatus);
      setTables((prev) =>
        prev.map((t) => (t.id === selectedTableForEdit.id ? { ...t, status: newStatus } : t))
      );
      setSelectedTableForEdit(null);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickClear = async (tableId: string) => {
    try {
      await updateTableStatus(tableId, "vacant");
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: "vacant", currentBill: 0, guestCount: 0 } : t))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const vacantCount = tables.filter((t) => t.status === "vacant").length;
  const occupiedCount = tables.filter((t) => t.status === "occupied").length;
  const billedCount = tables.filter((t) => t.status === "billed").length;

  const filteredTables = tables.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        category="Floor & Seating Management"
        title="Dining Floor Plan"
        subtitle="Live table occupancy, turn times, active ledger status, and quick server dispatch."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadTables}
              className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors"
              title="Refresh Floor"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/pos"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E07A5F] hover:bg-[#d0694e] text-stone-950 font-bold text-xs shadow-md transition-all"
            >
              <Receipt className="w-4 h-4" />
              <span>Open POS Billing</span>
            </Link>
          </div>
        }
      />

      {/* Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#181514] border border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-400">Total Tables</span>
          <span className="text-sm font-bold text-white">{tables.length}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#181514] border border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-400">Vacant / Available</span>
          <span className="text-sm font-bold text-emerald-400">{vacantCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#181514] border border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-400">Occupied & Dining</span>
          <span className="text-sm font-bold text-amber-400">{occupiedCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#181514] border border-stone-800 flex items-center justify-between">
          <span className="text-xs text-stone-400">Awaiting Settlement</span>
          <span className="text-sm font-bold text-blue-400">{billedCount}</span>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#181514] border border-stone-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-400 uppercase font-mono mr-1">Section:</span>
          {["all", "AC Main Hall", "Rooftop Lounge", "Bar Counter"].map((sec) => (
            <button
              key={sec}
              onClick={() => setSectionFilter(sec)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sectionFilter === sec
                  ? "bg-[#E07A5F]/20 text-[#F4A261] border border-[#E07A5F]/40"
                  : "text-stone-400 hover:text-white hover:bg-stone-800"
              }`}
            >
              {sec === "all" ? "All Sections" : sec}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-400 uppercase font-mono mr-1">Status:</span>
          {["all", "vacant", "occupied", "billed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === st
                  ? "bg-stone-700 text-white font-bold"
                  : "text-stone-400 hover:text-white hover:bg-stone-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map((tbl) => {
          const isOccupied = tbl.status === "occupied";
          const isBilled = tbl.status === "billed";
          return (
            <div
              key={tbl.id}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isOccupied
                  ? "bg-amber-950/15 border-amber-500/30 shadow-md shadow-amber-950/20"
                  : isBilled
                  ? "bg-blue-950/15 border-blue-500/30 shadow-md shadow-blue-950/20"
                  : "bg-[#181514] border-stone-800/80 hover:border-stone-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{tbl.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-mono">
                      {tbl.capacity} Pax
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono border ${
                      isOccupied
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : isBilled
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    }`}
                  >
                    {tbl.status}
                  </span>
                </div>

                <div className="space-y-1.5 my-3 text-xs">
                  {tbl.openedAt && (
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Seated At
                      </span>
                      <span className="font-mono text-stone-200">{tbl.openedAt}</span>
                    </div>
                  )}

                  {tbl.captainName && (
                    <div className="flex items-center justify-between text-stone-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Server
                      </span>
                      <span className="text-stone-200">{tbl.captainName}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800/60">
                    <span className="text-stone-400">Current Ledger:</span>
                    <span className={`font-bold ${tbl.currentBill ? "text-emerald-400 text-sm" : "text-stone-500"}`}>
                      {tbl.currentBill ? `₹${tbl.currentBill.toLocaleString("en-IN")}` : "₹0"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-stone-800/80 mt-2">
                <Link
                  href={`/pos`}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-stone-800 hover:bg-[#E07A5F] hover:text-stone-950 text-stone-200 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{isOccupied ? "View Order" : "Seat / Order"}</span>
                </Link>

                <button
                  onClick={() => {
                    setSelectedTableForEdit(tbl);
                    setNewStatus(tbl.status);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-700/80 hover:bg-stone-800 text-stone-300 text-xs transition-colors"
                  title="Change Table Status"
                >
                  Edit
                </button>

                {isOccupied && (
                  <button
                    onClick={() => handleQuickClear(tbl.id)}
                    className="px-2 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 text-xs transition-colors"
                    title="Quick Reset / Clear Table"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Status Modal */}
      {selectedTableForEdit && (
        <Modal
          isOpen={!!selectedTableForEdit}
          onClose={() => setSelectedTableForEdit(null)}
          title={`Update Status: ${selectedTableForEdit.label}`}
          description="Change current seating occupancy and server allocation"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">Select New Status</label>
              <div className="grid grid-cols-2 gap-2">
                {(["vacant", "occupied", "billed", "reserved"] as TableStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNewStatus(st)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                      newStatus === st
                        ? "bg-[#E07A5F]/20 text-[#F4A261] border-[#E07A5F]"
                        : "bg-stone-900 border-stone-800 text-stone-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setSelectedTableForEdit(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleStatusChangeSubmit}
                className="px-4 py-2 rounded-xl bg-[#E07A5F] hover:bg-[#d0694e] text-stone-950 font-bold text-xs"
              >
                {isUpdating ? "Saving..." : "Update Table"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
