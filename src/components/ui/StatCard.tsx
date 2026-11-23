"use client";

import React, { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
}

export function StatCard({ title, value, subtitle, icon, trend, highlight }: StatCardProps) {
  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        highlight
          ? "bg-gradient-to-br from-[#1C1817] via-[#241E1C] to-[#1C1817] border-[#E07A5F]/40 shadow-lg shadow-[#E07A5F]/5"
          : "bg-[#181514] border-stone-800/80 hover:border-stone-700/80"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-stone-400">{title}</span>
        {icon && <div className="p-2 rounded-xl bg-stone-800/80 text-stone-300">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              trend.isPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-[11px] text-stone-500">{subtitle}</p>}
    </div>
  );
}
