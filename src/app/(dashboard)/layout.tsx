"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ChotuVoiceModal } from "@/components/voice/ChotuVoiceModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [voiceModalOpen, setVoiceModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExecuteVoiceCommand = (cmd: string) => {
    showToast(`Voice Action Executed: "${cmd}"`);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#110E0D] text-stone-100">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Persistent Top Navigation Bar */}
        <TopBar onOpenVoiceModal={() => setVoiceModalOpen(true)} />

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin scrollbar-thumb-stone-800">
          <div className="max-w-7xl mx-auto pb-12">
            {children}
          </div>
        </main>
      </div>

      {/* Global Chotu Voice Modal */}
      <ChotuVoiceModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onExecuteCommand={handleExecuteVoiceCommand}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-stone-900/95 border border-emerald-500/40 text-emerald-300 text-xs shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
