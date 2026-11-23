"use client";

import React, { useState } from "react";
import { KOT } from "@/types/restaurant";
import { Check, Clock, Volume2, VolumeX, RotateCcw, CheckCheck, Flame } from "lucide-react";

interface KitchenDisplayProps {
  kots: KOT[];
  onBumpKot: (kotId: string) => void;
  onRecallKot: (kotId: string) => void;
  onToggleItem?: (itemId: string) => void;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ 
  kots, 
  onBumpKot, 
  onRecallKot,
  onToggleItem 
}) => {
  const [viewMode, setViewMode] = useState<"active" | "completed">("active");
  const [stationFilter, setStationFilter] = useState<string>("all");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleItemCheck = (key: string, itemId?: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
    if (onToggleItem && itemId) {
      onToggleItem(itemId);
    }
  };

  const activeKots = kots.filter((k) => k.status !== "bumped");
  const completedKots = kots.filter((k) => k.status === "bumped");

  // Filter based on active view and station
  const currentList = (viewMode === "active" ? activeKots : completedKots).filter((kot) => {
    if (stationFilter === "all") return true;
    return kot.items.some((item) => item.station === stationFilter);
  });

  return (
    <div className="flex-1 p-6 lg:p-10 bg-canvas space-y-6 max-w-7xl mx-auto w-full">
      
      {/* Calm Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-border pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink tracking-tight flex items-center gap-2">
            <span>Kitchen Display System</span>
            <span className="w-2 h-2 rounded-full bg-dietary-veg"></span>
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Coordinate prep pacing, station routing, and completed order history
          </p>
        </div>

        {/* View Switcher: Active Queue vs Completed Orders */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border bg-canvas-card p-1 text-xs">
            <button
              onClick={() => setViewMode("active")}
              className={`px-3.5 py-1.5 font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === "active"
                  ? "bg-ink text-canvas font-semibold"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              <span>Active Queue</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-mono ${
                viewMode === "active" ? "bg-white/20 text-white" : "bg-canvas-subtle text-ink-secondary"
              }`}>
                {activeKots.length}
              </span>
            </button>

            <button
              onClick={() => setViewMode("completed")}
              className={`px-3.5 py-1.5 font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === "completed"
                  ? "bg-ink text-canvas font-semibold"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5 text-dietary-veg" />
              <span>Completed / Served</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-mono ${
                viewMode === "completed" ? "bg-white/20 text-white" : "bg-canvas-subtle text-ink-secondary"
              }`}>
                {completedKots.length}
              </span>
            </button>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="px-3 py-2 border border-border bg-canvas-card text-xs text-ink-secondary hover:text-ink flex items-center gap-1.5 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-accent" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-ink-faint" />
            )}
            <span className="hidden sm:inline">Chime {soundEnabled ? "On" : "Muted"}</span>
          </button>
        </div>
      </div>

      {/* Sub-bar: Station Selector & Status Stats */}
      <div className="flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-[11px] font-mono text-ink-secondary uppercase mr-1">Station:</span>
          {["all", "curry", "tandoor", "bar", "pantry"].map((station) => (
            <button
              key={station}
              onClick={() => setStationFilter(station)}
              className={`px-3 py-1 capitalize transition-colors ${
                stationFilter === station
                  ? "bg-canvas-subtle border border-ink text-ink font-semibold"
                  : "text-ink-secondary hover:text-ink border border-transparent"
              }`}
            >
              {station}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-ink-secondary flex items-center gap-3">
          <span>Completed Today: <strong className="text-ink">{completedKots.length} Tickets</strong></span>
          <span>•</span>
          <span>Active in Kitchen: <strong className="text-ink">{activeKots.length} Tickets</strong></span>
        </div>
      </div>

      {/* Tickets Grid */}
      {currentList.length === 0 ? (
        <div className="py-20 text-center text-xs font-mono text-ink-secondary border border-border bg-canvas-card">
          {viewMode === "active"
            ? "All kitchen orders completed. Ready for incoming tickets."
            : "No completed tickets in this station filter."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentList.map((kot) => {
            const isCompleted = kot.status === "bumped";
            const isLate = kot.elapsedSeconds > 720 && !isCompleted;
            const isApproaching = kot.elapsedSeconds > 480 && !isLate && !isCompleted;
            const minutes = Math.floor(kot.elapsedSeconds / 60);
            const seconds = kot.elapsedSeconds % 60;
            const timeString = `${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;

            return (
              <div
                key={kot.id}
                className={`bg-canvas-card border shadow-sm flex flex-col justify-between transition-all ${
                  isCompleted 
                    ? "border-border opacity-90" 
                    : isLate 
                    ? "border-dietary-nonveg" 
                    : "border-border"
                }`}
              >
                <div>
                  {/* Ticket Header */}
                  <div className={`p-4 border-b flex items-center justify-between ${
                    isCompleted 
                      ? "bg-canvas-subtle border-border" 
                      : isLate 
                      ? "bg-dietary-nonveg/5 border-dietary-nonveg/30" 
                      : "bg-canvas-subtle border-border"
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink font-mono">{kot.tableId}</span>
                        <span className="text-xs text-ink-secondary font-mono">#{kot.kotNumber}</span>
                      </div>
                      <div className="text-[10px] text-ink-faint font-mono mt-0.5">
                        Placed via {kot.placedBy.toUpperCase()} • {kot.createdAt}
                      </div>
                    </div>

                    <div>
                      {isCompleted ? (
                        <span className="text-xs font-mono text-dietary-veg font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Cooked in {timeString}</span>
                        </span>
                      ) : (
                        <div
                          className={`flex items-center gap-1.5 text-xs font-mono font-semibold ${
                            isLate
                              ? "text-dietary-nonveg"
                              : isApproaching
                              ? "text-accent"
                              : "text-dietary-veg"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{timeString}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Captain Notes */}
                  {kot.captainNotes && (
                    <div className="px-4 py-2 bg-accent-faint border-b border-border text-xs text-accent italic">
                      "{kot.captainNotes}"
                    </div>
                  )}

                  {/* Items List */}
                  <div className="p-4 space-y-3 divide-y divide-border-subtle">
                    {kot.items.map((item, idx) => {
                      const itemKey = `${kot.id}-${item.dishId}-${idx}`;
                      const isDone = isCompleted || checkedItems[itemKey];

                      return (
                        <div
                          key={itemKey}
                          onClick={() => !isCompleted && toggleItemCheck(itemKey, item.dishId)}
                          className={`pt-2.5 first:pt-0 flex items-start justify-between ${
                            !isCompleted ? "cursor-pointer select-none" : ""
                          } ${isDone ? "opacity-40 line-through" : ""}`}
                        >
                          <div>
                            <div className="font-medium text-sm text-ink flex items-center gap-2">
                              <span>
                                {item.quantity}× {item.name}
                              </span>
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  item.dietary === "veg" ? "bg-dietary-veg" : "bg-dietary-nonveg"
                                }`}
                              ></span>
                            </div>
                            <div className="text-[11px] font-mono text-ink-faint uppercase mt-0.5">
                              {item.station}
                            </div>
                          </div>

                          <div
                            className={`w-4 h-4 border mt-1 flex items-center justify-center transition-colors ${
                              isDone
                                ? "border-dietary-veg bg-dietary-veg text-white"
                                : "border-border hover:border-ink-secondary"
                            }`}
                          >
                            {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Action: Complete Ticket (Active) OR Recall Ticket (Completed) */}
                <div className="p-3 border-t border-border bg-canvas-subtle">
                  {isCompleted ? (
                    <button
                      onClick={() => onRecallKot(kot.id)}
                      className="w-full py-2 bg-canvas hover:bg-white border border-border text-ink-secondary hover:text-ink font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-accent" />
                      <span>Undo / Recall to Kitchen Queue</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onBumpKot(kot.id)}
                      className="w-full py-2 bg-canvas hover:bg-white border border-border text-ink font-semibold text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5 text-dietary-veg" />
                      <span>Mark Prepared & Bump</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
