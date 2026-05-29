"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useBranch } from "@/components/branch-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from 'next/navigation';

export default function MembersPage() {
  const { activeBranch } = useBranch();
  const branchName = activeBranch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
  
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'seat-asc' | 'seat-desc'>('newest');
  const router = useRouter();

  // Renewal dynamic pricing states
  const [isRenewingInline, setIsRenewingInline] = useState(false);
  const [renewPrice, setRenewPrice] = useState(1000);
  const [renewDiscount, setRenewDiscount] = useState(0);
  const [renewPaymentMode, setRenewPaymentMode] = useState("Cash");

  // Display style toggler (tiles vs list)
  const [viewMode, setViewMode] = useState<'tiles' | 'list'>('tiles');

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('branch', activeBranch)
      .order('created_at', { ascending: false });
    
    if (data) setMembers(data);
    setLoading(false);
  }, [activeBranch]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Reset renewal states when selectedMember changes
  useEffect(() => {
    if (selectedMember) {
      setRenewPrice(selectedMember.plan_amount || (selectedMember.shift === 'Full Day' ? 1000 : 600));
      setRenewDiscount(0);
      setRenewPaymentMode("Cash");
      setIsRenewingInline(false);
    }
  }, [selectedMember]);

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.full_name.toLowerCase().includes(search.toLowerCase()) || 
      m.permanent_id.toLowerCase().includes(search.toLowerCase()) ||
      m.mobile.includes(search);
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && m.is_active) || 
      (filterStatus === 'inactive' && !m.is_active);
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    if (sortBy === 'name-asc') return a.full_name.localeCompare(b.full_name);
    if (sortBy === 'name-desc') return b.full_name.localeCompare(a.full_name);
    if (sortBy === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    if (sortBy === 'seat-asc' || sortBy === 'seat-desc') {
      const rawA = a.seat_no;
      const rawB = b.seat_no;
      
      // Unassigned/null seats always go to the bottom
      if (!rawA && !rawB) return 0;
      if (!rawA) return 1;
      if (!rawB) return -1;

      // Extract numeric prefix/digits
      const seatA = parseInt(rawA.replace(/\D/g, ''), 10);
      const seatB = parseInt(rawB.replace(/\D/g, ''), 10);
      
      const isNumA = !isNaN(seatA);
      const isNumB = !isNaN(seatB);
      
      if (!isNumA && !isNumB) {
        return sortBy === 'seat-asc' ? rawA.localeCompare(rawB) : rawB.localeCompare(rawA);
      }
      if (!isNumA) return 1;
      if (!isNumB) return -1;
      
      if (seatA !== seatB) {
        return sortBy === 'seat-asc' ? seatA - seatB : seatB - seatA;
      }
      
      // Secondary alphabetical tie-breaker (e.g. "12A" vs "12B")
      return sortBy === 'seat-asc' ? rawA.localeCompare(rawB) : rawB.localeCompare(rawA);
    }
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(); // newest
  });

  const activeCount = members.filter(m => m.is_active).length;
  const inactiveCount = members.filter(m => !m.is_active).length;

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this member? This cannot be undone.")) return;
    setIsActionLoading(true);
    await supabase.from('members').delete().eq('id', id);
    setMembers(prev => prev.filter(m => m.id !== id));
    setSelectedMember(null);
    setIsActionLoading(false);
  };

  const handleRenew = async (member: any) => {
    setIsActionLoading(true);
    const finalRenewPrice = Math.max(0, renewPrice - renewDiscount);
    const currentEnd = new Date(member.subscription_end_date);
    const newEnd = currentEnd < new Date() ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    await supabase.from('members').update({ 
      subscription_end_date: newEnd.toISOString(),
      plan_amount: finalRenewPrice,
      is_active: true
    }).eq('id', member.id);

    await supabase.from('payments').insert([{
      member_id: member.id,
      amount: finalRenewPrice,
      branch: member.branch,
      payment_mode: renewPaymentMode,
      notes: renewDiscount > 0 ? `Renewal Discount: ₹${renewDiscount}. Base Price: ₹${renewPrice}` : 'Subscription Renewal'
    }]);

    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, subscription_end_date: newEnd.toISOString(), plan_amount: finalRenewPrice, is_active: true } : m));
    setSelectedMember({ ...member, subscription_end_date: newEnd.toISOString(), plan_amount: finalRenewPrice, is_active: true });
    setIsRenewingInline(false);
    setIsActionLoading(false);
    
    window.open(`/invoice?id=${member.id}`, '_blank');

    const mobile = member.mobile.replace(/[^0-9]/g, '');
    let welcomeTemplate = "Dear {name},\n\nWelcome to Krishna Library! Your admission is confirmed.\nBranch: {branch}\nSeat No: {seat}\nShift: {shift}\nValid Till: {expiry}\n\nHappy Learning!\nKrishna Library";
    
    if (typeof window !== 'undefined') {
      const savedWelcome = localStorage.getItem("krishna_welcome_msg");
      if (savedWelcome) welcomeTemplate = savedWelcome;
    }
    
    const branchLabel = member.branch === 'namnakala' ? 'Namnakala' : 'Bengali Chowk';
    const msg = welcomeTemplate
      .replace(/{name}/g, member.full_name)
      .replace(/{branch}/g, branchLabel)
      .replace(/{seat}/g, member.seat_no || 'Unassigned')
      .replace(/{shift}/g, member.shift)
      .replace(/{expiry}/g, newEnd.toLocaleDateString());

    window.open(`https://wa.me/${mobile}?text=${encodeURIComponent(msg)}`, '_blank');
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Directory</h1>
          <p className="page-subtitle">
            {members.length} total members · {branchName} Branch
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56 md:flex-none">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-sm">search</span>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, ID, phone..." 
              className="input-premium !py-2.5 !pl-9 !pr-4 !text-sm !rounded-xl w-full"
            />
          </div>
          <button className="btn-ghost px-4 py-2.5 text-sm flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-base">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Filter Tabs & Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.04] pb-4">
        <div className="flex gap-2">
          {[
            { key: 'all' as const, label: `All (${members.length})` },
            { key: 'active' as const, label: `Active (${activeCount})` },
            { key: 'inactive' as const, label: `Inactive (${inactiveCount})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === tab.key
                  ? 'bg-primary/15 text-primary border border-primary/20 shadow-sm'
                  : 'bg-white/[0.03] text-on-surface-variant border border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-white/[0.02] p-1 rounded-xl border border-white/[0.04] gap-1">
            <button
              onClick={() => setViewMode('tiles')}
              className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'tiles' 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-bold' 
                  : 'text-on-surface-variant/60 hover:text-on-surface-variant'
              }`}
              title="Tiles View"
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                viewMode === 'list' 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-bold' 
                  : 'text-on-surface-variant/60 hover:text-on-surface-variant'
              }`}
              title="List View"
            >
              <span className="material-symbols-outlined text-base">list</span>
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 bg-white/[0.02] p-1.5 rounded-xl border border-white/[0.04]">
            <span className="material-symbols-outlined text-on-surface-variant text-sm pl-2">sort</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none pr-7 pl-1 cursor-pointer appearance-none [&>option]:bg-white [&>option]:text-slate-800 bg-[url('data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%23475569%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e')] bg-[position:right_0.25rem_center] bg-no-repeat bg-[size:1rem_1rem]"
            >
              <option value="newest">Newest Members</option>
              <option value="oldest">Oldest Members</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="seat-asc">Seat (Low to High)</option>
              <option value="seat-desc">Seat (High to Low)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Responsive Card Grid */}
      <div className="relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined animate-spin text-2xl text-primary">progress_activity</span>
              <span className="text-sm font-medium text-on-surface-variant">Loading directory...</span>
            </div>
          </div>
        )}

        {filteredMembers.length === 0 && !loading ? (
          <div className="glass-pane-elevated flex flex-col items-center justify-center py-16">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-3">search_off</span>
            <div className="text-white font-bold text-lg mb-1">No Results</div>
            <div className="text-on-surface-variant text-sm">No members match your search criteria.</div>
          </div>
        ) : viewMode === 'tiles' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMembers.map((member) => (
              <div key={member.id} onClick={() => setSelectedMember(member)} className="glass-pane-elevated !p-5 cursor-pointer group hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#003178] font-black text-lg shadow-[inset_0_2px_4px_rgba(0,49,120,0.1)]">
                      {member.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm tracking-wide group-hover:text-primary transition-colors">{member.full_name}</div>
                      <span className="badge badge-info text-[9px] mt-1 tracking-widest">{member.permanent_id}</span>
                    </div>
                  </div>
                  <span className={`badge ${member.is_active ? 'badge-success' : 'badge-danger'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${member.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="bg-white/[0.03] p-3 rounded-xl border border-white/[0.05]">
                    <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant uppercase tracking-widest mb-1 font-bold">
                      <span className="material-symbols-outlined text-[14px]">event_seat</span>
                      Seat
                    </div>
                    <div className="font-black text-white text-sm">{member.seat_no || '—'}</div>
                  </div>
                  <div className="bg-white/[0.03] p-3 rounded-xl border border-white/[0.05]">
                    <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant uppercase tracking-widest mb-1 font-bold">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      Shift
                    </div>
                    <div className="font-black text-white text-sm truncate">{member.shift}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <div className="text-on-surface-variant text-xs font-medium">{member.mobile}</div>
                  <a href={`https://wa.me/${member.mobile.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all text-sm border border-emerald-500/20">
                    <span className="material-symbols-outlined text-sm">chat</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-pane-elevated !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap table-premium">
                <thead>
                  <tr className="border-b border-[#e2e8f0]">
                    <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">ID</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Name & Contact</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Seat & Shift</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Status</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500">Validity</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} onClick={() => setSelectedMember(member)} className="cursor-pointer hover:bg-slate-50 transition-colors group animate-fade-in-fast">
                      <td className="px-6 py-4 border-b border-[#f1f5f9]">
                        <span className="badge badge-info">{member.permanent_id}</span>
                      </td>
                      <td className="px-6 py-4 border-b border-[#f1f5f9]">
                        <div className="font-bold text-slate-800">{member.full_name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{member.mobile}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-[#f1f5f9]">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-md bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                            {member.seat_no || '—'}
                          </span>
                          <span className="text-slate-600 text-xs font-semibold">{member.shift}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-[#f1f5f9]">
                        <span className={`badge ${member.is_active ? 'badge-success' : 'badge-danger'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${member.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-[#f1f5f9]">
                        <div className="text-xs font-bold text-[#003178]">
                          {new Date(member.subscription_end_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-b border-[#f1f5f9] text-right">
                        <a 
                          href={`https://wa.me/${member.mobile.replace(/[^0-9]/g, '')}`} 
                          target="_blank" rel="noreferrer" 
                          onClick={(e) => e.stopPropagation()} 
                          className="inline-flex w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 items-center justify-center hover:bg-emerald-500 hover:text-white transition-all text-sm border border-emerald-500/20"
                        >
                          <span className="material-symbols-outlined text-sm">chat</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Member Profile Modal ═══ */}
      {selectedMember && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4 dashboard-light-theme" onClick={() => setSelectedMember(null)}>
          <div className="glass-pane-elevated rounded-3xl w-full max-w-2xl overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-lg font-bold text-white font-manrope">Member Profile</h2>
              <button onClick={() => setSelectedMember(null)} className="text-on-surface-variant hover:text-white p-1.5 rounded-lg hover:bg-white/[0.04] transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="flex gap-5 items-start mb-6 pb-6 border-b border-white/[0.06]">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#003178] text-2xl font-bold shrink-0">
                  {selectedMember.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedMember.full_name}</h3>
                      <p className="text-primary font-semibold text-sm mt-0.5">{selectedMember.permanent_id}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`badge ${selectedMember.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {selectedMember.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        Valid till: {new Date(selectedMember.subscription_end_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <InfoField label="Father's Name" value={selectedMember.father_name || 'N/A'} />
                    <InfoField label="Mobile" value={selectedMember.mobile} />
                    <InfoField label="DOB / Gender" value={`${selectedMember.dob ? selectedMember.dob.split('T')[0] : 'N/A'} / ${selectedMember.gender || 'N/A'}`} />
                    <InfoField label="Address" value={selectedMember.address || 'N/A'} />
                  </div>
                </div>
              </div>

              {/* Transaction Ledger */}
              <h4 className="text-xs font-bold text-on-surface-variant mb-3 uppercase tracking-widest">Last Payment</h4>
              <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.03] text-on-surface-variant text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Amount</th>
                      <th className="px-4 py-2.5">Plan</th>
                      <th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    <tr>
                      <td className="px-4 py-3 border-t border-white/[0.04]">{selectedMember.created_at.split('T')[0]}</td>
                      <td className="px-4 py-3 border-t border-white/[0.04] font-bold">₹{selectedMember.plan_amount}</td>
                      <td className="px-4 py-3 border-t border-white/[0.04]">{selectedMember.shift}</td>
                      <td className="px-4 py-3 border-t border-white/[0.04]"><span className="badge badge-success">Paid</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Dynamic Renewal Options Expandable Card */}
              {isRenewingInline && (
                <div className="mt-5 p-5 rounded-2xl bg-white/[0.02] border border-[#fdac29]/20 space-y-4 animate-fade-in-fast">
                  <div className="flex items-center gap-2 text-[#fdac29] text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-base">payments</span>
                    Renewal Payment Customization
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">Base Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={renewPrice}
                        onChange={(e) => setRenewPrice(Math.max(0, Number(e.target.value)))}
                        className="input-premium !py-2 !text-sm w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">Discount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={renewDiscount}
                        onChange={(e) => setRenewDiscount(Math.max(0, Number(e.target.value)))}
                        className="input-premium !py-2 !text-sm w-full"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 block">Payment Mode</label>
                      <select
                        value={renewPaymentMode}
                        onChange={(e) => setRenewPaymentMode(e.target.value)}
                        className="input-premium !py-2 !text-sm w-full appearance-none [&>option]:bg-white [&>option]:text-slate-800"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl text-xs">
                    <span className="text-on-surface-variant">Calculation: ₹{renewPrice} - ₹{renewDiscount}</span>
                    <span className="font-bold text-emerald-400">Final Price: ₹{Math.max(0, renewPrice - renewDiscount)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-white/[0.06] flex flex-wrap gap-3 bg-white/[0.02]">
              {!isRenewingInline ? (
                <>
                  <button disabled={isActionLoading} onClick={() => handleDelete(selectedMember.id)} className="btn-danger px-4 py-2.5 disabled:opacity-50 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">delete</span>
                    Delete
                  </button>
                  <button disabled={isActionLoading} onClick={() => router.push('/dashboard/admission')} className="btn-ghost px-4 py-2.5 flex-1 disabled:opacity-50">
                    Update Details
                  </button>
                  <button disabled={isActionLoading} onClick={() => setIsRenewingInline(true)} className="btn-primary px-4 py-2.5 flex-1 flex justify-center items-center gap-2 disabled:opacity-50">
                    Renew Subscription
                  </button>
                </>
              ) : (
                <>
                  <button disabled={isActionLoading} onClick={() => setIsRenewingInline(false)} className="btn-ghost px-4 py-2.5 disabled:opacity-50">
                    Cancel
                  </button>
                  <button disabled={isActionLoading} onClick={() => handleRenew(selectedMember)} className="btn-primary px-4 py-2.5 flex-1 flex justify-center items-center gap-2 disabled:opacity-50">
                    {isActionLoading ? <span className="material-symbols-outlined animate-spin text-base">progress_activity</span> : null}
                    Confirm Renewal & Print
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-0.5">{label}</div>
      <div className="text-white text-sm truncate">{value}</div>
    </div>
  );
}
