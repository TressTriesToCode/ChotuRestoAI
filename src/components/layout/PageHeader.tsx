"use client";

import React, { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  category?: string;
  actions?: ReactNode;
  badge?: ReactNode;
}

export function PageHeader({ title, subtitle, category, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-stone-800/60 mb-6">
      <div className="space-y-1">
        {category && (
          <p className="text-[11px] font-semibold text-[#E07A5F] uppercase font-mono tracking-wider">
            {category}
          </p>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-xs sm:text-sm text-stone-400 max-w-2xl">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  );
}
