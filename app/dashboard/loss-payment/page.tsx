"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";

export default function LossPaymentPage() {
  const { activeBranch } = useBranch();
  const branchLabel = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';

  const [leftMembers, setLeftMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const fetchLeftMembers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('branch', activeBranch)
        .eq('left_with_dues', true)
        .order('left_at', { ascending: false });

      if (error) throw error;
      if (data) setLeftMembers(data);
    } catch (err) {
      console.error("Error fetching left members:", err);
    } finally {
      setLoading(false);
    }
  }, [activeBranch]);

  useEffect(() => {
    fetchLeftMembers();
  }, [fetchLeftMembers]);

  // Filter list based on search term
  const filteredMembers = leftMembers.filter(m => {
    return (
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.permanent_id?.toLowerCase().includes(search.toLowerCase()) ||
      m.mobile.includes(search) ||
      m.left_reason?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalLoss = leftMembers.reduce((sum, m) => sum + (m.loss_amount || 0), 0);
  const totalCount = leftMembers.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="page-title text-red-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl font-black">money_off</span>
            Loss Payments Ledger
          </h1>
          <p className="page-subtitle">
            Track members who left without clearing outstanding library fees · {branchLabel}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-sm">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, phone..."
            className="input-premium !py-2.5 !pl-9 !pr-4 !text-sm !rounded-xl w-full"
          />
        </div>
      </div>

      {/* Stats overview blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-pane-elevated relative overflow-hidden flex items-center gap-5 p-6 border-l-4 border-red-500 group">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-[100%] blur-[40px] opacity-10 bg-red-500 group-hover:opacity-20 transition-opacity" />
          <div className="stat-icon bg-red-500/15 text-red-400 !w-12 !h-12 flex items-center justify-center rounded-xl border border-red-500/20 shadow-md">
            <span className="material-symbols-outlined text-2xl">error_med</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-0.5">Total Outstanding Loss</div>
            <h3 className="text-3xl font-black text-white drop-shadow-md">₹{totalLoss.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="glass-pane-elevated relative overflow-hidden flex items-center gap-5 p-6 border-l-4 border-amber-500 group">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-[100%] blur-[40px] opacity-10 bg-amber-500 group-hover:opacity-20 transition-opacity" />
          <div className="stat-icon bg-amber-500/15 text-amber-400 !w-12 !h-12 flex items-center justify-center rounded-xl border border-amber-500/20 shadow-md">
            <span className="material-symbols-outlined text-2xl">directions_run</span>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-0.5">Total Defaulters Left</div>
            <h3 className="text-3xl font-black text-white drop-shadow-md">{totalCount} members</h3>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-pane-elevated !p-0 overflow-hidden relative min-h-[350px]">
        {loading && (
          <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined animate-spin text-2xl text-red-400">progress_activity</span>
              <span className="text-sm font-medium text-on-surface-variant">Loading records...</span>
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-b border-white/[0.06] bg-red-500/[0.02]">
          <h3 className="text-sm font-bold text-white font-manrope">
            Double-click a member row to view full case details
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap table-premium">
            <thead>
              <tr className="border-b border-[#e2e8f0]">
                <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Member ID</th>
                <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Name & Father Name</th>
                <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Contact Number</th>
                <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Left Date</th>
                <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Lost Fee Amount</th>
                <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Left Reason / Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="material-symbols-outlined text-4xl text-emerald-400 mb-2">check_circle</span>
                      <div className="text-white font-bold text-base">All Clear!</div>
                      <div className="text-on-surface-variant text-xs mt-1">No loss payment records found in this branch.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    onDoubleClick={() => setSelectedMember(member)}
                    className="cursor-pointer hover:bg-red-500/[0.02] transition-colors group border-b border-[#f1f5f9] select-none"
                    title="Double-click to open full profile details"
                  >
                    <td className="px-6 py-4 font-semibold">
                      <span className="badge badge-danger !text-[10px] tracking-wider">{member.permanent_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 group-hover:text-red-400 transition-colors">{member.full_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">S/O: {member.father_name || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-semibold">{member.mobile}</td>
                    <td className="px-6 py-4 text-slate-600 font-bold">
                      {member.left_at ? new Date(member.left_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-red-500 font-black text-sm">₹{(member.loss_amount || 0).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs max-w-xs truncate font-medium">
                      {member.left_reason || 'No specific reason recorded.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ Detailed Member Case Modal (Double Click Overlay) ═══ */}
      {selectedMember && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4 dashboard-light-theme" 
          onClick={() => setSelectedMember(null)}
        >
          <div 
            className="glass-pane-elevated rounded-3xl w-full max-w-lg overflow-hidden animate-scale-in border border-red-500/20" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/[0.06] flex justify-between items-center bg-red-500/[0.03]">
              <h2 className="text-base font-black text-red-400 font-manrope flex items-center gap-2">
                <span className="material-symbols-outlined">account_box</span>
                Defaulter Details & Record
              </h2>
              <button 
                onClick={() => setSelectedMember(null)} 
                className="text-on-surface-variant hover:text-white p-1.5 rounded-lg hover:bg-white/[0.04] transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6">
              <div className="flex gap-4 items-center border-b border-white/[0.06] pb-4">
                <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-500 text-xl font-black">
                  {selectedMember.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedMember.full_name}</h3>
                  <span className="badge badge-danger text-[9px] mt-1 font-bold">{selectedMember.permanent_id}</span>
                </div>
              </div>

              {/* Information Cards Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <InfoItem icon="person" label="Father's Name" value={selectedMember.father_name || 'N/A'} />
                <InfoItem icon="phone" label="Mobile" value={selectedMember.mobile} />
                <InfoItem icon="location_on" label="Address" value={selectedMember.address || 'N/A'} />
                <InfoItem icon="schedule" label="Shift & Plan" value={`${selectedMember.shift} (₹${selectedMember.plan_amount}/mo)`} />
                <InfoItem icon="event" label="DOB & Gender" value={`${selectedMember.dob ? selectedMember.dob.split('T')[0] : 'N/A'} · ${selectedMember.gender || 'N/A'}`} />
                <InfoItem icon="money_off" label="Unpaid Loss Amount" value={`₹${(selectedMember.loss_amount || 0).toLocaleString('en-IN')}`} isDanger={true} />
                <InfoItem icon="today" label="Date Marked Left" value={selectedMember.left_at ? new Date(selectedMember.left_at).toLocaleDateString() : 'N/A'} />
                <InfoItem icon="description" label="Notes / Reason" value={selectedMember.left_reason || 'N/A'} className="col-span-2" />
              </div>
            </div>

            {/* Footer Close Action */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex justify-end bg-white/[0.02]">
              <button 
                onClick={() => setSelectedMember(null)}
                className="btn-primary !bg-red-500 hover:!bg-red-600 !text-white px-5 py-2 text-xs font-bold rounded-xl"
              >
                Close Case Record
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function InfoItem({ icon, label, value, isDanger, className }: { 
  icon: string; label: string; value: string; isDanger?: boolean; className?: string 
}) {
  return (
    <div className={`bg-white/[0.03] p-3 rounded-xl border border-white/[0.05] ${className || ""}`}>
      <div className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-on-surface-variant tracking-wider mb-1">
        <span className="material-symbols-outlined text-[12px]">{icon}</span>
        {label}
      </div>
      <div className={`text-xs font-semibold ${isDanger ? 'text-red-400 font-bold' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
