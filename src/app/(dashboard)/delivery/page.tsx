"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { 
  Bike, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send
} from "lucide-react";

interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  platform: "direct" | "zomato" | "swiggy";
  itemsSummary: string;
  totalAmount: number;
  riderName?: string;
  riderPhone?: string;
  otp: string;
  status: "preparing" | "ready" | "dispatched" | "delivered";
  timePlaced: string;
}

const INITIAL_DELIVERY_ORDERS: DeliveryOrder[] = [
  {
    id: "del-01",
    orderNumber: "DEL-8401",
    customerName: "Aakash Mehta",
    customerPhone: "+91 98200 44321",
    deliveryAddress: "Flat 402, Sea Green Apts, Perry Cross Rd, Bandra West, Mumbai 400050",
    platform: "direct",
    itemsSummary: "1x Butter Chicken, 2x Garlic Naan, 1x Jeera Rice",
    totalAmount: 620,
    riderName: "Ramesh Pawar (Direct Fleet)",
    riderPhone: "+91 98199 11022",
    otp: "5492",
    status: "dispatched",
    timePlaced: "20:45",
  },
  {
    id: "del-02",
    orderNumber: "ZOM-9923",
    customerName: "Pooja Hegde",
    customerPhone: "+91 98333 77123",
    deliveryAddress: "B-12, Pali Hill Enclave, Bandra West, Mumbai 400050",
    platform: "zomato",
    itemsSummary: "1x Paneer Tikka Masala, 3x Tandoori Roti",
    totalAmount: 430,
    riderName: "Sanjay K. (Zomato Valet)",
    riderPhone: "+91 97000 88219",
    otp: "8812",
    status: "ready",
    timePlaced: "20:52",
  },
  {
    id: "del-03",
    orderNumber: "SWG-1104",
    customerName: "Karan Johar",
    customerPhone: "+91 98210 99441",
    deliveryAddress: "Penthouse 14, Carter Road, Bandra West, Mumbai 400050",
    platform: "swiggy",
    itemsSummary: "2x Dal Makhani, 4x Butter Naan, 1x Gulab Jamun (2 pcs)",
    totalAmount: 890,
    riderName: "Unassigned",
    otp: "3319",
    status: "preparing",
    timePlaced: "21:05",
  },
];

