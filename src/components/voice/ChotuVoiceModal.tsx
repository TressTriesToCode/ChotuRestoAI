"use client";

import React, { useState } from "react";
import { Mic, X, Check, Sparkles, Volume2, Send } from "lucide-react";
import { askChotu } from "@/lib/api/ai";

interface ChotuVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteCommand: (command: string) => void;
}

export const ChotuVoiceModal: React.FC<ChotuVoiceModalProps> = ({
  isOpen,
  onClose,
  onExecuteCommand,
}) => {
  const [transcription, setTranscription] = useState<string>(
    "Table 4 pe 2 Garlic Naan aur 1 Dal Makhani add karo"
  );
  const [statusText, setStatusText] = useState<string>("Listening... speak naturally in Hindi, Hinglish or English");
  const [customInput, setCustomInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSimulate = async (cmd: string, fallbackFeedback: string) => {
    setIsProcessing(true);
    setTranscription(cmd);
    setStatusText("Processing with real PostgreSQL restaurant database...");

    try {
      const res = await askChotu(cmd);
      setStatusText(res.reply || fallbackFeedback);
      onExecuteCommand(cmd);
    } catch {
      setStatusText(fallbackFeedback);
      onExecuteCommand(cmd);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim() || isProcessing) return;
    const query = customInput.trim();
    setCustomInput("");
    setIsProcessing(true);
    setTranscription(query);
    setStatusText("Chotu is querying database facts & analytics...");

    try {
      const res = await askChotu(query);
      setStatusText(res.reply || "Done!");
      if (res.action_taken) {
        onExecuteCommand(query);
      }
    } catch (err: any) {
      setStatusText(err.message || "Failed to reach Chotu AI service.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-canvas-card border border-border w-full max-w-lg rounded shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent-faint border border-accent/20 flex items-center justify-center text-accent rounded">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-ink tracking-tight flex items-center gap-2">
                <span>Chotu Voice &amp; AI Copilot</span>
                <span className="w-2 h-2 rounded-full bg-dietary-veg"></span>
              </h3>
              <p className="text-xs text-ink-secondary">Real-time grounded restaurant assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-ink-secondary hover:text-ink hover:bg-canvas-subtle transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ambient Waveform Card */}
        <div className="bg-canvas-subtle border border-border p-5 text-center space-y-3 rounded">
          <div className="flex items-center justify-center gap-1.5 h-7">
            <span className={`w-1 bg-accent rounded-full ${isProcessing ? "animate-voice-wave" : "h-3"}`} style={{ animationDelay: "0.1s" }}></span>
            <span className={`w-1 bg-accent rounded-full ${isProcessing ? "animate-voice-wave" : "h-5"}`} style={{ animationDelay: "0.3s" }}></span>
            <span className={`w-1 bg-accent rounded-full ${isProcessing ? "animate-voice-wave" : "h-2"}`} style={{ animationDelay: "0.15s" }}></span>
            <span className={`w-1 bg-accent rounded-full ${isProcessing ? "animate-voice-wave" : "h-6"}`} style={{ animationDelay: "0.45s" }}></span>
            <span className={`w-1 bg-accent rounded-full ${isProcessing ? "animate-voice-wave" : "h-3"}`} style={{ animationDelay: "0.2s" }}></span>
            <span className={`w-1 bg-accent rounded-full ${isProcessing ? "animate-voice-wave" : "h-4"}`} style={{ animationDelay: "0.35s" }}></span>
          </div>

          <div>
            <div className="text-sm font-medium text-ink italic font-sans">
              "{transcription}"
            </div>
            <div className="text-xs text-ink-secondary mt-1 font-mono leading-relaxed">
              {statusText}
            </div>
          </div>
        </div>

        {/* Natural Language Prompt Input */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Ask anything: e.g. 'Aaj ka sales kitna hai?' or 'Stock check karo'..."
            className="flex-1 bg-canvas border border-border px-3 py-2 text-xs text-ink rounded focus:outline-none focus:border-brand"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !customInput.trim()}
            className="px-3.5 py-2 bg-brand text-white text-xs font-bold rounded flex items-center gap-1 hover:bg-brand-hover disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>

        {/* Suggested Voice Commands */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-ink-secondary uppercase tracking-wider">
            Quick Simulation Presets:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <button
              onClick={() =>
                handleSimulate(
                  "Table 4 pe 2 Garlic Naan add karo",
                  "Added 2 Garlic Naan to Table T-04 KOT."
                )
              }
              className="p-2.5 border border-border bg-canvas hover:border-accent text-left text-ink transition-colors rounded cursor-pointer"
            >
              "Table 4 pe 2 Garlic Naan add karo"
            </button>
            <button
              onClick={() =>
                handleSimulate(
                  "Table 4 pe 1 Dal Makhani add karo",
                  "Added 1 Dal Makhani to Table T-04 KOT."
                )
              }
              className="p-2.5 border border-border bg-canvas hover:border-accent text-left text-ink transition-colors rounded cursor-pointer"
            >
              "Table 4 pe 1 Dal Makhani add karo"
            </button>
            <button
              onClick={() =>
                handleSimulate(
                  "Gulab Jamun out of stock mark karo",
                  "Marked Gulab Jamun as out of stock."
                )
              }
              className="p-2.5 border border-border bg-canvas hover:border-accent text-left text-ink transition-colors rounded cursor-pointer"
            >
              "Gulab Jamun out of stock mark karo"
            </button>
            <button
              onClick={() =>
                handleSimulate(
                  "Table 4 ka bill WhatsApp pe bhejo",
                  "Invoice dispatched to guest on WhatsApp."
                )
              }
              className="p-2.5 border border-border bg-canvas hover:border-accent text-left text-ink transition-colors rounded cursor-pointer"
            >
              "Table 4 ka bill WhatsApp pe bhejo"
            </button>
          </div>
        </div>

        {/* Bottom dismiss */}
        <div className="flex justify-end pt-2 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-ink text-canvas font-medium text-xs hover:bg-black transition-colors rounded cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
