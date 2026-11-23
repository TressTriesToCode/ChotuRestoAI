"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { StaffMember } from "@/types/restaurant";
import { 
  UserCheck, 
  Users, 
  Plus, 
  ShieldCheck, 
  Clock, 
  Phone, 
  Key, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const INITIAL_STAFF: StaffMember[] = [
  {
    id: "stf-01",
    name: "Rahul Sharma",
    username: "manager@spicejunction.in",
    role: "manager",
    phone: "+91 98200 12345",
    activeShift: true,
    shiftStartTime: "11:00",
    status: "active",
  },
  {
    id: "stf-02",
    name: "Deepak Nair",
    username: "cashier@spicejunction.in",
    role: "cashier",
    phone: "+91 98200 54321",
    activeShift: true,
    shiftStartTime: "12:30",
    status: "active",
  },
  {
    id: "stf-03",
    name: "Chef Vikram Rawat",
    username: "chef@spicejunction.in",
    role: "chef",
    phone: "+91 98333 11223",
    activeShift: true,
    shiftStartTime: "10:00",
    status: "active",
  },
  {
    id: "stf-04",
    name: "Ramesh Pawar",
    username: "ramesh.server@spicejunction.in",
    role: "waiter",
    phone: "+91 98199 44332",
    activeShift: true,
    shiftStartTime: "14:00",
    status: "active",
  },
  {
    id: "stf-05",
    name: "Suresh Patil",
    username: "suresh.server@spicejunction.in",
    role: "waiter",
    phone: "+91 98211 88990",
    activeShift: false,
    status: "off_duty",
  },
];

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    username: "",
    role: "waiter" as StaffMember["role"],
    phone: "",
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleShift = (staffId: string) => {
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === staffId) {
          const nextShift = !s.activeShift;
          const nextStatus = nextShift ? "active" : "off_duty";
          showToast(
            `${s.name} clocked ${nextShift ? "IN for active shift" : "OUT of shift"}`
          );
          return {
            ...s,
            activeShift: nextShift,
            status: nextStatus as any,
            shiftStartTime: nextShift ? new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : undefined,
          };
        }
        return s;
      })
    );
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.username) return;
    const added: StaffMember = {
      id: `stf-${Date.now().toString().slice(-4)}`,
      name: newStaff.name,
      username: newStaff.username,
      role: newStaff.role,
      phone: newStaff.phone || "+91 98000 00000",
      activeShift: true,
      shiftStartTime: "Just now",
      status: "active",
    };
    setStaffList([...staffList, added]);
    showToast(`Added ${newStaff.name} to restaurant staff directory`);
    setShowAddModal(false);
    setNewStaff({ name: "", username: "", role: "waiter", phone: "" });
  };

  const onDutyCount = staffList.filter((s) => s.activeShift).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        category="Workforce & Permissions"
        title="Staff Roster & Shift Control"
        subtitle="Manage restaurant staff, operational roles (Manager, Cashier, Chef, Server), clock-in shifts, and security privileges."
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E07A5F] hover:bg-[#d0694e] text-stone-950 font-bold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        }
      />

      {/* Staff Status Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#181514] border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-400">Total Enrolled Team</span>
            <p className="text-xl font-bold text-white mt-0.5">{staffList.length} Members</p>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-800 text-[#E07A5F]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#181514] border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-400">Currently On Duty</span>
            <p className="text-xl font-bold text-emerald-400 mt-0.5">{onDutyCount} Active</p>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-800 text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#181514] border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-400">Security & RBAC</span>
            <p className="text-xl font-bold text-amber-400 mt-0.5">Enforced (JWT)</p>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-800 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl bg-[#181514] border border-stone-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#151211] border-b border-stone-800 text-stone-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Staff Member</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Contact Phone</th>
                <th className="px-4 py-3.5">Shift Status</th>
                <th className="px-4 py-3.5">Shift Started</th>
                <th className="px-4 py-3.5 text-right">Shift Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-stone-900/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-800 text-stone-200 flex items-center justify-center font-bold text-xs">
                        {staff.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">{staff.name}</p>
                        <p className="text-[11px] text-stone-400 font-mono">{staff.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="px-2.5 py-0.5 rounded-full capitalize text-[10px] font-bold font-mono bg-stone-900 border border-stone-700 text-[#F4A261]">
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-stone-300 text-[11px]">
                    {staff.phone}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
                        staff.activeShift
                          ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
                          : "bg-stone-900 text-stone-500 border-stone-800"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${staff.activeShift ? "bg-emerald-400" : "bg-stone-600"}`} />
                      <span>{staff.activeShift ? "On Duty" : "Off Duty"}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-stone-400 text-[11px]">
                    {staff.shiftStartTime ? `${staff.shiftStartTime} IST` : "—"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => toggleShift(staff.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        staff.activeShift
                          ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {staff.activeShift ? "Clock Out" : "Clock In"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Team Member"
        description="Add staff profile and assign role"
        maxWidth="sm"
      >
        <form onSubmit={handleAddStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={newStaff.name}
              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              placeholder="e.g. Ramesh Pawar"
              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">Login Email / Handle *</label>
            <input
              type="email"
              required
              value={newStaff.username}
              onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
              placeholder="ramesh@spicejunction.in"
              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Role</label>
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs"
              >
                <option value="waiter">Server / Captain</option>
                <option value="chef">Kitchen Chef</option>
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                placeholder="+91 98200 12345"
                className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-white text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#E07A5F] text-stone-950 font-bold text-xs"
            >
              Enroll Staff Member
            </button>
          </div>
        </form>
      </Modal>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-stone-900 border border-emerald-500/40 text-emerald-300 text-xs shadow-2xl backdrop-blur-md">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