export default function DeliveryPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>(INITIAL_DELIVERY_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assignRiderModal, setAssignRiderModal] = useState<boolean>(false);
  const [riderInput, setRiderInput] = useState<{ name: string; phone: string }>({
    name: "Raju Shinde (Direct Fleet)",
    phone: "+91 98200 99112",
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const updateStatus = (orderId: string, nextStatus: DeliveryOrder["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
    showToast(`Order #${orderId} marked as ${nextStatus.toUpperCase()}`);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: nextStatus });
    }
  };

  const handleAssignRider = () => {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              riderName: riderInput.name,
              riderPhone: riderInput.phone,
              status: "dispatched",
            }
          : o
      )
    );
    showToast(`Rider ${riderInput.name} assigned & dispatched!`);
    setAssignRiderModal(false);
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        category="Logistics & Dispatch"
        title="Delivery & Aggregator Operations"
        subtitle="Manage in-house fleet and third-party deliveries (Zomato / Swiggy), track rider arrival and verify delivery OTPs."
      />

      {/* Aggregator Status Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#181514] border border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center font-bold text-red-400">
              Z
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Zomato Gateway</h3>
              <p className="text-[10px] text-emerald-400 font-mono">ONLINE • Auto-Accept ON</p>
            </div>
          </div>
          <span className="text-xs font-bold text-stone-200">1 Active</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#181514] border border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center font-bold text-orange-400">
              S
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Swiggy Gateway</h3>
              <p className="text-[10px] text-emerald-400 font-mono">ONLINE • Auto-Accept ON</p>
            </div>
          </div>
          <span className="text-xs font-bold text-stone-200">1 Active</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#181514] border border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E07A5F]/10 border border-[#E07A5F]/30 flex items-center justify-center font-bold text-[#E07A5F]">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Direct Fleet (0% Comm.)</h3>
              <p className="text-[10px] text-emerald-400 font-mono">2 Riders on road</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400">₹620 saved</span>
        </div>
      </div>

      {/* Orders Filter Tabs */}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-[#181514] border border-stone-800">
        {["all", "preparing", "ready", "dispatched", "delivered"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              statusFilter === st
                ? "bg-[#E07A5F]/20 text-[#F4A261] border border-[#E07A5F]/40 font-bold"
                : "text-stone-400 hover:text-white"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Delivery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrders.map((ord) => {
          const isDirect = ord.platform === "direct";
          return (
            <div
              key={ord.id}
              className="p-5 rounded-2xl bg-[#181514] border border-stone-800 flex flex-col justify-between hover:border-stone-700 transition-all shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{ord.orderNumber}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        isDirect
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-500/30"
                          : ord.platform === "zomato"
                          ? "bg-red-950 text-red-300 border border-red-500/30"
                          : "bg-orange-950 text-orange-300 border border-orange-500/30"
                      }`}
                    >
                      {ord.platform}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase font-mono border ${
                      ord.status === "dispatched"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                        : ord.status === "ready"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : ord.status === "delivered"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-stone-800 text-stone-400 border-stone-700"
                    }`}
                  >
                    {ord.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-300 font-semibold">{ord.customerName}</span>
                    <span className="text-stone-400 font-mono">{ord.customerPhone}</span>
                  </div>

                  <p className="text-[11px] text-stone-400 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-500 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{ord.deliveryAddress}</span>
                  </p>

                  <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800/80">
                    <span className="text-[10px] text-stone-500 font-mono uppercase block mb-1">
                      Ordered Items:
                    </span>
                    <p className="text-xs text-stone-200">{ord.itemsSummary}</p>
                    <div className="flex justify-between items-center mt-2 pt-1 border-t border-stone-800">
                      <span className="text-[11px] text-stone-400">Total:</span>
                      <span className="text-xs font-bold text-emerald-400">₹{ord.totalAmount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px]">
                      <span className="text-stone-500">Rider: </span>
                      <span className="text-stone-200 font-medium">{ord.riderName || "Not Assigned"}</span>
                    </div>
                    <div className="text-[11px] font-mono bg-stone-900 px-2 py-0.5 rounded border border-stone-800 text-[#F4A261]">
                      OTP: {ord.otp}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-stone-800">
                {ord.status === "preparing" && (
                  <button
                    onClick={() => updateStatus(ord.id, "ready")}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors"
                  >
                    Mark Ready for Pickup
                  </button>
                )}

                {ord.status === "ready" && (
                  <button
                    onClick={() => {
                      setSelectedOrder(ord);
                      setAssignRiderModal(true);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#E07A5F] hover:bg-[#d0694e] text-stone-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Bike className="w-3.5 h-3.5" />
                    <span>Assign Rider & Dispatch</span>
                  </button>
                )}

                {ord.status === "dispatched" && (
                  <button
                    onClick={() => updateStatus(ord.id, "delivered")}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify OTP & Mark Delivered</span>
                  </button>
                )}

                {ord.status === "delivered" && (
                  <div className="flex-1 py-1.5 text-center text-xs text-stone-500 font-medium">
                    ✓ Completed & Archived
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Rider Modal */}
      {selectedOrder && (
        <Modal
          isOpen={assignRiderModal}
          onClose={() => setAssignRiderModal(false)}
          title={`Dispatch Order: ${selectedOrder.orderNumber}`}
          description={`Assign delivery rider for ${selectedOrder.customerName}`}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">Rider Name</label>
              <input
                type="text"
                value={riderInput.name}
                onChange={(e) => setRiderInput({ ...riderInput, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">Rider Phone</label>
              <input
                type="text"
                value={riderInput.phone}
                onChange={(e) => setRiderInput({ ...riderInput, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs font-mono"
              />
            </div>

            <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-xs text-stone-400">
              Customer Verification OTP: <strong className="text-white">{selectedOrder.otp}</strong>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                onClick={() => setAssignRiderModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRider}
                className="px-4 py-2 rounded-xl bg-[#E07A5F] text-stone-950 font-bold text-xs"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-stone-900 border border-emerald-500/40 text-emerald-300 text-xs shadow-2xl backdrop-blur-md">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
