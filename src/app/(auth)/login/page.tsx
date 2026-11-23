"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flame, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState<string>("manager@spicejunction.in");
  const [password, setPassword] = useState<string>("Chotu@123");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await login(email, password);
    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.error || "Login failed. Please check your credentials.");
    }
  };

  const setDemoCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("Chotu@123");
  };

  return (
    <div className="min-h-screen bg-[#110E0D] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#E07A5F]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#F4A261]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#E07A5F] to-[#F4A261] shadow-xl shadow-[#E07A5F]/20 mb-4">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Chotu Restro AI</h1>
          <p className="text-xs text-stone-400 mt-1 font-mono uppercase tracking-wider">
            Restaurant Management Console • The Spice Junction
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#181514] border border-stone-800 rounded-3xl p-8 shadow-2xl shadow-black/80 backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Staff Sign In</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Enter your authorized staff credentials to access operational terminals
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">Staff Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@spicejunction.in"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900/90 border border-stone-700/80 text-white text-xs placeholder:text-stone-500 focus:outline-none focus:border-[#E07A5F] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900/90 border border-stone-700/80 text-white text-xs placeholder:text-stone-500 focus:outline-none focus:border-[#E07A5F] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#E07A5F] to-[#F4A261] text-stone-950 font-bold text-xs shadow-lg shadow-[#E07A5F]/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? "Authenticating..." : "Sign In to Terminal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Roles */}
          <div className="mt-6 pt-5 border-t border-stone-800/80">
            <span className="text-[10px] uppercase font-mono font-bold text-stone-500 tracking-wider block mb-2">
              Quick Demo Accounts
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials("manager@spicejunction.in")}
                className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:border-[#E07A5F]/50 text-stone-300 hover:text-white text-[11px] font-medium transition-colors"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("cashier@spicejunction.in")}
                className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:border-[#E07A5F]/50 text-stone-300 hover:text-white text-[11px] font-medium transition-colors"
              >
                Cashier
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("chef@spicejunction.in")}
                className="px-2.5 py-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:border-[#E07A5F]/50 text-stone-300 hover:text-white text-[11px] font-medium transition-colors"
              >
                Kitchen Chef
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link to Landing Page */}
        <div className="mt-6 text-center">
          <Link
            href="/landing"
            className="text-xs text-stone-500 hover:text-stone-300 transition-colors inline-flex items-center gap-1.5"
          >
            <span>Back to Public Product Showcase</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
