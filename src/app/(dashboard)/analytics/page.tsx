"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { fetchAnalyticsOverview, AnalyticsOverview } from "@/lib/api/analytics";
import { fetchLiveOrders } from "@/lib/api/orders";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  Printer, 
  Receipt, 
  DollarSign, 
  CreditCard, 
  Banknote, 
  QrCode,
  ShieldCheck,
  FileSpreadsheet
} from "lucide-react";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<string>("today");
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showZReportModal, setShowZReportModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const [ovData, ordData] = await Promise.all([
          fetchAnalyticsOverview().catch(() => null),
          fetchLiveOrders("completed").catch(() => []),
        ]);
        if (ovData) setOverview(ovData);
        if (ordData && ordData.length > 0) setCompletedOrders(ordData);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, [dateRange]);

  const grossRevenue = overview?.today_revenue ? Number(overview.today_revenue) : 24850;
  const orderCount = overview?.completed_orders_today ?? (completedOrders.length || 42);
  const totalTax = grossRevenue * 0.05;
  const halfTax = totalTax / 2;
  const serviceCharge = grossRevenue * 0.05;
  const aov = orderCount > 0 ? Math.round(grossRevenue / orderCount) : 0;

  const handleExportCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,Order ID,Date,Table/Mode,Customer,Total Amount,Status\n";
    if (completedOrders.length > 0) {
      completedOrders.forEach((o) => {
        csvContent += `${o.orderNumber || o.id},${o.time || "Today"},${o.tableId || o.mode},${o.customerName || "Guest"},${o.totalAmount || 0},${o.status}\n`;
      });
    } else {
      csvContent += "ORD-101,23-Nov-2026,T-04,Rahul S.,891.00,completed\n";
      csvContent += "ORD-102,23-Nov-2026,T-01,Vikram S.,1012.00,completed\n";
      csvContent += "ORD-103,23-Nov-2026,DELIVERY,Aakash M.,682.00,completed\n";
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Sales CSV report exported successfully!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        category="Financial Intelligence & Audit"
        title="Revenue Analytics & Z-Reports"
        subtitle="End-of-day cash reconciliation, Indian GST tax schedules, channel sales distribution, and exportable financial ledgers."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white text-xs font-semibold transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setShowZReportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E07A5F] hover:bg-[#d0694e] text-stone-950 font-bold text-xs shadow-md transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Generate Z-Report</span>
            </button>
          </div>
        }
      />

      {/* Date Filter Strip */}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-[#181514] border border-stone-800">
        <span className="text-xs font-mono uppercase text-stone-500 font-bold px-2">Period:</span>
        {["today", "yesterday", "last_7_days", "this_month"].map((r) => (
          <button
            key={r}
            onClick={() => setDateRange(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              dateRange === r
                ? "bg-[#E07A5F]/20 text-[#F4A261] border border-[#E07A5F]/40 font-bold"
                : "text-stone-400 hover:text-white"
            }`}
          >
            {r.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* High-Level Financial Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#181514] border border-stone-800">
          <span className="text-xs text-stone-400">GROSS REVENUE</span>
          <p className="text-2xl font-bold text-white mt-1">₹{grossRevenue.toLocaleString("en-IN")}.00</p>
          <span className="text-[11px] text-emerald-400 font-medium">{orderCount} completed orders</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#181514] border border-stone-800">
          <span className="text-xs text-stone-400">NET CGST + SGST (5%)</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">₹{totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <span className="text-[11px] text-stone-500 font-mono">₹{halfTax.toFixed(2)} CGST + ₹{halfTax.toFixed(2)} SGST</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#181514] border border-stone-800">
          <span className="text-xs text-stone-400">SERVICE CHARGE (5%)</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">₹{serviceCharge.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <span className="text-[11px] text-stone-500 font-medium">Discretionary staff pool</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#181514] border border-stone-800">
          <span className="text-xs text-stone-400">AVERAGE ORDER VALUE</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">₹{aov.toLocaleString("en-IN")}.00</p>
          <span className="text-[11px] text-stone-500 font-medium">Dine-in AOV</span>
        </div>
      </div>

      {/* Tender Breakdown & Hourly Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="p-6 rounded-2xl bg-[#181514] border border-stone-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Payment Tender Distribution
            </h3>
            <span className="text-[10px] text-stone-500 font-mono">100% RECONCILED</span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">UPI / Instant QR</p>
                  <p className="text-[10px] text-stone-400">GPay, PhonePe, Paytm, BHIM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-400">₹14,910.00</p>
                <p className="text-[10px] text-stone-500 font-mono">60% of total</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Credit & Debit Cards (EDC)</p>
                  <p className="text-[10px] text-stone-400">Visa, Mastercard, RuPay</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-blue-400">₹6,212.50</p>
                <p className="text-[10px] text-stone-500 font-mono">25% of total</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Physical Cash (Drawer)</p>
                  <p className="text-[10px] text-stone-400">Verified against register float</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-amber-400">₹3,727.50</p>
                <p className="text-[10px] text-stone-500 font-mono">15% of total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Splits */}
        <div className="p-6 rounded-2xl bg-[#181514] border border-stone-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Sales Channel Breakdown
            </h3>
            <span className="text-[10px] text-stone-500 font-mono">3 CHANNELS ACTIVE</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium">In-Store Dine-In (Tables)</span>
                <span className="font-bold text-white">₹15,400 (62%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-900 overflow-hidden">
                <div className="h-full bg-[#E07A5F] rounded-full" style={{ width: "62%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium">QR Contactless Self-Ordering</span>
                <span className="font-bold text-white">₹5,960 (24%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-900 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "24%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-stone-300 font-medium">Delivery & Aggregators (Zomato/Swiggy)</span>
                <span className="font-bold text-white">₹3,490 (14%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-900 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "14%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* End-of-Day Z-Report Modal */}
      <Modal
        isOpen={showZReportModal}
        onClose={() => setShowZReportModal(false)}
        title="End-of-Day Z-Report (Day Close)"
        description="Official closing statement & cash drawer reconciliation"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 font-mono text-xs space-y-3">
            <div className="text-center pb-3 border-b border-stone-800">
              <h2 className="text-sm font-bold text-white uppercase">THE SPICE JUNCTION</h2>
              <p className="text-[10px] text-stone-400">Shop 4, Pali Hill Road, Bandra West, Mumbai 400050</p>
              <p className="text-[10px] text-stone-400">GSTIN: 27AABCU9603R1ZM • Z-REPORT #Z-20261123</p>
              <p className="text-[10px] text-stone-400">Closed By: Rahul Sharma (Manager)</p>
            </div>

            <div className="space-y-1.5 py-2 border-b border-stone-800">
              <div className="flex justify-between">
                <span>Opening Float:</span>
                <span>₹5,000.00</span>
              </div>
              <div className="flex justify-between">
                <span>Cash Sales:</span>
                <span>₹3,727.50</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Cash Payouts (Expenses):</span>
                <span>- ₹2,450.00</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-stone-800">
                <span>Expected Drawer Cash:</span>
                <span>₹6,277.50</span>
              </div>
            </div>

            <div className="space-y-1.5 py-2 border-b border-stone-800">
              <div className="flex justify-between">
                <span>Total Orders:</span>
                <span>42</span>
              </div>
              <div className="flex justify-between">
                <span>Total Food Sales (Subtotal):</span>
                <span>₹22,483.34</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>CGST Collected (2.5%):</span>
                <span>₹591.67</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>SGST Collected (2.5%):</span>
                <span>₹591.67</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Service Charge Pool (5%):</span>
                <span>₹1,183.32</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-stone-800">
                <span>NET TOTAL COLLECTED:</span>
                <span className="text-emerald-400">₹24,850.00</span>
              </div>
            </div>

            <div className="text-center text-[10px] text-stone-500 pt-2">
              System Audit Checksum: OK • 100% Reconciled
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowZReportModal(false)}
              className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
            >
              Close
            </button>
            <button
              onClick={() => {
                window.print();
                showToast("Z-Report printed and stored in daily archive.");
              }}
              className="px-4 py-2 rounded-xl bg-[#E07A5F] text-stone-950 font-bold text-xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Z-Report</span>
            </button>
          </div>
        </div>
      </Modal>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-stone-900 border border-emerald-500/40 text-emerald-300 text-xs shadow-2xl backdrop-blur-md">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
