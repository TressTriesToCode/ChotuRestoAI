"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { askChotu } from "@/lib/api/ai";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Mic, 
  TrendingUp, 
  Package, 
  Receipt, 
  Clock, 
  CheckCircle2,
  RefreshCw,
  Lightbulb
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "chotu";
  text: string;
  timestamp: string;
  actionTaken?: any;
}

export default function AiConsolePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-0",
      sender: "chotu",
      text: "Namaste! I am Chotu, your AI Restaurant Operating Assistant. Ask me about today's sales, kitchen ticket pacing, occupied tables, low inventory ingredients, or give voice instructions in Hindi, Hinglish or English.",
      timestamp: "21:00",
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    try {
      const res = await askChotu(query);
      const chotuMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "chotu",
        text: res.reply || "Done! I have checked the live restaurant system for you.",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        actionTaken: res.action_taken,
      };
      setMessages((prev) => [...prev, chotuMsg]);
    } catch (err: any) {
      const errorMsg = err?.message || "Chotu AI Assistant is currently unable to reach the server. Please check your network connection.";
      const chotuMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "chotu",
        text: `⚠️ ${errorMsg}`,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, chotuMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const samplePrompts = [
    "How much did we sell today?",
    "Which tables are currently occupied?",
    "Which ingredients are running low?",
    "What are our best-selling items?",
    "Summarise today's restaurant performance",
    "Table 4 ka bill kitna hai?",
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        category="Conversational Intelligence"
        title="Chotu Voice AI Assistant"
        subtitle="Natural language reasoning & operational assistant. Speaks English, Hindi and Hinglish for instant queries and action execution."
      />

      {/* Chat Container */}
      <div className="flex-1 rounded-2xl bg-[#181514] border border-stone-800 flex flex-col overflow-hidden shadow-2xl">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-stone-800">
          {messages.map((m) => {
            const isChotu = m.sender === "chotu";
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-2xl ${isChotu ? "" : "ml-auto flex-row-reverse"}`}
              >
                {isChotu ? (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E07A5F] to-[#F4A261] flex items-center justify-center text-stone-950 font-bold flex-shrink-0 shadow-md">
                    <Bot className="w-4 h-4 text-stone-950" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-stone-800 text-stone-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    U
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed space-y-1 ${
                    isChotu
                      ? "bg-stone-900 border border-stone-800 text-stone-200"
                      : "bg-[#E07A5F] text-stone-950 font-medium"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="text-[10px] opacity-60 font-mono">{m.timestamp}</span>
                    {m.actionTaken && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                        Action Executed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 max-w-md">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#E07A5F] to-[#F4A261] flex items-center justify-center text-stone-950 font-bold flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 text-xs text-stone-400 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E07A5F]" />
                <span>Chotu is checking restaurant database...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-[#151211] border-t border-stone-800/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] text-stone-500 font-mono uppercase font-bold flex items-center gap-1 pl-2">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            Try:
          </span>
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1 rounded-lg bg-stone-900 border border-stone-800 hover:border-[#E07A5F]/50 text-stone-300 hover:text-white text-[11px] whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#171413] border-t border-stone-800 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask Chotu anything about sales, tables, stock or orders (e.g. 'Table 4 ka bill kya hai?')..."
            className="flex-1 px-4 py-3 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#E07A5F]"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="p-3 rounded-xl bg-gradient-to-r from-[#E07A5F] to-[#F4A261] text-stone-950 font-bold hover:opacity-95 disabled:opacity-50 transition-all"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
